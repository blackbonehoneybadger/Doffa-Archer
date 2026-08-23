import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const workspace = mkdtempSync(join(tmpdir(), "doffa-rootfall-variants-"));
const output = resolve(root, "docs/previews/rootfall-jungle-room-variants-v1.jpg");
const panelWidth = 180;
const panelHeight = 320;

const rooms = [
  ["CANOPY · V1 · ROOTWAKE", "assets/rooms/rootfall-jungle-canopy-v1.jpg"],
  ["MIRE · V1 · DROWNED FEN", "assets/rooms/rootfall-jungle-mire-v1.jpg"],
  ["MYCELIUM · V1 · BASILICA", "assets/rooms/rootfall-jungle-mycelium-v1.jpg"],
  ["BRIAR · V1 · RELIQUARY", "assets/rooms/rootfall-jungle-briar-v1.jpg"],
  ["ROOTDEEP · V1 · DEPTHS", "assets/rooms/rootfall-jungle-rootdeep-v1.jpg"],
  ["CANOPY · V2 · CLOISTER", "assets/rooms/rootfall-jungle-canopy-v2.jpg"],
  ["MIRE · V2 · CAUSEWAY", "assets/rooms/rootfall-jungle-mire-v2.jpg"],
  ["MYCELIUM · V2 · NAVE", "assets/rooms/rootfall-jungle-mycelium-v2.jpg"],
  ["BRIAR · V2 · COURT", "assets/rooms/rootfall-jungle-briar-v2.jpg"],
  ["ROOTDEEP · V2 · SAP VAULT", "assets/rooms/rootfall-jungle-rootdeep-v2.jpg"],
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
      "-bordercolor", "#38513d",
      "-border", "2x2",
      "-background", "#080d0a",
      "-gravity", "south",
      "-splice", "0x34",
      "-fill", "#dce5c4",
      "-font", "DejaVu-Sans-Bold",
      "-pointsize", "9",
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
    "-background", "#080d0a",
    grid,
  ]);

  const header = join(workspace, "header.png");
  run("convert", [
    "-size", "1020x104",
    "xc:#080d0a",
    "-gravity", "north",
    "-fill", "#e6e0bd",
    "-font", "DejaVu-Sans-Bold",
    "-pointsize", "29",
    "-annotate", "+0+18", "DOFFA HEROES · ROOTFALL JUNGLE",
    "-fill", "#83a866",
    "-pointsize", "14",
    "-annotate", "+0+59", "10 RUNTIME PLATES · TWO ARCHITECTURES PER DISTRICT",
    "-fill", "#657864",
    "-pointsize", "10",
    "-annotate", "+0+83", "ODD / EVEN ROOM SELECTION · UNIQUE ROOT THRONE RETAINED",
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
