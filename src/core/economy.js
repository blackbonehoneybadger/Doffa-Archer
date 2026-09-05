export const ECONOMY = Object.freeze({
  version: 2,
  tapBeans: 1,
  dailyTapLimit: 1_000,
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

// Demo clock is UTC. Real rewards must use an authoritative server clock/ledger.
export function dailyBeanStatus(ledger, now = Date.now()) {
  if (!Number.isFinite(now) || now < 0 || now > 8.64e15) throw new RangeError("Invalid clock");
  const today = new Date(now).toISOString().slice(0, 10);
  const validDay = typeof ledger?.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ledger.day);
  const day = validDay && ledger.day > today ? ledger.day : today;
  const claimed = validDay && ledger.day >= today
    ? (Number.isInteger(ledger.claimed) && ledger.claimed >= 0
      ? Math.min(ECONOMY.dailyTapLimit, ledger.claimed) : ECONOMY.dailyTapLimit)
    : 0;
  return { day, claimed, remaining: ECONOMY.dailyTapLimit - claimed };
}
