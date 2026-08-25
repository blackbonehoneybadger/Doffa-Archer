export const HERO_COMBAT_RENDER_HEIGHT = 170;
export const HERO_COMBAT_ANCHOR_Y = 0.74;

function positiveNumber(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function positiveInteger(value, fallback = 1) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function getSpriteRenderMetrics({
  spriteWidth,
  spriteHeight,
  columns = 1,
  rows = 1,
  targetHeight,
  anchorY,
} = {}) {
  const safeSpriteWidth = positiveNumber(spriteWidth, 1);
  const safeSpriteHeight = positiveNumber(spriteHeight, 1);
  const safeColumns = positiveInteger(columns);
  const safeRows = positiveInteger(rows);
  const safeTargetHeight = positiveNumber(targetHeight, 1);
  const safeAnchorY = Number.isFinite(anchorY) ? anchorY : 0.6;
  const sourceWidth = safeSpriteWidth / safeColumns;
  const sourceHeight = safeSpriteHeight / safeRows;
  const targetWidth = safeTargetHeight * (sourceWidth / sourceHeight);

  return Object.freeze({
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight: safeTargetHeight,
    destinationX: -targetWidth / 2,
    destinationY: -safeTargetHeight * safeAnchorY,
    anchorY: safeAnchorY,
  });
}
