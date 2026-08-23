import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

const STANDARD_SOURCE_COLUMNS = 8;
const SPLIT_SOURCE_COLUMNS = 4;
const DEFAULT_SOURCE_ROWS = 3;
const TARGET_COLUMNS = 4;
const FRAME_WIDTH = 288;
const FRAME_HEIGHT = 336;
const CROP_INSET = 2;
const BACKDROP_FUZZ = "6%";
const CHROMA_KEY = "#00ff00";
const CHROMA_FUZZ = "40%";

// Generated reference sheets are N/NE/E/SE/S/SW/W/NW. Runtime frames are
// E/SE/S/SW/W/NW/N/NE so atan2 sectors can map directly to a frame index.
const RUNTIME_TO_SOURCE_COLUMN = Object.freeze([2, 3, 4, 5, 6, 7, 0, 1]);

// Some image generators interpret "north" as a front portrait and "south"
// as a rear portrait. For those split 4x2 direction sheets, build a visual
// compass from the front and rear hemispheres instead of trusting the labels:
// E, SE, S, SW, W, NW, N, NE. Mirroring keeps left/right silhouettes exact.
const MIRRORED_COMPASS_SOURCE_COLUMNS = Object.freeze([2, 3, 0, 3, 2, 7, 4, 7]);
const MIRRORED_COMPASS_FLIPPED_DIRECTIONS = new Set([3, 4, 5]);

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

function runWithDiagnostics(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0) {
    fail(result.stderr?.trim() || result.error?.message || `${command} failed`);
  }
  return `${result.stdout}\n${result.stderr}`;
}

function readMainChromaComponents(
  sheetPath,
  sourceWidth,
  sourceHeight,
  sourceRows,
  sourceColumns,
) {
  const diagnostic = runWithDiagnostics("convert", [
    sheetPath,
    "-alpha",
    "extract",
    "-define",
    "connected-components:verbose=true",
    "-connected-components",
    "8",
    "null:",
  ]);
  const minimumArea = sourceWidth * sourceHeight * 0.003;
  const components = [];
  const componentPattern = /^\s*(\d+):\s+(\d+)x(\d+)\+(\d+)\+(\d+)\s+([\d.]+),([\d.]+)\s+(\d+)\s+gray\(255\)$/gm;
  for (const match of diagnostic.matchAll(componentPattern)) {
    const component = {
      id: Number(match[1]),
      width: Number(match[2]),
      height: Number(match[3]),
      x: Number(match[4]),
      y: Number(match[5]),
      centerX: Number(match[6]),
      centerY: Number(match[7]),
      area: Number(match[8]),
    };
    if (component.area >= minimumArea) {
      components.push(component);
    }
  }

  const rows = Array.from({ length: sourceRows }, () => []);
  for (const component of components) {
    const row = Math.min(
      sourceRows - 1,
      Math.max(0, Math.floor(component.centerY / (sourceHeight / sourceRows))),
    );
    rows[row].push(component);
  }
  for (const row of rows) {
    row.sort((a, b) => a.centerX - b.centerX);
  }
  if (rows.some((row) => row.length !== sourceColumns)) {
    fail(
      `Chroma sheet must contain exactly ${sourceColumns} main figures per row; found ${rows.map((row) => row.length).join("/")}`,
    );
  }
  return rows;
}

const [inputArgument, outputArgument, ...options] = process.argv.slice(2);
if (!inputArgument || !outputArgument) {
  fail(
    "Usage: node scripts/build-full-motion-atlas.mjs <source-sheet> <output-atlas> [--chroma-green] [--rows=<count>] [--split-directions] [--mirrored-compass] [--direction-map=0,1,2,3,4,5,6,7] [--flip-directions=3,4,5] [--scale=<factor>]",
  );
}

