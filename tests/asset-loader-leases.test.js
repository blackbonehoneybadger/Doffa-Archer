import test from "node:test";
import assert from "node:assert/strict";

import {
  acquireSpriteLease,
  getSpriteCacheEntryCount,
} from "../src/game/sprite-loader.js";
import {
  acquireRoomArtLease,
  getRoomArtCacheEntryCount,
} from "../src/game/room-art.js";

function installSpriteHarness() {
  const previousImage = globalThis.Image;
  const previousDocument = globalThis.document;
  const images = [];
  const canvases = [];

  class DeferredImage {
    constructor() {
      this.listeners = new Map();
      this.naturalWidth = 8;
      this.naturalHeight = 12;
      images.push(this);
    }

    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }

    set src(_value) {}

    resolve() {
      this.listeners.get("load")?.();
    }

    reject() {
      this.listeners.get("error")?.();
    }
  }

  globalThis.Image = DeferredImage;
  globalThis.document = {
    createElement() {
      const canvas = {
        width: 0,
        height: 0,
        closeCalls: 0,
        close() {
          this.closeCalls += 1;
        },
        getContext() {
          return { drawImage() {}, imageSmoothingEnabled: true };
        },
      };
      canvases.push(canvas);
      return canvas;
    },
  };

  return {
    images,
    canvases,
    restore() {
      globalThis.Image = previousImage;
      globalThis.document = previousDocument;
    },
  };
}

function installRoomArtHarness() {
  const previousImage = globalThis.Image;
  const images = [];

  class DeferredImage {
    constructor() {
      this.listeners = new Map();
      this.closeCalls = 0;
      images.push(this);
    }

    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }

    set src(_value) {}

    resolve() {
      this.listeners.get("load")?.();
    }

    reject() {
      this.listeners.get("error")?.();
    }

    close() {
      this.closeCalls += 1;
    }
  }

  globalThis.Image = DeferredImage;
  return {
    images,
    restore() {
      globalThis.Image = previousImage;
    },
  };
}

test("sprite leases share one decode and retain it until both independent owners release", async () => {
  const harness = installSpriteHarness();
  const initialSize = getSpriteCacheEntryCount();
  const key = "lease-test:shared-sprite";
  const art = { sprite: "/assets/heroes/lease-shared.png", backdrop: "transparent" };
  let first;
  let second;
  try {
    first = acquireSpriteLease(key, art, { owner: "current-room" });
    second = acquireSpriteLease(key, art, { owner: "next-room" });
    assert.notEqual(first, second);
    assert.equal(first.promise, second.promise);
    assert.equal(harness.images.length, 1);
    assert.equal(getSpriteCacheEntryCount(), initialSize + 1);

    harness.images[0].resolve();
    const [firstSprite, secondSprite] = await Promise.all([first.promise, second.promise]);
    assert.equal(firstSprite, secondSprite);

    assert.equal(first.release(), true);
    assert.equal(first.release(), false);
    assert.equal(harness.canvases[0].closeCalls, 0);
    assert.equal(getSpriteCacheEntryCount(), initialSize + 1);

    assert.equal(second.release(), true);
    assert.equal(harness.canvases[0].closeCalls, 1);
    assert.equal(getSpriteCacheEntryCount(), initialSize);
  } finally {
    first?.release();
    second?.release();
    harness.restore();
  }
});

test("a stale sprite release cannot revoke a lease acquired after release", async () => {
  const harness = installSpriteHarness();
  const initialSize = getSpriteCacheEntryCount();
  const key = "lease-test:stale-sprite";
  const art = { sprite: "/assets/heroes/lease-stale.png", backdrop: "transparent" };
  let stale;
  let current;
  try {
    stale = acquireSpriteLease(key, art, { owner: "old-window" });
    assert.equal(stale.release(), true);
    current = acquireSpriteLease(key, art, { owner: "new-window" });
    assert.equal(current.promise, stale.promise);
    assert.equal(stale.release(), false);
    assert.equal(getSpriteCacheEntryCount(), initialSize + 1);

    harness.images[0].resolve();
    await current.promise;
    assert.equal(harness.canvases[0].closeCalls, 0);
    assert.equal(current.release(), true);
    assert.equal(harness.canvases[0].closeCalls, 1);
    assert.equal(getSpriteCacheEntryCount(), initialSize);
  } finally {
    stale?.release();
    current?.release();
    harness.restore();
  }
});

