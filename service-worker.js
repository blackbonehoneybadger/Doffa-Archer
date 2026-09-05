const CACHE_PREFIX = "doffa-heroes-";
const CACHE_NAME = "doffa-heroes-v0.20.0";
const APP_SHELL_PATH = "/index.html";
const APP_NAVIGATION_PATHS = new Set(["/", APP_SHELL_PATH]);
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/assets/icon.svg",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/icon-maskable-512.png",
  "/assets/rooms/hollow-roastery-ash-v1.jpg",
  "/assets/rooms/hollow-roastery-ash-v2.jpg",
  "/assets/rooms/hollow-roastery-ember-v1.jpg",
  "/assets/rooms/hollow-roastery-ember-v2.jpg",
  "/assets/rooms/hollow-roastery-brass-v1.jpg",
  "/assets/rooms/hollow-roastery-brass-v2.jpg",
  "/assets/rooms/hollow-roastery-smoke-v1.jpg",
  "/assets/rooms/hollow-roastery-smoke-v2.jpg",
  "/assets/rooms/hollow-roastery-pressure-v1.jpg",
  "/assets/rooms/hollow-roastery-pressure-v2.jpg",
  "/assets/rooms/hollow-roastery-heart-v1.jpg",
  "/assets/rooms/hollow-roastery-cooling-reservoir-v1.jpg",
  "/assets/rooms/hollow-roastery-brokers-meter-v1.jpg",
  "/assets/rooms/hollow-roastery-filter-chapel-v1.jpg",
  "/assets/rooms/hollow-roastery-redline-contract-v1.jpg",
  "/assets/props/ash-collection-crate-v1.png",
  "/assets/props/ember-canister-v1.png",
  "/assets/props/brass-grinder-case-v1.png",
  "/assets/props/smoke-filter-urn-v1.png",
  "/assets/props/pressure-tank-v1.png",
  "/assets/heroes/honey-badger-lean-v3.png",
  "/assets/heroes/honey-badger-directions-v3.png",
  "/assets/heroes/honey-badger-motion-v3.png",
  "/assets/heroes/honey-badger-full-motion-v3.png",
  "/assets/heroes/honey-badger-shuriken-attack-v1.png",
  "/assets/heroes/honey-badger-reactions-v2.png",
  "/assets/heroes/boy-identity-v3.png",
  "/assets/heroes/boy-directions-v3.png",
  "/assets/heroes/boy-motion-v3.png",
  "/assets/heroes/boy-full-motion-v3.png",
  "/assets/heroes/boy-reactions-v2.png",
  "/assets/heroes/mr-kroo-bow-v4.png",
  "/assets/heroes/mr-kroo-directions-v4.png",
  "/assets/heroes/mr-kroo-motion-v4.png",
  "/assets/heroes/mr-kroo-full-motion-v4.png",
  "/assets/heroes/mr-kroo-reactions-v3.png",
  "/assets/heroes/hadida-papakha-v3.png",
  "/assets/heroes/hadida-directions-v3.png",
  "/assets/heroes/hadida-motion-v3.png",
  "/assets/heroes/hadida-full-motion-v3.png",
  "/assets/heroes/hadida-reactions-v2.png",
  "/assets/heroes/pata.png",
  "/assets/heroes/pata-directions.png",
  "/assets/heroes/pata-motion.png",
  "/assets/heroes/pata-full-motion-v2.png",
  "/assets/heroes/pata-reactions-v1.png",
  "/assets/heroes/portraits/honey-badger-portrait-v1.png",
  "/assets/heroes/portraits/hadida-portrait-v1.png",
  "/assets/heroes/portraits/boy-portrait-v1.png",
  "/assets/heroes/portraits/mr-kroo-portrait-v1.png",
  "/assets/heroes/portraits/pata-portrait-v1.png",
  "/assets/ui/golden-coffee-bean-v1.png",
  "/assets/ui/ordinary-coffee-bean-v1.png",
  "/assets/ui/katana-v1.png",
  "/assets/ui/shuriken-v1.png",
  "/assets/ui/bat-v1.png",
  "/assets/ui/cigarette-butt-v1.png",
  "/assets/ui/hammer-v1.png",
  "/assets/ui/gold-pistol-v1.png",
  "/assets/ui/circassian-dagger-v1.png",
  "/assets/ui/bow-v1.png",
  "/assets/ui/punch-v1.png",
  "/assets/ui/coffee-rifle-v1.png",
  "/assets/enemies/ash-hound.png",
  "/assets/enemies/ash-hound-motion-v1.png",
  "/assets/enemies/ember-oracle.png",
  "/assets/enemies/ember-oracle-motion-v1.png",
  "/assets/enemies/brass-colossus.png",
  "/assets/enemies/brass-colossus-motion-v1.png",
  "/assets/enemies/smoke-revenant.png",
  "/assets/enemies/smoke-revenant-motion-v1.png",
  "/assets/enemies/kiln-warden.png",
  "/assets/enemies/kiln-warden-motion-v1.png",
  "/assets/enemies/pressure-widow.png",
  "/assets/enemies/pressure-widow-motion-v1.png",
  "/assets/enemies/cinder-bishop.png",
  "/assets/enemies/cinder-bishop-motion-v1.png",
  "/assets/enemies/grinder-saint.png",
  "/assets/enemies/grinder-saint-motion-v1.png",
  "/assets/enemies/hollow-roaster-kaprizard-v3.png",
  "/assets/enemies/hollow-roaster-motion-v2.png",
  "/assets/enemies/hollow-roaster-special-v1.png",
  "/assets/enemies/hollow-roaster-reactions-v1.png",
  "/styles/main.css",
  "/src/main.js",
  "/src/config/game-config.js",
  "/src/core/active-run-checkpoint.js",
  "/src/core/economy.js",
  "/src/core/fixed-timestep.js",
  "/src/core/profile-store.js",
  "/src/core/rng.js",
  "/src/core/run-receipt.js",
  "/src/audio/combat-voice.js",
  "/src/audio/game-audio.js",
  "/src/i18n/locales.js",
  "/src/game/abilities.js",
  "/src/game/animation-page-cache.js",
  "/src/game/animation-player.js",
  "/src/game/arena-geometry.js",
  "/src/game/asset-window.js",
  "/src/game/content.js",
  "/src/game/arena-tours.js",
  "/src/game/destructibles.js",
  "/src/game/encounter-design.js",
  "/src/game/equipment.js",
  "/src/game/enemy-animation.js",
  "/src/game/enemy-difficulty.js",
  "/src/game/enemy-sprites.js",
  "/src/game/enemy-projectiles.js",
  "/src/game/game.js",
  "/src/game/hero-sprites.js",
  "/src/game/heroes.js",
  "/src/game/hero-weapons.js",
  "/src/game/player-animation.js",
  "/src/game/sprite-render-metrics.js",
  "/src/game/progression.js",
  "/src/game/room-art.js",
  "/src/game/room-effects.js",
  "/src/game/room-tradeoffs.js",
  "/src/game/run-progression.js",
  "/src/game/sprite-loader.js",
  "/src/ui/app.js",
];

