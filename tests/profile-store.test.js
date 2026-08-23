import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_PROFILE, ProfileStore, normalizeProfile } from "../src/core/profile-store.js";
import {
  DEFAULT_HERO_ID,
  DEFAULT_TOUR_ID,
} from "../src/config/game-config.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

test("profile normalization rejects negative, fractional, and oversized progress", () => {
  const profile = normalizeProfile({
    beans: -12,
    lifetimeBeans: 18.9,
    bestRoom: 999,
    bossesDefeated: Number.POSITIVE_INFINITY,
  });

  assert.equal(profile.beans, 0);
  assert.equal(profile.lifetimeBeans, 18);
  assert.equal(profile.bestRoom, 100);
  assert.equal(profile.bossesDefeated, DEFAULT_PROFILE.bossesDefeated);
});

test("legacy aggregate progress migrates into the first tour record and default hero", () => {
  const profile = normalizeProfile({
    version: 1,
    bestRoom: 4,
    bossesDefeated: 2,
  });

  assert.equal(profile.version, 6);
  assert.equal(profile.selectedHeroId, DEFAULT_HERO_ID);
  assert.equal(profile.selectedTourId, DEFAULT_TOUR_ID);
  assert.deepEqual(profile.tourProgress[DEFAULT_TOUR_ID], {
    bestRoom: 4,
    bossesDefeated: 2,
  });
});

test("profile keeps only known hero identifiers", () => {
  assert.equal(normalizeProfile({ selectedHeroId: "pata" }).selectedHeroId, "pata");
  assert.equal(normalizeProfile({ selectedHeroId: "../unknown" }).selectedHeroId, DEFAULT_HERO_ID);
  assert.equal(normalizeProfile({ selectedHeroId: "not-in-roster" }).selectedHeroId, DEFAULT_HERO_ID);
});

test("profile keeps only configured tour identifiers", () => {
  assert.equal(normalizeProfile({ selectedTourId: "rootfall-jungle" }).selectedTourId, "rootfall-jungle");
  assert.equal(normalizeProfile({ selectedTourId: "../unknown" }).selectedTourId, DEFAULT_TOUR_ID);
  assert.equal(normalizeProfile({ selectedTourId: "not-in-catalog" }).selectedTourId, DEFAULT_TOUR_ID);
});

test("profile store persists the selected tour", () => {
  const storage = new MemoryStorage();
  const store = new ProfileStore(storage);
  store.update((draft) => {
    draft.selectedTourId = "rootfall-jungle";
  });

  assert.equal(new ProfileStore(storage).profile.selectedTourId, "rootfall-jungle");
});

test("profile v6 migrates hero levels and sanitizes local inventory", () => {
  const profile = normalizeProfile({
    version: 3,
    heroProgress: {
      pata: { level: 7, xp: 71 },
      unknown: { level: 40, xp: 1_000 },
    },
    inventory: [
      { instanceId: "loot-safe", itemId: "pressure-bore", rarity: "rare", level: 3 },
      { instanceId: "../loot", itemId: "void-locket", rarity: "epic", level: 10 },
      { instanceId: "loot-unknown", itemId: "fake-key", rarity: "epic", level: 10 },
    ],
    loadout: { weapon: "loot-safe", relic: "../loot" },
  });

  assert.equal(profile.version, 6);
  assert.deepEqual(profile.heroProgress.pata, { level: 7, xp: 71 });
  assert.equal(Object.hasOwn(profile.heroProgress, "unknown"), false);
  assert.equal(profile.inventory.length, 5);
  assert.equal(profile.loadout.weapon, "loot-safe");
  assert.equal(profile.loadout.relic, "starter-relic");
});

test("profile store recovers from malformed local data", () => {
  const storage = new MemoryStorage();
  storage.setItem("doffa-heroes-profile-v1", "not json");
  const store = new ProfileStore(storage);
  assert.deepEqual(store.profile, DEFAULT_PROFILE);

  store.update((draft) => {
    draft.beans += 7;
  });
  assert.equal(store.profile.beans, DEFAULT_PROFILE.beans + 7);
});
