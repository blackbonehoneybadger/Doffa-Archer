import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_TOUR_ID,
  ENEMY_CATALOG,
  TOURS,
  getEnemyDefinition,
  getRoomDefinition,
  getTourDefinition,
  validateContentCatalog,
} from "../src/game/content.js";

test("the production content catalog has valid tour and boss boundaries", () => {
  assert.deepEqual(validateContentCatalog(), []);
  assert.equal(TOURS.length, 5);

  const tour = getTourDefinition(DEFAULT_TOUR_ID);
  assert.equal(tour.rooms.length, 50);
  assert.equal(getRoomDefinition(DEFAULT_TOUR_ID, 1).name, "ROOTWAKE LANDING");
  assert.equal(getRoomDefinition(DEFAULT_TOUR_ID, 1).waves.length, 1);
  assert.equal(getRoomDefinition(DEFAULT_TOUR_ID, 1).enemies.length, 2);
  assert.equal(getRoomDefinition(DEFAULT_TOUR_ID, 1).reward, "ability");
  assert.equal(getRoomDefinition(DEFAULT_TOUR_ID, 4).waves.length, 2);
  assert.equal(tour.rooms.filter((room) => room.reward === "ability").length, 1);
  assert.equal(Object.isFrozen(getRoomDefinition(DEFAULT_TOUR_ID, 1).waves[0]), true);
  assert.equal(Object.isFrozen(getRoomDefinition(DEFAULT_TOUR_ID, 1).obstacles[0]), true);
  assert.equal(Object.isFrozen(getRoomDefinition(DEFAULT_TOUR_ID, 1).hazards[0]), true);
  assert.equal(Object.isFrozen(getRoomDefinition(DEFAULT_TOUR_ID, 1).destructibles[0]), true);

  const safeRooms = [15, 25, 35, 45].map((roomNumber) => (
    getRoomDefinition(DEFAULT_TOUR_ID, roomNumber)
  ));
  assert.deepEqual(safeRooms.map((room) => room.roomType), ["rest", "event", "rest", "event"]);
  assert.deepEqual(safeRooms.map((room) => room.waves.length), [0, 0, 0, 0]);
  assert.deepEqual(safeRooms.map((room) => room.enemies.length), [0, 0, 0, 0]);
  assert.deepEqual(safeRooms.map((room) => room.destructibles.length), [0, 0, 0, 0]);
  assert.equal(tour.rooms.filter((room) => room.roomType === "combat" && !room.elite && !room.boss).length, 41);

  for (const roomNumber of [10, 20, 30, 40]) {
    const eliteRoom = getRoomDefinition(DEFAULT_TOUR_ID, roomNumber);
    assert.equal(eliteRoom.elite, true);
    assert.equal(eliteRoom.enemies.length, 1);
    assert.equal(getEnemyDefinition(eliteRoom.enemies[0]).elite, true);
  }

  const finalRoom = getRoomDefinition(DEFAULT_TOUR_ID, tour.rooms.length);
  assert.equal(finalRoom.boss, true);
  assert.equal(finalRoom.name, "ROOT THRONE");
  assert.equal(finalRoom.waves.length, 1);
  assert.equal(finalRoom.enemies.length, 1);
  assert.equal(getEnemyDefinition(finalRoom.enemies[0]).boss, true);
  assert.equal(Object.isFrozen(tour.rooms), true);

  for (const enemy of Object.values(ENEMY_CATALOG)) {
    assert.equal(existsSync(join(process.cwd(), enemy.art.sprite)), true, enemy.art.sprite);
    assert.equal(Object.isFrozen(enemy.art), true);
    if (enemy.art.motionSprite) {
      const motionPath = join(process.cwd(), enemy.art.motionSprite);
      const png = readFileSync(motionPath);
      assert.equal(png.readUInt32BE(16), 1152, enemy.art.motionSprite);
      assert.equal(png.readUInt32BE(20), 2016, enemy.art.motionSprite);
      assert.equal(png[25], 6, `${enemy.art.motionSprite} must be RGBA`);
      assert.deepEqual(enemy.art.motionStateRows, { idle: 0, move: 2, attack: 4 });
      assert.equal(Object.isFrozen(enemy.art.motionStateRows), true);
    }
    for (const [spriteKey, rowKey] of [
      ["specialSprite", "specialStateRows"],
      ["reactionSprite", "reactionStateRows"],
    ]) {
      if (!enemy.art[spriteKey]) {
        continue;
      }
      const atlas = readFileSync(join(process.cwd(), enemy.art[spriteKey]));
      assert.equal(atlas.readUInt32BE(16), 1152, enemy.art[spriteKey]);
      assert.equal(atlas.readUInt32BE(20), 1344, enemy.art[spriteKey]);
      assert.equal(atlas[25], 6, `${enemy.art[spriteKey]} must be RGBA`);
      assert.equal(Object.isFrozen(enemy.art[rowKey]), true);
    }
  }
});

