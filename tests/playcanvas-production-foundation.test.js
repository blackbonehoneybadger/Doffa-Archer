import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  clampActorToRoom,
  createMobileQualityProfile,
  resolveActorPosition,
  resolveCircleVsAabb,
  ROOM_BOUNDS,
  ROOM_OBSTACLES,
} from "../apps/playcanvas-spike/src/room-layout.js";
import {
  getHeroAtlasFrame,
  getHeroAtlasUv,
  getHeroDirection,
  HERO_DIRECTIONS,
} from "../apps/playcanvas-spike/src/hero-animation.js";
import {
  createVolleyDirections,
  getWeaponProfile,
} from "../apps/playcanvas-spike/src/combat-profile.js";

const root = process.cwd();

test("PlayCanvas is pinned and the mobile 3D route has a reproducible build", () => {
  const packageDefinition = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  assert.match(packageDefinition.dependencies.playcanvas, /^\d+\.\d+\.\d+$/);
  assert.match(packageDefinition.devDependencies.vite, /^\d+\.\d+\.\d+$/);
  assert.equal(packageDefinition.scripts.build, "node scripts/build-web.mjs");
  assert.equal(packageDefinition.scripts["dev:next"].includes("vite.playcanvas.config.js"), true);
  assert.equal(vercel.buildCommand, "npm run build");
  assert.equal(vercel.outputDirectory, "dist");
});

test("the PlayCanvas spike preserves the approved Honey Badger art and top-down contract", () => {
  const source = readFileSync(join(root, "apps/playcanvas-spike/src/main.js"), "utf8");
  assert.equal(source.includes("honey-badger-full-motion-v3.png?url"), true);
  assert.equal(source.includes("honey-badger-portrait-v1.png?url"), true);
  assert.equal(source.includes("pressure-widow-motion-v1.png?url"), true);
  assert.equal(existsSync(join(root, "assets/enemies/pressure-widow-motion-v1.png")), true);
  assert.equal(source.includes("PROJECTION_ORTHOGRAPHIC"), true);
  assert.equal(source.includes('new Entity("honey-badger")'), true);
  assert.equal(source.includes('primitive("identity-locked-honey-art"'), true);
});

test("the control room contains touch, combat, telegraph, obstacle and exit behavior", () => {
  const source = readFileSync(join(root, "apps/playcanvas-spike/src/main.js"), "utf8");
  assert.equal(source.includes('canvas.addEventListener("pointerdown"'), true);
  assert.equal(source.includes("resolveActorPosition"), true);
  assert.equal(source.includes("enemy.telegraph"), true);
  assert.equal(source.includes("attackCooldown"), true);
  assert.equal(source.includes("roomCleared"), true);
  assert.equal(source.includes("exitDoor.setPosition"), true);
  assert.equal(source.includes("spawnShurikenVolley"), true);
  assert.equal(source.includes("weaponMode"), true);
});

test("mobile quality tiers bound pixel ratio, particles, shadows and target FPS", () => {
  const low = createMobileQualityProfile({ deviceMemory: 2, devicePixelRatio: 3 });
  const medium = createMobileQualityProfile({ deviceMemory: 6, devicePixelRatio: 3 });
  const high = createMobileQualityProfile({ deviceMemory: 12, devicePixelRatio: 3 });
  const reduced = createMobileQualityProfile({ deviceMemory: 12, devicePixelRatio: 3, reducedMotion: true });
  assert.deepEqual([low.tier, low.maxPixelRatio, low.targetFps], ["low", 1, 30]);
  assert.deepEqual([medium.tier, medium.maxPixelRatio, medium.targetFps], ["medium", 1.5, 60]);
  assert.deepEqual([high.tier, high.maxPixelRatio, high.targetFps], ["high", 2, 60]);
  assert.equal(reduced.emberCount, 0);
  assert.equal(low.shadowResolution < high.shadowResolution, true);
});

