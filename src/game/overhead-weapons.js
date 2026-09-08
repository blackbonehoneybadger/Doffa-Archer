import { normalizeWeaponSlot } from './hero-weapons.js';

const ROOT = '/assets/heroes/';
export const OVERHEAD_WEAPON_SHEETS = Object.freeze({
  'honey-badger': { melee: 'honey-overhead-run-v1.png', ranged: 'honey-overhead-ranged-v1.png' },
  hadida: { melee: 'hadida-overhead-run.png', ranged: 'hadida-overhead-ranged-v1.png' },
  boya: { melee: 'boy-overhead-run.png', ranged: 'boy-overhead-ranged-v1.png' },
  'mr-kroo': { melee: 'mr-kroo-overhead-melee-v1.png', ranged: 'mr-kroo-overhead-run.png' },
  pata: { melee: 'pata-overhead-melee-v1.png', ranged: 'pata-overhead-run.png' },
});

export function getOverheadWeaponSheet(heroId, slot) {
  const file = OVERHEAD_WEAPON_SHEETS[heroId]?.[normalizeWeaponSlot(slot)];
  return file ? ROOT + file : null;
}
