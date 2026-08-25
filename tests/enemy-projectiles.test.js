import test from "node:test";
import assert from "node:assert/strict";

import { ENEMY_CATALOG } from "../src/game/content.js";
import {
  ENEMY_PROJECTILE_PROFILES,
  getEnemyProjectileStyle,
} from "../src/game/enemy-projectiles.js";

test("every authored enemy owns a unique projectile visual signature", () => {
  const enemies = Object.values(ENEMY_CATALOG);
  assert.equal(Object.keys(ENEMY_PROJECTILE_PROFILES).length, enemies.length);

  const signatures = enemies.map((enemy) => {
    const profile = getEnemyProjectileStyle(enemy);
    assert.notEqual(profile.variant, "unknown-enemy", enemy.id);
    return JSON.stringify(profile);
  });

  assert.equal(new Set(signatures).size, enemies.length);
});
