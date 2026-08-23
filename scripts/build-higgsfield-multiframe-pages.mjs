import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import {
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";

import { validateImageFile } from "./validate-images.mjs";

export const HIGGSFIELD_MULTIFRAME_MANIFEST_VERSION = 1;
export const HIGGSFIELD_RUNTIME_FRAME = Object.freeze({
  width: 288,
  height: 336,
});
export const HIGGSFIELD_RUNTIME_DIRECTIONS = Object.freeze([
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
  "north",
  "north-east",
]);
export const HIGGSFIELD_CLIP_SPECS = Object.freeze({
  idle: Object.freeze({ frameCount: 4, fps: 4, loop: true }),
  move: Object.freeze({ frameCount: 6, fps: 10, loop: true }),
  attack: Object.freeze({
    frameCount: 6,
    fps: 15,
    loop: false,
    lockDirection: true,
  }),
});
export const HIGGSFIELD_PAGE_SPECS = Object.freeze({
  a: Object.freeze({ directions: HIGGSFIELD_RUNTIME_DIRECTIONS.slice(0, 4) }),
  b: Object.freeze({ directions: HIGGSFIELD_RUNTIME_DIRECTIONS.slice(4) }),
});

const EXPECTED_SOURCE_FRAME_COUNT = HIGGSFIELD_RUNTIME_DIRECTIONS.length
  * Object.values(HIGGSFIELD_CLIP_SPECS)
    .reduce((total, clip) => total + clip.frameCount, 0);
const SAFE_ENEMY_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_RELATIVE_PNG = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[a-zA-Z0-9._/-]+\.png$/;
const SAFE_KEY_COLOR = /^#[0-9a-fA-F]{6}$/;
const QUALITY_TIERS = new Set(["high", "max", "4k"]);
const REJECTED_MODELS = new Set(["nano_banana_2_lite"]);
const CLIP_ORDER = Object.freeze(Object.keys(HIGGSFIELD_CLIP_SPECS));
const PAGE_ORDER = Object.freeze(Object.keys(HIGGSFIELD_PAGE_SPECS));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  if (result.error || result.status !== 0) {
    const diagnostic = result.stderr?.trim()
      || result.stdout?.trim()
      || result.error?.message
      || `${command} failed`;
    throw new Error(diagnostic);
  }
  return result.stdout.trim();
}

function runWithDiagnostics(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      result.stderr?.trim()
        || result.stdout?.trim()
        || result.error?.message
        || `${command} failed`,
    );
  }
  return `${result.stdout}\n${result.stderr}`;
}

function frameKey(clip, direction, frame) {
  return `${clip}:${direction}:${frame}`;
}

function sameArray(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === "object"
    && !Array.isArray(value);
}

function resolveSafeSource(manifestDirectory, source) {
  if (
    typeof source !== "string"
    || !source
    || isAbsolute(source)
    || !SAFE_RELATIVE_PNG.test(source)
  ) {
    return null;
  }
  const resolved = resolve(manifestDirectory, source);
  const traversal = relative(manifestDirectory, resolved);
  if (!traversal || traversal === ".." || traversal.startsWith(`..${sep}`) || isAbsolute(traversal)) {
    return traversal ? null : resolved;
  }
  return resolved;
}

function validateClipDeclaration(name, declaration, errors) {
  const expected = HIGGSFIELD_CLIP_SPECS[name];
  if (!isPlainObject(declaration)) {
    errors.push(`clip ${name} must be an object`);
    return;
  }
  for (const field of ["frameCount", "fps", "loop"]) {
    if (declaration[field] !== expected[field]) {
      errors.push(`clip ${name} must declare ${field}=${expected[field]}`);
    }
  }
  if (name === "attack" && declaration.lockDirection !== true) {
    errors.push("clip attack must declare lockDirection=true");
  }
  if (name !== "attack" && declaration.lockDirection !== undefined) {
    errors.push(`clip ${name} must not declare lockDirection`);
  }
}

