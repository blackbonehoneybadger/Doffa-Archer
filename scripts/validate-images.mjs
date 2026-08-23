import { inflateSync } from "node:zlib";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const IMAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png"]);
const CRC_TABLE = new Uint32Array(256);

for (let index = 0; index < CRC_TABLE.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  CRC_TABLE[index] = value >>> 0;
}

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChannels(colorType) {
  return new Map([
    [0, 1],
    [2, 3],
    [3, 1],
    [4, 2],
    [6, 4],
  ]).get(colorType);
}

function passSize(size, start, step) {
  return size <= start ? 0 : Math.ceil((size - start) / step);
}

function expectedPngBytes(width, height, bitDepth, colorType, interlace) {
  const channels = pngChannels(colorType);
  if (!channels) {
    throw new Error(`Unsupported PNG color type ${colorType}`);
  }

  const rowBytes = (rowWidth) => Math.ceil((rowWidth * channels * bitDepth) / 8);
  if (interlace === 0) {
    return height * (rowBytes(width) + 1);
  }
  if (interlace !== 1) {
    throw new Error(`Unsupported PNG interlace method ${interlace}`);
  }

  const adam7 = [
    [0, 0, 8, 8],
    [4, 0, 8, 8],
    [0, 4, 4, 8],
    [2, 0, 4, 4],
    [0, 2, 2, 4],
    [1, 0, 2, 2],
    [0, 1, 1, 2],
  ];
  return adam7.reduce((total, [startX, startY, stepX, stepY]) => {
    const passWidth = passSize(width, startX, stepX);
    const passHeight = passSize(height, startY, stepY);
    return total + (passWidth && passHeight ? passHeight * (rowBytes(passWidth) + 1) : 0);
  }, 0);
}

export function validatePngBuffer(buffer, label = "PNG") {
  if (!Buffer.isBuffer(buffer) || buffer.length < 33 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${label}: invalid PNG signature`);
  }

  let offset = 8;
  let ihdr = null;
  let sawEnd = false;
  const compressed = [];

  while (offset < buffer.length) {
    if (offset + 12 > buffer.length) {
      throw new Error(`${label}: truncated PNG chunk header`);
    }
    const length = buffer.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = typeStart + 4;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (chunkEnd > buffer.length) {
      throw new Error(`${label}: truncated PNG chunk payload`);
    }

    const typeBuffer = buffer.subarray(typeStart, dataStart);
    const type = typeBuffer.toString("ascii");
    const data = buffer.subarray(dataStart, dataEnd);
    const expectedCrc = buffer.readUInt32BE(dataEnd);
    const actualCrc = crc32(Buffer.concat([typeBuffer, data]));
    if (actualCrc !== expectedCrc) {
      throw new Error(`${label}: invalid CRC in ${type} chunk`);
    }

    if (type === "IHDR") {
      if (ihdr || length !== 13) {
        throw new Error(`${label}: invalid IHDR chunk`);
      }
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        compression: data[10],
        filter: data[11],
        interlace: data[12],
      };
      if (!ihdr.width || !ihdr.height || ihdr.compression !== 0 || ihdr.filter !== 0) {
        throw new Error(`${label}: invalid PNG image header`);
      }
    } else if (type === "IDAT") {
      compressed.push(data);
    } else if (type === "IEND") {
      if (length !== 0) {
        throw new Error(`${label}: invalid IEND chunk`);
      }
      sawEnd = true;
      offset = chunkEnd;
      break;
    }

    offset = chunkEnd;
  }

  if (!ihdr || compressed.length === 0 || !sawEnd || offset !== buffer.length) {
    throw new Error(`${label}: incomplete PNG structure`);
  }

  let pixels;
  try {
    pixels = inflateSync(Buffer.concat(compressed));
  } catch (error) {
    throw new Error(`${label}: PNG pixel stream cannot be inflated`, { cause: error });
  }
  const expectedBytes = expectedPngBytes(
    ihdr.width,
    ihdr.height,
    ihdr.bitDepth,
    ihdr.colorType,
    ihdr.interlace,
  );
  if (pixels.length !== expectedBytes) {
    throw new Error(`${label}: PNG pixel stream has ${pixels.length} bytes; expected ${expectedBytes}`);
  }
  return { format: "png", width: ihdr.width, height: ihdr.height };
}

export function validateJpegBuffer(buffer, label = "JPEG") {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error(`${label}: invalid JPEG start marker`);
  }
  if (buffer.at(-2) !== 0xff || buffer.at(-1) !== 0xd9) {
    throw new Error(`${label}: missing JPEG end marker`);
  }

  let offset = 2;
  let dimensions = null;
  let sawScan = false;
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

  while (offset < buffer.length - 2) {
    if (buffer[offset] !== 0xff) {
      throw new Error(`${label}: invalid JPEG marker boundary`);
    }
    while (buffer[offset] === 0xff) {
      offset += 1;
    }
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd9) {
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    if (offset + 2 > buffer.length) {
      throw new Error(`${label}: truncated JPEG segment`);
    }
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) {
      throw new Error(`${label}: invalid JPEG segment length`);
    }
    if (frameMarkers.has(marker)) {
      if (length < 8) {
        throw new Error(`${label}: invalid JPEG frame header`);
      }
      dimensions = {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }
    if (marker === 0xda) {
      sawScan = true;
      break;
    }
    offset += length;
  }

  if (!dimensions?.width || !dimensions?.height || !sawScan) {
    throw new Error(`${label}: incomplete JPEG structure`);
  }
  return { format: "jpeg", ...dimensions };
}

export function validateImageFile(file) {
  const extension = extname(file).toLowerCase();
  const buffer = readFileSync(file);
  if (extension === ".png") {
    return validatePngBuffer(buffer, file);
  }
  if (extension === ".jpg" || extension === ".jpeg") {
    return validateJpegBuffer(buffer, file);
  }
  throw new Error(`${file}: unsupported image extension`);
}

export function collectImageFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectImageFiles(fullPath));
    } else if (IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

export function validateImageDirectory(directory) {
  const files = collectImageFiles(directory);
  const failures = [];
  for (const file of files) {
    try {
      validateImageFile(file);
    } catch (error) {
      failures.push(error.message);
    }
  }
  return { files, failures };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const assetsRoot = resolve(process.cwd(), process.argv[2] ?? "assets");
  const result = validateImageDirectory(assetsRoot);
  if (result.failures.length > 0) {
    console.error("Image validation failed:");
    for (const failure of result.failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`Image validation passed (${result.files.length} PNG/JPEG files).`);
  }
}
