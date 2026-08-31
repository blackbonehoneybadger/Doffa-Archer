import {
  DEFAULT_HERO_ID,
  HERO_IDS,
  RUN_CONFIG,
} from "../config/game-config.js";
import {
  PLAYER_ANIMATION_STATES,
  PLAYER_FACING_DIRECTIONS,
} from "./player-animation.js";
import {
  freezeDirectionalAnimationAtlas,
  validateDirectionalAnimationAtlas,
} from "./animation-player.js";
import { getHeroLevelMultiplier, normalizeHeroProgress } from "./progression.js";

const WEAPON_VISUALS = new Set([
  "katana", "shuriken", "bat", "cigarette-butt", "hammer", "gold-pistol",
  "dagger", "bow", "punch", "coffee-rifle",
]);
const ART_BACKDROPS = new Set(["transparent", "light-checker"]);
const STANDARD_MOTION_FRAMES = Object.freeze({
  idle: Object.freeze([0, 1]),
  run: Object.freeze([1, 2, 3, 2]),
  attack: Object.freeze([4, 5]),
  hit: Object.freeze([6]),
  defeat: Object.freeze([7]),
});
const STANDARD_MOTION_DIRECTIONS = Object.freeze([
  "east",
  "south-east",
  "south-west",
  "west",
]);
const STANDARD_FULL_MOTION_STATE_ROWS = Object.freeze({
  idle: 0,
  run: 2,
  attack: 4,
});
const STANDARD_REACTION_STATE_ROWS = Object.freeze({
  hit: 0,
  defeat: 2,
});
const STANDARD_DIRECTIONAL_FRAMES = Object.freeze({
  east: Object.freeze({ index: 0 }),
  "south-east": Object.freeze({ index: 1 }),
  south: Object.freeze({ index: 2 }),
  "south-west": Object.freeze({ index: 3 }),
  west: Object.freeze({ index: 4 }),
  "north-west": Object.freeze({ index: 5 }),
  north: Object.freeze({ index: 6 }),
  "north-east": Object.freeze({ index: 7 }),
});

function freezeHero(definition) {
  return Object.freeze({
    ...definition,
    palette: Object.freeze({ ...definition.palette }),
    ratings: Object.freeze({ ...definition.ratings }),
    combat: Object.freeze({
      ...definition.combat,
      secondaryWeapon: definition.combat.secondaryWeapon
        ? Object.freeze({ ...definition.combat.secondaryWeapon })
        : null,
    }),
    art: definition.art
      ? Object.freeze({
        ...definition.art,
        portraitCrop: Object.freeze({ ...definition.art.portraitCrop }),
        directionalFrames: Object.freeze(
          Object.fromEntries(
            Object.entries(definition.art.directionalFrames ?? {}).map(([direction, frame]) => [
              direction,
              Object.freeze({ ...frame }),
            ]),
          ),
        ),
        motionFrames: Object.freeze(
          Object.fromEntries(
            Object.entries(definition.art.motionFrames ?? {}).map(([state, frames]) => [
              state,
              Object.freeze([...frames]),
            ]),
          ),
        ),
        motionDirections: Object.freeze([...(definition.art.motionDirections ?? [])]),
        fullMotionStateRows: definition.art.fullMotionStateRows
          ? Object.freeze({ ...definition.art.fullMotionStateRows })
          : null,
        fullMotionAnimation: freezeDirectionalAnimationAtlas(
          definition.art.fullMotionAnimation,
        ),
        reactionStateRows: definition.art.reactionStateRows
          ? Object.freeze({ ...definition.art.reactionStateRows })
          : null,
        reactionAnimation: freezeDirectionalAnimationAtlas(
          definition.art.reactionAnimation,
        ),
        backdropSeeds: Object.freeze(
          (definition.art.backdropSeeds ?? []).map((seed) => Object.freeze({ ...seed })),
        ),
      })
      : null,
  });
}

