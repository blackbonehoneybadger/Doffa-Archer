import test from "node:test";
import assert from "node:assert/strict";

import {
  ENEMY_ANIMATION_STATES,
  ENEMY_ATTACK_ANIMATION_SECONDS,
  ENEMY_FACING_DIRECTIONS,
  advanceEnemyAnimation,
  getEnemyAnimationState,
  getEnemyDirectionalStateFrame,
  getEnemyFacingDirection,
  getEnemyFullMotionFrame,
  getEnemyReactionAnimationState,
  getEnemySpecialAnimationState,
  getEnemyVisualAnimationState,
  normalizeEnemyFacingAngle,
  triggerEnemyAttack,
} from "../src/game/enemy-animation.js";

test("enemy motion selects all authored cardinal and diagonal directions", () => {
  const cases = [
    [0, "east"],
    [Math.PI / 4, "south-east"],
    [Math.PI / 2, "south"],
    [3 * Math.PI / 4, "south-west"],
    [Math.PI, "west"],
    [-3 * Math.PI / 4, "north-west"],
    [-Math.PI / 2, "north"],
    [-Math.PI / 4, "north-east"],
  ];

  assert.equal(ENEMY_FACING_DIRECTIONS.length, 8);
  for (const [facing, direction] of cases) {
    assert.equal(getEnemyFacingDirection({ facing }), direction);
  }
  assert.ok(Math.abs(normalizeEnemyFacingAngle(Math.PI / 7) - Math.PI / 7) < 1e-9);
});

test("attack poses take priority over directional movement", () => {
  assert.deepEqual(ENEMY_ANIMATION_STATES, ["idle", "move", "attack", "hit", "defeat"]);
  assert.equal(getEnemyAnimationState({ state: "idle" }), "idle");
  assert.equal(getEnemyAnimationState({ state: "idle", moving: true }), "move");
  assert.equal(
    getEnemyAnimationState({ state: "idle", moving: true, attackAnimation: 0.1 }),
    "attack",
  );
  assert.equal(getEnemyAnimationState({ state: "channel" }), "attack");
  assert.equal(getEnemyAnimationState({ state: "windup" }), "attack");
  assert.equal(getEnemyAnimationState({ state: "volley-windup" }), "attack");
  assert.equal(getEnemyAnimationState({ state: "elite-windup" }), "attack");
  assert.equal(getEnemyAnimationState({ state: "elite-dash" }), "attack");
  assert.equal(getEnemyAnimationState({ state: "boss-windup" }), "attack");
  assert.equal(getEnemyAnimationState({ state: "boss-phase" }), "attack");
  assert.equal(
    getEnemyAnimationState({ state: "boss-phase", hitFlash: 0.1 }),
    "hit",
  );
  assert.equal(
    getEnemyAnimationState({ state: "boss-phase", hitFlash: 0.1, defeated: true }),
    "defeat",
  );
});

test("enemy state rows and facing map to one full-motion atlas cell", () => {
  const stateRows = { idle: 0, move: 2, attack: 4 };

  assert.deepEqual(
    getEnemyFullMotionFrame({ facing: 0, state: "idle" }, stateRows),
    { state: "idle", direction: "east", index: 0, column: 0, row: 0, columns: 4, rows: 6 },
  );
  assert.deepEqual(
    getEnemyFullMotionFrame({ facing: -Math.PI / 2, moving: true }, stateRows),
    { state: "move", direction: "north", index: 14, column: 6, row: 2, columns: 4, rows: 6 },
  );
  assert.deepEqual(
    getEnemyFullMotionFrame({ facing: -Math.PI / 4, attackAnimation: 0.1 }, stateRows),
    { state: "attack", direction: "north-east", index: 23, column: 7, row: 4, columns: 4, rows: 6 },
  );
  assert.equal(getEnemyFullMotionFrame({ facing: 0 }, null), null);
});

test("legacy enemy movement alternates planted and stride poses so feet do not slide", () => {
  const stateRows = { idle: 0, move: 2, attack: 4 };
  const planted = getEnemyFullMotionFrame({
    facing: Math.PI / 2,
    moving: true,
    animationClock: 0.2,
  }, stateRows);
  const stride = getEnemyFullMotionFrame({
    facing: Math.PI / 2,
    moving: true,
    animationClock: 1.2,
  }, stateRows);

  assert.equal(planted.state, "move");
  assert.equal(planted.index, 2);
  assert.equal(stride.state, "move");
  assert.equal(stride.index, 10);
});

test("enemy full-motion selection supports multi-frame directional clips", () => {
  const animationAtlas = {
    version: 1,
    columns: 8,
    rows: 16,
    directions: ENEMY_FACING_DIRECTIONS,
    clips: {
      idle: { startRow: 0, frameCount: 4, fps: 4, loop: true },
      move: { startRow: 4, frameCount: 6, fps: 10, loop: true },
      attack: { startRow: 10, frameCount: 6, fps: 15, loop: false },
    },
  };
  const enemy = {
    facing: Math.PI / 4,
    attackAnimation: 0.2,
    animationState: "attack",
    animationStateClock: 0.14,
  };

  const frame = getEnemyFullMotionFrame(
    enemy,
    { idle: 0, move: 2, attack: 4 },
    animationAtlas,
  );
  assert.equal(frame.state, "attack");
  assert.equal(frame.direction, "south-east");
  assert.equal(frame.sequenceIndex, 2);
  assert.equal(frame.row, 12);
  assert.equal(frame.column, 1);
  assert.equal(frame.index, 97);
});

