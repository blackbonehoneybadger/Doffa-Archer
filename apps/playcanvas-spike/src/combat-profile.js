export const HONEY_BADGER_WEAPONS = Object.freeze({
  katana: Object.freeze({
    id: "katana",
    label: "КАТАНА",
    interval: 0.58,
    damage: 46,
    range: 2.35,
  }),
  shuriken: Object.freeze({
    id: "shuriken",
    label: "СЮРИКЕНЫ",
    interval: 0.46,
    damage: 18,
    range: 7.2,
    projectileSpeed: 7.8,
    projectileLifetime: 1.1,
    spread: Object.freeze([-0.16, 0, 0.16]),
  }),
});

export function getWeaponProfile(id) {
  return HONEY_BADGER_WEAPONS[id] ?? HONEY_BADGER_WEAPONS.katana;
}

export function createVolleyDirections(dx, dz, spread = [0]) {
  const length = Math.hypot(dx, dz);
  if (!Number.isFinite(length) || length < 0.001) return [];
  const baseAngle = Math.atan2(dz, dx);
  return spread.map((offset) => {
    const safeOffset = Number.isFinite(offset) ? offset : 0;
    const angle = baseAngle + safeOffset;
    return Object.freeze({ x: Math.cos(angle), z: Math.sin(angle) });
  });
}
