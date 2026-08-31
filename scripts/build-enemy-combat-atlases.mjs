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

const SOURCE_COLUMNS = 4;
const SOURCE_ROWS = 4;
const TARGET_COLUMNS = 4;
const TARGET_FRAME_WIDTH = 288;
const TARGET_FRAME_HEIGHT = 336;
const TARGET_FIGURE_WIDTH = 276;
const TARGET_FIGURE_HEIGHT = 320;

// Higgsfield source columns are E/S/W/N. Runtime sectors are
// E/SE/S/SW/W/NW/N/NE; diagonals use the closest authored cardinal pose.
const RUNTIME_TO_SOURCE_COLUMN = Object.freeze([0, 0, 1, 1, 2, 2, 3, 3]);

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

const [inputArgument, specialOutputArgument, reactionOutputArgument] = process.argv.slice(2);
if (!inputArgument || !specialOutputArgument || !reactionOutputArgument) {
  fail(
    "Usage: node scripts/build-enemy-combat-atlases.mjs <higgsfield-4x4.png> <special.png> <reactions.png>",
  );
}

const inputPath = resolve(inputArgument);
const specialOutputPath = resolve(specialOutputArgument);
const reactionOutputPath = resolve(reactionOutputArgument);
if (!existsSync(inputPath)) {
  fail(`Source sheet does not exist: ${inputPath}`);
}

const [sourceWidth, sourceHeight] = run("identify", ["-format", "%w %h", inputPath])
  .split(/\s+/)
  .map(Number);
if (sourceWidth !== sourceHeight || sourceWidth % SOURCE_COLUMNS !== 0) {
  fail(`Source sheet must be square and divisible by 4; received ${sourceWidth}x${sourceHeight}`);
}

const sourceCellWidth = sourceWidth / SOURCE_COLUMNS;
const sourceCellHeight = sourceHeight / SOURCE_ROWS;
const workingDirectory = mkdtempSync(`${tmpdir()}/doffa-enemy-combat-atlas-`);
mkdirSync(dirname(specialOutputPath), { recursive: true });
mkdirSync(dirname(reactionOutputPath), { recursive: true });

function buildAtlas(sourceStateRows, outputPath, label) {
  const frames = [];
  for (let stateIndex = 0; stateIndex < sourceStateRows.length; stateIndex += 1) {
    const sourceRow = sourceStateRows[stateIndex];
    for (let directionIndex = 0; directionIndex < 8; directionIndex += 1) {
      const sourceColumn = RUNTIME_TO_SOURCE_COLUMN[directionIndex];
      const frameIndex = stateIndex * 8 + directionIndex;
      const framePath = resolve(
        workingDirectory,
        `${label}-${String(frameIndex).padStart(2, "0")}.png`,
      );
      run("convert", [
        inputPath,
        "-crop",
        `${sourceCellWidth}x${sourceCellHeight}+${sourceColumn * sourceCellWidth}+${sourceRow * sourceCellHeight}`,
        "+repage",
        "-alpha",
        "on",
        "-fuzz",
        "28%",
        "-transparent",
        "#00ff00",
        "-trim",
        "+repage",
        "-resize",
        `${TARGET_FIGURE_WIDTH}x${TARGET_FIGURE_HEIGHT}>`,
        "-gravity",
        "center",
        "-background",
        "none",
        "-extent",
        `${TARGET_FRAME_WIDTH}x${TARGET_FRAME_HEIGHT}`,
        `PNG32:${framePath}`,
      ]);
      frames.push(framePath);
    }
  }

  const assembledPath = resolve(workingDirectory, `${label}-assembled.png`);
  run("montage", [
    ...frames,
    "-mode",
    "concatenate",
    "-tile",
    `${TARGET_COLUMNS}x4`,
    "-geometry",
    `${TARGET_FRAME_WIDTH}x${TARGET_FRAME_HEIGHT}+0+0`,
    "-background",
    "none",
    assembledPath,
  ]);
  const completedPath = `${outputPath}.tmp-${process.pid}-${label}.png`;
  run("convert", [
    assembledPath,
    "-colors",
    "512",
    "-strip",
    "-define",
    "png:compression-level=9",
    `PNG32:${completedPath}`,
  ]);
  const result = run("identify", ["-format", "%w %h %[channels]", completedPath]);
  if (result !== "1152 1344 srgba") {
    rmSync(completedPath, { force: true });
    fail(`Runtime atlas validation failed for ${outputPath}: ${result}`);
  }
  renameSync(completedPath, outputPath);
}

try {
  // Source rows: windup, release, hit, defeat.
  buildAtlas([0, 1], specialOutputPath, "special");
  buildAtlas([2, 3], reactionOutputPath, "reaction");

  process.stdout.write(`${specialOutputPath}\n${reactionOutputPath}\n`);
} finally {
  rmSync(workingDirectory, { recursive: true, force: true });
}
