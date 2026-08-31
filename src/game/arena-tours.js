import {
  createUniqueEncounterWaves,
  getEncounterSignature,
} from "./encounter-design.js";
import { createRoomDestructibles } from "./destructibles.js";
import { personalizeRoomLayout } from "./room-art.js";
const KAPRIZARD_HEAD_IDENTITY = "kaprizard-head-v1";

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

function freezeEnemy(id, definition) {
  return Object.freeze({
    id,
    elite: false,
    boss: false,
    ...definition,
    art: Object.freeze({ backdrop: "transparent", ...definition.art }),
  });
}

function hazard(kind, x, y, radius, roomNumber, profile, phaseOffset = 0) {
  return {
    x,
    y,
    radius,
    kind,
    interval: profile.interval,
    activeDuration: profile.activeDuration,
    phase: ((roomNumber + phaseOffset) * 0.67) % profile.interval,
    damage: profile.damage,
  };
}

function createOrganicLayout(environment, roomNumber, hazardProfile) {
  if (environment.endsWith("heart") && roomNumber >= 50) {
    return { obstacles: [], hazards: [] };
  }
  const mode = roomNumber % 3;
  const nudge = (roomNumber % 7) * 3;
  const left = (mode === 1 ? 476 : 116) + nudge;
  const right = (mode === 1 ? 116 : 476) + nudge;
  const hazardLeft = (mode === 1 ? 510 : 198) + nudge;
  const hazardRight = (mode === 1 ? 210 : 522) + nudge;
  const obstacleSets = [
    [
      { x: 116 + nudge, y: 470 + nudge, width: 88, height: 126, kind: "root-pillar" },
      { x: 516 + nudge, y: 724 - nudge, width: 88, height: 126, kind: "root-pillar" },
    ],
    [
      { x: 130 + nudge, y: 510 + nudge, width: 170, height: 46, kind: "fallen-root" },
      { x: 420 - nudge, y: 748 - nudge, width: 170, height: 46, kind: "fallen-root" },
    ],
    [
      { x: 92 + nudge, y: 638 + nudge, width: 82, height: 106, kind: "root-pillar" },
      { x: 546 - nudge, y: 638 - nudge, width: 82, height: 106, kind: "root-pillar" },
    ],
  ];
  return {
    obstacles: obstacleSets[mode],
    hazards: [
      hazard(hazardProfile.kind, hazardLeft, 430 + nudge, 43, roomNumber, hazardProfile),
      hazard(hazardProfile.kind, hazardRight, 900 - nudge, 43, roomNumber, hazardProfile, 2),
    ],
  };
}

function createIndustrialLayout(environment, roomNumber, hazardProfile) {
  if (environment.endsWith("heart") && roomNumber >= 50) {
    return { obstacles: [], hazards: [] };
  }
  const flipped = roomNumber % 2 === 0;
  const nudge = (roomNumber % 7) * 3;
  const left = (flipped ? 476 : 116) + nudge;
  const right = (flipped ? 116 : 476) + nudge;
  const hazardLeft = (flipped ? 510 : 198) + nudge;
  const hazardRight = (flipped ? 210 : 522) + nudge;
  return {
    obstacles: [
      { x: left, y: 492 + nudge, width: 120, height: 56, kind: "crate" },
      { x: right, y: 748 - nudge, width: 120, height: 56, kind: "crate" },
    ],
    hazards: [
      hazard(hazardProfile.kind, hazardLeft, 418 + nudge, 44, roomNumber, hazardProfile),
      hazard(hazardProfile.kind, hazardRight, 892 - nudge, 46, roomNumber, hazardProfile, 2),
    ],
  };
}

function createTourLayout(environment, roomNumber, hazardProfile, style = "organic") {
  const base = style === "industrial"
    ? createIndustrialLayout(environment, roomNumber, hazardProfile)
    : createOrganicLayout(environment, roomNumber, hazardProfile);
  return personalizeRoomLayout(
    base,
    `${environment}-room-${roomNumber}`,
    roomNumber,
  );
}

function createStandardRoom({
  tourPrefix,
  sector,
  sectorIndex,
  localIndex,
  usedSignatures,
  safeRoomByNumber,
  doubleWaveRooms,
  hazardProfile,
  layoutStyle,
}) {
  const roomNumber = sectorIndex * 10 + localIndex + 1;
  const safeRoom = safeRoomByNumber[roomNumber];
  if (safeRoom) {
    return freezeRoom({
      ...safeRoom,
      environment: sector.environment,
      reward: safeRoom.roomType === "event" ? "event" : "advance",
      waves: [],
      obstacles: [],
      hazards: [],
      destructibles: [],
    });
  }

  const waveCount = roomNumber === 49
    ? 3
    : doubleWaveRooms.has(roomNumber) ? 2 : 1;
  const waves = createUniqueEncounterWaves({
    pool: sector.enemies,
    roomNumber,
    sectorIndex,
    waveCount,
    usedSignatures,
  });
  const layout = createTourLayout(sector.environment, roomNumber, hazardProfile, layoutStyle);
  return freezeRoom({
    id: `${tourPrefix}-${sector.environment}-${String(roomNumber).padStart(2, "0")}`,
    name: sector.names[localIndex],
    environment: sector.environment,
    reward: roomNumber === 1 ? "ability" : "advance",
    waves,
    ...layout,
    destructibles: createRoomDestructibles(sector.environment, roomNumber, layout),
  });
}

function createEliteRoom({
  tourPrefix,
  sector,
  sectorIndex,
  hazardProfile,
  layoutStyle,
}) {
  const roomNumber = (sectorIndex + 1) * 10;
  const layout = createTourLayout(sector.environment, roomNumber, hazardProfile, layoutStyle);
  return freezeRoom({
    id: `${tourPrefix}-${sector.environment}-elite-${roomNumber}`,
    name: sector.eliteRoomName,
    environment: sector.environment,
    reward: "advance",
    elite: true,
    waves: [[sector.elite]],
    ...layout,
    destructibles: [],
  });
}

