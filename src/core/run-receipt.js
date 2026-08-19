import { GAME_VERSION } from "../config/game-config.js";

function defaultIdFactory() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createLocalRunReceipt(
  { tourId, heroId, roomsCleared, bossDefeated, score },
  { idFactory = defaultIdFactory, now = () => new Date().toISOString() } = {},
) {
  if (typeof tourId !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(tourId)) {
    throw new TypeError("tourId must be a safe content identifier");
  }
  if (typeof heroId !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(heroId)) {
    throw new TypeError("heroId must be a safe content identifier");
  }
  if (!Number.isInteger(roomsCleared) || roomsCleared < 0) {
    throw new TypeError("roomsCleared must be a non-negative integer");
  }
  if (typeof bossDefeated !== "boolean") {
    throw new TypeError("bossDefeated must be a boolean");
  }
  if (!Number.isInteger(score) || score < 0) {
    throw new TypeError("score must be a non-negative integer");
  }

  return Object.freeze({
    id: idFactory(),
    createdAt: now(),
    buildVersion: GAME_VERSION,
    tourId,
    heroId,
    roomsCleared,
    bossDefeated,
    score,
    authority: "local-prototype",
    chain: "none",
    claimable: false,
  });
}
