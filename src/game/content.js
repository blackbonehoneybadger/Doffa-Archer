import { DEFAULT_TOUR_ID } from "../config/game-config.js";
import { ARENA_TOUR_ENEMIES, ARENA_TOURS } from "./arena-tours.js";
import {
  createRoomDestructibles,
  getDestructibleDefinition,
} from "./destructibles.js";
import {
  freezeDirectionalAnimationAtlas,
  validateDirectionalAnimationAtlas,
} from "./animation-player.js";
import { ENEMY_FACING_DIRECTIONS } from "./enemy-animation.js";
import {
  createUniqueEncounterWaves,
  getEncounterSignature,
} from "./encounter-design.js";
import { personalizeRoomLayout } from "./room-art.js";

const STANDARD_ENEMY_MOTION_STATE_ROWS = Object.freeze({
  idle: 0,
  move: 2,
  attack: 4,
});

export const KAPRIZARD_BOSS_IDENTITY = Object.freeze({
  id: "kaprizard",
  headIdentity: "kaprizard-head-v1",
  faceExposed: true,
});

function freezeEnemy(id, definition) {
  return Object.freeze({
    id,
    elite: false,
    boss: false,
    ...definition,
    art: definition.art
      ? Object.freeze({
        ...definition.art,
        motionStateRows: definition.art.motionStateRows
          ? Object.freeze({ ...definition.art.motionStateRows })
          : null,
        motionAnimation: freezeDirectionalAnimationAtlas(
          definition.art.motionAnimation,
        ),
        specialStateRows: definition.art.specialStateRows
          ? Object.freeze({ ...definition.art.specialStateRows })
          : null,
        specialAnimation: freezeDirectionalAnimationAtlas(
          definition.art.specialAnimation,
        ),
        reactionStateRows: definition.art.reactionStateRows
          ? Object.freeze({ ...definition.art.reactionStateRows })
          : null,
        reactionAnimation: freezeDirectionalAnimationAtlas(
          definition.art.reactionAnimation,
        ),
      })
      : null,
  });
}

function freezeRoom(definition) {
  const waves = definition.waves ?? [definition.enemies ?? []];
  const frozenWaves = Object.freeze(waves.map((wave) => Object.freeze([...wave])));
  return Object.freeze({
    roomType: "combat",
    reward: "advance",
    elite: false,
    boss: false,
    ...definition,
    waves: frozenWaves,
    enemies: Object.freeze(frozenWaves.flat()),
    obstacles: Object.freeze(
      (definition.obstacles ?? []).map((obstacle) => Object.freeze({ ...obstacle })),
    ),
    hazards: Object.freeze(
      (definition.hazards ?? []).map((hazard) => Object.freeze({ ...hazard })),
    ),
    destructibles: Object.freeze(
      (definition.destructibles ?? []).map((destructible) => Object.freeze({ ...destructible })),
    ),
  });
}

function freezeTour(definition) {
  return Object.freeze({
    ...definition,
    rooms: Object.freeze(definition.rooms.map(freezeRoom)),
  });
}

