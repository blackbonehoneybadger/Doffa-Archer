import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_TOUR_ID } from "../src/config/game-config.js";
import { ProfileStore } from "../src/core/profile-store.js";
import { getEnemyDefinition } from "../src/game/content.js";
import { DoffaGame } from "../src/game/game.js";

const ROOTFALL_TOUR_ID = "rootfall-jungle";

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

    assert.equal(result.xpReward, 1_080);
    assert.equal(result.heroLevelBefore, 1);
    assert.equal(result.heroLevelAfter, 6);
    assert.equal(result.equipmentDrop.itemId, "tempered-grip");
    assert.equal(store.profile.heroProgress["honey-badger"].level, 6);
    assert.equal(store.profile.heroProgress["honey-badger"].xp, 230);
    assert.equal(store.profile.inventory.length, 5);
    assert.equal(store.profile.inventory.at(-1).instanceId, result.equipmentDrop.instanceId);
  } finally {
    globalThis.HTMLCanvasElement = previousCanvas;
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});

test("a completed Rootfall run starts its own content and persists isolated tour progress", () => {
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

    assert.equal(game.beginRun(ROOTFALL_TOUR_ID, "honey-badger").ok, true);
    assert.equal(game.tour.id, ROOTFALL_TOUR_ID);
    assert.equal(game.roomDefinition.environment, "canopy");
    assert.ok(game.enemies.length > 0);
    assert.ok(
      game.enemies.every((enemy) => getEnemyDefinition(enemy.type)?.family === "rootfall_jungle"),
    );

    game.clearedRooms = game.tour.rooms.length;
    game.room = game.tour.rooms.length;
    game.score = 7_500;
    game.rng = {
      next: () => 0.5,
      pick: (items) => items[0],
    };
    game.finishRun(true);

    assert.equal(result.tour.id, ROOTFALL_TOUR_ID);
    assert.equal(result.roomsCleared, 50);
    assert.equal(result.bossDefeated, true);
    assert.equal(result.beanReward, 50);
    assert.equal(result.receipt.tourId, ROOTFALL_TOUR_ID);
    assert.equal(result.receipt.roomsCleared, 50);
    assert.equal(result.receipt.bossDefeated, true);
    assert.deepEqual(store.profile.tourProgress[ROOTFALL_TOUR_ID], {
      bestRoom: 50,
      bossesDefeated: 1,
    });
    assert.equal(store.profile.tourProgress["forge-depths"], undefined);
    assert.equal(store.profile.beans, 55);
  } finally {
    globalThis.HTMLCanvasElement = previousCanvas;
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});
