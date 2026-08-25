import test from "node:test";
import assert from "node:assert/strict";

import { ENEMY_CATALOG } from "../src/game/content.js";
import { HEROES } from "../src/game/heroes.js";
import { getHeroWeaponPair } from "../src/game/hero-weapons.js";
import { GameAudio, getSoundRecipe } from "../src/audio/game-audio.js";

function createFakeContext() {
  const calls = [];
  const parameter = () => ({
    setValueAtTime(value, time) { calls.push(["set", value, time]); },
    exponentialRampToValueAtTime(value, time) { calls.push(["ramp", value, time]); },
  });
  return {
    calls,
    currentTime: 2,
    sampleRate: 1_000,
    destination: {},
    resume() { calls.push(["resume"]); return Promise.resolve(); },
    suspend() { calls.push(["suspend"]); return Promise.resolve(); },
    createGain() {
      return { gain: parameter(), connect() { calls.push(["gain-connect"]); } };
    },
    createOscillator() {
      return {
        type: "sine",
        frequency: parameter(),
        connect() { calls.push(["osc-connect"]); },
        start(time) { calls.push(["osc-start", time]); },
        stop(time) { calls.push(["osc-stop", time]); },
      };
    },
    createBuffer(_channels, length) {
      const data = new Float32Array(length);
      return { getChannelData: () => data };
    },
    createBufferSource() {
      return {
        connect() { calls.push(["noise-connect"]); },
        start(time) { calls.push(["noise-start", time]); },
        stop(time) { calls.push(["noise-stop", time]); },
      };
    },
  };
}

test("all ten hero weapons resolve to distinct offline sound recipes", () => {
  const visuals = new Set();
  for (const hero of HEROES) {
    const pair = getHeroWeaponPair(hero);
    visuals.add(pair.melee.visual);
    visuals.add(pair.ranged.visual);
  }
  assert.equal(visuals.size, 10);
  const signatures = new Set([...visuals].map((visual) => (
    JSON.stringify(getSoundRecipe("heroAttack", { visual }))
  )));
  assert.equal(signatures.size, 10);
});

test("all eighteen enemy identities receive deterministic distinct attack tones", () => {
  const signatures = new Set();
  for (const enemy of Object.values(ENEMY_CATALOG)) {
    const first = getSoundRecipe("enemyTelegraph", { enemyType: enemy.id });
    const second = getSoundRecipe("enemyTelegraph", { enemyType: enemy.id });
    assert.deepEqual(first, second);
    signatures.add(JSON.stringify(first));
  }
  assert.equal(signatures.size, Object.keys(ENEMY_CATALOG).length);
});

test("audio context is lazy, cooldowns prevent spam, and mute persists", () => {
  let created = 0;
  let now = 1_000;
  const context = createFakeContext();
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const voiceStates = [];
  const audio = new GameAudio({
    contextFactory: () => { created += 1; return context; },
    now: () => now,
    storage,
    voice: { setMuted: (value) => voiceStates.push(value), play: () => true },
  });

  assert.equal(created, 0);
  assert.equal(audio.play("heroAttack", { visual: "katana" }), true);
  assert.equal(created, 1);
  assert.equal(audio.play("heroAttack", { visual: "katana" }), false);
  now += 60;
  assert.equal(audio.play("heroAttack", { visual: "katana" }), true);
  assert.ok(context.calls.some(([name]) => name === "osc-start"));
  assert.ok(context.calls.some(([name]) => name === "noise-start"));

  assert.equal(audio.setMuted(true), true);
  assert.equal(audio.play("victory"), false);
  assert.equal(values.get("doffa-heroes-audio-muted-v1"), "1");
  assert.equal(audio.toggleMuted(), false);
  assert.deepEqual(voiceStates, [false, true, false]);
});

test("unknown events and missing WebAudio support fail closed", () => {
  const audio = new GameAudio({ contextFactory: () => null, storage: null });
  assert.equal(audio.play("heroAttack", { visual: "bow" }), false);
  assert.equal(audio.play("not-an-event"), false);
  assert.equal(getSoundRecipe("not-an-event").length, 0);
});
