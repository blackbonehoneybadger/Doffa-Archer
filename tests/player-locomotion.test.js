import test from 'node:test';
import assert from 'node:assert/strict';
import { DoffaGame } from '../src/game/game.js';
import { advancePlayerAnimation } from '../src/game/player-animation.js';

 test('equal travel gives equal gait phase at different speeds', () => {
  const a = { moving: true, hp: 100, animationState: 'run' };
  const b = { ...a };
  advancePlayerAnimation(a, 0.1, true, 28);
  advancePlayerAnimation(b, 0.2, true, 28);
  assert.equal(a.animationClock, b.animationClock);
  assert.equal(a.animationStateClock, b.animationStateClock);
});

test('holding movement into an obstacle produces no running or footsteps', () => {
  const game = Object.create(DoffaGame.prototype);
  game.player = { x: 250, y: 350, radius: 15, speed: 280, hp: 100, attackTimer: 0 };
  game.hero = { id: 'honey-badger' };
  game.getMovementDirection = () => ({ x: 1, y: 0 });
  game.resolveEntityObstacles = p => { p.x = 250; p.y = 350; };
  let steps = 0;
  game.onAudio = () => steps++;
  game.spawnParticles = () => {};
  for (let i = 0; i < 30; i++) game.updatePlayer(1 / 60);
  assert.equal(game.player.moving, false);
  assert.equal(game.player.animationState, 'idle');
  assert.equal(steps, 0);
});

test('movement interrupts attack pose while preserving cooldown and facing travel', () => {
  const game = Object.create(DoffaGame.prototype);
  game.player = { x: 250, y: 350, radius: 15, speed: 280, hp: 100, attackTimer: 0.4, attackAnimation: 0.22, animationState: 'attack', facing: 0 };
  game.hero = { id: 'honey-badger' };
  game.getMovementDirection = () => ({ x: 0, y: -1 });
  game.resolveEntityObstacles = () => {};
  game.spawnParticles = () => {};
  game.hasAttackTargets = () => { throw new Error('must not attack while moving'); };
  game.updatePlayer(1 / 60);
  assert.equal(game.player.attackAnimation, 0);
  assert.equal(game.player.animationState, 'run');
  assert.equal(game.player.attackTimer, 0.4);
  assert.equal(game.player.facing, -Math.PI / 2);
  assert.ok(game.player.y < 350);
});
