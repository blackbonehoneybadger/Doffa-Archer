import test from "node:test";
import assert from "node:assert/strict";

import { ProfileStore } from "../src/core/profile-store.js";
import { getRoomAssetWindow } from "../src/game/asset-window.js";
import { getTourDefinition } from "../src/game/content.js";
import { DoffaGame } from "../src/game/game.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

class FakeCanvas {
  getContext() {
    return {};
  }

  addEventListener() {}

  setPointerCapture() {}

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 720, height: 1280 };
  }
}

function sorted(values) {
  return [...values].sort();
}

test("room asset window decodes current combat with current and next backgrounds", () => {
  const tour = getTourDefinition("rootfall-jungle");
  const window = getRoomAssetWindow(tour, 1);
  const expectedEnemies = new Set(tour.rooms[0].enemies);
  const expectedDestructibles = new Set(
    tour.rooms[0].destructibles.map((item) => item.type),
  );

  assert.deepEqual(window.rooms, tour.rooms.slice(0, 2));
  assert.equal(window.combatRoom, tour.rooms[0]);
  assert.deepEqual(sorted(window.enemyIds), sorted(expectedEnemies));
  assert.deepEqual(sorted(window.destructibleTypes), sorted(expectedDestructibles));
  assert.equal(window.enemyIds.has("rootfall_tyrant"), false);
  assert.equal(window.roomSprites.size, 2);
});

test("cleared-room window releases enemies but retains visible props while prefetching next combat", () => {
  const tour = getTourDefinition("rootfall-jungle");
  const window = getRoomAssetWindow(tour, 1, { combatRoomOffset: 1 });
  const visibleAndNextDestructibles = new Set([
    ...tour.rooms[0].destructibles.map((item) => item.type),
    ...tour.rooms[1].destructibles.map((item) => item.type),
  ]);

  assert.equal(window.combatRoom, tour.rooms[1]);
  assert.deepEqual(sorted(window.enemyIds), sorted(new Set(tour.rooms[1].enemies)));
  assert.deepEqual(
    sorted(window.destructibleTypes),
    sorted(visibleAndNextDestructibles),
  );
  assert.equal(window.roomSprites.size, 2);
});

test("the final-room asset window never crosses the tour boundary", () => {
  const tour = getTourDefinition("hollow-roastery");
  const window = getRoomAssetWindow(tour, tour.rooms.length);

  assert.deepEqual(window.rooms, [tour.rooms.at(-1)]);
  assert.deepEqual(sorted(window.enemyIds), ["hollow_roaster"]);
  assert.equal(window.roomSprites.size, 1);
});

test("invalid asset window requests are empty and side-effect free", () => {
  for (const [tour, roomNumber, options] of [
    [null, 1, undefined],
    [getTourDefinition("hollow-roastery"), 0, undefined],
    [getTourDefinition("hollow-roastery"), 1, { lookahead: -1 }],
    [getTourDefinition("hollow-roastery"), 1, { combatRoomOffset: 2 }],
  ]) {
    const window = getRoomAssetWindow(tour, roomNumber, options);
    assert.equal(window.rooms.length, 0);
    assert.equal(window.combatRoom, null);
    assert.equal(window.enemyIds.size, 0);
    assert.equal(window.destructibleTypes.size, 0);
    assert.equal(window.roomSprites.size, 0);
  }
});

test("game evicts assets that fall outside the two-room window", () => {
  const previousCanvas = globalThis.HTMLCanvasElement;
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.HTMLCanvasElement = FakeCanvas;
  globalThis.window = { addEventListener() {} };
  globalThis.document = { addEventListener() {}, hidden: false };

  try {
    const game = new DoffaGame({
      canvas: new FakeCanvas(),
      profileStore: new ProfileStore(new MemoryStorage()),
      onHud() {},
      onProfile() {},
      onAbilityChoice() {},
      onRunEnd() {},
    });
    assert.equal(game.loadedHeroId, null, "home screen must not decode combat sheets");
    assert.equal(game.beginRun("rootfall-jungle", "honey-badger").ok, true);
    const firstWindow = getRoomAssetWindow(game.tour, 1);
    const firstRoomSprites = [...firstWindow.roomSprites];
    assert.deepEqual(sorted(game.enemySprites.keys()), sorted(firstWindow.enemyIds));
    assert.deepEqual(sorted(game.destructibleSprites.keys()), sorted(firstWindow.destructibleTypes));
    assert.deepEqual(sorted(game.roomSprites.keys()), sorted(firstWindow.roomSprites));

    game.enemies = [];
    game.handleRoomClear();
    const prefetchedWindow = getRoomAssetWindow(game.tour, 1, { combatRoomOffset: 1 });
    assert.deepEqual(sorted(game.enemySprites.keys()), sorted(prefetchedWindow.enemyIds));
    assert.deepEqual(
      sorted(game.destructibleSprites.keys()),
      sorted(prefetchedWindow.destructibleTypes),
    );
    for (const destructible of game.destructibles) {
      assert.equal(
        game.destructibleSprites.has(destructible.type),
        true,
        "a surviving room prop must keep its art until the player exits",
      );
    }

    game.room = 49;
    game.mode = "running";
    game.spawnRoom(49);
    const finalWindow = getRoomAssetWindow(game.tour, 49);
    assert.deepEqual(sorted(game.enemySprites.keys()), sorted(finalWindow.enemyIds));
    assert.deepEqual(sorted(game.destructibleSprites.keys()), sorted(finalWindow.destructibleTypes));
    assert.deepEqual(sorted(game.roomSprites.keys()), sorted(finalWindow.roomSprites));
    assert.equal(firstRoomSprites.some((sprite) => game.roomSprites.has(sprite)), false);

    game.finishRun(false);
    assert.equal(game.enemySprites.size, 0);
    assert.equal(game.enemyMotionSprites.size, 0);
    assert.equal(game.destructibleSprites.size, 0);
    assert.equal(game.roomSprites.size, 0);
    assert.equal(game.loadedHeroId, null);
    assert.equal(game.animationPageCache.size, 0);
  } finally {
    globalThis.HTMLCanvasElement = previousCanvas;
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});
