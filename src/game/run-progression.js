export const MAX_RUN_LEVEL = 12;

function safeInteger(value, fallback = 0) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

export function getRunXpRequirement(level) {
  const normalizedLevel = Math.min(MAX_RUN_LEVEL, Math.max(1, safeInteger(level, 1)));
  if (normalizedLevel >= MAX_RUN_LEVEL) {
    return 0;
  }
  return 40 + (normalizedLevel - 1) * 28;
}

export function normalizeRunProgress(progress = {}) {
  const candidate = progress && typeof progress === "object" ? progress : {};
  const level = Math.min(MAX_RUN_LEVEL, Math.max(1, safeInteger(candidate.level, 1)));
  const requirement = getRunXpRequirement(level);
  return Object.freeze({
    level,
    xp: requirement > 0
      ? Math.min(requirement - 1, safeInteger(candidate.xp))
      : 0,
  });
}

export function grantRunXp(progress, amount) {
  const current = normalizeRunProgress(progress);
  const xpAwarded = safeInteger(amount);
  let level = current.level;
  let xp = current.xp + xpAwarded;
  let levelsGained = 0;

  while (level < MAX_RUN_LEVEL) {
    const requirement = getRunXpRequirement(level);
    if (xp < requirement) {
      break;
    }
    xp -= requirement;
    level += 1;
    levelsGained += 1;
  }

  if (level >= MAX_RUN_LEVEL) {
    xp = 0;
  }

  return Object.freeze({
    level,
    xp,
    levelsGained,
    xpAwarded,
    requirement: getRunXpRequirement(level),
  });
}
