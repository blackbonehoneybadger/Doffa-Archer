import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { getOverheadWeaponSheet, OVERHEAD_WEAPON_SHEETS } from '../src/game/overhead-weapons.js';
import { drawHeroRunCycle } from '../src/game/overhead-cycles.js';
import { drawHoneyOverhead } from '../src/game/honey-overhead.js';

test('all five renderers switch the actual image without resetting gait or position', () => {
  const previous = globalThis.Image;
  globalThis.Image = class { complete = true; naturalWidth = 1254; naturalHeight = 1254; };
  try {
    for (const id of Object.keys(OVERHEAD_WEAPON_SHEETS)) {
      const drawn = [];
      const context = new Proxy({}, { get: (_, key) => key === 'drawImage'
        ? (...args) => drawn.push(args) : () => {} });
      const player = { x: 100, y: 200, facing: 0, hp: 100, moving: true, animationClock: 2.2, selectedWeaponSlot: 'melee' };
      const render = () => id === 'honey-badger' ? drawHoneyOverhead(context, player) : drawHeroRunCycle(context, player, id);
      assert.equal(render(), true);
      player.selectedWeaponSlot = 'ranged';
      assert.equal(render(), true);
      assert.notEqual(drawn[0][0].src, drawn[1][0].src);
      assert.equal(drawn[1][0].src, getOverheadWeaponSheet(id, 'ranged'));
      assert.deepEqual(drawn[0].slice(1), drawn[1].slice(1));
      assert.equal(player.animationClock, 2.2);
      for (const slot of ['melee', 'ranged']) {
        assert.ok(existsSync(new URL('..' + getOverheadWeaponSheet(id, slot), import.meta.url)));
      }
    }
  } finally { globalThis.Image = previous; }
});