export const ENEMY_CATALOG = Object.freeze({
  ash_hound: freezeEnemy("ash_hound", {
    name: "ASH HOUND",
    family: "hollow_roastery",
    difficultyTier: 1,
    behavior: "ash_hound",
    art: {
      sprite: "/assets/enemies/ash-hound.png",
      motionSprite: "/assets/enemies/ash-hound-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      backdrop: "magenta",
      renderHeight: 108,
      anchorY: 0.58,
    },
    hp: 46,
    speed: 102,
    radius: 25,
    contactDamage: 10,
    score: 100,
    xp: 8,
  }),
  ember_oracle: freezeEnemy("ember_oracle", {
    name: "EMBER ORACLE",
    family: "hollow_roastery",
    behavior: "ember_oracle",
    art: {
      sprite: "/assets/enemies/ember-oracle.png",
      motionSprite: "/assets/enemies/ember-oracle-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      backdrop: "transparent",
      renderHeight: 132,
      anchorY: 0.58,
    },
    hp: 58,
    speed: 68,
    radius: 27,
    contactDamage: 8,
    score: 140,
    xp: 11,
  }),
  brass_colossus: freezeEnemy("brass_colossus", {
    name: "BRASS COLOSSUS",
    family: "hollow_roastery",
    behavior: "brass_colossus",
    art: {
      sprite: "/assets/enemies/brass-colossus.png",
      motionSprite: "/assets/enemies/brass-colossus-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      backdrop: "transparent",
      renderHeight: 138,
      anchorY: 0.62,
    },
    hp: 118,
    speed: 52,
    radius: 34,
    contactDamage: 16,
    score: 200,
    xp: 18,
  }),
  smoke_revenant: freezeEnemy("smoke_revenant", {
    name: "SMOKE REVENANT",
    family: "hollow_roastery",
    behavior: "smoke_revenant",
    art: {
      sprite: "/assets/enemies/smoke-revenant.png",
      motionSprite: "/assets/enemies/smoke-revenant-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      backdrop: "transparent",
      renderHeight: 140,
      anchorY: 0.56,
    },
    hp: 76,
    speed: 76,
    radius: 29,
    contactDamage: 11,
    score: 180,
    xp: 14,
  }),
  kiln_warden: freezeEnemy("kiln_warden", {
    name: "THE KILN WARDEN",
    family: "hollow_roastery",
    behavior: "kiln_warden",
    art: {
      sprite: "/assets/enemies/kiln-warden.png",
      motionSprite: "/assets/enemies/kiln-warden-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      backdrop: "transparent",
      renderHeight: 248,
      anchorY: 0.61,
    },
    hp: 640,
    speed: 58,
    radius: 52,
    contactDamage: 18,
    score: 1_200,
    xp: 90,
    elite: true,
    telegraphSeconds: 0.74,
  }),
  pressure_widow: freezeEnemy("pressure_widow", {
    name: "THE PRESSURE WIDOW",
    family: "hollow_roastery",
    behavior: "pressure_widow",
    art: {
      sprite: "/assets/enemies/pressure-widow.png",
      motionSprite: "/assets/enemies/pressure-widow-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      backdrop: "transparent",
      renderHeight: 246,
      anchorY: 0.56,
    },
    hp: 780,
    speed: 66,
    radius: 58,
    contactDamage: 16,
    score: 1_500,
    xp: 110,
    elite: true,
    telegraphSeconds: 0.62,
  }),
  cinder_bishop: freezeEnemy("cinder_bishop", {
    name: "THE CINDER BISHOP",
    family: "hollow_roastery",
    behavior: "cinder_bishop",
    art: {
      sprite: "/assets/enemies/cinder-bishop.png",
      motionSprite: "/assets/enemies/cinder-bishop-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      backdrop: "transparent",
      renderHeight: 254,
      anchorY: 0.57,
    },
    hp: 890,
    speed: 70,
    radius: 55,
    contactDamage: 17,
    score: 1_800,
    xp: 130,
    elite: true,
    telegraphSeconds: 0.58,
  }),
  grinder_saint: freezeEnemy("grinder_saint", {
    name: "THE GRINDER SAINT",
    family: "hollow_roastery",
    behavior: "grinder_saint",
    art: {
      sprite: "/assets/enemies/grinder-saint.png",
      motionSprite: "/assets/enemies/grinder-saint-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      backdrop: "transparent",
      renderHeight: 264,
      anchorY: 0.61,
    },
    hp: 1_060,
    speed: 60,
    radius: 62,
    contactDamage: 20,
    score: 2_200,
    xp: 160,
    elite: true,
    telegraphSeconds: 0.7,
  }),
  hollow_roaster: freezeEnemy("hollow_roaster", {
    name: "THE HOLLOW ROASTER",
    family: "hollow_roastery",
    behavior: "hollow_roaster",
    identity: "kaprizard",
    headIdentity: KAPRIZARD_BOSS_IDENTITY.headIdentity,
    faceExposed: true,
    bodySignature: "mechanical-roaster-colossus",
    attackSignature: "pressure-lanes-and-ember-crown",
    locomotionSignature: "piston-stomp",
    art: {
      sprite: "/assets/enemies/hollow-roaster-kaprizard-v3.png",
      motionSprite: "/assets/enemies/hollow-roaster-motion-v2.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      specialSprite: "/assets/enemies/hollow-roaster-special-v1.png",
      specialStateRows: { secondary: 0, phase: 2 },
      reactionSprite: "/assets/enemies/hollow-roaster-reactions-v1.png",
      reactionStateRows: { hit: 0, defeat: 2 },
      backdrop: "transparent",
      renderHeight: 292,
      anchorY: 0.6,
    },
    hp: 2_800,
    speed: 45,
    radius: 72,
    contactDamage: 22,
    score: 4_500,
    xp: 320,
    boss: true,
  }),
  razor_mantis: freezeEnemy("razor_mantis", {
    name: "RAZOR MANTIS",
    family: "rootfall_jungle",
    difficultyTier: 2,
    behavior: "razor_mantis",
    art: {
      sprite: "/assets/enemies/razor-mantis.png",
      motionSprite: "/assets/enemies/razor-mantis-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      backdrop: "transparent",
      renderHeight: 168,
      anchorY: 0.58,
    },
    hp: 62,
    speed: 118,
    radius: 24,
    contactDamage: 12,
    score: 125,
    xp: 10,
  }),
  seed_spitter: freezeEnemy("seed_spitter", {
    name: "SEED SPITTER",
    family: "rootfall_jungle",
    behavior: "seed_spitter",
    art: {
      sprite: "/assets/enemies/seed-spitter.png",
      motionSprite: "/assets/enemies/seed-spitter-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      backdrop: "transparent",
      renderHeight: 148,
      anchorY: 0.59,
    },
    hp: 72,
    speed: 62,
    radius: 27,
    contactDamage: 9,
    score: 165,
    xp: 13,
  }),
  root_stalker: freezeEnemy("root_stalker", {
    name: "ROOT STALKER",
    family: "rootfall_jungle",
    behavior: "root_stalker",
    art: {
      sprite: "/assets/enemies/root-stalker.png",
      motionSprite: "/assets/enemies/root-stalker-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      backdrop: "transparent",
      renderHeight: 156,
      anchorY: 0.6,
    },
    hp: 104,
    speed: 84,
    radius: 30,
    contactDamage: 15,
    score: 215,
    xp: 17,
  }),
  spore_moth: freezeEnemy("spore_moth", {
    name: "SPORE MOTH",
    family: "rootfall_jungle",
    behavior: "spore_moth",
    floating: true,
    art: {
      sprite: "/assets/enemies/spore-moth.png",
      motionSprite: "/assets/enemies/spore-moth-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      backdrop: "transparent",
      renderHeight: 132,
      anchorY: 0.55,
    },
    hp: 82,
    speed: 88,
    radius: 28,
    contactDamage: 10,
    score: 190,
    xp: 15,
  }),
  briar_jaguar: freezeEnemy("briar_jaguar", {
    name: "THE BRIAR JAGUAR",
    family: "rootfall_jungle",
    behavior: "briar_jaguar",
    art: {
      sprite: "/assets/enemies/briar-jaguar.png",
      motionSprite: "/assets/enemies/briar-jaguar-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      specialSprite: "/assets/enemies/briar-jaguar-special-v1.png",
      specialStateRows: { secondary: 0, release: 2 },
      reactionSprite: "/assets/enemies/briar-jaguar-reactions-v1.png",
      reactionStateRows: { hit: 0, defeat: 2 },
      backdrop: "transparent",
      renderHeight: 220,
      anchorY: 0.6,
    },
    hp: 780,
    speed: 82,
    radius: 54,
    contactDamage: 20,
    score: 1_500,
    xp: 115,
    elite: true,
    telegraphSeconds: 0.62,
  }),
  mire_bellower: freezeEnemy("mire_bellower", {
    name: "THE MIRE BELLOWER",
    family: "rootfall_jungle",
    behavior: "mire_bellower",
    art: {
      sprite: "/assets/enemies/mire-bellower.png",
      motionSprite: "/assets/enemies/mire-bellower-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      specialSprite: "/assets/enemies/mire-bellower-special-v1.png",
      specialStateRows: { secondary: 0, release: 2 },
      reactionSprite: "/assets/enemies/mire-bellower-reactions-v1.png",
      reactionStateRows: { hit: 0, defeat: 2 },
      backdrop: "transparent",
      renderHeight: 230,
      anchorY: 0.61,
    },
    hp: 940,
    speed: 56,
    radius: 60,
    contactDamage: 18,
    score: 1_850,
    xp: 140,
    elite: true,
    telegraphSeconds: 0.72,
  }),
  orchid_maw: freezeEnemy("orchid_maw", {
    name: "THE ORCHID MAW",
    family: "rootfall_jungle",
    behavior: "orchid_maw",
    art: {
      sprite: "/assets/enemies/orchid-maw.png",
      motionSprite: "/assets/enemies/orchid-maw-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      specialSprite: "/assets/enemies/orchid-maw-special-v1.png",
      specialStateRows: { secondary: 0, release: 2 },
      reactionSprite: "/assets/enemies/orchid-maw-reactions-v1.png",
      reactionStateRows: { hit: 0, defeat: 2 },
      backdrop: "transparent",
      renderHeight: 238,
      anchorY: 0.6,
    },
    hp: 1_120,
    speed: 58,
    radius: 62,
    contactDamage: 21,
    score: 2_200,
    xp: 165,
    elite: true,
    telegraphSeconds: 0.6,
  }),
  strangler_ape: freezeEnemy("strangler_ape", {
    name: "THE STRANGLER APE",
    family: "rootfall_jungle",
    behavior: "strangler_ape",
    art: {
      sprite: "/assets/enemies/strangler-ape.png",
      motionSprite: "/assets/enemies/strangler-ape-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      specialSprite: "/assets/enemies/strangler-ape-special-v1.png",
      specialStateRows: { secondary: 0, release: 2 },
      reactionSprite: "/assets/enemies/strangler-ape-reactions-v1.png",
      reactionStateRows: { hit: 0, defeat: 2 },
      backdrop: "transparent",
      renderHeight: 244,
      anchorY: 0.62,
    },
    hp: 1_340,
    speed: 70,
    radius: 66,
    contactDamage: 23,
    score: 2_700,
    xp: 195,
    elite: true,
    telegraphSeconds: 0.68,
  }),
  rootfall_tyrant: freezeEnemy("rootfall_tyrant", {
    name: "KAPRIZARD — THE ROOT TYRANT",
    family: "rootfall_jungle",
    behavior: "rootfall_tyrant",
    identity: "kaprizard",
    headIdentity: KAPRIZARD_BOSS_IDENTITY.headIdentity,
    faceExposed: true,
    bodySignature: "black-sap-root-titan",
    attackSignature: "root-lanes-and-thorn-crown",
    locomotionSignature: "root-drag",
    art: {
      sprite: "/assets/enemies/rootfall-tyrant-kaprizard-v1.png",
      motionSprite: "/assets/enemies/rootfall-tyrant-motion-v1.png",
      motionStateRows: STANDARD_ENEMY_MOTION_STATE_ROWS,
      specialSprite: "/assets/enemies/rootfall-tyrant-special-v1.png",
      specialStateRows: { secondary: 0, phase: 2 },
      reactionSprite: "/assets/enemies/rootfall-tyrant-reactions-v1.png",
      reactionStateRows: { hit: 0, defeat: 2 },
      backdrop: "transparent",
      renderHeight: 340,
      anchorY: 0.61,
    },
    hp: 4_400,
    speed: 44,
    radius: 80,
    contactDamage: 27,
    score: 6_500,
    xp: 500,
    boss: true,
  }),
  ...ARENA_TOUR_ENEMIES,
});

