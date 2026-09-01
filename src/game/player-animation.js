import {
  advanceAnimationTimeline,
  getDirectionalAnimationFrame,
  restartAnimationTimeline,
} from "./animation-player.js";

export const PLAYER_ATTACK_ANIMATION_SECONDS = 0.22;
export const PLAYER_HIT_ANIMATION_SECONDS = 0.2;
export const PLAYER_DEFEAT_ANIMATION_SECONDS = 0.72;
export const PLAYER_MELEE_ATTACK_VARIANTS = 3;
export const PLAYER_MELEE_ATTACK_CLIPS = Object.freeze([
  "attack",
  "attack2",
  "attack3",
]);
export const PLAYER_ANIMATION_STATES = Object.freeze([
  "idle",
  "run",
  "attack",
  "hit",
  "defeat",
]);
export const PLAYER_FACING_DIRECTIONS = Object.freeze([
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
  "north",
  "north-east",
]);

function safeTimer(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function normalizeFacingAngle(value) {
  const angle = Number.isFinite(value) ? value : -Math.PI / 2;
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function getPlayerFacingDirection(player = {}) {
  const angle = normalizeFacingAngle(player.facing);
  const sector = Math.PI / 4;
  const index = ((Math.round(angle / sector) % 8) + 8) % 8;
  return PLAYER_FACING_DIRECTIONS[index];
}

export function getPlayerAnimationState(player = {}) {
  if (Number.isFinite(player.hp) && player.hp <= 0) {
    return "defeat";
  }
  if (safeTimer(player.hitAnimation) > 0) {
    return "hit";
  }
  if (safeTimer(player.attackAnimation) > 0) {
    return "attack";
  }
  return player.moving ? "run" : "idle";
}

export function getPlayerMeleeAttackClip(player = {}) {
  const raw = Number.isInteger(player.meleeAttackVariant)
    ? player.meleeAttackVariant
    : 0;
  const variant = ((raw % PLAYER_MELEE_ATTACK_VARIANTS) + PLAYER_MELEE_ATTACK_VARIANTS)
    % PLAYER_MELEE_ATTACK_VARIANTS;
  return PLAYER_MELEE_ATTACK_CLIPS[variant];
}

export function getPlayerAttackMotionClip(player = {}) {
  if (player.attackWeaponSlot === "ranged") {
    return "rangedAttack";
  }
  return getPlayerMeleeAttackClip(player);
}

export function getPlayerAnimationFrame(player = {}, framesByState = {}) {
  const state = getPlayerAnimationState(player);
  const clip = state === "attack"
    ? getPlayerAttackMotionClip(player)
    : state;
  const frames = Array.isArray(framesByState[clip]) && framesByState[clip].length > 0
    ? framesByState[clip]
    : Array.isArray(framesByState[state]) && framesByState[state].length > 0
      ? framesByState[state]
      : [0];
  let sequenceIndex = 0;

  if (state === "attack") {
    const remaining = Math.min(
      PLAYER_ATTACK_ANIMATION_SECONDS,
      safeTimer(player.attackAnimation),
    );
    const progress = 1 - remaining / PLAYER_ATTACK_ANIMATION_SECONDS;
    sequenceIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
  } else if (state === "hit") {
    const remaining = Math.min(
      PLAYER_HIT_ANIMATION_SECONDS,
      safeTimer(player.hitAnimation),
    );
    const progress = 1 - remaining / PLAYER_HIT_ANIMATION_SECONDS;
    sequenceIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
  } else if (state === "defeat") {
    sequenceIndex = frames.length - 1;
  } else {
    sequenceIndex = Math.floor(safeTimer(player.animationClock)) % frames.length;
  }

  return Object.freeze({
    state,
    index: frames[sequenceIndex] ?? 0,
    sequenceIndex,
  });
}

export function getPlayerFullMotionFrame(player = {}, stateRows = {}, animationAtlas = null) {
  const state = getPlayerAnimationState(player);
  const direction = getPlayerFacingDirection(player);
  const motionClip = state === "attack"
    ? getPlayerAttackMotionClip(player)
    : state;
  const atlasState = motionClip === "rangedAttack" ? "attack" : motionClip;
  const animatedFrame = getDirectionalAnimationFrame(
    player,
    atlasState,
    direction,
    animationAtlas,
  );
  if (animatedFrame) {
    if (state === "attack") {
      return Object.freeze({
        ...animatedFrame,
        state: motionClip === "rangedAttack" ? "attack" : animatedFrame.state,
        clip: motionClip,
      });
    }
    return animatedFrame;
  }

  let lookupState = state;
  if (state === "attack") {
    if (motionClip === "rangedAttack") {
      // Ranged release prefers the dedicated secondary atlas. Only fall through
      // when a sheet explicitly authors a rangedAttack row.
      if (!stateRows || !Number.isInteger(stateRows.rangedAttack)) {
        return null;
      }
      lookupState = "rangedAttack";
    } else if (stateRows && Number.isInteger(stateRows[motionClip])) {
      lookupState = motionClip;
    } else {
      lookupState = "attack";
    }
  }

  let row = stateRows && typeof stateRows === "object" ? stateRows[lookupState] : undefined;
  // Legacy full-direction sheets contain one planted pose and one stride pose
  // per direction. Alternating those authored cells makes the feet visibly
  // plant and push instead of sliding a frozen run pose across the floor.
  if (!animationAtlas && state === "run") {
    const plantedRow = stateRows?.idle;
    const stridePhase = Math.floor(safeTimer(player.animationClock)) % 4;
    if (Number.isInteger(plantedRow) && (stridePhase === 0 || stridePhase === 3)) {
      row = plantedRow;
    }
  }
  if (!Number.isInteger(row) || row < 0 || row % 2 !== 0) {
    return null;
  }
  const directionIndex = PLAYER_FACING_DIRECTIONS.indexOf(direction);
  if (directionIndex < 0) {
    return null;
  }
  return Object.freeze({
    state: state === "attack" ? "attack" : lookupState,
    direction,
    index: row * 4 + directionIndex,
    ...(state === "attack" ? { clip: motionClip } : {}),
  });
}

export function advancePlayerAnimation(player, delta, moving = false) {
  if (!player || !Number.isFinite(delta) || delta < 0) {
    return player;
  }

  player.animationClock = safeTimer(player.animationClock)
    + delta * (moving ? 9.2 : 2.2);
  player.attackAnimation = Math.max(0, safeTimer(player.attackAnimation) - delta);
  player.hitAnimation = Math.max(0, safeTimer(player.hitAnimation) - delta);
  player.defeatAnimation = Math.max(0, safeTimer(player.defeatAnimation) - delta);
  advanceAnimationTimeline(
    player,
    getPlayerAnimationState(player),
    delta,
    getPlayerFacingDirection(player),
  );
  return player;
}

export function triggerPlayerAttack(player, { weaponSlot = "melee" } = {}) {
  if (!player) {
    return player;
  }
  player.attackAnimation = PLAYER_ATTACK_ANIMATION_SECONDS;
  player.attackWeaponSlot = weaponSlot === "ranged" ? "ranged" : "melee";
  if (player.attackWeaponSlot === "melee") {
    const nextCount = player.meleeAttackCount ?? 0;
    player.meleeAttackVariant = nextCount % PLAYER_MELEE_ATTACK_VARIANTS;
    player.meleeAttackCount = nextCount + 1;
  }
  restartAnimationTimeline(player, "attack", getPlayerFacingDirection(player));
  return player;
}

export function triggerPlayerHit(player) {
  if (player) {
    player.hitAnimation = PLAYER_HIT_ANIMATION_SECONDS;
    restartAnimationTimeline(player, "hit", getPlayerFacingDirection(player));
  }
}

export function triggerPlayerDefeat(
  player,
  duration = PLAYER_DEFEAT_ANIMATION_SECONDS,
) {
  if (player) {
    player.defeatAnimation = Number.isFinite(duration) && duration > 0
      ? duration
      : PLAYER_DEFEAT_ANIMATION_SECONDS;
    restartAnimationTimeline(player, "defeat", getPlayerFacingDirection(player));
  }
  return player;
}

export function getPlayerAnimationPose(player = {}) {
  const clock = safeTimer(player.animationClock);
  const moving = Boolean(player.moving);
  const stride = Math.sin(clock);
  const attackRemaining = Math.min(
    PLAYER_ATTACK_ANIMATION_SECONDS,
    safeTimer(player.attackAnimation),
  );
  const hitRemaining = Math.min(
    PLAYER_HIT_ANIMATION_SECONDS,
    safeTimer(player.hitAnimation),
  );
  const attackElapsed = 1 - attackRemaining / PLAYER_ATTACK_ANIMATION_SECONDS;
  const strike = attackRemaining > 0 ? Math.sin(attackElapsed * Math.PI) : 0;
  const hit = hitRemaining / PLAYER_HIT_ANIMATION_SECONDS;
  const defeated = Number.isFinite(player.hp) && player.hp <= 0;

  return Object.freeze({
    bob: defeated ? 30 : moving ? -Math.abs(stride) * 3.5 : Math.sin(clock * 0.7) * 1.5,
    lean: defeated ? -1.18 : moving ? stride * 0.018 : 0,
    // Character size must never change between idle, movement, attack, hit,
    // and defeat. The authored frame carries the pose; the renderer keeps a
    // single physical scale so reactions cannot suddenly grow or shrink.
    scaleX: 1,
    scaleY: 1,
    shadowScale: defeated ? 1.28 : moving ? 0.92 + Math.abs(stride) * 0.12 : 1,
    strike,
    hit,
    hitJitter: hit > 0 ? Math.sin(hitRemaining * 125) * hit * 5 : 0,
    defeated,
  });
}
