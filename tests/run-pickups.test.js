import test from "node:test";
import assert from "node:assert/strict";

import { SeededRng } from "../src/core/rng.js";
import { getTourDefinition } from "../src/game/content.js";
import { DoffaGame } from "../src/game/game.js";
import { getRunXpRequirement } from "../src/game/run-progression.js";

function createHarness() {
  const game = Object.create(DoffaGame.prototype);
  game.mode = "running";
  game.tour = getTourDefinition();
  game.room = 2;
  game.player = {
    x: 300,
    y: 400,
    radius: 24,
    hp: 100,
    maxHp: 120,
    speed: 200,
    critChance: 0.1,
    pickupRadius: 92,
    pickupSpeed: 520,
  };
  game.pickups = [];
  game.particles = [];
  game.nextPickupId = 1;
  game.runLevel = 1;
  game.runXp = 0;
  game.runXpToNext = getRunXpRequirement(1);
  game.pendingAbilityChoices = 0;
  game.choiceContext = null;
  game.ownedAbilities = [];
  game.activeAbilityChoices = new Set();
  game.pointer = null;
  game.keys = new Set();
  game.rng = new SeededRng(17);
  game.onHud = () => {};
  game.onAbilityChoice = () => {};
  game.emitHud = () => {};
  return game;
}

test("defeated enemies drop collectible run XP while elites split XP and guarantee healing", () => {
  const standardGame = createHarness();
  standardGame.rng = { next: () => 0.99 };
  standardGame.spawnEnemyRewards({
    x: 300,
    y: 400,
    xp: 8,
    isElite: false,
    isBoss: false,
  });
  assert.equal(standardGame.pickups.length, 1);
  assert.equal(standardGame.pickups[0].type, "xp");
  standardGame.updatePickups(0);
  assert.equal(standardGame.runXp, 8);
  assert.equal(standardGame.pickups[0].alive, false);

  const eliteGame = createHarness();
  eliteGame.rng = { next: () => 0.5 };
  eliteGame.spawnEnemyRewards({
    x: 320,
    y: 420,
    xp: 90,
    isElite: true,
    isBoss: false,
  });
  assert.equal(eliteGame.pickups.filter((pickup) => pickup.type === "xp").length, 4);
  assert.equal(eliteGame.pickups.filter((pickup) => pickup.type === "heal").length, 1);
  assert.equal(
    eliteGame.pickups
      .filter((pickup) => pickup.type === "xp")
      .reduce((total, pickup) => total + pickup.value, 0),
    90,
  );
});

test("recovery charges restore health without exceeding the hero maximum", () => {
  const game = createHarness();
  game.player.hp = 105;
  game.spawnPickup("heal", game.player.x, game.player.y, 30);

  game.updatePickups(0);

  assert.equal(game.player.hp, 120);
  assert.equal(game.pickups[0].alive, false);
  assert.equal(game.combatTexts[0].text, "+15");
});

test("damage reduction applies before health is removed", () => {
  const game = createHarness();
  game.player.invulnerability = 0;
  game.player.damageReduction = 0.25;

  game.damagePlayer(20);

  assert.equal(game.player.hp, 85);
  assert.equal(game.player.invulnerability, 0.48);
  assert.equal(game.player.hitAnimation, 0.2);
  assert.equal(game.combatTexts[0].text, "-15");
  assert.equal(game.screenShake, 7);
});

test("lethal damage holds the defeat pose before closing the run", () => {
  const game = createHarness();
  game.player.hp = 10;
  game.player.invulnerability = 0;
  game.projectiles = [{ alive: true }];
  game.combatTexts = [];
  let finished = false;
  game.finishRun = () => {
    finished = true;
  };

  game.damagePlayer(20);

  assert.equal(game.mode, "dying");
  assert.equal(game.player.hp, 0);
  assert.equal(game.player.animationState, "defeat");
  assert.equal(game.projectiles[0].alive, false);
  assert.equal(finished, false);

  game.updateDying(0.7);
  assert.equal(finished, false);
  game.updateDying(0.03);
  assert.equal(finished, true);
});

test("combat numbers rise and expire without touching gameplay state", () => {
  const game = createHarness();
  game.combatTexts = [];
  game.nextCombatTextId = 1;
  game.spawnCombatText("42", 300, 410, "#fff0c2", 24);

  game.updateCombatTexts(0.2);

  assert.equal(game.combatTexts.length, 1);
  assert.equal(game.combatTexts[0].id, 1);
  assert.equal(game.combatTexts[0].text, "42");
  assert.equal(game.combatTexts[0].y, 399.2);
  assert.ok(Math.abs(game.combatTexts[0].life - 0.52) < 1e-9);
  assert.equal(game.player.hp, 100);
});

test("run level-up never interrupts the active room", () => {
  const game = createHarness();
  game.runXp = 35;
  let choiceContext = null;
  game.onAbilityChoice = (choices, context) => {
    choiceContext = context;
  };

  const result = game.grantRunExperience(10);
  assert.equal(result.levelsGained, 1);
  assert.equal(game.mode, "running");
  assert.equal(game.room, 2);
  assert.equal(game.pendingAbilityChoices, 1);
  assert.equal(choiceContext, null);
});

test("multiple levels collapse into one room-clear ability choice", () => {
  const game = createHarness();
  let choiceCount = 0;
  let offeredChoices = [];
  game.onAbilityChoice = (choices) => {
    choiceCount += 1;
    offeredChoices = choices;
  };

  game.grantRunExperience(115);
  assert.equal(game.runLevel, 3);
  assert.equal(game.pendingAbilityChoices, 1);
  assert.equal(choiceCount, 0);

  game.mode = "exit";
  game.roomDefinition = { roomType: "combat" };
  game.clearedRooms = 1;
  game.onAudio = () => {};
  game.persistActiveRunCheckpoint = () => {};
  game.handleRoomExit();
  assert.equal(game.mode, "choice");
  assert.equal(game.pendingAbilityChoices, 0);
  assert.equal(choiceCount, 1);
  assert.equal(offeredChoices.length, 3);
});