const TOUR_ASSETS = [
  "/assets/enemies/abyssal-maw.png",
  "/assets/enemies/amethyst-hunter.png",
  "/assets/enemies/ashen-titan.png",
  "/assets/enemies/basalt-colossus.png",
  "/assets/enemies/boiler-tyrant.png",
  "/assets/enemies/briar-jaguar-motion-v1.png",
  "/assets/enemies/briar-jaguar-reactions-v1.png",
  "/assets/enemies/briar-jaguar-special-v1.png",
  "/assets/enemies/briar-jaguar.png",
  "/assets/enemies/cinder-hound.png",
  "/assets/enemies/cinder-warden.png",
  "/assets/enemies/coral-guardian.png",
  "/assets/enemies/crystal-golem.png",
  "/assets/enemies/crystal-shardling.png",
  "/assets/enemies/crystal-sovereign.png",
  "/assets/enemies/drowned-colossus.png",
  "/assets/enemies/ember-wraith.png",
  "/assets/enemies/forge-core-tyrant.png",
  "/assets/enemies/forge-sentinel.png",
  "/assets/enemies/forge-spider.png",
  "/assets/enemies/furnace-overlord.png",
  "/assets/enemies/furnace-wisp.png",
  "/assets/enemies/geode-warden.png",
  "/assets/enemies/kelp-stalker.png",
  "/assets/enemies/lava-golem.png",
  "/assets/enemies/leviathan-brood.png",
  "/assets/enemies/magma-hunter.png",
  "/assets/enemies/mire-bellower-motion-v1.png",
  "/assets/enemies/mire-bellower-reactions-v1.png",
  "/assets/enemies/mire-bellower-special-v1.png",
  "/assets/enemies/mire-bellower.png",
  "/assets/enemies/orchid-maw-motion-v1.png",
  "/assets/enemies/orchid-maw-reactions-v1.png",
  "/assets/enemies/orchid-maw-special-v1.png",
  "/assets/enemies/orchid-maw.png",
  "/assets/enemies/prism-ape.png",
  "/assets/enemies/prism-moth.png",
  "/assets/enemies/pyre-saint.png",
  "/assets/enemies/razor-mantis-motion-v1.png",
  "/assets/enemies/razor-mantis.png",
  "/assets/enemies/reef-maw.png",
  "/assets/enemies/root-stalker-motion-v1.png",
  "/assets/enemies/root-stalker.png",
  "/assets/enemies/rootfall-tyrant-kaprizard-v1.png",
  "/assets/enemies/rootfall-tyrant-motion-v1.png",
  "/assets/enemies/rootfall-tyrant-reactions-v1.png",
  "/assets/enemies/rootfall-tyrant-special-v1.png",
  "/assets/enemies/seed-spitter-motion-v1.png",
  "/assets/enemies/seed-spitter.png",
  "/assets/enemies/shard-colossus.png",
  "/assets/enemies/slag-colossus.png",
  "/assets/enemies/slag-hound.png",
  "/assets/enemies/spore-moth-motion-v1.png",
  "/assets/enemies/spore-moth.png",
  "/assets/enemies/strangler-ape-motion-v1.png",
  "/assets/enemies/strangler-ape-reactions-v1.png",
  "/assets/enemies/strangler-ape-special-v1.png",
  "/assets/enemies/strangler-ape.png",
  "/assets/enemies/sunken-leviathan.png",
  "/assets/enemies/tide-urchin.png",
  "/assets/rooms/ashen-wastes-basalt-v1.jpg",
  "/assets/rooms/ashen-wastes-basalt-v2.jpg",
  "/assets/rooms/ashen-wastes-cinder-v1.jpg",
  "/assets/rooms/ashen-wastes-cinder-v2.jpg",
  "/assets/rooms/ashen-wastes-event-v1.jpg",
  "/assets/rooms/ashen-wastes-event-v2.jpg",
  "/assets/rooms/ashen-wastes-heart-v1.jpg",
  "/assets/rooms/ashen-wastes-lava-cracks-v1.jpg",
  "/assets/rooms/ashen-wastes-magma-v1.jpg",
  "/assets/rooms/ashen-wastes-magma-v2.jpg",
  "/assets/rooms/ashen-wastes-pyre-v2.jpg",
  "/assets/rooms/ashen-wastes-rest-v1.jpg",
  "/assets/rooms/ashen-wastes-rest-v2.jpg",
  "/assets/rooms/crystal-caverns-amethyst-v1.jpg",
  "/assets/rooms/crystal-caverns-amethyst-v2.jpg",
  "/assets/rooms/crystal-caverns-event-v1.jpg",
  "/assets/rooms/crystal-caverns-event-v2.jpg",
  "/assets/rooms/crystal-caverns-geode-v1.jpg",
  "/assets/rooms/crystal-caverns-geode-v2.jpg",
  "/assets/rooms/crystal-caverns-heart-v1.jpg",
  "/assets/rooms/crystal-caverns-prism-v1.jpg",
  "/assets/rooms/crystal-caverns-prism-v2.jpg",
  "/assets/rooms/crystal-caverns-rest-v1.jpg",
  "/assets/rooms/crystal-caverns-rest-v2.jpg",
  "/assets/rooms/crystal-caverns-shard-court-v1.jpg",
  "/assets/rooms/crystal-caverns-shard-court-v2.jpg",
  "/assets/rooms/forge-depths-boiler-v1.jpg",
  "/assets/rooms/forge-depths-boiler-v2.jpg",
  "/assets/rooms/forge-depths-event-v1.jpg",
  "/assets/rooms/forge-depths-event-v2.jpg",
  "/assets/rooms/forge-depths-furnace-v1.jpg",
  "/assets/rooms/forge-depths-furnace-v2.jpg",
  "/assets/rooms/forge-depths-heart-v1.jpg",
  "/assets/rooms/forge-depths-lava-hall-v1.jpg",
  "/assets/rooms/forge-depths-lava-hall-v2.jpg",
  "/assets/rooms/forge-depths-pipeworks-v1.jpg",
  "/assets/rooms/forge-depths-pipeworks-v2.jpg",
  "/assets/rooms/forge-depths-rest-v1.jpg",
  "/assets/rooms/forge-depths-rest-v2.jpg",
  "/assets/rooms/forge-depths-slag-v1.jpg",
  "/assets/rooms/forge-depths-slag-v2.jpg",
  "/assets/rooms/rootfall-jungle-bloodroot-bargain-v1.jpg",
  "/assets/rooms/rootfall-jungle-briar-v1.jpg",
  "/assets/rooms/rootfall-jungle-briar-v2.jpg",
  "/assets/rooms/rootfall-jungle-canopy-v1.jpg",
  "/assets/rooms/rootfall-jungle-canopy-v2.jpg",
  "/assets/rooms/rootfall-jungle-clearwater-hollow-v1.jpg",
  "/assets/rooms/rootfall-jungle-mire-v1.jpg",
  "/assets/rooms/rootfall-jungle-mire-v2.jpg",
  "/assets/rooms/rootfall-jungle-moondew-sanctuary-v1.jpg",
  "/assets/rooms/rootfall-jungle-mycelium-v1.jpg",
  "/assets/rooms/rootfall-jungle-mycelium-v2.jpg",
  "/assets/rooms/rootfall-jungle-rootdeep-v1.jpg",
  "/assets/rooms/rootfall-jungle-rootdeep-v2.jpg",
  "/assets/rooms/rootfall-jungle-rootheart-v1.jpg",
  "/assets/rooms/rootfall-jungle-symbiotic-shrine-v1.jpg",
  "/assets/rooms/sunken-ruins-coral-v1.jpg",
  "/assets/rooms/sunken-ruins-coral-v2.jpg",
  "/assets/rooms/sunken-ruins-depths-v1.jpg",
  "/assets/rooms/sunken-ruins-depths-v2.jpg",
  "/assets/rooms/sunken-ruins-event-v1.jpg",
  "/assets/rooms/sunken-ruins-event-v2.jpg",
  "/assets/rooms/sunken-ruins-flooded-court-v1.jpg",
  "/assets/rooms/sunken-ruins-kelp-v1.jpg",
  "/assets/rooms/sunken-ruins-kelp-v2.jpg",
  "/assets/rooms/sunken-ruins-pillar-v1.jpg",
  "/assets/rooms/sunken-ruins-pillar-v2.jpg",
  "/assets/rooms/sunken-ruins-rest-v1.jpg",
  "/assets/rooms/sunken-ruins-rest-v2.jpg",
  "/assets/rooms/sunken-ruins-tide-v2.jpg",
];
const CACHEABLE_ASSET_PATHS = new Set(
  [...CORE_ASSETS, ...TOUR_ASSETS].filter((path) => path !== "/"),
);
const RASTER_ART_PATHS = new Set(
  [...CACHEABLE_ASSET_PATHS].filter((path) => /\.(?:png|jpe?g)$/i.test(path)),
);
const PWA_ICON_PATHS = new Set([
  "/assets/icon.svg",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/icon-maskable-512.png",
]);
const PRECACHE_ASSETS = CORE_ASSETS.filter(
  (path) => !path.startsWith("/assets/") || PWA_ICON_PATHS.has(path),
);

