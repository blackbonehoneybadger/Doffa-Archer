import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  ANTAGONIST,
  GAME_NAME,
  HERO_IDENTITY,
  SITE,
  SLICE_LOOT_POLICY,
  TOUR,
  paintGlyphRow,
} from "../arena3d/src/identity.js";
import { createRng } from "../arena3d/src/sim/rng.js";
import { pointInArc, resolveCircleWorld } from "../arena3d/src/sim/collision.js";
import {
  applyInput,
  createRoom08Obstacles,
  createSliceWorld,
  replay,
  snapshotSlice,
  stepSlice,
} from "../arena3d/src/sim/slice.js";
import { boundsOf, mergeMeshes, vertexCount } from "../arena3d/src/geo/primitives.js";
import {
  createHoneyBadgerMeshes,
  createRazorMantisMesh,
  createRootStalkerMesh,
  createRoom08Geometry,
  createSeedSpitterMesh,
} from "../arena3d/src/geo/catalog.js";
import { createSliceGltfDocument, gltfHasImagePlaneBackground } from "../arena3d/src/geo/gltf.js";
import { normalizeSliceLocale, sliceText } from "../arena3d/src/i18n.js";

const root = process.cwd();

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

test("true-3D slice locks public names and Honey Badger identity", () => {
  assert.equal(GAME_NAME, "DOFA ARENA");
  assert.equal(ANTAGONIST, "KAPRIZORD");
  assert.equal(SITE, "dofa.coffee");
  assert.equal(TOUR.name, "ROOTFALL JUNGLE");
  assert.equal(TOUR.room, 8);
  assert.equal(HERO_IDENTITY.backText, "STRONG ROOTS");
  assert.equal(HERO_IDENTITY.backTextMirror, false);
  assert.equal(HERO_IDENTITY.head.kind, "placeholder");
  assert.equal(HERO_IDENTITY.heightMeters, 1.7);
  assert.equal(HERO_IDENTITY.weaponSheet, "black-steel-katana-shuriken-v1");
  assert.equal(SLICE_LOOT_POLICY.claimable, false);
  assert.equal(SLICE_LOOT_POLICY.wallet, false);
});

test("STRONG ROOTS paints as readable glyphs and is not stored mirrored", () => {
  const forward = paintGlyphRow("STRONG ROOTS", { invert: false });
  assert.equal(forward.text, "STRONG ROOTS");
  assert.equal(forward.mirrored, false);
  assert.equal(HERO_IDENTITY.backTextMirror, false);
  const flipped = new Uint8ClampedArray(forward.data.length);
  for (let y = 0; y < forward.height; y += 1) {
    for (let x = 0; x < forward.width; x += 1) {
      const src = (y * forward.width + x) * 4;
      const dst = (y * forward.width + (forward.width - 1 - x)) * 4;
      flipped[dst] = forward.data[src];
      flipped[dst + 1] = forward.data[src + 1];
      flipped[dst + 2] = forward.data[src + 2];
      flipped[dst + 3] = forward.data[src + 3];
    }
  }
  assert.equal(Buffer.from(forward.data).equals(Buffer.from(flipped)), false);
  const opaque = [...forward.data].filter((_, index) => index % 4 === 3 && forward.data[index] > 0).length;
  assert.ok(opaque > 80);
});

test("RU/EN slice shell copy never ships TAP BEAN or the 2D game title", () => {
  assert.equal(normalizeSliceLocale("en-US"), "en");
  assert.equal(normalizeSliceLocale("fr"), "ru");
  assert.equal(sliceText("en", "game"), "DOFA ARENA");
  assert.equal(sliceText("ru", "game"), "DOFA ARENA");
  assert.match(sliceText("en", "antagonist"), /KAPRIZORD/);
  assert.match(sliceText("ru", "loot"), /\$DOFA/);
  for (const locale of ["en", "ru"]) {
    const blob = ["game", "tourLine", "loot", "antagonist", "site", "placeholderHead"]
      .map((key) => sliceText(locale, key))
      .join(" ");
    assert.equal(blob.includes("TAP BEAN"), false);
    assert.equal(blob.includes("DOFFA Heroes"), false);
    assert.equal(blob.includes("Caprizord"), false);
  }
});

test("seeded room 08 is deterministic and uses unique enemy meshes", () => {
  const a = snapshotSlice(createSliceWorld({ seed: TOUR.seed }));
  const b = snapshotSlice(createSliceWorld({ seed: TOUR.seed }));
  assert.deepEqual(a, b);
  const kinds = a.enemies.map((enemy) => enemy.kind).sort();
  assert.deepEqual(kinds, ["razor_mantis", "root_stalker", "root_stalker", "seed_spitter", "seed_spitter"]);
  assert.equal(new Set(a.enemies.map((enemy) => enemy.uniqueMesh)).size, 3);
  assert.equal(a.player.hp, 2450);
});

test("cover collision stops the player from walking through root blocks", () => {
  const world = createSliceWorld();
  const box = createRoom08Obstacles().find((item) => item.id === "root-cover-west");
  const resolved = resolveCircleWorld((box.minX + box.maxX) / 2, (box.minZ + box.maxZ) / 2, 0.38, [box]);
  assert.equal(resolved.hit, true);
  assert.ok(resolved.x <= box.minX - 0.37 || resolved.x >= box.maxX + 0.37 || resolved.z <= box.minZ - 0.37 || resolved.z >= box.maxZ + 0.37);
  world.player.x = 0;
  world.player.z = 7.2;
  applyInput(world, { moveX: -1, moveZ: 0 });
  for (let i = 0; i < 180; i += 1) {
    stepSlice(world);
  }
  assert.ok(world.player.x > -6.2);
});