test("a rejected sprite decode is removed and a later lease retries cleanly", async () => {
  const harness = installSpriteHarness();
  const initialSize = getSpriteCacheEntryCount();
  const key = "lease-test:retry-sprite";
  const art = { sprite: "/assets/heroes/lease-retry.png", backdrop: "transparent" };
  let failed;
  let retried;
  try {
    failed = acquireSpriteLease(key, art, { owner: "failed-owner" });
    harness.images[0].reject();
    await assert.rejects(failed.promise, /Unable to load sprite/);
    assert.equal(getSpriteCacheEntryCount(), initialSize);
    failed.release();

    retried = acquireSpriteLease(key, art, { owner: "retry-owner" });
    assert.equal(harness.images.length, 2);
    harness.images[1].resolve();
    await retried.promise;
    assert.equal(retried.release(), true);
    assert.equal(harness.canvases[0].closeCalls, 1);
    assert.equal(getSpriteCacheEntryCount(), initialSize);
  } finally {
    failed?.release();
    retried?.release();
    harness.restore();
  }
});

test("a sprite released while pending disposes a late completion exactly once", async () => {
  const harness = installSpriteHarness();
  const initialSize = getSpriteCacheEntryCount();
  const key = "lease-test:late-sprite";
  const art = { sprite: "/assets/heroes/lease-late.png", backdrop: "transparent" };
  const lease = acquireSpriteLease(key, art, { owner: "expired-room" });
  try {
    assert.equal(lease.release(), true);
    harness.images[0].resolve();
    await lease.promise;
    assert.equal(harness.canvases[0].closeCalls, 1);
    assert.equal(lease.release(), false);
    assert.equal(harness.canvases[0].closeCalls, 1);
    assert.equal(getSpriteCacheEntryCount(), initialSize);
  } finally {
    lease.release();
    harness.restore();
  }
});

test("room-art leases share ownership and close the image only after the final release", async () => {
  const harness = installRoomArtHarness();
  const initialSize = getRoomArtCacheEntryCount();
  let first;
  let second;
  try {
    first = acquireRoomArtLease("ash", { roomNumber: 1 }, { owner: "current-room" });
    second = acquireRoomArtLease("ash", { roomNumber: 1 }, { owner: "next-room" });
    assert.equal(first.promise, second.promise);
    assert.equal(harness.images.length, 1);

    harness.images[0].resolve();
    await Promise.all([first.promise, second.promise]);
    assert.equal(first.release(), true);
    assert.equal(first.release(), false);
    assert.equal(harness.images[0].closeCalls, 0);
    assert.equal(getRoomArtCacheEntryCount(), initialSize + 1);

    assert.equal(second.release(), true);
    assert.equal(harness.images[0].closeCalls, 1);
    assert.equal(getRoomArtCacheEntryCount(), initialSize);
  } finally {
    first?.release();
    second?.release();
    harness.restore();
  }
});

test("room-art pending failure can retry and released late completion closes once", async () => {
  const harness = installRoomArtHarness();
  const initialSize = getRoomArtCacheEntryCount();
  let failed;
  let late;
  try {
    failed = acquireRoomArtLease("ember", { roomNumber: 1 }, { owner: "failed-room" });
    harness.images[0].reject();
    await assert.rejects(failed.promise, /Unable to load room art/);
    assert.equal(getRoomArtCacheEntryCount(), initialSize);
    failed.release();

    late = acquireRoomArtLease("ember", { roomNumber: 1 }, { owner: "expired-room" });
    assert.equal(harness.images.length, 2);
    assert.equal(late.release(), true);
    harness.images[1].resolve();
    await late.promise;
    assert.equal(harness.images[1].closeCalls, 1);
    assert.equal(late.release(), false);
    assert.equal(harness.images[1].closeCalls, 1);
    assert.equal(getRoomArtCacheEntryCount(), initialSize);
  } finally {
    failed?.release();
    late?.release();
    harness.restore();
  }
});
