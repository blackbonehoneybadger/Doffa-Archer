import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import {
  ROOM_EFFECT_PROFILES,
  getRoomAmbientMote,
  getRoomEffectState,
} from "../src/game/room-effects.js";

const root = process.cwd();
const output = resolve(root, "docs/previews/hollow-roastery-ambient-effects-v1.gif");
const workspace = mkdtempSync(join(tmpdir(), "doffa-room-effects-"));
const width = 360;
const height = 640;
const arena = { left: 24, right: 336, top: 71, bottom: 591 };
const environments = [
  { id: "ash", roomId: "ash-01", roomNumber: 1, label: "ASH STORAGE" },
  { id: "ember", roomId: "ember-11", roomNumber: 11, label: "CRACKED FURNACE" },
  { id: "brass", roomId: "brass-21", roomNumber: 21, label: "GRINDER HALL" },
  { id: "smoke", roomId: "smoke-31", roomNumber: 31, label: "STEAM CHAMBER" },
  { id: "pressure", roomId: "pressure-41", roomNumber: 41, label: "PRESSURE WORKS" },
  { id: "heart", roomId: "roaster-heart-50", roomNumber: 50, label: "ROASTER HEART" },
];

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} failed\n${result.stderr}`);
  }
}

function rgba(hex, opacity) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${Math.max(0, Math.min(1, opacity)).toFixed(3)})`;
}