function createTourRooms({
  tourPrefix,
  sectors,
  safeRoomByNumber,
  doubleWaveRooms,
  hazardProfiles,
  layoutStyle,
  bossRoom,
}) {
  const rooms = [];
  const usedSignatures = new Set();
  sectors.forEach((sector, sectorIndex) => {
    const hazardProfile = hazardProfiles[sector.environment];
    sector.names.forEach((_, localIndex) => {
      rooms.push(createStandardRoom({
        tourPrefix,
        sector,
        sectorIndex,
        localIndex,
        usedSignatures,
        safeRoomByNumber,
        doubleWaveRooms,
        hazardProfile,
        layoutStyle,
      }));
    });
    if (sector.elite) {
      const eliteRoom = createEliteRoom({
        tourPrefix,
        sector,
        sectorIndex,
        hazardProfile,
        layoutStyle,
      });
      usedSignatures.add(getEncounterSignature(eliteRoom.waves));
      rooms.push(eliteRoom);
    }
  });
  rooms.push(freezeRoom(bossRoom));
  return rooms;
}

const SHARED_DOUBLE_WAVE_ROOMS = new Set([4, 8, 13, 18, 23, 28, 33, 38, 43, 47]);

function createSafeRooms(prefix, labels) {
  return Object.freeze({
    15: Object.freeze({
      id: `${prefix}-rest-15`,
      name: labels.rest15,
      roomType: "rest",
      artVariant: `${prefix}-rest-15`,
      restorationPct: 0.3,
    }),
    25: Object.freeze({
      id: `${prefix}-event-25`,
      name: labels.event25,
      roomType: "event",
      artVariant: `${prefix}-event-25`,
    }),
    35: Object.freeze({
      id: `${prefix}-rest-35`,
      name: labels.rest35,
      roomType: "rest",
      artVariant: `${prefix}-rest-35`,
      restorationPct: 0.35,
    }),
    45: Object.freeze({
      id: `${prefix}-event-45`,
      name: labels.event45,
      roomType: "event",
      artVariant: `${prefix}-event-45`,
    }),
  });
}

