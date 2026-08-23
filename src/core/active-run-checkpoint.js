import { HERO_IDS, TOUR_IDS } from "../config/game-config.js";
import { ABILITIES } from "../game/abilities.js";
import { normalizeHeroProgress } from "../game/progression.js";
import { normalizeRunProgress } from "../game/run-progression.js";

export const ACTIVE_RUN_CHECKPOINT_VERSION = 1;

const MAX_CHECKPOINT_ROOM = 100;
const MAX_CHECKPOINT_SCORE = 1_000_000_000;
const MAX_CHECKPOINT_HP = 1_000_000;
const MAX_CHECKPOINT_ABILITIES = 32;
const RUN_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{7,95}$/;
const CHECKPOINT_PHASES = new Set(["room-start", "checkpoint-choice", "room-exit"]);
const ABILITY_IDS = new Set(ABILITIES.map((ability) => ability.id));

function safeInteger(value, fallback = 0, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(maximum, Math.max(0, Math.floor(value)));
}

function normalizeAbilityIds(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .slice(0, MAX_CHECKPOINT_ABILITIES)
    .filter((abilityId) => typeof abilityId === "string" && ABILITY_IDS.has(abilityId));
}

export function normalizeActiveRunCheckpoint(input) {
  const candidate = input && typeof input === "object" ? input : null;
  if (
    !candidate
    || candidate.version !== ACTIVE_RUN_CHECKPOINT_VERSION
    || typeof candidate.runId !== "string"
    || !RUN_ID_PATTERN.test(candidate.runId)
    || !TOUR_IDS.includes(candidate.tourId)
    || !HERO_IDS.includes(candidate.heroId)
    || !CHECKPOINT_PHASES.has(candidate.phase)
    || !Number.isInteger(candidate.room)
    || candidate.room < 1
    || candidate.room > MAX_CHECKPOINT_ROOM
    || !Number.isFinite(candidate.playerHp)
    || candidate.playerHp <= 0
    || !Number.isInteger(candidate.rngState)
    || candidate.rngState <= 0
    || candidate.rngState > 0xffff_ffff
  ) {
    return null;
  }

  const clearedRooms = safeInteger(candidate.clearedRooms, 0, MAX_CHECKPOINT_ROOM);
  if (
    (candidate.phase === "room-start" && clearedRooms !== candidate.room - 1)
    || (candidate.phase !== "room-start" && clearedRooms !== candidate.room)
  ) {
    return null;
  }

  const heroProgress = normalizeHeroProgress({ level: candidate.heroLevel });
  const runProgress = normalizeRunProgress({
    level: candidate.runLevel,
    xp: candidate.runXp,
  });

  return {
    version: ACTIVE_RUN_CHECKPOINT_VERSION,
    runId: candidate.runId,
    tourId: candidate.tourId,
    heroId: candidate.heroId,
    phase: candidate.phase,
    room: candidate.room,
    clearedRooms,
    score: safeInteger(candidate.score, 0, MAX_CHECKPOINT_SCORE),
    heroLevel: heroProgress.level,
    playerHp: Math.min(MAX_CHECKPOINT_HP, candidate.playerHp),
    ownedAbilities: normalizeAbilityIds(candidate.ownedAbilities),
    runLevel: runProgress.level,
    runXp: runProgress.xp,
    rngState: candidate.rngState >>> 0,
    savedAt: safeInteger(candidate.savedAt, 0, Number.MAX_SAFE_INTEGER),
  };
}
