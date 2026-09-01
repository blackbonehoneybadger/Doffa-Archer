import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FORBIDDEN_PUBLIC_NAMES,
  applyI18n,
  normalizeLocale,
  translate,
} from "../src/i18n.js";
import {
  SLICE,
  applyAttackCooldown,
  canAttack,
  createTelegraph,
  damageEnemy,
  hitEnemiesInArc,
  isForbiddenConceptTexture,
  moveToward,
  roomProgressRatio,
  stepTelegraph,
} from "../src/combatLogic.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("3D shell canon uses DOFA ARENA / TOUR 02 / KAPRIZORD vocabulary", () => {
  assert.equal(SLICE.gameName, "DOFA ARENA");
  assert.equal(SLICE.tourCode, "TOUR 02");
  assert.equal(SLICE.tourName, "ROOTFALL JUNGLE");
  assert.equal(SLICE.room, 8);
  assert.equal(SLICE.antagonist, "KAPRIZORD");
  assert.equal(SLICE.token, "$DOFA");
  assert.equal(SLICE.heroName, "HONEY BADGER");
  assert.equal(SLICE.weaponName, "KATANA");
});

test("RU and EN shell strings exist and avoid forbidden legacy public names", () => {
  for (const locale of ["ru", "en"]) {
    assert.equal(translate(locale, "brand"), "DOFA ARENA");
    const blob = [
      translate(locale, "brand"),
      translate(locale, "tourLine"),
      translate(locale, "heroName"),
      translate(locale, "weaponName"),
      translate(locale, "back2d"),
    ].join(" ");
    for (const bad of FORBIDDEN_PUBLIC_NAMES) {
      assert.equal(blob.includes(bad), false, `${locale} leaked ${bad}`);
    }
  }
  assert.equal(normalizeLocale("de"), "ru");
});

test("applyI18n updates data-i18n nodes", () => {
  const rootEl = {
    lang: "",
    querySelectorAll(sel) {
      assert.equal(sel, "[data-i18n]");
      return [
        { getAttribute: () => "brand", textContent: "" },
        { getAttribute: () => "resume", textContent: "" },
      ];
    },
  };
  applyI18n(rootEl, "en");
  assert.equal(rootEl.lang, "en");
});

test("movement and attack helpers are deterministic", () => {
  const moved = moveToward({ x: 0, z: 0 }, { x: 1, z: 0 }, 0.5, 4, 6);
  assert.ok(moved.position.x > 0);
  assert.equal(moved.moving, true);
  assert.equal(canAttack(0), true);
  assert.equal(canAttack(0.2), false);
  assert.equal(applyAttackCooldown(0, 0.1, true), SLICE.attackCooldown);
  const hits = hitEnemiesInArc(
    { x: 0, z: 0, facing: 0 },
    [{ id: "a", x: 0, z: 1, radius: 0.4, alive: true }],
  );
  assert.deepEqual(hits, ["a"]);
});

test("telegraphs fire only after delay (readable combat)", () => {
  let tg = createTelegraph({ x: 1, z: 2, radius: 0.5, delay: 0.4 });
  tg = stepTelegraph(tg, 0.2);
  assert.equal(tg.fired, false);
  tg = stepTelegraph(tg, 0.25);
  assert.equal(tg.fired, true);
});

test("enemy damage removes targets at 0 hp", () => {
  const dead = damageEnemy({ id: "x", hp: 40, alive: true }, 50);
  assert.equal(dead.alive, false);
  assert.equal(dead.hp, 0);
});

test("room progress matches 08/50", () => {
  assert.ok(Math.abs(roomProgressRatio() - 8 / 50) < 1e-9);
});

test("concept quality-bar JPEG paths are rejected as scene textures", () => {
  assert.equal(isForbiddenConceptTexture("docs/references/quality-bar/rootfall-08-target-quality-bar.jpg"), true);
  assert.equal(isForbiddenConceptTexture("./assets/gltf/rootfall-floor-tile.gltf"), false);
});

test("quality-bar and Honey Badger turnaround refs exist as TARGET docs only", () => {
  assert.equal(existsSync(join(root, "../docs/references/quality-bar/rootfall-08-target-quality-bar.jpg")), true);
  assert.equal(existsSync(join(root, "../docs/references/heroes/honey-badger-turnaround-target.jpg")), true);
});

test("index shell never embeds the concept JPEG as a scene/background image", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.equal(html.includes("quality-bar"), false);
  assert.equal(html.includes("rootfall-08-target"), false);
  assert.equal(html.includes("DOFA ARENA"), true);
  assert.equal(/DOFFA Heroes|Doffa-Archer|KAPRIZARD|Caprizord/.test(html), false);
});

test("gltf floor tile asset is present for PBR loader path", () => {
  assert.equal(existsSync(join(root, "public/assets/gltf/rootfall-floor-tile.gltf")), true);
  assert.equal(existsSync(join(root, "public/assets/gltf/rootfall-floor-tile.bin")), true);
  const gltf = JSON.parse(readFileSync(join(root, "public/assets/gltf/rootfall-floor-tile.gltf"), "utf8"));
  assert.equal(gltf.materials[0].pbrMetallicRoughness.roughnessFactor > 0, true);
});

test("hero module keeps STRONG ROOTS non-mirrored and labels placeholder head", () => {
  const heroSrc = readFileSync(join(root, "src/scene/hero.js"), "utf8");
  assert.equal(heroSrc.includes("STRONG ROOTS"), true);
  assert.equal(heroSrc.includes("PLACEHOLDER"), true);
  assert.equal(heroSrc.includes("scaling.x = -1"), false);
  assert.equal(heroSrc.includes("Never mirror"), true);
});
