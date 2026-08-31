import { acquireSpriteLease, loadSprite } from "./sprite-loader.js";

const PROPPED_ENVIRONMENTS = Object.freeze([
  "ash",
  "ember",
  "brass",
  "smoke",
  "pressure",
  "canopy",
  "mire",
  "mycelium",
  "briar",
  "rootdeep",
  "lava",
  "pipeworks",
  "boiler",
  "slag",
  "furnace",
  "shard",
  "amethyst",
  "geode",
  "prism",
  "coral",
  "pillar",
  "kelp",
  "tide",
  "depths",
  "cinder",
  "basalt",
  "magma",
  "pyre",
]);

function freezeDefinition(id, definition) {
  return Object.freeze({
    id,
    ...definition,
    collision: Object.freeze({ ...definition.collision }),
    art: Object.freeze({ backdrop: "transparent", ...definition.art }),
  });
}

export const DESTRUCTIBLE_CATALOG = Object.freeze({
  ash_collection_crate: freezeDefinition("ash_collection_crate", {
    name: "ASH COLLECTION CRATE",
    environment: "ash",
    maxHp: 54,
    xp: 3,
    score: 18,
    collision: { width: 86, height: 70 },
    debrisColor: "#70412c",
    art: {
      sprite: "/assets/props/ash-collection-crate-v1.png",
      renderWidth: 118,
      renderHeight: 118,
    },
  }),
  ember_canister: freezeDefinition("ember_canister", {
    name: "EMBER CANISTER",
    environment: "ember",
    maxHp: 62,
    xp: 4,
    score: 22,
    collision: { width: 68, height: 82 },
    debrisColor: "#ed6b32",
    art: {
      sprite: "/assets/props/ember-canister-v1.png",
      renderWidth: 112,
      renderHeight: 126,
    },
  }),
  brass_grinder_case: freezeDefinition("brass_grinder_case", {
    name: "BRASS GRINDER CASE",
    environment: "brass",
    maxHp: 76,
    xp: 5,
    score: 26,
    collision: { width: 84, height: 72 },
    debrisColor: "#ba873d",
    art: {
      sprite: "/assets/props/brass-grinder-case-v1.png",
      renderWidth: 120,
      renderHeight: 120,
    },
  }),
  smoke_filter_urn: freezeDefinition("smoke_filter_urn", {
    name: "SMOKE FILTER URN",
    environment: "smoke",
    maxHp: 68,
    xp: 4,
    score: 24,
    collision: { width: 68, height: 82 },
    debrisColor: "#766773",
    art: {
      sprite: "/assets/props/smoke-filter-urn-v1.png",
      renderWidth: 108,
      renderHeight: 124,
    },
  }),
  pressure_tank: freezeDefinition("pressure_tank", {
    name: "PRESSURE TANK",
    environment: "pressure",
    maxHp: 88,
    xp: 6,
    score: 30,
    collision: { width: 108, height: 68 },
    debrisColor: "#9d6241",
    art: {
      sprite: "/assets/props/pressure-tank-v1.png",
      renderWidth: 144,
      renderHeight: 112,
    },
  }),
  canopy_thornseed_pod: freezeDefinition("canopy_thornseed_pod", {
    name: "THORNSEED POD",
    environment: "canopy",
    maxHp: 58,
    xp: 3,
    score: 20,
    collision: { width: 78, height: 66 },
    debrisColor: "#9a6038",
    art: {
      sprite: "/assets/props/canopy-thornseed-pod-v1.png",
      renderWidth: 114,
      renderHeight: 112,
    },
  }),
  mire_resin_urn: freezeDefinition("mire_resin_urn", {
    name: "MIRE RESIN URN",
    environment: "mire",
    maxHp: 72,
    xp: 4,
    score: 25,
    collision: { width: 88, height: 74 },
    debrisColor: "#9b793f",
    art: {
      sprite: "/assets/props/mire-resin-urn-v1.png",
      renderWidth: 124,
      renderHeight: 122,
    },
  }),
  mycelium_spore_bulb: freezeDefinition("mycelium_spore_bulb", {
    name: "SPORE BULB",
    environment: "mycelium",
    maxHp: 52,
    xp: 4,
    score: 23,
    collision: { width: 76, height: 66 },
    debrisColor: "#a49a55",
    art: {
      sprite: "/assets/props/mycelium-spore-bulb-v1.png",
      renderWidth: 118,
      renderHeight: 112,
    },
  }),
  briar_heartwood_knot: freezeDefinition("briar_heartwood_knot", {
    name: "HEARTWOOD KNOT",
    environment: "briar",
    maxHp: 84,
    xp: 5,
    score: 29,
    collision: { width: 96, height: 70 },
    debrisColor: "#59332a",
    art: {
      sprite: "/assets/props/briar-heartwood-knot-v1.png",
      renderWidth: 132,
      renderHeight: 118,
    },
  }),
  rootdeep_sap_cocoon: freezeDefinition("rootdeep_sap_cocoon", {
    name: "ROOT-SAP COCOON",
    environment: "rootdeep",
    maxHp: 94,
    xp: 6,
    score: 33,
    collision: { width: 98, height: 64 },
    debrisColor: "#744529",
    art: {
      sprite: "/assets/props/rootdeep-sap-cocoon-v1.png",
      renderWidth: 132,
      renderHeight: 108,
    },
  }),
  forge_ember_canister: freezeDefinition("forge_ember_canister", {
    name: "FORGE EMBER CANISTER",
    environment: "lava",
    maxHp: 62,
    xp: 4,
    score: 22,
    collision: { width: 68, height: 82 },
    debrisColor: "#ed6b32",
    art: {
      sprite: "/assets/props/ember-canister-v1.png",
      renderWidth: 112,
      renderHeight: 126,
    },
  }),
  forge_pipeworks_case: freezeDefinition("forge_pipeworks_case", {
    name: "PIPEWORKS CASE",
    environment: "pipeworks",
    maxHp: 76,
    xp: 5,
    score: 26,
    collision: { width: 84, height: 72 },
    debrisColor: "#ba873d",
    art: {
      sprite: "/assets/props/brass-grinder-case-v1.png",
      renderWidth: 120,
      renderHeight: 120,
    },
  }),
  forge_boiler_tank: freezeDefinition("forge_boiler_tank", {
    name: "BOILER TANK",
    environment: "boiler",
    maxHp: 80,
    xp: 5,
    score: 28,
    collision: { width: 72, height: 86 },
    debrisColor: "#8f4d2d",
    art: {
      sprite: "/assets/props/pressure-tank-v1.png",
      renderWidth: 118,
      renderHeight: 128,
    },
  }),
  forge_slag_crate: freezeDefinition("forge_slag_crate", {
    name: "SLAG CRATE",
    environment: "slag",
    maxHp: 70,
    xp: 4,
    score: 24,
    collision: { width: 86, height: 70 },
    debrisColor: "#70412c",
    art: {
      sprite: "/assets/props/ash-collection-crate-v1.png",
      renderWidth: 118,
      renderHeight: 118,
    },
  }),
  forge_furnace_urn: freezeDefinition("forge_furnace_urn", {
    name: "FURNACE URN",
    environment: "furnace",
    maxHp: 84,
    xp: 5,
    score: 30,
    collision: { width: 68, height: 82 },
    debrisColor: "#766773",
    art: {
      sprite: "/assets/props/smoke-filter-urn-v1.png",
      renderWidth: 108,
      renderHeight: 124,
    },
  }),
  crystal_shard_pod: freezeDefinition("crystal_shard_pod", {
    name: "SHARD POD",
    environment: "shard",
    maxHp: 58,
    xp: 4,
    score: 20,
    collision: { width: 72, height: 72 },
    debrisColor: "#6ec4ff",
    art: {
      sprite: "/assets/props/mycelium-spore-bulb-v1.png",
      renderWidth: 112,
      renderHeight: 112,
    },
  }),
  crystal_amethyst_bulb: freezeDefinition("crystal_amethyst_bulb", {
    name: "AMETHYST BULB",
    environment: "amethyst",
    maxHp: 64,
    xp: 4,
    score: 22,
    collision: { width: 72, height: 72 },
    debrisColor: "#b586ff",
    art: {
      sprite: "/assets/props/mycelium-spore-bulb-v1.png",
      renderWidth: 112,
      renderHeight: 112,
    },
  }),
  crystal_geode_node: freezeDefinition("crystal_geode_node", {
    name: "GEODE NODE",
    environment: "geode",
    maxHp: 72,
    xp: 5,
    score: 24,
    collision: { width: 76, height: 66 },
    debrisColor: "#7ec8ff",
    art: {
      sprite: "/assets/props/canopy-thornseed-pod-v1.png",
      renderWidth: 118,
      renderHeight: 118,
    },
  }),
  crystal_prism_cocoon: freezeDefinition("crystal_prism_cocoon", {
    name: "PRISM COCOON",
    environment: "prism",
    maxHp: 68,
    xp: 4,
    score: 23,
    collision: { width: 76, height: 66 },
    debrisColor: "#d8a9ff",
    art: {
      sprite: "/assets/props/rootdeep-sap-cocoon-v1.png",
      renderWidth: 132,
      renderHeight: 108,
    },
  }),
  sunken_coral_pod: freezeDefinition("sunken_coral_pod", {
    name: "CORAL POD",
    environment: "coral",
    maxHp: 60,
    xp: 4,
    score: 21,
    collision: { width: 72, height: 72 },
    debrisColor: "#47a7a0",
    art: {
      sprite: "/assets/props/mire-resin-urn-v1.png",
      renderWidth: 112,
      renderHeight: 126,
    },
  }),
  sunken_pillar_urn: freezeDefinition("sunken_pillar_urn", {
    name: "PILLAR URN",
    environment: "pillar",
    maxHp: 74,
    xp: 5,
    score: 25,
    collision: { width: 68, height: 82 },
    debrisColor: "#5ec4cf",
    art: {
      sprite: "/assets/props/smoke-filter-urn-v1.png",
      renderWidth: 108,
      renderHeight: 124,
    },
  }),
  sunken_kelp_knot: freezeDefinition("sunken_kelp_knot", {
    name: "KELP KNOT",
    environment: "kelp",
    maxHp: 66,
    xp: 4,
    score: 22,
    collision: { width: 96, height: 70 },
    debrisColor: "#83b85f",
    art: {
      sprite: "/assets/props/briar-heartwood-knot-v1.png",
      renderWidth: 132,
      renderHeight: 118,
    },
  }),
  sunken_tide_cocoon: freezeDefinition("sunken_tide_cocoon", {
    name: "TIDE COCOON",
    environment: "tide",
    maxHp: 70,
    xp: 4,
    score: 23,
    collision: { width: 98, height: 64 },
    debrisColor: "#3aa8b5",
    art: {
      sprite: "/assets/props/rootdeep-sap-cocoon-v1.png",
      renderWidth: 132,
      renderHeight: 108,
    },
  }),
  sunken_depths_urn: freezeDefinition("sunken_depths_urn", {
    name: "DEPTHS URN",
    environment: "depths",
    maxHp: 78,
    xp: 5,
    score: 27,
    collision: { width: 68, height: 82 },
    debrisColor: "#2d8f98",
    art: {
      sprite: "/assets/props/mire-resin-urn-v1.png",
      renderWidth: 112,
      renderHeight: 126,
    },
  }),
  ashen_cinder_crate: freezeDefinition("ashen_cinder_crate", {
    name: "CINDER CRATE",
    environment: "cinder",
    maxHp: 58,
    xp: 4,
    score: 20,
    collision: { width: 86, height: 70 },
    debrisColor: "#70412c",
    art: {
      sprite: "/assets/props/ash-collection-crate-v1.png",
      renderWidth: 118,
      renderHeight: 118,
    },
  }),
  ashen_basalt_case: freezeDefinition("ashen_basalt_case", {
    name: "BASALT CASE",
    environment: "basalt",
    maxHp: 82,
    xp: 5,
    score: 29,
    collision: { width: 84, height: 72 },
    debrisColor: "#4a342c",
    art: {
      sprite: "/assets/props/brass-grinder-case-v1.png",
      renderWidth: 120,
      renderHeight: 120,
    },
  }),
  ashen_magma_tank: freezeDefinition("ashen_magma_tank", {
    name: "MAGMA TANK",
    environment: "magma",
    maxHp: 88,
    xp: 5,
    score: 31,
    collision: { width: 72, height: 86 },
    debrisColor: "#ff5c30",
    art: {
      sprite: "/assets/props/pressure-tank-v1.png",
      renderWidth: 118,
      renderHeight: 128,
    },
  }),
  ashen_pyre_urn: freezeDefinition("ashen_pyre_urn", {
    name: "PYRE URN",
    environment: "pyre",
    maxHp: 76,
    xp: 5,
    score: 28,
    collision: { width: 68, height: 82 },
    debrisColor: "#ed6b32",
    art: {
      sprite: "/assets/props/ember-canister-v1.png",
      renderWidth: 112,
      renderHeight: 126,
    },
  }),
});