const HOLLOW_TOUR_SECTORS = [
  {
    environment: "ash",
    names: [
      "ASH INTAKE", "SOOT CONVEYOR", "BURNT HOPPER", "CINDER DUCT", "ROASTING BAY",
      "CHAR PIT", "FILTER RUN", "SCORCHED LOCK", "KILN ANTECHAMBER",
    ],
    enemies: ["ash_hound", "ember_oracle", "ash_hound"],
    eliteRoomName: "KILN GATE",
    elite: "kiln_warden",
  },
  {
    environment: "ember",
    names: [
      "EMBER GALLERY", "RED CANISTER", "FLAME SCREEN", "HOT AIR SHAFT", "IGNITION HALL",
      "CINDER ARCHIVE", "BLAZING WALK", "FURNACE VEIN", "BOILER NEST",
    ],
    enemies: ["ember_oracle", "ash_hound", "smoke_revenant"],
    eliteRoomName: "WIDOW PRESSURE NEST",
    elite: "pressure_widow",
  },
  {
    environment: "brass",
    names: [
      "BRASS VAULT", "COPPER SPINE", "GEAR CHANCEL", "PISTON WALK", "GRINDER FEED",
      "VALVE MAZE", "METER CHAMBER", "MILL SHAFT", "CINDER SANCTUM",
    ],
    enemies: ["brass_colossus", "ash_hound", "ember_oracle", "brass_colossus"],
    eliteRoomName: "BISHOP'S FURNACE",
    elite: "cinder_bishop",
  },
  {
    environment: "smoke",
    names: [
      "SMOKE CHOIR", "BLACK FILTER", "EXHAUST AISLE", "TAR RESERVOIR", "GHOST DUCT",
      "CARBON HALL", "SOOT MIRROR", "VAPOR CRYPT", "GRINDER VESTIBULE",
    ],
    enemies: ["smoke_revenant", "ember_oracle", "ash_hound", "brass_colossus"],
    eliteRoomName: "GRINDER SANCTUM",
    elite: "grinder_saint",
  },
  {
    environment: "pressure",
    names: [
      "PRESSURE FLOOR", "BOILER DESCENT", "REDLINE PIPE", "STEAM LOCK", "ROASTER VEIN",
      "OVERHEAT WALK", "CORE CONDUIT", "FINAL GAUGE", "ROASTER ANTECHAMBER",
    ],
    enemies: ["ash_hound", "ember_oracle", "brass_colossus", "smoke_revenant"],
  },
];

const ABILITY_REWARD_ROOMS = new Set([1]);
const HOLLOW_SAFE_ROOM_BY_NUMBER = Object.freeze({
  15: Object.freeze({
    id: "cooling-reservoir-15",
    name: "COOLING RESERVOIR",
    roomType: "rest",
    artVariant: "cooling-reservoir",
    restorationPct: 0.3,
  }),
  25: Object.freeze({
    id: "brokers-meter-25",
    name: "BROKER'S METER",
    roomType: "event",
    artVariant: "brokers-meter",
  }),
  35: Object.freeze({
    id: "filter-chapel-35",
    name: "FILTER CHAPEL",
    roomType: "rest",
    artVariant: "filter-chapel",
    restorationPct: 0.3,
  }),
  45: Object.freeze({
    id: "redline-contract-45",
    name: "REDLINE CONTRACT",
    roomType: "event",
    artVariant: "redline-contract",
  }),
});

function hazard(x, y, radius, kind, roomNumber, damage) {
  const interval = kind === "smoke" ? 3.8 : kind === "ember" ? 3.35 : 3;
  return {
    x,
    y,
    radius,
    kind,
    interval,
    activeDuration: kind === "smoke" ? 1.35 : 1,
    phase: (roomNumber * 0.73) % interval,
    damage,
  };
}

