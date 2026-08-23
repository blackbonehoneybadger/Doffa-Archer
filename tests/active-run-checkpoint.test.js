import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_TOUR_ID } from "../src/config/game-config.js";
import { ProfileStore, normalizeProfile } from "../src/core/profile-store.js";
import { DoffaGame } from "../src/game/game.js";

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

class FakeCanvas {
  getContext() {
    return {};
  }

  addEventListener() {}

  setPointerCapture() {}

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 720, height: 1280 };
  }
}

function installFakeDom() {
  const previous = {
    canvas: globalThis.HTMLCanvasElement,
    window: globalThis.window,
    document: globalThis.document,
  };
  globalThis.HTMLCanvasElement = FakeCanvas;
  globalThis.window = { addEventListener() {} };
  globalThis.document = { addEventListener() {}, hidden: false };
  return () => {
    globalThis.HTMLCanvasElement = previous.canvas;
    globalThis.window = previous.window;
    globalThis.document = previous.document;
  };
}

function createGame(store, callbacks = {}) {
  return new DoffaGame({
    canvas: new FakeCanvas(),
    profileStore: store,
    onHud() {},
    onProfile() {},
    onAbilityChoice: callbacks.onAbilityChoice ?? (() => {}),
    onRunEnd: callbacks.onRunEnd ?? (() => {}),
  });
}

test("checkpoint normalization rejects invalid identity and sanitizes every restored field", () => {
  const base = {
    version: 1,
    runId: "run-test-checkpoint-1",
    tourId: DEFAULT_TOUR_ID,
    heroId: "honey-badger",
    phase: "room-start",
    room: 8,
    clearedRooms: 7,
    score: 92.9,
    heroLevel: 999,
    playerHp: 9_999_999,
    ownedAbilities: ["black_steel", "../invalid", "deadeye"],
    runLevel: 999,
    runXp: 999_999,
    rngState: 123_456,
    savedAt: 90.8,
  };
  const checkpoint = normalizeProfile({ activeRun: base }).activeRun;

  assert.equal(checkpoint.version, 1);
  assert.equal(checkpoint.score, 92);
  assert.equal(checkpoint.heroLevel, 50);
  assert.equal(checkpoint.playerHp, 1_000_000);
  assert.deepEqual(checkpoint.ownedAbilities, ["black_steel", "deadeye"]);
  assert.equal(checkpoint.runLevel, 12);
  assert.equal(checkpoint.runXp, 0);
  assert.equal(checkpoint.savedAt, 90);

  assert.equal(normalizeProfile({ activeRun: { ...base, runId: "../bad" } }).activeRun, null);
  assert.equal(normalizeProfile({ activeRun: { ...base, clearedRooms: 6 } }).activeRun, null);
  assert.equal(normalizeProfile({ activeRun: { ...base, clearedRooms: 8 } }).activeRun, null);
  assert.equal(normalizeProfile({ activeRun: { ...base, rngState: 0 } }).activeRun, null);
  assert.equal(normalizeProfile({
    activeRun: { ...base, phase: "checkpoint-choice", clearedRooms: 7 },
  }).activeRun, null);
});

test("a paid run resumes at its safe checkpoint without charging twice", () => {
  const restoreDom = installFakeDom();
  try {
    const storage = new MemoryStorage();
    const firstStore = new ProfileStore(storage);
    let firstChoices = [];
    const firstGame = createGame(firstStore, {
      onAbilityChoice(choices) {
        firstChoices = choices.map((ability) => ability.id);
      },
    });

    assert.equal(firstGame.beginRun(DEFAULT_TOUR_ID, "honey-badger").ok, true);
    assert.equal(firstStore.profile.beans, 5);
    assert.equal(firstStore.profile.runsStarted, 1);
    assert.equal(firstStore.profile.activeRun.phase, "room-start");
    assert.equal(firstStore.profile.activeRun.room, 1);
    assert.deepEqual(firstGame.beginRun(DEFAULT_TOUR_ID, "honey-badger"), {
      ok: false,
      reason: "run-in-progress",
    });
    assert.equal(firstStore.profile.beans, 5);
    assert.equal(firstStore.profile.runsStarted, 1);

    firstGame.mode = "exit";
    firstGame.handleRoomExit();
    assert.equal(firstStore.profile.activeRun.phase, "checkpoint-choice");
    assert.equal(firstStore.profile.activeRun.clearedRooms, 1);
    assert.equal(firstChoices.length, 3);

    const resumedStore = new ProfileStore(storage);
    let resumedChoices = [];
    const resumedGame = createGame(resumedStore, {
      onAbilityChoice(choices) {
        resumedChoices = choices.map((ability) => ability.id);
      },
    });
    const result = resumedGame.resumeRun();

    assert.equal(result.ok, true);
    assert.equal(result.resumed, true);
    assert.equal(resumedGame.mode, "choice");
    assert.deepEqual(resumedChoices, firstChoices);
    assert.equal(resumedStore.profile.beans, 5);
    assert.equal(resumedStore.profile.runsStarted, 1);

    assert.equal(resumedGame.chooseAbility(resumedChoices[0]), true);
    assert.equal(resumedGame.room, 2);
    assert.equal(resumedStore.profile.activeRun.phase, "room-start");
    assert.equal(resumedStore.profile.activeRun.room, 2);
    assert.deepEqual(resumedStore.profile.activeRun.ownedAbilities, [resumedChoices[0]]);

    const roomTwoCheckpoint = resumedStore.profile.activeRun;
    const roomTwoGame = createGame(new ProfileStore(storage));
    assert.equal(roomTwoGame.resumeRun().ok, true);
    assert.equal(roomTwoGame.room, 2);
    assert.deepEqual(roomTwoGame.ownedAbilities, [resumedChoices[0]]);
    assert.equal(roomTwoGame.player.hp, roomTwoCheckpoint.playerHp);
  } finally {
    restoreDom();
  }
});

test("finishing clears the checkpoint atomically so rewards cannot be granted twice", () => {
  const restoreDom = installFakeDom();
  try {
    const storage = new MemoryStorage();
    const store = new ProfileStore(storage);
    const game = createGame(store);
    assert.equal(game.beginRun(DEFAULT_TOUR_ID, "honey-badger").ok, true);

    game.clearedRooms = game.tour.rooms.length;
    game.room = game.tour.rooms.length;
    game.score = 4_000;
    game.rng = {
      next: () => 0.5,
      pick: (items) => items[0],
    };
    game.finishRun(true);

    assert.equal(store.profile.activeRun, null);
    assert.equal(store.profile.beans, 125);
    assert.equal(store.profile.bossesDefeated, 1);

    const reloadedStore = new ProfileStore(storage);
    const reloadedGame = createGame(reloadedStore);
    assert.deepEqual(reloadedGame.resumeRun(), { ok: false, reason: "no-checkpoint" });
    reloadedGame.finishRun(true);
    assert.equal(reloadedStore.profile.beans, 125);
    assert.equal(reloadedStore.profile.bossesDefeated, 1);
  } finally {
    restoreDom();
  }
});