const TYPE_BY_ENVIRONMENT = Object.freeze(Object.fromEntries(
  Object.values(DESTRUCTIBLE_CATALOG).map((definition) => [definition.environment, definition.id]),
));

const PLACEMENT_CANDIDATES = Object.freeze([
  Object.freeze({ x: 166, y: 340 }),
  Object.freeze({ x: 554, y: 340 }),
  Object.freeze({ x: 170, y: 660 }),
  Object.freeze({ x: 550, y: 660 }),
  Object.freeze({ x: 178, y: 942 }),
  Object.freeze({ x: 542, y: 942 }),
  Object.freeze({ x: 360, y: 470 }),
  Object.freeze({ x: 360, y: 838 }),
]);

function rectanglesOverlap(first, second, padding = 0) {
  return first.x - padding < second.x + second.width
    && first.x + first.width + padding > second.x
    && first.y - padding < second.y + second.height
    && first.y + first.height + padding > second.y;
}

function overlapsHazard(rectangle, hazard, padding = 0) {
  const closestX = Math.max(rectangle.x, Math.min(hazard.x, rectangle.x + rectangle.width));
  const closestY = Math.max(rectangle.y, Math.min(hazard.y, rectangle.y + rectangle.height));
  const dx = hazard.x - closestX;
  const dy = hazard.y - closestY;
  const radius = hazard.radius + padding;
  return dx * dx + dy * dy <= radius * radius;
}

