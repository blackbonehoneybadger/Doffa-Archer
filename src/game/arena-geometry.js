function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function circlesOverlap(first, firstRadius, second, secondRadius) {
  const dx = first.x - second.x;
  const dy = first.y - second.y;
  const combinedRadius = firstRadius + secondRadius;
  return dx * dx + dy * dy <= combinedRadius * combinedRadius;
}

export function getCircleRectangleCollision(circle, radius, rectangle) {
  const left = rectangle.x;
  const right = rectangle.x + rectangle.width;
  const top = rectangle.y;
  const bottom = rectangle.y + rectangle.height;
  const closestX = clamp(circle.x, left, right);
  const closestY = clamp(circle.y, top, bottom);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distanceSquared = dx * dx + dy * dy;

  if (distanceSquared > radius * radius) {
    return null;
  }

  if (distanceSquared > 0.000001) {
    const distance = Math.sqrt(distanceSquared);
    return Object.freeze({
      normalX: dx / distance,
      normalY: dy / distance,
      depth: radius - distance,
    });
  }

  const exits = [
    { distance: circle.x - left, normalX: -1, normalY: 0 },
    { distance: right - circle.x, normalX: 1, normalY: 0 },
    { distance: circle.y - top, normalX: 0, normalY: -1 },
    { distance: bottom - circle.y, normalX: 0, normalY: 1 },
  ];
  exits.sort((first, second) => first.distance - second.distance);
  const nearestExit = exits[0];
  return Object.freeze({
    normalX: nearestExit.normalX,
    normalY: nearestExit.normalY,
    depth: radius + nearestExit.distance,
  });
}

export function resolveCircleAgainstRectangles(circle, radius, rectangles = []) {
  let x = circle.x;
  let y = circle.y;
  let hit = false;

  for (let pass = 0; pass < 2; pass += 1) {
    for (const rectangle of rectangles) {
      const collision = getCircleRectangleCollision({ x, y }, radius, rectangle);
      if (!collision || collision.depth <= 0) {
        continue;
      }
      x += collision.normalX * collision.depth;
      y += collision.normalY * collision.depth;
      hit = true;
    }
  }

  return Object.freeze({ x, y, hit });
}

export function isHazardActive(hazard, elapsedSeconds) {
  if (!Number.isFinite(hazard?.interval) || hazard.interval <= 0) {
    return false;
  }
  const phase = Number.isFinite(hazard.phase) ? hazard.phase : 0;
  const activeDuration = Math.min(
    hazard.interval,
    Math.max(0, Number.isFinite(hazard.activeDuration) ? hazard.activeDuration : 0),
  );
  const cyclePosition = ((elapsedSeconds + phase) % hazard.interval + hazard.interval) % hazard.interval;
  return cyclePosition < activeDuration;
}