export function validateHiggsfieldMultiframeManifest(
  manifest,
  options = {},
) {
  const errors = [];
  const manifestDirectory = resolve(options.manifestDirectory ?? process.cwd());
  if (!isPlainObject(manifest)) {
    return ["manifest must be a JSON object"];
  }
  if (manifest.version !== HIGGSFIELD_MULTIFRAME_MANIFEST_VERSION) {
    errors.push(
      `manifest version must be ${HIGGSFIELD_MULTIFRAME_MANIFEST_VERSION}`,
    );
  }
  if (typeof manifest.enemyId !== "string" || !SAFE_ENEMY_ID.test(manifest.enemyId)) {
    errors.push("enemyId must be a lowercase kebab-case identifier");
  }
  if (
    !isPlainObject(manifest.frame)
    || manifest.frame.width !== HIGGSFIELD_RUNTIME_FRAME.width
    || manifest.frame.height !== HIGGSFIELD_RUNTIME_FRAME.height
  ) {
    errors.push(
      `frame must be exactly ${HIGGSFIELD_RUNTIME_FRAME.width}x${HIGGSFIELD_RUNTIME_FRAME.height}`,
    );
  }
  if (!sameArray(manifest.directions, HIGGSFIELD_RUNTIME_DIRECTIONS)) {
    errors.push(
      `directions must be exactly ${HIGGSFIELD_RUNTIME_DIRECTIONS.join(", ")}`,
    );
  }

  if (!isPlainObject(manifest.clips)) {
    errors.push("clips must be an object");
  } else {
    const clipNames = Object.keys(manifest.clips);
    if (!sameArray(clipNames, CLIP_ORDER)) {
      errors.push(`clips must be declared in exact order: ${CLIP_ORDER.join(", ")}`);
    }
    for (const name of CLIP_ORDER) {
      validateClipDeclaration(name, manifest.clips[name], errors);
    }
  }

  if (!isPlainObject(manifest.quality)) {
    errors.push("quality must lock the approved Higgsfield production settings");
  } else {
    if (manifest.quality.provider !== "higgsfield") {
      errors.push("quality.provider must be higgsfield");
    }
    if (typeof manifest.quality.model !== "string" || !manifest.quality.model.trim()) {
      errors.push("quality.model must identify the approved Higgsfield model");
    } else if (REJECTED_MODELS.has(manifest.quality.model)) {
      errors.push(`quality.model ${manifest.quality.model} is explicitly rejected`);
    }
    if (!QUALITY_TIERS.has(manifest.quality.tier)) {
      errors.push("quality.tier must be high, max, or 4k");
    }
    for (const field of ["allowFallback", "allowMirroring", "allowRotation", "allowUpscaling"]) {
      if (manifest.quality[field] !== false) {
        errors.push(`quality.${field} must be false`);
      }
    }
    if (manifest.quality.losslessOutput !== true) {
      errors.push("quality.losslessOutput must be true");
    }
  }

  if (!isPlainObject(manifest.chroma)) {
    errors.push("chroma must be an object");
  } else {
    if (typeof manifest.chroma.keyColor !== "string" || !SAFE_KEY_COLOR.test(manifest.chroma.keyColor)) {
      errors.push("chroma.keyColor must be a six-digit hex color");
    }
    if (
      !Number.isFinite(manifest.chroma.tolerancePercent)
      || manifest.chroma.tolerancePercent < 0
      || manifest.chroma.tolerancePercent > 8
    ) {
      errors.push("chroma.tolerancePercent must be between 0 and 8");
    }
    if (
      !Number.isFinite(manifest.chroma.minimumMarginPercent)
      || manifest.chroma.minimumMarginPercent < 8
      || manifest.chroma.minimumMarginPercent > 25
    ) {
      errors.push("chroma.minimumMarginPercent must be between 8 and 25");
    }
  }

  if (!isPlainObject(manifest.normalization)) {
    errors.push("normalization must be an object");
  } else {
    if (
      !Number.isInteger(manifest.normalization.paddingPixels)
      || manifest.normalization.paddingPixels < 0
      || manifest.normalization.paddingPixels > 32
    ) {
      errors.push("normalization.paddingPixels must be an integer from 0 to 32");
    }
    if (!new Set(["bottom", "center"]).has(manifest.normalization.alignment)) {
      errors.push("normalization.alignment must be bottom or center");
    }
  }

  if (!Array.isArray(manifest.frames)) {
    errors.push("frames must be an array");
    return errors;
  }
  if (manifest.frames.length !== EXPECTED_SOURCE_FRAME_COUNT) {
    errors.push(
      `manifest must register exactly ${EXPECTED_SOURCE_FRAME_COUNT} source frames; found ${manifest.frames.length}`,
    );
  }

  const expectedKeys = new Set();
  for (const clip of CLIP_ORDER) {
    for (const direction of HIGGSFIELD_RUNTIME_DIRECTIONS) {
      for (let frame = 0; frame < HIGGSFIELD_CLIP_SPECS[clip].frameCount; frame += 1) {
        expectedKeys.add(frameKey(clip, direction, frame));
      }
    }
  }
  const seenKeys = new Set();
  const seenSources = new Set();
  for (const [entryIndex, entry] of manifest.frames.entries()) {
    const label = `frames[${entryIndex}]`;
    if (!isPlainObject(entry)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    const key = frameKey(entry.clip, entry.direction, entry.frame);
    if (!expectedKeys.has(key)) {
      errors.push(`${label} declares unsupported coverage ${key}`);
    } else if (seenKeys.has(key)) {
      errors.push(`${label} duplicates coverage ${key}`);
    } else {
      seenKeys.add(key);
    }
    const sourcePath = resolveSafeSource(manifestDirectory, entry.source);
    if (!sourcePath) {
      errors.push(`${label}.source must be a safe relative PNG path`);
    } else if (seenSources.has(sourcePath)) {
      errors.push(`${label}.source reuses another source path`);
    } else {
      seenSources.add(sourcePath);
    }
    if (
      typeof entry.jobId !== "string"
      || entry.jobId.trim() !== entry.jobId
      || entry.jobId.length < 4
      || entry.jobId.length > 256
      || /[\u0000-\u001f\u007f]/.test(entry.jobId)
    ) {
      errors.push(`${label}.jobId must record the source Higgsfield job`);
    }
  }
  for (const key of expectedKeys) {
    if (!seenKeys.has(key)) {
      errors.push(`manifest is missing source frame ${key}`);
    }
  }
  return errors;
}

function keyColorChannels(keyColor) {
  return [
    Number.parseInt(keyColor.slice(1, 3), 16) / 255,
    Number.parseInt(keyColor.slice(3, 5), 16) / 255,
    Number.parseInt(keyColor.slice(5, 7), 16) / 255,
  ];
}

function readBorderStatistics(sourcePath, width, height) {
  const output = run("convert", [
    sourcePath,
    "-write",
    "mpr:source",
    "+delete",
    "(", "mpr:source", "-crop", `${width}x1+0+0`, "+repage", ")",
    "(", "mpr:source", "-crop", `${width}x1+0+${height - 1}`, "+repage", ")",
    "(", "mpr:source", "-crop", `1x${height}+0+0`, "+repage", "-rotate", "90", ")",
    "(", "mpr:source", "-crop", `1x${height}+${width - 1}+0`, "+repage", "-rotate", "90", ")",
    "+append",
    "-format",
    "%[fx:mean.r] %[fx:mean.g] %[fx:mean.b] %[fx:standard_deviation.r] %[fx:standard_deviation.g] %[fx:standard_deviation.b]",
    "info:",
  ]);
  const values = output.split(/\s+/).map(Number);
  if (values.length !== 6 || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`Unable to read chroma border statistics for ${sourcePath}`);
  }
  return {
    mean: values.slice(0, 3),
    deviation: values.slice(3),
  };
}

