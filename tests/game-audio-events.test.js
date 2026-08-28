import test from "node:test";
import assert from "node:assert/strict";

import { DoffaGame } from "../src/game/game.js";
import { createHeroCombatProfile, getHeroDefinition } from "../src/game/heroes.js";

test("hero attacks and weapon switches emit weapon-specific audio events", () => {
  const game = Object.create(DoffaGame.prototype);
  const events = [];
  game.hero = getHeroDefinition("honey-badger");
  game.player = createHeroCombatProfile("honey-badger");
  game.player.x = 100;
  game.player.y = 200;
  game.enemies = [{ id: 1, x: 210, y: 200, alive: true, defeated: false, hp: 500, maxHp: 500 }];
  game.destructibles = [];
  game.projectiles = [];
  game.particles = [];
  game.rng = { next: () => 0.9 };
  game.damageEnemy = () => {};
  game.emitHud = () => {};
  game.onAudio = (event, details) => events.push([event, details]);

  assert.equal(game.fireAtNearestEnemy(), true);
  assert.equal(events[0][0], "heroAttack");
  assert.equal(events[0][1].visual, "katana");
  game.player.weaponSwitchCooldown = 0;
  assert.equal(game.selectWeapon("ranged"), true);
  assert.equal(events.at(-1)[0], "weaponSwitch");
  assert.equal(events.at(-1)[1].visual, "shuriken");
});

test("enemy windup, release, and boss phase emit distinct audio priorities", () => {
  const game = Object.create(DoffaGame.prototype);
  const events = [];
  game.onAudio = (event, details) => events.push([event, details]);
  const enemy = {
    type: "ember_oracle",
    state: "channel",
    stateTimer: 0.48,
    attackAnimation: 0,
    attackPattern: "ember-shot",
    isElite: false,
    isBoss: false,
    facing: 0,
  };

  game.cueEnemyAttack(enemy, 0.48);
  enemy.attackAnimation = 0;
  enemy.stateTimer = 0;
  game.cueEnemyAttack(enemy, 0.24);
  enemy.type = "hollow_roaster";
  enemy.state = "boss-phase";
  enemy.stateTimer = 0.92;
  enemy.attackAnimation = 0;
  enemy.isBoss = true;
  game.cueEnemyAttack(enemy, 0.92);

  assert.deepEqual(events.map(([event]) => event), ["enemyTelegraph", "enemyAttack", "bossPhase"]);
});

test("nonlethal and lethal player damage emit different sound events", () => {
  const game = Object.create(DoffaGame.prototype);
  const events = [];
  game.mode = "running";
  game.hero = getHeroDefinition("hadida");
  game.player = createHeroCombatProfile("hadida");
  game.projectiles = [];
  game.keys = new Set();
  game.rng = { next: () => 0.9 };
  game.spawnCombatText = () => {};
  game.spawnParticles = () => {};
  game.onVoice = () => {};
  game.onAudio = (event) => events.push(event);

  game.damagePlayer(5);
  game.player.invulnerability = 0;
  game.player.hp = 1;
  game.damagePlayer(10);
  assert.deepEqual(events, ["playerHit", "playerDefeat"]);
});
