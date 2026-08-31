import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const workerSource = readFileSync(join(process.cwd(), "service-worker.js"), "utf8");
const packageDefinition = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
const currentGameCache = `doffa-heroes-v${packageDefinition.version}`;

function createWorkerHarness({ networkResponse, initialCaches = {}, failCachePut } = {}) {
  const handlers = new Map();
  const deletedCaches = [];
  const cacheWrites = [];
  const cacheOperations = [];
  const precacheRequests = [];
  const cacheState = new Map([
    ["doffa-heroes-v0.16.2", new Map()],
    [currentGameCache, new Map()],
    ["doffa-site-v12", new Map()],
    ["third-party-cache", new Map()],
  ]);
  let clientsClaimed = false;

  const normalizeRequest = (request) => {
    const value = typeof request === "string" ? request : request.url;
    const url = new URL(value, "https://play.dofa.test");
    return `${url.pathname}${url.search}`;
  };

  for (const [cacheName, entries] of Object.entries(initialCaches)) {
    const stored = cacheState.get(cacheName) ?? new Map();
    for (const [request, response] of Object.entries(entries)) {
      stored.set(normalizeRequest(request), response);
    }
    cacheState.set(cacheName, stored);
  }

  const getCache = (cacheName) => ({
    async addAll(paths) {
      precacheRequests.push(...paths);
    },
    async add() {},
    async put(request, response) {
      const normalized = normalizeRequest(request);
      cacheOperations.push(`put:${cacheName}:${normalized}`);
      if (failCachePut?.({ cacheName, request: normalized, response })) {
        throw new Error(`Cache put failed for ${cacheName}:${normalized}`);
      }
      cacheWrites.push({ cacheName, request, response });
      cacheState.get(cacheName).set(normalized, response.clone());
    },
    async match(request) {
      const response = cacheState.get(cacheName).get(normalizeRequest(request));
      return response?.clone();
    },
    async delete(request) {
      const normalized = normalizeRequest(request);
      cacheOperations.push(`delete-entry:${cacheName}:${normalized}`);
      return cacheState.get(cacheName).delete(normalized);
    },
  });
  const caches = {
    async keys() {
      return [...cacheState.keys()];
    },
    async delete(key) {
      cacheOperations.push(`delete-cache:${key}`);
      deletedCaches.push(key);
      return cacheState.delete(key);
    },
    async open(cacheName) {
      if (!cacheState.has(cacheName)) {
        cacheState.set(cacheName, new Map());
      }
      return getCache(cacheName);
    },
  };
  const self = {
    location: { origin: "https://play.dofa.test" },
    clients: {
      async claim() {
        clientsClaimed = true;
      },
    },
    addEventListener(type, listener) {
      handlers.set(type, listener);
    },
    skipWaiting() {},
  };

  vm.runInNewContext(workerSource, {
    URL,
    Response,
    Set,
    Promise,
    caches,
    fetch: async (request) => typeof networkResponse === "function"
      ? networkResponse(request)
      : networkResponse,
    self,
  });

  return {
    handlers,
    deletedCaches,
    cacheWrites,
    cacheOperations,
    cacheState,
    precacheRequests,
    get clientsClaimed() {
      return clientsClaimed;
    },
  };
}

function dispatchExtendable(handler, request) {
  let lifetimePromise;
  let responsePromise;
  handler({
    request,
    waitUntil(promise) {
      lifetimePromise = Promise.resolve(promise);
    },
    respondWith(promise) {
      responsePromise = Promise.resolve(promise);
    },
  });
  return { lifetimePromise, responsePromise };
}

test("service-worker install precaches only the lightweight app shell", async () => {
  const harness = createWorkerHarness();
  const event = dispatchExtendable(harness.handlers.get("install"));
  await event.lifetimePromise;

  assert.ok(harness.precacheRequests.includes("/index.html"));
  assert.ok(harness.precacheRequests.includes("/src/game/game.js"));
  assert.ok(harness.precacheRequests.includes("/src/game/animation-page-cache.js"));
  assert.ok(harness.precacheRequests.includes("/src/game/asset-window.js"));
  assert.ok(harness.precacheRequests.includes("/assets/icon.svg"));
  assert.deepEqual(
    harness.precacheRequests
      .filter((path) => /\.(?:png|jpe?g)$/i.test(path))
      .sort(),
    [
      "/assets/icon-192.png",
      "/assets/icon-512.png",
      "/assets/icon-maskable-512.png",
    ],
  );
});

