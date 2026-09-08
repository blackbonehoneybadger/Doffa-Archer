import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceWalkDistance, getWalkCycleIndex, HERO_RUN_CYCLES, ENEMY_WALK_CYCLES } from '../src/game/overhead-cycles.js';
import { TOURS, getEnemyDefinition } from '../src/game/content.js';

test('enemy feet cycle through four poses and stop with the body', () => {
  const e = { moving:true, hp:100, walkClock:0 };
  const frames=[];
  for(let i=0;i<4;i++){ frames.push(getWalkCycleIndex(e)); advanceWalkDistance(e,18); }
  assert.deepEqual(frames,[0,1,2,3]);
  e.moving=false;
  const stopped=getWalkCycleIndex(e);
  advanceWalkDistance(e,0);
  assert.equal(getWalkCycleIndex(e),stopped);
});

test('gait distance is independent of frame rate', () => {
  const a={}, b={};
  for(let i=0;i<30;i++) advanceWalkDistance(a,3);
  for(let i=0;i<120;i++) advanceWalkDistance(b,.75);
  assert.ok(Math.abs(a.walkClock-b.walkClock)<1e-10);
});

test('all additional heroes have matching overhead cycles; rejected Hadida frame excluded', () => {
  assert.deepEqual(Object.keys(HERO_RUN_CYCLES).sort(),['boya','hadida','mr-kroo','pata']);
  assert.ok(!HERO_RUN_CYCLES.hadida.sequence.includes(2));
  assert.deepEqual(Object.keys(ENEMY_WALK_CYCLES).sort(),['razor_mantis','seed_spitter']);
});

test('every room 50 contains Kaprizart with common identity and different body', () => {
  const heads=new Set(), bodies=new Set();
  assert.equal(TOURS.length,5);
  for(const tour of TOURS){
    assert.equal(tour.rooms.length,50);
    const room=tour.rooms[49];
    assert.equal(room.boss,true);
    const bosses=room.waves.flat().map(getEnemyDefinition).filter(e=>e.boss);
    assert.ok(bosses.length>0);
    for(const b of bosses){assert.equal(b.identity,'kaprizard');assert.equal(b.faceExposed,true);heads.add(b.headIdentity);bodies.add(b.bodySignature);}
  }
  assert.equal(heads.size,1);
  assert.equal(bodies.size,5);
});
