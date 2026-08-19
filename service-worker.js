const CACHE_NAME = "doffa-heroes-v0.4.0";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/assets/icon.svg",
  "/styles/main.css",
  "/src/main.js",
  "/src/config/game-config.js",
  "/src/core/economy.js",
  "/src/core/fixed-timestep.js",
  "/src/core/profile-store.js",
  "/src/core/rng.js",
  "/src/core/run-receipt.js",
  "/src/game/abilities.js",
  "/src/game/content.js",
  "/src/game/equipment.js",
  "/src/game/game.js",
  "/src/game/heroes.js",
  "/src/game/progression.js",
  "/src/ui/app.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && new URL(event.request.url).origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(
          () =>
            cached ??
            new Response("DOFFA Heroes is offline and this asset is not cached.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            }),
        );
      return cached ?? network;
    }),
  );
});
