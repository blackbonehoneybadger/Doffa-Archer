import test from "node:test";
import assert from "node:assert/strict";

import { ProfileStore } from "../src/core/profile-store.js";
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

test("Rootfall runtime dispatches every enemy family into an active telegraph", () => {
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
    assert.equal(game.beginRun(ROOTFALL_TOUR_ID, "honey-badger").ok, true);

    const cases = [
      ["razor_mantis", "pounce-windup", null],
      ["seed_spitter", "seed-windup", "seed-shot"],
      ["root_stalker", "burrow-windup", null],
      ["spore_moth", "spore-windup", null],
      ["briar_jaguar", "elite-windup", "rake-chain"],
      ["mire_bellower", "elite-windup", "tongue-lane"],
      ["orchid_maw", "elite-windup", "petal-clamp"],
      ["strangler_ape", "elite-windup", "vine-charge"],
      ["rootfall_tyrant", "boss-windup", "root-lanes"],
    ];

    for (const [type, expectedState, expectedPattern] of cases) {
      const enemy = game.createEnemy(type, 280, 360, 1);
      enemy.attackTimer = 0;
      game.enemies = [enemy];

      game.updateEnemies(0);

      assert.equal(enemy.state, expectedState, `${type} must enter its telegraph state`);
      assert.equal(enemy.attackPattern, expectedPattern, `${type} must select its opening pattern`);
      assert.ok(enemy.attackAnimation > 0, `${type} must trigger its attack animation`);
    }
  } finally {
    globalThis.HTMLCanvasElement = previousCanvas;
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});
