const SAFE_INSTANCE_ID = /^[a-z0-9][a-z0-9-]{0,95}$/;
const EQUIPMENT_SLOT_SET = new Set(["weapon", "armor", "ring", "relic"]);

export const MAX_INVENTORY_ITEMS = 100;
export const EQUIPMENT_SLOTS = Object.freeze(["weapon", "armor", "ring", "relic"]);
export const EQUIPMENT_SLOT_LABELS = Object.freeze({
  weapon: "WEAPON MOD",
  armor: "ARMOR",
  ring: "RING",
  relic: "RELIC",
});

export const EQUIPMENT_RARITIES = Object.freeze({
  common: Object.freeze({ id: "common", name: "COMMON", multiplier: 1, color: "#a9927b" }),
  rare: Object.freeze({ id: "rare", name: "RARE", multiplier: 1.5, color: "#62a8d8" }),
  epic: Object.freeze({ id: "epic", name: "EPIC", multiplier: 2.1, color: "#b178df" }),
});

function freezeItem(definition) {
  return Object.freeze({
    ...definition,
    modifiers: Object.freeze({ ...definition.modifiers }),
  });
}

export const EQUIPMENT_ITEMS = Object.freeze([
  freezeItem({
    id: "tempered-grip",
    slot: "weapon",
    name: "TEMPERED GRIP",
    description: "Reinforced handling surface for harder impacts.",
    modifiers: { damagePct: 0.08 },
  }),
  freezeItem({
    id: "pressure-bore",
    slot: "weapon",
    name: "PRESSURE BORE",
    description: "Vented assembly that shortens the firing cycle.",
    modifiers: { attackSpeedPct: 0.08 },
  }),
  freezeItem({
    id: "blackened-edge",
    slot: "weapon",
    name: "BLACKENED EDGE",
    description: "A precision insert tuned for lethal contact.",
    modifiers: { critChance: 0.04 },
  }),
  freezeItem({
    id: "kiln-coat",
    slot: "armor",
    name: "KILN COAT",
    description: "Heat-cured protection built for sealed chambers.",
    modifiers: { maxHpPct: 0.12 },
  }),
  freezeItem({
    id: "cinder-wrap",
    slot: "armor",
    name: "CINDER WRAP",
    description: "Light layered armor that preserves movement speed.",
    modifiers: { speedPct: 0.06 },
  }),
  freezeItem({
    id: "impact-lining",
    slot: "armor",
    name: "IMPACT LINING",
    description: "Balanced reinforcement for endurance and mobility.",
    modifiers: { maxHpPct: 0.07, speedPct: 0.03 },
  }),
  freezeItem({
    id: "brass-seal",
    slot: "ring",
    name: "BRASS SEAL",
    description: "Machined focus ring that improves strike precision.",
    modifiers: { critChance: 0.04 },
  }),
  freezeItem({
    id: "ash-circuit",
    slot: "ring",
    name: "ASH CIRCUIT",
    description: "Conductive band that raises outgoing pressure.",
    modifiers: { damagePct: 0.06 },
  }),
  freezeItem({
    id: "roaster-sigil",
    slot: "relic",
    name: "ROASTER SIGIL",
    description: "A calibrated insignia that accelerates attack rhythm.",
    modifiers: { attackSpeedPct: 0.05 },
  }),
  freezeItem({
    id: "void-locket",
    slot: "relic",
    name: "VOID LOCKET",
    description: "Compressed chamber relic that drives shots through targets.",
    modifiers: { pierce: 1 },
  }),
]);

const ITEM_BY_ID = new Map(EQUIPMENT_ITEMS.map((item) => [item.id, item]));

const STARTER_INVENTORY = Object.freeze([
  Object.freeze({ instanceId: "starter-weapon", itemId: "tempered-grip", rarity: "common", level: 1 }),
  Object.freeze({ instanceId: "starter-armor", itemId: "kiln-coat", rarity: "common", level: 1 }),
  Object.freeze({ instanceId: "starter-ring", itemId: "brass-seal", rarity: "common", level: 1 }),
  Object.freeze({ instanceId: "starter-relic", itemId: "roaster-sigil", rarity: "common", level: 1 }),
]);

const STARTER_LOADOUT = Object.freeze({
  weapon: "starter-weapon",
  armor: "starter-armor",
  ring: "starter-ring",
  relic: "starter-relic",
});

const MODIFIER_LABELS = Object.freeze({
  damagePct: "DAMAGE",
  maxHpPct: "HEALTH",
  speedPct: "MOVE SPEED",
  attackSpeedPct: "ATTACK SPEED",
  critChance: "CRITICAL",
  pierce: "PIERCE",
});

function safeItemLevel(value) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(50, Math.max(1, Math.floor(value)));
}

function cloneInstance(instance) {
  return {
    instanceId: instance.instanceId,
    itemId: instance.itemId,
    rarity: instance.rarity,
    level: instance.level,
  };
}

function normalizeInstance(input) {
  if (!input || typeof input !== "object") {
    return null;
  }
  if (typeof input.instanceId !== "string" || !SAFE_INSTANCE_ID.test(input.instanceId)) {
    return null;
  }
  if (typeof input.itemId !== "string" || !ITEM_BY_ID.has(input.itemId)) {
    return null;
  }
  if (typeof input.rarity !== "string" || !EQUIPMENT_RARITIES[input.rarity]) {
    return null;
  }

  return {
    instanceId: input.instanceId,
    itemId: input.itemId,
    rarity: input.rarity,
    level: safeItemLevel(input.level),
  };
}

export function createDefaultEquipmentState() {
  return {
    inventory: STARTER_INVENTORY.map(cloneInstance),
    loadout: { ...STARTER_LOADOUT },
  };
}

