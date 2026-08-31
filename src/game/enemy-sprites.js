import { acquireSpriteLease, loadSprite, releaseSprite } from "./sprite-loader.js";

const ANIMATION_FRAME_WIDTH = 288;
const ANIMATION_FRAME_HEIGHT = 336;

export function loadEnemySprite(enemyDefinition) {
  return loadSprite(`enemy:${enemyDefinition?.id ?? "unknown"}`, enemyDefinition?.art);
}

export function acquireEnemySpriteLease(enemyDefinition, options) {
  return acquireSpriteLease(
    `enemy:${enemyDefinition?.id ?? "unknown"}`,
    enemyDefinition?.art,
    options,
  );
}

export function loadEnemyMotionSprite(enemyDefinition) {
  if (!enemyDefinition?.art?.motionSprite) {
    return Promise.resolve(null);
  }
  return loadSprite(`enemy-motion:${enemyDefinition.id}`, {
    sprite: enemyDefinition.art.motionSprite,
    backdrop: "transparent",
  });
}

export function acquireEnemyMotionSpriteLease(enemyDefinition, options) {
  return acquireSpriteLease(`enemy-motion:${enemyDefinition?.id ?? "unknown"}`, {
    sprite: enemyDefinition?.art?.motionSprite,
    backdrop: "transparent",
  }, options);
}

export function loadEnemySpecialSprite(enemyDefinition) {
  if (!enemyDefinition?.art?.specialSprite) {
    return Promise.resolve(null);
  }
  return loadSprite(`enemy-special:${enemyDefinition.id}`, {
    sprite: enemyDefinition.art.specialSprite,
    backdrop: "transparent",
  });
}

export function acquireEnemySpecialSpriteLease(enemyDefinition, options) {
  return acquireSpriteLease(`enemy-special:${enemyDefinition?.id ?? "unknown"}`, {
    sprite: enemyDefinition?.art?.specialSprite,
    backdrop: "transparent",
  }, options);
}

export function loadEnemyReactionSprite(enemyDefinition) {
  if (!enemyDefinition?.art?.reactionSprite) {
    return Promise.resolve(null);
  }
  return loadSprite(`enemy-reaction:${enemyDefinition.id}`, {
    sprite: enemyDefinition.art.reactionSprite,
    backdrop: "transparent",
  });
}

export function acquireEnemyReactionSpriteLease(enemyDefinition, options) {
  return acquireSpriteLease(`enemy-reaction:${enemyDefinition?.id ?? "unknown"}`, {
    sprite: enemyDefinition?.art?.reactionSprite,
    backdrop: "transparent",
  }, options);
}

function loadEnemyAnimationPage(enemyDefinition, animationKey, pageId, namespace) {
  const page = enemyDefinition?.art?.[animationKey]?.pages?.[pageId];
  if (!page?.sprite) {
    return Promise.resolve(null);
  }
  const cacheKey = `${namespace}:${enemyDefinition.id}:${pageId}`;
  return loadSprite(cacheKey, {
    sprite: page.sprite,
    backdrop: "transparent",
  }).then((sprite) => {
    if (
      sprite
      && (
        sprite.width !== page.columns * ANIMATION_FRAME_WIDTH
        || sprite.height !== page.rows * ANIMATION_FRAME_HEIGHT
      )
    ) {
      releaseSprite(cacheKey);
      throw new RangeError(`Enemy animation page ${pageId} has invalid dimensions`);
    }
    return sprite;
  });
}

export function loadEnemyMotionAnimationPage(enemyDefinition, pageId) {
  return loadEnemyAnimationPage(
    enemyDefinition,
    "motionAnimation",
    pageId,
    "enemy-motion-page",
  );
}

export function loadEnemySpecialAnimationPage(enemyDefinition, pageId) {
  return loadEnemyAnimationPage(
    enemyDefinition,
    "specialAnimation",
    pageId,
    "enemy-special-page",
  );
}

export function loadEnemyReactionAnimationPage(enemyDefinition, pageId) {
  return loadEnemyAnimationPage(
    enemyDefinition,
    "reactionAnimation",
    pageId,
    "enemy-reaction-page",
  );
}
