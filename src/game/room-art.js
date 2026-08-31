export const ROOM_ENVIRONMENTS = Object.freeze([
  "ash",
  "ember",
  "brass",
  "smoke",
  "pressure",
  "heart",
  "canopy",
  "mire",
  "mycelium",
  "briar",
  "rootdeep",
  "rootheart",
  "lava",
  "pipeworks",
  "boiler",
  "slag",
  "furnace",
  "forgeheart",
  "shard",
  "amethyst",
  "geode",
  "prism",
  "crystalheart",
  "coral",
  "pillar",
  "kelp",
  "tide",
  "depths",
  "cinder",
  "basalt",
  "magma",
  "pyre",
  "ashenheart",
]);

function freezeVariants(variants) {
  return Object.freeze(variants.map((variant) => Object.freeze({
    backdrop: "transparent",
    ...variant,
  })));
}

export const ROOM_ART_CATALOG = Object.freeze({
  ash: Object.freeze({
    variants: freezeVariants([
      { id: "ash-storage", sprite: "/assets/rooms/hollow-roastery-ash-v1.jpg" },
      { id: "soot-conveyor", sprite: "/assets/rooms/hollow-roastery-ash-v2.jpg" },
    ]),
  }),
  ember: Object.freeze({
    variants: freezeVariants([
      { id: "cracked-furnace", sprite: "/assets/rooms/hollow-roastery-ember-v1.jpg" },
      { id: "boiler-gallery", sprite: "/assets/rooms/hollow-roastery-ember-v2.jpg" },
    ]),
    specials: freezeVariants([
      {
        id: "cooling-reservoir",
        sprite: "/assets/rooms/hollow-roastery-cooling-reservoir-v1.jpg",
      },
    ]),
  }),
  brass: Object.freeze({
    variants: freezeVariants([
      { id: "grinder-hall", sprite: "/assets/rooms/hollow-roastery-brass-v1.jpg" },
      { id: "meter-chamber", sprite: "/assets/rooms/hollow-roastery-brass-v2.jpg" },
    ]),
    specials: freezeVariants([
      {
        id: "brokers-meter",
        sprite: "/assets/rooms/hollow-roastery-brokers-meter-v1.jpg",
      },
    ]),
  }),
  smoke: Object.freeze({
    variants: freezeVariants([
      { id: "steam-chamber", sprite: "/assets/rooms/hollow-roastery-smoke-v1.jpg" },
      { id: "vapor-crypt", sprite: "/assets/rooms/hollow-roastery-smoke-v2.jpg" },
    ]),
    specials: freezeVariants([
      {
        id: "filter-chapel",
        sprite: "/assets/rooms/hollow-roastery-filter-chapel-v1.jpg",
      },
    ]),
  }),
  pressure: Object.freeze({
    variants: freezeVariants([
      { id: "pressure-works", sprite: "/assets/rooms/hollow-roastery-pressure-v1.jpg" },
      { id: "final-gauge", sprite: "/assets/rooms/hollow-roastery-pressure-v2.jpg" },
    ]),
    specials: freezeVariants([
      {
        id: "redline-contract",
        sprite: "/assets/rooms/hollow-roastery-redline-contract-v1.jpg",
      },
    ]),
  }),
  heart: Object.freeze({
    variants: freezeVariants([
      { id: "roaster-heart", sprite: "/assets/rooms/hollow-roastery-heart-v1.jpg" },
    ]),
  }),
  canopy: Object.freeze({
    variants: freezeVariants([
      { id: "rootwake-landing", sprite: "/assets/rooms/rootfall-jungle-canopy-v1.jpg" },
      { id: "sunken-canopy-cloister", sprite: "/assets/rooms/rootfall-jungle-canopy-v2.jpg" },
    ]),
  }),
  mire: Object.freeze({
    variants: freezeVariants([
      { id: "drowned-fen", sprite: "/assets/rooms/rootfall-jungle-mire-v1.jpg" },
      { id: "drowned-causeway", sprite: "/assets/rooms/rootfall-jungle-mire-v2.jpg" },
    ]),
    specials: freezeVariants([
      {
        id: "clearwater-hollow",
        sprite: "/assets/rooms/rootfall-jungle-clearwater-hollow-v1.jpg",
      },
    ]),
  }),
  mycelium: Object.freeze({
    variants: freezeVariants([
      { id: "mycelial-basilica", sprite: "/assets/rooms/rootfall-jungle-mycelium-v1.jpg" },
      { id: "spore-nave", sprite: "/assets/rooms/rootfall-jungle-mycelium-v2.jpg" },
    ]),
    specials: freezeVariants([
      {
        id: "symbiotic-shrine",
        sprite: "/assets/rooms/rootfall-jungle-symbiotic-shrine-v1.jpg",
      },
    ]),
  }),
  briar: Object.freeze({
    variants: freezeVariants([
      { id: "thorn-reliquary", sprite: "/assets/rooms/rootfall-jungle-briar-v1.jpg" },
      { id: "crimson-thorn-court", sprite: "/assets/rooms/rootfall-jungle-briar-v2.jpg" },
    ]),
    specials: freezeVariants([
      {
        id: "moondew-sanctuary",
        sprite: "/assets/rooms/rootfall-jungle-moondew-sanctuary-v1.jpg",
      },
    ]),
  }),
  rootdeep: Object.freeze({
    variants: freezeVariants([
      { id: "rootfall-depths", sprite: "/assets/rooms/rootfall-jungle-rootdeep-v1.jpg" },
      { id: "black-sap-vault", sprite: "/assets/rooms/rootfall-jungle-rootdeep-v2.jpg" },
    ]),
    specials: freezeVariants([
      {
        id: "bloodroot-bargain",
        sprite: "/assets/rooms/rootfall-jungle-bloodroot-bargain-v1.jpg",
      },
    ]),
  }),
  rootheart: Object.freeze({
    variants: freezeVariants([
      { id: "root-throne", sprite: "/assets/rooms/rootfall-jungle-rootheart-v1.jpg" },
    ]),
  }),
  lava: Object.freeze({
    variants: freezeVariants([
      { id: "lava-hall", sprite: "/assets/rooms/forge-depths-lava-hall-v1.jpg" },
      { id: "lava-hall-alt", sprite: "/assets/rooms/forge-depths-lava-hall-v2.jpg" },
    ]),
    specials: freezeVariants([
      { id: "forge-rest", sprite: "/assets/rooms/forge-depths-rest-v1.jpg" },
      { id: "forge-event", sprite: "/assets/rooms/forge-depths-event-v1.jpg" },
      { id: "forge-rest-15", sprite: "/assets/rooms/forge-depths-rest-v1.jpg" },
      { id: "forge-event-25", sprite: "/assets/rooms/forge-depths-event-v1.jpg" },
      { id: "forge-rest-35", sprite: "/assets/rooms/forge-depths-rest-v1.jpg" },
      { id: "forge-event-45", sprite: "/assets/rooms/forge-depths-event-v1.jpg" },
    ]),
  }),
  pipeworks: Object.freeze({
    variants: freezeVariants([
      { id: "pipeworks", sprite: "/assets/rooms/forge-depths-pipeworks-v1.jpg" },
      { id: "pipeworks-alt", sprite: "/assets/rooms/forge-depths-pipeworks-v2.jpg" },
    ]),
  }),
  boiler: Object.freeze({
    variants: freezeVariants([
      { id: "boiler", sprite: "/assets/rooms/forge-depths-boiler-v1.jpg" },
      { id: "boiler-alt", sprite: "/assets/rooms/forge-depths-boiler-v2.jpg" },
    ]),
  }),
  slag: Object.freeze({
    variants: freezeVariants([
      { id: "slag", sprite: "/assets/rooms/forge-depths-slag-v1.jpg" },
      { id: "slag-alt", sprite: "/assets/rooms/forge-depths-slag-v2.jpg" },
    ]),
  }),
  furnace: Object.freeze({
    variants: freezeVariants([
      { id: "furnace", sprite: "/assets/rooms/forge-depths-lava-hall-v1.jpg" },
      { id: "furnace-alt", sprite: "/assets/rooms/forge-depths-slag-v2.jpg" },
    ]),
  }),
  forgeheart: Object.freeze({
    variants: freezeVariants([
      { id: "forge-core", sprite: "/assets/rooms/forge-depths-heart-v1.jpg" },
    ]),
  }),
  shard: Object.freeze({
    variants: freezeVariants([
      { id: "shard-court", sprite: "/assets/rooms/crystal-caverns-shard-court-v1.jpg" },
      { id: "shard-court-alt", sprite: "/assets/rooms/crystal-caverns-geode-v2.jpg" },
    ]),
    specials: freezeVariants([
      { id: "crystal-rest", sprite: "/assets/rooms/crystal-caverns-rest-v1.jpg" },
      { id: "crystal-event", sprite: "/assets/rooms/crystal-caverns-event-v1.jpg" },
      { id: "crystal-rest-15", sprite: "/assets/rooms/crystal-caverns-rest-v1.jpg" },
      { id: "crystal-event-25", sprite: "/assets/rooms/crystal-caverns-event-v1.jpg" },
      { id: "crystal-rest-35", sprite: "/assets/rooms/crystal-caverns-rest-v1.jpg" },
      { id: "crystal-event-45", sprite: "/assets/rooms/crystal-caverns-event-v1.jpg" },
    ]),
  }),
  amethyst: Object.freeze({
    variants: freezeVariants([
      { id: "amethyst", sprite: "/assets/rooms/crystal-caverns-amethyst-v1.jpg" },
      { id: "amethyst-alt", sprite: "/assets/rooms/crystal-caverns-amethyst-v2.jpg" },
    ]),
  }),
  geode: Object.freeze({
    variants: freezeVariants([
      { id: "geode", sprite: "/assets/rooms/crystal-caverns-geode-v1.jpg" },
      { id: "geode-alt", sprite: "/assets/rooms/crystal-caverns-geode-v2.jpg" },
    ]),
  }),
  prism: Object.freeze({
    variants: freezeVariants([
      { id: "prism", sprite: "/assets/rooms/crystal-caverns-prism-v1.jpg" },
      { id: "prism-alt", sprite: "/assets/rooms/crystal-caverns-prism-v2.jpg" },
    ]),
  }),
  crystalheart: Object.freeze({
    variants: freezeVariants([
      { id: "crystal-throne", sprite: "/assets/rooms/crystal-caverns-heart-v1.jpg" },
    ]),
  }),
  coral: Object.freeze({
    variants: freezeVariants([
      { id: "coral", sprite: "/assets/rooms/sunken-ruins-coral-v1.jpg" },
      { id: "coral-alt", sprite: "/assets/rooms/sunken-ruins-coral-v2.jpg" },
    ]),
    specials: freezeVariants([
      { id: "sunken-rest", sprite: "/assets/rooms/sunken-ruins-rest-v1.jpg" },
      { id: "sunken-event", sprite: "/assets/rooms/sunken-ruins-event-v1.jpg" },
      { id: "sunken-rest-15", sprite: "/assets/rooms/sunken-ruins-rest-v1.jpg" },
      { id: "sunken-event-25", sprite: "/assets/rooms/sunken-ruins-event-v1.jpg" },
      { id: "sunken-rest-35", sprite: "/assets/rooms/sunken-ruins-rest-v1.jpg" },
      { id: "sunken-event-45", sprite: "/assets/rooms/sunken-ruins-event-v1.jpg" },
    ]),
  }),
  pillar: Object.freeze({
    variants: freezeVariants([
      { id: "pillar", sprite: "/assets/rooms/sunken-ruins-pillar-v1.jpg" },
      { id: "pillar-alt", sprite: "/assets/rooms/sunken-ruins-pillar-v2.jpg" },
    ]),
  }),
  kelp: Object.freeze({
    variants: freezeVariants([
      { id: "kelp", sprite: "/assets/rooms/sunken-ruins-kelp-v1.jpg" },
      { id: "kelp-alt", sprite: "/assets/rooms/sunken-ruins-kelp-v2.jpg" },
    ]),
  }),
  tide: Object.freeze({
    variants: freezeVariants([
      { id: "tide", sprite: "/assets/rooms/sunken-ruins-flooded-court-v1.jpg" },
      { id: "tide-alt", sprite: "/assets/rooms/sunken-ruins-tide-v2.jpg" },
    ]),
  }),
  depths: Object.freeze({
    variants: freezeVariants([
      { id: "depths", sprite: "/assets/rooms/sunken-ruins-kelp-v1.jpg" },
      { id: "depths-alt", sprite: "/assets/rooms/sunken-ruins-kelp-v2.jpg" },
    ]),
  }),
  cinder: Object.freeze({
    variants: freezeVariants([
      { id: "cinder", sprite: "/assets/rooms/ashen-wastes-cinder-v1.jpg" },
      { id: "cinder-alt", sprite: "/assets/rooms/ashen-wastes-cinder-v2.jpg" },
    ]),
    specials: freezeVariants([
      { id: "ashen-rest", sprite: "/assets/rooms/ashen-wastes-rest-v1.jpg" },
      { id: "ashen-event", sprite: "/assets/rooms/ashen-wastes-event-v1.jpg" },
      { id: "ashen-rest-15", sprite: "/assets/rooms/ashen-wastes-rest-v1.jpg" },
      { id: "ashen-event-25", sprite: "/assets/rooms/ashen-wastes-event-v1.jpg" },
      { id: "ashen-rest-35", sprite: "/assets/rooms/ashen-wastes-rest-v1.jpg" },
      { id: "ashen-event-45", sprite: "/assets/rooms/ashen-wastes-event-v1.jpg" },
    ]),
  }),
  basalt: Object.freeze({
    variants: freezeVariants([
      { id: "basalt", sprite: "/assets/rooms/ashen-wastes-basalt-v1.jpg" },
      { id: "basalt-alt", sprite: "/assets/rooms/ashen-wastes-basalt-v2.jpg" },
    ]),
  }),
  magma: Object.freeze({
    variants: freezeVariants([
      { id: "magma", sprite: "/assets/rooms/ashen-wastes-magma-v1.jpg" },
      { id: "magma-alt", sprite: "/assets/rooms/ashen-wastes-magma-v2.jpg" },
    ]),
  }),
  pyre: Object.freeze({
    variants: freezeVariants([
      { id: "pyre", sprite: "/assets/rooms/ashen-wastes-lava-cracks-v1.jpg" },
      { id: "pyre-alt", sprite: "/assets/rooms/ashen-wastes-cinder-v2.jpg" },
    ]),
  }),
  ashenheart: Object.freeze({
    variants: freezeVariants([
      { id: "ashen-throne", sprite: "/assets/rooms/ashen-wastes-heart-v1.jpg" },
    ]),
  }),
});