export const ARENA_TOUR_ENEMIES = Object.freeze({
  forge_spider: freezeEnemy("forge_spider", {
    name: "FORGE SPIDER",
    family: "forge_depths",
    behavior: "forge_spider",
    art: { sprite: "/assets/enemies/forge-spider.png", renderHeight: 118, anchorY: 0.58 },
    hp: 58, speed: 68, radius: 27, contactDamage: 8, score: 140, xp: 12,
  }),
  slag_hound: freezeEnemy("slag_hound", {
    name: "SLAG HOUND",
    family: "forge_depths",
    behavior: "slag_hound",
    art: { sprite: "/assets/enemies/slag-hound.png", renderHeight: 108, anchorY: 0.58 },
    hp: 48, speed: 104, radius: 25, contactDamage: 10, score: 105, xp: 9,
  }),
  furnace_wisp: freezeEnemy("furnace_wisp", {
    name: "FURNACE WISP",
    family: "forge_depths",
    behavior: "furnace_wisp",
    art: { sprite: "/assets/enemies/furnace-wisp.png", renderHeight: 112, anchorY: 0.58 },
    hp: 64, speed: 88, radius: 24, contactDamage: 9, score: 130, xp: 11,
  }),
  forge_sentinel: freezeEnemy("forge_sentinel", {
    name: "FORGE SENTINEL",
    family: "forge_depths",
    behavior: "forge_sentinel",
    art: { sprite: "/assets/enemies/forge-sentinel.png", renderHeight: 248, anchorY: 0.61 },
    hp: 980, speed: 58, radius: 58, contactDamage: 18, score: 2_100, xp: 150, elite: true,
    telegraphSeconds: 0.58,
  }),
  boiler_tyrant: freezeEnemy("boiler_tyrant", {
    name: "BOILER TYRANT",
    family: "forge_depths",
    behavior: "boiler_tyrant",
    art: { sprite: "/assets/enemies/boiler-tyrant.png", renderHeight: 252, anchorY: 0.61 },
    hp: 1_020, speed: 62, radius: 60, contactDamage: 19, score: 2_200, xp: 155, elite: true,
    telegraphSeconds: 0.62,
  }),
  slag_colossus: freezeEnemy("slag_colossus", {
    name: "SLAG COLOSSUS",
    family: "forge_depths",
    behavior: "slag_colossus",
    art: { sprite: "/assets/enemies/slag-colossus.png", renderHeight: 256, anchorY: 0.61 },
    hp: 1_080, speed: 54, radius: 62, contactDamage: 20, score: 2_300, xp: 160, elite: true,
    telegraphSeconds: 0.66,
  }),
  furnace_overlord: freezeEnemy("furnace_overlord", {
    name: "FURNACE OVERLORD",
    family: "forge_depths",
    behavior: "furnace_overlord",
    art: { sprite: "/assets/enemies/furnace-overlord.png", renderHeight: 264, anchorY: 0.61 },
    hp: 1_120, speed: 56, radius: 64, contactDamage: 21, score: 2_400, xp: 165, elite: true,
    telegraphSeconds: 0.68,
  }),
  forge_core_tyrant: freezeEnemy("forge_core_tyrant", {
    name: "KAPRIZARD — FORGE CORE",
    family: "forge_depths",
    behavior: "forge_core_tyrant",
    identity: "kaprizard",
    headIdentity: KAPRIZARD_HEAD_IDENTITY,
    faceExposed: true,
    bodySignature: "forge-core-magma-titan",
    attackSignature: "lava-lanes-and-gear-crown",
    locomotionSignature: "furnace-stomp",
    art: {
      sprite: "/assets/enemies/forge-core-tyrant.png",
      specialSprite: "/assets/enemies/hollow-roaster-special-v1.png",
      specialStateRows: { secondary: 0, phase: 2 },
      reactionSprite: "/assets/enemies/hollow-roaster-reactions-v1.png",
      reactionStateRows: { hit: 0, defeat: 2 },
      renderHeight: 320,
      anchorY: 0.6,
    },
    hp: 4_200, speed: 44, radius: 78, contactDamage: 26, score: 6_200, xp: 480, boss: true,
  }),

  crystal_golem: freezeEnemy("crystal_golem", {
    name: "CRYSTAL GOLEM",
    family: "crystal_caverns",
    behavior: "crystal_golem",
    art: { sprite: "/assets/enemies/crystal-golem.png", renderHeight: 128, anchorY: 0.58 },
    hp: 88, speed: 54, radius: 30, contactDamage: 14, score: 180, xp: 14,
  }),
  crystal_shardling: freezeEnemy("crystal_shardling", {
    name: "SHARDLING",
    family: "crystal_caverns",
    behavior: "crystal_shardling",
    art: { sprite: "/assets/enemies/crystal-shardling.png", renderHeight: 96, anchorY: 0.56 },
    hp: 54, speed: 72, radius: 22, contactDamage: 8, score: 120, xp: 10,
  }),
  prism_moth: freezeEnemy("prism_moth", {
    name: "PRISM MOTH",
    family: "crystal_caverns",
    behavior: "prism_moth",
    art: { sprite: "/assets/enemies/prism-moth.png", renderHeight: 104, anchorY: 0.57 },
    hp: 60, speed: 96, radius: 23, contactDamage: 9, score: 135, xp: 11,
  }),
  geode_warden: freezeEnemy("geode_warden", {
    name: "GEODE WARDEN",
    family: "crystal_caverns",
    behavior: "geode_warden",
    art: { sprite: "/assets/enemies/geode-warden.png", renderHeight: 236, anchorY: 0.62 },
    hp: 1_000, speed: 72, radius: 58, contactDamage: 18, score: 2_150, xp: 152, elite: true,
    telegraphSeconds: 0.58,
  }),
  amethyst_hunter: freezeEnemy("amethyst_hunter", {
    name: "AMETHYST HUNTER",
    family: "crystal_caverns",
    behavior: "amethyst_hunter",
    art: { sprite: "/assets/enemies/amethyst-hunter.png", renderHeight: 240, anchorY: 0.62 },
    hp: 1_060, speed: 66, radius: 60, contactDamage: 19, score: 2_250, xp: 158, elite: true,
    telegraphSeconds: 0.62,
  }),
  shard_colossus: freezeEnemy("shard_colossus", {
    name: "SHARD COLOSSUS",
    family: "crystal_caverns",
    behavior: "shard_colossus",
    art: { sprite: "/assets/enemies/shard-colossus.png", renderHeight: 248, anchorY: 0.62 },
    hp: 1_120, speed: 58, radius: 62, contactDamage: 20, score: 2_350, xp: 162, elite: true,
    telegraphSeconds: 0.66,
  }),
  prism_ape: freezeEnemy("prism_ape", {
    name: "PRISM APE",
    family: "crystal_caverns",
    behavior: "prism_ape",
    art: { sprite: "/assets/enemies/prism-ape.png", renderHeight: 244, anchorY: 0.62 },
    hp: 1_180, speed: 70, radius: 64, contactDamage: 21, score: 2_450, xp: 168, elite: true,
    telegraphSeconds: 0.68,
  }),
  crystal_sovereign: freezeEnemy("crystal_sovereign", {
    name: "KAPRIZARD — CRYSTAL SOVEREIGN",
    family: "crystal_caverns",
    behavior: "crystal_sovereign",
    identity: "kaprizard",
    headIdentity: KAPRIZARD_HEAD_IDENTITY,
    faceExposed: true,
    bodySignature: "crystal-sovereign-titan",
    attackSignature: "prism-lanes-and-shard-crown",
    locomotionSignature: "crystal-drag",
    art: {
      sprite: "/assets/enemies/crystal-sovereign.png",
      specialSprite: "/assets/enemies/rootfall-tyrant-special-v1.png",
      specialStateRows: { secondary: 0, phase: 2 },
      reactionSprite: "/assets/enemies/rootfall-tyrant-reactions-v1.png",
      reactionStateRows: { hit: 0, defeat: 2 },
      renderHeight: 340,
      anchorY: 0.61,
    },
    hp: 4_500, speed: 42, radius: 80, contactDamage: 27, score: 6_600, xp: 510, boss: true,
  }),

  reef_maw: freezeEnemy("reef_maw", {
    name: "REEF MAW",
    family: "sunken_ruins",
    behavior: "reef_maw",
    art: { sprite: "/assets/enemies/reef-maw.png", renderHeight: 120, anchorY: 0.58 },
    hp: 66, speed: 112, radius: 26, contactDamage: 12, score: 140, xp: 11,
  }),
  tide_urchin: freezeEnemy("tide_urchin", {
    name: "TIDE URCHIN",
    family: "sunken_ruins",
    behavior: "tide_urchin",
    art: { sprite: "/assets/enemies/tide-urchin.png", renderHeight: 92, anchorY: 0.55 },
    hp: 58, speed: 58, radius: 24, contactDamage: 9, score: 150, xp: 12,
  }),
  kelp_stalker: freezeEnemy("kelp_stalker", {
    name: "KELP STALKER",
    family: "sunken_ruins",
    behavior: "kelp_stalker",
    art: { sprite: "/assets/enemies/kelp-stalker.png", renderHeight: 114, anchorY: 0.58 },
    hp: 72, speed: 108, radius: 25, contactDamage: 11, score: 160, xp: 13,
  }),
  coral_guardian: freezeEnemy("coral_guardian", {
    name: "CORAL GUARDIAN",
    family: "sunken_ruins",
    behavior: "coral_guardian",
    art: { sprite: "/assets/enemies/coral-guardian.png", renderHeight: 236, anchorY: 0.62 },
    hp: 1_020, speed: 74, radius: 58, contactDamage: 18, score: 2_180, xp: 154, elite: true,
    telegraphSeconds: 0.58,
  }),
  leviathan_brood: freezeEnemy("leviathan_brood", {
    name: "LEVIATHAN BROOD",
    family: "sunken_ruins",
    behavior: "leviathan_brood",
    art: { sprite: "/assets/enemies/leviathan-brood.png", renderHeight: 240, anchorY: 0.62 },
    hp: 1_080, speed: 64, radius: 60, contactDamage: 19, score: 2_280, xp: 160, elite: true,
    telegraphSeconds: 0.62,
  }),
  abyssal_maw: freezeEnemy("abyssal_maw", {
    name: "ABYSSAL MAW",
    family: "sunken_ruins",
    behavior: "abyssal_maw",
    art: { sprite: "/assets/enemies/abyssal-maw.png", renderHeight: 248, anchorY: 0.62 },
    hp: 1_140, speed: 56, radius: 62, contactDamage: 20, score: 2_380, xp: 164, elite: true,
    telegraphSeconds: 0.66,
  }),
  drowned_colossus: freezeEnemy("drowned_colossus", {
    name: "DROWNED COLOSSUS",
    family: "sunken_ruins",
    behavior: "drowned_colossus",
    art: { sprite: "/assets/enemies/drowned-colossus.png", renderHeight: 244, anchorY: 0.62 },
    hp: 1_200, speed: 68, radius: 64, contactDamage: 21, score: 2_480, xp: 170, elite: true,
    telegraphSeconds: 0.68,
  }),
  sunken_leviathan: freezeEnemy("sunken_leviathan", {
    name: "KAPRIZARD — SUNKEN LEVIATHAN",
    family: "sunken_ruins",
    behavior: "sunken_leviathan",
    identity: "kaprizard",
    headIdentity: KAPRIZARD_HEAD_IDENTITY,
    faceExposed: true,
    bodySignature: "sunken-leviathan-titan",
    attackSignature: "tide-lanes-and-coral-crown",
    locomotionSignature: "undertow-drag",
    art: {
      sprite: "/assets/enemies/sunken-leviathan.png",
      specialSprite: "/assets/enemies/rootfall-tyrant-special-v1.png",
      specialStateRows: { secondary: 0, phase: 2 },
      reactionSprite: "/assets/enemies/rootfall-tyrant-reactions-v1.png",
      reactionStateRows: { hit: 0, defeat: 2 },
      renderHeight: 340,
      anchorY: 0.61,
    },
    hp: 4_600, speed: 40, radius: 82, contactDamage: 28, score: 6_700, xp: 520, boss: true,
  }),

  cinder_hound: freezeEnemy("cinder_hound", {
    name: "CINDER HOUND",
    family: "ashen_wastes",
    behavior: "cinder_hound",
    art: { sprite: "/assets/enemies/cinder-hound.png", renderHeight: 108, anchorY: 0.58 },
    hp: 52, speed: 110, radius: 25, contactDamage: 11, score: 115, xp: 10,
  }),
  lava_golem: freezeEnemy("lava_golem", {
    name: "LAVA GOLEM",
    family: "ashen_wastes",
    behavior: "lava_golem",
    art: { sprite: "/assets/enemies/lava-golem.png", renderHeight: 132, anchorY: 0.58 },
    hp: 96, speed: 48, radius: 32, contactDamage: 16, score: 195, xp: 15,
  }),
  ember_wraith: freezeEnemy("ember_wraith", {
    name: "EMBER WRAITH",
    family: "ashen_wastes",
    behavior: "ember_wraith",
    art: { sprite: "/assets/enemies/ember-wraith.png", renderHeight: 112, anchorY: 0.58 },
    hp: 62, speed: 74, radius: 24, contactDamage: 10, score: 145, xp: 12,
  }),
  cinder_warden: freezeEnemy("cinder_warden", {
    name: "CINDER WARDEN",
    family: "ashen_wastes",
    behavior: "cinder_warden",
    art: { sprite: "/assets/enemies/cinder-warden.png", renderHeight: 248, anchorY: 0.61 },
    hp: 1_040, speed: 60, radius: 58, contactDamage: 19, score: 2_200, xp: 156, elite: true,
    telegraphSeconds: 0.58,
  }),
  magma_hunter: freezeEnemy("magma_hunter", {
    name: "MAGMA HUNTER",
    family: "ashen_wastes",
    behavior: "magma_hunter",
    art: { sprite: "/assets/enemies/magma-hunter.png", renderHeight: 252, anchorY: 0.61 },
    hp: 1_100, speed: 58, radius: 60, contactDamage: 20, score: 2_300, xp: 162, elite: true,
    telegraphSeconds: 0.62,
  }),
  basalt_colossus: freezeEnemy("basalt_colossus", {
    name: "BASALT COLOSSUS",
    family: "ashen_wastes",
    behavior: "basalt_colossus",
    art: { sprite: "/assets/enemies/basalt-colossus.png", renderHeight: 256, anchorY: 0.61 },
    hp: 1_160, speed: 50, radius: 62, contactDamage: 21, score: 2_400, xp: 166, elite: true,
    telegraphSeconds: 0.66,
  }),
  pyre_saint: freezeEnemy("pyre_saint", {
    name: "PYRE SAINT",
    family: "ashen_wastes",
    behavior: "pyre_saint",
    art: { sprite: "/assets/enemies/pyre-saint.png", renderHeight: 264, anchorY: 0.61 },
    hp: 1_220, speed: 54, radius: 64, contactDamage: 22, score: 2_500, xp: 172, elite: true,
    telegraphSeconds: 0.68,
  }),
  ashen_titan: freezeEnemy("ashen_titan", {
    name: "KAPRIZARD — ASHEN TITAN",
    family: "ashen_wastes",
    behavior: "ashen_titan",
    identity: "kaprizard",
    headIdentity: KAPRIZARD_HEAD_IDENTITY,
    faceExposed: true,
    bodySignature: "ashen-magma-titan",
    attackSignature: "cinder-lanes-and-pyres-crown",
    locomotionSignature: "volcanic-stomp",
    art: {
      sprite: "/assets/enemies/ashen-titan.png",
      specialSprite: "/assets/enemies/hollow-roaster-special-v1.png",
      specialStateRows: { secondary: 0, phase: 2 },
      reactionSprite: "/assets/enemies/hollow-roaster-reactions-v1.png",
      reactionStateRows: { hit: 0, defeat: 2 },
      renderHeight: 340,
      anchorY: 0.6,
    },
    hp: 4_800, speed: 42, radius: 84, contactDamage: 29, score: 6_900, xp: 540, boss: true,
  }),
});

