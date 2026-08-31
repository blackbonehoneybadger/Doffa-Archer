import test from "node:test";
import assert from "node:assert/strict";

import { ENEMY_CATALOG, TOURS } from "../src/game/content.js";
import {
  MAX_AUTHORED_TOUR_ROOM,
  getEnemyDifficultyProfile,
} from "../src/game/enemy-difficulty.js";
import { DoffaGame } from "../src/game/game.js";

function createEnemyAtRoom(type, roomNumber, tourTier = 1) {
  const game = Object.create(DoffaGame.prototype);
  game.nextEnemyId = 1;
  game.rng = { next: () => 0.5 };
  game.tour = { difficultyTier: tourTier };
  return game.createEnemy(type, 300, 320, roomNumber);
}

test("enemy behavior identities are unique across the complete catalog", () => {
  const enemies = Object.values(ENEMY_CATALOG);
  const behaviors = enemies.map((enemy) => enemy.behavior);
  assert.equal(new Set(behaviors).size, enemies.length);
});

test("standard enemy difficulty rises on four bounded gameplay axes", () => {
  const first = createEnemyAtRoom("ash_hound", 1);
  const middle = createEnemyAtRoom("ash_hound", 25);
  const final = createEnemyAtRoom("ash_hound", 50);

  for (const key of ["hp", "speed", "contactDamage", "attackRateMultiplier"]) {
    assert.ok(first[key] < middle[key], `${key} must rise by the middle of a tour`);
    assert.ok(middle[key] < final[key], `${key} must rise by the end of a tour`);
  }
  assert.ok(final.speed / first.speed <= 1.12 + Number.EPSILON);
  assert.ok(final.contactDamage / first.contactDamage <= 1.31);
  assert.ok(final.attackRateMultiplier / first.attackRateMultiplier <= 1.22 + Number.EPSILON);
});

test("elite and boss pressure rises without shortening authored telegraphs", () => {
  const earlyElite = createEnemyAtRoom("kiln_warden", 10);
  const lateElite = createEnemyAtRoom("kiln_warden", 40);
  assert.ok(lateElite.hp > earlyElite.hp);
  assert.ok(lateElite.speed > earlyElite.speed);
  assert.ok(lateElite.contactDamage > earlyElite.contactDamage);
  assert.ok(lateElite.attackRateMultiplier > earlyElite.attackRateMultiplier);
  assert.equal(lateElite.telegraphDuration, earlyElite.telegraphDuration);

  const earlyBoss = createEnemyAtRoom("hollow_roaster", 1);
  const finalBoss = createEnemyAtRoom("hollow_roaster", 50);
  assert.ok(finalBoss.hp > earlyBoss.hp, "boss endurance must rise through the tour");
  assert.ok(finalBoss.speed > earlyBoss.speed);
  assert.ok(finalBoss.contactDamage > earlyBoss.contactDamage);
  assert.ok(finalBoss.attackRateMultiplier > earlyBoss.attackRateMultiplier);
  assert.equal(finalBoss.telegraphDuration, earlyBoss.telegraphDuration);
});

test("Rootfall tier is materially harder than the opening tour", () => {
  const roastery = createEnemyAtRoom("ash_hound", 25, 1);
  const jungle = createEnemyAtRoom("ash_hound", 25, 2);
  assert.ok(jungle.hp > roastery.hp);
  assert.ok(jungle.speed > roastery.speed);
  assert.ok(jungle.contactDamage > roastery.contactDamage);
  assert.ok(jungle.attackRateMultiplier > roastery.attackRateMultiplier);
});

test("difficulty normalization is deterministic and capped at room fifty", () => {
  assert.deepEqual(
    getEnemyDifficultyProfile(5.99),
    getEnemyDifficultyProfile(5),
  );
  assert.deepEqual(
    getEnemyDifficultyProfile(Number.POSITIVE_INFINITY),
    getEnemyDifficultyProfile(1),
  );
  assert.deepEqual(
    getEnemyDifficultyProfile(5_000, { elite: true }),
    getEnemyDifficultyProfile(MAX_AUTHORED_TOUR_ROOM, { elite: true }),
  );
});

test("each ten-room sector is harder than the previous sector in both tours", () => {
  for (const tour of TOURS) {
    const sectorPressure = Array.from({ length: 5 }, (_, sectorIndex) => {
      const pressure = [];
      const firstRoomIndex = sectorIndex * 10;
      for (let roomIndex = firstRoomIndex; roomIndex < firstRoomIndex + 10; roomIndex += 1) {
        const room = tour.rooms[roomIndex];
        if (room.roomType !== "combat") continue;
        const difficulty = getEnemyDifficultyProfile(roomIndex + 1, {
          elite: room.elite,
          boss: room.boss,
        });
        const encounterPressure = room.enemies.reduce((total, enemyId) => {
          const enemy = ENEMY_CATALOG[enemyId];
          const endurance = enemy.hp * difficulty.hpMultiplier;
          const pursuit = enemy.speed * difficulty.speedMultiplier;
          const impact = enemy.contactDamage * difficulty.contactDamageMultiplier;
          return total + endurance * (impact + pursuit / 10) * difficulty.attackRateMultiplier;
        }, 0);
        pressure.push(encounterPressure);
      }
      return pressure.reduce((total, value) => total + value, 0) / pressure.length;
    });

    for (let sectorIndex = 1; sectorIndex < sectorPressure.length; sectorIndex += 1) {
      assert.ok(
        sectorPressure[sectorIndex] > sectorPressure[sectorIndex - 1],
        `${tour.id} sector ${sectorIndex + 1} must exceed sector ${sectorIndex}`,
      );
    }
  }
});

test("room progression accelerates enemy attack timers at runtime", () => {
  const game = Object.create(DoffaGame.prototype);
  game.player = { x: 700, y: 1_200, radius: 20 };
  game.roomDefinition = { obstacles: [] };
  game.enemies = [createEnemyAtRoom("ash_hound", 50)];
  game.enemies[0].behavior = "test-noop";
  game.enemies[0].attackTimer = 1;
  game.enemies[0].x = 100;
  game.enemies[0].y = 200;

  game.updateEnemies(0.5);

  assert.ok(game.enemies[0].attackTimer < 0.5);
  assert.equal(game.enemies[0].telegraphDuration, ENEMY_CATALOG.ash_hound.telegraphSeconds ?? 0.6);
});
