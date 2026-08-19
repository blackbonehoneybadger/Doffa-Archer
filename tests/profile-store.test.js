import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_PROFILE, ProfileStore, normalizeProfile } from "../src/core/profile-store.js";
import { DEFAULT_TOUR_ID } from "../src/config/game-config.js";

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

test("legacy aggregate progress migrates into the first tour record", () => {
  const profile = normalizeProfile({
    version: 1,
    bestRoom: 4,
    bossesDefeated: 2,
  });

  assert.equal(profile.version, 2);
  assert.deepEqual(profile.tourProgress[DEFAULT_TOUR_ID], {
    bestRoom: 4,
    bossesDefeated: 2,
  });
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
