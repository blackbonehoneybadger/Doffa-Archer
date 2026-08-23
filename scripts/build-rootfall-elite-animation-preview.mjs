import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const workspace = mkdtempSync(join(tmpdir(), "doffa-rootfall-elites-"));
const output = resolve(root, "docs/previews/rootfall-elite-complete-animation-v1.jpg");

const atlasWidth = 1152;
const atlasHeight = 1344;
const columns = 4;
const rows = 4;
const frameWidth = atlasWidth / columns;
const frameHeight = atlasHeight / rows;
const directionIndex = 1;
const directionLabel = "SOUTH-EAST";
const labelWidth = 190;
const cardWidth = 250;
const rowHeight = 232;
const boardWidth = labelWidth + cardWidth * 4;

const elites = [
  {
    name: "BRIAR JAGUAR",
    pattern: "THORN ROSETTE",
    accent: "#c95554",
    special: "assets/enemies/briar-jaguar-special-v1.png",
    reactions: "assets/enemies/briar-jaguar-reactions-v1.png",
  },
  {
    name: "MIRE BELLOWER",
    pattern: "BOG RINGS",
    accent: "#5db8a5",
    special: "assets/enemies/mire-bellower-special-v1.png",
    reactions: "assets/enemies/mire-bellower-reactions-v1.png",
  },
  {
    name: "ORCHID MAW",
    pattern: "POLLEN SPIRAL",
    accent: "#d36ca2",
    special: "assets/enemies/orchid-maw-special-v1.png",
    reactions: "assets/enemies/orchid-maw-reactions-v1.png",
  },
  {
    name: "STRANGLER APE",
    pattern: "ROOTQUAKE",
    accent: "#8fbd63",
    special: "assets/enemies/strangler-ape-special-v1.png",
    reactions: "assets/enemies/strangler-ape-reactions-v1.png",
  },
];

const states = [
  {
    name: "SECONDARY\nWINDUP",
    note: "SPECIAL · ROWS 0–1",
    atlas: "special",
    stateRow: 0,
  },
  {
    name: "SECONDARY\nRELEASE",
    note: "SPECIAL · ROWS 2–3",
    atlas: "special",
    stateRow: 2,
  },
  {
    name: "HIT\nREACTION",
    note: "REACTIONS · ROWS 0–1",
    atlas: "reactions",
    stateRow: 0,
  },
  {
    name: "DEFEAT",
    note: "REACTIONS · ROWS 2–3",
    atlas: "reactions",
    stateRow: 2,
  },
];

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.error?.message || `${command} failed`);
  }
  return result.stdout.trim();
}

