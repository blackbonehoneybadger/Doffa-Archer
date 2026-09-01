import { HERO_IDENTITY, TOUR } from "../identity.js";
import { circlesOverlap, normalize2, pointInArc, resolveCircleWorld } from "./collision.js";
import { createRng } from "./rng.js";

export const FIXED_DT = 1 / 60;
export const ARENA = Object.freeze({
  minX: -6.2,
  maxX: 6.2,
  minZ: -10.4,
  maxZ: 10.4,
});

const PLAYER_RADIUS = 0.38;
const PLAYER_SPEED = 4.35;
const PLAYER_MAX_HP = 2450;
const KATANA_RANGE = 2.15;
const KATANA_HALF_ANGLE = Math.PI * 0.42;
const KATANA_DAMAGE = 185;
const KATANA_COOLDOWN = 0.48;
const KATANA_ACTIVE = 0.16;
const I_FRAMES = 0.28;

function freezeBox(minX, maxX, minZ, maxZ, kind, id) {
  return Object.freeze({ minX, maxX, minZ, maxZ, kind, id });
}

export function createRoom08Obstacles() {
  return Object.freeze([
    freezeBox(ARENA.minX - 1.2, ARENA.minX + 0.35, ARENA.minZ - 1, ARENA.maxZ + 1, "wall", "west-wall"),
    freezeBox(ARENA.maxX - 0.35, ARENA.maxX + 1.2, ARENA.minZ - 1, ARENA.maxZ + 1, "wall", "east-wall"),
    freezeBox(ARENA.minX - 1, ARENA.maxX + 1, ARENA.minZ - 1.2, ARENA.minZ + 0.45, "wall", "north-wall"),
    freezeBox(ARENA.minX - 1, ARENA.maxX + 1, ARENA.maxZ - 0.45, ARENA.maxZ + 1.2, "wall", "south-wall"),
    freezeBox(-5.6, -3.7, -2.4, -0.7, "cover", "root-cover-west"),
    freezeBox(3.55, 5.45, -3.1, -1.2, "cover", "root-cover-east"),
    freezeBox(-2.15, -0.85, -7.6, -6.3, "cover", "root-altar-left"),
    freezeBox(0.85, 2.15, -7.6, -6.3, "cover", "root-altar-right"),
    freezeBox(-5.35, -4.15, 3.4, 4.7, "cover", "moss-block-sw"),
    freezeBox(4.05, 5.35, 4.1, 5.5, "cover", "moss-block-se"),
  ]);
}

function enemy(id, kind, x, z, extras) {
  return {
    id,
    kind,
    x,
    z,
    facingX: 0,
    facingZ: 1,
    hp: extras.hp,
    maxHp: extras.hp,
    radius: extras.radius,
    speed: extras.speed,
    alive: true,
    telegraph: 0,
    telegraphDuration: extras.telegraphDuration,
    attackCooldown: extras.attackDelay,
    attackWindup: extras.windup,
    contactDamage: extras.contactDamage,
    projectileDamage: extras.projectileDamage ?? 0,
    uniqueMesh: extras.uniqueMesh,
  };
}

export function createSliceWorld({ seed = TOUR.seed } = {}) {
  const rng = createRng(seed);
  const obstacles = createRoom08Obstacles();
  return {
    seed,
    time: 0,
    paused: false,
    cleared: false,
    defeated: false,
    cameraMode: "combat",
    obstacles,
    player: {
      x: 0,
      z: 7.2,
      facingX: 0,
      facingZ: -1,
      hp: PLAYER_MAX_HP,
      maxHp: PLAYER_MAX_HP,
      radius: PLAYER_RADIUS,
      attackCooldown: 0,
      attackActive: 0,
      invuln: 0,
      swinging: false,
    },
    enemies: [
      enemy("razor-mantis", "razor_mantis", 0, -6.35, {
        hp: 620,
        radius: 0.62,
        speed: 2.35,
        telegraphDuration: 0.62,
        attackDelay: 1.15,
        windup: 0.62,
        contactDamage: 55,
        uniqueMesh: "razor-mantis-elite",
      }),
      enemy("seed-spitter-west", "seed_spitter", -3.35, -1.55, {
        hp: 240,
        radius: 0.48,
        speed: 0,
        telegraphDuration: 0.55,
        attackDelay: 0.4 + rng.float(0, 0.5),
        windup: 0.55,
        contactDamage: 18,
        projectileDamage: 36,
        uniqueMesh: "seed-spitter-pod",
      }),
      enemy("seed-spitter-east", "seed_spitter", 3.4, -1.35, {
        hp: 240,
        radius: 0.48,
        speed: 0,
        telegraphDuration: 0.55,
        attackDelay: 0.7 + rng.float(0, 0.4),
        windup: 0.55,
        contactDamage: 18,
        projectileDamage: 36,
        uniqueMesh: "seed-spitter-pod",
      }),
      enemy("root-stalker-west", "root_stalker", -2.55, 3.15, {
        hp: 310,
        radius: 0.44,
        speed: 2.05,
        telegraphDuration: 0.4,
        attackDelay: 0.85,
        windup: 0.4,
        contactDamage: 42,
        uniqueMesh: "root-stalker-wood",
      }),
      enemy("root-stalker-east", "root_stalker", 2.7, 2.75, {
        hp: 310,
        radius: 0.44,
        speed: 2.05,
        telegraphDuration: 0.4,
        attackDelay: 1.05,
        windup: 0.4,
        contactDamage: 42,
        uniqueMesh: "root-stalker-wood",
      }),
    ],
    projectiles: [],
    events: [],
    input: { moveX: 0, moveZ: 0, attack: false },
  };
}

