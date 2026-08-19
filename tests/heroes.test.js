import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_HERO_ID,
  HEROES,
  createHeroCombatProfile,
  getHeroDefinition,
  getUnlockedHeroes,
  validateHeroCatalog,
} from "../src/game/heroes.js";

test("hero catalog exposes five valid prototype operatives", () => {
  assert.deepEqual(validateHeroCatalog(), []);
  assert.equal(HEROES.length, 5);
  assert.equal(getUnlockedHeroes().length, 5);
  assert.equal(getHeroDefinition(DEFAULT_HERO_ID).name, "HONEY BADGER");
  assert.equal(new Set(HEROES.map((hero) => hero.weapon)).size, HEROES.length);
});

test("every hero creates an isolated combat profile", () => {
  const profiles = HEROES.map((hero) => createHeroCombatProfile(hero.id));
  assert.equal(new Set(profiles.map((profile) => profile.weaponVisual)).size, HEROES.length);
  assert.equal(new Set(profiles.map((profile) => profile.attackRange)).size, HEROES.length);

  profiles[0].damage = 999;
  assert.notEqual(createHeroCombatProfile(HEROES[0].id).damage, 999);
});

test("prototype heroes have materially different combat roles", () => {
  const badger = createHeroCombatProfile("honey-badger");
  const hadida = createHeroCombatProfile("hadida");
  const boya = createHeroCombatProfile("boya");
  const kroo = createHeroCombatProfile("mr-kroo");
  const pata = createHeroCombatProfile("pata");

  assert.ok(hadida.maxHp > badger.maxHp);
  assert.equal(hadida.splashRadius > 0, true);
  assert.equal(boya.projectileCount, 2);
  assert.equal(kroo.wallBounces, 1);
  assert.ok(pata.attackInterval < badger.attackInterval);
  assert.ok(pata.attackRange > badger.attackRange);
});

test("hero levels and equipped modifiers are applied to an isolated run snapshot", () => {
  const baseline = createHeroCombatProfile("honey-badger");
  const upgraded = createHeroCombatProfile("honey-badger", {
    level: 6,
    modifiers: {
      damagePct: 0.2,
      maxHpPct: 0.15,
      speedPct: 0.1,
      attackSpeedPct: 0.25,
      critChance: 0.05,
      pierce: 1,
    },
  });

  assert.equal(upgraded.heroLevel, 6);
  assert.ok(upgraded.damage > baseline.damage);
  assert.ok(upgraded.maxHp > baseline.maxHp);
  assert.ok(upgraded.speed > baseline.speed);
  assert.ok(upgraded.attackInterval < baseline.attackInterval);
  assert.equal(upgraded.pierce, baseline.pierce + 1);
  assert.ok(upgraded.critChance > baseline.critChance);
});