const FORGE_SECTORS = Object.freeze([
  Object.freeze({
    environment: "lava",
    names: Object.freeze([
      "FORGE LAVA INTAKE 01", "FORGE MOLTEN DUCT 02", "FORGE HEAT RUN 03", "FORGE LOCK 04",
      "FORGE CRUCIBLE BAY 05", "FORGE SLAG PIT 06", "FORGE PIPE RUN 07", "FORGE SCORCH GATE 08",
      "FORGE LAVA ANTECHAMBER 09",
    ]),
    enemies: Object.freeze(["forge_spider", "slag_hound", "furnace_wisp"]),
    eliteRoomName: "FORGE SENTINEL NEST 10",
    elite: "forge_sentinel",
  }),
  Object.freeze({
    environment: "pipeworks",
    names: Object.freeze([
      "FORGE PIPEWORKS 11", "FORGE STEAM VALVE 12", "FORGE BRASS DUCT 13", "FORGE PRESSURE SHAFT 14",
      "FORGE PIPE SAFE 15", "FORGE BOILER HALL 16", "FORGE CINDER ARCHIVE 17", "FORGE REDLINE WALK 18",
      "FORGE GAUGE VEIN 19",
    ]),
    enemies: Object.freeze(["furnace_wisp", "forge_spider", "slag_hound"]),
    eliteRoomName: "FORGE BOILER TYRANT CHAMBER 20",
    elite: "boiler_tyrant",
  }),
  Object.freeze({
    environment: "boiler",
    names: Object.freeze([
      "FORGE BOILER GALLERY 21", "FORGE RED CANISTER 22", "FORGE FLAME SCREEN 23", "FORGE HOT AIR SHAFT 24",
      "FORGE BOILER SAFE 25", "FORGE IGNITION HALL 26", "FORGE CINDER VAULT 27", "FORGE BLAZING WALK 28",
      "FORGE FURNACE VEIN 29",
    ]),
    enemies: Object.freeze(["slag_hound", "forge_spider", "furnace_wisp", "slag_hound"]),
    eliteRoomName: "FORGE SLAG COLOSSUS SANCTUM 30",
    elite: "slag_colossus",
  }),
  Object.freeze({
    environment: "slag",
    names: Object.freeze([
      "FORGE SLAG FLOOR 31", "FORGE MOLTEN DESCENT 32", "FORGE REDLINE PIPE 33", "FORGE STEAM LOCK 34",
      "FORGE SLAG SAFE 35", "FORGE SLAG VEIN 36", "FORGE OVERHEAT WALK 37", "FORGE CORE CONDUIT 38",
      "FORGE FINAL GAUGE 39",
    ]),
    enemies: Object.freeze(["forge_spider", "furnace_wisp", "slag_hound", "furnace_wisp"]),
    eliteRoomName: "FORGE FURNACE OVERLORD HALL 40",
    elite: "furnace_overlord",
  }),
  Object.freeze({
    environment: "furnace",
    names: Object.freeze([
      "FORGE DESCENT 41", "FORGE MOLTEN CHANNEL 42", "FORGE ANCIENT FURNACE 43", "FORGE HOLLOW CORE 44",
      "FORGE FURNACE SAFE 45", "FORGE COILED HEAT 46", "FORGE HEAT CROSSING 47", "FORGE TYRANT APPROACH 48",
      "FORGE CORE ANTECHAMBER 49",
    ]),
    enemies: Object.freeze(["slag_hound", "forge_spider", "furnace_wisp", "slag_hound"]),
  }),
]);

