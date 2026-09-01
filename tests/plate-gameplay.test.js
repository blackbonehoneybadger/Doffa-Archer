import test from "node:test";
import assert from "node:assert/strict";

import { VIEWPORT } from "../src/config/game-config.js";
import {
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

test("rooms without catalog plates keep legacy arena bounds", () => {
  assert.equal(roomHasAuthoredPlate({ id: "missing", environment: "missing" }, 1), false);
  assert.equal(resolvePlayBounds(false), VIEWPORT.arena);
});
