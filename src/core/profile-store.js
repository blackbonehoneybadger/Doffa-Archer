const STORAGE_KEY = "doffa-heroes-profile-v1";
const MAX_SAFE_STAT = 1_000_000_000;

export const DEFAULT_PROFILE = Object.freeze({
  version: 1,
  beans: 30,
  lifetimeBeans: 30,
  bestRoom: 0,
  bossesDefeated: 0,
  runsStarted: 0,
});

function safeInteger(value, fallback, maximum = MAX_SAFE_STAT) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(0, Math.floor(value)));
}

export function normalizeProfile(input = {}) {
  const candidate = input && typeof input === "object" ? input : {};
  return {
    version: DEFAULT_PROFILE.version,
    beans: safeInteger(candidate.beans, DEFAULT_PROFILE.beans),
    lifetimeBeans: safeInteger(candidate.lifetimeBeans, DEFAULT_PROFILE.lifetimeBeans),
    bestRoom: safeInteger(candidate.bestRoom, DEFAULT_PROFILE.bestRoom, 6),
    bossesDefeated: safeInteger(candidate.bossesDefeated, DEFAULT_PROFILE.bossesDefeated),
    runsStarted: safeInteger(candidate.runsStarted, DEFAULT_PROFILE.runsStarted),
  };
}

export class ProfileStore {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.profile = this.load();
  }

  load() {
    if (!this.storage) {
      return normalizeProfile();
    }

    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      return raw ? normalizeProfile(JSON.parse(raw)) : normalizeProfile();
    } catch {
      return normalizeProfile();
    }
  }

  save(nextProfile = this.profile) {
    this.profile = normalizeProfile(nextProfile);
    if (this.storage) {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      } catch {
        // Local progress must never prevent the game from running.
      }
    }
    return this.profile;
  }

  update(mutator) {
    const draft = { ...this.profile };
    const updated = mutator(draft) ?? draft;
    return this.save(updated);
  }
}
