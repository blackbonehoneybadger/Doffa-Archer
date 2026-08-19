import { DEFAULT_TOUR_ID } from "../config/game-config.js";

const STORAGE_KEY = "doffa-heroes-profile-v1";
const MAX_SAFE_STAT = 1_000_000_000;
const MAX_ROOM_PROGRESS = 100;
const MAX_TOUR_RECORDS = 32;

const DEFAULT_TOUR_PROGRESS = Object.freeze({
  bestRoom: 0,
  bossesDefeated: 0,
});

export const DEFAULT_PROFILE = Object.freeze({
  version: 2,
  beans: 30,
  lifetimeBeans: 30,
  bestRoom: 0,
  bossesDefeated: 0,
  runsStarted: 0,
  tourProgress: Object.freeze({
    [DEFAULT_TOUR_ID]: DEFAULT_TOUR_PROGRESS,
  }),
});

function safeInteger(value, fallback, maximum = MAX_SAFE_STAT) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(0, Math.floor(value)));
}

function normalizeTourProgress(input, legacyBestRoom, legacyBossesDefeated) {
  const candidate = input && typeof input === "object" ? input : {};
  const records = {};
  let recordCount = 0;

  for (const [tourId, progress] of Object.entries(candidate)) {
    if (
      recordCount >= MAX_TOUR_RECORDS ||
      !/^[a-z0-9][a-z0-9-]{0,63}$/.test(tourId) ||
      !progress ||
      typeof progress !== "object"
    ) {
      continue;
    }

    records[tourId] = {
      bestRoom: safeInteger(progress.bestRoom, 0, MAX_ROOM_PROGRESS),
      bossesDefeated: safeInteger(progress.bossesDefeated, 0),
    };
    recordCount += 1;
  }

  records[DEFAULT_TOUR_ID] ??= {
    bestRoom: legacyBestRoom,
    bossesDefeated: legacyBossesDefeated,
  };
  return records;
}

export function normalizeProfile(input = {}) {
  const candidate = input && typeof input === "object" ? input : {};
  const bestRoom = safeInteger(candidate.bestRoom, DEFAULT_PROFILE.bestRoom, MAX_ROOM_PROGRESS);
  const bossesDefeated = safeInteger(candidate.bossesDefeated, DEFAULT_PROFILE.bossesDefeated);
  return {
    version: DEFAULT_PROFILE.version,
    beans: safeInteger(candidate.beans, DEFAULT_PROFILE.beans),
    lifetimeBeans: safeInteger(candidate.lifetimeBeans, DEFAULT_PROFILE.lifetimeBeans),
    bestRoom,
    bossesDefeated,
    runsStarted: safeInteger(candidate.runsStarted, DEFAULT_PROFILE.runsStarted),
    tourProgress: normalizeTourProgress(candidate.tourProgress, bestRoom, bossesDefeated),
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
    const draft = {
      ...this.profile,
      tourProgress: Object.fromEntries(
        Object.entries(this.profile.tourProgress).map(([tourId, progress]) => [
          tourId,
          { ...progress },
        ]),
      ),
    };
    const updated = mutator(draft) ?? draft;
    return this.save(updated);
  }
}
