import test from "node:test";
import assert from "node:assert/strict";
import {
  ROOM_EFFECT_ENVIRONMENTS,
  ROOM_EFFECT_PROFILES,
  getRoomAmbientMote,
  getRoomEffectProfile,
  getRoomEffectState,
  hashRoomVisualIdentity,
  validateRoomEffectProfiles,
} from "../src/game/room-effects.js";
import { ROOM_ENVIRONMENTS } from "../src/game/room-art.js";
import { DoffaGame } from "../src/game/game.js";

function createRecordingContext() {
  const operations = [];
  const context = {};
  const record = (name) => (...args) => {
    for (const argument of args) {
      if (typeof argument === "number") {
        assert.equal(Number.isFinite(argument), true, `${name} received a non-finite number`);
      }
    }
    operations.push(name);
  };
  for (const name of [
    "save",
    "restore",
    "fillRect",
    "beginPath",
    "arc",
    "ellipse",
    "fill",
    "stroke",
    "translate",
    "rotate",
    "moveTo",
    "lineTo",
    "bezierCurveTo",
  ]) {
    context[name] = record(name);
  }
  context.createRadialGradient = (...args) => {
    record("createRadialGradient")(...args);
    return {
      addColorStop(offset, color) {
        assert.ok(offset >= 0 && offset <= 1);
        assert.equal(typeof color, "string");
        operations.push("addColorStop");
      },
    };
  };
  return { context, operations };
}

test("every runtime environment has a valid ambient-effect profile", () => {
  assert.deepEqual(ROOM_EFFECT_ENVIRONMENTS, ROOM_ENVIRONMENTS);
  assert.deepEqual(Object.keys(ROOM_EFFECT_PROFILES), [...ROOM_EFFECT_ENVIRONMENTS]);
  assert.deepEqual(validateRoomEffectProfiles(), []);
  assert.equal(getRoomEffectProfile("unknown"), ROOM_EFFECT_PROFILES.ash);
});

test("room visual identities and animation state are deterministic", () => {
  const options = {
    environment: "pressure",
    roomId: "pressure-43",
    roomNumber: 43,
    clock: 12.75,
  };
  assert.equal(hashRoomVisualIdentity("pressure-43", 43), hashRoomVisualIdentity("pressure-43", 43));
  assert.deepEqual(getRoomEffectState(options), getRoomEffectState(options));
  assert.notEqual(
    getRoomEffectState(options).seed,
    getRoomEffectState({ ...options, roomId: "pressure-44", roomNumber: 44 }).seed,
  );
});

test("the fifty-room route receives all four visual phase variants", () => {
  const variants = new Set();
  for (let roomNumber = 1; roomNumber <= 50; roomNumber += 1) {
    variants.add(getRoomEffectState({
      environment: "ash",
      roomId: `room-${roomNumber}`,
      roomNumber,
      clock: 0,
    }).variant);
  }
  assert.deepEqual([...variants].sort(), [0, 1, 2, 3]);
});

test("ambient motes stay bounded and evolve without random state", () => {
  for (const environment of ROOM_EFFECT_ENVIRONMENTS) {
    const state = getRoomEffectState({
      environment,
      roomId: `${environment}-test`,
      roomNumber: 12,
      clock: 2.25,
    });
    const laterState = getRoomEffectState({
      environment,
      roomId: `${environment}-test`,
      roomNumber: 12,
      clock: 2.75,
    });
    const mote = getRoomAmbientMote(state, 0);
    const repeatedMote = getRoomAmbientMote(state, 0);
    const laterMote = getRoomAmbientMote(laterState, 0);

    assert.deepEqual(mote, repeatedMote);
    assert.notDeepEqual(mote, laterMote);
    assert.ok(mote.x >= 0.02 && mote.x <= 0.98);
    assert.ok(mote.y >= -0.02 && mote.y <= 1.02);
    assert.ok(mote.size > 0);
    assert.ok(mote.alpha > 0 && mote.alpha <= 1);
    assert.match(mote.color, /^#[0-9a-f]{6}$/i);
    assert.equal(getRoomAmbientMote(state, ROOM_EFFECT_PROFILES[environment].moteCount), null);
  }
});

test("invalid clocks and mote indexes cannot corrupt ambient state", () => {
  const state = getRoomEffectState({ environment: "heart", clock: Number.NaN });
  assert.equal(state.time, 0);
  assert.ok(state.pulse >= 0 && state.pulse <= 1);
  assert.equal(getRoomAmbientMote(state, -1), null);
  assert.equal(getRoomAmbientMote(null, 0), null);
  const recoveredMote = getRoomAmbientMote({ environment: "unknown" }, 0);
  assert.equal(Number.isFinite(recoveredMote.x), true);
  assert.equal(Number.isFinite(recoveredMote.y), true);
  assert.equal(Number.isFinite(recoveredMote.alpha), true);
});

test("profile validation catches malformed production values", () => {
  const invalid = {
    ...ROOM_EFFECT_PROFILES,
    ash: undefined,
    ember: { ...ROOM_EFFECT_PROFILES.ember, kind: "telegraph" },
    smoke: { ...ROOM_EFFECT_PROFILES.smoke, moteCount: 100 },
  };
  const errors = validateRoomEffectProfiles(invalid);
  assert.equal(errors.some((error) => error.includes("Missing room effect profile for ash")), true);
  assert.equal(errors.some((error) => error.includes("Unsupported room effect kind for ember")), true);
  assert.equal(errors.some((error) => error.includes("mote count for smoke")), true);
});

test("all runtime ambient renderers emit finite Canvas operations", () => {
  for (const [index, environment] of ROOM_EFFECT_ENVIRONMENTS.entries()) {
    const game = Object.create(DoffaGame.prototype);
    game.roomDefinition = { id: `${environment}-${index + 1}` };
    game.room = index * 10 + 1;
    game.visualClock = 4.25;
    const { context, operations } = createRecordingContext();

    game.drawRoomAtmosphere(context, environment, { accent: "#d66b3b" });

    assert.ok(operations.length > 20, `${environment} emitted too few visual operations`);
    assert.equal(operations.filter((operation) => operation === "save").length,
      operations.filter((operation) => operation === "restore").length);
  }
});
