import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_HERO_ID,
  HEROES,
  createHeroCombatProfile,
  getHeroDefinition,
  getUnlockedHeroes,
  validateHeroCatalog,
} from "../src/game/heroes.js";

function readPngHeader(assetPath) {
  const file = readFileSync(assetPath);
  assert.equal(file.subarray(1, 4).toString("ascii"), "PNG");
  return {
    width: file.readUInt32BE(16),
    height: file.readUInt32BE(20),
    colorType: file.readUInt8(25),
  };
}

test("hero catalog exposes five valid prototype operatives", () => {
  assert.deepEqual(validateHeroCatalog(), []);
  assert.equal(HEROES.length, 5);
  assert.equal(getUnlockedHeroes().length, 5);
  assert.equal(getHeroDefinition(DEFAULT_HERO_ID).name, "HONEY BADGER");
  assert.equal(new Set(HEROES.map((hero) => hero.weapon)).size, HEROES.length);
  assert.equal(getHeroDefinition("boya").name, "BOY");
  assert.equal(HEROES.filter((candidate) => candidate.art).length, HEROES.length);
  for (const hero of HEROES) {
    assert.equal(existsSync(join(process.cwd(), hero.art.sprite)), true, hero.art.sprite);
    assert.equal(
      existsSync(join(process.cwd(), hero.art.directionalSprite)),
      true,
      hero.art.directionalSprite,
    );
    assert.equal(Object.keys(hero.art.directionalFrames).length, 8);
    assert.equal(existsSync(join(process.cwd(), hero.art.motionSprite)), true, hero.art.motionSprite);
    assert.equal(
      existsSync(join(process.cwd(), hero.art.fullMotionSprite)),
      true,
      hero.art.fullMotionSprite,
    );
    assert.deepEqual(hero.art.fullMotionStateRows, { idle: 0, run: 2, attack: 4 });
    if (hero.art.secondaryAttackSprite) {
      assert.equal(
        existsSync(join(process.cwd(), hero.art.secondaryAttackSprite)),
        true,
        hero.art.secondaryAttackSprite,
      );
      assert.deepEqual(
        readPngHeader(join(process.cwd(), hero.art.secondaryAttackSprite)),
        { width: 1152, height: 672, colorType: 6 },
        hero.id,
      );
    }
    assert.equal(
      existsSync(join(process.cwd(), hero.art.reactionSprite)),
      true,
      hero.art.reactionSprite,
    );
    assert.deepEqual(hero.art.reactionStateRows, { hit: 0, defeat: 2 });
    assert.deepEqual(Object.keys(hero.art.motionFrames), ["idle", "run", "attack", "hit", "defeat"]);
  }
});

test("hero validation rejects malformed animation-only metadata", () => {
  const source = HEROES[0];
  const brokenHero = {
    ...source,
    art: {
      ...source.art,
      fullMotionSprite: undefined,
      fullMotionStateRows: null,
      fullMotionAnimation: { version: 999 },
    },
  };
  const errors = validateHeroCatalog([brokenHero]);
  assert.ok(errors.some((error) => error.includes("full-motion animation atlas")));
});

test("full-direction hero atlases have the normalized RGBA runtime layout", () => {
  for (const hero of HEROES) {
    const header = readPngHeader(join(process.cwd(), hero.art.fullMotionSprite));
    assert.deepEqual(header, { width: 1152, height: 2016, colorType: 6 }, hero.id);
  }
});

test("directional reaction atlases have the normalized RGBA runtime layout", () => {
  for (const hero of HEROES) {
    const header = readPngHeader(join(process.cwd(), hero.art.reactionSprite));
    assert.deepEqual(header, { width: 1152, height: 1344, colorType: 6 }, hero.id);
  }
});

test("owner-approved identity corrections are wired through portraits and reactions", () => {
  const badger = getHeroDefinition("honey-badger");
  const hadida = getHeroDefinition("hadida");
  const boya = getHeroDefinition("boya");
  const kroo = getHeroDefinition("mr-kroo");

  assert.equal(badger.art.sprite, "/assets/heroes/honey-badger-lean-v3.png");
  assert.equal(badger.art.fullMotionSprite.endsWith("-full-motion-v3.png"), true);
  assert.equal(
    badger.art.secondaryAttackSprite,
    "/assets/heroes/honey-badger-shuriken-attack-v1.png",
  );
  assert.equal(hadida.art.sprite, "/assets/heroes/hadida-papakha-v3.png");
  assert.equal(hadida.art.reactionSprite.endsWith("-reactions-v2.png"), true);
  assert.equal(boya.art.sprite, "/assets/heroes/boy-identity-v3.png");
  assert.equal(boya.art.fullMotionSprite.endsWith("-full-motion-v3.png"), true);
  assert.equal(kroo.art.sprite, "/assets/heroes/mr-kroo-bow-v4.png");
  assert.equal(kroo.art.directionalSprite.endsWith("-directions-v4.png"), true);
  assert.equal(kroo.art.motionSprite.endsWith("-motion-v4.png"), true);
  assert.equal(kroo.art.fullMotionSprite.endsWith("-full-motion-v4.png"), true);
  assert.equal(kroo.art.reactionSprite.endsWith("-reactions-v3.png"), true);
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
  assert.equal(hadida.pierce, 1);
  assert.equal(boya.splashRadius > 0, true);
  assert.equal(boya.weaponVisual, "hammer");
  assert.equal(badger.weaponVisual, "katana");
  assert.equal(badger.secondaryWeapon.visual, "shuriken");
  assert.equal(badger.secondaryWeapon.every, 4);
  assert.equal(kroo.wallBounces, 0);
  assert.equal(kroo.pierce, 1);
  assert.equal(kroo.weaponVisual, "bow");
  assert.ok(pata.attackInterval < badger.attackInterval);
  assert.ok(pata.attackRange > badger.attackRange);
  assert.equal(pata.weaponVisual, "coffee-rifle");
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
