const DEFAULT_MAX_ENTRIES = 24;
const DEFAULT_MAX_BYTES = 128 * 1024 * 1024;

function normalizeBudget(value, fallback, name) {
  const candidate = value === undefined ? fallback : value;
  if (candidate === Number.POSITIVE_INFINITY) {
    return candidate;
  }
  if (!Number.isFinite(candidate) || candidate < 0) {
    throw new RangeError(`${name} must be a non-negative finite number or Infinity`);
  }
  return Math.floor(candidate);
}

function normalizeByteSize(value) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("Animation page byte size must be a non-negative finite number");
  }
  return Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value));
}

function estimateAnimationPageBytes(value) {
  if (Number.isFinite(value?.byteLength) && value.byteLength >= 0) {
    return normalizeByteSize(value.byteLength);
  }
  if (
    Number.isFinite(value?.width)
    && value.width >= 0
    && Number.isFinite(value?.height)
    && value.height >= 0
  ) {
    return normalizeByteSize(value.width * value.height * 4);
  }
  return 0;
}

function disposeAnimationPage(value) {
  if (typeof value?.close === "function") {
    value.close();
  }
}

function validateKey(key) {
  if (typeof key !== "string" || key.length === 0) {
    throw new TypeError("Animation page cache keys must be non-empty strings");
  }
}

export class AnimationPageLoadCancelledError extends Error {
  constructor(key) {
    super(`Animation page load was cancelled: ${key}`);
    this.name = "AnimationPageLoadCancelledError";
    this.code = "ANIMATION_PAGE_LOAD_CANCELLED";
    this.key = key;
  }
}

export class AnimationPageCache {
  constructor({
    maxEntries = DEFAULT_MAX_ENTRIES,
    maxBytes = DEFAULT_MAX_BYTES,
    clock = () => Date.now(),
    dispose = disposeAnimationPage,
    estimateBytes = estimateAnimationPageBytes,
  } = {}) {
    if (typeof clock !== "function") {
      throw new TypeError("Animation page cache clock must be a function");
    }
    if (dispose !== null && typeof dispose !== "function") {
      throw new TypeError("Animation page cache dispose must be a function or null");
    }
    if (typeof estimateBytes !== "function") {
      throw new TypeError("Animation page cache estimateBytes must be a function");
    }

    this.maxEntries = normalizeBudget(maxEntries, DEFAULT_MAX_ENTRIES, "maxEntries");
    this.maxBytes = normalizeBudget(maxBytes, DEFAULT_MAX_BYTES, "maxBytes");
    this.clock = clock;
    this.dispose = dispose;
    this.estimateBytes = estimateBytes;
    this.entries = new Map();
    this.totalBytes = 0;
    this.touchSequence = 0;
    this.disposedValues = new WeakSet();
  }

  get size() {
    return this.entries.size;
  }

  get byteSize() {
    return this.totalBytes;
  }

  has(key) {
    validateKey(key);
    return this.entries.has(key);
  }

  get(key) {
    validateKey(key);
    const entry = this.entries.get(key);
    if (!entry || entry.status !== "ready") {
      return null;
    }
    this.touch(entry);
    return entry.value;
  }

  async acquire(key, loader, { bytes } = {}) {
    validateKey(key);
    let entry = this.entries.get(key);
    if (!entry) {
      if (typeof loader !== "function") {
        throw new TypeError("A loader function is required for an uncached animation page");
      }
      entry = this.createPendingEntry(key, loader, bytes);
    }

    entry.leases += 1;
    try {
      this.touch(entry);
      const value = entry.status === "ready" ? entry.value : await entry.promise;
      return this.createLease(entry, value);
    } catch (error) {
      entry.leases = Math.max(0, entry.leases - 1);
      this.trim();
      throw error;
    }
  }

  evict(key) {
    validateKey(key);
    const entry = this.entries.get(key);
    if (!this.isEvictable(entry)) {
      return false;
    }
    this.removeEntry(entry);
    return true;
  }

  evictLeastRecentlyUsed() {
    const entry = this.findLeastRecentlyUsedEntry();
    if (!entry) {
      return false;
    }
    this.removeEntry(entry);
    return true;
  }

  cancelPending(key) {
    validateKey(key);
    const entry = this.entries.get(key);
    if (!entry || entry.status !== "pending") {
      return false;
    }
    if (this.entries.get(key) === entry) {
      this.entries.delete(key);
    }
    entry.cancelled = true;
    entry.status = "cancelled";
    entry.rejectCancellation(new AnimationPageLoadCancelledError(key));
    return true;
  }

  clear({ cancelPending = false } = {}) {
    let removed = 0;
    for (const entry of [...this.entries.values()]) {
      if (cancelPending && entry.status === "pending") {
        removed += this.cancelPending(entry.key) ? 1 : 0;
        continue;
      }
      if (!this.isEvictable(entry)) {
        continue;
      }
      this.removeEntry(entry);
      removed += 1;
    }
    return removed;
  }

  trim() {
    let removed = 0;
    while (this.isOverBudget()) {
      const entry = this.findLeastRecentlyUsedEntry();
      if (!entry) {
        break;
      }
      this.removeEntry(entry);
      removed += 1;
    }
    return removed;
  }

