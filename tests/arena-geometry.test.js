import test from "node:test";
import assert from "node:assert/strict";

import {
  circlesOverlap,
  getCircleRectangleCollision,
  isHazardActive,
  resolveCircleAgainstRectangles,
} from "../src/game/arena-geometry.js";

test("solid room obstacles push circular actors outside their bounds", () => {
  const obstacle = { x: 100, y: 100, width: 80, height: 60 };
  const collision = getCircleRectangleCollision({ x: 92, y: 130 }, 20, obstacle);
  assert.equal(Math.round(collision.normalX), -1);
  assert.equal(Math.round(collision.depth), 12);

  const resolved = resolveCircleAgainstRectangles(
    { x: 92, y: 130 },
    20,
    [obstacle],
  );
  assert.equal(resolved.hit, true);
  assert.equal(Math.round(resolved.x), 80);
  assert.equal(Math.round(resolved.y), 130);
  assert.equal(
    getCircleRectangleCollision(resolved, 20, obstacle)?.depth ?? 0,
    0,
  );
});

test("actors centered inside a wall are moved through the nearest face", () => {
  const obstacle = { x: 200, y: 300, width: 120, height: 80 };
  const resolved = resolveCircleAgainstRectangles(
    { x: 210, y: 340 },
    18,
    [obstacle],
  );
  assert.equal(resolved.hit, true);
  assert.equal(resolved.x, 182);
  assert.equal(resolved.y, 340);
});

test("hazards use deterministic active and warning phases", () => {
  const hazard = { interval: 3, activeDuration: 1, phase: 0.25 };
  assert.equal(isHazardActive(hazard, 0), true);
  assert.equal(isHazardActive(hazard, 0.8), false);
  assert.equal(isHazardActive(hazard, 2.8), true);
  assert.equal(circlesOverlap({ x: 0, y: 0 }, 10, { x: 19, y: 0 }, 10), true);
  assert.equal(circlesOverlap({ x: 0, y: 0 }, 10, { x: 21, y: 0 }, 10), false);
});