const CRYSTAL_SECTORS = Object.freeze([
  Object.freeze({
    environment: "shard",
    names: Object.freeze([
      "CRYSTAL SHARD LANDING 01", "CRYSTAL PRISM PASS 02", "CRYSTAL COURT 03", "CRYSTAL CAVERN SCAR 04",
      "CRYSTAL GEODE WALK 05", "CRYSTAL AMETHYST GROVE 06", "CRYSTAL SHARD RUN 07", "CRYSTAL STALACTITES 08",
      "CRYSTAL LUMINOUS GATE 09",
    ]),
    enemies: Object.freeze(["crystal_shardling", "crystal_golem", "crystal_shardling"]),
    eliteRoomName: "CRYSTAL GEODE WARDEN CHAMBER 10",
    elite: "geode_warden",
  }),
  Object.freeze({
    environment: "amethyst",
    names: Object.freeze([
      "CRYSTAL AMETHYST STEPS 11", "CRYSTAL VIOLET BED 12", "CRYSTAL PRISM GARDEN 13", "CRYSTAL FACET CAUSEWAY 14",
      "CRYSTAL AMETHYST SAFE 15", "CRYSTAL CLEAR HOLLOW 16", "CRYSTAL CAVERN OF EYES 17", "CRYSTAL SHARD ALTAR 18",
      "CRYSTAL ECHO VAULT 19",
    ]),
    enemies: Object.freeze(["crystal_shardling", "prism_moth", "crystal_golem"]),
    eliteRoomName: "CRYSTAL AMETHYST HUNTER LAIR 20",
    elite: "amethyst_hunter",
  }),
  Object.freeze({
    environment: "geode",
    names: Object.freeze([
      "CRYSTAL GEODE VESTIBULE 21", "CRYSTAL LUMEN WALK 22", "CRYSTAL NAVE 23", "CRYSTAL FRACTAL VEINS 24",
      "CRYSTAL GEODE SAFE 25", "CRYSTAL PALE PRISM HALL 26", "CRYSTAL LIGHT CROSSING 27", "CRYSTAL DREAMSHARD VAULT 28",
      "CRYSTAL GEODE ROOT 29",
    ]),
    enemies: Object.freeze(["prism_moth", "crystal_shardling", "crystal_golem", "prism_moth"]),
    eliteRoomName: "CRYSTAL SHARD COLOSSUS CHANCEL 30",
    elite: "shard_colossus",
  }),
  Object.freeze({
    environment: "prism",
    names: Object.freeze([
      "CRYSTAL PRISM PROCESSION 31", "CRYSTAL VIOLET AISLE 32", "CRYSTAL FACETED CLOISTER 33", "CRYSTAL REFRACTION WALK 34",
      "CRYSTAL PRISM SAFE 35", "CRYSTAL PRISM LABYRINTH 36", "CRYSTAL CROWN OF LIGHT 37", "CRYSTAL SHARD OSSUARY 38",
      "CRYSTAL APE VERGE 39",
    ]),
    enemies: Object.freeze(["crystal_golem", "crystal_shardling", "prism_moth", "crystal_shardling"]),
    eliteRoomName: "CRYSTAL PRISM APE COURT 40",
    elite: "prism_ape",
  }),
  Object.freeze({
    environment: "crystalheart",
    names: Object.freeze([
      "CRYSTAL DESCENT 41", "CRYSTAL DEEP PRISM CHANNEL 42", "CRYSTAL ANCIENT GEODE HALL 43", "CRYSTAL HOLLOW CAVERN 44",
      "CRYSTAL HEART SAFE 45", "CRYSTAL COILED FACET 46", "CRYSTAL NERVE CROSSING 47", "CRYSTAL SOVEREIGN APPROACH 48",
      "CRYSTAL THRONE ANTECHAMBER 49",
    ]),
    enemies: Object.freeze(["crystal_shardling", "crystal_golem", "prism_moth", "crystal_shardling"]),
  }),
]);

