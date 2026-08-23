import test from "node:test";
import assert from "node:assert/strict";

import { DoffaGame } from "../src/game/game.js";

function createHarness() {
  const game = Object.create(DoffaGame.prototype);
  game.player = { x: 420, y: 760, facing: 0 };
  game.projectiles = [];
  game.particles = [];
  game.rng = { next: () => 0.5 };
  return game;
}

function createEnemy(overrides = {}) {
  return {
    id: 1,
    x: 280,
    y: 360,
    hp: 100,
    maxHp: 100,
    speed: 60,
    radius: 30,
    attackTimer: 0,
    state: "idle",
    stateTimer: 0,
    phaseTimer: 1,
    orbitDirection: 1,
    attackPattern: null,
    attackSequence: 0,
    submerged: false,
    ...overrides,
  };
}

test("ranged enemies telegraph before creating projectiles", () => {
  const oracleGame = createHarness();
  const oracle = createEnemy();
  oracleGame.updateEmberOracle(oracle, 0);
  assert.equal(oracle.state, "channel");
  assert.equal(oracleGame.projectiles.length, 0);

  oracle.stateTimer = 0;
  oracleGame.updateEmberOracle(oracle, 0);
  assert.equal(oracle.state, "idle");
  assert.equal(oracleGame.projectiles.length, 1);

  const revenantGame = createHarness();
  const revenant = createEnemy();
  revenantGame.updateSmokeRevenant(revenant, 0);
  assert.equal(revenant.state, "volley-windup");
  assert.equal(revenantGame.projectiles.length, 0);

  revenant.stateTimer = 0;
  revenantGame.updateSmokeRevenant(revenant, 0);
  assert.equal(revenant.state, "idle");
  assert.equal(revenantGame.projectiles.length, 3);
});

test("colossus charge direction is locked when its telegraph begins", () => {
  const game = createHarness();
  const colossus = createEnemy();
  game.updateBrassColossus(colossus, 0);
  const lockedDirection = { x: colossus.dashX, y: colossus.dashY };
  assert.equal(colossus.state, "windup");

  game.player.x = 40;
  game.player.y = 100;
  colossus.stateTimer = 0;
  game.updateBrassColossus(colossus, 0);
  assert.equal(colossus.state, "dash");
  assert.deepEqual({ x: colossus.dashX, y: colossus.dashY }, lockedDirection);
});

test("Hollow Roaster alternates radial and aimed-lane telegraphs", () => {
  const game = createHarness();
  const boss = createEnemy({ hp: 1_000, maxHp: 1_000, speed: 45 });

  game.updateBoss(boss, 0);
  assert.equal(boss.state, "boss-windup");
  assert.equal(boss.attackPattern, "radial");
  assert.equal(game.projectiles.length, 0);

  boss.stateTimer = 0;
  game.updateBoss(boss, 0);
  assert.equal(game.projectiles.length, 12);

  boss.attackTimer = 0;
  game.updateBoss(boss, 0);
  assert.equal(boss.attackPattern, "pressure-lanes");
  boss.stateTimer = 0;
  game.updateBoss(boss, 0);
  assert.equal(game.projectiles.length, 17);
});

test("Hollow Roaster enters phase two exactly once before resuming attacks", () => {
  const game = createHarness();
  const boss = createEnemy({
    hp: 490,
    maxHp: 1_000,
    speed: 45,
    phaseTransitioned: false,
  });

  game.updateBoss(boss, 0);
  assert.equal(boss.state, "boss-phase");
  assert.equal(boss.attackPattern, "phase-transition");
  assert.equal(boss.phaseTransitioned, true);
  assert.equal(game.projectiles.length, 0);

  boss.stateTimer = 0;
  game.updateBoss(boss, 0);
  assert.equal(boss.state, "idle");
  assert.equal(game.projectiles.length, 16);

  boss.attackTimer = 0.5;
  game.updateBoss(boss, 0);
  assert.notEqual(boss.state, "boss-phase");
  assert.equal(game.projectiles.length, 16);
});

test("Hollow Roaster defeat waits for its reaction pose and pays rewards once", () => {
  const game = createHarness();
  game.score = 0;
  game.screenShake = 0;
  game.spawnCombatText = () => {};
  game.spawnParticles = () => {};
  let rewardCalls = 0;
  game.spawnEnemyRewards = () => {
    rewardCalls += 1;
  };
  game.projectiles = [
    { friendly: false, alive: true },
    { friendly: true, alive: true },
  ];
  const boss = createEnemy({
    behavior: "hollow_roaster",
    hp: 20,
    maxHp: 1_000,
    isBoss: true,
    isElite: false,
    score: 4_500,
    xp: 320,
    contactTimer: 0,
    hitFlash: 0,
    facing: Math.PI / 2,
    moving: false,
    animationClock: 0,
    attackAnimation: 0,
    defeated: false,
    defeatTimer: 0,
    alive: true,
  });

  game.damageEnemy(boss, 20, boss.x, boss.y, "#fff0b0");
  assert.equal(boss.hp, 0);
  assert.equal(boss.defeated, true);
  assert.equal(boss.state, "defeated");
  assert.equal(boss.alive, true);
  assert.equal(game.projectiles[0].alive, false);
  assert.equal(game.projectiles[1].alive, true);
  assert.equal(game.score, 4_500);
  assert.equal(rewardCalls, 1);

  game.damageEnemy(boss, 20, boss.x, boss.y, "#fff0b0");
  assert.equal(game.score, 4_500);
  assert.equal(rewardCalls, 1);

  game.enemies = [boss];
  game.updateEnemies(0.5);
  assert.equal(boss.alive, true);
  game.updateEnemies(0.7);
  assert.equal(boss.alive, false);
});