export const HEROES = Object.freeze([
  freezeHero({
    id: "honey-badger",
    name: "HONEY BADGER",
    monogram: "HB",
    role: "VANGUARD",
    weapon: "BLACK STEEL KATANA / SHURIKEN",
    description: "Close-range katana fighter. Switch manually to a fast shuriken volley when you need distance.",
    placeholder: "REFERENCE ART READY",
    unlocked: true,
    art: {
      portraitSprite: "/assets/heroes/portraits/honey-badger-portrait-v1.png",
      sprite: "/assets/heroes/honey-badger-lean-v3.png",
      directionalSprite: "/assets/heroes/honey-badger-directions-v3.png",
      motionSprite: "/assets/heroes/honey-badger-motion-v3.png",
      motionFrames: STANDARD_MOTION_FRAMES,
      motionDirections: STANDARD_MOTION_DIRECTIONS,
      fullMotionSprite: "/assets/heroes/honey-badger-full-motion-v3.png",
      fullMotionStateRows: STANDARD_FULL_MOTION_STATE_ROWS,
      secondaryAttackSprite: "/assets/heroes/honey-badger-shuriken-attack-v1.png",
      reactionSprite: "/assets/heroes/honey-badger-reactions-v2.png",
      reactionStateRows: STANDARD_REACTION_STATE_ROWS,
      directionalFrames: STANDARD_DIRECTIONAL_FRAMES,
      backdrop: "transparent",
      portraitCrop: { x: 0.22, y: 0, width: 0.56, height: 0.7 },
    },
    palette: { accent: "#e6b461", secondary: "#d6843e", shadow: "#5f2e19" },
    ratings: { vitality: 4, power: 4, speed: 3 },
    combat: {
      maxHp: 125,
      speed: 280,
      damage: 42,
      projectileSpeed: 650,
      projectileCount: 1,
      projectileRadius: 10,
      projectileLifetime: 0.54,
      attackRange: 380,
      pierce: 1,
      wallBounces: 0,
      critChance: 0.08,
      attackInterval: 0.6,
      splashRadius: 0,
      weaponVisual: "katana",
      secondaryWeapon: {
        visual: "shuriken",
        attackRange: 720,
        projectileSpeed: 820,
        projectileCount: 3,
        projectileRadius: 7,
        projectileLifetime: 0.92,
        damageMultiplier: 0.58,
        pierce: 0,
        wallBounces: 1,
        splashRadius: 0,
        spread: 0.34,
        every: 4,
      },
    },
  }),
  freezeHero({
    id: "hadida",
    name: "HADIDA",
    monogram: "HD",
    role: "ENFORCER",
    weapon: "HARDWOOD BAT",
    description: "Armored street fighter. Heavy bat impacts punch through the front line.",
    placeholder: "REFERENCE ART READY",
    unlocked: true,
    art: {
      portraitSprite: "/assets/heroes/portraits/hadida-portrait-v1.png",
      sprite: "/assets/heroes/hadida-papakha-v3.png",
      directionalSprite: "/assets/heroes/hadida-directions-v3.png",
      motionSprite: "/assets/heroes/hadida-motion-v3.png",
      motionFrames: STANDARD_MOTION_FRAMES,
      motionDirections: STANDARD_MOTION_DIRECTIONS,
      fullMotionSprite: "/assets/heroes/hadida-full-motion-v3.png",
      fullMotionStateRows: STANDARD_FULL_MOTION_STATE_ROWS,
      reactionSprite: "/assets/heroes/hadida-reactions-v2.png",
      reactionStateRows: STANDARD_REACTION_STATE_ROWS,
      directionalFrames: STANDARD_DIRECTIONAL_FRAMES,
      backdrop: "transparent",
      portraitCrop: { x: 0.27, y: 0.05, width: 0.46, height: 0.575 },
    },
    palette: { accent: "#db7b45", secondary: "#f0b06d", shadow: "#54251b" },
    ratings: { vitality: 5, power: 5, speed: 2 },
    combat: {
      maxHp: 150,
      speed: 250,
      damage: 44,
      projectileSpeed: 620,
      projectileCount: 1,
      projectileRadius: 13,
      projectileLifetime: 0.46,
      attackRange: 290,
      pierce: 1,
      wallBounces: 0,
      critChance: 0.05,
      attackInterval: 0.64,
      splashRadius: 0,
      weaponVisual: "bat",
      secondaryWeapon: {
        visual: "cigarette-butt",
        attackRange: 690,
        projectileSpeed: 760,
        projectileCount: 2,
        projectileRadius: 6,
        projectileLifetime: 0.9,
        damageMultiplier: 0.68,
        pierce: 0,
        wallBounces: 0,
        splashRadius: 38,
        spread: 0.16,
        every: 1,
      },
    },
  }),
  freezeHero({
    id: "boya",
    name: "BOY",
    monogram: "BY",
    role: "BREAKER",
    weapon: "FOUNDRY HAMMER",
    description: "Heavy hammer carrier. Switch manually to the gold pistol for precise ranged pressure.",
    placeholder: "REFERENCE ART READY",
    unlocked: true,
    art: {
      portraitSprite: "/assets/heroes/portraits/boy-portrait-v1.png",
      sprite: "/assets/heroes/boy-identity-v3.png",
      directionalSprite: "/assets/heroes/boy-directions-v3.png",
      motionSprite: "/assets/heroes/boy-motion-v3.png",
      motionFrames: STANDARD_MOTION_FRAMES,
      motionDirections: STANDARD_MOTION_DIRECTIONS,
      fullMotionSprite: "/assets/heroes/boy-full-motion-v3.png",
      fullMotionStateRows: STANDARD_FULL_MOTION_STATE_ROWS,
      reactionSprite: "/assets/heroes/boy-reactions-v2.png",
      reactionStateRows: STANDARD_REACTION_STATE_ROWS,
      directionalFrames: STANDARD_DIRECTIONAL_FRAMES,
      backdrop: "transparent",
      portraitCrop: { x: 0.25, y: 0.04, width: 0.5, height: 0.625 },
    },
    palette: { accent: "#dd5d54", secondary: "#f2a28d", shadow: "#4f1f26" },
    ratings: { vitality: 4, power: 5, speed: 2 },
    combat: {
      maxHp: 118,
      speed: 270,
      damage: 48,
      projectileSpeed: 540,
      projectileCount: 1,
      projectileRadius: 15,
      projectileLifetime: 0.58,
      attackRange: 315,
      pierce: 0,
      wallBounces: 0,
      critChance: 0.07,
      attackInterval: 0.78,
      splashRadius: 115,
      weaponVisual: "hammer",
      secondaryWeapon: {
        visual: "gold-pistol",
        attackRange: 760,
        projectileSpeed: 980,
        projectileCount: 1,
        projectileRadius: 7,
        projectileLifetime: 0.92,
        damageMultiplier: 0.72,
        pierce: 1,
        wallBounces: 0,
        splashRadius: 0,
        spread: 0,
        every: 1,
      },
    },
  }),
  freezeHero({
    id: "mr-kroo",
    name: "MR. KROO",
    monogram: "MK",
    role: "RANGER",
    weapon: "BLACK RECURVE BOW",
    description: "Precision archer. Heavy arrows pierce the first target and reward critical aim.",
    placeholder: "REFERENCE ART READY",
    unlocked: true,
    art: {
      portraitSprite: "/assets/heroes/portraits/mr-kroo-portrait-v1.png",
      sprite: "/assets/heroes/mr-kroo-bow-v4.png",
      directionalSprite: "/assets/heroes/mr-kroo-directions-v4.png",
      motionSprite: "/assets/heroes/mr-kroo-motion-v4.png",
      motionFrames: STANDARD_MOTION_FRAMES,
      motionDirections: STANDARD_MOTION_DIRECTIONS,
      fullMotionSprite: "/assets/heroes/mr-kroo-full-motion-v4.png",
      fullMotionStateRows: STANDARD_FULL_MOTION_STATE_ROWS,
      reactionSprite: "/assets/heroes/mr-kroo-reactions-v3.png",
      reactionStateRows: STANDARD_REACTION_STATE_ROWS,
      directionalFrames: STANDARD_DIRECTIONAL_FRAMES,
      backdrop: "transparent",
      portraitCrop: { x: 0.22, y: 0.04, width: 0.5, height: 0.625 },
    },
    palette: { accent: "#79a99d", secondary: "#b7d7c8", shadow: "#183934" },
    ratings: { vitality: 3, power: 3, speed: 4 },
    combat: {
      maxHp: 105,
      speed: 300,
      damage: 39,
      projectileSpeed: 920,
      projectileCount: 1,
      projectileRadius: 6,
      projectileLifetime: 1.05,
      attackRange: 820,
      pierce: 1,
      wallBounces: 0,
      critChance: 0.22,
      attackInterval: 0.68,
      splashRadius: 0,
      weaponVisual: "bow",
      secondaryWeapon: {
        visual: "bow",
        attackRange: 820,
        projectileSpeed: 920,
        projectileCount: 1,
        projectileRadius: 6,
        projectileLifetime: 1.05,
        damageMultiplier: 0.92,
        pierce: 1,
        wallBounces: 0,
        splashRadius: 0,
        spread: 0,
        every: 1,
      },
    },
  }),
  freezeHero({
    id: "pata",
    name: "PATA",
    monogram: "PT",
    role: "MARKSMAN",
    weapon: "PRESSURE COFFEE RIFLE",
    description: "Long-range barista. Espresso-pressure rounds deliver the fastest fire rate.",
    placeholder: "REFERENCE ART READY",
    unlocked: true,
    art: {
      portraitSprite: "/assets/heroes/portraits/pata-portrait-v1.png",
      sprite: "/assets/heroes/pata.png",
      directionalSprite: "/assets/heroes/pata-directions.png",
      motionSprite: "/assets/heroes/pata-motion.png",
      motionFrames: STANDARD_MOTION_FRAMES,
      motionDirections: STANDARD_MOTION_DIRECTIONS,
      fullMotionSprite: "/assets/heroes/pata-full-motion-v2.png",
      fullMotionStateRows: STANDARD_FULL_MOTION_STATE_ROWS,
      reactionSprite: "/assets/heroes/pata-reactions-v1.png",
      reactionStateRows: STANDARD_REACTION_STATE_ROWS,
      directionalFrames: {
        east: { index: 2 },
        "south-east": { index: 1 },
        south: { index: 0 },
        "south-west": { index: 1, flipX: true },
        west: { index: 2, flipX: true },
        "north-west": { index: 6 },
        north: { index: 7 },
        "north-east": { index: 7 },
      },
      backdrop: "transparent",
      portraitCrop: { x: 0.2, y: 0, width: 0.6, height: 0.5 },
    },
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
      weaponVisual: "coffee-rifle",
      secondaryWeapon: {
        visual: "coffee-rifle",
        attackRange: 1_000,
        projectileSpeed: 1_100,
        projectileCount: 1,
        projectileRadius: 5,
        projectileLifetime: 0.95,
        damageMultiplier: 0.82,
        pierce: 0,
        wallBounces: 0,
        splashRadius: 0,
        spread: 0,
        every: 1,
      },
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
    secondaryWeapon: combat.secondaryWeapon ? { ...combat.secondaryWeapon } : null,
    selectedWeaponSlot: "melee",
    weaponSwitchCooldown: 0,
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
    baseProjectileRadius: combat.projectileRadius,
    projectileLifetime: combat.projectileLifetime,
    attackRange: combat.attackRange,
    pierce: combat.pierce + Math.floor(safeModifier(modifiers, "pierce", 5)),
    basePierce: combat.pierce,
    wallBounces: combat.wallBounces,
    baseWallBounces: combat.wallBounces,
    critChance: Math.min(0.75, combat.critChance + safeModifier(modifiers, "critChance", 0.6)),
    attackInterval: combat.attackInterval / (1 + safeModifier(modifiers, "attackSpeedPct", 4)),
    splashRadius: combat.splashRadius,
    baseSplashRadius: combat.splashRadius,
    pickupRadius: 92,
    pickupSpeed: 520,
    healOnRoomClearPct: 0,
    damageReduction: 0,
    critMultiplier: 2,
    extraShotAngles: [],
    chainDamagePct: 0,
    burnDamagePct: 0,
    frostSlowPct: 0,
    poisonDamagePct: 0,
    deathBurstPct: 0,
    deathBurstRadius: 0,
    shieldPulseInterval: 0,
    shieldPulseDuration: 0,
    shieldPulseTimer: 0,
    bloodThirstPct: 0,
    rageMaxPct: 0,
    meleeDamagePct: 0,
    meleeRangePct: 0,
    enemyRicochets: 0,
    deathFrostRadius: 0,
    projectileBlockChance: 0,
    healMultiplier: 1,
    lowHealthAttackSpeedPct: 0,
    lowHealthHealPct: 0,
    lowHealthDodgePct: 0,
    xpMultiplier: 1,
    executeChance: 0,
    enemyProjectileSlowPct: 0,
    extraLives: 0,
    auraFire: 0,
    auraFrost: 0,
    auraPoison: 0,
    auraVolt: 0,
    auraTimer: 0.45,
    strikeFire: 0,
    strikeFrost: 0,
    strikePoison: 0,
    strikeVolt: 0,
    strikeTimer: 1.8,
    meteorDamagePct: 0,
    meteorRadius: 0,
    meteorTimer: 3.8,
    attackTimer: 0,
    attackSequence: 0,
    invulnerability: 0,
    animationClock: 0,
    animationState: "idle",
    animationStateClock: 0,
    animationStateDirection: "north",
    attackAnimation: 0,
    hitAnimation: 0,
    defeatAnimation: 0,
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
    const secondaryWeapon = hero.combat?.secondaryWeapon;
    if (secondaryWeapon && (
      !WEAPON_VISUALS.has(secondaryWeapon.visual)
      || !Number.isFinite(secondaryWeapon.attackRange)
      || secondaryWeapon.attackRange <= 0
      || !Number.isInteger(secondaryWeapon.projectileCount)
      || secondaryWeapon.projectileCount < 1
      || !Number.isInteger(secondaryWeapon.every)
      || secondaryWeapon.every < 1
      || !Number.isFinite(secondaryWeapon.damageMultiplier)
      || secondaryWeapon.damageMultiplier <= 0
      || secondaryWeapon.damageMultiplier > 1
    )) {
      errors.push(`Hero ${hero.id} has an invalid secondary weapon`);
    }

    if (hero.art) {
      if (!/^\/assets\/heroes\/portraits\/[a-z0-9-]+\.png$/.test(hero.art.portraitSprite)) {
        errors.push(`Hero ${hero.id} has an unsafe portrait sprite path`);
      }
      if (!/^\/assets\/heroes\/[a-z0-9-]+\.png$/.test(hero.art.sprite)) {
        errors.push(`Hero ${hero.id} has an unsafe sprite path`);
      }
      if (!/^\/assets\/heroes\/[a-z0-9-]+\.png$/.test(hero.art.directionalSprite)) {
        errors.push(`Hero ${hero.id} has an unsafe directional sprite path`);
      }
      if (!/^\/assets\/heroes\/[a-z0-9-]+\.png$/.test(hero.art.motionSprite)) {
        errors.push(`Hero ${hero.id} has an unsafe motion sprite path`);
      }
      if (
        hero.art.fullMotionSprite !== undefined
        && !/^\/assets\/heroes\/[a-z0-9-]+\.png$/.test(hero.art.fullMotionSprite)
      ) {
        errors.push(`Hero ${hero.id} has an unsafe full-motion sprite path`);
      }
      if (
        hero.art.reactionSprite !== undefined
        && !/^\/assets\/heroes\/[a-z0-9-]+\.png$/.test(hero.art.reactionSprite)
      ) {
        errors.push(`Hero ${hero.id} has an unsafe reaction sprite path`);
      }
      if (
        hero.art.secondaryAttackSprite !== undefined
        && (
          !secondaryWeapon
          || !/^\/assets\/heroes\/[a-z0-9-]+\.png$/.test(hero.art.secondaryAttackSprite)
        )
      ) {
        errors.push(`Hero ${hero.id} has an invalid secondary-attack sprite`);
      }
      for (const direction of PLAYER_FACING_DIRECTIONS) {
        const frame = hero.art.directionalFrames?.[direction];
        if (
          !frame
          || !Number.isInteger(frame.index)
          || frame.index < 0
          || frame.index > 7
          || (frame.flipX !== undefined && typeof frame.flipX !== "boolean")
        ) {
          errors.push(`Hero ${hero.id} has an invalid ${direction} directional frame`);
        }
      }
      for (const state of PLAYER_ANIMATION_STATES) {
        const frames = hero.art.motionFrames?.[state];
        if (
          !Array.isArray(frames)
          || frames.length === 0
          || frames.some((frame) => !Number.isInteger(frame) || frame < 0 || frame > 7)
        ) {
          errors.push(`Hero ${hero.id} has invalid ${state} motion frames`);
        }
      }
      const motionDirections = hero.art.motionDirections ?? [];
      if (
        motionDirections.length === 0
        || new Set(motionDirections).size !== motionDirections.length
        || motionDirections.some(
          (direction) => !PLAYER_FACING_DIRECTIONS.includes(direction),
        )
      ) {
        errors.push(`Hero ${hero.id} has invalid motion directions`);
      }
      if (hero.art.fullMotionSprite !== undefined) {
        const fullMotionEntries = Object.entries(hero.art.fullMotionStateRows ?? {});
        if (
          fullMotionEntries.length === 0
          || fullMotionEntries.some(
            ([state, row]) => !PLAYER_ANIMATION_STATES.includes(state)
              || !Number.isInteger(row)
              || row < 0
              || row > 4
              || row % 2 !== 0,
          )
        ) {
          errors.push(`Hero ${hero.id} has invalid full-motion state rows`);
        }
        if (hero.art.fullMotionAnimation) {
          for (const error of validateDirectionalAnimationAtlas(
            hero.art.fullMotionAnimation,
            {
              directions: PLAYER_FACING_DIRECTIONS,
              states: ["idle", "run", "attack"],
            },
          )) {
            errors.push(`Hero ${hero.id} full-motion ${error}`);
          }
        }
      } else if (hero.art.fullMotionAnimation) {
        for (const error of validateDirectionalAnimationAtlas(
          hero.art.fullMotionAnimation,
          {
            directions: PLAYER_FACING_DIRECTIONS,
            states: ["idle", "run", "attack"],
          },
        )) {
          errors.push(`Hero ${hero.id} full-motion ${error}`);
        }
      }
      if (hero.art.reactionSprite !== undefined) {
        const reactionEntries = Object.entries(hero.art.reactionStateRows ?? {});
        if (
          reactionEntries.length !== 2
          || reactionEntries.some(
            ([state, row]) => !["hit", "defeat"].includes(state)
              || !Number.isInteger(row)
              || row < 0
              || row > 2
              || row % 2 !== 0,
          )
        ) {
          errors.push(`Hero ${hero.id} has invalid reaction state rows`);
        }
        if (hero.art.reactionAnimation) {
          for (const error of validateDirectionalAnimationAtlas(
            hero.art.reactionAnimation,
            {
              directions: PLAYER_FACING_DIRECTIONS,
              states: ["hit", "defeat"],
            },
          )) {
            errors.push(`Hero ${hero.id} reaction ${error}`);
          }
        }
      } else if (hero.art.reactionAnimation) {
        for (const error of validateDirectionalAnimationAtlas(
          hero.art.reactionAnimation,
          {
            directions: PLAYER_FACING_DIRECTIONS,
            states: ["hit", "defeat"],
          },
        )) {
          errors.push(`Hero ${hero.id} reaction ${error}`);
        }
      }
      if (!ART_BACKDROPS.has(hero.art.backdrop)) {
        errors.push(`Hero ${hero.id} has an unsupported art backdrop`);
      }
      const crop = hero.art.portraitCrop;
      if (
        !crop
        || ![crop.x, crop.y, crop.width, crop.height].every(Number.isFinite)
        || crop.x < 0
        || crop.y < 0
        || crop.width <= 0
        || crop.height <= 0
        || crop.x + crop.width > 1
        || crop.y + crop.height > 1
      ) {
        errors.push(`Hero ${hero.id} has an invalid portrait crop`);
      }
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