test("service-worker activation deletes only obsolete DOFFA Heroes caches", async () => {
  const harness = createWorkerHarness();
  const event = dispatchExtendable(harness.handlers.get("activate"));
  await event.lifetimePromise;

  assert.deepEqual(harness.deletedCaches, ["doffa-heroes-v0.16.2"]);
  assert.equal(harness.clientsClaimed, true);
});

test("service-worker activation migrates only valid allowlisted raster art", async () => {
  const pngPath = "/assets/enemies/ash-hound.png";
  const jpegPath = "/assets/rooms/hollow-roastery-ash-v1.jpg";
  const wrongTypePath = "/assets/enemies/ember-oracle.png";
  const failedPath = "/assets/enemies/brass-colossus.png";
  const unrelatedOnlyPath = "/assets/enemies/smoke-revenant.png";
  const harness = createWorkerHarness({
    initialCaches: {
      "doffa-heroes-v0.16.2": {
        [pngPath]: new Response("png", {
          status: 200,
          headers: { "Content-Type": "image/png" },
        }),
        [jpegPath]: new Response("jpeg", {
          status: 200,
          headers: { "Content-Type": "image/jpeg; charset=binary" },
        }),
        [wrongTypePath]: new Response("<!doctype html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
        [failedPath]: new Response("missing", {
          status: 404,
          headers: { "Content-Type": "image/png" },
        }),
        "/assets/not-allowlisted.png": new Response("private", {
          status: 200,
          headers: { "Content-Type": "image/png" },
        }),
      },
      "third-party-cache": {
        [unrelatedOnlyPath]: new Response("unrelated", {
          status: 200,
          headers: { "Content-Type": "image/png" },
        }),
      },
      [currentGameCache]: {
        [wrongTypePath]: new Response("stale html", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      },
    },
  });

  const event = dispatchExtendable(harness.handlers.get("activate"));
  await event.lifetimePromise;

  const current = harness.cacheState.get(currentGameCache);
  assert.equal(current.get(pngPath)?.headers.get("Content-Type"), "image/png");
  assert.match(current.get(jpegPath)?.headers.get("Content-Type") ?? "", /^image\/jpeg/i);
  assert.equal(current.has(wrongTypePath), false);
  assert.equal(current.has(failedPath), false);
  assert.equal(current.has("/assets/not-allowlisted.png"), false);
  assert.equal(current.has(unrelatedOnlyPath), false);
  assert.equal(harness.cacheState.has("doffa-heroes-v0.16.2"), false);
  assert.equal(harness.cacheState.has("third-party-cache"), true);
  assert.deepEqual(harness.deletedCaches, ["doffa-heroes-v0.16.2"]);
});

test("service-worker streams raster migration without duplicating the whole old cache", async () => {
  const oldCache = "doffa-heroes-v0.16.2";
  const path = "/assets/rooms/hollow-roastery-ash-v1.jpg";
  const harness = createWorkerHarness({
    initialCaches: {
      [oldCache]: {
        [path]: new Response("jpeg", {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        }),
      },
    },
  });

  const event = dispatchExtendable(harness.handlers.get("activate"));
  await event.lifetimePromise;

  const putIndex = harness.cacheOperations.indexOf(`put:${currentGameCache}:${path}`);
  const entryDeleteIndex = harness.cacheOperations.indexOf(`delete-entry:${oldCache}:${path}`);
  const cacheDeleteIndex = harness.cacheOperations.indexOf(`delete-cache:${oldCache}`);
  assert.ok(putIndex >= 0);
  assert.ok(entryDeleteIndex > putIndex, "the old entry must remain until target.put succeeds");
  assert.ok(cacheDeleteIndex > entryDeleteIndex, "the old cache is removed only after entry migration");
});

test("a failed target write preserves the old cache and aborts activation", async () => {
  const oldCache = "doffa-heroes-v0.16.2";
  const path = "/assets/rooms/hollow-roastery-ash-v1.jpg";
  const harness = createWorkerHarness({
    initialCaches: {
      [oldCache]: {
        [path]: new Response("jpeg", {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        }),
      },
    },
    failCachePut: ({ cacheName, request }) => (
      cacheName === currentGameCache && request === path
    ),
  });

  const event = dispatchExtendable(harness.handlers.get("activate"));
  await assert.rejects(event.lifetimePromise, /Cache put failed/);
  assert.equal(harness.cacheState.get(oldCache).has(path), true);
  assert.equal(harness.cacheState.get(currentGameCache).has(path), false);
  assert.deepEqual(harness.deletedCaches, []);
  assert.equal(harness.clientsClaimed, false);
});

test("raster art is cached only with the MIME type required by its URL", async () => {
  const cases = [
    {
      path: "/assets/enemies/ash-hound.png",
      contentType: "image/png",
      status: 200,
      cached: true,
    },
    {
      path: "/assets/enemies/ash-hound.png",
      contentType: "text/html; charset=utf-8",
      status: 200,
      cached: false,
    },
    {
      path: "/assets/rooms/hollow-roastery-ash-v1.jpg",
      contentType: "image/jpeg",
      status: 200,
      cached: true,
    },
    {
      path: "/assets/rooms/hollow-roastery-ash-v1.jpg",
      contentType: "image/png",
      status: 200,
      cached: false,
    },
    {
      path: "/assets/enemies/ash-hound.png",
      contentType: "image/png",
      status: 404,
      cached: false,
    },
  ];

  for (const entry of cases) {
    const harness = createWorkerHarness({
      networkResponse: new Response("asset", {
        status: entry.status,
        headers: { "Content-Type": entry.contentType },
      }),
    });
    const event = dispatchExtendable(harness.handlers.get("fetch"), {
      method: "GET",
      mode: "cors",
      url: `https://play.dofa.test${entry.path}`,
    });
    await event.responsePromise;

    assert.equal(
      harness.cacheState.get(currentGameCache).has(entry.path),
      entry.cached,
      `${entry.path} with ${entry.status} ${entry.contentType}`,
    );
  }
});

test("an invalid cached raster response is discarded instead of served offline", async () => {
  const path = "/assets/enemies/ash-hound.png";
  const harness = createWorkerHarness({
    networkResponse: () => {
      throw new Error("offline");
    },
    initialCaches: {
      [currentGameCache]: {
        [path]: new Response("<!doctype html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      },
    },
  });
  const event = dispatchExtendable(harness.handlers.get("fetch"), {
    method: "GET",
    mode: "cors",
    url: `https://play.dofa.test${path}`,
  });

  assert.equal((await event.responsePromise).status, 503);
  assert.equal(harness.cacheState.get(currentGameCache).has(path), false);
});

test("service worker ignores unrelated same-origin routes and assets", () => {
  const harness = createWorkerHarness();
  const fetchHandler = harness.handlers.get("fetch");
  const unrelatedNavigation = dispatchExtendable(fetchHandler, {
    method: "GET",
    mode: "navigate",
    url: "https://play.dofa.test/account",
  });
  const unrelatedAsset = dispatchExtendable(fetchHandler, {
    method: "GET",
    mode: "cors",
    url: "https://play.dofa.test/site-assets/home.js",
  });

  assert.equal(unrelatedNavigation.responsePromise, undefined);
  assert.equal(unrelatedAsset.responsePromise, undefined);
});

test("navigation cache accepts only a successful HTML game shell", async () => {
  const badResponse = new Response("server error", {
    status: 500,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
  const badHarness = createWorkerHarness({ networkResponse: badResponse });
  const badEvent = dispatchExtendable(badHarness.handlers.get("fetch"), {
    method: "GET",
    mode: "navigate",
    url: "https://play.dofa.test/",
  });
  assert.equal((await badEvent.responsePromise).status, 500);
  assert.equal(badHarness.cacheWrites.length, 0);

  const nonHtmlResponse = new Response('{"status":"ok"}', {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  const nonHtmlHarness = createWorkerHarness({ networkResponse: nonHtmlResponse });
  const nonHtmlEvent = dispatchExtendable(nonHtmlHarness.handlers.get("fetch"), {
    method: "GET",
    mode: "navigate",
    url: "https://play.dofa.test/",
  });
  assert.equal((await nonHtmlEvent.responsePromise).status, 200);
  assert.equal(nonHtmlHarness.cacheWrites.length, 0);

  const goodResponse = new Response("<!doctype html><title>DOFFA</title>", {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
  const goodHarness = createWorkerHarness({ networkResponse: goodResponse });
  const goodEvent = dispatchExtendable(goodHarness.handlers.get("fetch"), {
    method: "GET",
    mode: "navigate",
    url: "https://play.dofa.test/",
  });
  assert.equal((await goodEvent.responsePromise).status, 200);
  assert.equal(goodHarness.cacheWrites.length, 1);
  assert.equal(goodHarness.cacheWrites[0].request, "/index.html");
});
