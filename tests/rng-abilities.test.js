import test from "node:test";
import assert from "node:assert/strict";

import { SeededRng } from "../src/core/rng.js";
import { ABILITIES, applyAbility, chooseAbilityCards } from "../src/game/abilities.js";

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

test("run-progression abilities modify pickup, recovery, defense, and impact profiles", () => {
  const player = {
    pickupRadius: 92,
    pickupSpeed: 520,
    healOnRoomClearPct: 0,
    damageReduction: 0,
    projectileRadius: 8,
    splashRadius: 0,
    damage: 20,
  };
  applyAbility(player, "magnetic_draft");
  applyAbility(player, "recovery_drip");
  applyAbility(player, "pressure_shell");
  applyAbility(player, "deep_roast");
  assert.equal(player.pickupRadius, 202);
  assert.equal(player.pickupSpeed, 650);
  assert.equal(player.healOnRoomClearPct, 0.05);
  assert.equal(player.damageReduction, 0.12);
  assert.equal(player.projectileRadius, 10.8);
  assert.equal(player.splashRadius, 36);
  assert.ok(Math.abs(player.damage - 18.8) < 1e-9);
});

test("the Doffa ability pool covers Archero-style trajectories, elements, defense, and recovery", () => {
  assert.equal(ABILITIES.length, 24);
  assert.deepEqual(new Set(ABILITIES.map(({ tier }) => tier)), new Set(["S", "A", "B"]));
  for (const category of ["trajectory", "element", "survival", "recovery", "melee"]) {
    assert.equal(ABILITIES.some((candidate) => candidate.category === category), true, category);
  }
  const player = {
    damage: 100, extraShotAngles: [], chainDamagePct: 0, burnDamagePct: 0,
    frostSlowPct: 0, poisonDamagePct: 0, bloodThirstPct: 0, rageMaxPct: 0,
    meleeDamagePct: 0, meleeRangePct: 0, critMultiplier: 2,
  };
  for (const id of ["cross_pressure", "chain_arc", "cinder_coat", "frost_lock", "toxic_roast", "blood_thirst", "rage_boiler", "tempered_edge", "execution_pressure"]) {
    applyAbility(player, id);
  }
  assert.equal(player.extraShotAngles.length, 2);
  assert.equal(player.chainDamagePct, 0.32);
  assert.equal(player.frostSlowPct, 0.38);
  assert.equal(player.bloodThirstPct, 0.012);
  assert.equal(player.critMultiplier, 2.55);
});
