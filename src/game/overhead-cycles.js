import { getHoneyAttackMotion } from './honey-overhead.js';
import { getOverheadWeaponSheet } from './overhead-weapons.js';

export const HERO_RUN_CYCLES = Object.freeze({
  hadida: { sprite: '/assets/heroes/hadida-overhead-run.png', sequence: [0, 3, 1, 3], roots: [[310,330],[910,350],[310,970],[910,970]] },
  boya: { sprite: '/assets/heroes/boy-overhead-run.png', sequence: [0,1,2,3], roots: [[310,320],[925,330],[315,945],[925,945]] },
  'mr-kroo': { sprite: '/assets/heroes/mr-kroo-overhead-run.png', sequence: [0,3,1,3], roots: [[350,310],[935,320],[350,950],[935,950]] },
  pata: { sprite: '/assets/heroes/pata-overhead-run.png', sequence: [0,1,2,3], roots: [[310,330],[935,330],[330,965],[935,965]] },
});

export const ENEMY_WALK_CYCLES = Object.freeze({
  razor_mantis: { sprite: '/assets/enemies/coffee-leaf-mantis-walk.png', roots: [[315,315],[945,315],[310,945],[940,945]] },
  seed_spitter: { sprite: '/assets/enemies/coffee-cherry-spitter-walk.png', roots: [[320,310],[945,310],[320,950],[945,950]] },
});

const images = new Map();
function getImage(path) {
  if (!images.has(path) && typeof Image !== 'undefined') {
    const image = new Image();
    image.src = path;
    images.set(path, image);
  }
  const image = images.get(path);
  return image?.complete && image.naturalWidth ? image : null;
}

export function getWalkCycleIndex(entity, sequence = [0,1,2,3]) {
  if (!entity.moving || entity.defeated || entity.hp <= 0) return sequence[1];
  const clock = Math.max(0, entity.walkClock ?? entity.animationClock ?? 0);
  return sequence[Math.floor(clock) % sequence.length];
}

export function advanceWalkDistance(entity, distance) {
  if (!Number.isFinite(distance) || distance <= 0 || entity.defeated) return;
  entity.walkClock = (entity.walkClock ?? 0) + distance / 18;
}

function drawFrame(context, image, cycle, index, height) {
  const cellW = image.naturalWidth / 2;
  const cellH = image.naturalHeight / 2;
  const sx = index % 2 * cellW;
  const sy = Math.floor(index / 2) * cellH;
  const [rx,ry] = cycle.roots[index];
  const scale = height / cellH;
  context.drawImage(image,sx,sy,cellW,cellH,
    (sx-rx)*scale,(sy-ry)*scale,cellW*scale,height);
}

export function drawHeroRunCycle(context, player, heroId) {
  const cycle = HERO_RUN_CYCLES[heroId];
  if (!cycle) return false;
  // Warm both slots without resetting the running phase on a weapon change.
  getImage(getOverheadWeaponSheet(heroId, 'melee'));
  getImage(getOverheadWeaponSheet(heroId, 'ranged'));
  const image = getImage(getOverheadWeaponSheet(heroId, player.selectedWeaponSlot));
  if (!image) return false;
  const motion = getHoneyAttackMotion(player);
  context.save();
  context.translate(player.x,player.y);
  context.fillStyle = 'rgba(0,0,0,.36)';
  context.beginPath(); context.ellipse(0,0,22,16,0,0,Math.PI*2); context.fill();
  context.rotate(player.facing + Math.PI/2);
  context.translate(0,-motion.reach);
  context.rotate(motion.twist);
  if (player.hp <= 0) { context.rotate(.8); context.globalAlpha *= .6; }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  drawFrame(context,image,cycle,getWalkCycleIndex(player,cycle.sequence),100);
  context.restore();
  return true;
}

export function drawEnemyWalkCycle(context, enemy, art) {
  const cycle = ENEMY_WALK_CYCLES[enemy.type];
  if (!cycle) return false;
  const image = getImage(cycle.sprite);
  if (!image) return false;
  context.save();
  context.translate(enemy.x,enemy.y);
  context.globalAlpha *= enemy.defeated ? Math.max(0,enemy.defeatTimer/.5) : 1;
  context.fillStyle = 'rgba(0,0,0,.35)';
  context.beginPath(); context.ellipse(0,0,enemy.radius,enemy.radius*.65,0,0,Math.PI*2); context.fill();
  context.rotate((enemy.facing ?? Math.PI/2)-Math.PI/2);
  // A stationary enemy holds its feet; attack anticipation is separate.
  const attack = Math.sin(Math.min(1,(enemy.attackAnimation ?? 0)/.36)*Math.PI);
  context.translate(0,attack*3);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  if (enemy.hitFlash > 0) context.filter = 'brightness(1.5)';
  drawFrame(context,image,cycle,getWalkCycleIndex(enemy),art?.renderHeight ?? 112);
  context.restore();
  return true;
}