function createBaseRoomLayout(environment, roomNumber) {
  const flipped = roomNumber % 2 === 0;
  const left = flipped ? 476 : 116;
  const right = flipped ? 116 : 476;
  const hazardLeft = flipped ? 510 : 198;
  const hazardRight = flipped ? 210 : 522;

  if (environment === "heart") {
    return { obstacles: [], hazards: [] };
  }
  if (environment === "ember") {
    return {
      obstacles: flipped
        ? [
          { x: 270, y: 492, width: 180, height: 48, kind: "wall" },
          { x: 270, y: 786, width: 180, height: 48, kind: "wall" },
        ]
        : [
          { x: 100, y: 610, width: 176, height: 44, kind: "wall" },
          { x: 444, y: 610, width: 176, height: 44, kind: "wall" },
        ],
      hazards: [
        hazard(hazardLeft, 414, 46, "ember", roomNumber, 9),
        hazard(hazardRight, 886, 46, "ember", roomNumber + 2, 9),
      ],
    };
  }
  if (environment === "brass") {
    return {
      obstacles: flipped
        ? [
          { x: 236, y: 500, width: 104, height: 76, kind: "pillar" },
          { x: 380, y: 748, width: 104, height: 76, kind: "pillar" },
        ]
        : [
          { x: 128, y: 472, width: 78, height: 82, kind: "pillar" },
          { x: 514, y: 472, width: 78, height: 82, kind: "pillar" },
          { x: 128, y: 782, width: 78, height: 82, kind: "pillar" },
          { x: 514, y: 782, width: 78, height: 82, kind: "pillar" },
        ],
      hazards: flipped
        ? [
          hazard(520, 420, 43, "pressure", roomNumber, 10),
          hazard(194, 914, 43, "pressure", roomNumber + 2, 10),
        ]
        : [hazard(360, 664, 50, "pressure", roomNumber, 10)],
    };
  }
  if (environment === "smoke") {
    return {
      obstacles: [
        { x: left, y: 500, width: flipped ? 54 : 132, height: flipped ? 156 : 48, kind: "pipe" },
        { x: right, y: 758, width: flipped ? 54 : 132, height: flipped ? 156 : 48, kind: "pipe" },
      ],
      hazards: [
        hazard(hazardLeft, 430, 56, "smoke", roomNumber, 10),
        hazard(hazardRight, 906, 56, "smoke", roomNumber + 2, 10),
      ],
    };
  }
  if (environment === "pressure") {
    return {
      obstacles: [
        { x: left, y: 454, width: flipped ? 150 : 72, height: flipped ? 54 : 184, kind: "pipe" },
        { x: right, y: 746, width: flipped ? 150 : 72, height: flipped ? 54 : 184, kind: "pipe" },
      ],
      hazards: [
        hazard(hazardLeft, 418, 48, "steam", roomNumber, 11),
        hazard(hazardRight, 906, 48, "steam", roomNumber + 2, 11),
      ],
    };
  }
  return {
    obstacles: [
      { x: left, y: 492, width: 120, height: 56, kind: "crate" },
      { x: right, y: 748, width: 120, height: 56, kind: "crate" },
    ],
    hazards: [
      hazard(hazardLeft, 418, 44, "steam", roomNumber, 8),
      hazard(hazardRight, 892, 46, "steam", roomNumber + 2, 8),
    ],
  };
}

function createRoomLayout(environment, roomNumber) {
  return personalizeRoomLayout(
    createBaseRoomLayout(environment, roomNumber),
    `${environment}-room-${roomNumber}`,
    roomNumber,
  );
}

function createStandardRoom(sector, sectorIndex, localIndex, usedSignatures) {
  const roomNumber = sectorIndex * 10 + localIndex + 1;
  const safeRoom = HOLLOW_SAFE_ROOM_BY_NUMBER[roomNumber];
  if (safeRoom) {
    return {
      ...safeRoom,
      environment: sector.environment,
      reward: safeRoom.roomType === "event" ? "event" : "advance",
      waves: [],
      obstacles: [],
      hazards: [],
      destructibles: [],
    };
  }

  const localRoomNumber = localIndex + 1;
  const waveCount = localRoomNumber === 5 || localRoomNumber === 9 ? 2 : 1;
  const waves = createUniqueEncounterWaves({
    pool: sector.enemies,
    roomNumber,
    sectorIndex,
    waveCount,
    usedSignatures,
  });
  const layout = createRoomLayout(sector.environment, roomNumber);
  return {
    id: sector.environment + "-" + String(roomNumber).padStart(2, "0"),
    name: sector.names[localIndex],
    environment: sector.environment,
    reward: ABILITY_REWARD_ROOMS.has(roomNumber) ? "ability" : "advance",
    waves,
    ...layout,
    destructibles: createRoomDestructibles(sector.environment, roomNumber, layout),
  };
}

function createEliteRoom(sector, sectorIndex) {
  const roomNumber = (sectorIndex + 1) * 10;
  return {
    id: sector.environment + "-elite-" + roomNumber,
    name: sector.eliteRoomName,
    environment: sector.environment,
    reward: "advance",
    elite: true,
    waves: [[sector.elite]],
    ...createRoomLayout(sector.environment, roomNumber + 1),
  };
}

function createHollowRoasteryRooms() {
  const rooms = [];
  const usedSignatures = new Set();
  HOLLOW_TOUR_SECTORS.forEach((sector, sectorIndex) => {
    sector.names.forEach((_, localIndex) => {
      rooms.push(createStandardRoom(sector, sectorIndex, localIndex, usedSignatures));
    });
    if (sector.elite) {
      const eliteRoom = createEliteRoom(sector, sectorIndex);
      usedSignatures.add(getEncounterSignature(eliteRoom.waves));
      rooms.push(eliteRoom);
    }
  });
  rooms.push({
    id: "roaster-heart-50",
    name: "ROASTER HEART",
    environment: "heart",
    reward: "finish",
    boss: true,
    waves: [["hollow_roaster"]],
    ...createRoomLayout("heart", 50),
  });
  return rooms;
}

