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

async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
}

test("runtime pins only pages used by the active draw frame", async () => {
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
    game.mode = "running";
    game.animationPageUsageFrame = 1;
    const pageMap = game.enemyMotionAnimationSprites;
    const page = { width: 1152, height: 2016, getContext() { return {}; } };

    assert.equal(game.requestCachedAnimationPage({
      pageMap,
      localKey: "actor:move-a",
      cacheKey: "test-page:actor:move-a",
      loader: async () => page,
      isRelevant: () => true,
    }), null);
    await settle();
    const record = pageMap.get("actor:move-a");
    assert.equal(record.value, page);
    assert.ok(record.lease);
    assert.equal(game.animationPageCache.getStats().leased, 1);
    assert.equal(game.animationPageCache.byteSize, 1152 * 2016 * 4);

    assert.equal(game.requestCachedAnimationPage({
      pageMap,
      localKey: "actor:move-a",
      cacheKey: "test-page:actor:move-a",
      loader: async () => {
        throw new Error("cached page must not reload");
      },
      isRelevant: () => true,
    }), page);

    game.animationPageUsageFrame = 2;
    game.releaseUnusedAnimationPageLeases();
    assert.equal(record.lease, null);
    assert.equal(game.animationPageCache.getStats().leased, 0);
    assert.equal(game.animationPageCache.has("test-page:actor:move-a"), true);

    game.releaseAnimationPageMap(pageMap);
    assert.equal(game.animationPageCache.has("test-page:actor:move-a"), false);
    assert.equal(page.width, 0);
    assert.equal(page.height, 0);
  } finally {
    globalThis.HTMLCanvasElement = previousCanvas;
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});

test("settling an unused page does not wake choice or paused rendering", async () => {
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
    await settle();
    let loopStarts = 0;
    game.startLoop = () => {
      loopStarts += 1;
    };
    const pageMap = game.enemyMotionAnimationSprites;

    game.mode = "choice";
    game.animationPageUsageFrame = 1;
    game.requestCachedAnimationPage({
      pageMap,
      localKey: "choice:move-a",
      cacheKey: "test-page:choice:move-a",
      loader: async () => ({ width: 16, height: 16, getContext() { return {}; } }),
      isRelevant: () => true,
    });
    await settle();
    assert.equal(loopStarts, 0);
    assert.equal(pageMap.get("choice:move-a")?.status, "cached");
    assert.equal(pageMap.get("choice:move-a")?.lease, null);

    game.mode = "running";
    game.paused = true;
    game.animationPageUsageFrame = 2;
    game.requestCachedAnimationPage({
      pageMap,
      localKey: "paused:move-a",
      cacheKey: "test-page:paused:move-a",
      loader: async () => ({ width: 16, height: 16, getContext() { return {}; } }),
      isRelevant: () => true,
    });
    await settle();
    assert.equal(loopStarts, 0);
    assert.equal(pageMap.get("paused:move-a")?.status, "cached");
    game.releaseAnimationPageMap(pageMap);
  } finally {
    globalThis.HTMLCanvasElement = previousCanvas;
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});

test("finishing a run cancels a pending page without resurrection", async () => {
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
    await settle();
    let loopStarts = 0;
    let resolvePage;
    const page = { width: 1152, height: 2016, getContext() { return {}; } };
    const pageMap = game.heroFullMotionAnimationSprites;
    game.startLoop = () => {
      loopStarts += 1;
    };
    game.mode = "running";
    game.animationPageUsageFrame = 1;
    game.requestCachedAnimationPage({
      pageMap,
      localKey: "move-a",
      cacheKey: "test-page:pending-finish",
      loader: () => new Promise((resolve) => {
        resolvePage = resolve;
      }),
      isRelevant: () => true,
    });
    await Promise.resolve();
    assert.equal(game.animationPageCache.size, 1);
    assert.equal(pageMap.get("move-a")?.status, "pending");

    game.finishRun(false);
    assert.equal(game.mode, "result");
    assert.equal(pageMap.size, 0);
    assert.equal(game.animationPageCache.size, 0);

    resolvePage(page);
    await settle();
    await settle();
    assert.equal(pageMap.size, 0);
    assert.equal(game.animationPageCache.size, 0);
    assert.equal(page.width, 0);
    assert.equal(page.height, 0);
    assert.equal(loopStarts, 0);
  } finally {
    globalThis.HTMLCanvasElement = previousCanvas;
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});

test("an over-budget active page set trims back to the limit after the draw frame", async () => {
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
    await settle();
    game.startLoop = () => {};
    game.mode = "running";
    game.animationPageUsageFrame = 10;
    const pageMap = game.enemyMotionAnimationSprites;
    const pages = Array.from({ length: 5 }, (_, index) => ({
      name: `page-${index}`,
      width: 2048,
      height: 2048,
      getContext() { return {}; },
    }));

    for (const [index, page] of pages.entries()) {
      game.requestCachedAnimationPage({
        pageMap,
        localKey: `enemy-${index}:move-a`,
        cacheKey: `test-page:enemy-${index}:move-a`,
        loader: async () => page,
        isRelevant: () => true,
      });
    }
    await settle();
    assert.equal(game.animationPageCache.getStats().leased, 5);
    assert.equal(game.animationPageCache.byteSize, 80 * 1024 * 1024);
    assert.equal(pages.every((page) => page.width === 2048), true);

    game.animationPageUsageFrame = 11;
    game.releaseUnusedAnimationPageLeases();
    assert.equal(game.animationPageCache.getStats().leased, 0);
    assert.ok(game.animationPageCache.byteSize <= 64 * 1024 * 1024);
    assert.ok(game.animationPageCache.size <= 4);
    assert.ok(pages.some((page) => page.width === 0));
    game.releaseAnimationPageMap(pageMap);
    assert.equal(pages.every((page) => page.width === 0), true);
  } finally {
    globalThis.HTMLCanvasElement = previousCanvas;
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});
