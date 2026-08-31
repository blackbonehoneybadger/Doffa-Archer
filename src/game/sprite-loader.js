const spriteEntries = new Map();
let nextSpriteLeaseId = 1;
const BACKDROP_THRESHOLD = 220;
const BACKDROP_CHROMA_TOLERANCE = 16;

function isLightNeutralPixel(data, offset) {
  if (data[offset + 3] === 0) {
    return false;
  }

  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const lightest = Math.max(red, green, blue);
  const darkest = Math.min(red, green, blue);
  return darkest >= BACKDROP_THRESHOLD
    && lightest - darkest <= BACKDROP_CHROMA_TOLERANCE;
}

function isMagentaPixel(data, offset) {
  if (data[offset + 3] === 0) {
    return false;
  }

  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  return red >= 170
    && blue >= 170
    && green <= 120
    && Math.abs(red - blue) <= 80
    && Math.min(red, blue) - green >= 80;
}

function removeConnectedBackdrop(imageData, width, height, extraSeeds, isBackdropPixel) {
  const { data } = imageData;
  const pixelCount = width * height;
  const queued = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const enqueue = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return;
    }
    const index = y * width + x;
    if (queued[index] || !isBackdropPixel(data, index * 4)) {
      return;
    }
    queued[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }
  for (const seed of extraSeeds) {
    enqueue(
      Math.round(seed.x * (width - 1)),
      Math.round(seed.y * (height - 1)),
    );
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    data[index * 4 + 3] = 0;
    const x = index % width;
    const y = Math.floor(index / width);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  return imageData;
}

export function removeConnectedLightBackdrop(imageData, width, height, extraSeeds = []) {
  return removeConnectedBackdrop(
    imageData,
    width,
    height,
    extraSeeds,
    isLightNeutralPixel,
  );
}

export function removeConnectedMagentaBackdrop(imageData, width, height, extraSeeds = []) {
  return removeConnectedBackdrop(
    imageData,
    width,
    height,
    extraSeeds,
    isMagentaPixel,
  );
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error(`Unable to load sprite: ${source}`)), {
      once: true,
    });
    image.src = source;
  });
}

async function createSpriteCanvas(art) {
  if (!art?.sprite || typeof Image !== "function" || typeof document === "undefined") {
    return null;
  }

  const image = await loadImage(art.sprite);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const needsBackdropProcessing = art.backdrop !== "transparent";
  const context = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: needsBackdropProcessing,
  });
  if (!context) {
    throw new Error("Unable to create the sprite canvas");
  }
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0);

  if (needsBackdropProcessing) {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const processor = art.backdrop === "magenta"
      ? removeConnectedMagentaBackdrop
      : removeConnectedLightBackdrop;
    processor(pixels, canvas.width, canvas.height, art.backdropSeeds ?? []);
    context.putImageData(pixels, 0, 0);
  }

  return canvas;
}

function hasSpriteOwners(entry) {
  return entry.legacyRetained || entry.leaseIds.size > 0;
}

function disposeSpriteEntry(entry) {
  if (entry.disposed) {
    return false;
  }
  entry.disposed = true;
  const sprite = entry.value;
  entry.value = null;

  // Resetting a canvas releases its backing store immediately in browsers.
  // The guard also keeps test doubles and a future ImageBitmap implementation safe.
  if (sprite && typeof sprite.close === "function") {
    sprite.close();
  } else if (sprite && "width" in sprite && "height" in sprite) {
    sprite.width = 0;
    sprite.height = 0;
  }
  return true;
}

function releaseUnownedSpriteEntry(entry) {
  if (hasSpriteOwners(entry)) {
    return false;
  }
  if (entry.status === "pending") {
    entry.releaseOnSettle = true;
    return true;
  }
  if (spriteEntries.get(entry.key) === entry) {
    spriteEntries.delete(entry.key);
  }
  if (entry.status === "ready") {
    disposeSpriteEntry(entry);
  }
  return true;
}

function createSpriteEntry(key, art) {
  const entry = {
    key,
    promise: null,
    status: "pending",
    value: null,
    legacyRetained: false,
    leaseIds: new Set(),
    releaseOnSettle: false,
    disposed: false,
  };
  entry.promise = createSpriteCanvas(art)
    .then((sprite) => {
      entry.status = "ready";
      entry.value = sprite;
      if (!hasSpriteOwners(entry)) {
        releaseUnownedSpriteEntry(entry);
      }
      return sprite;
    })
    .catch((error) => {
      entry.status = "rejected";
      if (spriteEntries.get(key) === entry) {
        spriteEntries.delete(key);
      }
      if (entry.value !== null) {
        disposeSpriteEntry(entry);
      }
      throw error;
    });
  spriteEntries.set(key, entry);
  return entry;
}

function getOrCreateSpriteEntry(key, art) {
  return spriteEntries.get(key) ?? createSpriteEntry(key, art);
}

function createEmptySpriteLease(key, owner) {
  let released = false;
  return Object.freeze({
    key,
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
 * Acquire one explicit ownership token for a decoded sprite.
 *
 * The returned handle is synchronous so callers can release ownership while the
 * decode is still pending. Await `lease.promise` for the canvas. Every acquire
 * returns an independent, idempotently releasable token, while all owners share
 * the same in-flight decode for a cache key.
 */
export function acquireSpriteLease(key, art, { owner = null } = {}) {
  if (!art?.sprite) {
    return createEmptySpriteLease(key, owner);
  }

  const entry = getOrCreateSpriteEntry(key, art);
  const leaseId = nextSpriteLeaseId;
  nextSpriteLeaseId += 1;
  entry.leaseIds.add(leaseId);
  entry.releaseOnSettle = false;
  let released = false;

  return Object.freeze({
    key,
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
      releaseUnownedSpriteEntry(entry);
      return true;
    },
  });
}

export function loadSprite(key, art) {
  if (!art?.sprite) {
    return Promise.resolve(null);
  }
  const entry = getOrCreateSpriteEntry(key, art);
  entry.legacyRetained = true;
  entry.releaseOnSettle = false;
  return entry.promise;
}

export function releaseSprite(key) {
  const entry = spriteEntries.get(key);
  if (!entry?.legacyRetained) {
    return false;
  }
  entry.legacyRetained = false;
  releaseUnownedSpriteEntry(entry);
  return true;
}

export function releaseSpritesByPrefix(prefix) {
  if (typeof prefix !== "string" || prefix.length === 0) {
    return 0;
  }
  let released = 0;
  for (const key of [...spriteEntries.keys()]) {
    if (key.startsWith(prefix)) {
      released += releaseSprite(key) ? 1 : 0;
    }
  }
  return released;
}

export function getSpriteCacheEntryCount() {
  return spriteEntries.size;
}