const ROOTFALL_TOUR_SECTORS = Object.freeze([
  Object.freeze({
    environment: "canopy",
    names: Object.freeze([
      "ROOTWAKE LANDING", "VINE-CUT PASS", "RAINLEAF COURT", "CANOPY SCAR",
      "BROKEN IDOL WALK", "RED CHERRY GROVE", "MANTIS RUN", "HANGING ROOTS",
      "VERDANT GATE",
    ]),
    enemies: Object.freeze(["razor_mantis", "seed_spitter", "razor_mantis"]),
    eliteRoomName: "JAGUAR'S AMBUSH",
    elite: "briar_jaguar",
  }),
  Object.freeze({
    environment: "mire",
    names: Object.freeze([
      "DROWNED STEPS", "BLACKWATER BED", "LEECH GARDEN", "SUNKEN CAUSEWAY",
      "CLEARWATER HOLLOW", "FEN OF EYES", "MUD ALTAR", "CROAKING VAULT",
      "MIRE CROWN",
    ]),
    enemies: Object.freeze(["seed_spitter", "root_stalker", "razor_mantis"]),
    eliteRoomName: "BELLOWER'S POOL",
    elite: "mire_bellower",
  }),
  Object.freeze({
    environment: "mycelium",
    names: Object.freeze([
      "SPORE VESTIBULE", "LUMEN CAP WALK", "FUNGAL NAVE", "MYCELIAL VEINS",
      "SYMBIOTIC SHRINE", "PALE GILL HALL", "ROTLIGHT CROSSING", "DREAMSPORE VAULT",
      "BASILICA ROOT",
    ]),
    enemies: Object.freeze(["spore_moth", "seed_spitter", "root_stalker", "spore_moth"]),
    eliteRoomName: "THE ORCHID CHANCEL",
    elite: "orchid_maw",
  }),
  Object.freeze({
    environment: "briar",
    names: Object.freeze([
      "THORN PROCESSION", "BLOODVINE AISLE", "BARBED CLOISTER", "STRANGLER WALK",
      "MOONDEW SANCTUARY", "BRIAR LABYRINTH", "CROWN OF HOOKS", "PETAL OSSUARY",
      "APE'S VERGE",
    ]),
    enemies: Object.freeze(["root_stalker", "razor_mantis", "spore_moth", "seed_spitter"]),
    eliteRoomName: "THE STRANGLER COURT",
    elite: "strangler_ape",
  }),
  Object.freeze({
    environment: "rootdeep",
    names: Object.freeze([
      "ROOTFALL DESCENT", "BLACK SAP CHANNEL", "ANCIENT BARK HALL", "HOLLOW EARTH",
      "BLOODROOT BARGAIN", "COILED ABYSS", "NERVEWOOD CROSSING", "TYRANT'S APPROACH",
      "ROOT-THRONE ANTECHAMBER",
    ]),
    enemies: Object.freeze(["razor_mantis", "root_stalker", "spore_moth", "seed_spitter"]),
  }),
]);

const ROOTFALL_SAFE_ROOM_BY_NUMBER = Object.freeze({
  15: Object.freeze({
    id: "clearwater-hollow-15",
    name: "CLEARWATER HOLLOW",
    roomType: "rest",
    artVariant: "clearwater-hollow",
    restorationPct: 0.3,
  }),
  25: Object.freeze({
    id: "symbiotic-shrine-25",
    name: "SYMBIOTIC SHRINE",
    roomType: "event",
    artVariant: "symbiotic-shrine",
  }),
  35: Object.freeze({
    id: "moondew-sanctuary-35",
    name: "MOONDEW SANCTUARY",
    roomType: "rest",
    artVariant: "moondew-sanctuary",
    restorationPct: 0.3,
  }),
  45: Object.freeze({
    id: "bloodroot-bargain-45",
    name: "BLOODROOT BARGAIN",
    roomType: "event",
    artVariant: "bloodroot-bargain",
  }),
});

const ROOTFALL_DOUBLE_WAVE_ROOMS = new Set([4, 8, 13, 18, 23, 28, 33, 38, 43, 47]);

const ROOTFALL_HAZARD_PROFILES = Object.freeze({
  canopy: Object.freeze({ kind: "thorn", interval: 3.4, activeDuration: 0.9, damage: 10 }),
  mire: Object.freeze({ kind: "venom", interval: 3.8, activeDuration: 1.35, damage: 10 }),
  mycelium: Object.freeze({ kind: "spore", interval: 4.1, activeDuration: 1.45, damage: 11 }),
  briar: Object.freeze({ kind: "thorn", interval: 3.1, activeDuration: 0.82, damage: 12 }),
  rootdeep: Object.freeze({ kind: "root", interval: 2.9, activeDuration: 0.9, damage: 13 }),
});

function rootfallHazard(environment, x, y, radius, roomNumber, phaseOffset = 0) {
  const profile = ROOTFALL_HAZARD_PROFILES[environment];
  return {
    x,
    y,
    radius,
    kind: profile.kind,
    interval: profile.interval,
    activeDuration: profile.activeDuration,
    phase: ((roomNumber + phaseOffset) * 0.67) % profile.interval,
    damage: profile.damage,
  };
}

function createBaseRootfallLayout(environment, roomNumber) {
  if (environment === "rootheart") {
    return { obstacles: [], hazards: [] };
  }

  const mode = roomNumber % 3;
  if (environment === "canopy") {
    const obstacleSets = [
      [
        { x: 116, y: 470, width: 88, height: 126, kind: "root-pillar" },
        { x: 516, y: 724, width: 88, height: 126, kind: "root-pillar" },
      ],
      [
        { x: 130, y: 510, width: 170, height: 46, kind: "fallen-root" },
        { x: 420, y: 748, width: 170, height: 46, kind: "fallen-root" },
      ],
      [
        { x: 92, y: 638, width: 82, height: 106, kind: "root-pillar" },
        { x: 546, y: 638, width: 82, height: 106, kind: "root-pillar" },
      ],
    ];
    return {
      obstacles: obstacleSets[mode],
      hazards: [
        rootfallHazard(environment, mode === 1 ? 500 : 220, 430, 43, roomNumber),
        rootfallHazard(environment, mode === 1 ? 220 : 500, 900, 43, roomNumber, 2),
      ],
    };
  }
  if (environment === "mire") {
    const obstacleSets = [
      [
        { x: 80, y: 560, width: 178, height: 54, kind: "fallen-root" },
        { x: 462, y: 730, width: 178, height: 54, kind: "fallen-root" },
      ],
      [
        { x: 126, y: 456, width: 76, height: 76, kind: "root-pillar" },
        { x: 518, y: 456, width: 76, height: 76, kind: "root-pillar" },
        { x: 126, y: 826, width: 76, height: 76, kind: "root-pillar" },
        { x: 518, y: 826, width: 76, height: 76, kind: "root-pillar" },
      ],
      [
        { x: 210, y: 486, width: 76, height: 168, kind: "fallen-root" },
        { x: 434, y: 706, width: 76, height: 168, kind: "fallen-root" },
      ],
    ];
    return {
      obstacles: obstacleSets[mode],
      hazards: [
        rootfallHazard(environment, 196 + mode * 36, 430, 55, roomNumber),
        rootfallHazard(environment, 520 - mode * 34, 904, 55, roomNumber, 3),
      ],
    };
  }
  if (environment === "mycelium") {
    const obstacleSets = [
      [
        { x: 112, y: 474, width: 74, height: 108, kind: "fungal-pillar" },
        { x: 534, y: 474, width: 74, height: 108, kind: "fungal-pillar" },
        { x: 112, y: 792, width: 74, height: 108, kind: "fungal-pillar" },
        { x: 534, y: 792, width: 74, height: 108, kind: "fungal-pillar" },
      ],
      [
        { x: 102, y: 640, width: 118, height: 56, kind: "fungal-shelf" },
        { x: 500, y: 640, width: 118, height: 56, kind: "fungal-shelf" },
      ],
      [
        { x: 170, y: 500, width: 150, height: 46, kind: "fungal-shelf" },
        { x: 400, y: 794, width: 150, height: 46, kind: "fungal-shelf" },
      ],
    ];
    return {
      obstacles: obstacleSets[mode],
      hazards: [
        rootfallHazard(environment, mode === 2 ? 500 : 220, 420, 58, roomNumber),
        rootfallHazard(environment, mode === 2 ? 220 : 500, 914, 58, roomNumber, 2),
      ],
    };
  }
  if (environment === "briar") {
    const obstacleSets = [
      [
        { x: 150, y: 520, width: 72, height: 190, kind: "thorn-hedge" },
        { x: 498, y: 680, width: 72, height: 190, kind: "thorn-hedge" },
      ],
      [
        { x: 120, y: 486, width: 190, height: 48, kind: "thorn-hedge" },
        { x: 410, y: 798, width: 190, height: 48, kind: "thorn-hedge" },
      ],
      [
        { x: 92, y: 450, width: 76, height: 86, kind: "thorn-hook" },
        { x: 552, y: 450, width: 76, height: 86, kind: "thorn-hook" },
        { x: 92, y: 838, width: 76, height: 86, kind: "thorn-hook" },
        { x: 552, y: 838, width: 76, height: 86, kind: "thorn-hook" },
      ],
    ];
    return {
      obstacles: obstacleSets[mode],
      hazards: [
        rootfallHazard(environment, 206 + mode * 22, 418, 46, roomNumber),
        rootfallHazard(environment, 514 - mode * 22, 910, 46, roomNumber, 2),
      ],
    };
  }

  const obstacleSets = [
    [
      { x: 116, y: 486, width: 104, height: 184, kind: "root-rib" },
      { x: 500, y: 706, width: 104, height: 184, kind: "root-rib" },
    ],
    [
      { x: 92, y: 520, width: 210, height: 48, kind: "root-rib" },
      { x: 418, y: 760, width: 210, height: 48, kind: "root-rib" },
    ],
    [
      { x: 78, y: 620, width: 108, height: 116, kind: "root-coil" },
      { x: 534, y: 620, width: 108, height: 116, kind: "root-coil" },
    ],
  ];
  return {
    obstacles: obstacleSets[mode],
    hazards: [
      rootfallHazard(environment, mode === 0 ? 500 : 220, 420, 50, roomNumber),
      rootfallHazard(environment, mode === 0 ? 220 : 500, 916, 50, roomNumber, 2),
    ],
  };
}

