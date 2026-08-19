import { GAME_VERSION } from "../config/game-config.js";

function defaultIdFactory() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createLocalRunReceipt(
  { roomsCleared, bossDefeated, score },
  { idFactory = defaultIdFactory, now = () => new Date().toISOString() } = {},
) {
  return Object.freeze({
    id: idFactory(),
    createdAt: now(),
    buildVersion: GAME_VERSION,
    roomsCleared,
    bossDefeated,
    score,
    authority: "local-prototype",
    chain: "none",
    claimable: false,
  });
}
