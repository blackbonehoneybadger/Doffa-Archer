import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateRunBeanReward,
  calculateTapReward,
  canEnterRun,
  getRunEntryCost,
} from "../src/core/economy.js";

test("tap rewards are deterministic and integer-only", () => {
  assert.equal(calculateTapReward(), 1);
  assert.equal(calculateTapReward(12), 12);
  assert.throws(() => calculateTapReward(-1), RangeError);
  assert.throws(() => calculateTapReward(1.2), RangeError);
});

test("entry requires the full configured bean cost", () => {
  assert.equal(getRunEntryCost(), 25);
  assert.equal(canEnterRun(24), false);
  assert.equal(canEnterRun(25), true);
});

test("victory and defeat rewards remain off-chain bean values", () => {
  assert.equal(calculateRunBeanReward({ roomsCleared: 6, bossDefeated: true }), 32);
  assert.equal(calculateRunBeanReward({ roomsCleared: 2, bossDefeated: false }), 8);
  assert.throws(
    () => calculateRunBeanReward({ roomsCleared: 2, bossDefeated: "yes" }),
    TypeError,
  );
});
