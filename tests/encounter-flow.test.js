import test from "node:test";
import assert from "node:assert/strict";

import { RUN_CONFIG } from "../src/config/game-config.js";
import { SeededRng } from "../src/core/rng.js";
import { getRoomDefinition, getTourDefinition } from "../src/game/content.js";
import { DoffaGame } from "../src/game/game.js";

function createEncounterHarness(room = 1) {
  const game = Object.create(DoffaGame.prototype);
  game.mode = "running";
  game.tour = getTourDefinition();
  game.room = room;
  game.roomDefinition = getRoomDefinition(game.tour.id, game.room);
  game.wave = 1;
  game.waveCountdown = null;
  game.roomExitOpen = false;
  game.clearDelay = 0;
  game.clearedRooms = 0;
  game.enemies = [];
  game.projectiles = [{ alive: true }];
  game.particles = [];
  game.ownedAbilities = [];
  game.pointer = null;
  game.keys = new Set();
  game.player = { invulnerability: 0, radius: 20 };
  game.nextEnemyId = 1;
  game.rng = new SeededRng(7);
  game.onAbilityChoice = () => {};
  game.syncRoomAssetWindow = () => {};
  return game;
}

test("cleared waves count down before spawning the next group", () => {
  const game = createEncounterHarness(5);
  game.updateEncounterState(0);
  assert.equal(game.waveCountdown, RUN_CONFIG.waveCountdownSeconds);
  assert.equal(game.projectiles.length, 0);
  assert.equal(game.enemies.length, 0);

  game.updateEncounterState(RUN_CONFIG.waveCountdownSeconds + 0.01);
  assert.equal(game.wave, 2);
  assert.equal(game.waveCountdown, null);
  assert.equal(game.enemies.length, game.roomDefinition.waves[1].length);
});

test("the final wave opens an exit before the ability choice", () => {
  const game = createEncounterHarness();
  game.wave = game.roomDefinition.waves.length;
  game.updateEncounterState(0);
  assert.equal(game.clearDelay, 0.58);
  assert.equal(game.mode, "running");

  game.updateEncounterState(0.6);
  assert.equal(game.mode, "exit");
  assert.equal(game.roomExitOpen, true);

  let choices = null;
  game.onAbilityChoice = (nextChoices) => {
    choices = nextChoices;
  };
  game.handleRoomExit();
  assert.equal(game.mode, "choice");
  assert.equal(game.clearedRooms, 1);
  assert.equal(choices.length, RUN_CONFIG.abilityChoices);
});

test("every completed combat room opens exactly one ability choice", () => {
  const game = createEncounterHarness(2);
  game.mode = "exit";
  game.pendingAbilityChoices = 1;
  let choices = null;
  game.onAbilityChoice = (nextChoices) => { choices = nextChoices; };

  game.handleRoomExit();

  assert.equal(game.mode, "choice");
  assert.equal(game.pendingAbilityChoices, 0);
  assert.equal(choices.length, RUN_CONFIG.abilityChoices);
  assert.equal(game.room, 2);
  assert.equal(game.clearedRooms, 2);
});
