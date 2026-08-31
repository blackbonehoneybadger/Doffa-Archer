export const ECONOMY = Object.freeze({
  version: 2,
  tapBeans: 1,
  runEntryBeans: 25,
  minimumWager: 1,
  maximumWager: 1_000_000_000,
  victoryMultiplier: 2,
  roomClearBeans: 2,
  bossClearBeans: 20,
  defeatRecoveryBeans: 4,
});

function requireNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
}

export function calculateTapReward(tapCount = 1) {
  requireNonNegativeInteger(tapCount, "tapCount");
  return tapCount * ECONOMY.tapBeans;
}

export function normalizeWager(value) {
  if (!Number.isFinite(value)) return ECONOMY.runEntryBeans;
  return Math.min(
    ECONOMY.maximumWager,
    Math.max(ECONOMY.minimumWager, Math.floor(value)),
  );
}

export function getRunEntryCost(wager = ECONOMY.runEntryBeans) {
  return normalizeWager(wager);
}

export function canEnterRun(beanBalance, wager = ECONOMY.runEntryBeans) {
  requireNonNegativeInteger(beanBalance, "beanBalance");
  return beanBalance >= getRunEntryCost(wager);
}

export function calculateWagerPayout({ wager, bossDefeated }) {
  if (typeof bossDefeated !== "boolean") {
    throw new TypeError("bossDefeated must be a boolean");
  }
  return bossDefeated ? normalizeWager(wager) * ECONOMY.victoryMultiplier : 0;
}

export function calculateRunBeanReward({ roomsCleared, bossDefeated }) {
  requireNonNegativeInteger(roomsCleared, "roomsCleared");

  if (typeof bossDefeated !== "boolean") {
    throw new TypeError("bossDefeated must be a boolean");
  }

  const clearReward = roomsCleared * ECONOMY.roomClearBeans;
  const bossReward = bossDefeated ? ECONOMY.bossClearBeans : ECONOMY.defeatRecoveryBeans;
  return clearReward + bossReward;
}