  getStats() {
    let ready = 0;
    let pending = 0;
    let leased = 0;
    for (const entry of this.entries.values()) {
      if (entry.status === "ready") {
        ready += 1;
      } else {
        pending += 1;
      }
      if (entry.leases > 0) {
        leased += 1;
      }
    }
    return Object.freeze({
      entries: this.entries.size,
      ready,
      pending,
      leased,
      bytes: this.totalBytes,
      maxEntries: this.maxEntries,
      maxBytes: this.maxBytes,
    });
  }

  createPendingEntry(key, loader, bytes) {
    const entry = {
      key,
      status: "pending",
      promise: null,
      loadPromise: null,
      cancelPromise: null,
      rejectCancellation: null,
      value: undefined,
      hasValue: false,
      bytes: 0,
      leases: 0,
      lastUsed: 0,
      touchOrder: 0,
      disposed: false,
      cancelled: false,
    };
    this.touch(entry);
    this.entries.set(key, entry);

    entry.cancelPromise = new Promise((resolve, reject) => {
      entry.rejectCancellation = reject;
    });
    entry.loadPromise = Promise.resolve()
      .then(() => loader())
      .then((value) => {
        entry.value = value;
        entry.hasValue = true;
        if (entry.cancelled) {
          this.disposeCancelledValueWhenSafe(entry);
          return value;
        }
        const measuredBytes = typeof bytes === "function"
          ? bytes(value)
          : bytes ?? this.estimateBytes(value);
        entry.bytes = normalizeByteSize(measuredBytes);
        entry.status = "ready";
        entry.promise = null;
        this.totalBytes += entry.bytes;
        this.touch(entry);
        this.trim();
        return value;
      })
      .catch((error) => {
        if (entry.cancelled) {
          return undefined;
        }
        if (entry.status === "ready") {
          this.totalBytes = Math.max(0, this.totalBytes - entry.bytes);
        }
        if (entry.hasValue) {
          this.disposeEntry(entry);
        }
        if (this.entries.get(key) === entry) {
          this.entries.delete(key);
        }
        entry.status = "rejected";
        entry.promise = null;
        throw error;
      });
    entry.promise = Promise.race([entry.loadPromise, entry.cancelPromise]);

    return entry;
  }

  disposeCancelledValueWhenSafe(entry) {
    const current = this.entries.get(entry.key);
    if (!current) {
      this.disposeEntry(entry);
      return;
    }
    if (current.status === "ready") {
      if (current.value !== entry.value) {
        this.disposeEntry(entry);
      }
      return;
    }
    const disposeIfNotAdopted = () => {
      const latest = this.entries.get(entry.key);
      if (latest?.status === "ready" && latest.value === entry.value) {
        return;
      }
      this.disposeEntry(entry);
    };
    current.loadPromise.then(disposeIfNotAdopted, disposeIfNotAdopted);
  }

  createLease(entry, value) {
    let released = false;
    return Object.freeze({
      key: entry.key,
      value,
      release: () => {
        if (released) {
          return false;
        }
        released = true;
        entry.leases = Math.max(0, entry.leases - 1);
        if (this.entries.get(entry.key) === entry) {
          this.touch(entry);
        }
        this.trim();
        return true;
      },
    });
  }

  touch(entry) {
    const timestamp = Number(this.clock());
    if (!Number.isFinite(timestamp)) {
      throw new TypeError("Animation page cache clock must return a finite number");
    }
    entry.lastUsed = timestamp;
    this.touchSequence += 1;
    entry.touchOrder = this.touchSequence;
  }

  isOverBudget() {
    return this.entries.size > this.maxEntries || this.totalBytes > this.maxBytes;
  }

  isEvictable(entry) {
    return Boolean(entry && entry.status === "ready" && entry.leases === 0);
  }

  findLeastRecentlyUsedEntry() {
    let candidate = null;
    for (const entry of this.entries.values()) {
      if (!this.isEvictable(entry)) {
        continue;
      }
      if (
        !candidate
        || entry.lastUsed < candidate.lastUsed
        || (
          entry.lastUsed === candidate.lastUsed
          && entry.touchOrder < candidate.touchOrder
        )
      ) {
        candidate = entry;
      }
    }
    return candidate;
  }

  removeEntry(entry) {
    if (this.entries.get(entry.key) !== entry) {
      return false;
    }
    this.entries.delete(entry.key);
    this.totalBytes = Math.max(0, this.totalBytes - entry.bytes);
    this.disposeEntry(entry);
    return true;
  }

  disposeEntry(entry) {
    if (entry.disposed) {
      return;
    }
    entry.disposed = true;
    if (!this.dispose) {
      return;
    }
    const disposableValue = entry.value !== null
      && (typeof entry.value === "object" || typeof entry.value === "function");
    if (disposableValue) {
      if (this.disposedValues.has(entry.value)) {
        return;
      }
      this.disposedValues.add(entry.value);
    }
    try {
      this.dispose(entry.value, entry.key);
    } catch {
      // Releasing decoded image memory must not break the game loop.
    }
  }
}