function validateAtlas(path) {
  const absolutePath = resolve(root, path);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing runtime atlas: ${path}`);
  }
  const details = run("identify", ["-format", "%w %h %[channels]", absolutePath]);
  if (details !== `${atlasWidth} ${atlasHeight} srgba`) {
    throw new Error(`Invalid runtime atlas ${path}: expected 1152 1344 srgba, received ${details}`);
  }
}

function buildColumnHeader(elite, index) {
  const path = join(workspace, `column-${index}.png`);
  run("convert", [
    "-size", `${cardWidth}x74`,
    "xc:#0c1510",
    "-fill", elite.accent,
    "-draw", `rectangle 0,0 ${cardWidth},5`,
    "-gravity", "north",
    "-fill", "#edf0d6",
    "-font", "DejaVu-Sans-Bold",
    "-pointsize", "15",
    "-annotate", "+0+17", elite.name,
    "-fill", elite.accent,
    "-pointsize", "10",
    "-annotate", "+0+46", elite.pattern,
    path,
  ]);
  return path;
}

function buildCornerHeader() {
  const path = join(workspace, "corner.png");
  run("convert", [
    "-size", `${labelWidth}x74`,
    "xc:#0c1510",
    "-gravity", "center",
    "-fill", "#718375",
    "-font", "DejaVu-Sans-Bold",
    "-pointsize", "10",
    "-annotate", "+0+0", "RUNTIME STATE",
    path,
  ]);
  return path;
}

function buildStateLabel(state, index) {
  const path = join(workspace, `state-${index}.png`);
  run("convert", [
    "-size", `${labelWidth}x${rowHeight}`,
    "xc:#0a100c",
    "-fill", "#83a866",
    "-draw", `rectangle 0,0 5,${rowHeight}`,
    "-gravity", "center",
    "-fill", "#e6e0bd",
    "-font", "DejaVu-Sans-Bold",
    "-pointsize", "17",
    "-annotate", "+0-16", state.name,
    "-fill", "#657864",
    "-pointsize", "9",
    "-annotate", "+0+39", state.note,
    path,
  ]);
  return path;
}

function buildFrameCard(elite, state, eliteIndex, stateIndex) {
  const atlas = resolve(root, elite[state.atlas]);
  const frameIndex = state.stateRow * columns + directionIndex;
  const sourceX = (frameIndex % columns) * frameWidth;
  const sourceY = Math.floor(frameIndex / columns) * frameHeight;
  const frame = join(workspace, `frame-${stateIndex}-${eliteIndex}.png`);
  const card = join(workspace, `card-${stateIndex}-${eliteIndex}.png`);

  run("convert", [
    atlas,
    "-crop", `${frameWidth}x${frameHeight}+${sourceX}+${sourceY}`,
    "+repage",
    "-trim",
    "+repage",
    "-resize", "198x184",
    "-gravity", "center",
    "-background", "none",
    "-extent", "216x186",
    frame,
  ]);

  run("convert", [
    "-size", `${cardWidth}x${rowHeight}`,
    "xc:#101a14",
    "-fill", "#15241b",
    "-stroke", elite.accent,
    "-strokewidth", "1",
    "-draw", `roundrectangle 9,8 ${cardWidth - 9},${rowHeight - 8} 14,14`,
    frame,
    "-gravity", "north",
    "-geometry", "+0+13",
    "-composite",
    "-gravity", "south",
    "-fill", "#91a292",
    "-font", "DejaVu-Sans-Bold",
    "-pointsize", "9",
    "-annotate", "+0+13", `${directionLabel} · CELL ${String(frameIndex).padStart(2, "0")}`,
    card,
  ]);
  return card;
}

try {
  for (const elite of elites) {
    validateAtlas(elite.special);
    validateAtlas(elite.reactions);
  }

  const header = join(workspace, "header.png");
  run("convert", [
    "-size", `${boardWidth}x144`,
    "xc:#080d0a",
    "-gravity", "north",
    "-fill", "#e6e0bd",
    "-font", "DejaVu-Sans-Bold",
    "-pointsize", "30",
    "-annotate", "+0+20", "DOFFA HEROES · ROOTFALL ELITE ANIMATION",
    "-fill", "#83a866",
    "-pointsize", "14",
    "-annotate", "+0+65", "SECONDARY ATTACK · HIT · DEFEAT",
    "-fill", "#657864",
    "-pointsize", "10",
    "-annotate", "+0+98", "EXACT 1152×1344 RGBA RUNTIME ATLASES · 288×336 CELLS",
    "-annotate", "+0+117", "E / SE / S / SW / W / NW / N / NE DIRECTION ORDER",
    header,
  ]);

  const columnHeader = join(workspace, "column-header.png");
  run("convert", [
    buildCornerHeader(),
    ...elites.map(buildColumnHeader),
    "+append",
    columnHeader,
  ]);

  const stateRows = states.map((state, stateIndex) => {
    const path = join(workspace, `row-${stateIndex}.png`);
    run("convert", [
      buildStateLabel(state, stateIndex),
      ...elites.map((elite, eliteIndex) => (
        buildFrameCard(elite, state, eliteIndex, stateIndex)
      )),
      "+append",
      path,
    ]);
    return path;
  });

  const footer = join(workspace, "footer.png");
  run("convert", [
    "-size", `${boardWidth}x48`,
    "xc:#080d0a",
    "-gravity", "center",
    "-fill", "#536257",
    "-font", "DejaVu-Sans",
    "-pointsize", "9",
    "-annotate", "+0+0", "CELLS EXTRACTED DIRECTLY FROM THE EIGHT SHIPPING RUNTIME ATLASES",
    footer,
  ]);

  run("convert", [
    header,
    columnHeader,
    ...stateRows,
    footer,
    "-append",
    "-strip",
    "-quality", "91",
    "-interlace", "Plane",
    output,
  ]);

  console.log(`Wrote ${output}`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