function validateChromaBorder(sourcePath, dimensions, chroma) {
  const expected = keyColorChannels(chroma.keyColor);
  const statistics = readBorderStatistics(
    sourcePath,
    dimensions.width,
    dimensions.height,
  );
  const tolerance = Math.max(2 / 255, chroma.tolerancePercent / 100);
  for (let channel = 0; channel < 3; channel += 1) {
    if (Math.abs(statistics.mean[channel] - expected[channel]) > tolerance) {
      throw new Error(
        `${sourcePath}: outer border does not match chroma key ${chroma.keyColor}`,
      );
    }
    if (statistics.deviation[channel] > tolerance / 2) {
      throw new Error(`${sourcePath}: outer chroma border is not uniform`);
    }
  }
}

function parseTrimGeometry(output, sourcePath) {
  const match = /^(\d+)x(\d+)([+-]\d+)([+-]\d+)$/.exec(output.trim());
  if (!match) {
    throw new Error(`${sourcePath}: unable to resolve foreground bounds`);
  }
  return {
    width: Number(match[1]),
    height: Number(match[2]),
    x: Number(match[3]),
    y: Number(match[4]),
  };
}

function readMainForegroundComponents(sourcePath, sourceArea) {
  const diagnostic = runWithDiagnostics("convert", [
    sourcePath,
    "-alpha",
    "extract",
    "-threshold",
    "0",
    "-define",
    "connected-components:verbose=true",
    "-connected-components",
    "8",
    "null:",
  ]);
  const minimumArea = sourceArea * 0.001;
  const components = [];
  const pattern = /^\s*(\d+):\s+(\d+)x(\d+)\+(\d+)\+(\d+)\s+[\d.]+,[\d.]+\s+(\d+)\s+gray\(255\)$/gm;
  for (const match of diagnostic.matchAll(pattern)) {
    const area = Number(match[6]);
    if (area >= minimumArea) {
      components.push({
        id: Number(match[1]),
        width: Number(match[2]),
        height: Number(match[3]),
        area,
      });
    }
  }
  return components;
}

