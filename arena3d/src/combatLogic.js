/**
 * Pure combat helpers for the Rootfall 08 true-3D slice.
 * No reward / wallet / mint authority.
 */

export const SLICE = Object.freeze({
  gameName: "DOFA ARENA",
  site: "doffa.coffee",
  token: "$DOFA",
  antagonist: "KAPRIZORD",
  tourCode: "TOUR 02",
  tourName: "ROOTFALL JUNGLE",
  room: 8,
  roomTotal: 50,
  heroName: "HONEY BADGER",
  weaponName: "KATANA",
  heroMaxHp: 2450,
  heroSpeed: 4.2,
  attackRange: 1.85,
  attackDamage: 85,
  attackCooldown: 0.42,
  telegraphSeconds: 0.55,
  arenaHalf: 6.2,
});

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function length2(x, z) {
  return Math.hypot(x, z);
}

export function normalize2(x, z) {
  const len = length2(x, z);
  if (len < 1e-6) return { x: 0, z: 0, len: 0 };
  return { x: x / len, z: z / len, len };
}

export function distance2(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz);
}

export function moveToward(position, input, dt, speed, half) {
  const n = normalize2(input.x, input.z);
  const next = {
    x: clamp(position.x + n.x * speed * dt, -half, half),
    z: clamp(position.z + n.z * speed * dt, -half, half),
  };
  return { position: next, moving: n.len > 0.15, facing: n.len > 0.15 ? Math.atan2(n.x, n.z) : null };
}

export function canAttack(cooldownRemaining) {
  return cooldownRemaining <= 0;
}

export function applyAttackCooldown(cooldownRemaining, dt, fired) {
  if (fired) return SLICE.attackCooldown;
  return Math.max(0, cooldownRemaining - dt);
}

export function hitEnemiesInArc(hero, enemies, range = SLICE.attackRange) {
  const hits = [];
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const d = distance2(hero.x, hero.z, enemy.x, enemy.z);
    if (d > range + enemy.radius) continue;
    const toEnemy = Math.atan2(enemy.x - hero.x, enemy.z - hero.z);
    let delta = Math.abs(toEnemy - hero.facing);
    while (delta > Math.PI) delta -= Math.PI * 2;
    if (Math.abs(delta) <= Math.PI * 0.55) {
      hits.push(enemy.id);
    }
  }
  return hits;
}

export function createTelegraph({ x, z, radius, delay = SLICE.telegraphSeconds }) {
  return {
    x,
    z,
    radius,
    delay,
    elapsed: 0,
    fired: false,
    done: false,
  };
}

export function stepTelegraph(telegraph, dt) {
  if (telegraph.done) return telegraph;
  const elapsed = telegraph.elapsed + dt;
  if (elapsed >= telegraph.delay && !telegraph.fired) {
    return { ...telegraph, elapsed, fired: true };
  }
  if (elapsed >= telegraph.delay + 0.12) {
    return { ...telegraph, elapsed, done: true };
  }
  return { ...telegraph, elapsed };
}

export function damageHero(hp, amount) {
  return clamp(hp - amount, 0, SLICE.heroMaxHp);
}

export function damageEnemy(enemy, amount) {
  const hp = Math.max(0, enemy.hp - amount);
  return { ...enemy, hp, alive: hp > 0 };
}

export function roomProgressRatio(room = SLICE.room, total = SLICE.roomTotal) {
  return clamp(room / total, 0, 1);
}

/** Reject concept JPEG paths as scene/collision sources. */
export function isForbiddenConceptTexture(path) {
  if (typeof path !== "string") return false;
  const lower = path.toLowerCase();
  return (
    lower.includes("rootfall-08-target-quality-bar")
    || lower.includes("quality-bar")
    || lower.includes("01a05eb9-4704")
  );
}
