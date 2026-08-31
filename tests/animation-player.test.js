import test from "node:test";
import assert from "node:assert/strict";

import {
  DIRECTIONAL_ANIMATION_LAYOUT_VERSION,
  advanceAnimationTimeline,
  freezeDirectionalAnimationAtlas,
  getDirectionalAnimationFrame,
  getDirectionalAnimationSourceRect,
  restartAnimationTimeline,
  validateDirectionalAnimationAtlas,
} from "../src/game/animation-player.js";

const directions = [
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
  "north",
  "north-east",
];

const atlas = {
  version: DIRECTIONAL_ANIMATION_LAYOUT_VERSION,
  columns: 8,
  rows: 16,
  directions,
  clips: {
    idle: { startRow: 0, frameCount: 4, fps: 4, loop: true },
    move: { startRow: 4, frameCount: 6, fps: 10, loop: true },
    attack: { startRow: 10, frameCount: 6, fps: 15, loop: false },
  },
};

test("directional animation atlas validation protects the runtime layout", () => {
  assert.deepEqual(
    validateDirectionalAnimationAtlas(atlas, {
      directions,
      states: ["idle", "move", "attack"],
    }),
    [],
  );

  const malformed = {
    ...atlas,
    directions: ["east", "east"],
    clips: {
      idle: { startRow: 15, frameCount: 4, fps: 0, loop: "yes" },
    },
  };
  const errors = validateDirectionalAnimationAtlas(malformed, {
    directions,
    states: ["idle", "move"],
  });
  assert.ok(errors.some((error) => error.includes("unique")));
  assert.ok(errors.some((error) => error.includes("fps")));
  assert.ok(errors.some((error) => error.includes("loop")));
  assert.ok(errors.some((error) => error.includes("exceeds")));
  assert.ok(errors.some((error) => error.includes("missing clip move")));
});

test("looping clips advance by fps and keep direction columns stable", () => {
  const subject = { animationState: "move", animationStateClock: 0 };
  advanceAnimationTimeline(subject, "move", 0.21);
  const south = getDirectionalAnimationFrame(subject, "move", "south", atlas);
  assert.deepEqual(
    {
      sequenceIndex: south.sequenceIndex,
      row: south.row,
      column: south.column,
      index: south.index,
      completed: south.completed,
    },
    { sequenceIndex: 2, row: 6, column: 2, index: 50, completed: false },
  );

  advanceAnimationTimeline(subject, "move", 0.5);
  const looped = getDirectionalAnimationFrame(subject, "move", "north-east", atlas);
  assert.equal(looped.sequenceIndex, 1);
  assert.equal(looped.column, 7);
  assert.equal(looped.row, 5);
});

test("one-shot clips hold their last frame and report completion", () => {
  const subject = { animationState: "attack", animationStateClock: 0.5 };
  const frame = getDirectionalAnimationFrame(subject, "attack", "west", atlas);
  assert.equal(frame.sequenceIndex, 5);
  assert.equal(frame.row, 15);
  assert.equal(frame.column, 4);
  assert.equal(frame.completed, true);
});

test("one-shot clips can lock the authored attack direction", () => {
  const lockedAtlas = {
    ...atlas,
    clips: {
      ...atlas.clips,
      attack: { ...atlas.clips.attack, lockDirection: true },
    },
  };
  const subject = {};
  restartAnimationTimeline(subject, "attack", "south");
  advanceAnimationTimeline(subject, "attack", 0.14, "north");
  const frame = getDirectionalAnimationFrame(
    subject,
    "attack",
    "north",
    lockedAtlas,
  );
  assert.equal(frame.direction, "south");
  assert.equal(frame.column, 2);
  assert.equal(frame.sequenceIndex, 2);
});