let extractionMode = null;
let sourceRows = DEFAULT_SOURCE_ROWS;
let figureScale = 1;
let splitDirections = false;
let mirroredCompass = false;
let customDirectionMap = null;
let customFlippedDirections = null;
for (const option of options) {
  if (option === "--chroma-green") {
    extractionMode = option;
    continue;
  }
  if (option === "--split-directions") {
    splitDirections = true;
    continue;
  }
  if (option === "--mirrored-compass") {
    mirroredCompass = true;
    continue;
  }
  const rowsMatch = /^--rows=(\d+)$/.exec(option);
  if (rowsMatch) {
    sourceRows = Number(rowsMatch[1]);
    continue;
  }
  const scaleMatch = /^--scale=(\d+(?:\.\d+)?)$/.exec(option);
  if (scaleMatch) {
    figureScale = Number(scaleMatch[1]);
    continue;
  }
  const directionMapMatch = /^--direction-map=([0-7](?:,[0-7]){7})$/.exec(option);
  if (directionMapMatch) {
    customDirectionMap = directionMapMatch[1].split(",").map(Number);
    continue;
  }
  const flipDirectionsMatch = /^--flip-directions=([0-7](?:,[0-7])*)$/.exec(option);
  if (flipDirectionsMatch) {
    customFlippedDirections = new Set(
      flipDirectionsMatch[1].split(",").map(Number),
    );
    continue;
  }
  fail(`Unsupported option: ${option}`);
}
if (!Number.isInteger(sourceRows) || sourceRows < 1 || sourceRows > 8) {
  fail(`Source row count must be an integer from 1 to 8; received ${sourceRows}`);
}
if (!Number.isFinite(figureScale) || figureScale < 0.5 || figureScale > 2) {
  fail(`Figure scale must be from 0.5 to 2; received ${figureScale}`);
}
if (mirroredCompass && !splitDirections) {
  fail("--mirrored-compass requires --split-directions");
}
if ((customDirectionMap || customFlippedDirections) && !splitDirections) {
  fail("Custom direction options require --split-directions");
}
if (customFlippedDirections && !customDirectionMap) {
  fail("--flip-directions requires --direction-map");
}
const runtimeSourceColumns = customDirectionMap
  ?? (mirroredCompass ? MIRRORED_COMPASS_SOURCE_COLUMNS : RUNTIME_TO_SOURCE_COLUMN);
const runtimeFlippedDirections = customFlippedDirections
  ?? (mirroredCompass ? MIRRORED_COMPASS_FLIPPED_DIRECTIONS : new Set());
const targetRows = sourceRows * 2;
const sourceColumns = splitDirections ? SPLIT_SOURCE_COLUMNS : STANDARD_SOURCE_COLUMNS;
const sourceGridRows = splitDirections ? sourceRows * 2 : sourceRows;

const inputPath = resolve(inputArgument);
const outputPath = resolve(outputArgument);
if (!existsSync(inputPath)) {
  fail(`Source sheet does not exist: ${inputPath}`);
}

const dimensions = run("identify", ["-format", "%w %h", inputPath])
  .split(/\s+/)
  .map(Number);
const [sourceWidth, sourceHeight] = dimensions;
if (
  dimensions.length !== 2
  || !Number.isInteger(sourceWidth)
  || !Number.isInteger(sourceHeight)
  || sourceWidth < 800
  || sourceHeight < 600
) {
  fail(`Unsupported source sheet dimensions: ${dimensions.join("x")}`);
}

mkdirSync(dirname(outputPath), { recursive: true });
const workingDirectory = mkdtempSync(`${tmpdir()}/doffa-full-motion-`);

