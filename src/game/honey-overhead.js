import { PLAYER_ATTACK_ANIMATION_SECONDS } from './player-animation.js';
import { getOverheadWeaponSheet } from './overhead-weapons.js';

// Whole-frame authored poses. Root coordinates keep the hips stationary while
// the limbs change pose; the sprite turns around that same world-space root.
const frames = [
  { x: 65, y: 0, w: 605, h: 620, rootX: 315, rootY: 330 },
  { x: 690, y: 0, w: 564, h: 620, rootX: 890, rootY: 330 },
  { x: 65, y: 620, w: 615, h: 634, rootX: 340, rootY: 950 },
  { x: 690, y: 620, w: 564, h: 634, rootX: 890, rootY: 950 },
];
const sprites = new Map();
export function getHoneyAttackMotion(player) {
  if (player.moving || player.hp <= 0 || !(player.attackAnimation > 0)) {
    return { twist: 0, reach: 0, strike: 0 };
  }
  const progress = 1 - Math.min(1, player.attackAnimation / PLAYER_ATTACK_ANIMATION_SECONDS);
  const strike = Math.sin(progress * Math.PI);
  const ranged = player.selectedWeaponSlot === 'ranged';
  return { twist: ranged ? -strike * 0.08 : strike * 0.42,
    reach: ranged ? -strike * 2 : strike * 6, strike: ranged ? 0 : strike };
}
export function drawHoneyOverhead(context, player) {
  for (const slot of ['melee', 'ranged']) {
    if (!sprites.has(slot) && typeof Image !== 'undefined') {
      const image = new Image();
      image.src = getOverheadWeaponSheet('honey-badger', slot);
      sprites.set(slot, image);
    }
  }
  const sprite = sprites.get(player.selectedWeaponSlot === 'ranged' ? 'ranged' : 'melee');
  if (!sprite?.complete || !sprite.naturalWidth) return false;
  const index = player.moving ? Math.floor(player.animationClock) % 4 : 1;
  const f = frames[index];
  const scale = 0.16;
  const motion = getHoneyAttackMotion(player);
  context.save();
  context.translate(player.x, player.y);
  context.fillStyle = 'rgba(0,0,0,.36)';
  context.beginPath();
  context.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
  context.fill();
  context.rotate(player.facing + Math.PI / 2);
  context.translate(0, -motion.reach);
  context.rotate(motion.twist);
  if (player.hp <= 0) { context.rotate(0.8); context.globalAlpha *= 0.6; }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(sprite, f.x, f.y, f.w, f.h,
    (f.x - f.rootX) * scale, (f.y - f.rootY) * scale,
    f.w * scale, f.h * scale);
  if (motion.strike > 0) {
    context.globalAlpha *= motion.strike * 0.75;
    context.strokeStyle = '#f4dfb0';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, 43, -Math.PI * 0.85, -Math.PI * 0.15);
    context.stroke();
  }
  context.restore();
  return true;
}