const SUNKEN_SECTORS = Object.freeze([
  Object.freeze({
    environment: "coral",
    names: Object.freeze([
      "SUNKEN CORAL LANDING 01", "SUNKEN KELP PASS 02", "SUNKEN REEF COURT 03", "SUNKEN TIDE SCAR 04",
      "SUNKEN PILLAR WALK 05", "SUNKEN CORAL GROVE 06", "SUNKEN URCHIN RUN 07", "SUNKEN HANGING KELP 08",
      "SUNKEN TIDAL GATE 09",
    ]),
    enemies: Object.freeze(["reef_maw", "tide_urchin", "reef_maw"]),
    eliteRoomName: "SUNKEN CORAL GUARDIAN REEF 10",
    elite: "coral_guardian",
  }),
  Object.freeze({
    environment: "pillar",
    names: Object.freeze([
      "SUNKEN PILLAR STEPS 11", "SUNKEN FLOODED BED 12", "SUNKEN KELP GARDEN 13", "SUNKEN REEF CAUSEWAY 14",
      "SUNKEN PILLAR SAFE 15", "SUNKEN TIDAL HOLLOW 16", "SUNKEN FEN OF EYES 17", "SUNKEN REEF ALTAR 18",
      "SUNKEN ECHO VAULT 19",
    ]),
    enemies: Object.freeze(["tide_urchin", "kelp_stalker", "reef_maw"]),
    eliteRoomName: "SUNKEN LEVIATHAN BROOD POOL 20",
    elite: "leviathan_brood",
  }),
  Object.freeze({
    environment: "kelp",
    names: Object.freeze([
      "SUNKEN KELP VESTIBULE 21", "SUNKEN LUMEN WALK 22", "SUNKEN UNDERWATER NAVE 23", "SUNKEN TIDAL VEINS 24",
      "SUNKEN KELP SAFE 25", "SUNKEN PALE KELP HALL 26", "SUNKEN CURRENT CROSSING 27", "SUNKEN DREAMTIDE VAULT 28",
      "SUNKEN KELP ROOT 29",
    ]),
    enemies: Object.freeze(["kelp_stalker", "tide_urchin", "reef_maw", "kelp_stalker"]),
    eliteRoomName: "SUNKEN ABYSSAL MAW CHANCEL 30",
    elite: "abyssal_maw",
  }),
  Object.freeze({
    environment: "tide",
    names: Object.freeze([
      "SUNKEN TIDE PROCESSION 31", "SUNKEN DEEP AISLE 32", "SUNKEN FLOODED CLOISTER 33", "SUNKEN CURRENT WALK 34",
      "SUNKEN TIDE SAFE 35", "SUNKEN TIDE LABYRINTH 36", "SUNKEN CROWN OF CURRENTS 37", "SUNKEN CORAL OSSUARY 38",
      "SUNKEN BROOD VERGE 39",
    ]),
    enemies: Object.freeze(["reef_maw", "kelp_stalker", "tide_urchin", "reef_maw"]),
    eliteRoomName: "SUNKEN DROWNED COLOSSUS COURT 40",
    elite: "drowned_colossus",
  }),
  Object.freeze({
    environment: "depths",
    names: Object.freeze([
      "SUNKEN DESCENT 41", "SUNKEN DEEP CHANNEL 42", "SUNKEN ANCIENT RUIN HALL 43", "SUNKEN HOLLOW DEPTHS 44",
      "SUNKEN DEPTHS SAFE 45", "SUNKEN COILED ABYSS 46", "SUNKEN NERVE REEF CROSSING 47", "SUNKEN LEVIATHAN APPROACH 48",
      "SUNKEN THRONE ANTECHAMBER 49",
    ]),
    enemies: Object.freeze(["reef_maw", "kelp_stalker", "tide_urchin", "reef_maw"]),
  }),
]);