function faceToward(entity, x, z) {
  const facing = normalize2(x - entity.x, z - entity.z);
  if (facing.length > 0) {
    entity.facingX = facing.x;
    entity.facingZ = facing.z;
  }
}

function pushEvent(world, type, extra) {
  world.events.push({ time: world.time, type, ...extra });
}

function spawnProjectile(world, enemy) {
  const facing = normalize2(world.player.x - enemy.x, world.player.z - enemy.z);
  world.projectiles.push({
    id: `seed-${world.time.toFixed(3)}-${enemy.id}`,
    x: enemy.x + facing.x * 0.55,
    z: enemy.z + facing.z * 0.55,
    vx: facing.x * 6.4,
    vz: facing.z * 6.4,
    radius: 0.16,
    damage: enemy.projectileDamage,
    life: 1.8,
    ownerId: enemy.id,
  });
}

function damagePlayer(world, amount, source) {
  const player = world.player;
  if (player.invuln > 0 || world.defeated) {
    return;
  }
  player.hp = Math.max(0, player.hp - amount);
  player.invuln = I_FRAMES;
  pushEvent(world, "player-hit", { amount, source });
  if (player.hp <= 0) {
    world.defeated = true;
    pushEvent(world, "player-defeat", { source });
  }
}

function damageEnemy(world, enemy, amount) {
  if (!enemy.alive) {
    return;
  }
  enemy.hp = Math.max(0, enemy.hp - amount);
  pushEvent(world, "enemy-hit", { id: enemy.id, amount });
  if (enemy.hp <= 0) {
    enemy.alive = false;
    enemy.telegraph = 0;
    pushEvent(world, "enemy-defeat", { id: enemy.id, kind: enemy.kind });
  }
}

function resolveActor(world, entity) {
  const walls = resolveCircleWorld(entity.x, entity.z, entity.radius, world.obstacles);
  entity.x = walls.x;
  entity.z = walls.z;
  entity.x = Math.min(ARENA.maxX - entity.radius, Math.max(ARENA.minX + entity.radius, entity.x));
  entity.z = Math.min(ARENA.maxZ - entity.radius, Math.max(ARENA.minZ + entity.radius, entity.z));
}

function tickPlayer(world, dt) {
  const player = world.player;
  const move = normalize2(world.input.moveX, world.input.moveZ);
  if (move.length > 0) {
    player.x += move.x * PLAYER_SPEED * dt;
    player.z += move.z * PLAYER_SPEED * dt;
    player.facingX = move.x;
    player.facingZ = move.z;
  }
  resolveActor(world, player);
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  if (player.attackActive > 0) {
    player.attackActive = Math.max(0, player.attackActive - dt);
    for (const enemy of world.enemies) {
      if (!enemy.alive) {
        continue;
      }
      if (pointInArc(
        player.x,
        player.z,
        player.facingX,
        player.facingZ,
        KATANA_RANGE,
        KATANA_HALF_ANGLE,
        enemy.x,
        enemy.z,
      )) {
        if (!enemy._hitThisSwing) {
          damageEnemy(world, enemy, KATANA_DAMAGE);
          enemy._hitThisSwing = true;
        }
      }
    }
  } else {
    player.swinging = false;
    for (const enemy of world.enemies) {
      enemy._hitThisSwing = false;
    }
  }
  if (world.input.attack && player.attackCooldown <= 0 && !world.defeated) {
    player.attackCooldown = KATANA_COOLDOWN;
    player.attackActive = KATANA_ACTIVE;
    player.swinging = true;
    const living = world.enemies.filter((enemy) => enemy.alive);
    if (living.length > 0 && move.length === 0) {
      living.sort((a, b) => {
        const da = (a.x - player.x) ** 2 + (a.z - player.z) ** 2;
        const db = (b.x - player.x) ** 2 + (b.z - player.z) ** 2;
        return da - db;
      });
      faceToward(player, living[0].x, living[0].z);
    }
    pushEvent(world, "katana-swing", {
      x: player.x,
      z: player.z,
      facingX: player.facingX,
      facingZ: player.facingZ,
    });
  }
}

