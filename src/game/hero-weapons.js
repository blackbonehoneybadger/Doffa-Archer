const ICON_ROOT = "/assets/ui";

const PAIRS = Object.freeze({
  "honey-badger": Object.freeze({
    melee: Object.freeze({ name: "BLACK STEEL KATANA", icon: `${ICON_ROOT}/katana-v1.png`, visual: "katana" }),
    ranged: Object.freeze({ name: "SHURIKEN VOLLEY", icon: `${ICON_ROOT}/shuriken-v1.png`, visual: "shuriken" }),
  }),
  hadida: Object.freeze({
    melee: Object.freeze({ name: "HARDWOOD BAT", icon: `${ICON_ROOT}/bat-v1.png`, visual: "bat" }),
    ranged: Object.freeze({ name: "BURNING CIGARETTE", icon: `${ICON_ROOT}/cigarette-butt-v1.png`, visual: "cigarette-butt" }),
  }),
  boya: Object.freeze({
    melee: Object.freeze({ name: "FOUNDRY HAMMER", icon: `${ICON_ROOT}/hammer-v1.png`, visual: "hammer" }),
    ranged: Object.freeze({ name: "GOLD PISTOL", icon: `${ICON_ROOT}/gold-pistol-v1.png`, visual: "gold-pistol" }),
  }),
  "mr-kroo": Object.freeze({
    melee: Object.freeze({ name: "CIRCASSIAN DAGGER", icon: `${ICON_ROOT}/circassian-dagger-v1.png`, visual: "dagger" }),
    ranged: Object.freeze({ name: "BLACK RECURVE BOW", icon: `${ICON_ROOT}/bow-v1.png`, visual: "bow" }),
  }),
  pata: Object.freeze({
    melee: Object.freeze({ name: "BARISTA PUNCH", icon: `${ICON_ROOT}/punch-v1.png`, visual: "punch" }),
    ranged: Object.freeze({ name: "PRESSURE COFFEE RIFLE", icon: `${ICON_ROOT}/coffee-rifle-v1.png`, visual: "coffee-rifle" }),
  }),
});

const MELEE_OVERRIDES = Object.freeze({
  "honey-badger": Object.freeze({
    visual: "katana", attackRange: 142, meleeArc: 1.55, maxTargets: 3,
    damageMultiplier: 1.12, splashRadius: 0,
  }),
  hadida: Object.freeze({
    visual: "bat", attackRange: 148, meleeArc: 1.35, maxTargets: 2,
    damageMultiplier: 1.22, splashRadius: 0,
  }),
  boya: Object.freeze({
    visual: "hammer", attackRange: 154, meleeArc: 1.18, maxTargets: 2,
    damageMultiplier: 1.36, splashRadius: 42,
  }),
  "mr-kroo": Object.freeze({
    visual: "dagger", attackRange: 126, meleeArc: .92, maxTargets: 1,
    damageMultiplier: 1.3, splashRadius: 0,
  }),
  pata: Object.freeze({
    visual: "punch", attackRange: 108, meleeArc: 1.1, maxTargets: 1,
    damageMultiplier: 1.45, splashRadius: 54,
  }),
});

export const WEAPON_SLOTS = Object.freeze(["melee", "ranged"]);

export function normalizeWeaponSlot(slot) {
  return WEAPON_SLOTS.includes(slot) ? slot : "melee";
}

export function getHeroWeaponPair(hero) {
  return PAIRS[hero?.id] ?? null;
}

export function getHeroWeaponDefinition(hero, slot = "melee") {
  return getHeroWeaponPair(hero)?.[normalizeWeaponSlot(slot)] ?? null;
}

export function getSelectedWeaponProfile(player) {
  const slot = normalizeWeaponSlot(player?.selectedWeaponSlot);
  if (slot === "ranged" && player?.secondaryWeapon) {
    return player.secondaryWeapon;
  }
  return MELEE_OVERRIDES[player?.heroId] ?? null;
}
