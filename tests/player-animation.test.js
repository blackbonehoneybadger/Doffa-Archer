import test from "node:test";
import assert from "node:assert/strict";

import {
  PLAYER_FACING_DIRECTIONS,
  PLAYER_ANIMATION_STATES,
  PLAYER_ATTACK_ANIMATION_SECONDS,
  PLAYER_DEFEAT_ANIMATION_SECONDS,
  PLAYER_HIT_ANIMATION_SECONDS,
  advancePlayerAnimation,
  getPlayerAnimationFrame,
  getPlayerAnimationState,
  getPlayerFacingDirection,
  getPlayerFullMotionFrame,
  getPlayerAnimationPose,
  normalizeFacingAngle,
  triggerPlayerAttack,
  triggerPlayerDefeat,
  triggerPlayerHit,
} from "../src/game/player-animation.js";

test("player sprite follows all cardinal and diagonal facing directions", () => {
  const cases = [
    { angle: 0, direction: "east" },
    { angle: Math.PI / 4, direction: "south-east" },
    { angle: Math.PI / 2, direction: "south" },
    { angle: 3 * Math.PI / 4, direction: "south-west" },
    { angle: Math.PI, direction: "west" },
    { angle: -3 * Math.PI / 4, direction: "north-west" },
    { angle: -Math.PI / 2, direction: "north" },
    { angle: -Math.PI / 4, direction: "north-east" },
  ];

  assert.equal(PLAYER_FACING_DIRECTIONS.length, 8);
  for (const entry of cases) {
    const player = { facing: entry.angle };
    assert.equal(getPlayerFacingDirection(player), entry.direction);
  }
});

test("continuous gameplay facing selects the nearest authored atlas direction", () => {
  const player = { facing: Math.PI / 7 };
  assert.ok(Math.abs(normalizeFacingAngle(player.facing) - Math.PI / 7) < 1e-9);
  assert.equal(getPlayerFacingDirection(player), "south-east");
});

test("animation state priority protects defeat, hit, and attack poses", () => {
  assert.deepEqual(PLAYER_ANIMATION_STATES, ["idle", "run", "attack", "hit", "defeat"]);
  assert.equal(getPlayerAnimationState({ hp: 100 }), "idle");
  assert.equal(getPlayerAnimationState({ hp: 100, moving: true }), "run");
  assert.equal(getPlayerAnimationState({ hp: 100, attackAnimation: 0.1 }), "attack");
  assert.equal(
    getPlayerAnimationState({ hp: 100, attackAnimation: 0.1, hitAnimation: 0.1 }),
    "hit",
  );
  assert.equal(
    getPlayerAnimationState({ hp: 0, attackAnimation: 0.1, hitAnimation: 0.1 }),
    "defeat",
  );
});

test("authored motion frames advance deterministically inside each state", () => {
  const frames = {
    idle: [0, 1],
    run: [1, 2, 3, 2],
    attack: [4, 5],
    hit: [6],
    defeat: [7],
  };

  assert.equal(getPlayerAnimationFrame({ hp: 100, animationClock: 1.1 }, frames).index, 1);
  assert.equal(
    getPlayerAnimationFrame({ hp: 100, moving: true, animationClock: 2.1 }, frames).index,
    3,
  );
  assert.equal(
    getPlayerAnimationFrame({ hp: 100, attackAnimation: PLAYER_ATTACK_ANIMATION_SECONDS }, frames).index,
    4,
  );
  assert.equal(getPlayerAnimationFrame({ hp: 100, attackAnimation: 0.04 }, frames).index, 5);
  assert.equal(getPlayerAnimationFrame({ hp: 100, hitAnimation: 0.1 }, frames).index, 6);
  assert.equal(getPlayerAnimationFrame({ hp: 0 }, frames).index, 7);
});

test("full-direction motion maps state rows and facing sectors to one atlas cell", () => {
  const stateRows = { idle: 0, run: 2, attack: 4 };

  assert.deepEqual(
    getPlayerFullMotionFrame({ hp: 100, facing: 0 }, stateRows),
    { state: "idle", direction: "east", index: 0 },
  );
  assert.deepEqual(
    getPlayerFullMotionFrame({ hp: 100, moving: true, facing: -Math.PI / 2, animationClock: 1.1 }, stateRows),
    { state: "run", direction: "north", index: 14 },
  );
  assert.deepEqual(
    getPlayerFullMotionFrame({ hp: 100, attackAnimation: 0.1, facing: -Math.PI / 4 }, stateRows),
    { state: "attack", direction: "north-east", index: 23 },
  );
  assert.equal(getPlayerFullMotionFrame({ hp: 100, hitAnimation: 0.1 }, stateRows), null);
  assert.equal(getPlayerFullMotionFrame({ hp: 100 }, null), null);
});

