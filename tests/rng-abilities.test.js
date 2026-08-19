import test from "node:test";
import assert from "node:assert/strict";

import { SeededRng } from "../src/core/rng.js";
import { applyAbility, chooseAbilityCards } from "../src/game/abilities.js";

test("seeded RNG reproduces the same sequence", () => {
  const first = new SeededRng(42);
  const second = new SeededRng(42);
  assert.deepEqual(
    [first.next(), first.next(), first.next()],
    [second.next(), second.next(), second.next()],
  );
});

test("ability choices contain three unique cards", () => {
  const choices = chooseAbilityCards(new SeededRng(77), 3);
  assert.equal(choices.length, 3);
  assert.equal(new Set(choices.map((choice) => choice.id)).size, 3);
});

test("ability application mutates only the intended combat profile", () => {
  const player = {
    maxHp: 100,
    hp: 70,
    projectileCount: 1,
    damage: 20,
    pierce: 0,
    speed: 200,
    critChance: 0.1,
    attackInterval: 0.5,
    wallBounces: 0,
  };
  applyAbility(player, "black_steel");
  assert.equal(player.maxHp, 125);
  assert.equal(player.hp, 95);
});
