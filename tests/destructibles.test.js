import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { SeededRng } from "../src/core/rng.js";
import { getRoomDefinition, getTourDefinition } from "../src/game/content.js";
import {
  DESTRUCTIBLE_CATALOG,
  createRuntimeDestructible,
  validateDestructibleCatalog,
} from "../src/game/destructibles.js";
import { DoffaGame } from "../src/game/game.js";
import { createHeroCombatProfile, getHeroDefinition } from "../src/game/heroes.js";

test("every standard combat district has one transparent runtime prop", () => {
  assert.deepEqual(validateDestructibleCatalog(), []);
  assert.equal(Object.keys(DESTRUCTIBLE_CATALOG).length, 10);

  for (const definition of Object.values(DESTRUCTIBLE_CATALOG)) {
    const path = join(process.cwd(), definition.art.sprite.slice(1));
    assert.equal(existsSync(path), true, definition.art.sprite);
    const png = readFileSync(path);
    assert.equal(png.readUInt32BE(16), 384, definition.art.sprite);
    assert.equal(png.readUInt32BE(20), 384, definition.art.sprite);
    assert.equal(png[25], 6, `${definition.art.sprite} must be RGBA`);
    assert.equal(Object.isFrozen(definition), true);
    assert.equal(Object.isFrozen(definition.art), true);
  }
});

test("the authored combat route places destructibles in all five districts", () => {
  const tour = getTourDefinition();
  const counts = new Map();
  for (const room of tour.rooms) {
    for (const destructible of room.destructibles) {
      counts.set(room.environment, (counts.get(room.environment) ?? 0) + 1);
      assert.equal(Object.isFrozen(destructible), true);
    }
  }

  for (const environment of ["ash", "ember", "brass", "smoke", "pressure"]) {
    assert.ok((counts.get(environment) ?? 0) >= 8, environment);
  }
  assert.equal(tour.rooms.filter((room) => room.elite && room.destructibles.length > 0).length, 0);
  assert.equal(tour.rooms.filter((room) => room.boss && room.destructibles.length > 0).length, 0);
});

test("Rootfall combat rooms use only their five organic prop families", () => {
  const tour = getTourDefinition("rootfall-jungle");
  const counts = new Map();
  for (const room of tour.rooms) {
    for (const destructible of room.destructibles) {
      const definition = DESTRUCTIBLE_CATALOG[destructible.type];
      assert.equal(definition.environment, room.environment);
      counts.set(room.environment, (counts.get(room.environment) ?? 0) + 1);
    }
  }

  for (const environment of ["canopy", "mire", "mycelium", "briar", "rootdeep"]) {
    assert.ok((counts.get(environment) ?? 0) >= 8, environment);
  }
  assert.equal(tour.rooms.filter((room) => room.roomType !== "combat" && room.destructibles.length > 0).length, 0);
  assert.equal(tour.rooms.filter((room) => room.elite && room.destructibles.length > 0).length, 0);
  assert.equal(tour.rooms.filter((room) => room.boss && room.destructibles.length > 0).length, 0);
});

function createDestructionHarness() {
  const game = Object.create(DoffaGame.prototype);
  game.roomDefinition = { obstacles: [] };
  game.destructibles = [createRuntimeDestructible({
    type: "ash_collection_crate",
    x: 100,
    y: 100,
    width: 86,
    height: 70,
    maxHp: 20,
  }, 1)];
  game.player = { accent: "#e6b461" };
  game.particles = [];
  game.combatTexts = [];
  game.pickups = [];
  game.nextCombatTextId = 1;
  game.nextPickupId = 1;
  game.rng = new SeededRng(11);
  game.score = 0;
  game.screenShake = 0;
  return game;
}

test("a live prop blocks actors and projectiles, then breaks and rewards once", () => {
  const game = createDestructionHarness();
  const actor = { x: 95, y: 130, radius: 12 };
  assert.equal(game.resolveEntityObstacles(actor), true);
  assert.ok(actor.x < 95);

  const hostile = {
    x: 95,
    y: 130,
    radius: 10,
    friendly: false,
    alive: true,
  };
  game.handleProjectileObstacles(hostile);
  assert.equal(hostile.alive, false);
  assert.equal(game.destructibles[0].hp, 20);

  const friendly = {
    x: 95,
    y: 130,
    radius: 10,
    friendly: true,
    damage: 25,
    alive: true,
    color: "#f0c979",
  };
  game.handleProjectileObstacles(friendly);
  assert.equal(friendly.alive, false);
  assert.equal(game.destructibles[0].alive, false);
  assert.equal(game.pickups.length, 1);
  assert.equal(game.pickups[0].type, "xp");
  assert.equal(game.score, DESTRUCTIBLE_CATALOG.ash_collection_crate.score);

  assert.equal(game.damageDestructible(game.destructibles[0], 100, 120, 120), false);
  assert.equal(game.pickups.length, 1);
  const freedActor = { x: 120, y: 130, radius: 12 };
  assert.equal(game.resolveEntityObstacles(freedActor), false);
});

