import {
  advanceAnimationTimeline,
  getDirectionalAnimationFrame,
  restartAnimationTimeline,
} from "./animation-player.js";

export const ENEMY_ATTACK_ANIMATION_SECONDS = 0.36;
export const ENEMY_ANIMATION_STATES = Object.freeze([
  "idle",
  "move",
  "attack",
  "hit",
  "defeat",
]);
export const ENEMY_FACING_DIRECTIONS = Object.freeze([
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
  "north",
  "north-east",
]);

const ATTACK_STATES = new Set([
  "channel",
  "windup",
  "volley-windup",
  "pounce-windup",
  "pounce-dash",
  "seed-windup",
  "burrow-windup",
  "burrow",
  "emerge",
  "spore-windup",
  "elite-windup",
  "elite-dash",
  "boss-windup",
  "boss-phase",
  "boss-dash",
]);

const BOSS_SECONDARY_PATTERNS = new Set([
  "pressure-lanes",
  "root-lanes",
]);

const ELITE_SECONDARY_PATTERNS = new Set([
  "thorn-rosette",
  "bog-rings",
  "pollen-spiral",
  "rootquake",
]);

function safeTimer(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function normalizeEnemyFacingAngle(value) {
  const angle = Number.isFinite(value) ? value : Math.PI / 2;
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function getEnemyFacingDirection(enemy = {}) {
  const angle = normalizeEnemyFacingAngle(enemy.facing);
  const sector = Math.PI / 4;
  const index = ((Math.round(angle / sector) % 8) + 8) % 8;
  return ENEMY_FACING_DIRECTIONS[index];
}

export function getEnemyAnimationState(enemy = {}) {
  if (enemy.defeated || enemy.state === "defeated") {
    return "defeat";
  }
  if (safeTimer(enemy.hitFlash) > 0) {
    return "hit";
  }
  if (safeTimer(enemy.attackAnimation) > 0 || ATTACK_STATES.has(enemy.state)) {
    return "attack";
  }
  return enemy.moving ? "move" : "idle";
}

function inferAtlasRows(stateRows = {}, animationAtlas = null) {
  if (Number.isInteger(animationAtlas?.rows) && animationAtlas.rows > 0) {
    return animationAtlas.rows;
  }
  if (Number.isInteger(stateRows.attack) && stateRows.attack >= 4) {
    return 6;
  }
  if (Number.isInteger(stateRows.move) && stateRows.move >= 2) {
    return 6;
  }
  return 4;
}

export function getEnemyDirectionalStateFrame(
  enemy = {},
  state,
  stateRows = {},
  animationAtlas = null,
) {
  const direction = getEnemyFacingDirection(enemy);
  const animatedFrame = getDirectionalAnimationFrame(
    enemy,
    state,
    direction,
    animationAtlas,
  );
  if (animatedFrame) {
    return animatedFrame;
  }

  const row = stateRows && typeof stateRows === "object" ? stateRows[state] : undefined;
  if (!Number.isInteger(row) || row < 0 || row % 2 !== 0) {
    return null;
  }
  const directionIndex = ENEMY_FACING_DIRECTIONS.indexOf(direction);
  if (directionIndex < 0) {
    return null;
  }
  return Object.freeze({
    state,
    direction,
    index: row * 4 + directionIndex,
    column: directionIndex,
    row,
    columns: animationAtlas?.columns ?? 4,
    rows: inferAtlasRows(stateRows, animationAtlas),
  });
}

export function getEnemyFullMotionFrame(enemy = {}, stateRows = {}, animationAtlas = null) {
  const state = getEnemyAnimationState(enemy);
  if (!animationAtlas && state === "move" && Number.isFinite(enemy.animationClock)) {
    const plantedRow = stateRows?.idle;
    const stridePhase = Math.floor(safeTimer(enemy.animationClock)) % 4;
    if (Number.isInteger(plantedRow) && (stridePhase === 0 || stridePhase === 3)) {
      const direction = getEnemyFacingDirection(enemy);
      const directionIndex = ENEMY_FACING_DIRECTIONS.indexOf(direction);
      return Object.freeze({
        state,
        direction,
        index: plantedRow * 4 + directionIndex,
      });
    }
  }
  return getEnemyDirectionalStateFrame(
    enemy,
    state,
    stateRows,
    animationAtlas,
  );
}

export function getEnemySpecialAnimationState(enemy = {}) {
  if (enemy.state === "boss-phase") {
    return "phase";
  }
  if (BOSS_SECONDARY_PATTERNS.has(enemy.attackPattern)
    && (enemy.state === "boss-windup" || safeTimer(enemy.attackAnimation) > 0)) {
    return "secondary";
  }
  if (ELITE_SECONDARY_PATTERNS.has(enemy.attackPattern)) {
    if (enemy.state === "elite-windup") {
      return "secondary";
    }
    if (safeTimer(enemy.attackAnimation) > 0) {
      return "release";
    }
  }
  return null;
}

export function getEnemyReactionAnimationState(enemy = {}) {
  const state = getEnemyAnimationState(enemy);
  return state === "hit" || state === "defeat" ? state : null;
}

export function getEnemyVisualAnimationState(enemy = {}) {
  return getEnemyReactionAnimationState(enemy)
    ?? getEnemySpecialAnimationState(enemy)
    ?? getEnemyAnimationState(enemy);
}

export function advanceEnemyAnimation(enemy, delta) {
  if (!enemy || !Number.isFinite(delta) || delta < 0) {
    return enemy;
  }

  enemy.animationClock = safeTimer(enemy.animationClock)
    + delta * (enemy.moving ? 8.4 : 2.1);
  enemy.attackAnimation = Math.max(0, safeTimer(enemy.attackAnimation) - delta);
  advanceAnimationTimeline(
    enemy,
    getEnemyVisualAnimationState(enemy),
    delta,
    getEnemyFacingDirection(enemy),
  );
  return enemy;
}

export function triggerEnemyAttack(enemy, duration = ENEMY_ATTACK_ANIMATION_SECONDS) {
  if (!enemy) {
    return enemy;
  }
  const safeDuration = Number.isFinite(duration) && duration > 0
    ? duration
    : ENEMY_ATTACK_ANIMATION_SECONDS;
  enemy.attackAnimation = Math.max(safeTimer(enemy.attackAnimation), safeDuration);
  const visualState = getEnemyVisualAnimationState(enemy);
  if (enemy.animationState !== visualState) {
    restartAnimationTimeline(enemy, visualState, getEnemyFacingDirection(enemy));
  }
  return enemy;
}

export function triggerEnemyHit(enemy) {
  if (enemy) {
    restartAnimationTimeline(enemy, "hit", getEnemyFacingDirection(enemy));
  }
  return enemy;
}

export function triggerEnemyDefeat(enemy) {
  if (enemy) {
    restartAnimationTimeline(enemy, "defeat", getEnemyFacingDirection(enemy));
  }
  return enemy;
}
