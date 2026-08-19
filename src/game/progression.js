import { HERO_IDS } from "../config/game-config.js";

export const MAX_HERO_LEVEL = 50;
const MAX_XP_GRANT = 1_000_000;

function safeInteger(value, fallback = 0, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(0, Math.floor(value)));
}

export function getHeroXpRequirement(level) {
  const normalizedLevel = Math.min(MAX_HERO_LEVEL, Math.max(1, safeInteger(level, 1)));
  if (normalizedLevel >= MAX_HERO_LEVEL) {
    return 0;
  }

  return 100 + (normalizedLevel - 1) * 35;
}

export function normalizeHeroProgress(input = {}) {
  const candidate = input && typeof input === "object" ? input : {};
  const level = Math.min(MAX_HERO_LEVEL, Math.max(1, safeInteger(candidate.level, 1)));
  const requirement = getHeroXpRequirement(level);
  return {
    level,
    xp: level >= MAX_HERO_LEVEL
      ? 0
      : Math.min(Math.max(0, requirement - 1), safeInteger(candidate.xp, 0, MAX_XP_GRANT)),
  };
}

export function createDefaultHeroProgress() {
  return Object.fromEntries(HERO_IDS.map((heroId) => [heroId, { level: 1, xp: 0 }]));
}

export function normalizeHeroProgressMap(input = {}) {
  const candidate = input && typeof input === "object" ? input : {};
  return Object.fromEntries(
    HERO_IDS.map((heroId) => [heroId, normalizeHeroProgress(candidate[heroId])]),
  );
}

export function grantHeroXp(progress, amount) {
  const current = normalizeHeroProgress(progress);
  const xpAwarded = safeInteger(amount, 0, MAX_XP_GRANT);
  let level = current.level;
  let xp = current.xp + xpAwarded;
  let levelsGained = 0;

  while (level < MAX_HERO_LEVEL) {
    const requirement = getHeroXpRequirement(level);
    if (xp < requirement) {
      break;
    }

    xp -= requirement;
    level += 1;
    levelsGained += 1;
  }

  if (level >= MAX_HERO_LEVEL) {
    xp = 0;
  }

  return Object.freeze({ level, xp, levelsGained, xpAwarded });
}

export function calculateRunHeroXp({ roomsCleared, bossDefeated }) {
  const safeRooms = safeInteger(roomsCleared, 0, 100);
  return safeRooms * 20 + (bossDefeated === true ? 80 : 0);
}

export function getHeroLevelMultiplier(level) {
  const normalizedLevel = Math.min(MAX_HERO_LEVEL, Math.max(1, safeInteger(level, 1)));
  return 1 + (normalizedLevel - 1) * 0.02;
}