function tickEnemy(world, enemy, dt) {
  if (!enemy.alive) {
    return;
  }
  const player = world.player;
  faceToward(enemy, player.x, player.z);
  const distance = Math.hypot(player.x - enemy.x, player.z - enemy.z);

  if (enemy.kind === "seed_spitter") {
    enemy.attackCooldown -= dt;
    if (enemy.telegraph > 0) {
      enemy.telegraph = Math.max(0, enemy.telegraph - dt);
      if (enemy.telegraph === 0) {
        spawnProjectile(world, enemy);
        pushEvent(world, "projectile-fire", { id: enemy.id });
        enemy.attackCooldown = 1.35;
      }
    } else if (enemy.attackCooldown <= 0) {
      enemy.telegraph = enemy.attackWindup;
      pushEvent(world, "telegraph", { id: enemy.id, kind: enemy.kind, duration: enemy.attackWindup });
    }
    return;
  }

  const desiredRange = enemy.kind === "razor_mantis" ? 1.55 : 1.15;
  if (distance > desiredRange + 0.35 && enemy.telegraph <= 0) {
    const step = enemy.speed * dt;
    enemy.x += enemy.facingX * step;
    enemy.z += enemy.facingZ * step;
    resolveActor(world, enemy);
  }

  enemy.attackCooldown -= dt;
  if (enemy.telegraph > 0) {
    enemy.telegraph = Math.max(0, enemy.telegraph - dt);
    if (enemy.telegraph === 0) {
      const stillClose = Math.hypot(player.x - enemy.x, player.z - enemy.z) <= desiredRange + 0.85;
      if (stillClose) {
        damagePlayer(world, enemy.contactDamage, enemy.id);
        pushEvent(world, "enemy-strike", { id: enemy.id, kind: enemy.kind });
      }
      enemy.attackCooldown = enemy.kind === "razor_mantis" ? 1.45 : 1.1;
    }
    return;
  }
  if (distance <= desiredRange + 0.2 && enemy.attackCooldown <= 0) {
    enemy.telegraph = enemy.attackWindup;
    pushEvent(world, "telegraph", { id: enemy.id, kind: enemy.kind, duration: enemy.attackWindup });
  }
}

function tickProjectiles(world, dt) {
  const next = [];
  for (const shot of world.projectiles) {
    shot.life -= dt;
    shot.x += shot.vx * dt;
    shot.z += shot.vz * dt;
    if (shot.life <= 0) {
      continue;
    }
    const blocked = world.obstacles.some((box) => (
      shot.x >= box.minX
      && shot.x <= box.maxX
      && shot.z >= box.minZ
      && shot.z <= box.maxZ
    ));
    if (blocked) {
      continue;
    }
    if (circlesOverlap(shot.x, shot.z, shot.radius, world.player.x, world.player.z, world.player.radius)) {
      damagePlayer(world, shot.damage, shot.ownerId);
      continue;
    }
    next.push(shot);
  }
  world.projectiles = next;
}

export function stepSlice(world, dt = FIXED_DT) {
  if (world.paused || world.defeated) {
    world.input.attack = false;
    return world;
  }
  world.time += dt;
  world.events.length = 0;
  tickPlayer(world, dt);
  for (const enemy of world.enemies) {
    tickEnemy(world, enemy, dt);
  }
  tickProjectiles(world, dt);
  if (world.enemies.every((enemy) => !enemy.alive)) {
    world.cleared = true;
  }
  world.input.attack = false;
  return world;
}

export function applyInput(world, { moveX = 0, moveZ = 0, attack = false } = {}) {
  world.input.moveX = moveX;
  world.input.moveZ = moveZ;
  if (attack) {
    world.input.attack = true;
  }
}

export function snapshotSlice(world) {
  return {
    seed: world.seed,
    time: Number(world.time.toFixed(4)),
    paused: world.paused,
    cleared: world.cleared,
    defeated: world.defeated,
    cameraMode: world.cameraMode,
    player: {
      x: Number(world.player.x.toFixed(4)),
      z: Number(world.player.z.toFixed(4)),
      hp: world.player.hp,
      swinging: world.player.swinging,
      facingX: Number(world.player.facingX.toFixed(4)),
      facingZ: Number(world.player.facingZ.toFixed(4)),
    },
    enemies: world.enemies.map((enemy) => ({
      id: enemy.id,
      kind: enemy.kind,
      uniqueMesh: enemy.uniqueMesh,
      alive: enemy.alive,
      hp: enemy.hp,
      x: Number(enemy.x.toFixed(4)),
      z: Number(enemy.z.toFixed(4)),
      telegraph: Number(enemy.telegraph.toFixed(4)),
    })),
    projectiles: world.projectiles.map((shot) => ({
      x: Number(shot.x.toFixed(4)),
      z: Number(shot.z.toFixed(4)),
      life: Number(shot.life.toFixed(4)),
    })),
    identity: {
      game: "DOFA ARENA",
      hero: HERO_IDENTITY.name,
      height: HERO_IDENTITY.heightMeters,
      backText: HERO_IDENTITY.backText,
      head: HERO_IDENTITY.head.kind,
    },
  };
}

export function replay(inputs, { seed = TOUR.seed, dt = FIXED_DT } = {}) {
  const world = createSliceWorld({ seed });
  for (const input of inputs) {
    applyInput(world, input);
    stepSlice(world, dt);
  }
  return world;
}
