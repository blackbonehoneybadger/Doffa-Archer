// Whole-frame authored poses. Root coordinates keep the hips stationary while
// the limbs change pose; the sprite turns around that same world-space root.
const frames = [
  { x: 65, y: 0, w: 605, h: 620, rootX: 315, rootY: 330 },
  { x: 690, y: 0, w: 564, h: 620, rootX: 890, rootY: 330 },
  { x: 65, y: 620, w: 615, h: 634, rootX: 340, rootY: 950 },
  { x: 690, y: 620, w: 564, h: 634, rootX: 890, rootY: 950 },
];
let sprite;
export function drawHoneyOverhead(context, player) {
  if (!sprite && typeof Image !== 'undefined') {
    sprite = new Image();
    sprite.src = '/assets/heroes/honey-overhead-run-v1.png';
  }
  if (!sprite?.complete || !sprite.naturalWidth) return false;
  const index = player.moving ? Math.floor(player.animationClock) % 4 : 1;
  const f = frames[index];
  const scale = 0.16;
  context.save();
  context.translate(player.x, player.y);
  context.fillStyle = 'rgba(0,0,0,.36)';
  context.beginPath();
  context.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
  context.fill();
  context.rotate(player.facing + Math.PI / 2);
  if (player.hp <= 0) { context.rotate(0.8); context.globalAlpha *= 0.6; }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(sprite, f.x, f.y, f.w, f.h,
    (f.x - f.rootX) * scale, (f.y - f.rootY) * scale,
    f.w * scale, f.h * scale);
  context.restore();
  return true;
}
