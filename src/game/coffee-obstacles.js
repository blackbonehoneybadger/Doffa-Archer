let trunkImage;

// Keep the solid trunk over the existing collision rectangle. Leaves extend
// slightly beyond it, as decoration, without changing room navigation.
export function drawCoffeeObstacle(context, obstacle) {
  if (obstacle.kind !== "fallen-root") return false;
  if (!trunkImage) {
    trunkImage = new Image();
    trunkImage.src = "/assets/obstacles/coffee-trunk.png";
  }
  if (!trunkImage.complete || !trunkImage.naturalWidth) return false;

  const horizontal = obstacle.width >= obstacle.height;
  const length = horizontal ? obstacle.width : obstacle.height;
  const thickness = horizontal ? obstacle.height : obstacle.width;
  context.save();
  context.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
  if (!horizontal) context.rotate(Math.PI / 2);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.shadowColor = "rgba(0, 0, 0, 0.6)";
  context.shadowBlur = 5;
  context.shadowOffsetY = 3;
  // Artwork trunk body occupies source y=285..600; branches surround it.
  context.drawImage(trunkImage, 63, 105, 1872, 555,
    -length / 2, -thickness * 1.07, length, thickness * 1.76);
  context.restore();
  return true;
}
