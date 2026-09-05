import test from "node:test";
import assert from "node:assert/strict";

import { SeededRng } from "../src/core/rng.js";
import { DoffaGame } from "../src/game/game.js";
import { createHeroCombatProfile, getHeroDefinition } from "../src/game/heroes.js";
import { applyAbility } from "../src/game/abilities.js";

function createAttackHarness(heroId, targetX) {
  const game = Object.create(DoffaGame.prototype);
  game.player = createHeroCombatProfile(heroId);
  game.player.x = 100;
  game.player.y = 200;
  game.enemies = [{
    id: 1, x: targetX, y: 200, alive: true, defeated: false,
    hp: 500, maxHp: 500,
  }];
  game.destructibles = [];
  game.projectiles = [];
  game.particles = [];
  game.rng = new SeededRng(27);
  game.hero = getHeroDefinition(heroId);
  game.emitHud = () => {};
  game.onVoice = () => {};
  game.damageEnemy = (enemy, amount) => {
    enemy.hp = Math.max(0, enemy.hp - amount);
  };
  return game;
}

test("Mr. Kroo manually switches from dagger to piercing bow", () => {
  const game = createAttackHarness("mr-kroo", 650);

  assert.equal(game.fireAtNearestEnemy(), false);
  assert.equal(game.selectWeapon("ranged"), true);
  assert.equal(game.fireAtNearestEnemy(), true);
  assert.equal(game.projectiles.length, 1);
  assert.equal(game.projectiles[0].visual, "bow");
  assert.equal(game.projectiles[0].hitsLeft, 2);
  assert.equal(game.projectiles[0].wallBounces, 0);
});

test("Honey Badger keeps katana until the player selects shuriken", () => {
  const close = createAttackHarness("honey-badger", 220);

  for (let attack = 0; attack < 3; attack += 1) {
    assert.equal(close.fireAtNearestEnemy(), true);
  }
  assert.equal(close.projectiles.length, 0);
  assert.ok(close.enemies[0].hp < 500);
  assert.equal(close.player.lastAttackVisual, "katana");

  assert.equal(close.fireAtNearestEnemy(), true);
  assert.equal(close.projectiles.length, 0);

  const distant = createAttackHarness("honey-badger", 690);
  assert.equal(distant.fireAtNearestEnemy(), false);
  assert.equal(distant.selectWeapon("ranged"), true);
  assert.equal(distant.fireAtNearestEnemy(), true);
  assert.equal(distant.projectiles.length, 3);
  assert.equal(distant.projectiles.every((projectile) => projectile.visual === "shuriken"), true);
});

test("projectile abilities also upgrade Honey Badger's secondary shuriken", () => {
  const game = createAttackHarness("honey-badger", 690);
  const baseRadius = game.player.secondaryWeapon.projectileRadius;
  applyAbility(game.player, "black_volley");
  applyAbility(game.player, "pressure_bore");
  applyAbility(game.player, "brass_return");
  applyAbility(game.player, "deep_roast");
  assert.equal(game.selectWeapon("ranged"), true);

  assert.equal(game.fireAtNearestEnemy(), true);
  assert.equal(game.projectiles.length, 4);
  assert.equal(game.projectiles.every((projectile) => projectile.hitsLeft === 2), true);
  assert.equal(game.projectiles.every((projectile) => projectile.wallBounces === 2), true);
  assert.equal(game.projectiles.every((projectile) => projectile.radius > baseRadius), true);
  assert.equal(game.projectiles.every((projectile) => projectile.splashRadius === 36), true);
});

test("a ranged finisher keeps its firing weapon identity after a later switch", () => {
  const game = createAttackHarness("mr-kroo", 650);
  const voiceEvents = [];
  game.onVoice = (event) => voiceEvents.push(event);
  game.enemies[0].hp = 1;
  assert.equal(game.selectWeapon("ranged"), true);
  assert.equal(game.fireAtNearestEnemy(), true);
  const projectile = game.projectiles[0];
  assert.equal(projectile.sourceWeaponSlot, "ranged");

  game.player.selectedWeaponSlot = "melee";
  projectile.x = game.enemies[0].x;
  projectile.y = game.enemies[0].y;
  game.handleFriendlyProjectileHits(projectile);
  assert.deepEqual(voiceEvents, ["rangedFinisher"]);
});

test("melee hits the reachable surface of a large chest, even when its center is out of range", () => {
  const game = createAttackHarness("pata", 900);
  game.enemies = [];
  const chest = { x: 180, y: 150, width: 200, height: 100, alive: true, hp: 200 };
  game.destructibles = [chest];
  game.damageDestructible = (target, amount) => { target.hp -= amount; };
  assert.equal(game.fireAtNearestEnemy(), true);
  assert.ok(chest.hp < 200);
  chest.x = 400;
  assert.equal(game.fireAtNearestEnemy(), false);
});

test("melee reach upgrades are honored during automatic target acquisition", () => {
  const game = createAttackHarness("honey-badger", 280);
  assert.equal(game.fireAtNearestEnemy(), false);
  game.player.meleeRangePct = 0.5;
  assert.equal(game.fireAtNearestEnemy(), true);
  assert.ok(game.enemies[0].hp < 500);
});
