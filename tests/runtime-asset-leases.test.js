import test from "node:test";
import assert from "node:assert/strict";

import { ProfileStore } from "../src/core/profile-store.js";
import { DoffaGame } from "../src/game/game.js";
import { getRoomAssetWindow } from "../src/game/asset-window.js";
import { getSpriteCacheEntryCount } from "../src/game/sprite-loader.js";
import { getRoomArtCacheEntryCount } from "../src/game/room-art.js";

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

class GameCanvas {
  getContext() {
    return {};
  }

  addEventListener() {}

  setPointerCapture() {}

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 720, height: 1280 };
  }
}

function installDeferredAssetHarness() {
  const previousCanvas = globalThis.HTMLCanvasElement;
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousImage = globalThis.Image;
  const images = [];
  const decodedCanvases = [];

  class DeferredImage {
    constructor() {
      this.listeners = new Map();
      this.naturalWidth = 8;
      this.naturalHeight = 12;
      this.source = "";
      this.closeCalls = 0;
      images.push(this);
    }

    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }

    set src(value) {
      this.source = value;
    }

    resolve() {
      this.listeners.get("load")?.();
    }

    close() {
      this.closeCalls += 1;
    }
  }

  globalThis.HTMLCanvasElement = GameCanvas;
  globalThis.window = { addEventListener() {} };
  globalThis.document = {
    hidden: false,
    addEventListener() {},
    createElement() {
      const canvas = {
        width: 0,
        height: 0,
        closeCalls: 0,
        close() {
          this.closeCalls += 1;
        },
        getContext() {
          return {
            imageSmoothingEnabled: true,
            drawImage() {},
            getImageData() {
              return {
                data: new Uint8ClampedArray(canvas.width * canvas.height * 4),
              };
            },
            putImageData() {},
          };
        },
      };
      decodedCanvases.push(canvas);
      return canvas;
    },
  };
  globalThis.Image = DeferredImage;

  return {
    images,
    decodedCanvases,
    restore() {
      globalThis.HTMLCanvasElement = previousCanvas;
      globalThis.window = previousWindow;
      globalThis.document = previousDocument;
      globalThis.Image = previousImage;
    },
  };
}

function createGame() {
  return new DoffaGame({
    canvas: new GameCanvas(),
    profileStore: new ProfileStore(new MemoryStorage()),
    onHud() {},
    onProfile() {},
    onAbilityChoice() {},
    onRunEnd() {},
  });
}

async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

test("asset-window transitions and finish release every explicit runtime lease", async () => {
  const harness = installDeferredAssetHarness();
  const initialSpriteEntries = getSpriteCacheEntryCount();
  const initialRoomEntries = getRoomArtCacheEntryCount();
  try {
    const game = createGame();
    assert.equal(harness.images.length, 0, "constructor must not preload the ash room");
    assert.equal(game.roomSpriteLeases.size, 0);

    assert.equal(game.beginRun("rootfall-jungle", "honey-badger").ok, true);
    const firstWindow = getRoomAssetWindow(game.tour, 1);
    assert.ok(game.heroSpriteLeases.size > 0);
    assert.ok(game.enemySpriteLeases.size > 0);
    assert.ok(game.destructibleSpriteLeases.size > 0);
    assert.equal(game.roomSpriteLeases.size, firstWindow.roomSprites.size);

    const firstEnemyLeases = [...game.enemySpriteLeases.values()];
    const firstDestructibleLeases = [...game.destructibleSpriteLeases.values()];
    const firstRoomLeases = [...game.roomSpriteLeases.values()];
    game.syncRoomAssetWindow(50);
    assert.equal(firstEnemyLeases.every((lease) => lease.released), true);
    assert.equal(firstDestructibleLeases.every((lease) => lease.released), true);
    assert.equal(firstRoomLeases.every((lease) => lease.released), true);

    const finishLeases = [
      ...game.heroSpriteLeases.values(),
      ...game.enemySpriteLeases.values(),
      ...game.destructibleSpriteLeases.values(),
      ...game.roomSpriteLeases.values(),
    ];
    game.finishRun(false);
    assert.equal(finishLeases.every((lease) => lease.released), true);
    assert.equal(game.heroSpriteLeases.size, 0);
    assert.equal(game.enemySpriteLeases.size, 0);
    assert.equal(game.destructibleSpriteLeases.size, 0);
    assert.equal(game.roomSpriteLeases.size, 0);
    assert.equal(game.enemySprites.size, 0);
    assert.equal(game.destructibleSprites.size, 0);
    assert.equal(game.roomSprites.size, 0);

    for (const image of harness.images) {
      image.resolve();
    }
    await settle();
    assert.equal(getSpriteCacheEntryCount(), initialSpriteEntries);
    assert.equal(getRoomArtCacheEntryCount(), initialRoomEntries);
    assert.equal(
      harness.decodedCanvases.every((canvas) => canvas.closeCalls === 1),
      true,
      "each late sprite decode must be disposed once",
    );
    assert.equal(
      harness.images
        .filter((image) => image.source.startsWith("/assets/rooms/"))
        .every((image) => image.closeCalls === 1),
      true,
      "each late room image must be disposed once",
    );
  } finally {
    harness.restore();
  }
});

test("a stale runtime completion cannot dispose the replacement enemy owner", async () => {
  const harness = installDeferredAssetHarness();
  const initialSpriteEntries = getSpriteCacheEntryCount();
  try {
    const game = createGame();
    const enemyId = "razor_mantis";
    game.assetWindowEnemyIds = new Set([enemyId]);
    game.requestEnemySprites(game.assetWindowEnemyIds);
    const staleLease = game.enemySpriteLeases.get(`base:${enemyId}`);
    assert.ok(staleLease);

    game.releaseEnemySpriteResources(enemyId);
    assert.equal(staleLease.released, true);
    game.requestEnemySprites(game.assetWindowEnemyIds);
    const currentLease = game.enemySpriteLeases.get(`base:${enemyId}`);
    assert.ok(currentLease);
    assert.notEqual(currentLease, staleLease);
    assert.equal(currentLease.promise, staleLease.promise);
    assert.equal(staleLease.release(), false);

    for (const image of harness.images) {
      image.resolve();
    }
    await settle();
    const currentSprite = game.enemySprites.get(enemyId);
    assert.ok(currentSprite);
    assert.equal(game.enemySpriteLeases.get(`base:${enemyId}`), currentLease);
    assert.equal(currentLease.released, false);
    assert.equal(currentSprite.closeCalls, 0);

    game.releaseEnemySpriteResources(enemyId);
    assert.equal(currentLease.released, true);
    assert.equal(currentSprite.closeCalls, 1);
    assert.equal(getSpriteCacheEntryCount(), initialSpriteEntries);
  } finally {
    harness.restore();
  }
});