const ASHEN_SECTORS = Object.freeze([
  Object.freeze({
    environment: "cinder",
    names: Object.freeze([
      "ASHEN CINDER LANDING 01", "ASHEN ASH PASS 02", "ASHEN WASTE COURT 03", "ASHEN EMBER SCAR 04",
      "ASHEN BASALT WALK 05", "ASHEN RED CINDER GROVE 06", "ASHEN HOUND RUN 07", "ASHEN HANGING CRACKS 08",
      "ASHEN CINDER GATE 09",
    ]),
    enemies: Object.freeze(["cinder_hound", "ember_wraith", "cinder_hound"]),
    eliteRoomName: "ASHEN CINDER WARDEN PIT 10",
    elite: "cinder_warden",
  }),
  Object.freeze({
    environment: "basalt",
    names: Object.freeze([
      "ASHEN BASALT STEPS 11", "ASHEN BLACK ROCK BED 12", "ASHEN MAGMA GARDEN 13", "ASHEN CINDER CAUSEWAY 14",
      "ASHEN BASALT SAFE 15", "ASHEN CLEAR HOLLOW 16", "ASHEN FEN OF EMBERS 17", "ASHEN LAVA ALTAR 18",
      "ASHEN ECHO VAULT 19",
    ]),
    enemies: Object.freeze(["ember_wraith", "lava_golem", "cinder_hound"]),
    eliteRoomName: "ASHEN MAGMA HUNTER LAIR 20",
    elite: "magma_hunter",
  }),
  Object.freeze({
    environment: "magma",
    names: Object.freeze([
      "ASHEN MAGMA VESTIBULE 21", "ASHEN LUMEN WALK 22", "ASHEN VOLCANIC NAVE 23", "ASHEN MOLTEN VEINS 24",
      "ASHEN MAGMA SAFE 25", "ASHEN PALE MAGMA HALL 26", "ASHEN HEAT CROSSING 27", "ASHEN DREAMFIRE VAULT 28",
      "ASHEN MAGMA ROOT 29",
    ]),
    enemies: Object.freeze(["lava_golem", "ember_wraith", "cinder_hound", "lava_golem"]),
    eliteRoomName: "ASHEN BASALT COLOSSUS CHANCEL 30",
    elite: "basalt_colossus",
  }),
  Object.freeze({
    environment: "pyre",
    names: Object.freeze([
      "ASHEN PYRE PROCESSION 31", "ASHEN BLOODFIRE AISLE 32", "ASHEN BARBED CLOISTER 33", "ASHEN STRANGLER WALK 34",
      "ASHEN PYRE SAFE 35", "ASHEN PYRE LABYRINTH 36", "ASHEN CROWN OF EMBERS 37", "ASHEN ASH OSSUARY 38",
      "ASHEN APE VERGE 39",
    ]),
    enemies: Object.freeze(["cinder_hound", "lava_golem", "ember_wraith", "cinder_hound"]),
    eliteRoomName: "ASHEN PYRE SAINT COURT 40",
    elite: "pyre_saint",
  }),
  Object.freeze({
    environment: "ashenheart",
    names: Object.freeze([
      "ASHEN DESCENT 41", "ASHEN BLACK FIRE CHANNEL 42", "ASHEN ANCIENT VOLCANO HALL 43", "ASHEN HOLLOW WASTE 44",
      "ASHEN HEART SAFE 45", "ASHEN COILED ABYSS 46", "ASHEN NERVE LAVA CROSSING 47", "ASHEN TITAN APPROACH 48",
      "ASHEN THRONE ANTECHAMBER 49",
    ]),
    enemies: Object.freeze(["cinder_hound", "lava_golem", "ember_wraith", "cinder_hound"]),
  }),
]);

const FORGE_HAZARDS = Object.freeze({
  lava: Object.freeze({ kind: "ember", interval: 3.2, activeDuration: 1.1, damage: 11 }),
  pipeworks: Object.freeze({ kind: "steam", interval: 3.5, activeDuration: 1.2, damage: 10 }),
  boiler: Object.freeze({ kind: "ember", interval: 3.1, activeDuration: 1.05, damage: 12 }),
  slag: Object.freeze({ kind: "pressure", interval: 3.4, activeDuration: 1.15, damage: 11 }),
  furnace: Object.freeze({ kind: "ember", interval: 3.0, activeDuration: 1.0, damage: 13 }),
  forgeheart: Object.freeze({ kind: "ember", interval: 2.8, activeDuration: 0.95, damage: 14 }),
});

const CRYSTAL_HAZARDS = Object.freeze({
  shard: Object.freeze({ kind: "prism", interval: 3.6, activeDuration: 1.2, damage: 10 }),
  amethyst: Object.freeze({ kind: "prism", interval: 3.8, activeDuration: 1.3, damage: 11 }),
  geode: Object.freeze({ kind: "prism", interval: 3.5, activeDuration: 1.15, damage: 12 }),
  prism: Object.freeze({ kind: "prism", interval: 3.2, activeDuration: 1.0, damage: 13 }),
  crystalheart: Object.freeze({ kind: "prism", interval: 3.0, activeDuration: 0.95, damage: 14 }),
});

const SUNKEN_HAZARDS = Object.freeze({
  coral: Object.freeze({ kind: "tide", interval: 3.7, activeDuration: 1.25, damage: 10 }),
  pillar: Object.freeze({ kind: "tide", interval: 3.9, activeDuration: 1.35, damage: 11 }),
  kelp: Object.freeze({ kind: "tide", interval: 3.5, activeDuration: 1.2, damage: 12 }),
  tide: Object.freeze({ kind: "tide", interval: 3.3, activeDuration: 1.1, damage: 13 }),
  depths: Object.freeze({ kind: "tide", interval: 3.1, activeDuration: 1.05, damage: 14 }),
});

