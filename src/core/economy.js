export const ECONOMY = Object.freeze({
  version: 1,
  tapBeans: 1,
  runEntryBeans: 25,
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

export function getRunEntryCost() {
  return ECONOMY.runEntryBeans;
}

export function canEnterRun(beanBalance) {
  requireNonNegativeInteger(beanBalance, "beanBalance");
  return beanBalance >= getRunEntryCost();
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