function createRootfallLayout(environment, roomNumber) {
  return personalizeRoomLayout(
    createBaseRootfallLayout(environment, roomNumber),
    `${environment}-room-${roomNumber}`,
    roomNumber,
  );
}

function createRootfallStandardRoom(sector, sectorIndex, localIndex, usedSignatures) {
  const roomNumber = sectorIndex * 10 + localIndex + 1;
  const safeRoom = ROOTFALL_SAFE_ROOM_BY_NUMBER[roomNumber];
  if (safeRoom) {
    return {
      ...safeRoom,
      environment: sector.environment,
      reward: safeRoom.roomType === "event" ? "event" : "advance",
      waves: [],
      obstacles: [],
      hazards: [],
      destructibles: [],
    };
  }

  const waveCount = roomNumber === 49
    ? 3
    : ROOTFALL_DOUBLE_WAVE_ROOMS.has(roomNumber) ? 2 : 1;
  const waves = createUniqueEncounterWaves({
    pool: sector.enemies,
    roomNumber,
    sectorIndex,
    waveCount,
    usedSignatures,
  });
  const layout = createRootfallLayout(sector.environment, roomNumber);
  return {
    id: `rootfall-${sector.environment}-${String(roomNumber).padStart(2, "0")}`,
    name: sector.names[localIndex],
    environment: sector.environment,
    reward: roomNumber === 1 ? "ability" : "advance",
    waves,
    ...layout,
    destructibles: createRoomDestructibles(sector.environment, roomNumber, layout),
  };
}

function createRootfallEliteRoom(sector, sectorIndex) {
  const roomNumber = (sectorIndex + 1) * 10;
  return {
    id: `rootfall-${sector.environment}-elite-${roomNumber}`,
    name: sector.eliteRoomName,
    environment: sector.environment,
    reward: "advance",
    elite: true,
    waves: [[sector.elite]],
    ...createRootfallLayout(sector.environment, roomNumber),
    destructibles: [],
  };
}

function createRootfallJungleRooms() {
  const rooms = [];
  const usedSignatures = new Set();
  ROOTFALL_TOUR_SECTORS.forEach((sector, sectorIndex) => {
    sector.names.forEach((_, localIndex) => {
      rooms.push(createRootfallStandardRoom(sector, sectorIndex, localIndex, usedSignatures));
    });
    if (sector.elite) {
      const eliteRoom = createRootfallEliteRoom(sector, sectorIndex);
      usedSignatures.add(getEncounterSignature(eliteRoom.waves));
      rooms.push(eliteRoom);
    }
  });
  rooms.push({
    id: "root-throne-50",
    name: "ROOT THRONE",
    environment: "rootheart",
    reward: "finish",
    boss: true,
    waves: [["rootfall_tyrant"]],
    ...createRootfallLayout("rootheart", 50),
    destructibles: [],
  });
  return rooms;
}

export const TOURS = Object.freeze([
  freezeTour({
    id: "rootfall-jungle",
    code: "TOUR 01",
    name: "ROOTFALL JUNGLE",
    district: "THE DROWNED WILD",
    theme: "organic-rootfall-jungle",
    family: "rootfall_jungle",
    unlocked: true,
    rooms: createRootfallJungleRooms(),
  }),
  ...ARENA_TOURS,
]);

export { DEFAULT_TOUR_ID };

export function getEnemyDefinition(enemyId) {
  return ENEMY_CATALOG[enemyId] ?? null;
}

export function getTourDefinition(tourId = DEFAULT_TOUR_ID) {
  return TOURS.find((tour) => tour.id === tourId) ?? null;
}

export function getRoomDefinition(tourId, roomNumber) {
  const tour = getTourDefinition(tourId);
  if (!tour || !Number.isInteger(roomNumber) || roomNumber < 1) {
    return null;
  }
  return tour.rooms[roomNumber - 1] ?? null;
}