test("Rootfall elite defeat remains visible for its reaction pose and pays rewards once", () => {
  const game = createHarness();
  game.score = 0;
  game.screenShake = 0;
  game.spawnCombatText = () => {};
  game.spawnParticles = () => {};
  let rewardCalls = 0;
  game.spawnEnemyRewards = () => {
    rewardCalls += 1;
  };
  game.projectiles = [
    { friendly: false, alive: true },
    { friendly: true, alive: true },
  ];
  const elite = createEnemy({
    type: "briar_jaguar",
    behavior: "briar_jaguar",
    hp: 20,
    maxHp: 780,
    isBoss: false,
    isElite: true,
    score: 1_500,
    xp: 115,
    contactTimer: 0,
    hitFlash: 0,
    facing: Math.PI / 2,
    moving: false,
    animationClock: 0,
    attackAnimation: 0,
    defeated: false,
    defeatTimer: 0,
    alive: true,
  });

  game.damageEnemy(elite, 20, elite.x, elite.y, "#fff0b0");
  assert.equal(elite.hp, 0);
  assert.equal(elite.defeated, true);
  assert.equal(elite.state, "defeated");
  assert.equal(elite.alive, true);
  assert.ok(elite.defeatTimer > 0);
  assert.equal(game.projectiles[0].alive, true);
  assert.equal(game.projectiles[1].alive, true);
  assert.equal(game.score, 1_500);
  assert.equal(rewardCalls, 1);

  game.damageEnemy(elite, 20, elite.x, elite.y, "#fff0b0");
  assert.equal(game.score, 1_500);
  assert.equal(rewardCalls, 1);

  const reactionSeconds = elite.defeatTimer;
  game.enemies = [elite];
  game.updateEnemies(reactionSeconds / 2);
  assert.equal(elite.alive, true);
  game.updateEnemies(reactionSeconds / 2 + 0.01);
  assert.equal(elite.alive, false);
});

test("all four elite guardians telegraph distinct opening attacks", () => {
  const kilnGame = createHarness();
  const kiln = createEnemy({ telegraphDuration: 0.74 });
  kilnGame.updateKilnWarden(kiln, 0);
  assert.equal(kiln.state, "elite-windup");
  assert.equal(kiln.attackPattern, "cleaver-charge");
  kiln.stateTimer = 0;
  kilnGame.updateKilnWarden(kiln, 0);
  assert.equal(kiln.state, "elite-dash");

  const widowGame = createHarness();
  const widow = createEnemy({ telegraphDuration: 0.62 });
  widowGame.updatePressureWidow(widow, 0);
  assert.equal(widow.attackPattern, "steam-fan");
  widow.stateTimer = 0;
  widowGame.updatePressureWidow(widow, 0);
  assert.equal(widowGame.projectiles.length, 5);

  const bishopGame = createHarness();
  const bishop = createEnemy({ telegraphDuration: 0.58 });
  bishopGame.updateCinderBishop(bishop, 0);
  assert.equal(bishop.attackPattern, "cinder-cross");
  bishop.stateTimer = 0;
  bishopGame.updateCinderBishop(bishop, 0);
  assert.equal(bishopGame.projectiles.length, 8);

  const saintGame = createHarness();
  const saint = createEnemy({ telegraphDuration: 0.7 });
  saintGame.updateGrinderSaint(saint, 0);
  assert.equal(saint.attackPattern, "saw-charge");
  saint.stateTimer = 0;
  saintGame.updateGrinderSaint(saint, 0);
  assert.equal(saint.state, "elite-dash");
});

