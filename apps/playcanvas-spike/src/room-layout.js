export const ROOM_BOUNDS = Object.freeze({
  minX: -4.05,
  maxX: 4.05,
  minZ: -6.9,
  maxZ: 6.65,
});

export const ROOM_OBSTACLES = Object.freeze([
  Object.freeze({ id: "left-crate", x: -2.2, z: 1.1, halfWidth: 0.72, halfDepth: 0.72 }),
  Object.freeze({ id: "right-crate", x: 2.15, z: 0.15, halfWidth: 0.72, halfDepth: 0.72 }),
  Object.freeze({ id: "center-boiler", x: 0, z: -1.55, halfWidth: 0.9, halfDepth: 0.64 }),
]);

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function clampActorToRoom(position, radius, bounds = ROOM_BOUNDS) {
  const safeRadius = Math.max(0, finite(radius));
  return {
    x: Math.min(bounds.maxX - safeRadius, Math.max(bounds.minX + safeRadius, finite(position?.x))),
    z: Math.min(bounds.maxZ - safeRadius, Math.max(bounds.minZ + safeRadius, finite(position?.z))),
  };
}

export function resolveCircleVsAabb(position, radius, obstacle) {
  const actor = {
    x: finite(position?.x),
    z: finite(position?.z),
  };
  const safeRadius = Math.max(0, finite(radius));
  const minX = finite(obstacle?.x) - Math.max(0, finite(obstacle?.halfWidth));
  const maxX = finite(obstacle?.x) + Math.max(0, finite(obstacle?.halfWidth));
  const minZ = finite(obstacle?.z) - Math.max(0, finite(obstacle?.halfDepth));
  const maxZ = finite(obstacle?.z) + Math.max(0, finite(obstacle?.halfDepth));
  const nearestX = Math.min(maxX, Math.max(minX, actor.x));
  const nearestZ = Math.min(maxZ, Math.max(minZ, actor.z));
  const dx = actor.x - nearestX;
  const dz = actor.z - nearestZ;
  const distanceSquared = dx * dx + dz * dz;

  if (distanceSquared >= safeRadius * safeRadius) {
    return actor;
  }

  if (distanceSquared > 0.000001) {
    const distance = Math.sqrt(distanceSquared);
    const overlap = safeRadius - distance;
    return {
      x: actor.x + (dx / distance) * overlap,
      z: actor.z + (dz / distance) * overlap,
    };
  }

  const exits = [
    { axis: "x", delta: minX - safeRadius - actor.x },
    { axis: "x", delta: maxX + safeRadius - actor.x },
    { axis: "z", delta: minZ - safeRadius - actor.z },
    { axis: "z", delta: maxZ + safeRadius - actor.z },
  ].sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));
  const result = { ...actor };
  result[exits[0].axis] += exits[0].delta;
  return result;
}

export function resolveActorPosition(position, radius, obstacles = ROOM_OBSTACLES) {
  let result = clampActorToRoom(position, radius);
  for (const obstacle of obstacles) {
    result = resolveCircleVsAabb(result, radius, obstacle);
  }
  return clampActorToRoom(result, radius);
}

export function createMobileQualityProfile({
  deviceMemory = 4,
  devicePixelRatio = 1,
  reducedMotion = false,
} = {}) {
  const memory = Math.max(0, finite(deviceMemory, 4));
  const dpr = Math.max(1, finite(devicePixelRatio, 1));
  const lowTier = reducedMotion || memory <= 4;
  const highTier = !reducedMotion && memory >= 8;
  return Object.freeze({
    tier: lowTier ? "low" : highTier ? "high" : "medium",
    maxPixelRatio: Math.min(dpr, lowTier ? 1 : highTier ? 2 : 1.5),
    emberCount: reducedMotion ? 0 : lowTier ? 10 : highTier ? 28 : 18,
    shadowResolution: lowTier ? 512 : highTier ? 2048 : 1024,
    targetFps: lowTier ? 30 : 60,
  });
}
