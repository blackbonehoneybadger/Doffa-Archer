import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ENEMY_CATALOG } from "../src/game/content.js";
import { HEROES } from "../src/game/heroes.js";
import {
  HERO_COMBAT_ANCHOR_Y,
  HERO_COMBAT_RENDER_HEIGHT,
  getSpriteRenderMetrics,
} from "../src/game/sprite-render-metrics.js";

const ROOT_URL = new URL("../", import.meta.url);

function pngSize(assetPath) {
  const bytes = readFileSync(fileURLToPath(new URL(`.${assetPath}`, ROOT_URL)));
  assert.equal(bytes.toString("ascii", 1, 4), "PNG");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function metricsFor(assetPath, columns, rows, targetHeight, anchorY) {
  const size = pngSize(assetPath);
  return getSpriteRenderMetrics({
    spriteWidth: size.width,
    spriteHeight: size.height,
    columns,
    rows,
    targetHeight,
    anchorY,
  });
}

test("every hero animation state keeps one combat height and ground anchor", () => {
  for (const hero of HEROES) {
    const sheets = [
      ["directional", hero.art.directionalSprite, 4, 2],
      ["motion", hero.art.motionSprite, 4, 2],
      ["full motion", hero.art.fullMotionSprite, 4, 6],
      ["reactions", hero.art.reactionSprite, 4, 4],
    ];
    if (hero.art.secondaryAttackSprite) {
      sheets.push(["secondary attack", hero.art.secondaryAttackSprite, 4, 2]);
    }

    for (const [label, assetPath, columns, rows] of sheets) {
      const metrics = metricsFor(
        assetPath,
        columns,
        rows,
        HERO_COMBAT_RENDER_HEIGHT,
        HERO_COMBAT_ANCHOR_Y,
      );
      assert.equal(metrics.targetHeight, HERO_COMBAT_RENDER_HEIGHT, `${hero.id} ${label}`);
      assert.equal(
        metrics.destinationY + metrics.targetHeight * HERO_COMBAT_ANCHOR_Y,
        0,
        `${hero.id} ${label} must keep the same planted baseline`,
      );
      assert.ok(Number.isFinite(metrics.targetWidth) && metrics.targetWidth > 0);
    }
  }
});

test("every enemy motion, special, and reaction sheet preserves its authored size", () => {
  for (const enemy of Object.values(ENEMY_CATALOG)) {
    const { art } = enemy;
    const sheets = [
      ["base", art.sprite, 1, 1],
      ["motion", art.motionSprite, 4, 6],
      ["special", art.specialSprite, 4, 4],
      ["reaction", art.reactionSprite, 4, 4],
    ].filter(([, assetPath]) => assetPath);

    for (const [label, assetPath, columns, rows] of sheets) {
      const metrics = metricsFor(assetPath, columns, rows, art.renderHeight, art.anchorY);
      assert.equal(metrics.targetHeight, art.renderHeight, `${enemy.id} ${label}`);
      assert.equal(
        metrics.destinationY + metrics.targetHeight * art.anchorY,
        0,
        `${enemy.id} ${label} must keep the same planted baseline`,
      );
      assert.ok(Number.isFinite(metrics.targetWidth) && metrics.targetWidth > 0);
    }
  }
});

test("invalid sprite metadata falls back to finite nonzero geometry", () => {
  const metrics = getSpriteRenderMetrics({
    spriteWidth: Number.NaN,
    spriteHeight: 0,
    columns: -2,
    rows: 0,
    targetHeight: Number.NaN,
  });
  assert.deepEqual(metrics, {
    sourceWidth: 1,
    sourceHeight: 1,
    targetWidth: 1,
    targetHeight: 1,
    destinationX: -0.5,
    destinationY: -0.6,
    anchorY: 0.6,
  });
});
