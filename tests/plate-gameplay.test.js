import test from "node:test";
import assert from "node:assert/strict";

import { VIEWPORT } from "../src/config/game-config.js";
import {
  getGameplayCollisionObstacles,
  PLATE_PLAY_BOUNDS,
  resolvePlayBounds,
  roomHasAuthoredPlate,
} from "../src/game/plate-gameplay.js";

test("authored room plates disable procedural collision volumes", () => {
  const roomDefinition = Object.freeze({
    id: "forge-lava-hall",
    environment: "lava",
  });
  assert.equal(roomHasAuthoredPlate(roomDefinition, 1), true);
  assert.equal(resolvePlayBounds(true), PLATE_PLAY_BOUNDS);
  assert.notEqual(PLATE_PLAY_BOUNDS.top, VIEWPORT.arena.top);
});

test("gameplay collision keeps only visible destructibles", () => {
  const staticObstacle = Object.freeze({ x: 100, y: 400, width: 80, height: 80, kind: "pillar" });
  const destructible = Object.freeze({
    alive: true,
    x: 300,
    y: 500,
    width: 64,
    height: 64,
  });
  const obstacles = getGameplayCollisionObstacles([destructible, { ...destructible, alive: false }]);
  assert.equal(obstacles.length, 1);
  assert.equal(obstacles[0], destructible);
  assert.equal(getGameplayCollisionObstacles([staticObstacle]).length, 0);
});

test("rooms without catalog plates keep legacy arena bounds", () => {
  assert.equal(roomHasAuthoredPlate({ id: "missing", environment: "missing" }, 1), false);
  assert.equal(resolvePlayBounds(false), VIEWPORT.arena);
});
