import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_TOUR_ID } from "../src/config/game-config.js";
import { ProfileStore } from "../src/core/profile-store.js";
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

test("a completed run persists hero XP and a guaranteed local boss drop", () => {
  const previousCanvas = globalThis.HTMLCanvasElement;
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.HTMLCanvasElement = FakeCanvas;
  globalThis.window = { addEventListener() {} };
  globalThis.document = { addEventListener() {}, hidden: false };

  try {
    const store = new ProfileStore(new MemoryStorage());
    let result = null;
    const game = new DoffaGame({
      canvas: new FakeCanvas(),
      profileStore: store,
      onHud() {},
      onProfile() {},
      onAbilityChoice() {},
      onRunEnd(nextResult) {
        result = nextResult;
      },
    });

    assert.equal(game.beginRun(DEFAULT_TOUR_ID, "honey-badger").ok, true);
    game.clearedRooms = game.tour.rooms.length;
    game.room = game.tour.rooms.length;
    game.score = 3_000;
    game.rng = {
      next: () => 0.5,
      pick: (items) => items[0],
    };
    game.finishRun(true);

    assert.equal(result.xpReward, 200);
    assert.equal(result.heroLevelBefore, 1);
    assert.equal(result.heroLevelAfter, 2);
    assert.equal(result.equipmentDrop.itemId, "tempered-grip");
    assert.equal(store.profile.heroProgress["honey-badger"].level, 2);
    assert.equal(store.profile.heroProgress["honey-badger"].xp, 100);
    assert.equal(store.profile.inventory.length, 5);
    assert.equal(store.profile.inventory.at(-1).instanceId, result.equipmentDrop.instanceId);
  } finally {
    globalThis.HTMLCanvasElement = previousCanvas;
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});