function quoted(value) {
  return `'${String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}

function plumePath(x, y, inward, state, index, pressure) {
  const wave = Math.sin(state.time * 1.1 + state.phase + index * 1.9);
  const heightScale = pressure ? 48 : 63;
  return [
    `M ${x.toFixed(1)},${(y + 17).toFixed(1)}`,
    `C ${(x + inward * (12 + wave * 4)).toFixed(1)},${(y + 2).toFixed(1)}`,
    `${(x + inward * (22 - wave * 5)).toFixed(1)},${(y - 19).toFixed(1)}`,
    `${(x + inward * (14 + wave * 6)).toFixed(1)},${(y - heightScale).toFixed(1)}`,
  ].join(" ");
}

function addGlow(commands, x, y, radius, color, opacity) {
  for (let layer = 4; layer >= 1; layer -= 1) {
    const layerRadius = radius * (layer / 4);
    const layerOpacity = opacity * ((5 - layer) / 10);
    commands.push(
      `fill ${quoted(rgba(color, layerOpacity))} stroke none circle ${x},${y} ${(x + layerRadius).toFixed(1)},${y}`,
    );
  }
}

function buildDraw(environment, state) {
  const profile = ROOM_EFFECT_PROFILES[environment.id];
  const arenaWidth = arena.right - arena.left;
  const arenaHeight = arena.bottom - arena.top;
  const lightX = state.direction > 0 ? arena.left + 20 : arena.right - 20;
  const lightY = 125 + state.variant * 105;
  const commands = ["push graphic-context"];

  addGlow(commands, lightX, lightY, 155, profile.color, 0.12 + state.pulse * 0.09);
  if (environment.id === "ember" || environment.id === "heart") {
    addGlow(commands, 180, 86, 205, "#ff7a38", 0.18 + state.pulse * 0.17);
  }

  for (let index = 0; index < profile.moteCount; index += 1) {
    const mote = getRoomAmbientMote(state, index);
    const x = arena.left + mote.x * arenaWidth;
    const y = arena.top + mote.y * arenaHeight;
    const opacity = mote.alpha * (environment.id === "smoke" ? 0.38 : 0.72);
    if (environment.id === "smoke") {
      commands.push(
        `fill ${quoted(rgba(mote.color, opacity))} stroke none ellipse ${x.toFixed(1)},${y.toFixed(1)} ${(mote.size * 0.75).toFixed(1)},${(mote.size * 0.5).toFixed(1)} 0,360`,
      );
    } else if (environment.id === "ash" || environment.id === "brass") {
      const angle = mote.rotation * 180 / Math.PI;
      commands.push(
        "push graphic-context",
        `translate ${x.toFixed(1)},${y.toFixed(1)} rotate ${angle.toFixed(1)}`,
        `fill ${quoted(rgba(mote.color, opacity))} stroke none rectangle ${(-mote.size * 0.3).toFixed(1)},-0.5 ${(mote.size * 0.3).toFixed(1)},0.5`,
        "pop graphic-context",
      );
    } else {
      const radius = Math.max(0.8, mote.size * 0.26);
      commands.push(
        `fill ${quoted(rgba(mote.color, opacity))} stroke none circle ${x.toFixed(1)},${y.toFixed(1)} ${(x + radius).toFixed(1)},${y.toFixed(1)}`,
      );
    }
  }

  if (environment.id === "brass") {
    const rotors = [[42, 155], [318, 155], [42, 305], [318, 305], [42, 455], [318, 455]];
    for (let index = 0; index < rotors.length; index += 1) {
      if ((index + state.variant) % 2 !== 0) {
        continue;
      }
      const [x, y] = rotors[index];
      const angle = (state.time * (0.24 + index * 0.025) * state.direction + state.phase) * 180 / Math.PI;
      commands.push(
        "push graphic-context",
        `translate ${x},${y} rotate ${angle.toFixed(1)}`,
        `fill ${quoted("rgba(10,7,4,0.48)")} stroke ${quoted(rgba("#d5a447", 0.42 + state.pulse * 0.24))} stroke-width 1.2 circle 0,0 9,0`,
        "line 0,-7 0,7 line -7,0 7,0 line -5,-5 5,5 line 5,-5 -5,5",
        "pop graphic-context",
      );
    }
  }

  if (environment.id === "smoke" || environment.id === "pressure") {
    const pressure = environment.id === "pressure";
    const positions = [[35, 195], [325, 235], [35, 380], [325, 450]];
    for (let index = 0; index < positions.length; index += 1) {
      if ((index + state.variant) % 2 !== 0) {
        continue;
      }
      const [x, y] = positions[index];
      const inward = x < width / 2 ? 1 : -1;
      const burst = pressure
        ? Math.pow(Math.max(0, Math.sin(state.time * 1.55 + state.phase + index * 0.8)), 5)
        : 0.46 + state.pulse * 0.38;
      commands.push(
        `fill none stroke ${quoted(rgba(pressure ? "#f3e3c8" : "#b9a7b3", burst * (pressure ? 0.38 : 0.22)))} stroke-width ${pressure ? 5.5 : 4} path ${quoted(plumePath(x, y, inward, state, index, pressure))}`,
      );
    }
  }

  if (environment.id === "heart") {
    const rotation = (state.time * 0.055 * state.direction + state.phase * 0.08) * 180 / Math.PI;
    commands.push(
      "push graphic-context",
      `translate 180,325 rotate ${rotation.toFixed(2)}`,
      `fill none stroke ${quoted(rgba("#f0642d", 0.1 + state.pulse * 0.11))} stroke-width 1.5`,
    );
    for (const radius of [64, 97, 132]) {
      for (let segment = 0; segment < 4; segment += 1) {
        const start = segment * 90 + 5;
        commands.push(`arc ${-radius},${-radius} ${radius},${radius} ${start},${start + 24}`);
      }
    }
    commands.push("pop graphic-context");
  }

  commands.push(
    `fill ${quoted("rgba(8,5,4,0.82)")} stroke none rectangle 0,0 360,58`,
    `font ${quoted("DejaVu-Sans-Bold")} font-size 17 fill ${quoted("#f1d59f")} text 18,25 ${quoted(String(environment.roomNumber).padStart(2, "0"))}`,
    `font ${quoted("DejaVu-Sans-Bold")} font-size 10 fill ${quoted("#c97942")} text 52,25 ${quoted(environment.label)}`,
    `font ${quoted("DejaVu-Sans")} font-size 7.5 fill ${quoted("#8d6b4d")} text 18,45 ${quoted(`DETERMINISTIC AMBIENT PASS · VARIANT ${state.variant + 1}`)}`,
    "pop graphic-context",
  );

  return commands.join("\n");
}

try {
  const frames = [];
  let frameNumber = 0;
  for (const environment of environments) {
    const background = resolve(
      root,
      `assets/rooms/hollow-roastery-${environment.id}-v1.jpg`,
    );
    for (let step = 0; step < 6; step += 1) {
      const state = getRoomEffectState({
        environment: environment.id,
        roomId: environment.roomId,
        roomNumber: environment.roomNumber,
        clock: step * 0.58,
      });
      const frame = join(workspace, `frame-${String(frameNumber).padStart(3, "0")}.png`);
      run("convert", [
        background,
        "-resize",
        `${width}x${height}!`,
        "-draw",
        buildDraw(environment, state),
        "-strip",
        frame,
      ]);
      frames.push(frame);
      frameNumber += 1;
    }
  }

  run("convert", [
    "-delay",
    "12",
    "-loop",
    "0",
    ...frames,
    "-layers",
    "Optimize",
    "-colors",
    "192",
    output,
  ]);
  console.log(`Wrote ${output}`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
