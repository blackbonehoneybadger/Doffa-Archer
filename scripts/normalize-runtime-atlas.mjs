import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0) {
    fail(result.stderr?.trim() || result.error?.message || `${command} failed`);
  }
  return result.stdout.trim();
}

const [inputArgument, outputArgument, ...options] = process.argv.slice(2);
if (!inputArgument || !outputArgument) {
  fail(
    "Usage: node scripts/normalize-runtime-atlas.mjs <input> <output> --rows=<count> --scale=<factor> [--columns=<count>] [--offset-y=<pixels>]",
  );
}

let columns = 4;
let rows = null;
let scale = null;
let offsetY = 0;
for (const option of options) {
  const columnsMatch = /^--columns=(\d+)$/.exec(option);
  if (columnsMatch) {
    columns = Number(columnsMatch[1]);
    continue;
  }
  const rowsMatch = /^--rows=(\d+)$/.exec(option);
  if (rowsMatch) {
    rows = Number(rowsMatch[1]);
    continue;
  }
  const scaleMatch = /^--scale=(\d+(?:\.\d+)?)$/.exec(option);
  if (scaleMatch) {
    scale = Number(scaleMatch[1]);
    continue;
  }
  const offsetYMatch = /^--offset-y=(-?\d+)$/.exec(option);
  if (offsetYMatch) {
    offsetY = Number(offsetYMatch[1]);
    continue;
  }
  fail(`Unsupported option: ${option}`);
}

if (!Number.isInteger(columns) || columns < 1 || columns > 16) {
  fail(`Column count must be an integer from 1 to 16; received ${columns}`);
}
if (!Number.isInteger(rows) || rows < 1 || rows > 16) {
  fail(`Row count must be an integer from 1 to 16; received ${rows}`);
}
if (!Number.isFinite(scale) || scale < 0.5 || scale > 1.5) {
  fail(`Scale must be from 0.5 to 1.5; received ${scale}`);
}
if (!Number.isInteger(offsetY) || offsetY < -64 || offsetY > 64) {
  fail(`Vertical offset must be an integer from -64 to 64; received ${offsetY}`);
}

const inputPath = resolve(inputArgument);
const outputPath = resolve(outputArgument);
if (!existsSync(inputPath)) {
  fail(`Input atlas does not exist: ${inputPath}`);
}

const [width, height] = run("identify", ["-format", "%w %h", inputPath])
  .split(/\s+/)
  .map(Number);
if (width % columns !== 0 || height % rows !== 0) {
  fail(`Atlas ${width}x${height} is not divisible by ${columns}x${rows}`);
}

const frameWidth = width / columns;
const frameHeight = height / rows;
const workingDirectory = mkdtempSync(`${tmpdir()}/doffa-normalize-atlas-`);
mkdirSync(dirname(outputPath), { recursive: true });

try {
  const frames = [];
  for (let index = 0; index < columns * rows; index += 1) {
    const sourceX = (index % columns) * frameWidth;
    const sourceY = Math.floor(index / columns) * frameHeight;
    const framePath = resolve(
      workingDirectory,
      `frame-${String(index).padStart(2, "0")}.png`,
    );
    const centeredPath = resolve(
      workingDirectory,
      `centered-${String(index).padStart(2, "0")}.png`,
    );
    run("convert", [
      inputPath,
      "-crop",
      `${frameWidth}x${frameHeight}+${sourceX}+${sourceY}`,
      "+repage",
      "-resize",
      `${Math.round(scale * 10000) / 100}%`,
      "-gravity",
      "center",
      "-background",
      "none",
      "-extent",
      `${frameWidth}x${frameHeight}`,
      centeredPath,
    ]);
    if (offsetY === 0) {
      copyFileSync(centeredPath, framePath);
    } else {
      run("convert", [
        "-size",
        `${frameWidth}x${frameHeight}`,
        "xc:none",
        centeredPath,
        "-geometry",
        `+0${offsetY >= 0 ? "+" : ""}${offsetY}`,
        "-composite",
        framePath,
      ]);
    }
    frames.push(framePath);
  }

  const assembledPath = resolve(workingDirectory, "assembled.png");
  run("montage", [
    ...frames,
    "-mode",
    "concatenate",
    "-tile",
    `${columns}x${rows}`,
    "-geometry",
    `${frameWidth}x${frameHeight}+0+0`,
    "-background",
    "none",
    assembledPath,
  ]);
  const normalizedPath = resolve(workingDirectory, "normalized.png");
  run("convert", [
    assembledPath,
    "-colors",
    "512",
    "-strip",
    "-define",
    "png:compression-level=9",
    `PNG32:${normalizedPath}`,
  ]);
  copyFileSync(normalizedPath, outputPath);

  const result = run("identify", ["-format", "%w %h %[channels]", outputPath]);
  if (result !== `${width} ${height} srgba`) {
    fail(`Normalized atlas validation failed: ${result}`);
  }
  process.stdout.write(`${outputPath} ${result}\n`);
} finally {
  rmSync(workingDirectory, { recursive: true, force: true });
}