export function getDestructibleDefinition(type) {
  return DESTRUCTIBLE_CATALOG[type] ?? null;
}

export function createRoomDestructibles(environment, roomNumber, layout = {}) {
  const type = TYPE_BY_ENVIRONMENT[environment];
  const definition = getDestructibleDefinition(type);
  if (!definition || !Number.isInteger(roomNumber) || roomNumber < 1) {
    return [];
  }

  const obstacles = Array.isArray(layout.obstacles) ? layout.obstacles : [];
  const hazards = Array.isArray(layout.hazards) ? layout.hazards : [];
  const desiredCount = roomNumber % 3 === 0 ? 2 : 1;
  const placements = [];
  const startIndex = (roomNumber * 3 + environment.length) % PLACEMENT_CANDIDATES.length;

  for (let offset = 0; offset < PLACEMENT_CANDIDATES.length; offset += 1) {
    const candidate = PLACEMENT_CANDIDATES[(startIndex + offset) % PLACEMENT_CANDIDATES.length];
    const rectangle = {
      x: Math.round(candidate.x - definition.collision.width / 2),
      y: Math.round(candidate.y - definition.collision.height / 2),
      width: definition.collision.width,
      height: definition.collision.height,
    };
    const blocked = obstacles.some((obstacle) => rectanglesOverlap(rectangle, obstacle, 24))
      || hazards.some((hazard) => overlapsHazard(rectangle, hazard, 28))
      || placements.some((placement) => rectanglesOverlap(rectangle, placement, 52));
    if (blocked) {
      continue;
    }

    const sector = Math.max(0, Math.floor((roomNumber - 1) / 10));
    const maxHp = definition.maxHp + sector * 6;
    placements.push(Object.freeze({
      type,
      ...rectangle,
      maxHp,
    }));
    if (placements.length >= desiredCount) {
      break;
    }
  }

  return placements;
}

