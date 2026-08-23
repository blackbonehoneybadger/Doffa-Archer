import test from "node:test";
import assert from "node:assert/strict";

import { DoffaGame } from "../src/game/game.js";

function createHarness() {
  const game = Object.create(DoffaGame.prototype);
  game.mode = "running";
  game.roomDefinition = {
    obstacles: [{ x: 100, y: 100, width: 80, height: 60 }],
    hazards: [{
      x: 300,
      y: 400,
      radius: 40,
      interval: 3,
      activeDuration: 1,
      phase: 0,
      damage: 9,
    }],
  };
  game.player = {
    x: 300,
    y: 400,
    radius: 20,
    hp: 100,
    invulnerability: 0,
    accent: "#e6b461",
  };
  game.particles = [];
  game.rng = { next: () => 0.5 };
  game.hazardClock = 0.2;
  game.hazardDamageCooldown = 0;
  return game;
}

test("solid obstacles block enemy fire and consume a friendly ricochet", () => {
  const game = createHarness();
  const friendly = {
    x: 95,
    y: 130,
    vx: 100,
    vy: 0,
    radius: 10,
    friendly: true,
    wallBounces: 1,
    alive: true,
    color: "#e6b461",
  };
  game.handleProjectileObstacles(friendly);
  assert.equal(friendly.alive, true);
  assert.equal(friendly.wallBounces, 0);
  assert.equal(friendly.vx, -100);

  const hostile = {
    x: 95,
    y: 130,
    vx: 100,
    vy: 0,
    radius: 10,
    friendly: false,
    alive: true,
  };
  game.handleProjectileObstacles(hostile);
  assert.equal(hostile.alive, false);
});

test("an active floor hazard damages once and starts its cooldown", () => {
  const game = createHarness();
  game.updateHazards();
  assert.equal(game.player.hp, 91);
  assert.equal(game.hazardDamageCooldown, 0.82);

  game.updateHazards();
  assert.equal(game.player.hp, 91);
});
