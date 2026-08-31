import test from "node:test";
import assert from "node:assert/strict";

import {
  AnimationPageCache,
  AnimationPageLoadCancelledError,
} from "../src/game/animation-page-cache.js";

function createClock() {
  let current = 0;
  return {
    now: () => current,
    tick: (amount = 1) => {
      current += amount;
    },
  };
}

function createPage(name, bytes = 4) {
  return {
    name,
    byteLength: bytes,
    closes: 0,
    close() {
      this.closes += 1;
    },
  };
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test("concurrent leases share one load and release independently", async () => {
  const cache = new AnimationPageCache();
  const page = createPage("shared");
  let loads = 0;
  const loader = async () => {
    loads += 1;
    return page;
  };

  const [first, second] = await Promise.all([
    cache.acquire("shared", loader),
    cache.acquire("shared", loader),
  ]);

  assert.equal(loads, 1);
  assert.equal(first.value, page);
  assert.equal(second.value, page);
  assert.equal(cache.getStats().leased, 1);
  assert.equal(first.release(), true);
  assert.equal(first.release(), false);
  assert.equal(cache.evict("shared"), false);
  assert.equal(second.release(), true);
  assert.equal(cache.evict("shared"), true);
  assert.equal(page.closes, 1);
});

test("entry budget evicts the least recently used unleased page", async () => {
  const clock = createClock();
  const cache = new AnimationPageCache({ maxEntries: 2, clock: clock.now });
  const pages = {
    first: createPage("first"),
    second: createPage("second"),
    third: createPage("third"),
  };

  const first = await cache.acquire("first", () => pages.first);
  first.release();
  clock.tick();
  const second = await cache.acquire("second", () => pages.second);
  second.release();
  clock.tick();
  assert.equal(cache.get("first"), pages.first);
  clock.tick();
  const third = await cache.acquire("third", () => pages.third);

  assert.equal(cache.has("first"), true);
  assert.equal(cache.has("second"), false);
  assert.equal(cache.has("third"), true);
  assert.equal(pages.second.closes, 1);
  third.release();
});

test("byte budget uses explicit sizes and never evicts an active lease", async () => {
  const cache = new AnimationPageCache({ maxEntries: 8, maxBytes: 10 });
  const firstPage = createPage("first", 100);
  const secondPage = createPage("second", 100);
  const first = await cache.acquire("first", () => firstPage, { bytes: 7 });
  const second = await cache.acquire("second", () => secondPage, { bytes: 7 });

  assert.equal(cache.size, 2);
  assert.equal(cache.byteSize, 14);
  assert.equal(cache.evictLeastRecentlyUsed(), false);
  second.release();
  assert.equal(cache.has("first"), true);
  assert.equal(cache.has("second"), false);
  assert.equal(secondPage.closes, 1);
  assert.equal(cache.byteSize, 7);
  first.release();
});

test("an oversized page stays alive for its lease and is disposed after release", async () => {
  const cache = new AnimationPageCache({ maxBytes: 4 });
  const page = createPage("oversized", 20);
  const lease = await cache.acquire("oversized", () => page);

  assert.equal(cache.has("oversized"), true);
  assert.equal(page.closes, 0);
  assert.equal(lease.value, page);
  lease.release();
  assert.equal(cache.has("oversized"), false);
  assert.equal(page.closes, 1);
});

test("rejected loads are removed and can be retried safely", async () => {
  const cache = new AnimationPageCache();
  const page = createPage("recovered");
  let attempts = 0;
  const loader = async () => {
    attempts += 1;
    if (attempts === 1) {
      throw new Error("temporary decode failure");
    }
    return page;
  };

  await assert.rejects(cache.acquire("retry", loader), /temporary decode failure/);
  assert.equal(cache.has("retry"), false);
  assert.deepEqual(cache.getStats(), {
    entries: 0,
    ready: 0,
    pending: 0,
    leased: 0,
    bytes: 0,
    maxEntries: 24,
    maxBytes: 128 * 1024 * 1024,
  });

  const lease = await cache.acquire("retry", loader);
  assert.equal(attempts, 2);
  assert.equal(lease.value, page);
  lease.release();
});

test("a rejected shared request does not strand lease pins", async () => {
  const cache = new AnimationPageCache();
  let rejectLoad;
  let loads = 0;
  const loader = () => {
    loads += 1;
    return new Promise((resolve, reject) => {
      rejectLoad = reject;
    });
  };
  const first = cache.acquire("shared-rejection", loader);
  const second = cache.acquire("shared-rejection", loader);
  await Promise.resolve();
  rejectLoad(new Error("decode failed"));

  await assert.rejects(first, /decode failed/);
  await assert.rejects(second, /decode failed/);
  assert.equal(loads, 1);
  assert.equal(cache.has("shared-rejection"), false);
  assert.equal(cache.getStats().leased, 0);
});

test("pending cancellation removes the entry and rejects acquire immediately", async () => {
  const cache = new AnimationPageCache();
  const deferred = createDeferred();
  const page = createPage("cancelled");
  const acquisition = cache.acquire("cancelled", () => deferred.promise);
  await Promise.resolve();

  assert.equal(cache.cancelPending("cancelled"), true);
  assert.equal(cache.has("cancelled"), false);
  await assert.rejects(acquisition, (error) => (
    error instanceof AnimationPageLoadCancelledError
    && error.code === "ANIMATION_PAGE_LOAD_CANCELLED"
    && error.key === "cancelled"
  ));
  assert.equal(cache.cancelPending("cancelled"), false);

  deferred.resolve(page);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(page.closes, 1);
  assert.equal(cache.has("cancelled"), false);
});

test("an old cancelled completion cannot delete or dispose a replacement entry", async () => {
  const cache = new AnimationPageCache();
  const oldDeferred = createDeferred();
  const oldPage = createPage("old");
  const newPage = createPage("new");
  const oldAcquisition = cache.acquire("replacement", () => oldDeferred.promise);
  await Promise.resolve();
  cache.cancelPending("replacement");
  await assert.rejects(oldAcquisition, AnimationPageLoadCancelledError);

  const replacement = await cache.acquire("replacement", () => newPage);
  assert.equal(replacement.value, newPage);
  oldDeferred.resolve(oldPage);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(oldPage.closes, 1);
  assert.equal(newPage.closes, 0);
  assert.equal(cache.get("replacement"), newPage);
  replacement.release();
  assert.equal(cache.evict("replacement"), true);
  assert.equal(newPage.closes, 1);
});

test("a replacement may safely adopt the same pending decoded value", async () => {
  const cache = new AnimationPageCache();
  const sharedDeferred = createDeferred();
  const page = createPage("shared-after-cancel");
  const oldAcquisition = cache.acquire("shared-after-cancel", () => sharedDeferred.promise);
  await Promise.resolve();
  cache.cancelPending("shared-after-cancel");
  await assert.rejects(oldAcquisition, AnimationPageLoadCancelledError);

  const newAcquisition = cache.acquire(
    "shared-after-cancel",
    () => sharedDeferred.promise,
  );
  sharedDeferred.resolve(page);
  const replacement = await newAcquisition;
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(replacement.value, page);
  assert.equal(page.closes, 0);
  replacement.release();
  cache.evict("shared-after-cancel");
  assert.equal(page.closes, 1);
});

test("clear can cancel every pending load without affecting later replacements", async () => {
  const cache = new AnimationPageCache();
  const firstDeferred = createDeferred();
  const secondDeferred = createDeferred();
  const first = cache.acquire("clear-first", () => firstDeferred.promise);
  const second = cache.acquire("clear-second", () => secondDeferred.promise);
  await Promise.resolve();

  assert.equal(cache.clear({ cancelPending: true }), 2);
  assert.equal(cache.size, 0);
  await assert.rejects(first, AnimationPageLoadCancelledError);
  await assert.rejects(second, AnimationPageLoadCancelledError);

  const replacementPage = createPage("clear-replacement");
  const replacement = await cache.acquire("clear-first", () => replacementPage);
  firstDeferred.resolve(createPage("late-first"));
  secondDeferred.reject(new Error("late rejected load"));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(cache.get("clear-first"), replacementPage);
  replacement.release();
});

test("clear and direct eviction preserve leased entries", async () => {
  const cache = new AnimationPageCache();
  const pinnedPage = createPage("pinned");
  const freePage = createPage("free");
  const pinned = await cache.acquire("pinned", () => pinnedPage);
  const free = await cache.acquire("free", () => freePage);
  free.release();

  assert.equal(cache.evict("pinned"), false);
  assert.equal(cache.clear(), 1);
  assert.equal(cache.has("pinned"), true);
  assert.equal(cache.has("free"), false);
  assert.equal(freePage.closes, 1);
  pinned.release();
  assert.equal(cache.clear(), 1);
  assert.equal(pinnedPage.closes, 1);
  assert.equal(cache.clear(), 0);
});

test("custom byte estimation and disposal are supported", async () => {
  const disposed = [];
  const cache = new AnimationPageCache({
    maxBytes: 3,
    estimateBytes: (page) => page.cost,
    dispose: (page, key) => disposed.push([key, page.name]),
  });
  const page = { name: "custom", cost: 4 };
  const lease = await cache.acquire("custom", () => page);
  lease.release();

  assert.deepEqual(disposed, [["custom", "custom"]]);
  assert.equal(cache.byteSize, 0);
});

test("disposal can be disabled and zero budgets evict after release", async () => {
  const cache = new AnimationPageCache({ maxEntries: 0, maxBytes: 0, dispose: null });
  const page = createPage("temporary", 8);
  const lease = await cache.acquire("temporary", () => page);
  assert.equal(cache.size, 1);
  lease.release();
  assert.equal(cache.size, 0);
  assert.equal(page.closes, 0);
});

test("invalid options, keys, sizes, and clocks fail predictably", async () => {
  assert.throws(() => new AnimationPageCache({ maxEntries: -1 }), /maxEntries/);
  assert.throws(() => new AnimationPageCache({ maxBytes: Number.NaN }), /maxBytes/);
  assert.throws(() => new AnimationPageCache({ clock: null }), /clock/);
  assert.throws(() => new AnimationPageCache({ dispose: true }), /dispose/);
  assert.throws(() => new AnimationPageCache({ estimateBytes: null }), /estimateBytes/);

  const cache = new AnimationPageCache();
  assert.throws(() => cache.get(""), /keys/);
  await assert.rejects(cache.acquire("missing-loader"), /loader/);
  await assert.rejects(
    cache.acquire("invalid-size", () => createPage("invalid-size"), { bytes: -1 }),
    /byte size/,
  );
  assert.equal(cache.has("invalid-size"), false);

  const invalidSizePage = createPage("invalid-size-disposal");
  await assert.rejects(
    cache.acquire("invalid-size-disposal", () => invalidSizePage, { bytes: -1 }),
    /byte size/,
  );
  assert.equal(invalidSizePage.closes, 1);

  const invalidClock = new AnimationPageCache({ clock: () => Number.NaN });
  await assert.rejects(
    invalidClock.acquire("clock", () => createPage("clock")),
    /clock must return/,
  );
});