test("telegraphs fire before seed damage and explicit attack is required", () => {
  const idle = replay(Array.from({ length: 90 }, () => ({ moveX: 0, moveZ: 0, attack: false })));
  const events = [];
  const world = createSliceWorld();
  for (let i = 0; i < 180; i += 1) {
    stepSlice(world);
    events.push(...world.events.map((event) => event.type));
  }
  const telegraphAt = events.indexOf("telegraph");
  const fireAt = events.indexOf("projectile-fire");
  assert.ok(telegraphAt >= 0);
  assert.ok(fireAt > telegraphAt);
  assert.equal(idle.player.swinging, false);
  const swinging = replay([{ attack: true }]);
  assert.equal(swinging.player.swinging, true);
  assert.ok(pointInArc(0, 0, 0, -1, 2.15, Math.PI * 0.42, 0, -1.5));
  assert.equal(pointInArc(0, 0, 0, -1, 2.15, Math.PI * 0.42, 0, 1.5), false);
});

test("the same input tape replays to the same snapshot", () => {
  const tape = Array.from({ length: 40 }, (_, index) => ({
    moveX: index < 20 ? 0.4 : -0.2,
    moveZ: -0.7,
    attack: index % 11 === 0,
  }));
  const first = snapshotSlice(replay(tape));
  const second = snapshotSlice(replay(tape));
  assert.deepEqual(first, second);
});

test("procedural glTF scene is real geometry, not a concept-art plane", () => {
  const rng = createRng(TOUR.seed);
  const hero = createHoneyBadgerMeshes();
  const room = createRoom08Geometry(rng);
  const enemies = {
    mantis: createRazorMantisMesh(),
    spitter: createSeedSpitterMesh(),
    stalker: createRootStalkerMesh(),
  };
  const assembled = mergeMeshes([hero.body, hero.garment, hero.hair, hero.steel], "honey-badger-assembled");
  assert.ok(vertexCount(hero.body) > 80);
  assert.ok(boundsOf(assembled).height > 1.45);
  assert.ok(vertexCount(room.tiles) > 200);
  assert.ok(boundsOf(room.tiles).depth > 10);
  assert.notEqual(enemies.mantis.name, enemies.spitter.name);
  assert.notEqual(enemies.spitter.name, enemies.stalker.name);
  const document = createSliceGltfDocument({ hero, room, enemies });
  assert.equal(document.extras.game, "DOFA ARENA");
  assert.equal(document.extras.backText, "STRONG ROOTS");
  assert.equal(document.extras.backTextMirror, false);
  assert.equal(document.extras.head.kind, "placeholder");
  assert.equal(document.extras.conceptImageAsPlane, false);
  assert.equal(gltfHasImagePlaneBackground(document), false);
  assert.ok(document.materials.every((material) => material.pbrMetallicRoughness));
  assert.ok(document.meshes.length >= 10);
});

test("katana swing can defeat a close stalker without token or wallet state", () => {
  const world = createSliceWorld();
  const stalker = world.enemies.find((enemy) => enemy.id === "root-stalker-west");
  world.player.x = stalker.x;
  world.player.z = stalker.z + 1.2;
  world.player.facingX = 0;
  world.player.facingZ = -1;
  let swings = 0;
  while (stalker.alive && swings < 8) {
    applyInput(world, { attack: true });
    for (let i = 0; i < 20; i += 1) {
      stepSlice(world);
    }
    swings += 1;
  }
  assert.equal(stalker.alive, false);
  assert.equal(SLICE_LOOT_POLICY.token, false);
  assert.equal("wallet" in world, false);
});

test("arena3d sources do not embed the concept JPEG or fake-3D planes", () => {
  const files = walk(join(root, "arena3d")).filter((file) => /\.(js|html|css|webmanifest)$/.test(file));
  const blob = files.map((file) => readFileSync(file, "utf8")).join("\n");
  assert.equal(blob.includes("v01-dofa-arena-rootfall-08"), false);
  assert.equal(blob.includes("CreateGroundFromHeightMap"), false);
  assert.equal(blob.includes("concept.jpg"), false);
  assert.match(blob, /DOFA ARENA/);
  assert.match(blob, /KAPRIZORD/);
  assert.match(blob, /STRONG ROOTS/);
  assert.match(blob, /placeholder/i);
  const uiBlob = files
    .filter((file) => !file.endsWith("identity.js"))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  assert.equal(uiBlob.includes("TAP BEAN"), false);
  assert.equal(uiBlob.includes("Caprizord"), false);
  assert.equal(uiBlob.includes("DOFFA Heroes"), false);
});

test("2D prototype home still launches and links the parallel 3D slice", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /id="tap-button"/);
  assert.match(html, /href="\/arena3d\/"/);
  assert.match(html, /DOFA ARENA · TRUE 3D SLICE/);
  assert.match(html, /PROTOTYPE 0\.19\.0/);
});