test("Rootfall Jungle is a complete independent fifty-room tour", () => {
  const forge = getTourDefinition("forge-depths");
  const rootfall = getTourDefinition("rootfall-jungle");
  assert.ok(rootfall);
  assert.ok(forge);
  assert.equal(rootfall.unlocked, true);
  assert.equal(rootfall.code, "TOUR 02");
  assert.equal(rootfall.rooms.length, 50);
  assert.equal(rootfall.family, "rootfall_jungle");
  assert.notEqual(rootfall.family, forge.family);
  assert.notEqual(rootfall.theme, forge.theme);

  const forgeEnvironments = new Set(forge.rooms.map((room) => room.environment));
  const rootfallEnvironments = new Set(rootfall.rooms.map((room) => room.environment));
  assert.deepEqual(
    [...rootfallEnvironments].sort(),
    ["briar", "canopy", "mire", "mycelium", "rootdeep", "rootheart"],
  );
  assert.deepEqual(
    [...rootfallEnvironments].filter((environment) => forgeEnvironments.has(environment)),
    [],
  );

  assert.equal(getRoomDefinition(rootfall.id, 1).name, "ROOTWAKE LANDING");
  assert.equal(getRoomDefinition(rootfall.id, 1).reward, "ability");
  assert.equal(getRoomDefinition(rootfall.id, 49).waves.length, 3);
  assert.deepEqual(
    [15, 25, 35, 45].map((roomNumber) => getRoomDefinition(rootfall.id, roomNumber).roomType),
    ["rest", "event", "rest", "event"],
  );
  for (const roomNumber of [10, 20, 30, 40]) {
    const room = getRoomDefinition(rootfall.id, roomNumber);
    assert.equal(room.elite, true);
    assert.equal(room.enemies.length, 1);
    assert.equal(getEnemyDefinition(room.enemies[0]).family, rootfall.family);
  }

  const finalRoom = getRoomDefinition(rootfall.id, 50);
  assert.equal(finalRoom.name, "ROOT THRONE");
  assert.equal(finalRoom.boss, true);
  assert.deepEqual(finalRoom.enemies, ["rootfall_tyrant"]);
  assert.equal(getEnemyDefinition("rootfall_tyrant").identity, "kaprizard");
  assert.equal(getEnemyDefinition("rootfall_tyrant").art.renderHeight, 340);
});

test("all four standard Hollow Roastery enemies have full-direction motion", () => {
  const standardEnemyIds = [
    "ash_hound",
    "ember_oracle",
    "brass_colossus",
    "smoke_revenant",
  ];

  for (const enemyId of standardEnemyIds) {
    const enemy = getEnemyDefinition(enemyId);
    assert.ok(enemy.art.motionSprite.endsWith("-motion-v1.png"));
    assert.equal(existsSync(join(process.cwd(), enemy.art.motionSprite)), true);
  }
});

test("all four Hollow Roastery elite guardians have full-direction base motion", () => {
  const eliteEnemyIds = [
    "kiln_warden",
    "pressure_widow",
    "cinder_bishop",
    "grinder_saint",
  ];

  for (const enemyId of eliteEnemyIds) {
    const enemy = getEnemyDefinition(enemyId);
    assert.equal(enemy.elite, true);
    assert.ok(enemy.art.motionSprite.endsWith("-motion-v1.png"));
    assert.equal(existsSync(join(process.cwd(), enemy.art.motionSprite)), true);
  }
});

