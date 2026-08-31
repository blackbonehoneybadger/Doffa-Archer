import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_RUN_LEVEL,
  getRunXpRequirement,
  grantRunXp,
  normalizeRunProgress,
} from "../src/game/run-progression.js";

test("run XP requirements grow predictably and stop at the level cap", () => {
  assert.equal(getRunXpRequirement(1), 40);
  assert.equal(getRunXpRequirement(2), 68);
  assert.equal(getRunXpRequirement(11), 320);
  assert.equal(getRunXpRequirement(MAX_RUN_LEVEL), 0);
});

test("one XP grant can queue multiple run levels without losing overflow", () => {
  const result = grantRunXp({ level: 1, xp: 35 }, 168);
  assert.equal(result.level, 3);
  assert.equal(result.xp, 95);
  assert.equal(result.levelsGained, 2);
  assert.equal(result.requirement, 96);
});

test("run progress rejects impossible local values and clamps the cap", () => {
  assert.deepEqual(normalizeRunProgress({ level: -4, xp: -100 }), { level: 1, xp: 0 });
  assert.deepEqual(normalizeRunProgress({ level: 999, xp: 99_999 }), {
    level: MAX_RUN_LEVEL,
    xp: 0,
  });
});