test("Rootfall standard enemies telegraph before their distinct attacks resolve", () => {
  const mantisGame = createHarness();
  const mantis = createEnemy();
  mantisGame.updateRazorMantis(mantis, 0);
  assert.equal(mantis.state, "pounce-windup");
  assert.equal(mantisGame.projectiles.length, 0);
  mantis.stateTimer = 0;
  mantisGame.updateRazorMantis(mantis, 0);
  assert.equal(mantis.state, "pounce-dash");
  mantis.stateTimer = 0;
  mantisGame.updateRazorMantis(mantis, 0);
  assert.equal(mantis.state, "idle");
  assert.equal(mantisGame.projectiles.length, 2);

  const spitterGame = createHarness();
  const spitter = createEnemy();
  spitterGame.updateSeedSpitter(spitter, 0);
  assert.equal(spitter.state, "seed-windup");
  assert.equal(spitter.attackPattern, "seed-shot");
  assert.equal(spitterGame.projectiles.length, 0);
  spitter.stateTimer = 0;
  spitterGame.updateSeedSpitter(spitter, 0);
  assert.equal(spitterGame.projectiles.length, 1);

  spitter.attackTimer = 0;
  spitterGame.updateSeedSpitter(spitter, 0);
  assert.equal(spitter.attackPattern, "seed-fan");
  spitter.stateTimer = 0;
  spitterGame.updateSeedSpitter(spitter, 0);
  assert.equal(spitterGame.projectiles.length, 4);

  const stalkerGame = createHarness();
  const stalker = createEnemy();
  stalkerGame.updateRootStalker(stalker, 0);
  assert.equal(stalker.state, "burrow-windup");
  assert.equal(stalker.submerged, false);
  stalker.stateTimer = 0;
  stalkerGame.updateRootStalker(stalker, 0);
  assert.equal(stalker.state, "burrow");
  assert.equal(stalker.submerged, true);
  stalker.stateTimer = 0;
  stalkerGame.updateRootStalker(stalker, 0);
  assert.equal(stalker.state, "emerge");
  assert.equal(stalker.submerged, false);
  assert.equal(stalkerGame.projectiles.length, 6);

  const mothGame = createHarness();
  const moth = createEnemy();
  mothGame.updateSporeMoth(moth, 0);
  assert.equal(moth.state, "spore-windup");
  assert.equal(mothGame.projectiles.length, 0);
  moth.stateTimer = 0;
  mothGame.updateSporeMoth(moth, 0);
  assert.equal(moth.state, "idle");
  assert.equal(mothGame.projectiles.length, 5);
});

test("all four Rootfall elite guardians telegraph distinct opening attacks", () => {
  const jaguarGame = createHarness();
  const jaguar = createEnemy({ telegraphDuration: 0.62 });
  jaguarGame.updateBriarJaguar(jaguar, 0);
  assert.equal(jaguar.state, "elite-windup");
  assert.equal(jaguar.attackPattern, "rake-chain");
  jaguar.stateTimer = 0;
  jaguarGame.updateBriarJaguar(jaguar, 0);
  assert.equal(jaguar.state, "elite-dash");
  assert.equal(jaguar.dashRepeats, 2);

  const bellowerGame = createHarness();
  const bellower = createEnemy({ telegraphDuration: 0.72 });
  bellowerGame.updateMireBellower(bellower, 0);
  assert.equal(bellower.attackPattern, "tongue-lane");
  bellower.stateTimer = 0;
  bellowerGame.updateMireBellower(bellower, 0);
  assert.equal(bellowerGame.projectiles.length, 3);

  const orchidGame = createHarness();
  const orchid = createEnemy({ telegraphDuration: 0.6 });
  orchidGame.updateOrchidMaw(orchid, 0);
  assert.equal(orchid.attackPattern, "petal-clamp");
  orchid.stateTimer = 0;
  orchidGame.updateOrchidMaw(orchid, 0);
  assert.equal(orchidGame.projectiles.length, 6);

  const apeGame = createHarness();
  const ape = createEnemy({ telegraphDuration: 0.68 });
  apeGame.updateStranglerApe(ape, 0);
  assert.equal(ape.attackPattern, "vine-charge");
  ape.stateTimer = 0;
  apeGame.updateStranglerApe(ape, 0);
  assert.equal(ape.state, "elite-dash");
});

test("Rootfall Tyrant alternates root lanes and a crown with a safe gap", () => {
  const game = createHarness();
  const boss = createEnemy({ hp: 4_400, maxHp: 4_400, speed: 44 });

  game.updateRootfallTyrant(boss, 0);
  assert.equal(boss.state, "boss-windup");
  assert.equal(boss.attackPattern, "root-lanes");
  assert.equal(game.projectiles.length, 0);

  boss.stateTimer = 0;
  game.updateRootfallTyrant(boss, 0);
  assert.equal(game.projectiles.length, 5);

  boss.attackTimer = 0;
  game.updateRootfallTyrant(boss, 0);
  assert.equal(boss.attackPattern, "thorn-crown");
  boss.stateTimer = 0;
  game.updateRootfallTyrant(boss, 0);
  assert.equal(game.projectiles.length, 18);
});

test("Rootfall Tyrant enters its black-sap phase exactly once", () => {
  const game = createHarness();
  const boss = createEnemy({
    hp: 2_000,
    maxHp: 4_400,
    speed: 44,
    phaseTransitioned: false,
  });

  game.updateRootfallTyrant(boss, 0);
  assert.equal(boss.state, "boss-phase");
  assert.equal(boss.attackPattern, "black-sap-awakening");
  assert.equal(boss.phaseTransitioned, true);
  assert.equal(game.projectiles.length, 0);

  boss.stateTimer = 0;
  game.updateRootfallTyrant(boss, 0);
  assert.equal(boss.state, "idle");
  assert.equal(game.projectiles.length, 24);

  boss.attackTimer = 0.5;
  game.updateRootfallTyrant(boss, 0);
  assert.notEqual(boss.state, "boss-phase");
  assert.equal(game.projectiles.length, 24);
});
