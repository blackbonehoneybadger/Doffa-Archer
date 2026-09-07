import test from 'node:test';
import assert from 'node:assert/strict';
import { getHoneyAttackMotion } from '../src/game/honey-overhead.js';

test('Honey attack returns to rest and movement interrupts its visual motion', () => {
  const player = { hp: 140, attackAnimation: 0.11, selectedWeaponSlot: 'melee' };
  assert.ok(getHoneyAttackMotion(player).reach > 0);
  assert.equal(getHoneyAttackMotion({ ...player, attackAnimation: 0 }).reach, 0);
  assert.equal(getHoneyAttackMotion({ ...player, moving: true }).strike, 0);
  assert.equal(getHoneyAttackMotion({ ...player, hp: 0 }).strike, 0);
});
test('Ranged release recoils without drawing a melee slash', () => {
  const motion = getHoneyAttackMotion({ hp: 140, attackAnimation: 0.11, selectedWeaponSlot: 'ranged' });
  assert.ok(motion.reach < 0);
  assert.equal(motion.strike, 0);
});