test("the main boss uses the locked Kaprizard identity and full-direction base motion", () => {
  const boss = getEnemyDefinition("hollow_roaster");
  assert.equal(boss.boss, true);
  assert.equal(boss.identity, "kaprizard");
  assert.equal(boss.art.sprite, "/assets/enemies/hollow-roaster-kaprizard-v3.png");
  assert.equal(boss.art.motionSprite, "/assets/enemies/hollow-roaster-motion-v2.png");
  assert.equal(boss.art.specialSprite, "/assets/enemies/hollow-roaster-special-v1.png");
  assert.deepEqual(boss.art.specialStateRows, { secondary: 0, phase: 2 });
  assert.equal(boss.art.reactionSprite, "/assets/enemies/hollow-roaster-reactions-v1.png");
  assert.deepEqual(boss.art.reactionStateRows, { hit: 0, defeat: 2 });
  assert.equal(existsSync(join(process.cwd(), boss.art.sprite)), true);
  assert.equal(existsSync(join(process.cwd(), boss.art.motionSprite)), true);
  assert.equal(existsSync(join(process.cwd(), boss.art.specialSprite)), true);
  assert.equal(existsSync(join(process.cwd(), boss.art.reactionSprite)), true);
});

test("all Rootfall enemies have distinct runtime art and behavior IDs", () => {
  const enemyIds = [
    "razor_mantis",
    "seed_spitter",
    "root_stalker",
    "spore_moth",
    "briar_jaguar",
    "mire_bellower",
    "orchid_maw",
    "strangler_ape",
    "rootfall_tyrant",
  ];
  const sprites = new Set();
  const behaviors = new Set();
  for (const enemyId of enemyIds) {
    const enemy = getEnemyDefinition(enemyId);
    assert.equal(enemy.family, "rootfall_jungle");
    assert.equal(sprites.has(enemy.art.sprite), false);
    assert.equal(behaviors.has(enemy.behavior), false);
    sprites.add(enemy.art.sprite);
    behaviors.add(enemy.behavior);
  }
});

test("all four Rootfall elite guardians have authored secondary and reaction atlases", () => {
  const eliteEnemyIds = [
    "briar_jaguar",
    "mire_bellower",
    "orchid_maw",
    "strangler_ape",
  ];

  for (const enemyId of eliteEnemyIds) {
    const enemy = getEnemyDefinition(enemyId);
    const assetStem = enemyId.replaceAll("_", "-");
    assert.equal(enemy.elite, true);
    assert.equal(enemy.boss, false);
    assert.equal(enemy.art.specialSprite, `/assets/enemies/${assetStem}-special-v1.png`);
    assert.deepEqual(enemy.art.specialStateRows, { secondary: 0, release: 2 });
    assert.equal(enemy.art.reactionSprite, `/assets/enemies/${assetStem}-reactions-v1.png`);
    assert.deepEqual(enemy.art.reactionStateRows, { hit: 0, defeat: 2 });
    assert.equal(existsSync(join(process.cwd(), enemy.art.specialSprite)), true);
    assert.equal(existsSync(join(process.cwd(), enemy.art.reactionSprite)), true);
  }
});

test("catalog validation catches cross-tour enemy reuse", () => {
  const copiedTour = {
    ...TOURS[0],
    id: "foreign-tour",
    family: "foreign-family",
  };
  const errors = validateContentCatalog([copiedTour], ENEMY_CATALOG);
  assert.equal(errors.some((error) => error.includes("does not belong")), true);
});

test("catalog validation rejects a repeated visual theme", () => {
  const copiedTour = {
    ...TOURS[0],
    id: "second-roastery",
    family: "second-family",
  };
  const errors = validateContentCatalog([TOURS[0], copiedTour], ENEMY_CATALOG);
  assert.equal(errors.some((error) => error.includes("unique visual theme")), true);
});

test("catalog validation rejects empty waves", () => {
  const brokenTour = {
    ...TOURS[0],
    rooms: [
      { ...TOURS[0].rooms[0], waves: [[]], enemies: [] },
      TOURS[0].rooms.at(-1),
    ],
  };
  const errors = validateContentCatalog([brokenTour], ENEMY_CATALOG);
  assert.equal(errors.some((error) => error.includes("empty wave")), true);
});

test("catalog validation rejects malformed animation-only enemy metadata", () => {
  const source = ENEMY_CATALOG.ash_hound;
  const enemies = {
    ...ENEMY_CATALOG,
    ash_hound: {
      ...source,
      art: {
        ...source.art,
        motionSprite: undefined,
        motionStateRows: null,
        motionAnimation: { version: 999 },
      },
    },
  };
  const errors = validateContentCatalog(TOURS, enemies);
  assert.ok(errors.some((error) => error.includes("ash_hound motion animation atlas")));
});
