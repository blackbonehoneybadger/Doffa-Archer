export const MAX_AUTHORED_TOUR_ROOM = 50;

function normalizeRoomNumber(roomNumber) {
  if (!Number.isFinite(roomNumber)) {
    return 1;
  }
  return Math.min(MAX_AUTHORED_TOUR_ROOM, Math.max(1, Math.floor(roomNumber)));
}

// Health remains the main source of endurance growth, while the other axes
// rise gently. Telegraph duration is deliberately not shortened: later rooms
// demand quicker decisions without turning authored attacks into cheap hits.
export function getEnemyDifficultyProfile(
  roomNumber,
  { elite = false, boss = false, tourTier = 1 } = {},
) {
  const normalizedRoom = normalizeRoomNumber(roomNumber);
  const progress = (normalizedRoom - 1) / (MAX_AUTHORED_TOUR_ROOM - 1);
  const normalizedTier = Number.isFinite(tourTier)
    ? Math.min(12, Math.max(1, Math.floor(tourTier)))
    : 1;
  const tierProgress = normalizedTier - 1;
  const hpMultiplier = boss
    ? (1 + progress * 0.9) * (1 + tierProgress * 0.4)
    : elite
      ? (1 + (normalizedRoom - 1) * 0.015) * (1 + tierProgress * 0.34)
      : (1 + (normalizedRoom - 1) * 0.028) * (1 + tierProgress * 0.3);

  return Object.freeze({
    roomNumber: normalizedRoom,
    progress,
    hpMultiplier,
    tourTier: normalizedTier,
    speedMultiplier: (1 + progress * (boss ? 0.08 : elite ? 0.1 : 0.12))
      * (1 + tierProgress * 0.04),
    contactDamageMultiplier: (1 + progress * (boss ? 0.18 : elite ? 0.24 : 0.3))
      * (1 + tierProgress * 0.15),
    attackRateMultiplier: (1 + progress * (boss ? 0.16 : elite ? 0.18 : 0.22))
      * (1 + tierProgress * 0.08),
  });
}
