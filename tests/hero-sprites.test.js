import test from "node:test";
import assert from "node:assert/strict";

import { removeConnectedLightBackdrop } from "../src/game/hero-sprites.js";
import {
  getSpriteCacheEntryCount,
  loadSprite,
  releaseSprite,
  releaseSpritesByPrefix,
  removeConnectedMagentaBackdrop,
} from "../src/game/sprite-loader.js";

function pixel(data, width, x, y) {
  const offset = (y * width + x) * 4;
  return [...data.slice(offset, offset + 4)];
}

test("sprite backdrop removal clears only edge-connected neutral pixels", () => {
  const width = 4;
  const height = 4;
  const data = new Uint8ClampedArray(width * height * 4).fill(245);
  for (let index = 3; index < data.length; index += 4) data[index] = 255;

  // A dark subject ring protects one light pixel from the edge flood fill.
  for (const [x, y] of [[1, 1], [2, 1], [1, 2], [2, 2]]) {
    const offset = (y * width + x) * 4;
    data[offset] = 20;
    data[offset + 1] = 15;
    data[offset + 2] = 12;
  }

  const imageData = { data };
  removeConnectedLightBackdrop(imageData, width, height);
  assert.equal(pixel(data, width, 0, 0)[3], 0);
  assert.deepEqual(pixel(data, width, 1, 1), [20, 15, 12, 255]);
});

test("explicit normalized seeds clear enclosed checkerboard holes", () => {
  const width = 5;
  const height = 5;
  const data = new Uint8ClampedArray(width * height * 4).fill(20);
  for (let index = 3; index < data.length; index += 4) data[index] = 255;
  const center = (2 * width + 2) * 4;
  data[center] = 246;
  data[center + 1] = 246;
  data[center + 2] = 246;

  removeConnectedLightBackdrop({ data }, width, height, [{ x: 0.5, y: 0.5 }]);
  assert.equal(pixel(data, width, 2, 2)[3], 0);
  assert.equal(pixel(data, width, 1, 1)[3], 255);
});

test("magenta chroma-key removal preserves isolated ember colors", () => {
  const width = 3;
  const height = 3;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    data[offset] = 229;
    data[offset + 1] = 13;
    data[offset + 2] = 231;
    data[offset + 3] = 255;
  }
  const center = (width + 1) * 4;
  data[center] = 240;
  data[center + 1] = 70;
  data[center + 2] = 20;

  removeConnectedMagentaBackdrop({ data }, width, height);
  assert.equal(pixel(data, width, 0, 0)[3], 0);
  assert.deepEqual(pixel(data, width, 1, 1), [240, 70, 20, 255]);
});

test("a transient sprite error does not poison every later retry", async () => {
  const previousImage = globalThis.Image;
  const previousDocument = globalThis.document;
  let requests = 0;
  class FailingImage {
    constructor() {
      this.listeners = new Map();
      requests += 1;
    }

    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }

    set src(_value) {
      queueMicrotask(() => this.listeners.get("error")?.());
    }
  }

  globalThis.Image = FailingImage;
  globalThis.document = {};
  try {
    const art = { sprite: "/assets/heroes/retry-test.png", backdrop: "transparent" };
    await assert.rejects(loadSprite("retryable-sprite-test", art));
    await assert.rejects(loadSprite("retryable-sprite-test", art));
    assert.equal(requests, 2);
  } finally {
    globalThis.Image = previousImage;
    globalThis.document = previousDocument;
  }
});

test("sprite cache entries can be released exactly or by namespace", async () => {
  const initialSize = getSpriteCacheEntryCount();
  const art = { sprite: "/assets/heroes/cache-lifecycle-test.png" };
  await loadSprite("cache-lifecycle:one", art);
  await loadSprite("cache-lifecycle:two", art);
  assert.equal(getSpriteCacheEntryCount(), initialSize + 2);

  assert.equal(releaseSprite("cache-lifecycle:one"), true);
  assert.equal(getSpriteCacheEntryCount(), initialSize + 1);
  assert.equal(releaseSpritesByPrefix("cache-lifecycle:"), 1);
  assert.equal(getSpriteCacheEntryCount(), initialSize);
});

test("pending sprite release shares the in-flight decode if the asset is reacquired", async () => {
  const previousImage = globalThis.Image;
  const previousDocument = globalThis.document;
  const images = [];
  let requests = 0;
  class DeferredImage {
    constructor() {
      this.listeners = new Map();
      this.naturalWidth = 4;
      this.naturalHeight = 4;
      requests += 1;
      images.push(this);
    }

    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }

    set src(_value) {}

    resolve() {
      this.listeners.get("load")?.();
    }
  }
  globalThis.Image = DeferredImage;
  globalThis.document = {
    createElement() {
      return {
        width: 0,
        height: 0,
        getContext() {
          return { drawImage() {}, imageSmoothingEnabled: true };
        },
      };
    },
  };

  const initialSize = getSpriteCacheEntryCount();
  const key = "pending-release:test";
  const art = { sprite: "/assets/heroes/pending-release.png", backdrop: "transparent" };
  try {
    const first = loadSprite(key, art);
    assert.equal(releaseSprite(key), true);
    const second = loadSprite(key, art);
    assert.equal(first, second);
    assert.equal(requests, 1);
    images[0].resolve();
    await Promise.all([first, second]);
    assert.equal(getSpriteCacheEntryCount(), initialSize + 1);
    releaseSprite(key);
    assert.equal(getSpriteCacheEntryCount(), initialSize);

    const releasedWhilePending = loadSprite(key, art);
    releaseSprite(key);
    images[1].resolve();
    await releasedWhilePending;
    assert.equal(getSpriteCacheEntryCount(), initialSize);
  } finally {
    releaseSprite(key);
    globalThis.Image = previousImage;
    globalThis.document = previousDocument;
  }
});
