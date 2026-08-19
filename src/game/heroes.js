import {
  DEFAULT_HERO_ID,
  HERO_IDS,
  RUN_CONFIG,
} from "../config/game-config.js";
import { getHeroLevelMultiplier, normalizeHeroProgress } from "./progression.js";

const WEAPON_VISUALS = new Set(["impact", "hammer", "shears", "razor", "rifle"]);

function freezeHero(definition) {
  return Object.freeze({
    ...definition,
    palette: Object.freeze({ ...definition.palette }),
    ratings: Object.freeze({ ...definition.ratings }),
    combat: Object.freeze({ ...definition.combat }),
  });
}

export const HEROES = Object.freeze([
  freezeHero({
    id: "honey-badger",
    name: "HONEY BADGER",
    monogram: "HB",
    role: "VANGUARD",
    weapon: "BLACK STEEL BAT",
    description: "Close-range pressure fighter. Heavy impact shots penetrate one target.",
    placeholder: "PHOTO REFERENCE PENDING",
    unlocked: true,
    palette: { accent: "#e6b461", secondary: "#d6843e", shadow: "#5f2e19" },
    ratings: { vitality: 4, power: 4, speed: 3 },
    combat: {
      maxHp: 125,
      speed: 280,
      damage: 42,
      projectileSpeed: 650,
      projectileCount: 1,
      projectileRadius: 13,
      projectileLifetime: 0.38,
      attackRange: 260,
      pierce: 1,
      wallBounces: 0,
      critChance: 0.08,
      attackInterval: 0.66,
      splashRadius: 0,
      weaponVisual: "impact",
    },
  }),
  freezeHero({
    id: "hadida",
    name: "HADIDA",
    monogram: "HD",
    role: "BREAKER",
    weapon: "FOUNDRY HAMMER",
    description: "Slow armored striker. Hammer impacts damage enemies around the target.",
    placeholder: "PHOTO REFERENCE PENDING",
    unlocked: true,
    palette: { accent: "#db7b45", secondary: "#f0b06d", shadow: "#54251b" },
    ratings: { vitality: 5, power: 5, speed: 2 },
    combat: {
      maxHp: 150,
      speed: 250,
      damage: 52,
      projectileSpeed: 540,
      projectileCount: 1,
      projectileRadius: 15,
      projectileLifetime: 0.58,
      attackRange: 315,
      pierce: 0,
      wallBounces: 0,
      critChance: 0.05,
      attackInterval: 0.82,
      splashRadius: 120,
      weaponVisual: "hammer",
    },
  }),
  freezeHero({
    id: "boya",
    name: "BOYA",
    monogram: "BY",
    role: "DUELIST",
    weapon: "TWIN SHEARS",
    description: "Fast skirmisher. Throws two blades with every standing attack.",
    placeholder: "PHOTO REFERENCE PENDING",
    unlocked: true,
    palette: { accent: "#dd5d54", secondary: "#f2a28d", shadow: "#4f1f26" },
    ratings: { vitality: 2, power: 3, speed: 5 },
    combat: {
      maxHp: 90,
      speed: 330,
      damage: 19,
      projectileSpeed: 760,
      projectileCount: 2,
      projectileRadius: 7,
      projectileLifetime: 0.69,
      attackRange: 520,
      pierce: 0,
      wallBounces: 0,
      critChance: 0.12,
      attackInterval: 0.46,
      splashRadius: 0,
      weaponVisual: "shears",
    },
  }),
  freezeHero({
    id: "mr-kroo",
    name: "MR. KROO",
    monogram: "MK",
    role: "TECHNICIAN",
    weapon: "RAZOR SHEARS",
    description: "Precision operator. Razor shots ricochet once from chamber walls.",
    placeholder: "PHOTO REFERENCE PENDING",
    unlocked: true,
    palette: { accent: "#79a99d", secondary: "#b7d7c8", shadow: "#183934" },
    ratings: { vitality: 3, power: 3, speed: 4 },
    combat: {
      maxHp: 105,
      speed: 300,
      damage: 31,
      projectileSpeed: 700,
      projectileCount: 1,
      projectileRadius: 9,
      projectileLifetime: 0.93,
      attackRange: 650,
      pierce: 0,
      wallBounces: 1,
      critChance: 0.18,
      attackInterval: 0.5,
      splashRadius: 0,
      weaponVisual: "razor",
    },
  }),
  freezeHero({
    id: "pata",
    name: "PATA",
    monogram: "PT",
    role: "MARKSMAN",
    weapon: "SERVICE RIFLE",
    description: "Long-range shooter. Fast rounds and the highest base fire rate.",
    placeholder: "PHOTO REFERENCE PENDING",
    unlocked: true,
    palette: { accent: "#9d8dcb", secondary: "#d0c4ef", shadow: "#2e244c" },
    ratings: { vitality: 2, power: 3, speed: 4 },
    combat: {
      maxHp: 95,
      speed: 290,
      damage: 24,
      projectileSpeed: 1_100,
      projectileCount: 1,
      projectileRadius: 5,
      projectileLifetime: 0.95,
      attackRange: 1_000,
      pierce: 0,
      wallBounces: 0,
      critChance: 0.12,
      attackInterval: 0.28,
      splashRadius: 0,
      weaponVisual: "rifle",
    },
  }),
]);

