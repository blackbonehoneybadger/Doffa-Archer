import test from "node:test";
import assert from "node:assert/strict";

import { SeededRng } from "../src/core/rng.js";
import { DoffaGame } from "../src/game/game.js";
import { createHeroCombatProfile } from "../src/game/heroes.js";
import { applyAbility } from "../src/game/abilities.js";

function createAttackHarness(heroId, targetX) {
  const game = Object.create(DoffaGame.prototype);
  game.player = createHeroCombatProfile(heroId);
  game.player.x = 100;
  game.player.y = 200;
  game.enemies = [{ id: 1, x: targetX, y: 200, alive: true, defeated: false }];
  game.projectiles = [];
  game.particles = [];
  game.rng = new SeededRng(27);
  return game;
}

test("Mr. Kroo fires piercing arrows instead of scissors or shuriken", () => {
  const game = createAttackHarness("mr-kroo", 650);

  assert.equal(game.fireAtNearestEnemy(), true);
  assert.equal(game.projectiles.length, 1);
  assert.equal(game.projectiles[0].visual, "bow");
  assert.equal(game.projectiles[0].hitsLeft, 2);
  assert.equal(game.projectiles[0].wallBounces, 0);
});

test("Honey Badger keeps katana primary and releases shuriken as a secondary weapon", () => {
  const close = createAttackHarness("honey-badger", 280);

  for (let attack = 0; attack < 3; attack += 1) {
    assert.equal(close.fireAtNearestEnemy(), true);
  }
  assert.deepEqual(close.projectiles.map((projectile) => projectile.visual), [
    "katana",
    "katana",
    "katana",
  ]);

  assert.equal(close.fireAtNearestEnemy(), true);
  assert.equal(close.projectiles.slice(3).length, 3);
  assert.equal(close.projectiles.slice(3).every((projectile) => projectile.visual === "shuriken"), true);
  assert.equal(close.projectiles.slice(3).every((projectile) => projectile.wallBounces === 1), true);

  const distant = createAttackHarness("honey-badger", 690);
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

  assert.equal(game.fireAtNearestEnemy(), true);
  assert.equal(game.projectiles.length, 4);
  assert.equal(game.projectiles.every((projectile) => projectile.hitsLeft === 2), true);
  assert.equal(game.projectiles.every((projectile) => projectile.wallBounces === 2), true);
  assert.equal(game.projectiles.every((projectile) => projectile.radius > baseRadius), true);
  assert.equal(game.projectiles.every((projectile) => projectile.splashRadius === 36), true);
});