test("melee hits and ranged shots still break props after every enemy is defeated", () => {
  const melee = createDestructionHarness();
  melee.enemies = [];
  melee.projectiles = [];
  melee.player = createHeroCombatProfile("honey-badger");
  melee.player.x = 5;
  melee.player.y = 135;
  melee.hero = getHeroDefinition("honey-badger");
  melee.emitHud = () => {};
  melee.onVoice = () => {};
  assert.equal(melee.hasAttackTargets(), true);
  assert.equal(melee.fireAtNearestEnemy(), true);
  assert.equal(melee.projectiles.length, 0);
  assert.ok(melee.destructibles[0].hp < 20);

  const ranged = createDestructionHarness();
  ranged.enemies = [];
  ranged.projectiles = [];
  ranged.player = createHeroCombatProfile("honey-badger");
  ranged.player.x = 0;
  ranged.player.y = 135;
  ranged.hero = getHeroDefinition("honey-badger");
  ranged.emitHud = () => {};
  ranged.onVoice = () => {};
  assert.equal(ranged.selectWeapon("ranged"), true);
  assert.equal(ranged.fireAtNearestEnemy(), true);
  assert.equal(ranged.projectiles.every((projectile) => projectile.visual === "shuriken"), true);
  for (let step = 0; step < 8 && ranged.destructibles[0].alive; step += 1) {
    ranged.updateProjectiles(.04);
  }
  assert.ok(ranged.destructibles[0].hp < 20);
});

function createSafeRoomHarness() {
  const game = Object.create(DoffaGame.prototype);
  game.mode = "running";
  game.tour = getTourDefinition();
  game.room = 1;
  game.player = {
    x: 360,
    y: 1050,
    radius: 20,
    hp: 40,
    maxHp: 100,
    invulnerability: 0,
    projectileCount: 1,
    damage: 10,
    pierce: 0,
    speed: 200,
    critChance: 0,
    attackInterval: 1,
    wallBounces: 0,
    pickupRadius: 90,
    pickupSpeed: 500,
    healOnRoomClearPct: 0,
    damageReduction: 0,
    projectileRadius: 8,
    splashRadius: 0,
  };
  game.enemies = [];
  game.projectiles = [];
  game.particles = [];
  game.combatTexts = [];
  game.pickups = [];
  game.destructibles = [];
  game.destructibleSprites = new Map();
  game.keys = new Set();
  game.pointer = null;
  game.ownedAbilities = [];
  game.activeAbilityChoices = new Set();
  game.roomTradeoffIds = [];
  game.pendingAbilityChoices = 0;
  game.choiceContext = null;
  game.runLevel = 1;
  game.nextCombatTextId = 1;
  game.nextDestructibleId = 1;
  game.rng = new SeededRng(17);
  game.requestRoomSprite = () => {};
  game.syncRoomAssetWindow = () => {};
  game.emitHud = () => {};
  return game;
}

test("rest and event rooms resolve safely without creating combat waves", () => {
  const rest = getRoomDefinition("hollow-roastery", 15);
  const event = getRoomDefinition("hollow-roastery", 25);
  assert.equal(rest.roomType, "rest");
  assert.equal(rest.artVariant, "cooling-reservoir");
  assert.deepEqual(rest.waves, []);
  assert.equal(event.roomType, "event");
  assert.equal(event.artVariant, "brokers-meter");
  assert.deepEqual(event.waves, []);

  const game = createSafeRoomHarness();
  let choices = [];
  game.onAbilityChoice = (nextChoices) => {
    choices = nextChoices;
  };
  game.spawnRoom(15);
  assert.equal(game.mode, "choice");
  assert.equal(game.roomExitOpen, false);
  assert.equal(game.wave, 0);
  assert.equal(game.player.hp, 40);
  assert.equal(choices.length, 2);
  assert.equal(game.chooseAbility(choices[0].id), true);
  assert.equal(game.mode, "exit");

  choices = [];
  game.room = 25;
  game.spawnRoom(25);
  assert.equal(game.mode, "choice");
  assert.equal(game.roomExitOpen, false);
  assert.equal(choices.length, 2);
  assert.equal(game.chooseAbility(choices[0].id), true);
  assert.equal(game.mode, "exit");
  assert.equal(game.roomExitOpen, true);
  assert.equal(game.room, 25);
});