export { DEFAULT_HERO_ID };

export function getHeroDefinition(heroId = DEFAULT_HERO_ID) {
  return HEROES.find((hero) => hero.id === heroId) ?? null;
}

export function getUnlockedHeroes() {
  return HEROES.filter((hero) => hero.unlocked);
}

function safeModifier(modifiers, key, maximum) {
  const value = modifiers && typeof modifiers === "object" ? modifiers[key] : 0;
  return Number.isFinite(value) ? Math.min(maximum, Math.max(0, value)) : 0;
}

export function createHeroCombatProfile(
  heroId = DEFAULT_HERO_ID,
  { level = 1, modifiers = {} } = {},
) {
  const hero = getHeroDefinition(heroId);
  if (!hero?.unlocked) {
    throw new RangeError(`Unknown or locked hero: ${heroId}`);
  }

  const combat = hero.combat;
  const heroLevel = normalizeHeroProgress({ level }).level;
  const levelMultiplier = getHeroLevelMultiplier(heroLevel);
  const maxHp = Math.round(
    combat.maxHp * levelMultiplier * (1 + safeModifier(modifiers, "maxHpPct", 5)),
  );
  const damage = Math.round(
    combat.damage * levelMultiplier * (1 + safeModifier(modifiers, "damagePct", 5)),
  );
  return {
    heroId: hero.id,
    heroName: hero.name,
    heroLevel,
    weaponName: hero.weapon,
    accent: hero.palette.accent,
    secondary: hero.palette.secondary,
    shadow: hero.palette.shadow,
    weaponVisual: combat.weaponVisual,
    x: RUN_CONFIG.playerStartX,
    y: RUN_CONFIG.playerStartY,
    radius: 24,
    hp: maxHp,
    maxHp,
    speed: Math.round(combat.speed * (1 + safeModifier(modifiers, "speedPct", 2))),
    damage,
    projectileSpeed: combat.projectileSpeed,
    projectileCount: combat.projectileCount,
    projectileRadius: combat.projectileRadius,
    projectileLifetime: combat.projectileLifetime,
    attackRange: combat.attackRange,
    pierce: combat.pierce + Math.floor(safeModifier(modifiers, "pierce", 5)),
    wallBounces: combat.wallBounces,
    critChance: Math.min(0.75, combat.critChance + safeModifier(modifiers, "critChance", 0.6)),
    attackInterval: combat.attackInterval / (1 + safeModifier(modifiers, "attackSpeedPct", 4)),
    splashRadius: combat.splashRadius,
    attackTimer: 0,
    invulnerability: 0,
    facing: -Math.PI / 2,
    moving: false,
  };
}

export function validateHeroCatalog(heroes = HEROES) {
  const errors = [];
  const ids = new Set();
  const monograms = new Set();

  for (const hero of heroes) {
    if (!HERO_IDS.includes(hero.id) || ids.has(hero.id)) {
      errors.push(`Unknown or duplicate hero id: ${hero.id}`);
    }
    ids.add(hero.id);

    if (!hero.monogram || monograms.has(hero.monogram)) {
      errors.push(`Hero ${hero.id} must have a unique monogram`);
    }
    monograms.add(hero.monogram);

    if (!WEAPON_VISUALS.has(hero.combat?.weaponVisual)) {
      errors.push(`Hero ${hero.id} has an unsupported weapon visual`);
    }

    for (const stat of [
      "maxHp",
      "speed",
      "damage",
      "projectileSpeed",
      "projectileCount",
      "projectileRadius",
      "projectileLifetime",
      "attackRange",
      "attackInterval",
    ]) {
      if (!Number.isFinite(hero.combat?.[stat]) || hero.combat[stat] <= 0) {
        errors.push(`Hero ${hero.id} has invalid ${stat}`);
      }
    }
  }

  if (!ids.has(DEFAULT_HERO_ID)) {
    errors.push("Default hero is missing from the catalog");
  }

  return Object.freeze(errors);
}
