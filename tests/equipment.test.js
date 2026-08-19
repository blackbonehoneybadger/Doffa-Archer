import test from "node:test";
import assert from "node:assert/strict";

import {
  EQUIPMENT_ITEMS,
  EQUIPMENT_SLOTS,
  createDefaultEquipmentState,
  formatEquipmentEffects,
  getLoadoutModifiers,
  normalizeEquipmentState,
  rollEquipmentDrop,
  validateEquipmentCatalog,
} from "../src/game/equipment.js";

test("equipment catalog and starter loadout cover all four slots", () => {
  assert.deepEqual(validateEquipmentCatalog(), []);
  assert.equal(EQUIPMENT_ITEMS.length, 10);

  const state = createDefaultEquipmentState();
  assert.equal(state.inventory.length, 4);
  assert.deepEqual(Object.keys(state.loadout), EQUIPMENT_SLOTS);
  assert.equal(new Set(Object.values(state.loadout)).size, 4);
});

test("equipment normalization drops unknown records, duplicates, and invalid loadout links", () => {
  const state = normalizeEquipmentState({
    inventory: [
      { instanceId: "starter-weapon", itemId: "pressure-bore", rarity: "epic", level: 50 },
      { instanceId: "loot-1", itemId: "pressure-bore", rarity: "epic", level: 999 },
      { instanceId: "loot-1", itemId: "void-locket", rarity: "rare", level: 3 },
      { instanceId: "../bad", itemId: "kiln-coat", rarity: "common", level: 1 },
      { instanceId: "loot-2", itemId: "unknown-item", rarity: "common", level: 1 },
    ],
    loadout: {
      weapon: "loot-1",
      armor: "../bad",
      ring: "loot-1",
      relic: "missing",
    },
  });

  assert.equal(state.inventory.length, 5);
  assert.equal(state.inventory.find((item) => item.instanceId === "loot-1").level, 50);
  assert.equal(state.loadout.weapon, "loot-1");
  assert.equal(state.loadout.armor, "starter-armor");
  assert.equal(state.loadout.ring, "starter-ring");
  assert.equal(state.loadout.relic, "starter-relic");
});

test("equipped rarity bonuses produce bounded combat modifiers", () => {
  const state = normalizeEquipmentState({
    inventory: [
      { instanceId: "loot-pressure", itemId: "pressure-bore", rarity: "epic", level: 1 },
    ],
    loadout: { weapon: "loot-pressure" },
  });
  const modifiers = getLoadoutModifiers(state.inventory, state.loadout);

  assert.equal(modifiers.damagePct, 0);
  assert.equal(modifiers.maxHpPct, 0.12);
  assert.equal(modifiers.critChance, 0.04);
  assert.ok(Math.abs(modifiers.attackSpeedPct - 0.218) < 0.000001);
  assert.equal(formatEquipmentEffects(state.inventory.at(-1)), "ATTACK SPEED +17%");
});

test("boss drops are guaranteed while incomplete runs use room-based chance", () => {
  const bossRng = {
    next: () => 0.08,
    pick: (items) => items.find((item) => item.id === "void-locket"),
  };
  const bossDrop = rollEquipmentDrop(bossRng, {
    roomsCleared: 6,
    bossDefeated: true,
    idFactory: () => "loot-boss-1",
  });
  assert.deepEqual(bossDrop, {
    instanceId: "loot-boss-1",
    itemId: "void-locket",
    rarity: "epic",
    level: 1,
  });

  const failedRng = { next: () => 0.99, pick: () => EQUIPMENT_ITEMS[0] };
  assert.equal(rollEquipmentDrop(failedRng, {
    roomsCleared: 2,
    bossDefeated: false,
    idFactory: () => "loot-failed-1",
  }), null);
});
