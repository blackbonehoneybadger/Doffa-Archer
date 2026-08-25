import test from "node:test";
import assert from "node:assert/strict";

import {
  ECONOMY,
  calculateWagerPayout,
  normalizeWager,
} from "../src/core/economy.js";
import {
  ENEMY_CATALOG,
  KAPRIZARD_BOSS_IDENTITY,
  TOURS,
} from "../src/game/content.js";
import { HEROES } from "../src/game/heroes.js";
import { getHeroWeaponPair } from "../src/game/hero-weapons.js";
import { getRoomCompositeIdentity } from "../src/game/room-art.js";
import { getRoomTradeoffs } from "../src/game/room-tradeoffs.js";
import {
  SUPPORTED_LOCALES,
  normalizeLocale,
  translate,
} from "../src/i18n/locales.js";

test("the menu exposes twelve languages with Russian as the safe default", () => {
  assert.equal(SUPPORTED_LOCALES.length, 12);
  assert.equal(new Set(SUPPORTED_LOCALES.map(([code]) => code)).size, 12);
  assert.equal(normalizeLocale("unknown"), "ru");
  assert.equal(translate("ru", "enter"), "НАЧАТЬ");
  assert.notEqual(translate("ar", "enter"), "НАЧАТЬ");
});

test("tour wagers burn on defeat and double on victory", () => {
  for (const wager of [ECONOMY.minimumWager, 37, 1_000, ECONOMY.maximumWager]) {
    assert.equal(normalizeWager(wager), wager);
    assert.equal(calculateWagerPayout({ wager, bossDefeated: false }), 0);
    assert.equal(calculateWagerPayout({ wager, bossDefeated: true }), wager * 2);
  }
  assert.equal(normalizeWager(0), ECONOMY.minimumWager);
  assert.equal(normalizeWager(12.9), 12);
});

test("all five heroes have portraits and two distinct manual weapons", () => {
  for (const hero of HEROES) {
    assert.match(hero.art.portraitSprite, /^\/assets\/heroes\/portraits\/.+\.png$/);
    const pair = getHeroWeaponPair(hero);
    assert.ok(pair?.melee?.icon);
    assert.ok(pair?.ranged?.icon);
    assert.notEqual(pair.melee.visual, pair.ranged.visual);
  }
});

test("every authored room has a unique visual composite identity", () => {
  const signatures = TOURS.flatMap((tour) => tour.rooms.map((room, index) => (
    JSON.stringify(getRoomCompositeIdentity(room.id, index + 1))
  )));
  assert.equal(signatures.length, 100);
  assert.equal(new Set(signatures).size, signatures.length);
});

test("safe rooms always offer two choices with both a benefit and a cost", () => {
  const safeRooms = TOURS.flatMap((tour) => tour.rooms.filter((room) => room.roomType !== "combat"));
  assert.equal(safeRooms.length, 8);
  for (const room of safeRooms) {
    const choices = getRoomTradeoffs(room.id);
    assert.equal(choices.length, 2, room.id);
    for (const choice of choices) {
      assert.match(choice.description, /Gain|Restore/);
      assert.match(choice.description, /Lose/);
    }
  }
});

test("every tour boss keeps Kaprizard's exposed head but changes body and attacks", () => {
  const bosses = Object.values(ENEMY_CATALOG).filter((enemy) => enemy.boss);
  assert.equal(bosses.length, TOURS.length);
  for (const boss of bosses) {
    assert.equal(boss.identity, KAPRIZARD_BOSS_IDENTITY.id);
    assert.equal(boss.headIdentity, KAPRIZARD_BOSS_IDENTITY.headIdentity);
    assert.equal(boss.faceExposed, true);
  }
  assert.equal(new Set(bosses.map((boss) => boss.bodySignature)).size, bosses.length);
  assert.equal(new Set(bosses.map((boss) => boss.attackSignature)).size, bosses.length);
  assert.equal(new Set(bosses.map((boss) => boss.locomotionSignature)).size, bosses.length);
});