export function validateContentCatalog(tours = TOURS, enemies = ENEMY_CATALOG) {
  const errors = [];
  const tourIds = new Set();
  const tourCodes = new Set();
  const families = new Set();
  const themes = new Set();
  const bossBodies = new Set();
  const bossAttacks = new Set();
  const bossLocomotion = new Set();
  const environmentOwners = new Map();
  const supportedBackdrops = new Set(["transparent", "light-checker", "magenta"]);
  const supportedRewards = new Set(["advance", "ability", "event", "finish"]);
  const supportedRoomTypes = new Set(["combat", "rest", "event"]);
  const requiredMotionStates = ["idle", "move", "attack"];
  const directionalAtlasDefinitions = [
    ["reactionSprite", "reactionStateRows", ["hit", "defeat"]],
  ];

  for (const enemy of Object.values(enemies)) {
    if (!enemy.name || !enemy.art?.sprite) {
      errors.push("Enemy " + enemy.id + " must define a display name and sprite");
    }
    if (!supportedBackdrops.has(enemy.art?.backdrop)) {
      errors.push("Enemy " + enemy.id + " uses an unsupported sprite backdrop");
    }
    if (!Number.isFinite(enemy.art?.renderHeight) || enemy.art.renderHeight <= 0) {
      errors.push("Enemy " + enemy.id + " must define a positive render height");
    }
    if (enemy.art?.motionSprite) {
      if (!/^\/assets\/enemies\/[a-z0-9-]+\.png$/.test(enemy.art.motionSprite)) {
        errors.push("Enemy " + enemy.id + " uses an invalid motion sprite path");
      }
      const stateRows = enemy.art.motionStateRows;
      if (!stateRows || requiredMotionStates.some((state) => !Number.isInteger(stateRows[state])
        || stateRows[state] < 0
        || stateRows[state] % 2 !== 0)) {
        errors.push("Enemy " + enemy.id + " must define even motion state rows");
      }
      if (enemy.art.motionAnimation) {
        for (const error of validateDirectionalAnimationAtlas(
          enemy.art.motionAnimation,
          {
            directions: ENEMY_FACING_DIRECTIONS,
            states: requiredMotionStates,
          },
        )) {
          errors.push("Enemy " + enemy.id + " motion " + error);
        }
      }
    } else if (enemy.art?.motionAnimation) {
      for (const error of validateDirectionalAnimationAtlas(
        enemy.art.motionAnimation,
        {
          directions: ENEMY_FACING_DIRECTIONS,
          states: requiredMotionStates,
        },
      )) {
        errors.push("Enemy " + enemy.id + " motion " + error);
      }
    } else if (enemy.art?.motionStateRows) {
      errors.push("Enemy " + enemy.id + " defines motion rows without a motion sprite");
    }
    const specialSprite = enemy.art?.specialSprite;
    const specialStateRows = enemy.art?.specialStateRows;
    const requiredSpecialStates = enemy.boss
      ? ["secondary", "phase"]
      : ["secondary", "release"];
    if (specialSprite) {
      if (!/^\/assets\/enemies\/[a-z0-9-]+\.png$/.test(specialSprite)) {
        errors.push("Enemy " + enemy.id + " uses an invalid specialSprite path");
      }
      if (!specialStateRows || requiredSpecialStates.some((state) => (
        !Number.isInteger(specialStateRows[state])
        || specialStateRows[state] < 0
        || specialStateRows[state] % 2 !== 0
      ))) {
        errors.push("Enemy " + enemy.id + " must define even specialStateRows");
      }
      if (enemy.art.specialAnimation) {
        for (const error of validateDirectionalAnimationAtlas(
          enemy.art.specialAnimation,
          {
            directions: ENEMY_FACING_DIRECTIONS,
            states: requiredSpecialStates,
          },
        )) {
          errors.push("Enemy " + enemy.id + " special " + error);
        }
      }
    } else if (enemy.art?.specialAnimation) {
      for (const error of validateDirectionalAnimationAtlas(
        enemy.art.specialAnimation,
        {
          directions: ENEMY_FACING_DIRECTIONS,
          states: requiredSpecialStates,
        },
      )) {
        errors.push("Enemy " + enemy.id + " special " + error);
      }
    } else if (specialStateRows) {
      errors.push("Enemy " + enemy.id + " defines specialStateRows without specialSprite");
    }
    for (const [spriteKey, rowKey, requiredStates] of directionalAtlasDefinitions) {
      const spritePath = enemy.art?.[spriteKey];
      const stateRows = enemy.art?.[rowKey];
      if (spritePath) {
        if (!/^\/assets\/enemies\/[a-z0-9-]+\.png$/.test(spritePath)) {
          errors.push("Enemy " + enemy.id + " uses an invalid " + spriteKey + " path");
        }
        if (!stateRows || requiredStates.some((state) => !Number.isInteger(stateRows[state])
          || stateRows[state] < 0
          || stateRows[state] % 2 !== 0)) {
          errors.push("Enemy " + enemy.id + " must define even " + rowKey);
        }
        const animationKey = spriteKey.replace("Sprite", "Animation");
        if (enemy.art?.[animationKey]) {
          for (const error of validateDirectionalAnimationAtlas(
            enemy.art[animationKey],
            {
              directions: ENEMY_FACING_DIRECTIONS,
              states: requiredStates,
            },
          )) {
            errors.push("Enemy " + enemy.id + " " + animationKey + " " + error);
          }
        }
      } else if (enemy.art?.[spriteKey.replace("Sprite", "Animation")]) {
        const animationKey = spriteKey.replace("Sprite", "Animation");
        for (const error of validateDirectionalAnimationAtlas(
          enemy.art[animationKey],
          {
            directions: ENEMY_FACING_DIRECTIONS,
            states: requiredStates,
          },
        )) {
          errors.push("Enemy " + enemy.id + " " + animationKey + " " + error);
        }
      } else if (stateRows) {
        errors.push("Enemy " + enemy.id + " defines " + rowKey + " without " + spriteKey);
      }
    }
    if (enemy.boss && (!enemy.art?.specialSprite || !enemy.art?.reactionSprite)) {
      errors.push("Boss " + enemy.id + " must define special and reaction atlases");
    }
    if (enemy.boss && enemy.identity !== "kaprizard") {
      errors.push("Boss " + enemy.id + " must preserve the Kaprizard identity");
    }
    if (enemy.boss && (
      enemy.headIdentity !== KAPRIZARD_BOSS_IDENTITY.headIdentity
      || enemy.faceExposed !== true
    )) {
      errors.push("Boss " + enemy.id + " must keep the exposed Kaprizard head");
    }
    for (const [signature, owners, label] of [
      [enemy.bodySignature, bossBodies, "body"],
      [enemy.attackSignature, bossAttacks, "attack"],
      [enemy.locomotionSignature, bossLocomotion, "locomotion"],
    ]) {
      if (!enemy.boss) break;
      if (!signature || owners.has(signature)) errors.push("Boss " + enemy.id + " must use a unique " + label + " signature");
      else owners.add(signature);
    }
    if (!Number.isInteger(enemy.xp) || enemy.xp <= 0) {
      errors.push("Enemy " + enemy.id + " must define positive integer run XP");
    }
    if (enemy.elite && enemy.boss) {
      errors.push("Enemy " + enemy.id + " cannot be both elite and boss");
    }
  }

  for (const tour of tours) {
    if (!tour.id || tourIds.has(tour.id)) {
      errors.push("Duplicate or missing tour id: " + (tour.id || "<empty>"));
    }
    tourIds.add(tour.id);

    if (!tour.code || tourCodes.has(tour.code)) {
      errors.push("Tour " + tour.id + " must use a unique display code");
    }
    tourCodes.add(tour.code);

    if (!tour.family || families.has(tour.family)) {
      errors.push("Tour " + tour.id + " must use a unique enemy family");
    }
    families.add(tour.family);

    if (!tour.theme || themes.has(tour.theme)) {
      errors.push("Tour " + tour.id + " must use a unique visual theme");
    }
    themes.add(tour.theme);

    if (!Array.isArray(tour.rooms) || tour.rooms.length < 2) {
      errors.push("Tour " + tour.id + " must contain at least two rooms");
      continue;
    }

    const roomIds = new Set();
    tour.rooms.forEach((room, roomIndex) => {
      if (!room.id || roomIds.has(room.id)) {
        errors.push("Tour " + tour.id + " has a duplicate or missing room id");
      }
      roomIds.add(room.id);

      const safeRoom = room.roomType === "rest" || room.roomType === "event";
      if (!supportedRoomTypes.has(room.roomType)) {
        errors.push("Room " + tour.id + "/" + room.id + " has an unsupported room type");
      }
      if (!Array.isArray(room.waves)) {
        errors.push("Room " + tour.id + "/" + room.id + " has invalid waves");
      } else if (safeRoom && room.waves.length > 0) {
        errors.push("Safe room " + tour.id + "/" + room.id + " cannot contain waves");
      } else if (!safeRoom && room.waves.length === 0) {
        errors.push("Room " + tour.id + "/" + room.id + " has no waves");
      } else if (!safeRoom
        && room.waves.some((wave) => !Array.isArray(wave) || wave.length === 0)) {
        errors.push("Room " + tour.id + "/" + room.id + " contains an empty wave");
      }
      if (!room.environment) {
        errors.push("Room " + tour.id + "/" + room.id + " has no environment");
      } else {
        const owner = environmentOwners.get(room.environment);
        if (owner && owner !== tour.id) {
          errors.push("Environment " + room.environment + " cannot be reused across tours");
        }
        environmentOwners.set(room.environment, tour.id);
      }
      if (!supportedRewards.has(room.reward)) {
        errors.push("Room " + tour.id + "/" + room.id + " has an unsupported reward");
      }
      const obstacles = Array.isArray(room.obstacles) ? room.obstacles : [];
      const hazards = Array.isArray(room.hazards) ? room.hazards : [];
      const destructibles = Array.isArray(room.destructibles) ? room.destructibles : [];
      if (!Array.isArray(room.obstacles) || obstacles.some((obstacle) => !Number.isFinite(obstacle.x)
        || !Number.isFinite(obstacle.y)
        || !Number.isFinite(obstacle.width)
        || !Number.isFinite(obstacle.height)
        || obstacle.width <= 0
        || obstacle.height <= 0)) {
        errors.push("Room " + tour.id + "/" + room.id + " has an invalid obstacle");
      }
      if (!Array.isArray(room.hazards) || hazards.some((item) => !Number.isFinite(item.x)
        || !Number.isFinite(item.y)
        || !Number.isFinite(item.radius)
        || item.radius <= 0
        || !Number.isFinite(item.interval)
        || item.interval <= 0
        || !Number.isFinite(item.activeDuration)
        || item.activeDuration <= 0
        || item.activeDuration > item.interval)) {
        errors.push("Room " + tour.id + "/" + room.id + " has an invalid hazard");
      }
      if (!Array.isArray(room.destructibles) || destructibles.some((item) => !getDestructibleDefinition(item.type)
        || !Number.isFinite(item.x)
        || !Number.isFinite(item.y)
        || !Number.isFinite(item.width)
        || !Number.isFinite(item.height)
        || !Number.isFinite(item.maxHp)
        || item.width <= 0
        || item.height <= 0
        || item.maxHp <= 0)) {
        errors.push("Room " + tour.id + "/" + room.id + " has an invalid destructible");
      }
      if (safeRoom && (room.enemies.length > 0
        || obstacles.length > 0
        || hazards.length > 0
        || destructibles.length > 0
        || room.elite
        || room.boss)) {
        errors.push("Safe room " + tour.id + "/" + room.id + " must remain hazard-free");
      }
      if (room.roomType === "rest"
        && (!Number.isFinite(room.restorationPct)
          || room.restorationPct <= 0
          || room.restorationPct > 0.5)) {
        errors.push("Rest room " + tour.id + "/" + room.id + " has invalid restoration");
      }
      if (room.roomType === "event" && room.reward !== "event") {
        errors.push("Event room " + tour.id + "/" + room.id + " must grant an event reward");
      }

      const isFinalRoom = roomIndex === tour.rooms.length - 1;
      const bossEnemies = room.enemies.filter((enemyId) => enemies[enemyId]?.boss);
      const eliteEnemies = room.enemies.filter((enemyId) => enemies[enemyId]?.elite);
      if (isFinalRoom && (!room.boss
        || room.waves.length !== 1
        || room.enemies.length !== 1
        || bossEnemies.length !== 1)) {
        errors.push("Final room " + tour.id + "/" + room.id + " must contain exactly one boss");
      }
      if (!isFinalRoom && (room.boss || bossEnemies.length > 0)) {
        errors.push("Boss content is only allowed in the final room of " + tour.id);
      }
      if (room.elite
        && (room.waves.length !== 1 || room.enemies.length !== 1 || eliteEnemies.length !== 1)) {
        errors.push("Elite room " + tour.id + "/" + room.id + " must contain exactly one elite");
      }
      if (!room.elite && eliteEnemies.length > 0) {
        errors.push("Elite enemies require an elite room in " + tour.id + "/" + room.id);
      }

      for (const enemyId of room.enemies) {
        const enemy = enemies[enemyId];
        if (!enemy) {
          errors.push("Room " + tour.id + "/" + room.id + " references unknown enemy " + enemyId);
        } else if (enemy.family !== tour.family) {
          errors.push("Enemy " + enemyId + " does not belong to tour family " + tour.family);
        }
      }
    });
  }

  return Object.freeze(errors);
}