const roomEntries = new Map();
const roomIdentityEntries = new Map();
let nextRoomArtLeaseId = 1;

const ORGANIC_ROOM_ENVIRONMENTS = new Set([
  "canopy",
  "mire",
  "mycelium",
  "briar",
  "rootdeep",
  "rootheart",
  "shard",
  "amethyst",
  "geode",
  "prism",
  "crystalheart",
  "coral",
  "pillar",
  "kelp",
  "tide",
  "depths",
]);

function hashRoomId(roomId) {
  let hash = 2166136261;
  for (const character of String(roomId ?? "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mixRoomSeed(seed, salt) {
  let value = (seed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return value >>> 0;
}

function roomSeedUnit(seed, salt) {
  return mixRoomSeed(seed, salt) / 0x1_0000_0000;
}

function freezePoint(point) {
  return Object.freeze({
    x: Math.round(point.x * 1_000) / 1_000,
    y: Math.round(point.y * 1_000) / 1_000,
  });
}

function createRoomRoute(seed) {
  const direction = seed & 1 ? 1 : -1;
  const baseX = direction > 0 ? 0.18 : 0.82;
  const farX = direction > 0 ? 0.82 : 0.18;
  return Object.freeze([
    freezePoint({ x: baseX, y: 0.12 + roomSeedUnit(seed, 1) * 0.08 }),
    freezePoint({ x: 0.28 + roomSeedUnit(seed, 2) * 0.22, y: 0.34 + roomSeedUnit(seed, 3) * 0.08 }),
    freezePoint({ x: 0.5 + roomSeedUnit(seed, 4) * 0.22, y: 0.61 + roomSeedUnit(seed, 5) * 0.08 }),
    freezePoint({ x: farX, y: 0.84 + roomSeedUnit(seed, 6) * 0.08 }),
  ]);
}

function createRoomNodes(seed) {
  const count = 3 + (mixRoomSeed(seed, 7) % 3);
  return Object.freeze(Array.from({ length: count }, (_, index) => freezePoint({
    x: 0.13 + roomSeedUnit(seed, 11 + index * 2) * 0.74,
    y: 0.16 + roomSeedUnit(seed, 12 + index * 2) * 0.72,
  })));
}

/**
 * Return the deterministic visual fingerprint painted over a reusable room plate.
 *
 * The 16 visible radial bits are unique for every currently authored room;
 * route, topology, landmark, nodes and edge cuts make that identity readable at
 * gameplay scale instead of relying on an almost invisible tint variation.
 */
export function getRoomCompositeIdentity(roomId, roomNumber = 0, environment = "") {
  const normalizedRoomNumber = Number.isFinite(roomNumber)
    ? Math.max(0, Math.floor(roomNumber))
    : 0;
  const key = `${environment}:${roomId}:${normalizedRoomNumber}`;
  const cached = roomIdentityEntries.get(key);
  if (cached) {
    return cached;
  }

  const seed = hashRoomId(`${roomId}:${normalizedRoomNumber}`);
  const identity = Object.freeze({
    seed,
    style: ORGANIC_ROOM_ENVIRONMENTS.has(environment) ? "organic" : "industrial",
    mirror: Boolean(seed & 1),
    topology: mixRoomSeed(seed, 17) % 6,
    sigilBits: seed,
    tintAlpha: .04 + (mixRoomSeed(seed, 18) % 7) * .009,
    lightX: .18 + (mixRoomSeed(seed, 19) % 65) / 100,
    lightY: .2 + (mixRoomSeed(seed, 20) % 56) / 100,
    bandOffset: 300 + (mixRoomSeed(seed, 21) % 620),
    bandSlope: (mixRoomSeed(seed, 22) % 5) - 2,
    landmark: freezePoint({
      x: .23 + roomSeedUnit(seed, 23) * .54,
      y: .3 + roomSeedUnit(seed, 24) * .4,
    }),
    landmarkScale: .82 + roomSeedUnit(seed, 25) * .42,
    route: createRoomRoute(seed),
    nodes: createRoomNodes(seed),
    edgeMask: mixRoomSeed(seed, 26) & 0xff,
  });
  roomIdentityEntries.set(key, identity);
  return identity;
}

function clampLayoutValue(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getLayoutOffset(seed, salt, limit) {
  const span = limit * 2 + 1;
  return (mixRoomSeed(seed, salt) % span) - limit;
}

/**
 * Give repeated authored obstacle templates a small room-specific offset while
 * preserving counts, kinds, dimensions, hazard timing and navigable corridors.
 */
export function personalizeRoomLayout(layout, roomId, roomNumber = 0) {
  const source = layout ?? {};
  const obstacles = Array.isArray(source.obstacles) ? source.obstacles : [];
  const hazards = Array.isArray(source.hazards) ? source.hazards : [];
  if (obstacles.length === 0 && hazards.length === 0) {
    return { ...source, obstacles: [...obstacles], hazards: [...hazards] };
  }

  const seed = hashRoomId(`layout:${roomId}:${roomNumber}`);
  const mirror = Boolean(mixRoomSeed(seed, 27) & 1);
  const topology = mixRoomSeed(seed, 28) % 6;
  const laneShift = (topology - 2.5) * 13;
  return {
    ...source,
    obstacles: obstacles.map((obstacle, index) => {
      const authoredX = mirror ? 720 - obstacle.x - obstacle.width : obstacle.x;
      const stagger = index % 2 === 0 ? laneShift : -laneShift;
      const x = authoredX + getLayoutOffset(seed, 31 + index * 4, 28) + stagger;
      const y = obstacle.y + getLayoutOffset(seed, 32 + index * 4, 32)
        + (topology % 2 === 0 ? stagger : -stagger);
      return {
        ...obstacle,
        x: Math.round(clampLayoutValue(x, 58, 662 - obstacle.width)),
        y: Math.round(clampLayoutValue(y, 278, 1_052 - obstacle.height)),
      };
    }),
    hazards: hazards.map((hazard, index) => {
      const x = hazard.x + getLayoutOffset(seed, 81 + index * 3, 20);
      const y = hazard.y + getLayoutOffset(seed, 82 + index * 3, 22);
      return {
        ...hazard,
        x: Math.round(clampLayoutValue(x, 70 + hazard.radius, 650 - hazard.radius)),
        y: Math.round(clampLayoutValue(y, 286 + hazard.radius, 1_044 - hazard.radius)),
      };
    }),
  };
}

export function getRoomArtVariantIndex(environment, { roomId = "", roomNumber = 0 } = {}) {
  const variants = ROOM_ART_CATALOG[environment]?.variants;
  if (!variants?.length || variants.length === 1) {
    return 0;
  }

  const normalizedRoomNumber = Number.isFinite(roomNumber)
    ? Math.max(0, Math.floor(roomNumber))
    : 0;
  if (normalizedRoomNumber > 0) {
    return (normalizedRoomNumber - 1) % variants.length;
  }
  return hashRoomId(roomId) % variants.length;
}

export function getRoomArt(environment, roomIdentity = {}) {
  const entry = ROOM_ART_CATALOG[environment];
  const variants = entry?.variants;
  if (!variants?.length) {
    return null;
  }
  if (roomIdentity.artVariant) {
    const authored = [...variants, ...(entry.specials ?? [])]
      .find((variant) => variant.id === roomIdentity.artVariant);
    if (authored) {
      return authored;
    }
  }
  return variants[getRoomArtVariantIndex(environment, roomIdentity)] ?? variants[0];
}

function hasRoomArtOwners(entry) {
  return entry.legacyRetained || entry.leaseIds.size > 0;
}

function disposeRoomArtEntry(entry) {
  if (entry.disposed) {
    return false;
  }
  entry.disposed = true;
  const image = entry.value;
  entry.value = null;
  if (image && typeof image.close === "function") {
    image.close();
  } else if (image && typeof image.removeAttribute === "function") {
    image.removeAttribute("src");
  }
  return true;
}

function releaseUnownedRoomArtEntry(entry) {
  if (hasRoomArtOwners(entry)) {
    return false;
  }
  if (entry.status === "pending") {
    entry.releaseOnSettle = true;
    return true;
  }
  if (roomEntries.get(entry.key) === entry) {
    roomEntries.delete(entry.key);
  }
  if (entry.status === "ready") {
    disposeRoomArtEntry(entry);
  }
  return true;
}

function createRoomArtEntry(art) {
  const entry = {
    key: art.sprite,
    promise: null,
    status: "pending",
    value: null,
    legacyRetained: false,
    leaseIds: new Set(),
    releaseOnSettle: false,
    disposed: false,
  };
  entry.promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener(
      "error",
      () => reject(new Error(`Unable to load room art: ${art.sprite}`)),
      { once: true },
    );
    image.src = art.sprite;
  }).then((image) => {
    entry.status = "ready";
    entry.value = image;
    if (!hasRoomArtOwners(entry)) {
      releaseUnownedRoomArtEntry(entry);
    }
    return image;
  }).catch((error) => {
    entry.status = "rejected";
    if (roomEntries.get(art.sprite) === entry) {
      roomEntries.delete(art.sprite);
    }
    if (entry.value !== null) {
      disposeRoomArtEntry(entry);
    }
    throw error;
  });
  roomEntries.set(art.sprite, entry);
  return entry;
}

function getOrCreateRoomArtEntry(art) {
  return roomEntries.get(art.sprite) ?? createRoomArtEntry(art);
}

function createEmptyRoomArtLease(owner) {
  let released = false;
  return Object.freeze({
    sprite: null,
    owner,
    promise: Promise.resolve(null),
    get released() {
      return released;
    },
    release() {
      if (released) {
        return false;
      }
      released = true;
      return true;
    },
  });
}

/**
 * Acquire one explicit ownership token for the selected room image.
 *
 * The handle can be released before `promise` settles. Independent handles
 * share one in-flight image request and a stale/idempotent release can only
 * remove its own token.
 */
export function acquireRoomArtLease(environment, roomIdentity = {}, { owner = null } = {}) {
  const art = getRoomArt(environment, roomIdentity);
  if (!art || typeof Image !== "function") {
    return createEmptyRoomArtLease(owner);
  }

  const entry = getOrCreateRoomArtEntry(art);
  const leaseId = nextRoomArtLeaseId;
  nextRoomArtLeaseId += 1;
  entry.leaseIds.add(leaseId);
  entry.releaseOnSettle = false;
  let released = false;

  return Object.freeze({
    sprite: art.sprite,
    owner,
    promise: entry.promise,
    get released() {
      return released;
    },
    release() {
      if (released) {
        return false;
      }
      released = true;
      if (!entry.leaseIds.delete(leaseId)) {
        return false;
      }
      releaseUnownedRoomArtEntry(entry);
      return true;
    },
  });
}

export function loadRoomArt(environment, roomIdentity = {}) {
  const art = getRoomArt(environment, roomIdentity);
  if (!art || typeof Image !== "function") {
    return Promise.resolve(null);
  }
  const entry = getOrCreateRoomArtEntry(art);
  entry.legacyRetained = true;
  entry.releaseOnSettle = false;
  return entry.promise;
}

export function releaseRoomArt(sprite) {
  const entry = roomEntries.get(sprite);
  if (!entry?.legacyRetained) {
    return false;
  }
  entry.legacyRetained = false;
  releaseUnownedRoomArtEntry(entry);
  return true;
}

export function getRoomArtCacheEntryCount() {
  return roomEntries.size;
}

export function validateRoomArtCatalog(catalog = ROOM_ART_CATALOG) {
  const errors = [];
  const spritePaths = new Set();

  for (const environment of ROOM_ENVIRONMENTS) {
    const variants = catalog?.[environment]?.variants;
    if (!Array.isArray(variants) || variants.length === 0) {
      errors.push(`Missing room art for ${environment}`);
      continue;
    }

    const allArt = [...variants, ...(catalog?.[environment]?.specials ?? [])];
    const variantIds = new Set();
    for (const art of allArt) {
      if (!/^[a-z0-9-]+$/.test(art.id ?? "") || variantIds.has(art.id)) {
        errors.push(`Invalid or duplicate room art id for ${environment}`);
      }
      variantIds.add(art.id);
      if (!/^\/assets\/rooms\/[a-z0-9-]+\.jpg$/.test(art.sprite ?? "")) {
        errors.push(`Invalid room sprite path for ${environment}`);
      }
      if (art.backdrop !== "transparent") {
        errors.push(`Room art for ${environment} must preserve its full backdrop`);
      }
      if (spritePaths.has(art.sprite)) {
        errors.push(`Duplicate room sprite path for ${environment}`);
      }
      spritePaths.add(art.sprite);
    }
  }

  return errors;
}