function extractAndNormalizeFrame(sourcePath, destinationPath, manifest) {
  const dimensions = validateImageFile(sourcePath);
  if (dimensions.format !== "png") {
    throw new Error(`${sourcePath}: source frame must be a lossless PNG`);
  }
  if (
    dimensions.width < HIGGSFIELD_RUNTIME_FRAME.width
    || dimensions.height < HIGGSFIELD_RUNTIME_FRAME.height
  ) {
    throw new Error(
      `${sourcePath}: source ${dimensions.width}x${dimensions.height} is below the runtime frame and would require upscaling`,
    );
  }
  validateChromaBorder(sourcePath, dimensions, manifest.chroma);

  const tolerance = manifest.chroma.tolerancePercent;
  const farX = dimensions.width - 1;
  const farY = dimensions.height - 1;
  const extractedPath = `${destinationPath}.extracted.png`;
  run("convert", [
    sourcePath,
    "-alpha",
    "on",
    "-fuzz",
    `${tolerance}%`,
    "-fill",
    "none",
    "-draw",
    `matte 0,0 floodfill matte ${farX},0 floodfill matte 0,${farY} floodfill matte ${farX},${farY} floodfill`,
    "-strip",
    `PNG32:${extractedPath}`,
  ]);

  const alphaMaximum = Number(run("identify", [
    "-format",
    "%[fx:maxima.a]",
    extractedPath,
  ]));
  if (!Number.isFinite(alphaMaximum) || alphaMaximum <= 0) {
    throw new Error(`${sourcePath}: chroma extraction removed the entire subject`);
  }
  const bounds = parseTrimGeometry(
    run("convert", [
      extractedPath,
      "-alpha",
      "extract",
      "-threshold",
      "0",
      "-trim",
      "-format",
      "%wx%h%O",
      "info:",
    ]),
    sourcePath,
  );
  const margin = manifest.chroma.minimumMarginPercent / 100;
  const margins = [
    bounds.x / dimensions.width,
    bounds.y / dimensions.height,
    (dimensions.width - bounds.x - bounds.width) / dimensions.width,
    (dimensions.height - bounds.y - bounds.height) / dimensions.height,
  ];
  if (margins.some((value) => value < margin)) {
    throw new Error(
      `${sourcePath}: foreground must retain at least ${manifest.chroma.minimumMarginPercent}% margin on every edge`,
    );
  }
  const mainComponents = readMainForegroundComponents(
    extractedPath,
    dimensions.width * dimensions.height,
  );
  if (mainComponents.length !== 1) {
    throw new Error(
      `${sourcePath}: expected one connected main foreground component; found ${mainComponents.length}`,
    );
  }

  const padding = manifest.normalization.paddingPixels;
  const innerWidth = HIGGSFIELD_RUNTIME_FRAME.width - padding * 2;
  const innerHeight = HIGGSFIELD_RUNTIME_FRAME.height - padding * 2;
  const fitScale = Math.min(innerWidth / bounds.width, innerHeight / bounds.height);
  if (fitScale > 1 + 1e-9) {
    throw new Error(
      `${sourcePath}: extracted foreground ${bounds.width}x${bounds.height} would require upscaling`,
    );
  }

  const scaledPath = `${destinationPath}.scaled.png`;
  run("convert", [
    extractedPath,
    "-trim",
    "+repage",
    "-filter",
    "Lanczos",
    "-resize",
    `${innerWidth}x${innerHeight}>`,
    "-strip",
    `PNG32:${scaledPath}`,
  ]);
  const gravity = manifest.normalization.alignment === "bottom" ? "south" : "center";
  const geometry = manifest.normalization.alignment === "bottom"
    ? `+0+${padding}`
    : "+0+0";
  run("convert", [
    "-size",
    `${HIGGSFIELD_RUNTIME_FRAME.width}x${HIGGSFIELD_RUNTIME_FRAME.height}`,
    "canvas:none",
    scaledPath,
    "-gravity",
    gravity,
    "-geometry",
    geometry,
    "-composite",
    "-strip",
    "-define",
    "png:compression-level=9",
    `PNG32:${destinationPath}`,
  ]);
  rmSync(extractedPath, { force: true });
  rmSync(scaledPath, { force: true });

  const result = run("identify", [
    "-format",
    "%w %h %[channels] %z",
    destinationPath,
  ]);
  const expected = `${HIGGSFIELD_RUNTIME_FRAME.width} ${HIGGSFIELD_RUNTIME_FRAME.height} srgba 8`;
  if (result !== expected) {
    throw new Error(`${destinationPath}: normalized frame must be ${expected}; found ${result}`);
  }
  validateImageFile(destinationPath);
}

