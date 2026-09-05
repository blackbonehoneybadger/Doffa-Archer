import {
  DEFAULT_HERO_ID,
  DEFAULT_TOUR_ID,
  HERO_IDS,
  TOUR_IDS,
} from "../config/game-config.js";
import {
  createDefaultEquipmentState,
  normalizeEquipmentState,
} from "../game/equipment.js";
import {
  createDefaultHeroProgress,
  normalizeHeroProgressMap,
} from "../game/progression.js";
import { normalizeActiveRunCheckpoint } from "./active-run-checkpoint.js";
import { dailyBeanStatus, normalizeWager } from "./economy.js";
import { normalizeLocale } from "../i18n/locales.js";

const STORAGE_KEY = "doffa-heroes-profile-v1";
const MAX_SAFE_STAT = 1_000_000_000;
const MAX_ROOM_PROGRESS = 100;
const MAX_TOUR_RECORDS = 32;

const DEFAULT_TOUR_PROGRESS = Object.freeze({
  bestRoom: 0,
  bossesDefeated: 0,
});

const defaultHeroProgress = createDefaultHeroProgress();
const defaultEquipment = createDefaultEquipmentState();

export const DEFAULT_PROFILE = Object.freeze({
  version: 9,
  dailyBeans: null,
  selectedHeroId: DEFAULT_HERO_ID,
  selectedTourId: DEFAULT_TOUR_ID,
  selectedWager: 25,
  locale: "ru",
  beans: 30,
  lifetimeBeans: 30,
  bestRoom: 0,
  bossesDefeated: 0,
  runsStarted: 0,
  tourProgress: Object.freeze({
    [DEFAULT_TOUR_ID]: DEFAULT_TOUR_PROGRESS,
  }),
  heroProgress: Object.freeze(
    Object.fromEntries(
      Object.entries(defaultHeroProgress).map(([heroId, progress]) => [
        heroId,
        Object.freeze({ ...progress }),
      ]),
    ),
  ),
  inventory: Object.freeze(defaultEquipment.inventory.map((item) => Object.freeze({ ...item }))),
  loadout: Object.freeze({ ...defaultEquipment.loadout }),
  activeRun: null,
});

function safeInteger(value, fallback, maximum = MAX_SAFE_STAT) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(0, Math.floor(value)));
}

function normalizeHeroId(value) {
  return typeof value === "string" && HERO_IDS.includes(value)
    ? value
    : DEFAULT_HERO_ID;
}

function normalizeTourId(value) {
  return typeof value === "string" && TOUR_IDS.includes(value)
    ? value
    : DEFAULT_TOUR_ID;
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
  const equipment = normalizeEquipmentState({
    inventory: candidate.inventory,
    loadout: candidate.loadout,
  });
  return {
    version: DEFAULT_PROFILE.version,
    dailyBeans: candidate.dailyBeans && typeof candidate.dailyBeans === "object"
      ? { day: candidate.dailyBeans.day, claimed: candidate.dailyBeans.claimed } : null,
    selectedHeroId: normalizeHeroId(candidate.selectedHeroId),
    selectedTourId: normalizeTourId(candidate.selectedTourId),
    selectedWager: normalizeWager(candidate.selectedWager),
    locale: normalizeLocale(candidate.locale),
    beans: safeInteger(candidate.beans, DEFAULT_PROFILE.beans),
    lifetimeBeans: safeInteger(candidate.lifetimeBeans, DEFAULT_PROFILE.lifetimeBeans),
    bestRoom,
    bossesDefeated,
    runsStarted: safeInteger(candidate.runsStarted, DEFAULT_PROFILE.runsStarted),
    tourProgress: normalizeTourProgress(candidate.tourProgress, bestRoom, bossesDefeated),
    heroProgress: normalizeHeroProgressMap(candidate.heroProgress),
    inventory: equipment.inventory,
    loadout: equipment.loadout,
    activeRun: normalizeActiveRunCheckpoint(candidate.activeRun),
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

  collectDailyBean(now = Date.now()) {
    const status = dailyBeanStatus(this.profile.dailyBeans, now);
    if (!status.remaining) return 0;
    this.update((draft) => {
      draft.dailyBeans = { day: status.day, claimed: status.claimed + 1 };
      draft.beans += 1;
      draft.lifetimeBeans += 1;
    });
    return 1;
  }

  update(mutator) {
    const draft = {
      ...this.profile,
      dailyBeans: this.profile.dailyBeans ? { ...this.profile.dailyBeans } : null,
      tourProgress: Object.fromEntries(
        Object.entries(this.profile.tourProgress).map(([tourId, progress]) => [
          tourId,
          { ...progress },
        ]),
      ),
      heroProgress: Object.fromEntries(
        Object.entries(this.profile.heroProgress).map(([heroId, progress]) => [
          heroId,
          { ...progress },
        ]),
      ),
      inventory: this.profile.inventory.map((item) => ({ ...item })),
      loadout: { ...this.profile.loadout },
      activeRun: this.profile.activeRun
        ? {
            ...this.profile.activeRun,
            ownedAbilities: [...this.profile.activeRun.ownedAbilities],
            roomTradeoffIds: [...(this.profile.activeRun.roomTradeoffIds ?? [])],
          }
        : null,
    };
    const updated = mutator(draft) ?? draft;
    return this.save(updated);
  }
}