test("legacy run sheets alternate planted and stride poses so feet do not slide", () => {
  const stateRows = { idle: 0, run: 2, attack: 4 };
  const planted = getPlayerFullMotionFrame({
    hp: 100, moving: true, facing: Math.PI / 2, animationClock: 0.2,
  }, stateRows);
  const stride = getPlayerFullMotionFrame({
    hp: 100, moving: true, facing: Math.PI / 2, animationClock: 1.2,
  }, stateRows);

  assert.equal(planted.state, "run");
  assert.equal(planted.index, 2);
  assert.equal(stride.index, 10);
});

test("full-direction reactions map hit and defeat to their authored atlas rows", () => {
  const reactionRows = { hit: 0, defeat: 2 };

  assert.deepEqual(
    getPlayerFullMotionFrame({ hp: 100, hitAnimation: 0.1, facing: Math.PI }, reactionRows),
    { state: "hit", direction: "west", index: 4 },
  );
  assert.deepEqual(
    getPlayerFullMotionFrame({ hp: 0, facing: Math.PI / 4 }, reactionRows),
    { state: "defeat", direction: "south-east", index: 9 },
  );
  assert.equal(getPlayerFullMotionFrame({ hp: 100, facing: 0 }, reactionRows), null);
});

test("full-direction player motion can use real multi-frame clips", () => {
  const animationAtlas = {
    version: 1,
    columns: 8,
    rows: 16,
    directions: PLAYER_FACING_DIRECTIONS,
    clips: {
      idle: { startRow: 0, frameCount: 4, fps: 4, loop: true },
      run: { startRow: 4, frameCount: 6, fps: 10, loop: true },
      attack: { startRow: 10, frameCount: 6, fps: 15, loop: false },
    },
  };
  const player = {
    hp: 100,
    moving: true,
    facing: -Math.PI / 2,
    animationState: "run",
    animationStateClock: 0.22,
  };

  assert.deepEqual(
    getPlayerFullMotionFrame(player, { idle: 0, run: 2, attack: 4 }, animationAtlas),
    {
      state: "run",
      direction: "north",
      index: 54,
      column: 6,
      row: 6,
      columns: 8,
      rows: 16,
      sequenceIndex: 2,
      frameCount: 6,
      fps: 10,
      loop: true,
      completed: false,
    },
  );
});

test("player animation timers advance deterministically", () => {
  const player = {
    hp: 100,
    moving: true,
    animationClock: 0,
    attackAnimation: 0,
    hitAnimation: 0,
  };

  triggerPlayerAttack(player);
  triggerPlayerHit(player);
  assert.equal(player.attackAnimation, PLAYER_ATTACK_ANIMATION_SECONDS);
  assert.equal(player.hitAnimation, PLAYER_HIT_ANIMATION_SECONDS);

  advancePlayerAnimation(player, 0.11, true);
  const pose = getPlayerAnimationPose(player);
  assert.ok(player.animationClock > 1);
  assert.equal(player.attackAnimation, 0.11);
  assert.ok(Math.abs(player.hitAnimation - 0.09) < 1e-9);
  assert.ok(pose.strike > 0.99);
  assert.ok(pose.hit > 0.44 && pose.hit < 0.46);
  assert.ok(pose.bob < 0, "the stride lifts the sprite while its shadow stays grounded");
});

test("defeated pose collapses the static sprite consistently", () => {
  const pose = getPlayerAnimationPose({
    hp: 0,
    moving: false,
    animationClock: 4,
  });

  assert.equal(pose.defeated, true);
  assert.equal(pose.bob, 30);
  assert.ok(pose.lean < -1);
  assert.equal(pose.scaleX, 1);
  assert.equal(pose.scaleY, 1);
  assert.ok(pose.shadowScale > 1);
});

test("defeat animation owns a deterministic terminal timeline", () => {
  const player = {
    hp: 0,
    animationClock: 0,
    animationState: "hit",
    animationStateClock: 0.1,
    attackAnimation: 0,
    hitAnimation: 0,
    defeatAnimation: 0,
  };

  triggerPlayerDefeat(player);
  assert.equal(player.defeatAnimation, PLAYER_DEFEAT_ANIMATION_SECONDS);
  assert.equal(player.animationState, "defeat");
  assert.equal(player.animationStateClock, 0);

  advancePlayerAnimation(player, 0.2, false);
  assert.ok(Math.abs(player.defeatAnimation - 0.52) < 1e-9);
  assert.equal(player.animationState, "defeat");
  assert.equal(player.animationStateClock, 0.2);
});

test("invalid animation deltas cannot corrupt combat state", () => {
  const player = {
    animationClock: 2,
    attackAnimation: 0.1,
    hitAnimation: 0.1,
  };

  advancePlayerAnimation(player, -1, true);
  assert.deepEqual(player, {
    animationClock: 2,
    attackAnimation: 0.1,
    hitAnimation: 0.1,
  });
});