try {
  const chromaSheetPath = resolve(workingDirectory, "chroma-sheet.png");
  const chromaComponents = extractionMode === "--chroma-green"
    ? (() => {
      run("convert", [
        inputPath,
        "-alpha",
        "on",
        "-fuzz",
        CHROMA_FUZZ,
        "-transparent",
        CHROMA_KEY,
        chromaSheetPath,
      ]);
      return readMainChromaComponents(
        chromaSheetPath,
        sourceWidth,
        sourceHeight,
        sourceGridRows,
        sourceColumns,
      );
    })()
    : null;
  const sourceCellWidth = Math.round(sourceWidth / sourceColumns);
  const sourceCellHeight = Math.round(sourceHeight / sourceGridRows);
  const frames = [];
  for (let stateRow = 0; stateRow < sourceRows; stateRow += 1) {
    for (let directionIndex = 0; directionIndex < STANDARD_SOURCE_COLUMNS; directionIndex += 1) {
      const sourceDirectionIndex = runtimeSourceColumns[directionIndex];
      const sourceColumn = splitDirections
        ? sourceDirectionIndex % SPLIT_SOURCE_COLUMNS
        : sourceDirectionIndex;
      const sourceGridRow = splitDirections
        ? stateRow * 2 + Math.floor(sourceDirectionIndex / SPLIT_SOURCE_COLUMNS)
        : stateRow;
      const frameIndex = stateRow * STANDARD_SOURCE_COLUMNS + directionIndex;
      const framePath = resolve(
        workingDirectory,
        `frame-${String(frameIndex).padStart(2, "0")}.png`,
      );

      if (chromaComponents) {
        const component = chromaComponents[sourceGridRow][sourceColumn];
        const componentPath = resolve(workingDirectory, `component-${frameIndex}.png`);
        const rowTop = Math.round((sourceGridRow * sourceHeight) / sourceGridRows);
        const offsetX = Math.round((sourceCellWidth - component.width) / 2);
        const offsetY = Math.max(0, component.y - rowTop);
        run("convert", [
          chromaSheetPath,
          "-crop",
          `${component.width}x${component.height}+${component.x}+${component.y}`,
          "+repage",
          componentPath,
        ]);
        run("convert", [
          "-size",
          `${sourceCellWidth}x${sourceCellHeight}`,
          "canvas:none",
          componentPath,
          "-geometry",
          `+${offsetX}+${offsetY}`,
          "-composite",
          "-resize",
          `${FRAME_WIDTH}x${FRAME_HEIGHT}`,
          "-gravity",
          "center",
          "-background",
          "none",
          "-extent",
          `${FRAME_WIDTH}x${FRAME_HEIGHT}`,
          framePath,
        ]);
      } else {
        const left = Math.round((sourceColumn * sourceWidth) / sourceColumns) + CROP_INSET;
        const right = Math.round(((sourceColumn + 1) * sourceWidth) / sourceColumns) - CROP_INSET;
        const top = Math.round((sourceGridRow * sourceHeight) / sourceGridRows) + CROP_INSET;
        const bottom = Math.round(((sourceGridRow + 1) * sourceHeight) / sourceGridRows) - CROP_INSET;
        const cropWidth = right - left;
        const cropHeight = bottom - top;
        const farX = Math.max(1, cropWidth - 2);
        const farY = Math.max(1, cropHeight - 2);
        run("convert", [
          inputPath,
          "-crop",
          `${cropWidth}x${cropHeight}+${left}+${top}`,
          "+repage",
          "-alpha",
          "on",
          "-fuzz",
          BACKDROP_FUZZ,
          "-fill",
          "none",
          "-draw",
          `matte 1,1 floodfill matte ${farX},1 floodfill matte 1,${farY} floodfill matte ${farX},${farY} floodfill`,
          "-resize",
          `${FRAME_WIDTH}x${FRAME_HEIGHT}`,
          "-gravity",
          "center",
          "-background",
          "none",
          "-extent",
          `${FRAME_WIDTH}x${FRAME_HEIGHT}`,
          framePath,
        ]);
      }
      if (figureScale !== 1) {
        const scaledFramePath = resolve(workingDirectory, `scaled-${frameIndex}.png`);
        run("convert", [
          framePath,
          "-trim",
          "+repage",
          "-resize",
          `${Math.round(figureScale * 100)}%`,
          "-gravity",
          "center",
          "-background",
          "none",
          "-extent",
          `${FRAME_WIDTH}x${FRAME_HEIGHT}`,
          scaledFramePath,
        ]);
        renameSync(scaledFramePath, framePath);
      }
      if (runtimeFlippedDirections.has(directionIndex)) {
        const flippedFramePath = resolve(workingDirectory, `flipped-${frameIndex}.png`);
        run("convert", [framePath, "-flop", flippedFramePath]);
        renameSync(flippedFramePath, framePath);
      }
      frames.push(framePath);
    }
  }

  const assembledAtlasPath = resolve(workingDirectory, "assembled-atlas.png");
  run("montage", [
    ...frames,
    "-mode",
    "concatenate",
    "-tile",
    `${TARGET_COLUMNS}x${targetRows}`,
    "-geometry",
    `${FRAME_WIDTH}x${FRAME_HEIGHT}+0+0`,
    "-background",
    "none",
    assembledAtlasPath,
  ]);
  run("convert", [
    assembledAtlasPath,
    "-colors",
    "512",
    "-strip",
    "-define",
    "png:compression-level=9",
    `PNG32:${outputPath}`,
  ]);

  const outputDimensions = run("identify", ["-format", "%w %h %[channels]", outputPath]);
  const expectedDimensions = `${TARGET_COLUMNS * FRAME_WIDTH} ${targetRows * FRAME_HEIGHT}`;
  if (!outputDimensions.startsWith(expectedDimensions) || !outputDimensions.includes("a")) {
    fail(`Atlas validation failed: ${outputDimensions}`);
  }
  process.stdout.write(`${outputPath} ${outputDimensions}\n`);
} finally {
  rmSync(workingDirectory, { recursive: true, force: true });
}
