import { RUN_CONFIG, VIEWPORT } from "../config/game-config.js";
import {
  calculateRunBeanReward,
  canEnterRun,
  getRunEntryCost,
} from "../core/economy.js";
import { SeededRng } from "../core/rng.js";
import { createLocalRunReceipt } from "../core/run-receipt.js";
import { consumeFixedSteps } from "../core/fixed-timestep.js";
import { applyAbility, chooseAbilityCards } from "./abilities.js";
import {
  DEFAULT_TOUR_ID,
  getEnemyDefinition,
  getRoomDefinition,
  getTourDefinition,
} from "./content.js";
import {
  DEFAULT_HERO_ID,
  createHeroCombatProfile,
  getHeroDefinition,
} from "./heroes.js";

const TAU = Math.PI * 2;
const ENEMY_COLOR = "#bc4b2f";
const ARENA = VIEWPORT.arena;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function length(x, y) {
  return Math.hypot(x, y);
}

function normalize(x, y) {
  const magnitude = length(x, y);
  if (magnitude < 0.0001) {
    return { x: 0, y: 0 };
  }
  return { x: x / magnitude, y: y / magnitude };
}

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export class DoffaGame {
  constructor({ canvas, profileStore, onHud, onProfile, onAbilityChoice, onRunEnd }) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError("DoffaGame requires a canvas element");
    }

    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false });
    this.profileStore = profileStore;
    this.onHud = onHud;
    this.onProfile = onProfile;
    this.onAbilityChoice = onAbilityChoice;
    this.onRunEnd = onRunEnd;

    this.mode = "idle";
    this.tour = getTourDefinition(DEFAULT_TOUR_ID);
    this.hero = getHeroDefinition(profileStore.profile?.selectedHeroId) ?? getHeroDefinition(DEFAULT_HERO_ID);
    this.roomDefinition = null;
    this.room = 0;
    this.clearedRooms = 0;
    this.score = 0;
    this.player = createHeroCombatProfile(this.hero.id);
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.ownedAbilities = [];
    this.keys = new Set();
    this.pointer = null;
    this.clearDelay = 0;
    this.nextEnemyId = 1;
    this.lastFrame = 0;
    this.accumulator = 0;
    this.paused = false;
    this.frameRequest = 0;
    this.rng = new SeededRng();

    this.bindInput();
  }

  bindInput() {
    const movementKeys = new Set([
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
    ]);

    window.addEventListener("keydown", (event) => {
      if (movementKeys.has(event.code)) {
        event.preventDefault();
        this.keys.add(event.code);
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    this.canvas.addEventListener("pointerdown", (event) => {
      if (this.mode !== "running") {
        return;
      }

      const point = this.toCanvasPoint(event);
      this.pointer = {
        id: event.pointerId,
        startX: point.x,
        startY: point.y,
        x: point.x,
        y: point.y,
      };
      this.canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointer || this.pointer.id !== event.pointerId) {
        return;
      }

      const point = this.toCanvasPoint(event);
      this.pointer.x = point.x;
      this.pointer.y = point.y;
      event.preventDefault();
    });

    const releasePointer = (event) => {
      if (this.pointer?.id === event.pointerId) {
        this.pointer = null;
      }
    };

    this.canvas.addEventListener("pointerup", releasePointer);
    this.canvas.addEventListener("pointercancel", releasePointer);
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.keys.clear();
        this.pointer = null;
        this.lastFrame = 0;
        this.accumulator = 0;
      }
    });
  }

  toCanvasPoint(event) {
    const bounds = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * VIEWPORT.width,
      y: ((event.clientY - bounds.top) / bounds.height) * VIEWPORT.height,
    };
  }

  startLoop() {
    if (this.frameRequest) {
      return;
    }

    const frame = (timestamp) => {
      const elapsed = this.lastFrame ? Math.max(0, (timestamp - this.lastFrame) / 1_000) : 0;
      this.lastFrame = timestamp;

      if (this.mode === "running" && !this.paused && elapsed > 0) {
        const result = consumeFixedSteps(
          this.accumulator,
          elapsed,
          (step) => this.update(step),
          () => this.mode === "running" && !this.paused,
        );
        this.accumulator = result.accumulator;
      } else {
        this.accumulator = 0;
      }
      this.draw();
      this.frameRequest = requestAnimationFrame(frame);
    };

    this.frameRequest = requestAnimationFrame(frame);
  }

  beginRun(tourId = DEFAULT_TOUR_ID, heroId = this.profileStore.profile.selectedHeroId) {
    const tour = getTourDefinition(tourId);
    if (!tour?.unlocked) {
      return { ok: false, reason: "tour-unavailable" };
    }

    const hero = getHeroDefinition(heroId);
    if (!hero?.unlocked) {
      return { ok: false, reason: "hero-unavailable" };
    }

    const profile = this.profileStore.profile;
    if (!canEnterRun(profile.beans)) {
      return { ok: false, missingBeans: getRunEntryCost() - profile.beans };
    }

    this.profileStore.update((draft) => {
      draft.beans -= getRunEntryCost();
      draft.runsStarted += 1;
    });
    this.onProfile(this.profileStore.profile);

    this.mode = "running";
    this.tour = tour;
    this.hero = hero;
    this.roomDefinition = null;
    this.room = 1;
    this.clearedRooms = 0;
    this.score = 0;
    this.player = createHeroCombatProfile(hero.id);
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.ownedAbilities = [];
    this.clearDelay = 0;
    this.nextEnemyId = 1;
    this.accumulator = 0;
    this.paused = false;
    this.rng = new SeededRng(Date.now() ^ (this.profileStore.profile.runsStarted * 2_654_435_761));
    this.spawnRoom(this.room);
    this.emitHud();
    return { ok: true, hero };
  }

  abortRun() {
    if (this.mode === "running" || this.mode === "choice") {
      this.finishRun(false);
    }
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    this.pointer = null;
    this.keys.clear();
    this.accumulator = 0;
  }

  chooseAbility(abilityId) {
    if (this.mode !== "choice") {
      return false;
    }

    applyAbility(this.player, abilityId);
    this.ownedAbilities.push(abilityId);
    this.room += 1;
    this.mode = "running";
    this.spawnRoom(this.room);
    this.emitHud();
    return true;
  }

  spawnRoom(roomNumber) {
    this.enemies = [];
    this.projectiles = [];
    this.clearDelay = 0;
    this.player.x = RUN_CONFIG.playerStartX;
    this.player.y = RUN_CONFIG.playerStartY;
    this.player.invulnerability = 0.7;

    const roomDefinition = getRoomDefinition(this.tour.id, roomNumber);
    if (!roomDefinition) {
      throw new RangeError(`Unknown room ${roomNumber} for tour ${this.tour.id}`);
    }

    this.roomDefinition = roomDefinition;
    const types = roomDefinition.enemies;
    const columns = Math.min(3, types.length);
    types.forEach((type, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const spacing = 160;
      const centerOffset = ((columns - 1) * spacing) / 2;
      const x = VIEWPORT.width / 2 + column * spacing - centerOffset + this.rng.int(-22, 22);
      const y = 330 + row * 190 + this.rng.int(-24, 24);
      this.enemies.push(this.createEnemy(type, x, y, roomNumber));
    });
  }

  createEnemy(type, x, y, roomNumber) {
    const base = getEnemyDefinition(type);
    if (!base) {
      throw new RangeError(`Unknown enemy type: ${type}`);
    }

    const isBoss = base.boss;
    const scale = isBoss ? 1 : 1 + (roomNumber - 1) * 0.085;
    const hp = Math.round(base.hp * scale);
    return {
      id: this.nextEnemyId++,
      type,
      behavior: base.behavior,
      isBoss,
      x,
      y,
      radius: base.radius,
      hp,
      maxHp: hp,
      speed: base.speed,
      contactDamage: base.contactDamage,
      score: base.score,
      attackTimer: this.rng.next() * 0.8 + 0.4,
      contactTimer: 0,
      state: "idle",
      stateTimer: 0,
      phaseTimer: 0,
      dashX: 0,
      dashY: 0,
      orbitDirection: this.rng.next() > 0.5 ? 1 : -1,
      hitFlash: 0,
      alive: true,
    };
  }

  update(delta) {
    if (!this.player || this.player.hp <= 0) {
      return;
    }

    this.player.invulnerability = Math.max(0, this.player.invulnerability - delta);
    this.updatePlayer(delta);
    this.updateEnemies(delta);
    this.resolveEnemySeparation();
    this.updateProjectiles(delta);
    this.updateParticles(delta);

    this.enemies = this.enemies.filter((enemy) => enemy.alive);
    this.projectiles = this.projectiles.filter((projectile) => projectile.alive);
    this.particles = this.particles.filter((particle) => particle.life > 0);

    if (this.enemies.length === 0) {
      if (this.clearDelay <= 0) {
        this.clearDelay = 0.58;
      } else {
        this.clearDelay -= delta;
        if (this.clearDelay <= 0) {
          this.handleRoomClear();
        }
      }
    } else {
      this.clearDelay = 0;
    }

    this.emitHud();
  }

  updatePlayer(delta) {
    const direction = this.getMovementDirection();
    const moving = Math.abs(direction.x) > 0.01 || Math.abs(direction.y) > 0.01;
    this.player.moving = moving;

    if (moving) {
      this.player.facing = Math.atan2(direction.y, direction.x);
      this.player.x += direction.x * this.player.speed * delta;
      this.player.y += direction.y * this.player.speed * delta;
      this.player.attackTimer = Math.max(this.player.attackTimer, 0.08);
    } else {
      this.player.attackTimer -= delta;
      if (this.player.attackTimer <= 0 && this.enemies.length > 0) {
        const fired = this.fireAtNearestEnemy();
        this.player.attackTimer = fired ? this.player.attackInterval : 0.08;
      }
    }

    this.player.x = clamp(this.player.x, ARENA.left + this.player.radius, ARENA.right - this.player.radius);
    this.player.y = clamp(this.player.y, ARENA.top + this.player.radius, ARENA.bottom - this.player.radius);
  }

  getMovementDirection() {
    let x = 0;
    let y = 0;

    if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) x -= 1;
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) x += 1;
    if (this.keys.has("ArrowUp") || this.keys.has("KeyW")) y -= 1;
    if (this.keys.has("ArrowDown") || this.keys.has("KeyS")) y += 1;

    if (this.pointer) {
      const pointerX = this.pointer.x - this.pointer.startX;
      const pointerY = this.pointer.y - this.pointer.startY;
      if (length(pointerX, pointerY) > 8) {
        x += pointerX;
        y += pointerY;
      }
    }

    return normalize(x, y);
  }

  fireAtNearestEnemy() {
    let target = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const enemy of this.enemies) {
      const currentDistance = distanceSquared(this.player, enemy);
      if (currentDistance < nearestDistance) {
        nearestDistance = currentDistance;
        target = enemy;
      }
    }

    if (!target || nearestDistance > this.player.attackRange * this.player.attackRange) {
      return false;
    }

    const baseAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    this.player.facing = baseAngle;
    const count = this.player.projectileCount;
    const spread = count > 1 ? Math.min(0.42, 0.14 * (count - 1)) : 0;

    for (let index = 0; index < count; index += 1) {
      const offset = count === 1 ? 0 : -spread / 2 + (spread * index) / (count - 1);
      const angle = baseAngle + offset;
      const critical = this.rng.next() < this.player.critChance;
      this.projectiles.push({
        x: this.player.x + Math.cos(angle) * 30,
        y: this.player.y + Math.sin(angle) * 30,
        vx: Math.cos(angle) * this.player.projectileSpeed,
        vy: Math.sin(angle) * this.player.projectileSpeed,
        radius: this.player.projectileRadius * (critical ? 1.2 : 1),
        damage: this.player.damage * (critical ? 2 : 1),
        friendly: true,
        critical,
        color: this.player.accent,
        secondary: this.player.secondary,
        visual: this.player.weaponVisual,
        maxAge: this.player.projectileLifetime,
        splashRadius: this.player.splashRadius,
        hitsLeft: this.player.pierce + 1,
        wallBounces: this.player.wallBounces,
        hitIds: new Set(),
        age: 0,
        alive: true,
      });
    }

    this.spawnParticles(this.player.x, this.player.y, this.player.accent, 4, 90);
    return true;
  }

  updateEnemies(delta) {
    for (const enemy of this.enemies) {
      enemy.attackTimer -= delta;
      enemy.contactTimer = Math.max(0, enemy.contactTimer - delta);
      enemy.stateTimer = Math.max(0, enemy.stateTimer - delta);
      enemy.phaseTimer += delta;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - delta);

      if (enemy.behavior === "ash_hound") {
        this.updateAshHound(enemy, delta);
      } else if (enemy.behavior === "ember_oracle") {
        this.updateEmberOracle(enemy, delta);
      } else if (enemy.behavior === "brass_colossus") {
        this.updateBrassColossus(enemy, delta);
      } else if (enemy.behavior === "smoke_revenant") {
        this.updateSmokeRevenant(enemy, delta);
      } else if (enemy.behavior === "hollow_roaster") {
        this.updateBoss(enemy, delta);
      }

      enemy.x = clamp(enemy.x, ARENA.left + enemy.radius, ARENA.right - enemy.radius);
      enemy.y = clamp(enemy.y, ARENA.top + enemy.radius, ARENA.bottom - enemy.radius);

      const collisionRadius = enemy.radius + this.player.radius;
      if (distanceSquared(enemy, this.player) <= collisionRadius * collisionRadius && enemy.contactTimer <= 0) {
        this.damagePlayer(enemy.contactDamage);
        enemy.contactTimer = 0.7;
      }
    }
  }

  moveEnemyToward(enemy, targetX, targetY, speed, delta) {
    const direction = normalize(targetX - enemy.x, targetY - enemy.y);
    enemy.x += direction.x * speed * delta;
    enemy.y += direction.y * speed * delta;
  }

  updateAshHound(enemy, delta) {
    const pulse = 0.82 + Math.sin(enemy.phaseTimer * 4 + enemy.id) * 0.18;
    this.moveEnemyToward(enemy, this.player.x, this.player.y, enemy.speed * pulse, delta);
  }

  updateEmberOracle(enemy, delta) {
    const toPlayerX = this.player.x - enemy.x;
    const toPlayerY = this.player.y - enemy.y;
    const currentDistance = length(toPlayerX, toPlayerY);
    const direction = normalize(toPlayerX, toPlayerY);

    if (currentDistance < 245) {
      enemy.x -= direction.x * enemy.speed * delta;
      enemy.y -= direction.y * enemy.speed * delta;
    } else if (currentDistance > 390) {
      enemy.x += direction.x * enemy.speed * delta;
      enemy.y += direction.y * enemy.speed * delta;
    }

    enemy.x += -direction.y * enemy.orbitDirection * enemy.speed * 0.42 * delta;
    enemy.y += direction.x * enemy.orbitDirection * enemy.speed * 0.42 * delta;

    if (enemy.attackTimer <= 0) {
      this.fireEnemyAimed(enemy, 330, 9);
      enemy.attackTimer = 1.45 + this.rng.next() * 0.35;
    }
  }

  updateBrassColossus(enemy, delta) {
    if (enemy.state === "windup") {
      if (enemy.stateTimer <= 0) {
        const direction = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
        enemy.dashX = direction.x;
        enemy.dashY = direction.y;
        enemy.state = "dash";
        enemy.stateTimer = 0.55;
      }
      return;
    }

    if (enemy.state === "dash") {
      enemy.x += enemy.dashX * 540 * delta;
      enemy.y += enemy.dashY * 540 * delta;
      if (enemy.stateTimer <= 0) {
        enemy.state = "idle";
        enemy.attackTimer = 1.8;
      }
      return;
    }

    this.moveEnemyToward(enemy, this.player.x, this.player.y, enemy.speed, delta);
    if (enemy.attackTimer <= 0) {
      enemy.state = "windup";
      enemy.stateTimer = 0.72;
      this.spawnParticles(enemy.x, enemy.y, "#d98c46", 10, 80);
    }
  }

  updateSmokeRevenant(enemy, delta) {
    const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
    const desiredX = this.player.x + Math.cos(angle + enemy.orbitDirection * 0.6) * 310;
    const desiredY = this.player.y + Math.sin(angle + enemy.orbitDirection * 0.6) * 310;
    this.moveEnemyToward(enemy, desiredX, desiredY, enemy.speed, delta);

    if (enemy.attackTimer <= 0) {
      const baseAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      for (const offset of [-0.16, 0, 0.16]) {
        this.fireEnemyProjectile(enemy.x, enemy.y, baseAngle + offset, 290, 8, 7);
      }
      enemy.attackTimer = 2.05;
    }
  }

  updateBoss(enemy, delta) {
    const enraged = enemy.hp / enemy.maxHp < 0.5;
    const targetX = VIEWPORT.width / 2 + Math.sin(enemy.phaseTimer * 0.7) * 170;
    const targetY = 340 + Math.cos(enemy.phaseTimer * 0.55) * 80;
    this.moveEnemyToward(enemy, targetX, targetY, enemy.speed * (enraged ? 1.35 : 1), delta);

    if (enemy.attackTimer <= 0) {
      const bulletCount = enraged ? 16 : 12;
      const phaseOffset = enemy.phaseTimer * 0.45;
      for (let index = 0; index < bulletCount; index += 1) {
        const angle = phaseOffset + (index / bulletCount) * TAU;
        this.fireEnemyProjectile(enemy.x, enemy.y, angle, enraged ? 330 : 275, enraged ? 11 : 9, 8);
      }

      const aimed = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      for (const offset of [-0.22, 0, 0.22]) {
        this.fireEnemyProjectile(enemy.x, enemy.y, aimed + offset, 390, 12, 9);
      }

      this.spawnParticles(enemy.x, enemy.y, "#ee7135", 18, 165);
      enemy.attackTimer = enraged ? 1.15 : 1.7;
    }
  }

  fireEnemyAimed(enemy, speed, damage) {
    const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
    this.fireEnemyProjectile(enemy.x, enemy.y, angle, speed, damage, 8);
  }

  fireEnemyProjectile(x, y, angle, speed, damage, radius) {
    this.projectiles.push({
      x: x + Math.cos(angle) * 30,
      y: y + Math.sin(angle) * 30,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      damage,
      friendly: false,
      age: 0,
      alive: true,
    });
  }

  resolveEnemySeparation() {
    for (let firstIndex = 0; firstIndex < this.enemies.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < this.enemies.length; secondIndex += 1) {
        const first = this.enemies[firstIndex];
        const second = this.enemies[secondIndex];
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const currentDistance = Math.max(0.001, length(dx, dy));
        const minimumDistance = first.radius + second.radius + 6;
        if (currentDistance >= minimumDistance) {
          continue;
        }

        const overlap = (minimumDistance - currentDistance) / 2;
        const nx = dx / currentDistance;
        const ny = dy / currentDistance;
        first.x -= nx * overlap;
        first.y -= ny * overlap;
        second.x += nx * overlap;
        second.y += ny * overlap;
      }
    }
  }

  updateProjectiles(delta) {
    for (const projectile of this.projectiles) {
      projectile.age += delta;
      projectile.x += projectile.vx * delta;
      projectile.y += projectile.vy * delta;

      if (projectile.friendly) {
        this.handleFriendlyProjectileWalls(projectile);
        this.handleFriendlyProjectileHits(projectile);
      } else {
        this.handleEnemyProjectile(projectile);
      }

      if (projectile.age > (projectile.maxAge ?? 6)) {
        projectile.alive = false;
      }
    }
  }

  handleFriendlyProjectileWalls(projectile) {
    const hitHorizontal = projectile.x < ARENA.left || projectile.x > ARENA.right;
    const hitVertical = projectile.y < ARENA.top || projectile.y > ARENA.bottom;

    if (!hitHorizontal && !hitVertical) {
      return;
    }

    if (projectile.wallBounces > 0) {
      if (hitHorizontal) projectile.vx *= -1;
      if (hitVertical) projectile.vy *= -1;
      projectile.x = clamp(projectile.x, ARENA.left, ARENA.right);
      projectile.y = clamp(projectile.y, ARENA.top, ARENA.bottom);
      projectile.wallBounces -= 1;
      this.spawnParticles(projectile.x, projectile.y, projectile.color ?? this.player.accent, 3, 65);
    } else {
      projectile.alive = false;
    }
  }

  handleFriendlyProjectileHits(projectile) {
    if (!projectile.alive) {
      return;
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive || projectile.hitIds.has(enemy.id)) {
        continue;
      }

      const combinedRadius = projectile.radius + enemy.radius;
      if (distanceSquared(projectile, enemy) > combinedRadius * combinedRadius) {
        continue;
      }

      projectile.hitIds.add(enemy.id);
      projectile.hitsLeft -= 1;
      const impactColor = projectile.critical ? "#fff0b0" : projectile.color;
      this.damageEnemy(enemy, projectile.damage, projectile.x, projectile.y, impactColor);

      if (projectile.splashRadius > 0) {
        this.damageEnemiesAround(projectile, enemy);
      }

      if (projectile.hitsLeft <= 0) {
        projectile.alive = false;
        break;
      }
    }
  }

  damageEnemiesAround(projectile, impactEnemy) {
    const radiusSquared = projectile.splashRadius * projectile.splashRadius;
    this.spawnParticles(impactEnemy.x, impactEnemy.y, projectile.secondary, 14, 185);

    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.id === impactEnemy.id || projectile.hitIds.has(enemy.id)) {
        continue;
      }
      if (distanceSquared(impactEnemy, enemy) > radiusSquared) {
        continue;
      }

      projectile.hitIds.add(enemy.id);
      this.damageEnemy(
        enemy,
        Math.round(projectile.damage * 0.45),
        enemy.x,
        enemy.y,
        projectile.secondary,
      );
    }
  }

  damageEnemy(enemy, amount, impactX, impactY, color) {
    if (!enemy.alive) {
      return;
    }

    enemy.hp -= amount;
    enemy.hitFlash = 0.09;
    this.spawnParticles(impactX, impactY, color, 6, 130);

    if (enemy.hp <= 0) {
      enemy.alive = false;
      this.score += enemy.score;
      this.spawnParticles(enemy.x, enemy.y, ENEMY_COLOR, enemy.isBoss ? 46 : 18, 230);
    }
  }

  handleEnemyProjectile(projectile) {
    if (
      projectile.x < ARENA.left - 30 ||
      projectile.x > ARENA.right + 30 ||
      projectile.y < ARENA.top - 30 ||
      projectile.y > ARENA.bottom + 30
    ) {
      projectile.alive = false;
      return;
    }

    const combinedRadius = projectile.radius + this.player.radius;
    if (distanceSquared(projectile, this.player) <= combinedRadius * combinedRadius) {
      projectile.alive = false;
      this.damagePlayer(projectile.damage);
    }
  }

  damagePlayer(amount) {
    if (this.player.invulnerability > 0 || this.mode !== "running") {
      return;
    }

    this.player.hp = Math.max(0, this.player.hp - amount);
    this.player.invulnerability = 0.48;
    this.spawnParticles(this.player.x, this.player.y, "#d74232", 14, 170);

    if (this.player.hp <= 0) {
      this.finishRun(false);
    }
  }

  spawnParticles(x, y, color, count, speed) {
    for (let index = 0; index < count; index += 1) {
      const angle = this.rng.next() * TAU;
      const velocity = speed * (0.35 + this.rng.next() * 0.65);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: 1.5 + this.rng.next() * 3.5,
        color,
        life: 0.25 + this.rng.next() * 0.45,
        maxLife: 0.7,
      });
    }
  }

  updateParticles(delta) {
    for (const particle of this.particles) {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      particle.life -= delta;
    }
  }

  handleRoomClear() {
    if (this.mode !== "running") {
      return;
    }

    this.clearedRooms = Math.max(this.clearedRooms, this.room);
    if (this.room >= this.tour.rooms.length) {
      this.finishRun(true);
      return;
    }

    this.mode = "choice";
    this.pointer = null;
    this.keys.clear();
    const choices = chooseAbilityCards(this.rng, RUN_CONFIG.abilityChoices, this.ownedAbilities);
    this.onAbilityChoice(choices);
  }

  finishRun(bossDefeated) {
    if (this.mode === "result" || this.mode === "idle") {
      return;
    }

    const roomsCleared = bossDefeated
      ? this.tour.rooms.length
      : Math.max(this.clearedRooms, Math.max(0, this.room - 1));
    const beanReward = calculateRunBeanReward({ roomsCleared, bossDefeated });
    const receipt = createLocalRunReceipt({
      tourId: this.tour.id,
      heroId: this.hero.id,
      roomsCleared,
      bossDefeated,
      score: this.score,
    });

    this.profileStore.update((draft) => {
      draft.beans += beanReward;
      draft.lifetimeBeans += beanReward;
      draft.bestRoom = Math.max(draft.bestRoom, roomsCleared);
      const tourProgress = draft.tourProgress[this.tour.id] ?? {
        bestRoom: 0,
        bossesDefeated: 0,
      };
      draft.tourProgress[this.tour.id] = {
        bestRoom: Math.max(tourProgress.bestRoom, roomsCleared),
        bossesDefeated: tourProgress.bossesDefeated + (bossDefeated ? 1 : 0),
      };
      if (bossDefeated) {
        draft.bossesDefeated += 1;
      }
    });

    this.mode = "result";
    this.paused = false;
    this.accumulator = 0;
    this.pointer = null;
    this.keys.clear();
    this.projectiles = [];
    this.onProfile(this.profileStore.profile);
    this.onRunEnd({
      bossDefeated,
      tour: this.tour,
      hero: this.hero,
      roomsCleared,
      beanReward,
      score: this.score,
      receipt,
    });
  }

  emitHud() {
    this.onHud({
      room: this.room,
      totalRooms: this.tour.rooms.length,
      tourCode: this.tour.code,
      roomName: this.roomDefinition?.name ?? "SEALED CHAMBER",
      heroName: this.hero.name,
      weaponName: this.hero.weapon,
      hp: Math.ceil(this.player.hp),
      maxHp: Math.ceil(this.player.maxHp),
    });
  }

  draw() {
    const context = this.context;
    this.drawArena(context);

    for (const particle of this.particles) {
      context.save();
      context.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, TAU);
      context.fill();
      context.restore();
    }

    for (const projectile of this.projectiles) {
      this.drawProjectile(context, projectile);
    }

    for (const enemy of this.enemies) {
      this.drawEnemy(context, enemy);
    }

    if (this.mode !== "idle") {
      this.drawPlayer(context);
      this.drawJoystick(context);
    } else {
      this.drawIdleSeal(context);
    }
  }

  drawArena(context) {
    const gradient = context.createLinearGradient(0, 0, 0, VIEWPORT.height);
    gradient.addColorStop(0, "#180d09");
    gradient.addColorStop(0.52, "#100b09");
    gradient.addColorStop(1, "#090706");
    context.fillStyle = gradient;
    context.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

    context.save();
    context.strokeStyle = "rgba(208, 133, 66, 0.09)";
    context.lineWidth = 1;
    for (let x = ARENA.left; x <= ARENA.right; x += 52) {
      context.beginPath();
      context.moveTo(x, ARENA.top);
      context.lineTo(x, ARENA.bottom);
      context.stroke();
    }
    for (let y = ARENA.top; y <= ARENA.bottom; y += 52) {
      context.beginPath();
      context.moveTo(ARENA.left, y);
      context.lineTo(ARENA.right, y);
      context.stroke();
    }

    context.strokeStyle = "rgba(230, 180, 97, 0.34)";
    context.lineWidth = 4;
    context.strokeRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);

    context.fillStyle = this.enemies.length === 0 ? "#b46c36" : "#2d1710";
    context.fillRect(VIEWPORT.width / 2 - 78, ARENA.top - 8, 156, 16);
    context.restore();

    context.save();
    context.fillStyle = "rgba(230, 180, 97, 0.12)";
    context.font = "700 54px Arial Narrow, sans-serif";
    context.textAlign = "center";
    context.fillText(String(Math.max(1, this.room)).padStart(2, "0"), VIEWPORT.width / 2, 92);
    context.font = "700 15px Arial Narrow, sans-serif";
    context.letterSpacing = "4px";
    context.fillText(this.roomDefinition?.name ?? "SEALED CHAMBER", VIEWPORT.width / 2, 118);
    context.restore();
  }

  drawIdleSeal(context) {
    context.save();
    context.translate(VIEWPORT.width / 2, VIEWPORT.height / 2);
    context.strokeStyle = "rgba(230, 180, 97, 0.28)";
    context.lineWidth = 5;
    context.beginPath();
    context.arc(0, 0, 135, 0, TAU);
    context.stroke();
    context.rotate(-Math.PI / 4);
    context.fillStyle = "rgba(230, 180, 97, 0.16)";
    context.fillRect(-7, -190, 14, 380);
    context.restore();
  }

  drawProjectile(context, projectile) {
    context.save();
    context.shadowBlur = projectile.friendly ? 18 : 14;
    context.shadowColor = projectile.friendly ? projectile.color : "#e34e2c";
    context.fillStyle = projectile.friendly
      ? projectile.critical ? "#fff2b4" : projectile.color
      : "#d84b2e";

    if (!projectile.friendly) {
      context.beginPath();
      context.arc(projectile.x, projectile.y, projectile.radius, 0, TAU);
      context.fill();
      context.restore();
      return;
    }

    context.translate(projectile.x, projectile.y);
    context.rotate(Math.atan2(projectile.vy, projectile.vx));
    context.strokeStyle = projectile.critical ? "#fff2b4" : projectile.secondary;
    context.lineWidth = Math.max(3, projectile.radius * 0.42);

    if (projectile.visual === "impact") {
      context.beginPath();
      context.arc(0, 0, projectile.radius * 1.15, -0.8, 0.8);
      context.stroke();
      context.fillRect(-projectile.radius * 0.2, -projectile.radius * 0.55, projectile.radius * 1.4, projectile.radius * 1.1);
    } else if (projectile.visual === "hammer") {
      context.rotate(Math.PI / 4);
      context.fillRect(-projectile.radius * 0.78, -projectile.radius * 0.78, projectile.radius * 1.56, projectile.radius * 1.56);
      context.strokeRect(-projectile.radius, -projectile.radius, projectile.radius * 2, projectile.radius * 2);
    } else if (projectile.visual === "shears") {
      context.fillRect(-projectile.radius * 1.5, -2, projectile.radius * 3, 4);
      context.rotate(Math.PI / 3);
      context.fillRect(-projectile.radius * 1.5, -2, projectile.radius * 3, 4);
    } else if (projectile.visual === "razor") {
      context.rotate(Math.PI / 4 + projectile.age * 13);
      context.fillRect(-projectile.radius * 0.8, -projectile.radius * 0.8, projectile.radius * 1.6, projectile.radius * 1.6);
    } else {
      context.fillRect(-projectile.radius * 2.6, -projectile.radius * 0.5, projectile.radius * 5.2, projectile.radius);
    }
    context.restore();
  }

  drawPlayer(context) {
    const player = this.player;
    context.save();
    context.translate(player.x, player.y);
    context.rotate(player.facing + Math.PI / 2);
    if (player.invulnerability > 0 && Math.floor(player.invulnerability * 18) % 2 === 0) {
      context.globalAlpha = 0.46;
    }

    context.shadowBlur = player.moving ? 8 : 20;
    context.shadowColor = player.accent;
    context.fillStyle = "#120e0b";
    context.strokeStyle = player.accent;
    context.lineWidth = 4;
    this.drawPlayerWeapon(context, player);
    context.beginPath();
    context.moveTo(0, -31);
    context.lineTo(23, 22);
    context.lineTo(0, 31);
    context.lineTo(-23, 22);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = player.secondary;
    context.fillRect(-4, -40, 8, 24);
    context.fillStyle = "#f2d194";
    context.beginPath();
    context.arc(0, -13, 8, 0, TAU);
    context.fill();
    context.fillStyle = player.accent;
    context.font = "800 9px Arial Narrow, sans-serif";
    context.textAlign = "center";
    context.fillText(this.hero.monogram, 0, 13);
    context.restore();
  }

  drawPlayerWeapon(context, player) {
    context.save();
    context.strokeStyle = player.secondary;
    context.fillStyle = player.accent;
    context.lineWidth = 6;
    context.lineCap = "round";

    if (player.weaponVisual === "impact") {
      context.beginPath();
      context.moveTo(19, 20);
      context.lineTo(34, -34);
      context.stroke();
      context.lineWidth = 10;
      context.beginPath();
      context.moveTo(33, -32);
      context.lineTo(38, -50);
      context.stroke();
    } else if (player.weaponVisual === "hammer") {
      context.beginPath();
      context.moveTo(21, 23);
      context.lineTo(31, -34);
      context.stroke();
      context.fillRect(17, -48, 31, 17);
    } else if (player.weaponVisual === "shears" || player.weaponVisual === "razor") {
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(-28, 12);
      context.lineTo(-9, -39);
      context.moveTo(28, 12);
      context.lineTo(9, -39);
      context.stroke();
      context.beginPath();
      context.arc(-24, 17, 7, 0, TAU);
      context.arc(24, 17, 7, 0, TAU);
      context.stroke();
    } else {
      context.fillRect(15, -39, 10, 62);
      context.fillRect(9, -42, 22, 11);
      context.fillRect(17, 18, 17, 7);
    }

    context.restore();
  }

  drawEnemy(context, enemy) {
    context.save();
    context.translate(enemy.x, enemy.y);
    const facing = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
    context.rotate(facing + Math.PI / 2);
    context.shadowBlur = enemy.isBoss ? 24 : 11;
    context.shadowColor = enemy.hitFlash > 0 ? "#fff4d0" : "#a53d25";
    context.strokeStyle = enemy.hitFlash > 0 ? "#fff4d0" : "#d56b3c";
    context.fillStyle = enemy.hitFlash > 0 ? "#e9c695" : "#27110d";
    context.lineWidth = enemy.isBoss ? 6 : 4;

    if (enemy.type === "ash_hound") {
      context.beginPath();
      context.moveTo(0, -32);
      context.lineTo(17, -12);
      context.lineTo(30, 6);
      context.lineTo(14, 9);
      context.lineTo(25, 30);
      context.lineTo(0, 19);
      context.lineTo(-25, 30);
      context.lineTo(-14, 9);
      context.lineTo(-30, 6);
      context.lineTo(-17, -12);
      context.closePath();
      context.fill();
      context.stroke();
      context.fillStyle = "#ef8c4e";
      context.fillRect(-11, -15, 6, 5);
      context.fillRect(5, -15, 6, 5);
    } else if (enemy.type === "ember_oracle") {
      context.rotate(-facing - Math.PI / 2 + enemy.phaseTimer * 0.6);
      for (let index = 0; index < 6; index += 1) {
        context.rotate(TAU / 6);
        context.beginPath();
        context.moveTo(0, -19);
        context.lineTo(8, -37);
        context.lineTo(-8, -37);
        context.closePath();
        context.fill();
        context.stroke();
      }
      context.beginPath();
      context.arc(0, 0, 23, 0, TAU);
      context.fill();
      context.stroke();
      context.fillStyle = "#ef8c4e";
      context.beginPath();
      context.ellipse(0, 0, 12, 6, 0, 0, TAU);
      context.fill();
      context.fillStyle = "#150805";
      context.beginPath();
      context.arc(0, 0, 4, 0, TAU);
      context.fill();
    } else if (enemy.type === "brass_colossus") {
      if (enemy.state === "windup") {
        context.shadowBlur = 32;
        context.shadowColor = "#ef9a4a";
      }
      context.beginPath();
      context.moveTo(-30, -34);
      context.lineTo(30, -34);
      context.lineTo(38, 18);
      context.lineTo(19, 35);
      context.lineTo(-19, 35);
      context.lineTo(-38, 18);
      context.closePath();
      context.fill();
      context.stroke();
      context.strokeStyle = "#8e4c2b";
      context.beginPath();
      context.moveTo(-25, -15);
      context.lineTo(25, -15);
      context.moveTo(-31, 7);
      context.lineTo(31, 7);
      context.stroke();
      context.fillStyle = "#f0a357";
      context.fillRect(-17, -25, 9, 5);
      context.fillRect(8, -25, 9, 5);
    } else if (enemy.type === "smoke_revenant") {
      context.rotate(-facing - Math.PI / 2 + Math.sin(enemy.phaseTimer * 2) * 0.25);
      context.beginPath();
      context.arc(0, -3, 27, 0.18 * Math.PI, 1.82 * Math.PI);
      context.lineTo(10, 40);
      context.lineTo(0, 29);
      context.lineTo(-12, 42);
      context.closePath();
      context.fill();
      context.stroke();
      context.fillStyle = "#d85c3a";
      context.beginPath();
      context.arc(-9, -8, 4, 0, TAU);
      context.arc(9, -8, 4, 0, TAU);
      context.fill();
    } else {
      context.rotate(-facing - Math.PI / 2 + enemy.phaseTimer * 0.25);
      for (let index = 0; index < 12; index += 1) {
        context.rotate(TAU / 12);
        context.beginPath();
        context.moveTo(-7, -63);
        context.lineTo(0, -92);
        context.lineTo(7, -63);
        context.closePath();
        context.fill();
        context.stroke();
      }
      context.beginPath();
      context.arc(0, 0, 63, 0, TAU);
      context.fill();
      context.stroke();
      context.strokeStyle = "#8f4c2c";
      context.lineWidth = 8;
      context.beginPath();
      context.arc(0, 0, 43, 0, TAU);
      context.stroke();
      context.fillStyle = "#f07a3d";
      context.beginPath();
      context.moveTo(-30, -15);
      context.lineTo(-8, -7);
      context.lineTo(-30, 1);
      context.closePath();
      context.moveTo(30, -15);
      context.lineTo(8, -7);
      context.lineTo(30, 1);
      context.closePath();
      context.fill();
      context.fillRect(-21, 25, 42, 7);
    }
    context.restore();

    this.drawEnemyHealth(context, enemy);
  }

  drawEnemyHealth(context, enemy) {
    const isBoss = enemy.isBoss;
    const width = isBoss ? 430 : enemy.radius * 2.2;
    const y = isBoss ? 145 : enemy.y - enemy.radius - 18;
    const x = isBoss ? (VIEWPORT.width - width) / 2 : enemy.x - width / 2;
    const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
    context.save();
    context.fillStyle = "rgba(8, 5, 4, 0.8)";
    context.fillRect(x, y, width, isBoss ? 11 : 5);
    context.fillStyle = isBoss ? "#d35b34" : "#a84930";
    context.fillRect(x, y, width * ratio, isBoss ? 11 : 5);
    if (isBoss) {
      context.fillStyle = "rgba(243, 223, 189, 0.82)";
      context.font = "700 14px Arial Narrow, sans-serif";
      context.textAlign = "center";
      context.fillText("THE HOLLOW ROASTER", VIEWPORT.width / 2, y - 10);
    }
    context.restore();
  }

  drawJoystick(context) {
    if (!this.pointer || this.mode !== "running") {
      return;
    }

    const dx = this.pointer.x - this.pointer.startX;
    const dy = this.pointer.y - this.pointer.startY;
    const direction = normalize(dx, dy);
    const distance = Math.min(74, length(dx, dy));
    context.save();
    context.globalAlpha = 0.42;
    context.strokeStyle = this.player.accent;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(this.pointer.startX, this.pointer.startY, 74, 0, TAU);
    context.stroke();
    context.fillStyle = this.player.secondary;
    context.beginPath();
    context.arc(
      this.pointer.startX + direction.x * distance,
      this.pointer.startY + direction.y * distance,
      29,
      0,
      TAU,
    );
    context.fill();
    context.restore();
  }
}