test("boss special and reaction states select their directional atlas cells", () => {
  assert.equal(
    getEnemySpecialAnimationState({ state: "boss-windup", attackPattern: "pressure-lanes" }),
    "secondary",
  );
  assert.equal(
    getEnemySpecialAnimationState({ state: "idle", attackPattern: "pressure-lanes", attackAnimation: 0.2 }),
    "secondary",
  );
  assert.equal(getEnemySpecialAnimationState({ state: "boss-phase" }), "phase");
  assert.equal(getEnemySpecialAnimationState({ state: "idle", attackPattern: "radial" }), null);

  assert.equal(getEnemyReactionAnimationState({ hitFlash: 0.08 }), "hit");
  assert.equal(getEnemyReactionAnimationState({ hitFlash: 0.08, defeated: true }), "defeat");
  assert.equal(getEnemyReactionAnimationState({ state: "defeated" }), "defeat");
  assert.equal(getEnemyReactionAnimationState({ hitFlash: 0 }), null);

  assert.deepEqual(
    getEnemyDirectionalStateFrame(
      { facing: -Math.PI / 4 },
      "phase",
      { secondary: 0, phase: 2 },
    ),
    { state: "phase", direction: "north-east", index: 15, column: 7, row: 2, columns: 4, rows: 4 },
  );
  assert.equal(
    getEnemyDirectionalStateFrame({ facing: 0 }, "phase", { phase: 1 }),
    null,
  );
});

test("Rootfall elite secondary attacks select their authored special atlas", () => {
  const secondaryPatterns = [
    "thorn-rosette",
    "bog-rings",
    "pollen-spiral",
    "rootquake",
  ];

  for (const attackPattern of secondaryPatterns) {
    assert.equal(
      getEnemySpecialAnimationState({ state: "elite-windup", attackPattern }),
      "secondary",
      `${attackPattern} must use its special telegraph pose`,
    );
    assert.equal(
      getEnemySpecialAnimationState({ state: "idle", attackPattern, attackAnimation: 0.2 }),
      "release",
      `${attackPattern} must use its special release pose after the telegraph`,
    );
  }

  for (const attackPattern of ["rake-chain", "tongue-lane", "petal-clamp", "vine-charge"]) {
    assert.equal(
      getEnemySpecialAnimationState({ state: "elite-windup", attackPattern }),
      null,
      `${attackPattern} must keep using the base attack atlas`,
    );
  }

  assert.deepEqual(
    getEnemyDirectionalStateFrame(
      { facing: Math.PI / 2 },
      "release",
      { secondary: 0, release: 2 },
    ),
    { state: "release", direction: "south", index: 10, column: 2, row: 2, columns: 4, rows: 4 },
  );
});

test("special and reaction clips own the shared enemy timeline", () => {
  assert.equal(
    getEnemyVisualAnimationState({
      state: "elite-windup",
      attackPattern: "thorn-rosette",
    }),
    "secondary",
  );
  assert.equal(
    getEnemyVisualAnimationState({
      state: "elite-windup",
      attackPattern: "thorn-rosette",
      hitFlash: 0.1,
    }),
    "hit",
  );
  assert.equal(
    getEnemyVisualAnimationState({
      state: "elite-windup",
      attackPattern: "thorn-rosette",
      defeated: true,
    }),
    "defeat",
  );

  const enemy = {
    state: "elite-windup",
    attackPattern: "thorn-rosette",
    attackAnimation: 0.4,
    animationState: "attack",
    animationStateClock: 0.2,
  };
  advanceEnemyAnimation(enemy, 0.1);
  assert.equal(enemy.animationState, "secondary");
  assert.equal(enemy.animationStateClock, 0);
  advanceEnemyAnimation(enemy, 0.1);
  assert.equal(enemy.animationStateClock, 0.1);
  const specialAtlas = {
    version: 1,
    columns: 8,
    rows: 4,
    directions: ENEMY_FACING_DIRECTIONS,
    clips: {
      secondary: { startRow: 0, frameCount: 4, fps: 10, loop: false },
    },
  };
  const frame = getEnemyDirectionalStateFrame(
    enemy,
    "secondary",
    { secondary: 0 },
    specialAtlas,
  );
  assert.equal(frame.sequenceIndex, 1);
  assert.equal(frame.row, 1);
});

test("enemy animation timers advance safely and attacks can extend the pose", () => {
  const enemy = {
    moving: true,
    animationClock: 0,
    attackAnimation: 0,
  };

  triggerEnemyAttack(enemy);
  assert.equal(enemy.attackAnimation, ENEMY_ATTACK_ANIMATION_SECONDS);
  triggerEnemyAttack(enemy, 0.72);
  assert.equal(enemy.attackAnimation, 0.72);
  advanceEnemyAnimation(enemy, 0.12);
  assert.ok(enemy.animationClock > 1);
  assert.equal(enemy.attackAnimation, 0.6);

  const snapshot = { ...enemy };
  advanceEnemyAnimation(enemy, -1);
  assert.deepEqual(enemy, snapshot);
});
