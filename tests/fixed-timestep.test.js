import test from "node:test";
import assert from "node:assert/strict";

import {
  FIXED_STEP_SECONDS,
  MAX_STEPS_PER_FRAME,
  consumeFixedSteps,
} from "../src/core/fixed-timestep.js";

test("a slow rendered frame catches up with bounded fixed simulation steps", () => {
  const deltas = [];
  const result = consumeFixedSteps(0, 1, (delta) => deltas.push(delta));

  assert.equal(result.steps, MAX_STEPS_PER_FRAME);
  assert.equal(deltas.length, MAX_STEPS_PER_FRAME);
  assert.equal(deltas.every((delta) => delta === FIXED_STEP_SECONDS), true);
  assert.ok(result.accumulator < FIXED_STEP_SECONDS);
});

test("simulation stops immediately when the run changes state", () => {
  let active = true;
  let calls = 0;
  const result = consumeFixedSteps(
    0,
    0.2,
    () => {
      calls += 1;
      active = false;
    },
    () => active,
  );

  assert.equal(calls, 1);
  assert.equal(result.steps, 1);
});