function getExpectedRasterContentType(pathname) {
  if (/\.png$/i.test(pathname)) {
    return "image/png";
  }
  if (/\.jpe?g$/i.test(pathname)) {
    return "image/jpeg";
  }
  return null;
}

function hasExpectedRasterContentType(pathname, response) {
  const expected = getExpectedRasterContentType(pathname);
  if (!expected || !response?.ok) {
    return false;
  }
  const actual = response.headers.get("Content-Type")
    ?.split(";", 1)[0]
    ?.trim()
    ?.toLowerCase();
  return actual === expected;
}

function canCacheAssetResponse(pathname, response) {
  if (!response?.ok) {
    return false;
  }
  return !RASTER_ART_PATHS.has(pathname)
    || hasExpectedRasterContentType(pathname, response);
}

async function migrateAllowlistedRasterArt(obsoleteCacheNames) {
  const targetCache = await caches.open(CACHE_NAME);
  const sourceCaches = await Promise.all(
    [...obsoleteCacheNames].reverse().map(async (cacheName) => ({
      cacheName,
      cache: await caches.open(cacheName),
    })),
  );

  const deleteSourceCopies = async (pathname) => {
    await Promise.all(sourceCaches.map(({ cache }) => cache.delete(pathname)));
  };

  for (const pathname of RASTER_ART_PATHS) {
    const current = await targetCache.match(pathname);
    if (hasExpectedRasterContentType(pathname, current)) {
      await deleteSourceCopies(pathname);
      continue;
    }
    if (current) {
      await targetCache.delete(pathname);
    }

    for (const { cache: sourceCache } of sourceCaches) {
      const candidate = await sourceCache.match(pathname);
      if (!hasExpectedRasterContentType(pathname, candidate)) {
        continue;
      }
      await targetCache.put(pathname, candidate.clone());
      await deleteSourceCopies(pathname);
      break;
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then(async (keys) => {
        const obsoleteCacheNames = keys.filter(
          (key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME,
        );
        await migrateAllowlistedRasterArt(obsoleteCacheNames);
        await Promise.all(obsoleteCacheNames.map((key) => caches.delete(key)));
      })
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

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    if (!APP_NAVIGATION_PATHS.has(requestUrl.pathname)) {
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          const contentType = response.headers.get("Content-Type") ?? "";
          if (response.ok && contentType.toLowerCase().includes("text/html")) {
            const copy = response.clone();
            await caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(APP_SHELL_PATH, copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return await cache.match(APP_SHELL_PATH)
          ?? new Response("DOFFA Heroes is offline and the app shell is not cached.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }),
    );
    return;
  }

  if (!CACHEABLE_ASSET_PATHS.has(requestUrl.pathname)) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedCandidate = await cache.match(event.request);
    const cached = RASTER_ART_PATHS.has(requestUrl.pathname)
      && cachedCandidate
      && !hasExpectedRasterContentType(requestUrl.pathname, cachedCandidate)
      ? (await cache.delete(event.request), undefined)
      : cachedCandidate;
    const network = fetch(event.request)
      .then(async (response) => {
        if (canCacheAssetResponse(requestUrl.pathname, response)) {
          const copy = response.clone();
          await cache.put(event.request, copy).catch(() => {});
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
  })());
});const ROOM_ART_ASSETS = Object.freeze([
  "/assets/rooms/ashen-wastes-basalt-v1.jpg",
  "/assets/rooms/ashen-wastes-basalt-v2.jpg",
  "/assets/rooms/ashen-wastes-cinder-v1.jpg",
  "/assets/rooms/ashen-wastes-cinder-v2.jpg",
  "/assets/rooms/ashen-wastes-event-v1.jpg",
  "/assets/rooms/ashen-wastes-event-v2.jpg",
  "/assets/rooms/ashen-wastes-heart-v1.jpg",
  "/assets/rooms/ashen-wastes-lava-cracks-v1.jpg",
  "/assets/rooms/ashen-wastes-magma-v1.jpg",
  "/assets/rooms/ashen-wastes-magma-v2.jpg",
  "/assets/rooms/ashen-wastes-pyre-v2.jpg",
  "/assets/rooms/ashen-wastes-rest-v1.jpg",
  "/assets/rooms/ashen-wastes-rest-v2.jpg",
  "/assets/rooms/crystal-caverns-amethyst-v1.jpg",
  "/assets/rooms/crystal-caverns-amethyst-v2.jpg",
  "/assets/rooms/crystal-caverns-event-v1.jpg",
  "/assets/rooms/crystal-caverns-event-v2.jpg",
  "/assets/rooms/crystal-caverns-geode-v1.jpg",
  "/assets/rooms/crystal-caverns-geode-v2.jpg",
  "/assets/rooms/crystal-caverns-heart-v1.jpg",
  "/assets/rooms/crystal-caverns-prism-v1.jpg",
  "/assets/rooms/crystal-caverns-prism-v2.jpg",
  "/assets/rooms/crystal-caverns-rest-v1.jpg",
  "/assets/rooms/crystal-caverns-rest-v2.jpg",
  "/assets/rooms/crystal-caverns-shard-court-v1.jpg",
  "/assets/rooms/forge-depths-boiler-v1.jpg",
  "/assets/rooms/forge-depths-boiler-v2.jpg",
  "/assets/rooms/forge-depths-event-v1.jpg",
  "/assets/rooms/forge-depths-event-v2.jpg",
  "/assets/rooms/forge-depths-furnace-v1.jpg",
  "/assets/rooms/forge-depths-furnace-v2.jpg",
  "/assets/rooms/forge-depths-heart-v1.jpg",
  "/assets/rooms/forge-depths-lava-hall-v1.jpg",
  "/assets/rooms/forge-depths-lava-hall-v2.jpg",
  "/assets/rooms/forge-depths-pipeworks-v1.jpg",
  "/assets/rooms/forge-depths-pipeworks-v2.jpg",
  "/assets/rooms/forge-depths-rest-v1.jpg",
  "/assets/rooms/forge-depths-rest-v2.jpg",
  "/assets/rooms/forge-depths-slag-v1.jpg",
  "/assets/rooms/forge-depths-slag-v2.jpg",
  "/assets/rooms/hollow-roastery-ash-v1.jpg",
  "/assets/rooms/hollow-roastery-ash-v2.jpg",
  "/assets/rooms/hollow-roastery-brass-v1.jpg",
  "/assets/rooms/hollow-roastery-brass-v2.jpg",
  "/assets/rooms/hollow-roastery-brokers-meter-v1.jpg",
  "/assets/rooms/hollow-roastery-cooling-reservoir-v1.jpg",
  "/assets/rooms/hollow-roastery-ember-v1.jpg",
  "/assets/rooms/hollow-roastery-ember-v2.jpg",
  "/assets/rooms/hollow-roastery-filter-chapel-v1.jpg",
  "/assets/rooms/hollow-roastery-heart-v1.jpg",
  "/assets/rooms/hollow-roastery-pressure-v1.jpg",
  "/assets/rooms/hollow-roastery-pressure-v2.jpg",
  "/assets/rooms/hollow-roastery-redline-contract-v1.jpg",
  "/assets/rooms/hollow-roastery-smoke-v1.jpg",
  "/assets/rooms/hollow-roastery-smoke-v2.jpg",
  "/assets/rooms/rootfall-jungle-bloodroot-bargain-v1.jpg",
  "/assets/rooms/rootfall-jungle-briar-v1.jpg",
  "/assets/rooms/rootfall-jungle-briar-v2.jpg",
  "/assets/rooms/rootfall-jungle-canopy-v1.jpg",
  "/assets/rooms/rootfall-jungle-canopy-v2.jpg",
  "/assets/rooms/rootfall-jungle-clearwater-hollow-v1.jpg",
  "/assets/rooms/rootfall-jungle-mire-v1.jpg",
  "/assets/rooms/rootfall-jungle-mire-v2.jpg",
  "/assets/rooms/rootfall-jungle-moondew-sanctuary-v1.jpg",
  "/assets/rooms/rootfall-jungle-mycelium-v1.jpg",
  "/assets/rooms/rootfall-jungle-mycelium-v2.jpg",
  "/assets/rooms/rootfall-jungle-rootdeep-v1.jpg",
  "/assets/rooms/rootfall-jungle-rootdeep-v2.jpg",
  "/assets/rooms/rootfall-jungle-rootheart-v1.jpg",
  "/assets/rooms/rootfall-jungle-symbiotic-shrine-v1.jpg",
  "/assets/rooms/sunken-ruins-coral-v1.jpg",
  "/assets/rooms/sunken-ruins-coral-v2.jpg",
  "/assets/rooms/sunken-ruins-depths-v1.jpg",
  "/assets/rooms/sunken-ruins-depths-v2.jpg",
  "/assets/rooms/sunken-ruins-event-v1.jpg",
  "/assets/rooms/sunken-ruins-event-v2.jpg",
  "/assets/rooms/sunken-ruins-flooded-court-v1.jpg",
  "/assets/rooms/sunken-ruins-kelp-v1.jpg",
  "/assets/rooms/sunken-ruins-kelp-v2.jpg",
  "/assets/rooms/sunken-ruins-pillar-v1.jpg",
  "/assets/rooms/sunken-ruins-pillar-v2.jpg",
  "/assets/rooms/sunken-ruins-rest-v1.jpg",
  "/assets/rooms/sunken-ruins-rest-v2.jpg",
  "/assets/rooms/sunken-ruins-tide-v2.jpg",
]);