test("state changes reset time without resetting direction changes", () => {
  const subject = { animationState: "idle", animationStateClock: 0.75 };
  advanceAnimationTimeline(subject, "move", 0.2);
  assert.equal(subject.animationState, "move");
  assert.equal(subject.animationStateClock, 0);

  advanceAnimationTimeline(subject, "move", 0.2);
  assert.equal(subject.animationStateClock, 0.2);
  assert.equal(
    getDirectionalAnimationFrame(subject, "move", "east", atlas).sequenceIndex,
    getDirectionalAnimationFrame(subject, "move", "west", atlas).sequenceIndex,
  );

  restartAnimationTimeline(subject, "attack");
  assert.deepEqual(subject, {
    animationState: "attack",
    animationStateClock: 0,
    animationStateDirection: null,
  });
});

test("atlas source rectangles support arbitrary validated geometry", () => {
  const frame = getDirectionalAnimationFrame(
    { animationState: "idle", animationStateClock: 0.26 },
    "idle",
    "south-west",
    atlas,
  );
  assert.deepEqual(
    getDirectionalAnimationSourceRect(frame, 1536, 3584),
    { x: 576, y: 224, width: 192, height: 224 },
  );
  assert.equal(getDirectionalAnimationSourceRect(null, 1536, 3584), null);
});

test("frozen animation metadata cannot drift after catalog construction", () => {
  const frozen = freezeDirectionalAnimationAtlas(atlas);
  assert.equal(Object.isFrozen(frozen), true);
  assert.equal(Object.isFrozen(frozen.directions), true);
  assert.equal(Object.isFrozen(frozen.clips.move), true);
});

test("paged atlases preserve full frame resolution across direction groups", () => {
  const pagedAtlas = {
    version: 1,
    directions,
    pages: {
      "move-a": {
        sprite: "/assets/enemies/razor-mantis-move-a-v3.png",
        columns: 4,
        rows: 6,
        directions: directions.slice(0, 4),
      },
      "move-b": {
        sprite: "/assets/enemies/razor-mantis-move-b-v3.png",
        columns: 4,
        rows: 6,
        directions: directions.slice(4),
      },
    },
    clips: {
      move: {
        pages: ["move-a", "move-b"],
        startRow: 0,
        frameCount: 6,
        fps: 10,
        loop: true,
      },
    },
  };
  assert.deepEqual(
    validateDirectionalAnimationAtlas(pagedAtlas, { directions, states: ["move"] }),
    [],
  );

  const frame = getDirectionalAnimationFrame(
    { animationState: "move", animationStateClock: 0.31 },
    "move",
    "north-west",
    pagedAtlas,
  );
  assert.equal(frame.page, "move-b");
  assert.equal(frame.column, 1);
  assert.equal(frame.row, 3);
  assert.equal(frame.index, 13);
  assert.deepEqual(
    getDirectionalAnimationSourceRect(frame, 1152, 2016),
    { x: 288, y: 1008, width: 288, height: 336 },
  );

  const frozen = freezeDirectionalAnimationAtlas(pagedAtlas);
  assert.equal(Object.isFrozen(frozen.pages["move-a"].directions), true);
  assert.equal(Object.isFrozen(frozen.clips.move.pages), true);
});

test("paged atlases reject empty ids and unsafe or missing sprite paths", () => {
  const broken = {
    version: 1,
    directions,
    pages: {
      "": {
        sprite: "https://example.com/frame.png",
        columns: 4,
        rows: 1,
        directions: directions.slice(0, 4),
      },
      b: {
        columns: 4,
        rows: 1,
        directions: directions.slice(4),
      },
    },
    clips: {
      idle: {
        pages: ["", "b"],
        startRow: 0,
        frameCount: 1,
        fps: 1,
        loop: true,
      },
    },
  };
  const errors = validateDirectionalAnimationAtlas(broken);
  assert.ok(errors.some((error) => error.includes("id must not be empty")));
  assert.ok(errors.some((error) => error.includes("safe local PNG")));
  assert.ok(errors.some((error) => error.includes("page b must define a sprite")));
});
