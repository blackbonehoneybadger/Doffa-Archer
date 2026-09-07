import test from 'node:test';
import assert from 'node:assert/strict';
import { DoffaGame } from '../src/game/game.js';

test('right-hand movement retains one pointer while the other hand changes weapon', () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const handlers = new Map();
  globalThis.window = { addEventListener() {} };
  globalThis.document = { addEventListener() {} };
  try {
    const game = Object.create(DoffaGame.prototype);
    game.mode = 'running'; game.paused = false; game.pointer = null; game.keys = new Set();
    game.canvas = { addEventListener: (name, handler) => handlers.set(name, handler), setPointerCapture() {} };
    game.toCanvasPoint = event => ({ x: event.x, y: event.y });
    game.bindInput();
    const event = (id, x, y = 800) => ({ pointerId: id, pointerType: 'touch', x, y, preventDefault() {} });
    handlers.get('pointerdown')(event(1, 100));
    assert.equal(game.pointer, null, 'left side reserved for weapon controls');
    handlers.get('pointerdown')(event(2, 550));
    handlers.get('pointermove')(event(2, 590));
    assert.equal(game.getMovementDirection().x, 1);
    handlers.get('pointerdown')(event(3, 600));
    handlers.get('pointerup')(event(3, 600));
    assert.equal(game.pointer.id, 2, 'second touch cannot steal or release movement');
    handlers.get('lostpointercapture')(event(2, 590));
    assert.equal(game.pointer, null);
    game.paused = true;
    handlers.get('pointerdown')(event(4, 550));
    assert.equal(game.pointer, null);
    game.paused = false; game.mode = 'exit';
    handlers.get('pointerdown')(event(5, 550));
    assert.equal(game.pointer.id, 5, 'movement remains available after room clear');
    handlers.get('pointercancel')(event(5, 550));
    assert.equal(game.pointer, null);
  } finally {
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  }
});