function outputFilename(enemyId, clip, page) {
  return `${enemyId}-${clip}-${page}-v3.png`;
}

function validateOutputPage(pagePath, clip) {
  const rows = HIGGSFIELD_CLIP_SPECS[clip].frameCount;
  const width = HIGGSFIELD_RUNTIME_FRAME.width * 4;
  const height = HIGGSFIELD_RUNTIME_FRAME.height * rows;
  const result = run("identify", ["-format", "%w %h %[channels] %z", pagePath]);
  const expected = `${width} ${height} srgba 8`;
  if (result !== expected) {
    throw new Error(`${pagePath}: physical page must be ${expected}; found ${result}`);
  }
  validateImageFile(pagePath);
  return { width, height, channels: "srgba", depth: 8 };
}

export function assembleHiggsfieldMultiframePages({
  manifest,
  manifestPath,
  outputDirectory,
}) {
  const resolvedManifestPath = resolve(manifestPath);
  const manifestDirectory = resolve(resolvedManifestPath, "..");
  const resolvedOutputDirectory = resolve(outputDirectory);
  const errors = validateHiggsfieldMultiframeManifest(manifest, {
    manifestDirectory,
  });
  if (errors.length > 0) {
    throw new Error(`Invalid Higgsfield multiframe manifest:\n- ${errors.join("\n- ")}`);
  }

  const expectedOutputs = [];
  for (const clip of CLIP_ORDER) {
    for (const page of PAGE_ORDER) {
      expectedOutputs.push({
        clip,
        page,
        path: join(
          resolvedOutputDirectory,
          outputFilename(manifest.enemyId, clip, page),
        ),
      });
    }
  }
  for (const output of expectedOutputs) {
    if (existsSync(output.path)) {
      throw new Error(`Refusing to overwrite existing production page: ${output.path}`);
    }
  }

  const frameEntries = new Map(
    manifest.frames.map((entry) => [
      frameKey(entry.clip, entry.direction, entry.frame),
      entry,
    ]),
  );
  const workingDirectory = mkdtempSync(`${tmpdir()}/doffa-higgsfield-pages-`);
  const normalizedFrames = new Map();
  const processedByContent = new Map();
  const createdOutputs = [];

  try {
    let normalizedIndex = 0;
    for (const clip of CLIP_ORDER) {
      for (const direction of HIGGSFIELD_RUNTIME_DIRECTIONS) {
        for (let frame = 0; frame < HIGGSFIELD_CLIP_SPECS[clip].frameCount; frame += 1) {
          const key = frameKey(clip, direction, frame);
          const entry = frameEntries.get(key);
          const sourcePath = resolveSafeSource(manifestDirectory, entry.source);
          if (!sourcePath || !existsSync(sourcePath)) {
            throw new Error(`${entry.source}: source frame does not exist`);
          }
          if (extname(sourcePath).toLowerCase() !== ".png") {
            throw new Error(`${entry.source}: source frame must be PNG`);
          }

          // Deep-decode every registered path even when fixture or review frames
          // happen to contain identical bytes. Expensive image normalization can
          // still be reused by content hash without weakening source validation.
          validateImageFile(sourcePath);
          const contentKey = createHash("sha256")
            .update(readFileSync(sourcePath))
            .update(JSON.stringify({
              chroma: manifest.chroma,
              normalization: manifest.normalization,
              frame: HIGGSFIELD_RUNTIME_FRAME,
            }))
            .digest("hex");
          const destinationPath = join(
            workingDirectory,
            `frame-${String(normalizedIndex).padStart(3, "0")}.png`,
          );
          normalizedIndex += 1;
          const cachedPath = processedByContent.get(contentKey);
          if (cachedPath) {
            copyFileSync(cachedPath, destinationPath);
          } else {
            extractAndNormalizeFrame(sourcePath, destinationPath, manifest);
            processedByContent.set(contentKey, destinationPath);
          }
          normalizedFrames.set(key, destinationPath);
        }
      }
    }

    const stagedPages = [];
    for (const clip of CLIP_ORDER) {
      const rows = HIGGSFIELD_CLIP_SPECS[clip].frameCount;
      for (const page of PAGE_ORDER) {
        const frames = [];
        for (let frame = 0; frame < rows; frame += 1) {
          for (const direction of HIGGSFIELD_PAGE_SPECS[page].directions) {
            frames.push(normalizedFrames.get(frameKey(clip, direction, frame)));
          }
        }
        const assembledPath = join(workingDirectory, `${clip}-${page}-assembled.png`);
        const stagedPath = join(workingDirectory, outputFilename(manifest.enemyId, clip, page));
        run("montage", [
          ...frames,
          "-mode",
          "concatenate",
          "-tile",
          `4x${rows}`,
          "-geometry",
          `${HIGGSFIELD_RUNTIME_FRAME.width}x${HIGGSFIELD_RUNTIME_FRAME.height}+0+0`,
          "-background",
          "none",
          assembledPath,
        ]);
        run("convert", [
          assembledPath,
          "-strip",
          "-define",
          "png:compression-level=9",
          `PNG32:${stagedPath}`,
        ]);
        const geometry = validateOutputPage(stagedPath, clip);
        stagedPages.push({ clip, page, stagedPath, geometry });
      }
    }

    mkdirSync(resolvedOutputDirectory, { recursive: true });
    const outputs = [];
    for (const staged of stagedPages) {
      const destinationPath = join(
        resolvedOutputDirectory,
        outputFilename(manifest.enemyId, staged.clip, staged.page),
      );
      renameSync(staged.stagedPath, destinationPath);
      createdOutputs.push(destinationPath);
      outputs.push(Object.freeze({
        clip: staged.clip,
        page: staged.page,
        path: destinationPath,
        ...staged.geometry,
      }));
    }
    return Object.freeze({
      enemyId: manifest.enemyId,
      sourceFrameCount: manifest.frames.length,
      outputs: Object.freeze(outputs),
    });
  } catch (error) {
    for (const outputPath of createdOutputs) {
      rmSync(outputPath, { force: true });
    }
    throw error;
  } finally {
    rmSync(workingDirectory, { recursive: true, force: true });
  }
}

export function buildHiggsfieldMultiframePages(manifestArgument, outputArgument) {
  const manifestPath = resolve(manifestArgument);
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest does not exist: ${manifestPath}`);
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to parse manifest ${manifestPath}: ${error.message}`);
  }
  return assembleHiggsfieldMultiframePages({
    manifest,
    manifestPath,
    outputDirectory: resolve(outputArgument),
  });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [manifestArgument, outputArgument, ...extraArguments] = process.argv.slice(2);
  if (!manifestArgument || !outputArgument || extraArguments.length > 0) {
    process.stderr.write(
      "Usage: node scripts/build-higgsfield-multiframe-pages.mjs <manifest.json> <output-directory>\n",
    );
    process.exitCode = 1;
  } else {
    try {
      const result = buildHiggsfieldMultiframePages(
        manifestArgument,
        outputArgument,
      );
      process.stdout.write(
        `Built ${result.outputs.length} lossless pages from ${result.sourceFrameCount} source frames for ${result.enemyId}.\n`,
      );
      for (const output of result.outputs) {
        process.stdout.write(
          `${output.clip}-${output.page}: ${output.path} ${output.width}x${output.height} ${output.channels}\n`,
        );
      }
    } catch (error) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    }
  }
}
