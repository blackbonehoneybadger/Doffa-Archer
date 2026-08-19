import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_HERO_LEVEL,
  calculateRunHeroXp,
  getHeroLevelMultiplier,
  getHeroXpRequirement,
  grantHeroXp,
  normalizeHeroProgress,
  normalizeHeroProgressMap,
} from "../src/game/progression.js";

test("hero XP curve and run awards are deterministic", () => {
  assert.equal(getHeroXpRequirement(1), 100);
  assert.equal(getHeroXpRequirement(2), 135);
  assert.equal(calculateRunHeroXp({ roomsCleared: 6, bossDefeated: true }), 200);
  assert.equal(calculateRunHeroXp({ roomsCleared: 3, bossDefeated: false }), 60);
  assert.equal(getHeroLevelMultiplier(6), 1.1);
});

test("XP grants can cross multiple levels without losing overflow", () => {
  const result = grantHeroXp({ level: 1, xp: 0 }, 250);
  assert.deepEqual(result, {
    level: 3,
    xp: 15,
    levelsGained: 2,
    xpAwarded: 250,
  });
  assert.equal(Object.isFrozen(result), true);
});

test("hero progress rejects impossible local values and keeps a complete roster", () => {
  assert.deepEqual(normalizeHeroProgress({ level: -8, xp: 9_000 }), { level: 1, xp: 99 });
  assert.deepEqual(normalizeHeroProgress({ level: 999, xp: 500 }), { level: MAX_HERO_LEVEL, xp: 0 });

  const roster = normalizeHeroProgressMap({ pata: { level: 4, xp: 44 }, unknown: { level: 20 } });
  assert.equal(roster.pata.level, 4);
  assert.equal(roster.pata.xp, 44);
  assert.equal(roster["honey-badger"].level, 1);
  assert.equal(Object.hasOwn(roster, "unknown"), false);
});