export function createRuntimeDestructible(placement, instanceId) {
  const definition = getDestructibleDefinition(placement?.type);
  if (!definition) {
    throw new RangeError(`Unknown destructible type: ${placement?.type ?? "unknown"}`);
  }
  const maxHp = Number.isFinite(placement.maxHp) && placement.maxHp > 0
    ? placement.maxHp
    : definition.maxHp;
  return {
    ...placement,
    id: instanceId,
    hp: maxHp,
    maxHp,
    alive: true,
    rewarded: false,
    hitFlash: 0,
  };
}

export function loadDestructibleSprite(type) {
  const definition = getDestructibleDefinition(type);
  return loadSprite(`destructible:${type}`, definition?.art);
}

export function acquireDestructibleSpriteLease(type, options) {
  const definition = getDestructibleDefinition(type);
  return acquireSpriteLease(`destructible:${type}`, definition?.art, options);
}

export function validateDestructibleCatalog(catalog = DESTRUCTIBLE_CATALOG) {
  const errors = [];
  const environments = new Set();
  const sprites = new Set();

  for (const [id, definition] of Object.entries(catalog ?? {})) {
    if (definition?.id !== id || !/^[a-z0-9_]+$/.test(id)) {
      errors.push(`Invalid destructible id: ${id}`);
    }
    if (!PROPPED_ENVIRONMENTS.includes(definition?.environment)
      || environments.has(definition.environment)) {
      errors.push(`Invalid or duplicate destructible environment: ${definition?.environment}`);
    }
    environments.add(definition?.environment);
    if (!/^\/assets\/props\/[a-z0-9-]+\.png$/.test(definition?.art?.sprite ?? "")
      || sprites.has(definition.art.sprite)) {
      errors.push(`Invalid or duplicate destructible sprite: ${id}`);
    }
    sprites.add(definition?.art?.sprite);
    if (definition?.art?.backdrop !== "transparent") {
      errors.push(`Destructible ${id} must use a transparent sprite`);
    }
    for (const value of [
      definition?.maxHp,
      definition?.xp,
      definition?.score,
      definition?.collision?.width,
      definition?.collision?.height,
      definition?.art?.renderWidth,
      definition?.art?.renderHeight,
    ]) {
      if (!Number.isFinite(value) || value <= 0) {
        errors.push(`Destructible ${id} has invalid numeric data`);
        break;
      }
    }
  }

  for (const environment of PROPPED_ENVIRONMENTS) {
    if (!environments.has(environment)) {
      errors.push(`Missing destructible for ${environment}`);
    }
  }
  return Object.freeze(errors);
}
