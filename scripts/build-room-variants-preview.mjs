import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const workspace = mkdtempSync(join(tmpdir(), "doffa-room-variants-"));
const output = resolve(root, "docs/previews/hollow-roastery-room-variants-v2.jpg");
const panelWidth = 180;
const panelHeight = 320;

const rooms = [
  ["ASH · V1 · STORAGE", "assets/rooms/hollow-roastery-ash-v1.jpg"],
  ["EMBER · V1 · FURNACE", "assets/rooms/hollow-roastery-ember-v1.jpg"],
  ["BRASS · V1 · GRINDER", "assets/rooms/hollow-roastery-brass-v1.jpg"],
  ["SMOKE · V1 · STEAM", "assets/rooms/hollow-roastery-smoke-v1.jpg"],
  ["PRESSURE · V1 · WORKS", "assets/rooms/hollow-roastery-pressure-v1.jpg"],
  ["ASH · V2 · CONVEYOR", "assets/rooms/hollow-roastery-ash-v2.jpg"],
  ["EMBER · V2 · BOILER", "assets/rooms/hollow-roastery-ember-v2.jpg"],
  ["BRASS · V2 · METERS", "assets/rooms/hollow-roastery-brass-v2.jpg"],
  ["SMOKE · V2 · VAPOR", "assets/rooms/hollow-roastery-smoke-v2.jpg"],
  ["PRESSURE · V2 · GAUGE", "assets/rooms/hollow-roastery-pressure-v2.jpg"],
];

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} failed\n${result.stderr}`);
  }
}

try {
  const panels = rooms.map(([label, source], index) => {
    const panel = join(workspace, `panel-${String(index).padStart(2, "0")}.png`);
    run("convert", [
      resolve(root, source),
      "-resize", `${panelWidth}x${panelHeight}!`,
      "-bordercolor", "#5e3522",
      "-border", "2x2",
      "-background", "#0b0806",
      "-gravity", "south",
      "-splice", "0x34",
      "-fill", "#e8c990",
      "-font", "DejaVu-Sans-Bold",
      "-pointsize", "10",
      "-annotate", "+0+11", label,
      panel,
    ]);
    return panel;
  });

  const grid = join(workspace, "grid.png");
  run("montage", [
    ...panels,
    "-tile", "5x2",
    "-geometry", "+10+10",
    "-background", "#0b0806",
    grid,
  ]);

  const header = join(workspace, "header.png");
  run("convert", [
    "-size", "1020x104",
    "xc:#0b0806",
    "-gravity", "north",
    "-fill", "#f1d59f",
    "-font", "DejaVu-Sans-Bold",
    "-pointsize", "29",
    "-annotate", "+0+18", "DOFFA HEROES · HOLLOW ROASTERY",
    "-fill", "#c97942",
    "-pointsize", "14",
    "-annotate", "+0+59", "10 RUNTIME PLATES · TWO ARCHITECTURES PER DISTRICT",
    "-fill", "#80664f",
    "-pointsize", "10",
    "-annotate", "+0+83", "ODD / EVEN ROOM SELECTION · UNIQUE ROASTER HEART RETAINED",
    header,
  ]);

  run("convert", [
    header,
    grid,
    "-append",
    "-strip",
    "-quality", "90",
    "-interlace", "Plane",
    output,
  ]);
  console.log(`Wrote ${output}`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
