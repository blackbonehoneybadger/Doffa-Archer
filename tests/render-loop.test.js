import test from "node:test";
import assert from "node:assert/strict";

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
}

test("render loop sleeps outside simulation and resumes without duplicate frames", async () => {
  const previousCanvas = globalThis.HTMLCanvasElement;
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousAnimationFrame = globalThis.requestAnimationFrame;
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
    await Promise.resolve();
    await Promise.resolve();

    const frames = [];
    let nextFrameId = 0;
    globalThis.requestAnimationFrame = (callback) => {
      frames.push(callback);
      nextFrameId += 1;
      return nextFrameId;
    };
    let draws = 0;
    let updates = 0;
    game.draw = () => {
      draws += 1;
    };
    game.update = () => {
      updates += 1;
      game.startLoop();
    };

    game.startLoop();
    assert.equal(frames.length, 1);
    frames.shift()(1_000);
    assert.equal(draws, 1);
    assert.equal(updates, 0);
    assert.equal(frames.length, 0, "idle mode must not request another frame");
    assert.equal(game.frameRequest, 0);

    game.mode = "running";
    game.startLoop();
    assert.equal(frames.length, 1);
    frames.shift()(1_016);
    assert.equal(frames.length, 1);
    frames.shift()(1_050);
    assert.ok(updates >= 1);
    assert.equal(frames.length, 1, "startLoop during update must not duplicate the next frame");

    game.setPaused(true);
    frames.shift()(1_066);
    assert.equal(frames.length, 0, "paused mode must let the render loop sleep");
    game.setPaused(false);
    assert.equal(frames.length, 1, "unpausing must restart rendering");
  } finally {
    globalThis.HTMLCanvasElement = previousCanvas;
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
    globalThis.requestAnimationFrame = previousAnimationFrame;
  }
});

test("hidden tabs stop simulation and resume without catch-up", async () => {
  const previousCanvas = globalThis.HTMLCanvasElement;
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousAnimationFrame = globalThis.requestAnimationFrame;
  let visibilityHandler = null;
  const documentState = {
    hidden: false,
    addEventListener(type, listener) {
      if (type === "visibilitychange") {
        visibilityHandler = listener;
      }
    },
  };
  globalThis.HTMLCanvasElement = FakeCanvas;
  globalThis.window = { addEventListener() {} };
  globalThis.document = documentState;

  try {
    const game = new DoffaGame({
      canvas: new FakeCanvas(),
      profileStore: new ProfileStore(new MemoryStorage()),
      onHud() {},
      onProfile() {},
      onAbilityChoice() {},
      onRunEnd() {},
    });
    await Promise.resolve();
    await Promise.resolve();

    const frames = [];
    globalThis.requestAnimationFrame = (callback) => {
      frames.push(callback);
      return frames.length;
    };
    let draws = 0;
    let updates = 0;
    game.draw = () => {
      draws += 1;
    };
    game.update = () => {
      updates += 1;
    };
    game.mode = "running";
    game.startLoop();
    assert.equal(frames.length, 1);

    documentState.hidden = true;
    visibilityHandler();
    frames.shift()(10_000);
    assert.equal(updates, 0, "combat must not advance in a hidden tab");
    assert.equal(draws, 0, "hidden frames must not repaint the canvas");
    assert.equal(frames.length, 0, "hidden combat must not schedule another frame");
    game.startLoop();
    assert.equal(frames.length, 0, "asset completions cannot wake a hidden tab");

    documentState.hidden = false;
    visibilityHandler();
    assert.equal(frames.length, 1, "visibility restore must schedule exactly one frame");
    frames.shift()(20_000);
    assert.equal(updates, 0, "the first visible frame must reset elapsed time");
    assert.equal(draws, 1);
    assert.equal(frames.length, 1, "live rendering resumes after the reset frame");
  } finally {
    globalThis.HTMLCanvasElement = previousCanvas;
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
    globalThis.requestAnimationFrame = previousAnimationFrame;
  }
});
