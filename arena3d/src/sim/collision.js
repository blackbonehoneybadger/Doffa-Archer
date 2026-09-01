export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function length2(x, z) {
  return Math.hypot(x, z);
}

export function normalize2(x, z) {
  const length = length2(x, z);
  if (length <= 1e-8) {
    return { x: 0, z: 0, length: 0 };
  }
  return { x: x / length, z: z / length, length };
}

export function circleHitsAabb(x, z, radius, box) {
  const closestX = clamp(x, box.minX, box.maxX);
  const closestZ = clamp(z, box.minZ, box.maxZ);
  const dx = x - closestX;
  const dz = z - closestZ;
  return dx * dx + dz * dz < radius * radius;
}

export function resolveCircleAabb(x, z, radius, box) {
  if (!circleHitsAabb(x, z, radius, box)) {
    return { x, z, hit: false };
  }
  const closestX = clamp(x, box.minX, box.maxX);
  const closestZ = clamp(z, box.minZ, box.maxZ);
  let dx = x - closestX;
  let dz = z - closestZ;
  let length = Math.hypot(dx, dz);
  if (length <= 1e-8) {
    const left = x - box.minX + radius;
    const right = box.maxX - x + radius;
    const up = z - box.minZ + radius;
    const down = box.maxZ - z + radius;
    const smallest = Math.min(left, right, up, down);
    if (smallest === left) {
      return { x: box.minX - radius, z, hit: true };
    }
    if (smallest === right) {
      return { x: box.maxX + radius, z, hit: true };
    }
    if (smallest === up) {
      return { x, z: box.minZ - radius, hit: true };
    }
    return { x, z: box.maxZ + radius, hit: true };
  }
  const push = radius - length;
  dx /= length;
  dz /= length;
  return { x: x + dx * push, z: z + dz * push, hit: true };
}

export function resolveCircleWorld(x, z, radius, obstacles) {
  let nextX = x;
  let nextZ = z;
  let hit = false;
  for (const box of obstacles) {
    const resolved = resolveCircleAabb(nextX, nextZ, radius, box);
    nextX = resolved.x;
    nextZ = resolved.z;
    hit = hit || resolved.hit;
  }
  return { x: nextX, z: nextZ, hit };
}

export function circlesOverlap(ax, az, ar, bx, bz, br) {
  const dx = ax - bx;
  const dz = az - bz;
  const range = ar + br;
  return dx * dx + dz * dz <= range * range;
}

export function pointInArc(originX, originZ, facingX, facingZ, range, halfAngle, targetX, targetZ) {
  const dx = targetX - originX;
  const dz = targetZ - originZ;
  const distance = Math.hypot(dx, dz);
  if (distance > range || distance <= 1e-8) {
    return false;
  }
  const facing = normalize2(facingX, facingZ);
  if (facing.length === 0) {
    return false;
  }
  const alignment = (dx * facing.x + dz * facing.z) / distance;
  return alignment >= Math.cos(halfAngle);
}
