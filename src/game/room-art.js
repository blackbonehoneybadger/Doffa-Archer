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
});

const roomEntries = new Map();
let nextRoomArtLeaseId = 1;

function hashRoomId(roomId) {
  let hash = 2166136261;
  for (const character of String(roomId ?? "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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
