import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_TOUR_ID,
  ENEMY_CATALOG,
  TOURS,
  getEnemyDefinition,
  getRoomDefinition,
  getTourDefinition,
  validateContentCatalog,
} from "../src/game/content.js";

test("the production content catalog has valid tour and boss boundaries", () => {
  assert.deepEqual(validateContentCatalog(), []);

  const tour = getTourDefinition(DEFAULT_TOUR_ID);
  assert.equal(tour.rooms.length, 6);
  assert.equal(getRoomDefinition(DEFAULT_TOUR_ID, 1).name, "ASH INTAKE");

  const finalRoom = getRoomDefinition(DEFAULT_TOUR_ID, tour.rooms.length);
  assert.equal(finalRoom.boss, true);
  assert.equal(finalRoom.enemies.length, 1);
  assert.equal(getEnemyDefinition(finalRoom.enemies[0]).boss, true);
  assert.equal(Object.isFrozen(tour.rooms), true);
});

test("catalog validation catches cross-tour enemy reuse", () => {
  const copiedTour = {
    ...TOURS[0],
    id: "foreign-tour",
    family: "foreign-family",
  };
  const errors = validateContentCatalog([copiedTour], ENEMY_CATALOG);
  assert.equal(errors.some((error) => error.includes("does not belong")), true);
});