const ASHEN_HAZARDS = Object.freeze({
  cinder: Object.freeze({ kind: "cinder", interval: 3.2, activeDuration: 1.0, damage: 11 }),
  basalt: Object.freeze({ kind: "cinder", interval: 3.4, activeDuration: 1.1, damage: 12 }),
  magma: Object.freeze({ kind: "cinder", interval: 3.1, activeDuration: 1.05, damage: 13 }),
  pyre: Object.freeze({ kind: "cinder", interval: 2.9, activeDuration: 0.95, damage: 14 }),
  ashenheart: Object.freeze({ kind: "cinder", interval: 2.7, activeDuration: 0.9, damage: 15 }),
});

function freezeTour(definition) {
  return Object.freeze({
    ...definition,
    rooms: Object.freeze(definition.rooms.map((room) => room)),
  });
}

export const ARENA_TOURS = Object.freeze([
  freezeTour({
    id: "forge-depths",
    code: "TOUR 03",
    name: "FORGE DEPTHS",
    district: "THE MOLTEN FORGE",
    theme: "industrial-forge-volcanic",
    family: "forge_depths",
    unlocked: true,
    rooms: createTourRooms({
      tourPrefix: "forge",
      sectors: FORGE_SECTORS,
      safeRoomByNumber: createSafeRooms("forge", {
        rest15: "FORGE COOLING BAY 15",
        event25: "FORGE FIELD CONTRACT 25",
        rest35: "FORGE FILTER CHAPEL 35",
        event45: "FORGE REDLINE DEAL 45",
      }),
      doubleWaveRooms: SHARED_DOUBLE_WAVE_ROOMS,
      hazardProfiles: FORGE_HAZARDS,
      layoutStyle: "industrial",
      bossRoom: {
        id: "forge-core-50",
        name: "FORGE CORE 50",
        environment: "forgeheart",
        reward: "finish",
        boss: true,
        waves: [["forge_core_tyrant"]],
        ...createTourLayout("forgeheart", 50, FORGE_HAZARDS.furnace, "industrial"),
        destructibles: [],
      },
    }),
  }),
  freezeTour({
    id: "crystal-caverns",
    code: "TOUR 04",
    name: "CRYSTAL CAVERNS",
    district: "THE FRACTURED DEEP",
    theme: "crystalline-magical-cavern",
    family: "crystal_caverns",
    unlocked: true,
    rooms: createTourRooms({
      tourPrefix: "crystal",
      sectors: CRYSTAL_SECTORS,
      safeRoomByNumber: createSafeRooms("crystal", {
        rest15: "AMETHYST REST 15",
        event25: "CRYSTAL FIELD CONTRACT 25",
        rest35: "PRISM SANCTUARY 35",
        event45: "CRYSTAL SHARD BARGAIN 45",
      }),
      doubleWaveRooms: SHARED_DOUBLE_WAVE_ROOMS,
      hazardProfiles: CRYSTAL_HAZARDS,
      layoutStyle: "organic",
      bossRoom: {
        id: "crystal-throne-50",
        name: "CRYSTAL THRONE 50",
        environment: "crystalheart",
        reward: "finish",
        boss: true,
        waves: [["crystal_sovereign"]],
        ...createTourLayout("crystalheart", 50, CRYSTAL_HAZARDS.crystalheart, "organic"),
        destructibles: [],
      },
    }),
  }),
  freezeTour({
    id: "sunken-ruins",
    code: "TOUR 05",
    name: "SUNKEN RUINS",
    district: "THE DROWNED TEMPLE",
    theme: "flooded-ancient-ruins",
    family: "sunken_ruins",
    unlocked: true,
    rooms: createTourRooms({
      tourPrefix: "sunken",
      sectors: SUNKEN_SECTORS,
      safeRoomByNumber: createSafeRooms("sunken", {
        rest15: "SUNKEN TIDAL REST 15",
        event25: "SUNKEN FIELD CONTRACT 25",
        rest35: "SUNKEN MOONPOOL 35",
        event45: "SUNKEN TIDAL BARGAIN 45",
      }),
      doubleWaveRooms: SHARED_DOUBLE_WAVE_ROOMS,
      hazardProfiles: SUNKEN_HAZARDS,
      layoutStyle: "organic",
      bossRoom: {
        id: "sunken-throne-50",
        name: "LEVIATHAN THRONE 50",
        environment: "depths",
        reward: "finish",
        boss: true,
        waves: [["sunken_leviathan"]],
        ...createTourLayout("depths", 50, SUNKEN_HAZARDS.depths, "organic"),
        destructibles: [],
      },
    }),
  }),
  freezeTour({
    id: "ashen-wastes",
    code: "TOUR 06",
    name: "ASHEN WASTES",
    district: "THE VOLCANIC FRONT",
    theme: "hellish-volcanic-wastes",
    family: "ashen_wastes",
    unlocked: true,
    rooms: createTourRooms({
      tourPrefix: "ashen",
      sectors: ASHEN_SECTORS,
      safeRoomByNumber: createSafeRooms("ashen", {
        rest15: "ASHEN CINDER REST 15",
        event25: "ASHEN FIELD CONTRACT 25",
        rest35: "ASHEN PYRE REST 35",
        event45: "ASHEN FIRE BARGAIN 45",
      }),
      doubleWaveRooms: SHARED_DOUBLE_WAVE_ROOMS,
      hazardProfiles: ASHEN_HAZARDS,
      layoutStyle: "industrial",
      bossRoom: {
        id: "ashen-throne-50",
        name: "ASHEN THRONE 50",
        environment: "ashenheart",
        reward: "finish",
        boss: true,
        waves: [["ashen_titan"]],
        ...createTourLayout("ashenheart", 50, ASHEN_HAZARDS.ashenheart, "industrial"),
        destructibles: [],
      },
    }),
  }),
]);
