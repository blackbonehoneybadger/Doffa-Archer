import { acquireSpriteLease, loadSprite, releaseSprite } from "./sprite-loader.js";

const ANIMATION_FRAME_WIDTH = 288;
const ANIMATION_FRAME_HEIGHT = 336;

export { removeConnectedLightBackdrop } from "./sprite-loader.js";

export function loadHeroSprite(hero) {
  return loadSprite(`hero:${hero?.id ?? "unknown"}`, hero?.art);
}

export function acquireHeroSpriteLease(hero, options) {
  return acquireSpriteLease(`hero:${hero?.id ?? "unknown"}`, hero?.art, options);
}

export function loadHeroDirectionalSprite(hero) {
  if (!hero?.art?.directionalSprite) {
    return Promise.resolve(null);
  }
  return loadSprite(`hero-directions:${hero.id}`, {
    sprite: hero.art.directionalSprite,
    backdrop: "transparent",
  });
}

export function acquireHeroDirectionalSpriteLease(hero, options) {
  return acquireSpriteLease(`hero-directions:${hero?.id ?? "unknown"}`, {
    sprite: hero?.art?.directionalSprite,
    backdrop: "transparent",
  }, options);
}

export function loadHeroMotionSprite(hero) {
  if (!hero?.art?.motionSprite) {
    return Promise.resolve(null);
  }
  return loadSprite(`hero-motion:${hero.id}`, {
    sprite: hero.art.motionSprite,
    backdrop: "transparent",
  });
}

export function acquireHeroMotionSpriteLease(hero, options) {
  return acquireSpriteLease(`hero-motion:${hero?.id ?? "unknown"}`, {
    sprite: hero?.art?.motionSprite,
    backdrop: "transparent",
  }, options);
}

export function loadHeroFullMotionSprite(hero) {
  if (!hero?.art?.fullMotionSprite) {
    return Promise.resolve(null);
  }
  return loadSprite(`hero-full-motion:${hero.id}`, {
    sprite: hero.art.fullMotionSprite,
    backdrop: "transparent",
  });
}

export function acquireHeroFullMotionSpriteLease(hero, options) {
  return acquireSpriteLease(`hero-full-motion:${hero?.id ?? "unknown"}`, {
    sprite: hero?.art?.fullMotionSprite,
    backdrop: "transparent",
  }, options);
}

export function loadHeroReactionSprite(hero) {
  if (!hero?.art?.reactionSprite) {
    return Promise.resolve(null);
  }
  return loadSprite(`hero-reactions:${hero.id}`, {
    sprite: hero.art.reactionSprite,
    backdrop: "transparent",
  });
}

export function acquireHeroReactionSpriteLease(hero, options) {
  return acquireSpriteLease(`hero-reactions:${hero?.id ?? "unknown"}`, {
    sprite: hero?.art?.reactionSprite,
    backdrop: "transparent",
  }, options);
}

export function loadHeroSecondaryAttackSprite(hero) {
  if (!hero?.art?.secondaryAttackSprite) {
    return Promise.resolve(null);
  }
  return loadSprite(`hero-secondary-attack:${hero.id}`, {
    sprite: hero.art.secondaryAttackSprite,
    backdrop: "transparent",
  });
}

export function acquireHeroSecondaryAttackSpriteLease(hero, options) {
  return acquireSpriteLease(`hero-secondary-attack:${hero?.id ?? "unknown"}`, {
    sprite: hero?.art?.secondaryAttackSprite,
    backdrop: "transparent",
  }, options);
}

function loadHeroAnimationPage(hero, animationKey, pageId, namespace) {
  const page = hero?.art?.[animationKey]?.pages?.[pageId];
  if (!page?.sprite) {
    return Promise.resolve(null);
  }
  const cacheKey = `${namespace}:${hero.id}:${pageId}`;
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
      throw new RangeError(`Hero animation page ${pageId} has invalid dimensions`);
    }
    return sprite;
  });
}

export function loadHeroFullMotionAnimationPage(hero, pageId) {
  return loadHeroAnimationPage(
    hero,
    "fullMotionAnimation",
    pageId,
    "hero-full-motion-page",
  );
}

export function loadHeroReactionAnimationPage(hero, pageId) {
  return loadHeroAnimationPage(
    hero,
    "reactionAnimation",
    pageId,
    "hero-reaction-page",
  );
}

export async function renderHeroPortrait(canvas, hero) {
  const requestId = hero?.id ?? "none";
  canvas.dataset.heroRequest = requestId;
  const lease = acquireHeroSpriteLease(hero, { owner: `portrait:${requestId}` });
  try {
    const sprite = await lease.promise;
    if (!sprite || canvas.dataset.heroRequest !== requestId) {
      return false;
    }

    const crop = hero.art.portraitCrop;
    canvas.width = 256;
    canvas.height = 320;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      return false;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    context.drawImage(
      sprite,
      Math.round(crop.x * sprite.width),
      Math.round(crop.y * sprite.height),
      Math.round(crop.width * sprite.width),
      Math.round(crop.height * sprite.height),
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return true;
  } finally {
    lease.release();
  }
}