export function normalizeEquipmentState(input = {}) {
  const candidate = input && typeof input === "object" ? input : {};
  const inventory = STARTER_INVENTORY.map(cloneInstance);
  const seenIds = new Set(inventory.map((item) => item.instanceId));

  if (Array.isArray(candidate.inventory)) {
    for (const rawItem of candidate.inventory) {
      if (inventory.length >= MAX_INVENTORY_ITEMS) {
        break;
      }

      const item = normalizeInstance(rawItem);
      if (!item || seenIds.has(item.instanceId)) {
        continue;
      }

      seenIds.add(item.instanceId);
      inventory.push(item);
    }
  }

  const inventoryById = new Map(inventory.map((item) => [item.instanceId, item]));
  const sourceLoadout = candidate.loadout && typeof candidate.loadout === "object"
    ? candidate.loadout
    : {};
  const loadout = {};

  for (const slot of EQUIPMENT_SLOTS) {
    const instanceId = sourceLoadout[slot];
    const instance = typeof instanceId === "string" ? inventoryById.get(instanceId) : null;
    const definition = instance ? getEquipmentDefinition(instance.itemId) : null;
    loadout[slot] = definition?.slot === slot ? instance.instanceId : STARTER_LOADOUT[slot];
  }

  return { inventory, loadout };
}

export function getEquipmentDefinition(itemId) {
  return ITEM_BY_ID.get(itemId) ?? null;
}

export function getRarityDefinition(rarityId) {
  return EQUIPMENT_RARITIES[rarityId] ?? null;
}

export function getEquippedItem(inventory, loadout, slot) {
  if (!EQUIPMENT_SLOT_SET.has(slot) || !Array.isArray(inventory)) {
    return null;
  }

  const instanceId = loadout && typeof loadout === "object" ? loadout[slot] : null;
  return inventory.find((item) => item.instanceId === instanceId) ?? null;
}

export function getScaledItemModifiers(instance) {
  const definition = getEquipmentDefinition(instance?.itemId);
  const rarity = getRarityDefinition(instance?.rarity);
  if (!definition || !rarity) {
    return {};
  }

  const levelFactor = 1 + (safeItemLevel(instance.level) - 1) * 0.03;
  const scale = rarity.multiplier * levelFactor;
  return Object.fromEntries(
    Object.entries(definition.modifiers).map(([key, value]) => [
      key,
      key === "pierce" ? Math.max(1, Math.floor(value * scale)) : value * scale,
    ]),
  );
}

export function getLoadoutModifiers(inventory, loadout) {
  const modifiers = {
    damagePct: 0,
    maxHpPct: 0,
    speedPct: 0,
    attackSpeedPct: 0,
    critChance: 0,
    pierce: 0,
  };

  for (const slot of EQUIPMENT_SLOTS) {
    const item = getEquippedItem(inventory, loadout, slot);
    for (const [key, value] of Object.entries(getScaledItemModifiers(item))) {
      if (Object.hasOwn(modifiers, key) && Number.isFinite(value)) {
        modifiers[key] += value;
      }
    }
  }

  return Object.freeze(modifiers);
}

export function formatEquipmentEffects(instance) {
  const effects = [];
  for (const [key, value] of Object.entries(getScaledItemModifiers(instance))) {
    const label = MODIFIER_LABELS[key];
    if (!label) {
      continue;
    }
    effects.push(key === "pierce"
      ? `${label} +${Math.round(value)}`
      : `${label} +${Math.round(value * 100)}%`);
  }
  return effects.join(" // ");
}

function defaultInstanceIdFactory() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `loot-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

function pickRarity(rng, bossDefeated) {
  const roll = rng.next();
  if (bossDefeated) {
    if (roll < 0.1) return "epic";
    if (roll < 0.45) return "rare";
    return "common";
  }
  if (roll < 0.05) return "epic";
  if (roll < 0.25) return "rare";
  return "common";
}

export function rollEquipmentDrop(
  rng,
  { roomsCleared, bossDefeated, idFactory = defaultInstanceIdFactory },
) {
  if (!rng || typeof rng.next !== "function" || typeof rng.pick !== "function") {
    throw new TypeError("Equipment drops require a compatible random generator");
  }
  if (!Number.isInteger(roomsCleared) || roomsCleared < 0 || typeof bossDefeated !== "boolean") {
    throw new TypeError("Equipment drop metrics are invalid");
  }

  const dropChance = Math.min(0.55, roomsCleared * 0.09);
  if (!bossDefeated && rng.next() >= dropChance) {
    return null;
  }

  const instanceId = idFactory();
  if (typeof instanceId !== "string" || !SAFE_INSTANCE_ID.test(instanceId)) {
    throw new TypeError("Equipment instance id is invalid");
  }

  const definition = rng.pick(EQUIPMENT_ITEMS);
  return Object.freeze({
    instanceId,
    itemId: definition.id,
    rarity: pickRarity(rng, bossDefeated),
    level: 1,
  });
}

export function validateEquipmentCatalog(items = EQUIPMENT_ITEMS) {
  const errors = [];
  const ids = new Set();
  for (const item of items) {
    if (!item || typeof item.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(item.id) || ids.has(item.id)) {
      errors.push(`Invalid or duplicate equipment id: ${item?.id}`);
    }
    ids.add(item?.id);
    if (!EQUIPMENT_SLOT_SET.has(item?.slot)) {
      errors.push(`Equipment ${item?.id} has an invalid slot`);
    }
    if (!item?.modifiers || Object.values(item.modifiers).some((value) => !Number.isFinite(value) || value <= 0)) {
      errors.push(`Equipment ${item?.id} has invalid modifiers`);
    }
  }
  return Object.freeze(errors);
}