test("room boundaries clamp actors without producing non-finite coordinates", () => {
  assert.deepEqual(clampActorToRoom({ x: -99, z: 99 }, 0.5), {
    x: ROOM_BOUNDS.minX + 0.5,
    z: ROOM_BOUNDS.maxZ - 0.5,
  });
  const malformed = clampActorToRoom({ x: Number.NaN, z: Number.POSITIVE_INFINITY }, 0.5);
  assert.equal(Number.isFinite(malformed.x), true);
  assert.equal(Number.isFinite(malformed.z), true);
});

test("circle collision pushes actors out of every authored 3D obstacle", () => {
  for (const obstacle of ROOM_OBSTACLES) {
    const result = resolveCircleVsAabb({ x: obstacle.x, z: obstacle.z }, 0.5, obstacle);
    const outsideX = result.x <= obstacle.x - obstacle.halfWidth - 0.5
      || result.x >= obstacle.x + obstacle.halfWidth + 0.5;
    const outsideZ = result.z <= obstacle.z - obstacle.halfDepth - 0.5
      || result.z >= obstacle.z + obstacle.halfDepth + 0.5;
    assert.equal(outsideX || outsideZ, true, obstacle.id);
  }
});

test("combined room resolution remains bounded after overlapping an obstacle", () => {
  const obstacle = ROOM_OBSTACLES[0];
  const result = resolveActorPosition({ x: obstacle.x, z: obstacle.z }, 0.48);
  assert.equal(result.x >= ROOM_BOUNDS.minX && result.x <= ROOM_BOUNDS.maxX, true);
  assert.equal(result.z >= ROOM_BOUNDS.minZ && result.z <= ROOM_BOUNDS.maxZ, true);
  assert.notDeepEqual(result, { x: obstacle.x, z: obstacle.z });
});

test("PlayCanvas hero motion maps all eight movement directions to approved atlas cells", () => {
  const vectors = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1],
  ];
  assert.deepEqual(vectors.map(([x, z]) => getHeroDirection(x, z)), HERO_DIRECTIONS);
  const frames = HERO_DIRECTIONS.map((direction) => getHeroAtlasFrame({
    state: "attack",
    direction,
  }));
  assert.equal(new Set(frames.map((frame) => frame.index)).size, 8);
  assert.equal(frames.every((frame) => frame.row >= 4 && frame.row <= 5), true);
});

test("PlayCanvas run cycle alternates planted and stride poses without changing direction", () => {
  const planted = getHeroAtlasFrame({ state: "run", direction: "south", animationClock: 0 });
  const stride = getHeroAtlasFrame({ state: "run", direction: "south", animationClock: 0.12 });
  assert.equal(planted.row, 0);
  assert.equal(stride.row, 2);
  assert.equal(planted.column, stride.column);
});

test("PlayCanvas atlas UVs select exactly one finite cell", () => {
  const uv = getHeroAtlasUv(getHeroAtlasFrame({ state: "attack", direction: "north-east" }));
  assert.deepEqual(uv, {
    scaleX: 0.25,
    scaleY: 1 / 6,
    offsetX: 0.75,
    offsetY: 0,
  });
  assert.equal(Object.values(uv).every(Number.isFinite), true);
});

test("Honey Badger PlayCanvas weapons keep distinct bounded combat identities", () => {
  const katana = getWeaponProfile("katana");
  const shuriken = getWeaponProfile("shuriken");
  assert.equal(katana.range < shuriken.range, true);
  assert.equal(katana.damage > shuriken.damage, true);
  assert.equal(shuriken.spread.length, 3);
  assert.equal(getWeaponProfile("unknown"), katana);
});

test("shuriken volley produces three normalized finite directions", () => {
  const directions = createVolleyDirections(2, -3, getWeaponProfile("shuriken").spread);
  assert.equal(directions.length, 3);
  for (const direction of directions) {
    assert.equal(Number.isFinite(direction.x) && Number.isFinite(direction.z), true);
    assert.equal(Math.abs(Math.hypot(direction.x, direction.z) - 1) < 0.000001, true);
  }
  assert.deepEqual(createVolleyDirections(0, 0, [0]), []);
});
