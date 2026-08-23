import { RUN_CONFIG, VIEWPORT } from "../config/game-config.js";
import {
  calculateRunBeanReward,
  canEnterRun,
  getRunEntryCost,
} from "../core/economy.js";
import { SeededRng } from "../core/rng.js";
import { createLocalRunReceipt } from "../core/run-receipt.js";
import { ACTIVE_RUN_CHECKPOINT_VERSION } from "../core/active-run-checkpoint.js";
import { consumeFixedSteps } from "../core/fixed-timestep.js";
import { applyAbility, chooseAbilityCards } from "./abilities.js";
import { AnimationPageCache } from "./animation-page-cache.js";
import { getRoomAssetWindow } from "./asset-window.js";
import {
  circlesOverlap,
  getCircleRectangleCollision,
  isHazardActive,
  resolveCircleAgainstRectangles,
} from "./arena-geometry.js";
import {
  DEFAULT_TOUR_ID,
  getEnemyDefinition,
  getRoomDefinition,
  getTourDefinition,
} from "./content.js";
import {
  advanceEnemyAnimation,
  getEnemyDirectionalStateFrame,
  getEnemyFullMotionFrame,
  getEnemyReactionAnimationState,
  getEnemySpecialAnimationState,
  triggerEnemyAttack,
  triggerEnemyDefeat,
  triggerEnemyHit,
} from "./enemy-animation.js";
import {
  acquireDestructibleSpriteLease,
  createRuntimeDestructible,
  getDestructibleDefinition,
} from "./destructibles.js";
import {
  acquireEnemyMotionSpriteLease,
  acquireEnemyReactionSpriteLease,
  acquireEnemySpecialSpriteLease,
  acquireEnemySpriteLease,
  loadEnemyMotionAnimationPage,
  loadEnemyReactionAnimationPage,
  loadEnemySpecialAnimationPage,
} from "./enemy-sprites.js";
import {
  MAX_INVENTORY_ITEMS,
  getLoadoutModifiers,
  rollEquipmentDrop,
} from "./equipment.js";
import {
  DEFAULT_HERO_ID,
  createHeroCombatProfile,
  getHeroDefinition,
} from "./heroes.js";
import {
  acquireHeroDirectionalSpriteLease,
  acquireHeroFullMotionSpriteLease,
  acquireHeroMotionSpriteLease,
  acquireHeroReactionSpriteLease,
  acquireHeroSecondaryAttackSpriteLease,
  acquireHeroSpriteLease,
  loadHeroFullMotionAnimationPage,
  loadHeroReactionAnimationPage,
} from "./hero-sprites.js";
import { calculateRunHeroXp, grantHeroXp } from "./progression.js";
import {
  advancePlayerAnimation,
  getPlayerAnimationFrame,
  getPlayerAnimationPose,
  getPlayerFacingDirection,
  getPlayerFullMotionFrame,
  triggerPlayerAttack,
  triggerPlayerDefeat,
  triggerPlayerHit,
} from "./player-animation.js";
import { getRunXpRequirement, grantRunXp } from "./run-progression.js";
import { acquireRoomArtLease, getRoomArt } from "./room-art.js";
import {
  getRoomAmbientMote,
  getRoomEffectProfile,
  getRoomEffectState,
} from "./room-effects.js";
import { releaseSprite } from "./sprite-loader.js";

const TAU = Math.PI * 2;
const ENEMY_COLOR = "#bc4b2f";
const ARENA = VIEWPORT.arena;
const ROOM_PALETTES = Object.freeze({
  ash: { top: "#24120e", floor: "#160e0c", bottom: "#090706", line: "#75402c", accent: "#ca5d31" },
  ember: { top: "#29130c", floor: "#1c100b", bottom: "#0b0705", line: "#8d4c25", accent: "#f07a32" },
  brass: { top: "#21170e", floor: "#17120d", bottom: "#090806", line: "#806239", accent: "#d5a447" },
  smoke: { top: "#171318", floor: "#100e13", bottom: "#070609", line: "#57445c", accent: "#b7563b" },
  pressure: { top: "#181618", floor: "#111014", bottom: "#070608", line: "#6e5547", accent: "#d66b3b" },
  heart: { top: "#2a0e09", floor: "#180b08", bottom: "#070504", line: "#934126", accent: "#f0642d" },
  canopy: { top: "#102019", floor: "#0b1812", bottom: "#050b08", line: "#365d43", accent: "#80b75c" },
  mire: { top: "#111b16", floor: "#0b1410", bottom: "#050806", line: "#3e5a48", accent: "#7ca45a" },
  mycelium: { top: "#181326", floor: "#100d1b", bottom: "#07050d", line: "#57456d", accent: "#7ec6c9" },
  briar: { top: "#1c1017", floor: "#130b10", bottom: "#080507", line: "#633848", accent: "#b85b6b" },
  rootdeep: { top: "#17120d", floor: "#100c09", bottom: "#070504", line: "#59432d", accent: "#bd7b35" },
  rootheart: { top: "#21120a", floor: "#140b07", bottom: "#070403", line: "#754322", accent: "#e58a32" },
});
const HAZARD_COLORS = Object.freeze({
  smoke: "#8f6174",
  ember: "#f05b2d",
  steam: "#e6b461",
  pressure: "#e6b461",
  thorn: "#bd4e67",
  venom: "#6da34d",
  spore: "#7b70c4",
  root: "#bd7638",
});
const ANIMATION_PAGE_RETRY_MS = 1_500;
const ANIMATION_PAGE_CACHE_MAX_ENTRIES = 10;
const ANIMATION_PAGE_CACHE_MAX_BYTES = 64 * 1024 * 1024;

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
    this.heroLevel = profileStore.profile?.heroProgress?.[this.hero.id]?.level ?? 1;
    this.roomDefinition = null;
    this.room = 0;
    this.wave = 0;
    this.waveCountdown = null;
    this.roomExitOpen = false;
    this.hazardClock = 0;
    this.hazardDamageCooldown = 0;
    this.clearedRooms = 0;
    this.score = 0;
    this.player = createHeroCombatProfile(this.hero.id, {
      level: this.heroLevel,
      modifiers: getLoadoutModifiers(
        profileStore.profile?.inventory,
        profileStore.profile?.loadout,
      ),
    });
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.combatTexts = [];
    this.pickups = [];
    this.destructibles = [];
    this.ownedAbilities = [];
    this.activeAbilityChoices = new Set();
    this.runLevel = 1;
    this.runXp = 0;
    this.runXpToNext = getRunXpRequirement(this.runLevel);
    this.pendingAbilityChoices = 0;
    this.choiceContext = null;
    this.keys = new Set();
    this.pointer = null;
    this.clearDelay = 0;
    this.nextEnemyId = 1;
    this.nextPickupId = 1;
    this.nextDestructibleId = 1;
    this.nextCombatTextId = 1;
    this.visualClock = 0;
    this.animationPageUsageFrame = 0;
    this.screenShake = 0;
    this.lastFrame = 0;
    this.accumulator = 0;
    this.paused = false;
    this.frameRequest = 0;
    this.rng = new SeededRng();
    this.heroSprite = null;
    this.heroDirectionalSprite = null;
    this.heroMotionSprite = null;
    this.heroFullMotionSprite = null;
    this.heroReactionSprite = null;
    this.heroSecondaryAttackSprite = null;
    this.animationPageCache = new AnimationPageCache({
      maxEntries: ANIMATION_PAGE_CACHE_MAX_ENTRIES,
      maxBytes: ANIMATION_PAGE_CACHE_MAX_BYTES,
      dispose: (sprite, key) => {
        if (releaseSprite(key)) {
          return;
        }
        if (typeof sprite?.close === "function") {
          sprite.close();
        } else if (typeof sprite?.getContext === "function") {
          sprite.width = 0;
          sprite.height = 0;
        }
      },
    });
    this.heroSpriteLeases = new Map();
    this.heroFullMotionAnimationSprites = new Map();
    this.heroReactionAnimationSprites = new Map();
    this.enemySpriteLeases = new Map();
    this.enemySprites = new Map();
    this.enemyMotionSprites = new Map();
    this.enemySpecialSprites = new Map();
    this.enemyReactionSprites = new Map();
    this.enemyMotionAnimationSprites = new Map();
    this.enemySpecialAnimationSprites = new Map();
    this.enemyReactionAnimationSprites = new Map();
    this.destructibleSpriteLeases = new Map();
    this.destructibleSprites = new Map();
    this.roomSpriteLeases = new Map();
    this.roomSprites = new Map();
    this.assetWindowEnemyIds = new Set();
    this.assetWindowDestructibleTypes = new Set();
    this.assetWindowRoomSprites = new Set();
    this.loadedHeroId = null;

    this.bindInput();
  }

  requestHeroSprite(hero) {
    const requestedHeroId = hero?.id;
    if (this.loadedHeroId) {
      this.releaseAnimationPageMap(this.heroFullMotionAnimationSprites);
      this.releaseAnimationPageMap(this.heroReactionAnimationSprites);
      this.releaseHeroSpriteResources(this.loadedHeroId);
    }
    this.loadedHeroId = requestedHeroId ?? null;
    this.heroSprite = null;
    this.heroDirectionalSprite = null;
    this.heroMotionSprite = null;
    this.heroFullMotionSprite = null;
    this.heroReactionSprite = null;
    this.heroSecondaryAttackSprite = null;
    const requests = [
      ["base", "heroSprite", acquireHeroSpriteLease],
      ["directional", "heroDirectionalSprite", acquireHeroDirectionalSpriteLease],
      ["motion", "heroMotionSprite", acquireHeroMotionSpriteLease],
      ["full-motion", "heroFullMotionSprite", acquireHeroFullMotionSpriteLease],
      ["reaction", "heroReactionSprite", acquireHeroReactionSpriteLease],
      ["secondary", "heroSecondaryAttackSprite", acquireHeroSecondaryAttackSpriteLease],
    ];
    for (const [kind, field, acquire] of requests) {
      const lease = acquire(hero, { owner: `runtime:hero:${requestedHeroId}:${kind}` });
      this.heroSpriteLeases.set(kind, lease);
      lease.promise
        .then((sprite) => {
          const current = this.heroSpriteLeases.get(kind) === lease
            && this.loadedHeroId === requestedHeroId
            && this.hero?.id === requestedHeroId;
          if (!current || !sprite) {
            if (this.heroSpriteLeases.get(kind) === lease && !sprite) {
              this.heroSpriteLeases.delete(kind);
            }
            lease.release();
            return;
          }
          this[field] = sprite;
          this.startLoop();
        })
        .catch(() => {
          if (this.heroSpriteLeases.get(kind) === lease) {
            this.heroSpriteLeases.delete(kind);
            this[field] = null;
          }
          lease.release();
        });
    }
  }

  requestHeroAnimationPage(kind, pageId) {
    if (!pageId) {
      return null;
    }
    const pageMaps = {
      fullMotion: this.heroFullMotionAnimationSprites,
      reaction: this.heroReactionAnimationSprites,
    };
    const loaders = {
      fullMotion: loadHeroFullMotionAnimationPage,
      reaction: loadHeroReactionAnimationPage,
    };
    const pageMap = pageMaps[kind];
    const loader = loaders[kind];
    if (!pageMap || !loader) {
      return null;
    }
    const requestedHero = this.hero;
    const requestedHeroId = requestedHero?.id;
    const cacheNamespace = kind === "fullMotion"
      ? "hero-full-motion-page"
      : "hero-reaction-page";
    const cacheKey = `${cacheNamespace}:${requestedHeroId}:${pageId}`;
    return this.requestCachedAnimationPage({
      pageMap,
      localKey: pageId,
      cacheKey,
      loader: () => loader(requestedHero, pageId),
      isRelevant: () => (
        this.loadedHeroId === requestedHeroId
        && this.hero?.id === requestedHeroId
      ),
    });
  }

  requestEnemyAnimationPage(enemyId, kind, pageId) {
    if (!enemyId || !pageId) {
      return null;
    }
    const pageMaps = {
      motion: this.enemyMotionAnimationSprites,
      special: this.enemySpecialAnimationSprites,
      reaction: this.enemyReactionAnimationSprites,
    };
    const loaders = {
      motion: loadEnemyMotionAnimationPage,
      special: loadEnemySpecialAnimationPage,
      reaction: loadEnemyReactionAnimationPage,
    };
    const pageMap = pageMaps[kind];
    const loader = loaders[kind];
    if (!pageMap || !loader) {
      return null;
    }
    const localKey = `${enemyId}:${pageId}`;
    const cacheNamespace = kind === "motion"
      ? "enemy-motion-page"
      : kind === "special"
        ? "enemy-special-page"
        : "enemy-reaction-page";
    const cacheKey = `${cacheNamespace}:${enemyId}:${pageId}`;
    return this.requestCachedAnimationPage({
      pageMap,
      localKey,
      cacheKey,
      loader: () => loader(getEnemyDefinition(enemyId), pageId),
      isRelevant: () => this.assetWindowEnemyIds.has(enemyId),
    });
  }

  requestCachedAnimationPage({ pageMap, localKey, cacheKey, loader, isRelevant }) {
    const existing = pageMap.get(localKey);
    const usageFrame = this.animationPageUsageFrame;
    if (existing?.lease && existing.value) {
      existing.lastUsedFrame = usageFrame;
      return existing.value;
    }
    const cached = this.animationPageCache.get(cacheKey);
    if (
      existing?.status === "pending"
      || existing?.status === "permanent-error"
      || (existing?.retryAt ?? 0) > Date.now()
    ) {
      if (existing) {
        existing.lastUsedFrame = usageFrame;
      }
      return cached ?? null;
    }

    const record = existing ?? { cacheKey, retryAt: 0 };
    record.status = "pending";
    record.lastUsedFrame = usageFrame;
    record.value = null;
    record.lease = null;
    pageMap.set(localKey, record);
    this.animationPageCache.acquire(cacheKey, loader)
      .then((lease) => {
        const relevant = pageMap.get(localKey) === record && isRelevant();
        const loaded = lease.value;
        if (!relevant || !loaded) {
          lease.release();
          if (pageMap.get(localKey) === record) {
            pageMap.delete(localKey);
          }
          this.animationPageCache.evict(cacheKey);
          return;
        }
        const liveMode = this.mode === "running"
          || this.mode === "exit"
          || this.mode === "dying";
        if (
          liveMode
          && !this.paused
          && record.lastUsedFrame === this.animationPageUsageFrame
        ) {
          record.status = "ready";
          record.value = loaded;
          record.lease = lease;
          this.startLoop();
        } else {
          lease.release();
          record.status = "cached";
          record.value = null;
          record.lease = null;
        }
      })
      .catch((error) => {
        if (pageMap.get(localKey) !== record || !isRelevant()) {
          if (pageMap.get(localKey) === record) {
            pageMap.delete(localKey);
          }
          return;
        }
        if (error instanceof RangeError) {
          record.status = "permanent-error";
          return;
        }
        record.status = "retry-wait";
        record.retryAt = Date.now() + ANIMATION_PAGE_RETRY_MS;
      });
    return cached ?? null;
  }

  releaseUnusedAnimationPageLeases({ all = false } = {}) {
    for (const pageMap of [
      this.heroFullMotionAnimationSprites,
      this.heroReactionAnimationSprites,
      this.enemyMotionAnimationSprites,
      this.enemySpecialAnimationSprites,
      this.enemyReactionAnimationSprites,
    ]) {
      for (const record of pageMap.values()) {
        if (
          !record?.lease
          || (!all && record.lastUsedFrame === this.animationPageUsageFrame)
        ) {
          continue;
        }
        record.lease.release();
        record.lease = null;
        record.value = null;
        record.status = "cached";
      }
    }
  }

  releaseAnimationPageRecord(record) {
    if (!record?.cacheKey) {
      return false;
    }
    record.lease?.release();
    record.lease = null;
    record.value = null;
    if (this.animationPageCache.evict(record.cacheKey)) {
      return true;
    }
    return this.animationPageCache.cancelPending(record.cacheKey);
  }

  releaseAnimationPageMap(pageMap) {
    for (const record of pageMap.values()) {
      this.releaseAnimationPageRecord(record);
    }
    pageMap.clear();
  }

  releaseHeroSpriteResources(heroId) {
    for (const lease of this.heroSpriteLeases.values()) {
      lease.release();
    }
    this.heroSpriteLeases.clear();
  }

  releaseEnemySpriteResources(enemyId) {
    const resources = [
      ["base", this.enemySprites],
      ["motion", this.enemyMotionSprites],
      ["special", this.enemySpecialSprites],
      ["reaction", this.enemyReactionSprites],
    ];
    for (const [kind, spriteMap] of resources) {
      const leaseKey = `${kind}:${enemyId}`;
      this.enemySpriteLeases.get(leaseKey)?.release();
      this.enemySpriteLeases.delete(leaseKey);
      spriteMap.delete(enemyId);
    }
  }

  requestEnemySprites(enemyIds) {
    const requests = [
      ["base", this.enemySprites, acquireEnemySpriteLease],
      ["motion", this.enemyMotionSprites, acquireEnemyMotionSpriteLease],
      ["special", this.enemySpecialSprites, acquireEnemySpecialSpriteLease],
      ["reaction", this.enemyReactionSprites, acquireEnemyReactionSpriteLease],
    ];
    for (const enemyId of enemyIds) {
      const enemyDefinition = getEnemyDefinition(enemyId);
      for (const [kind, spriteMap, acquire] of requests) {
        if (spriteMap.has(enemyId)) {
          continue;
        }
        const leaseKey = `${kind}:${enemyId}`;
        const lease = acquire(enemyDefinition, {
          owner: `runtime:enemy:${enemyId}:${kind}`,
        });
        spriteMap.set(enemyId, null);
        this.enemySpriteLeases.set(leaseKey, lease);
        lease.promise
          .then((sprite) => {
            const current = this.enemySpriteLeases.get(leaseKey) === lease
              && this.assetWindowEnemyIds.has(enemyId)
              && spriteMap.has(enemyId);
            if (!current || !sprite) {
              if (this.enemySpriteLeases.get(leaseKey) === lease) {
                this.enemySpriteLeases.delete(leaseKey);
                if (!this.assetWindowEnemyIds.has(enemyId)) {
                  spriteMap.delete(enemyId);
                }
              }
              lease.release();
              return;
            }
            spriteMap.set(enemyId, sprite);
            this.startLoop();
          })
          .catch(() => {
            if (this.enemySpriteLeases.get(leaseKey) === lease) {
              this.enemySpriteLeases.delete(leaseKey);
              spriteMap.set(enemyId, null);
            }
            lease.release();
          });
      }
    }
  }

  requestDestructibleSprites(types) {
    for (const type of types) {
      if (this.destructibleSprites.has(type)) {
        continue;
      }
      const lease = acquireDestructibleSpriteLease(type, {
        owner: `runtime:destructible:${type}`,
      });
      this.destructibleSprites.set(type, null);
      this.destructibleSpriteLeases.set(type, lease);
      lease.promise
        .then((sprite) => {
          if (
            this.destructibleSpriteLeases.get(type) === lease
            && this.assetWindowDestructibleTypes.has(type)
            && this.destructibleSprites.has(type)
            && sprite
          ) {
            this.destructibleSprites.set(type, sprite);
            this.startLoop();
            return;
          }
          if (this.destructibleSpriteLeases.get(type) === lease) {
            this.destructibleSpriteLeases.delete(type);
            if (!this.assetWindowDestructibleTypes.has(type)) {
              this.destructibleSprites.delete(type);
            }
          }
          lease.release();
        })
        .catch(() => {
          if (this.destructibleSpriteLeases.get(type) === lease) {
            this.destructibleSpriteLeases.delete(type);
            this.destructibleSprites.set(type, null);
          }
          lease.release();
        });
    }
  }

  requestRoomSprite(environment, roomIdentity = {}) {
    const art = getRoomArt(environment, roomIdentity);
    if (!art || this.roomSprites.has(art.sprite)) {
      return;
    }
    const lease = acquireRoomArtLease(environment, roomIdentity, {
      owner: `runtime:room:${art.sprite}`,
    });
    this.roomSprites.set(art.sprite, null);
    this.roomSpriteLeases.set(art.sprite, lease);
    lease.promise
      .then((sprite) => {
        if (
          this.roomSpriteLeases.get(art.sprite) === lease
          && this.roomSprites.has(art.sprite)
          && sprite
        ) {
          this.roomSprites.set(art.sprite, sprite);
          this.startLoop();
          return;
        }
        if (this.roomSpriteLeases.get(art.sprite) === lease) {
          this.roomSpriteLeases.delete(art.sprite);
          if (!this.roomSprites.has(art.sprite)) {
            this.roomSprites.delete(art.sprite);
          }
        }
        lease.release();
      })
      .catch(() => {
        if (this.roomSpriteLeases.get(art.sprite) === lease) {
          this.roomSpriteLeases.delete(art.sprite);
          this.roomSprites.set(art.sprite, null);
        }
        lease.release();
      });
  }

  syncRoomAssetWindow(roomNumber, options = {}) {
    const window = getRoomAssetWindow(this.tour, roomNumber, options);
    this.assetWindowEnemyIds = window.enemyIds;
    this.assetWindowDestructibleTypes = window.destructibleTypes;
    this.assetWindowRoomSprites = window.roomSprites;

    const loadedEnemyIds = new Set([
      ...this.enemySprites.keys(),
      ...this.enemyMotionSprites.keys(),
      ...this.enemySpecialSprites.keys(),
      ...this.enemyReactionSprites.keys(),
      ...[...this.enemySpriteLeases.keys()].map((key) => key.split(":", 2)[1]),
      ...[...this.enemyMotionAnimationSprites.keys()].map((key) => key.split(":", 1)[0]),
      ...[...this.enemySpecialAnimationSprites.keys()].map((key) => key.split(":", 1)[0]),
      ...[...this.enemyReactionAnimationSprites.keys()].map((key) => key.split(":", 1)[0]),
    ]);
    for (const enemyId of loadedEnemyIds) {
      if (window.enemyIds.has(enemyId)) {
        continue;
      }
      this.releaseEnemySpriteResources(enemyId);
      this.enemySprites.delete(enemyId);
      this.enemyMotionSprites.delete(enemyId);
      this.enemySpecialSprites.delete(enemyId);
      this.enemyReactionSprites.delete(enemyId);
      for (const pageMap of [
        this.enemyMotionAnimationSprites,
        this.enemySpecialAnimationSprites,
        this.enemyReactionAnimationSprites,
      ]) {
        for (const key of pageMap.keys()) {
          if (key.startsWith(`${enemyId}:`)) {
            const record = pageMap.get(key);
            this.releaseAnimationPageRecord(record);
            pageMap.delete(key);
          }
        }
      }
    }

    for (const type of this.destructibleSprites.keys()) {
      if (!window.destructibleTypes.has(type)) {
        this.destructibleSpriteLeases.get(type)?.release();
        this.destructibleSpriteLeases.delete(type);
        this.destructibleSprites.delete(type);
      }
    }
    for (const sprite of this.roomSprites.keys()) {
      if (!window.roomSprites.has(sprite)) {
        this.roomSpriteLeases.get(sprite)?.release();
        this.roomSpriteLeases.delete(sprite);
        this.roomSprites.delete(sprite);
      }
    }

    this.requestEnemySprites(window.enemyIds);
    this.requestDestructibleSprites(window.destructibleTypes);
    for (let offset = 0; offset < window.rooms.length; offset += 1) {
      const room = window.rooms[offset];
      this.requestRoomSprite(room.environment, {
        roomId: room.id,
        roomNumber: roomNumber + offset,
        artVariant: room.artVariant,
      });
    }
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
      if (this.mode !== "running" && this.mode !== "exit") {
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
        return;
      }
      this.startLoop();
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
    if (
      this.frameRequest
      || typeof requestAnimationFrame !== "function"
      || document.hidden
    ) {
      return;
    }

    const frame = (timestamp) => {
      this.frameRequest = 0;
      const pageHidden = Boolean(document.hidden);
      const elapsed = this.lastFrame ? Math.max(0, (timestamp - this.lastFrame) / 1_000) : 0;
      this.lastFrame = timestamp;

      const simulationActive = this.mode === "running"
        || this.mode === "exit"
        || this.mode === "dying";
      if (!pageHidden && simulationActive && !this.paused && elapsed > 0) {
        const result = consumeFixedSteps(
          this.accumulator,
          elapsed,
          (step) => this.update(step),
          () => (
            this.mode === "running"
            || this.mode === "exit"
            || this.mode === "dying"
          ) && !this.paused,
        );
        this.accumulator = result.accumulator;
      } else {
        this.accumulator = 0;
      }
      if (!pageHidden) {
        this.draw();
      }
      const keepRendering = (
        this.mode === "running"
        || this.mode === "exit"
        || this.mode === "dying"
      ) && !this.paused && !pageHidden;
      if (keepRendering && !this.frameRequest) {
        this.frameRequest = requestAnimationFrame(frame);
      } else if (!keepRendering) {
        this.lastFrame = 0;
        this.accumulator = 0;
      }
    };

    this.frameRequest = requestAnimationFrame(frame);
  }

  resetRunRuntime(tour, hero, heroLevel, profile) {
    this.mode = "running";
    this.tour = tour;
    this.hero = hero;
    this.requestHeroSprite(hero);
    this.roomDefinition = null;
    this.room = 1;
    this.wave = 0;
    this.waveCountdown = null;
    this.roomExitOpen = false;
    this.hazardClock = 0;
    this.hazardDamageCooldown = 0;
    this.clearedRooms = 0;
    this.score = 0;
    this.heroLevel = heroLevel;
    this.player = createHeroCombatProfile(hero.id, {
      level: this.heroLevel,
      modifiers: getLoadoutModifiers(profile.inventory, profile.loadout),
    });
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.combatTexts = [];
    this.pickups = [];
    this.destructibles = [];
    this.ownedAbilities = [];
    this.activeAbilityChoices = new Set();
    this.runLevel = 1;
    this.runXp = 0;
    this.runXpToNext = getRunXpRequirement(this.runLevel);
    this.pendingAbilityChoices = 0;
    this.choiceContext = null;
    this.clearDelay = 0;
    this.nextEnemyId = 1;
    this.nextPickupId = 1;
    this.nextDestructibleId = 1;
    this.nextCombatTextId = 1;
    this.visualClock = 0;
    this.screenShake = 0;
    this.accumulator = 0;
    this.paused = false;
  }

  createRunId() {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return `run-${globalThis.crypto.randomUUID()}`;
    }
    const entropy = Math.floor(Math.random() * 0xffff_ffff).toString(36);
    return `run-${Date.now().toString(36)}-${entropy}`;
  }

  createActiveRunCheckpoint(phase = "room-start") {
    if (
      !this.runId
      || !this.tour?.id
      || !this.hero?.id
      || !this.player
      || !Number.isInteger(this.rng?.state)
      || this.rng.state <= 0
    ) {
      return null;
    }

    return {
      version: ACTIVE_RUN_CHECKPOINT_VERSION,
      runId: this.runId,
      tourId: this.tour.id,
      heroId: this.hero.id,
      phase,
      room: this.room,
      clearedRooms: this.clearedRooms,
      score: this.score,
      heroLevel: this.heroLevel,
      playerHp: this.player.hp,
      ownedAbilities: [...this.ownedAbilities],
      runLevel: this.runLevel,
      runXp: this.runXp,
      rngState: this.rng.state >>> 0,
      savedAt: Date.now(),
    };
  }

  persistActiveRunCheckpoint(phase = "room-start") {
    const checkpoint = this.createActiveRunCheckpoint(phase);
    if (!checkpoint || !this.profileStore?.update) {
      return false;
    }

    this.profileStore.update((draft) => {
      draft.activeRun = checkpoint;
    });
    return true;
  }

  discardInvalidActiveRun() {
    if (this.profileStore?.profile?.activeRun && this.profileStore?.update) {
      this.profileStore.update((draft) => {
        draft.activeRun = null;
      });
      this.onProfile(this.profileStore.profile);
    }
  }

  resumeRun() {
    const checkpoint = this.profileStore.profile?.activeRun;
    if (!checkpoint) {
      return { ok: false, reason: "no-checkpoint" };
    }

    const tour = getTourDefinition(checkpoint.tourId);
    const hero = getHeroDefinition(checkpoint.heroId);
    const roomDefinition = getRoomDefinition(checkpoint.tourId, checkpoint.room);
    const validChoice = checkpoint.phase !== "checkpoint-choice"
      || (
        checkpoint.room < (tour?.rooms.length ?? 0)
        && roomDefinition?.reward === "ability"
      );
    const validRoomExit = checkpoint.phase !== "room-exit"
      || roomDefinition?.roomType === "event";
    if (!tour?.unlocked || !hero?.unlocked || !roomDefinition || !validChoice || !validRoomExit) {
      this.discardInvalidActiveRun();
      return { ok: false, reason: "invalid-checkpoint" };
    }

    const profile = this.profileStore.profile;
    this.resetRunRuntime(tour, hero, checkpoint.heroLevel, profile);
    this.runId = checkpoint.runId;
    this.room = checkpoint.room;
    this.clearedRooms = checkpoint.clearedRooms;
    this.score = checkpoint.score;
    this.runLevel = checkpoint.runLevel;
    this.runXp = checkpoint.runXp;
    this.runXpToNext = getRunXpRequirement(this.runLevel);
    this.rng = new SeededRng(checkpoint.rngState);
    for (const abilityId of checkpoint.ownedAbilities) {
      applyAbility(this.player, abilityId);
      this.ownedAbilities.push(abilityId);
    }
    this.player.hp = clamp(checkpoint.playerHp, 1, this.player.maxHp);

    if (checkpoint.phase === "room-start") {
      this.spawnRoom(this.room);
      this.emitHud();
      this.startLoop();
      return { ok: true, resumed: true, hero, tour, room: this.room };
    }

    this.roomDefinition = roomDefinition;
    this.syncRoomAssetWindow(this.room, { combatRoomOffset: 1 });
    if (checkpoint.phase === "checkpoint-choice") {
      this.openAbilityChoice("checkpoint", "running");
    } else {
      this.mode = "exit";
      this.roomExitOpen = true;
      this.player.invulnerability = 0.7;
      this.emitHud();
    }
    this.startLoop();
    return { ok: true, resumed: true, hero, tour, room: this.room };
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
    if (profile.activeRun) {
      return { ok: false, reason: "run-in-progress" };
    }
    if (!canEnterRun(profile.beans)) {
      return { ok: false, missingBeans: getRunEntryCost() - profile.beans };
    }

    this.heroLevel = profile.heroProgress?.[hero.id]?.level ?? 1;
    this.resetRunRuntime(tour, hero, this.heroLevel, profile);
    this.runId = this.createRunId();
    this.rng = new SeededRng(Date.now() ^ ((profile.runsStarted + 1) * 2_654_435_761));
    const checkpoint = this.createActiveRunCheckpoint("room-start");
    this.profileStore.update((draft) => {
      draft.beans -= getRunEntryCost();
      draft.runsStarted += 1;
      draft.activeRun = checkpoint;
    });
    this.onProfile(this.profileStore.profile);
    this.spawnRoom(this.room);
    this.emitHud();
    this.startLoop();
    return { ok: true, hero };
  }

  abortRun() {
    if (
      this.mode === "running"
      || this.mode === "choice"
      || this.mode === "exit"
      || this.mode === "dying"
    ) {
      this.finishRun(false);
    }
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    this.pointer = null;
    this.keys.clear();
    this.accumulator = 0;
    if (!this.paused) {
      this.startLoop();
    }
  }

  chooseAbility(abilityId) {
    if (this.mode !== "choice" || !this.activeAbilityChoices.has(abilityId)) {
      return false;
    }

    const choiceContext = this.choiceContext;
    this.activeAbilityChoices.clear();
    applyAbility(this.player, abilityId);
    this.ownedAbilities.push(abilityId);
    if (choiceContext?.source === "level") {
      if (this.pendingAbilityChoices > 0) {
        this.openAbilityChoice("level", choiceContext.resumeMode);
      } else {
        this.choiceContext = null;
        this.mode = choiceContext.resumeMode;
        this.emitHud();
        this.startLoop();
      }
      return true;
    }

    if (choiceContext?.source === "event") {
      this.choiceContext = null;
      this.mode = "exit";
      this.roomExitOpen = true;
      this.player.invulnerability = Math.max(this.player.invulnerability ?? 0, 0.7);
      this.spawnParticles(VIEWPORT.width / 2, ARENA.top + 22, "#e6b461", 24, 130);
      this.clearedRooms = Math.max(this.clearedRooms, this.room);
      this.persistActiveRunCheckpoint("room-exit");
      this.emitHud();
      this.startLoop();
      return true;
    }

    this.choiceContext = null;
    this.advanceToNextRoom();
    return true;
  }

  openAbilityChoice(source, resumeMode = this.mode) {
    if (source === "level") {
      if (this.pendingAbilityChoices <= 0) {
        return false;
      }
      this.pendingAbilityChoices -= 1;
    }

    this.mode = "choice";
    this.choiceContext = { source, resumeMode };
    this.pointer = null;
    this.keys.clear();
    const choices = chooseAbilityCards(this.rng, RUN_CONFIG.abilityChoices, this.ownedAbilities);
    this.activeAbilityChoices = new Set(choices.map((ability) => ability.id));
    this.onAbilityChoice(choices, {
      source,
      runLevel: this.runLevel,
      pendingChoices: this.pendingAbilityChoices,
    });
    return true;
  }

  advanceToNextRoom() {
    this.room += 1;
    this.mode = "running";
    this.persistActiveRunCheckpoint("room-start");
    this.spawnRoom(this.room);
    this.emitHud();
    this.startLoop();
  }

  spawnRoom(roomNumber) {
    this.enemies = [];
    this.projectiles = [];
    this.combatTexts = [];
    this.pickups = [];
    this.destructibles = [];
    this.clearDelay = 0;
    this.waveCountdown = null;
    this.roomExitOpen = false;
    this.hazardClock = 0;
    this.hazardDamageCooldown = 0;
    this.player.x = RUN_CONFIG.playerStartX;
    this.player.y = RUN_CONFIG.playerStartY;
    this.player.invulnerability = 0.7;

    const roomDefinition = getRoomDefinition(this.tour.id, roomNumber);
    if (!roomDefinition) {
      throw new RangeError(`Unknown room ${roomNumber} for tour ${this.tour.id}`);
    }

    this.roomDefinition = roomDefinition;
    this.syncRoomAssetWindow(roomNumber);
    this.destructibles = roomDefinition.destructibles.map((placement) => (
      createRuntimeDestructible(placement, this.nextDestructibleId++)
    ));

    if (roomDefinition.roomType === "rest") {
      this.wave = 0;
      this.mode = "exit";
      this.roomExitOpen = true;
      this.healPlayer(this.player.maxHp * roomDefinition.restorationPct);
      this.spawnParticles(this.player.x, this.player.y, "#74d692", 22, 115);
      this.syncRoomAssetWindow(roomNumber, { combatRoomOffset: 1 });
      return;
    }
    if (roomDefinition.roomType === "event") {
      this.wave = 0;
      this.syncRoomAssetWindow(roomNumber, { combatRoomOffset: 1 });
      this.openAbilityChoice("event", "exit");
      return;
    }

    this.wave = 1;
    this.spawnWave(this.wave);
  }

  spawnWave(waveNumber) {
    const types = this.roomDefinition?.waves[waveNumber - 1];
    if (!types) {
      throw new RangeError(`Unknown wave ${waveNumber} for room ${this.roomDefinition?.id ?? "unknown"}`);
    }

    this.enemies = [];
    this.projectiles = [];
    this.waveCountdown = null;
    this.player.invulnerability = Math.max(this.player.invulnerability, 0.42);
    const columns = Math.min(3, types.length);
    types.forEach((type, index) => {
      const definition = getEnemyDefinition(type);
      const prominent = definition?.elite || definition?.boss;
      const column = index % columns;
      const row = Math.floor(index / columns);
      const spacing = 160;
      const centerOffset = ((columns - 1) * spacing) / 2;
      const x = prominent
        ? VIEWPORT.width / 2
        : VIEWPORT.width / 2 + column * spacing - centerOffset + this.rng.int(-22, 22);
      const y = prominent ? 372 : 330 + row * 190 + this.rng.int(-24, 24);
      const enemy = this.createEnemy(type, x, y, this.room);
      this.resolveEntityObstacles(enemy);
      this.enemies.push(enemy);
    });
  }

  createEnemy(type, x, y, roomNumber) {
    const base = getEnemyDefinition(type);
    if (!base) {
      throw new RangeError(`Unknown enemy type: ${type}`);
    }

    const isBoss = base.boss;
    const isElite = base.elite;
    const scale = isBoss
      ? 1
      : isElite
        ? 1 + (roomNumber - 1) * 0.015
        : 1 + (roomNumber - 1) * 0.028;
    const hp = Math.round(base.hp * scale);
    return {
      id: this.nextEnemyId++,
      type,
      behavior: base.behavior,
      isBoss,
      isElite,
      x,
      y,
      radius: base.radius,
      hp,
      maxHp: hp,
      speed: base.speed,
      contactDamage: base.contactDamage,
      score: base.score,
      xp: base.xp,
      attackTimer: this.rng.next() * 0.8 + 0.4,
      contactTimer: 0,
      state: "idle",
      stateTimer: 0,
      phaseTimer: 0,
      dashX: 0,
      dashY: 0,
      dashRepeats: 0,
      submerged: false,
      orbitDirection: this.rng.next() > 0.5 ? 1 : -1,
      aimAngle: 0,
      attackPattern: null,
      attackSequence: 0,
      phaseTransitioned: false,
      telegraphDuration: base.telegraphSeconds ?? 0.6,
      hitFlash: 0,
      facing: Math.PI / 2,
      moving: false,
      animationClock: 0,
      animationState: "idle",
      animationStateClock: 0,
      animationStateDirection: "south",
      attackAnimation: 0,
      defeated: false,
      defeatTimer: 0,
      alive: true,
    };
  }

  update(delta) {
    if (!this.player) {
      return;
    }

    this.visualClock += delta;
    this.screenShake = Math.max(0, this.screenShake - delta * 24);
    if (this.mode === "dying") {
      this.updateDying(delta);
      return;
    }
    if (this.player.hp <= 0) {
      return;
    }
    this.player.invulnerability = Math.max(0, this.player.invulnerability - delta);
    this.hazardDamageCooldown = Math.max(0, this.hazardDamageCooldown - delta);
    this.updateDestructibles(delta);
    this.updatePlayer(delta);
    if (this.mode === "running" || this.mode === "exit") {
      this.updatePickups(delta);
    }

    if (this.mode === "choice") {
      this.updateParticles(delta);
      this.updateCombatTexts(delta);
      this.pickups = this.pickups.filter((pickup) => pickup.alive);
      this.particles = this.particles.filter((particle) => particle.life > 0);
      this.combatTexts = this.combatTexts.filter((entry) => entry.life > 0);
      this.emitHud();
      return;
    }

    if (this.mode === "exit") {
      this.updateParticles(delta);
      this.updateCombatTexts(delta);
      this.pickups = this.pickups.filter((pickup) => pickup.alive);
      this.particles = this.particles.filter((particle) => particle.life > 0);
      this.combatTexts = this.combatTexts.filter((entry) => entry.life > 0);
      const reachedDoor = this.player.y <= ARENA.top + this.player.radius + 12
        && Math.abs(this.player.x - VIEWPORT.width / 2) <= 82;
      if (reachedDoor) {
        this.handleRoomExit();
      }
      this.emitHud();
      return;
    }

    this.hazardClock += delta;
    this.updateHazards();
    if (this.mode !== "running") {
      return;
    }

    this.updateEnemies(delta);
    this.resolveEnemySeparation();
    this.resolveAllEnemyObstacles();
    this.updateProjectiles(delta);
    this.updateParticles(delta);
    this.updateCombatTexts(delta);

    this.enemies = this.enemies.filter((enemy) => enemy.alive);
    this.projectiles = this.projectiles.filter((projectile) => projectile.alive);
    this.pickups = this.pickups.filter((pickup) => pickup.alive);
    this.particles = this.particles.filter((particle) => particle.life > 0);
    this.combatTexts = this.combatTexts.filter((entry) => entry.life > 0);

    this.updateEncounterState(delta);

    this.emitHud();
  }

  updateDying(delta) {
    this.player.moving = false;
    advancePlayerAnimation(this.player, delta, false);
    this.updateParticles(delta);
    this.updateCombatTexts(delta);
    this.particles = this.particles.filter((particle) => particle.life > 0);
    this.combatTexts = this.combatTexts.filter((entry) => entry.life > 0);

    const defeatFrame = this.hero?.art?.reactionAnimation
      ? getPlayerFullMotionFrame(
        this.player,
        this.hero.art.reactionStateRows,
        this.hero.art.reactionAnimation,
      )
      : null;
    if (defeatFrame?.completed || this.player.defeatAnimation <= 0) {
      this.finishRun(false);
      return;
    }
    this.emitHud();
  }

  updateEncounterState(delta) {
    if (this.enemies.length > 0) {
      this.clearDelay = 0;
      this.waveCountdown = null;
      return;
    }

    const totalWaves = this.roomDefinition?.waves.length ?? 1;
    if (this.wave < totalWaves) {
      if (this.waveCountdown === null) {
        this.waveCountdown = RUN_CONFIG.waveCountdownSeconds;
        this.projectiles = [];
        this.spawnParticles(VIEWPORT.width / 2, 270, "#e6b461", 12, 75);
        return;
      }

      this.waveCountdown -= delta;
      if (this.waveCountdown <= 0) {
        this.wave += 1;
        this.spawnWave(this.wave);
      }
      return;
    }

    if (this.clearDelay <= 0) {
      this.clearDelay = 0.58;
      return;
    }

    this.clearDelay -= delta;
    if (this.clearDelay <= 0) {
      this.handleRoomClear();
    }
  }

  updatePlayer(delta) {
    const direction = this.getMovementDirection();
    const moving = Math.abs(direction.x) > 0.01 || Math.abs(direction.y) > 0.01;
    this.player.moving = moving;
    advancePlayerAnimation(this.player, delta, moving);

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
    this.resolveEntityObstacles(this.player);
  }

  resolveEntityObstacles(entity) {
    const obstacles = this.getActiveCollisionObstacles();
    if (obstacles.length === 0) {
      return false;
    }

    const resolved = resolveCircleAgainstRectangles(entity, entity.radius, obstacles);
    entity.x = clamp(resolved.x, ARENA.left + entity.radius, ARENA.right - entity.radius);
    entity.y = clamp(resolved.y, ARENA.top + entity.radius, ARENA.bottom - entity.radius);
    return resolved.hit;
  }

  getActiveCollisionObstacles() {
    const staticObstacles = this.roomDefinition?.obstacles ?? [];
    const activeDestructibles = (this.destructibles ?? []).filter((item) => item.alive);
    return activeDestructibles.length > 0
      ? [...staticObstacles, ...activeDestructibles]
      : staticObstacles;
  }

  updateDestructibles(delta) {
    for (const destructible of this.destructibles ?? []) {
      destructible.hitFlash = Math.max(0, (destructible.hitFlash ?? 0) - delta);
    }
  }

  resolveAllEnemyObstacles() {
    for (const enemy of this.enemies) {
      this.resolveEntityObstacles(enemy);
    }
  }

  updateHazards() {
    if (this.hazardDamageCooldown > 0) {
      return;
    }

    for (const hazard of this.roomDefinition?.hazards ?? []) {
      if (!isHazardActive(hazard, this.hazardClock)
        || !circlesOverlap(this.player, this.player.radius, hazard, hazard.radius)) {
        continue;
      }

      const hpBefore = this.player.hp;
      this.damagePlayer(hazard.damage);
      if (this.player.hp < hpBefore) {
        this.hazardDamageCooldown = 0.82;
        this.spawnParticles(this.player.x, this.player.y, "#f08a45", 18, 150);
      }
      return;
    }
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
      if (!enemy.alive || enemy.defeated) {
        continue;
      }
      const currentDistance = distanceSquared(this.player, enemy);
      if (currentDistance < nearestDistance) {
        nearestDistance = currentDistance;
        target = enemy;
      }
    }

    const secondaryWeapon = this.player.secondaryWeapon;
    const maximumRange = Math.max(
      this.player.attackRange,
      secondaryWeapon?.attackRange ?? 0,
    );
    if (!target || nearestDistance > maximumRange * maximumRange) {
      return false;
    }

    const baseAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    this.player.facing = baseAngle;
    triggerPlayerAttack(this.player);
    const nextAttackSequence = (this.player.attackSequence ?? 0) + 1;
    const useSecondary = Boolean(
      secondaryWeapon
      && (nearestDistance > this.player.attackRange * this.player.attackRange
        || nextAttackSequence % secondaryWeapon.every === 0),
    );
    const weapon = useSecondary ? secondaryWeapon : null;
    const count = useSecondary
      ? weapon.projectileCount + Math.max(0, this.player.projectileCount - 1)
      : this.player.projectileCount;
    const spread = count > 1
      ? Math.min(0.52, weapon?.spread ?? 0.14 * (count - 1))
      : 0;
    this.player.attackSequence = nextAttackSequence;
    this.player.lastAttackVisual = weapon?.visual ?? this.player.weaponVisual;

    for (let index = 0; index < count; index += 1) {
      const offset = count === 1 ? 0 : -spread / 2 + (spread * index) / (count - 1);
      const angle = baseAngle + offset;
      const critical = this.rng.next() < this.player.critChance;
      this.projectiles.push({
        x: this.player.x + Math.cos(angle) * 30,
        y: this.player.y + Math.sin(angle) * 30,
        vx: Math.cos(angle) * (weapon?.projectileSpeed ?? this.player.projectileSpeed),
        vy: Math.sin(angle) * (weapon?.projectileSpeed ?? this.player.projectileSpeed),
        radius: (weapon
          ? weapon.projectileRadius * (this.player.projectileRadius / this.player.baseProjectileRadius)
          : this.player.projectileRadius) * (critical ? 1.2 : 1),
        damage: this.player.damage * (weapon?.damageMultiplier ?? 1) * (critical ? 2 : 1),
        friendly: true,
        critical,
        color: this.player.accent,
        secondary: this.player.secondary,
        visual: weapon?.visual ?? this.player.weaponVisual,
        maxAge: weapon?.projectileLifetime ?? this.player.projectileLifetime,
        splashRadius: weapon
          ? weapon.splashRadius + Math.max(0, this.player.splashRadius - this.player.baseSplashRadius)
          : this.player.splashRadius,
        hitsLeft: (weapon
          ? weapon.pierce + Math.max(0, this.player.pierce - this.player.basePierce)
          : this.player.pierce) + 1,
        wallBounces: weapon
          ? weapon.wallBounces + Math.max(0, this.player.wallBounces - this.player.baseWallBounces)
          : this.player.wallBounces,
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
      advanceEnemyAnimation(enemy, delta);
      enemy.moving = false;
      const previousX = enemy.x;
      const previousY = enemy.y;
      enemy.attackTimer -= delta;
      enemy.contactTimer = Math.max(0, enemy.contactTimer - delta);
      enemy.stateTimer = Math.max(0, enemy.stateTimer - delta);
      enemy.phaseTimer += delta;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - delta);

      if (enemy.defeated) {
        enemy.defeatTimer = Math.max(0, (enemy.defeatTimer ?? 0) - delta);
        if (enemy.defeatTimer <= 0) {
          enemy.alive = false;
        }
        continue;
      }

      if (enemy.behavior === "ash_hound") {
        this.updateAshHound(enemy, delta);
      } else if (enemy.behavior === "ember_oracle") {
        this.updateEmberOracle(enemy, delta);
      } else if (enemy.behavior === "brass_colossus") {
        this.updateBrassColossus(enemy, delta);
      } else if (enemy.behavior === "smoke_revenant") {
        this.updateSmokeRevenant(enemy, delta);
      } else if (enemy.behavior === "kiln_warden") {
        this.updateKilnWarden(enemy, delta);
      } else if (enemy.behavior === "pressure_widow") {
        this.updatePressureWidow(enemy, delta);
      } else if (enemy.behavior === "cinder_bishop") {
        this.updateCinderBishop(enemy, delta);
      } else if (enemy.behavior === "grinder_saint") {
        this.updateGrinderSaint(enemy, delta);
      } else if (enemy.behavior === "hollow_roaster") {
        this.updateBoss(enemy, delta);
      } else if (enemy.behavior === "razor_mantis") {
        this.updateRazorMantis(enemy, delta);
      } else if (enemy.behavior === "seed_spitter") {
        this.updateSeedSpitter(enemy, delta);
      } else if (enemy.behavior === "root_stalker") {
        this.updateRootStalker(enemy, delta);
      } else if (enemy.behavior === "spore_moth") {
        this.updateSporeMoth(enemy, delta);
      } else if (enemy.behavior === "briar_jaguar") {
        this.updateBriarJaguar(enemy, delta);
      } else if (enemy.behavior === "mire_bellower") {
        this.updateMireBellower(enemy, delta);
      } else if (enemy.behavior === "orchid_maw") {
        this.updateOrchidMaw(enemy, delta);
      } else if (enemy.behavior === "strangler_ape") {
        this.updateStranglerApe(enemy, delta);
      } else if (enemy.behavior === "rootfall_tyrant") {
        this.updateRootfallTyrant(enemy, delta);
      }

      enemy.x = clamp(enemy.x, ARENA.left + enemy.radius, ARENA.right - enemy.radius);
      enemy.y = clamp(enemy.y, ARENA.top + enemy.radius, ARENA.bottom - enemy.radius);
      this.resolveEntityObstacles(enemy);

      const movementX = enemy.x - previousX;
      const movementY = enemy.y - previousY;
      if (length(movementX, movementY) > 0.01) {
        enemy.moving = true;
        enemy.facing = Math.atan2(movementY, movementX);
      }
      if (enemy.state === "channel"
        || enemy.state === "volley-windup"
        || enemy.state === "seed-windup"
        || enemy.state === "spore-windup"
        || enemy.state === "burrow-windup"
        || enemy.state === "elite-windup"
        || enemy.state === "boss-windup"
        || enemy.state === "boss-phase") {
        enemy.facing = enemy.aimAngle;
        enemy.moving = false;
      } else if ((enemy.state === "windup"
        || enemy.state === "dash"
        || enemy.state === "pounce-windup"
        || enemy.state === "pounce-dash"
        || enemy.state === "elite-dash"
        || enemy.state === "boss-dash")
        && length(enemy.dashX, enemy.dashY) > 0.01) {
        enemy.facing = Math.atan2(enemy.dashY, enemy.dashX);
        if (enemy.state === "windup") {
          enemy.moving = false;
        }
      }

      const collisionRadius = enemy.radius + this.player.radius;
      if (!enemy.submerged
        && distanceSquared(enemy, this.player) <= collisionRadius * collisionRadius
        && enemy.contactTimer <= 0) {
        triggerEnemyAttack(enemy);
        this.damagePlayer(enemy.contactDamage);
        enemy.contactTimer = 0.7;
      }
    }
  }

  moveEnemyToward(enemy, targetX, targetY, speed, delta) {
    const direction = normalize(targetX - enemy.x, targetY - enemy.y);
    const previousX = enemy.x;
    const previousY = enemy.y;
    enemy.x += direction.x * speed * delta;
    enemy.y += direction.y * speed * delta;
    if (this.resolveEntityObstacles(enemy)) {
      enemy.x = previousX - direction.y * enemy.orbitDirection * speed * delta;
      enemy.y = previousY + direction.x * enemy.orbitDirection * speed * delta;
      this.resolveEntityObstacles(enemy);
    }
  }

  updateAshHound(enemy, delta) {
    const pulse = 0.82 + Math.sin(enemy.phaseTimer * 4 + enemy.id) * 0.18;
    this.moveEnemyToward(enemy, this.player.x, this.player.y, enemy.speed * pulse, delta);
  }

  updateEmberOracle(enemy, delta) {
    if (enemy.state === "channel") {
      if (enemy.stateTimer <= 0) {
        this.fireEnemyProjectile(enemy.x, enemy.y, enemy.aimAngle, 330, 9, 8);
        triggerEnemyAttack(enemy, 0.24);
        enemy.state = "idle";
        enemy.attackTimer = 1.45 + this.rng.next() * 0.35;
      }
      return;
    }

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
      enemy.aimAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      enemy.state = "channel";
      enemy.stateTimer = 0.48;
      triggerEnemyAttack(enemy, enemy.stateTimer);
      this.spawnParticles(enemy.x, enemy.y, "#ef8c4e", 7, 58);
    }
  }

  updateBrassColossus(enemy, delta) {
    if (enemy.state === "windup") {
      if (enemy.stateTimer <= 0) {
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
      const direction = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
      enemy.dashX = direction.x;
      enemy.dashY = direction.y;
      enemy.aimAngle = Math.atan2(direction.y, direction.x);
      enemy.state = "windup";
      enemy.stateTimer = 0.72;
      triggerEnemyAttack(enemy, enemy.stateTimer);
      this.spawnParticles(enemy.x, enemy.y, "#d98c46", 10, 80);
    }
  }

  updateSmokeRevenant(enemy, delta) {
    if (enemy.state === "volley-windup") {
      if (enemy.stateTimer <= 0) {
        for (const offset of [-0.16, 0, 0.16]) {
          this.fireEnemyProjectile(enemy.x, enemy.y, enemy.aimAngle + offset, 290, 8, 7);
        }
        triggerEnemyAttack(enemy, 0.26);
        enemy.state = "idle";
        enemy.attackTimer = 2.05;
      }
      return;
    }

    const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
    const desiredX = this.player.x + Math.cos(angle + enemy.orbitDirection * 0.6) * 310;
    const desiredY = this.player.y + Math.sin(angle + enemy.orbitDirection * 0.6) * 310;
    this.moveEnemyToward(enemy, desiredX, desiredY, enemy.speed, delta);

    if (enemy.attackTimer <= 0) {
      enemy.aimAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      enemy.state = "volley-windup";
      enemy.stateTimer = 0.56;
      triggerEnemyAttack(enemy, enemy.stateTimer);
      this.spawnParticles(enemy.x, enemy.y, "#d85c3a", 9, 62);
    }
  }

  updateRazorMantis(enemy, delta) {
    if (enemy.state === "pounce-windup") {
      if (enemy.stateTimer <= 0) {
        enemy.state = "pounce-dash";
        enemy.stateTimer = 0.34;
        triggerEnemyAttack(enemy, 0.24);
      }
      return;
    }

    if (enemy.state === "pounce-dash") {
      enemy.x += enemy.dashX * 620 * delta;
      enemy.y += enemy.dashY * 620 * delta;
      if (enemy.stateTimer <= 0) {
        this.fireEnemyProjectile(enemy.x, enemy.y, enemy.aimAngle - Math.PI / 2, 270, 8, 7);
        this.fireEnemyProjectile(enemy.x, enemy.y, enemy.aimAngle + Math.PI / 2, 270, 8, 7);
        enemy.state = "idle";
        enemy.attackTimer = 1.45;
      }
      return;
    }

    this.moveEnemyToward(enemy, this.player.x, this.player.y, enemy.speed * 0.72, delta);
    if (enemy.attackTimer <= 0) {
      const direction = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
      enemy.dashX = direction.x;
      enemy.dashY = direction.y;
      enemy.aimAngle = Math.atan2(direction.y, direction.x);
      enemy.state = "pounce-windup";
      enemy.stateTimer = 0.42;
      triggerEnemyAttack(enemy, enemy.stateTimer);
      this.spawnParticles(enemy.x, enemy.y, "#83b65f", 9, 72);
    }
  }

  updateSeedSpitter(enemy, delta) {
    if (enemy.state === "seed-windup") {
      if (enemy.stateTimer <= 0) {
        const offsets = enemy.attackPattern === "seed-fan" ? [-0.22, 0, 0.22] : [0];
        for (const offset of offsets) {
          this.fireEnemyProjectile(
            enemy.x,
            enemy.y,
            enemy.aimAngle + offset,
            offsets.length > 1 ? 310 : 390,
            offsets.length > 1 ? 8 : 10,
            7,
          );
        }
        triggerEnemyAttack(enemy, 0.26);
        enemy.state = "idle";
        enemy.attackTimer = 1.6;
      }
      return;
    }

    const toPlayerX = this.player.x - enemy.x;
    const toPlayerY = this.player.y - enemy.y;
    const currentDistance = length(toPlayerX, toPlayerY);
    const direction = normalize(toPlayerX, toPlayerY);
    if (currentDistance < 310) {
      enemy.x -= direction.x * enemy.speed * delta;
      enemy.y -= direction.y * enemy.speed * delta;
    } else if (currentDistance > 440) {
      enemy.x += direction.x * enemy.speed * delta;
      enemy.y += direction.y * enemy.speed * delta;
    }
    enemy.x += -direction.y * enemy.orbitDirection * enemy.speed * 0.28 * delta;
    enemy.y += direction.x * enemy.orbitDirection * enemy.speed * 0.28 * delta;

    if (enemy.attackTimer <= 0) {
      enemy.attackPattern = enemy.attackSequence % 2 === 0 ? "seed-shot" : "seed-fan";
      enemy.attackSequence += 1;
      enemy.aimAngle = Math.atan2(toPlayerY, toPlayerX);
      enemy.state = "seed-windup";
      enemy.stateTimer = 0.5;
      triggerEnemyAttack(enemy, enemy.stateTimer);
      this.spawnParticles(enemy.x, enemy.y, "#a8c460", 8, 64);
    }
  }

  updateRootStalker(enemy, delta) {
    if (enemy.state === "burrow-windup") {
      if (enemy.stateTimer <= 0) {
        enemy.state = "burrow";
        enemy.stateTimer = 0.36;
        enemy.submerged = true;
        this.spawnParticles(enemy.x, enemy.y, "#765232", 13, 105);
      }
      return;
    }

    if (enemy.state === "burrow") {
      if (enemy.stateTimer <= 0) {
        enemy.x = clamp(
          this.player.x - Math.cos(this.player.facing) * 135,
          ARENA.left + enemy.radius,
          ARENA.right - enemy.radius,
        );
        enemy.y = clamp(
          this.player.y - Math.sin(this.player.facing) * 135,
          ARENA.top + enemy.radius,
          ARENA.bottom - enemy.radius,
        );
        enemy.submerged = false;
        enemy.state = "emerge";
        enemy.stateTimer = 0.18;
        enemy.aimAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
        this.fireRadialBurst(enemy, 6, 260, 9, 7, enemy.aimAngle);
        triggerEnemyAttack(enemy, 0.32);
        this.spawnParticles(enemy.x, enemy.y, "#a4743f", 18, 140);
      }
      return;
    }

    if (enemy.state === "emerge") {
      if (enemy.stateTimer <= 0) {
        enemy.state = "idle";
        enemy.attackTimer = 2.1;
      }
      return;
    }

    this.moveEnemyToward(enemy, this.player.x, this.player.y, enemy.speed, delta);
    if (enemy.attackTimer <= 0) {
      enemy.aimAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      enemy.state = "burrow-windup";
      enemy.stateTimer = 0.42;
      triggerEnemyAttack(enemy, enemy.stateTimer);
    }
  }

  updateSporeMoth(enemy, delta) {
    if (enemy.state === "spore-windup") {
      if (enemy.stateTimer <= 0) {
        const offsets = [-0.34, -0.17, 0, 0.17, 0.34];
        offsets.forEach((offset, index) => {
          this.fireEnemyProjectile(
            enemy.x,
            enemy.y,
            enemy.aimAngle + offset,
            index % 2 === 0 ? 235 : 315,
            8,
            7,
          );
        });
        triggerEnemyAttack(enemy, 0.3);
        enemy.state = "idle";
        enemy.attackTimer = 1.85;
      }
      return;
    }

    const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x)
      + enemy.orbitDirection * 0.72;
    const targetX = this.player.x + Math.cos(angle) * 290;
    const targetY = this.player.y + Math.sin(angle) * 290;
    this.moveEnemyToward(enemy, targetX, targetY, enemy.speed, delta);

    if (enemy.attackTimer <= 0) {
      enemy.aimAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      enemy.state = "spore-windup";
      enemy.stateTimer = 0.54;
      triggerEnemyAttack(enemy, enemy.stateTimer);
      this.spawnParticles(enemy.x, enemy.y, "#8bcbd1", 11, 78);
    }
  }

  beginEliteAttack(enemy, pattern, duration = enemy.telegraphDuration ?? 0.62) {
    enemy.attackPattern = pattern;
    enemy.attackSequence += 1;
    enemy.aimAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
    const direction = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
    enemy.dashX = direction.x;
    enemy.dashY = direction.y;
    enemy.state = "elite-windup";
    enemy.stateTimer = duration;
    triggerEnemyAttack(enemy, duration);
    this.spawnParticles(enemy.x, enemy.y, "#ee7135", 15, 125);
  }

  fireRadialBurst(enemy, count, speed, damage, radius, offset = 0) {
    for (let index = 0; index < count; index += 1) {
      const angle = offset + (index / count) * TAU;
      this.fireEnemyProjectile(enemy.x, enemy.y, angle, speed, damage, radius);
    }
  }

  updateKilnWarden(enemy, delta) {
    if (enemy.state === "elite-windup") {
      if (enemy.stateTimer <= 0) {
        if (enemy.attackPattern === "cleaver-charge") {
          enemy.state = "elite-dash";
          enemy.stateTimer = 0.58;
          triggerEnemyAttack(enemy, 0.22);
        } else {
          this.fireRadialBurst(enemy, 10, 270, 10, 8, enemy.phaseTimer * 0.2);
          triggerEnemyAttack(enemy, 0.24);
          enemy.state = "idle";
          enemy.attackTimer = 1.45;
        }
      }
      return;
    }

    if (enemy.state === "elite-dash") {
      enemy.x += enemy.dashX * 570 * delta;
      enemy.y += enemy.dashY * 570 * delta;
      if (enemy.stateTimer <= 0) {
        this.fireRadialBurst(enemy, 6, 225, 9, 7, enemy.aimAngle);
        enemy.state = "idle";
        enemy.attackTimer = 1.55;
      }
      return;
    }

    this.moveEnemyToward(enemy, this.player.x, this.player.y, enemy.speed * 0.72, delta);
    if (enemy.attackTimer <= 0) {
      const pattern = enemy.attackSequence % 2 === 0 ? "cleaver-charge" : "furnace-slam";
      this.beginEliteAttack(enemy, pattern);
    }
  }

  updatePressureWidow(enemy, delta) {
    if (enemy.state === "elite-windup") {
      if (enemy.stateTimer <= 0) {
        if (enemy.attackPattern === "steam-fan") {
          for (const offset of [-0.38, -0.19, 0, 0.19, 0.38]) {
            this.fireEnemyProjectile(enemy.x, enemy.y, enemy.aimAngle + offset, 390, 11, 8);
          }
        } else {
          this.fireRadialBurst(enemy, 14, 285, 10, 8, enemy.phaseTimer * 0.32);
        }
        triggerEnemyAttack(enemy, 0.26);
        enemy.state = "idle";
        enemy.attackTimer = 1.16;
      }
      return;
    }

    const toPlayerX = this.player.x - enemy.x;
    const toPlayerY = this.player.y - enemy.y;
    const currentDistance = length(toPlayerX, toPlayerY);
    const direction = normalize(toPlayerX, toPlayerY);
    if (currentDistance < 300) {
      enemy.x -= direction.x * enemy.speed * delta;
      enemy.y -= direction.y * enemy.speed * delta;
    } else if (currentDistance > 410) {
      enemy.x += direction.x * enemy.speed * delta;
      enemy.y += direction.y * enemy.speed * delta;
    }
    enemy.x += -direction.y * enemy.orbitDirection * enemy.speed * 0.52 * delta;
    enemy.y += direction.x * enemy.orbitDirection * enemy.speed * 0.52 * delta;

    if (enemy.attackTimer <= 0) {
      const pattern = enemy.attackSequence % 2 === 0 ? "steam-fan" : "pressure-ring";
      this.beginEliteAttack(enemy, pattern);
    }
  }

  updateCinderBishop(enemy, delta) {
    if (enemy.state === "elite-windup") {
      if (enemy.stateTimer <= 0) {
        if (enemy.attackPattern === "cinder-cross") {
          this.fireRadialBurst(enemy, 8, 330, 10, 8, enemy.phaseTimer * 0.45);
        } else {
          for (let index = 0; index < 14; index += 1) {
            const angle = enemy.phaseTimer * 0.6 + (index / 14) * TAU;
            const speed = index % 2 === 0 ? 235 : 315;
            this.fireEnemyProjectile(enemy.x, enemy.y, angle, speed, 9, 7);
          }
        }
        triggerEnemyAttack(enemy, 0.28);
        enemy.state = "idle";
        enemy.attackTimer = 1.05;
      }
      return;
    }

    const orbitAngle = enemy.phaseTimer * 0.55 * enemy.orbitDirection;
    const targetX = VIEWPORT.width / 2 + Math.cos(orbitAngle) * 205;
    const targetY = 450 + Math.sin(orbitAngle) * 120;
    this.moveEnemyToward(enemy, targetX, targetY, enemy.speed, delta);
    if (enemy.attackTimer <= 0) {
      const pattern = enemy.attackSequence % 2 === 0 ? "cinder-cross" : "cinder-spiral";
      this.beginEliteAttack(enemy, pattern);
    }
  }

  updateGrinderSaint(enemy, delta) {
    if (enemy.state === "elite-windup") {
      if (enemy.stateTimer <= 0) {
        if (enemy.attackPattern === "saw-charge") {
          enemy.state = "elite-dash";
          enemy.stateTimer = 0.62;
          triggerEnemyAttack(enemy, 0.22);
        } else {
          this.fireRadialBurst(enemy, 12, 355, 12, 9, enemy.phaseTimer * 0.25);
          triggerEnemyAttack(enemy, 0.25);
          enemy.state = "idle";
          enemy.attackTimer = 1.3;
        }
      }
      return;
    }

    if (enemy.state === "elite-dash") {
      enemy.x += enemy.dashX * 610 * delta;
      enemy.y += enemy.dashY * 610 * delta;
      if (enemy.stateTimer <= 0) {
        this.fireRadialBurst(enemy, 8, 255, 11, 8, enemy.aimAngle + Math.PI / 8);
        enemy.state = "idle";
        enemy.attackTimer = 1.4;
      }
      return;
    }

    this.moveEnemyToward(enemy, this.player.x, this.player.y, enemy.speed * 0.78, delta);
    if (enemy.attackTimer <= 0) {
      const pattern = enemy.attackSequence % 2 === 0 ? "saw-charge" : "blade-ring";
      this.beginEliteAttack(enemy, pattern);
    }
  }

  updateBriarJaguar(enemy, delta) {
    if (enemy.state === "elite-windup") {
      if (enemy.stateTimer <= 0) {
        if (enemy.attackPattern === "rake-chain") {
          enemy.state = "elite-dash";
          enemy.stateTimer = 0.34;
          enemy.dashRepeats = 2;
          triggerEnemyAttack(enemy, 0.24);
        } else {
          for (let index = 0; index < 12; index += 1) {
            if (index % 4 === 0) {
              continue;
            }
            const angle = enemy.phaseTimer * 0.24 + (index / 12) * TAU;
            this.fireEnemyProjectile(enemy.x, enemy.y, angle, 300, 11, 8);
          }
          triggerEnemyAttack(enemy, 0.28);
          enemy.state = "idle";
          enemy.attackTimer = 1.28;
        }
      }
      return;
    }

    if (enemy.state === "elite-dash") {
      enemy.x += enemy.dashX * 630 * delta;
      enemy.y += enemy.dashY * 630 * delta;
      if (enemy.stateTimer <= 0) {
        enemy.dashRepeats -= 1;
        if (enemy.dashRepeats > 0) {
          const direction = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
          enemy.dashX = direction.x;
          enemy.dashY = direction.y;
          enemy.aimAngle = Math.atan2(direction.y, direction.x);
          enemy.stateTimer = 0.3;
        } else {
          this.fireRadialBurst(enemy, 6, 265, 10, 8, enemy.aimAngle);
          enemy.state = "idle";
          enemy.attackTimer = 1.36;
        }
      }
      return;
    }

    this.moveEnemyToward(enemy, this.player.x, this.player.y, enemy.speed * 0.8, delta);
    if (enemy.attackTimer <= 0) {
      this.beginEliteAttack(
        enemy,
        enemy.attackSequence % 2 === 0 ? "rake-chain" : "thorn-rosette",
      );
    }
  }

  updateMireBellower(enemy, delta) {
    if (enemy.state === "elite-windup") {
      if (enemy.stateTimer <= 0) {
        if (enemy.attackPattern === "tongue-lane") {
          for (const offset of [-0.11, 0, 0.11]) {
            this.fireEnemyProjectile(enemy.x, enemy.y, enemy.aimAngle + offset, 440, 12, 9);
          }
        } else {
          this.fireRadialBurst(enemy, 10, 220, 10, 8, enemy.phaseTimer * 0.22);
          this.fireRadialBurst(enemy, 10, 320, 10, 8, enemy.phaseTimer * 0.22 + Math.PI / 10);
        }
        triggerEnemyAttack(enemy, 0.3);
        enemy.state = "idle";
        enemy.attackTimer = 1.32;
      }
      return;
    }

    const direction = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
    const currentDistance = length(this.player.x - enemy.x, this.player.y - enemy.y);
    if (currentDistance < 270) {
      enemy.x -= direction.x * enemy.speed * delta;
      enemy.y -= direction.y * enemy.speed * delta;
    } else if (currentDistance > 390) {
      enemy.x += direction.x * enemy.speed * delta;
      enemy.y += direction.y * enemy.speed * delta;
    }
    if (enemy.attackTimer <= 0) {
      this.beginEliteAttack(
        enemy,
        enemy.attackSequence % 2 === 0 ? "tongue-lane" : "bog-rings",
      );
    }
  }

  updateOrchidMaw(enemy, delta) {
    if (enemy.state === "elite-windup") {
      if (enemy.stateTimer <= 0) {
        if (enemy.attackPattern === "petal-clamp") {
          for (const offset of [-0.52, -0.36, -0.2, 0.2, 0.36, 0.52]) {
            this.fireEnemyProjectile(enemy.x, enemy.y, enemy.aimAngle + offset, 345, 11, 8);
          }
        } else {
          for (let index = 0; index < 16; index += 1) {
            const angle = enemy.phaseTimer * 0.5 + (index / 16) * TAU;
            this.fireEnemyProjectile(enemy.x, enemy.y, angle, index % 2 === 0 ? 235 : 325, 10, 8);
          }
        }
        triggerEnemyAttack(enemy, 0.3);
        enemy.state = "idle";
        enemy.attackTimer = 1.16;
      }
      return;
    }

    const orbitAngle = enemy.phaseTimer * 0.48 * enemy.orbitDirection;
    const targetX = VIEWPORT.width / 2 + Math.cos(orbitAngle) * 190;
    const targetY = 470 + Math.sin(orbitAngle) * 130;
    this.moveEnemyToward(enemy, targetX, targetY, enemy.speed, delta);
    if (enemy.attackTimer <= 0) {
      this.beginEliteAttack(
        enemy,
        enemy.attackSequence % 2 === 0 ? "petal-clamp" : "pollen-spiral",
      );
    }
  }

  updateStranglerApe(enemy, delta) {
    if (enemy.state === "elite-windup") {
      if (enemy.stateTimer <= 0) {
        if (enemy.attackPattern === "vine-charge") {
          enemy.state = "elite-dash";
          enemy.stateTimer = 0.56;
          triggerEnemyAttack(enemy, 0.25);
        } else {
          this.fireRadialBurst(enemy, 12, 310, 12, 9, enemy.phaseTimer * 0.28);
          for (const offset of [-0.18, 0, 0.18]) {
            this.fireEnemyProjectile(enemy.x, enemy.y, enemy.aimAngle + offset, 410, 12, 9);
          }
          triggerEnemyAttack(enemy, 0.3);
          enemy.state = "idle";
          enemy.attackTimer = 1.28;
        }
      }
      return;
    }

    if (enemy.state === "elite-dash") {
      enemy.x += enemy.dashX * 650 * delta;
      enemy.y += enemy.dashY * 650 * delta;
      if (enemy.stateTimer <= 0) {
        this.fireRadialBurst(enemy, 8, 285, 11, 8, enemy.aimAngle + Math.PI / 8);
        enemy.state = "idle";
        enemy.attackTimer = 1.42;
      }
      return;
    }

    this.moveEnemyToward(enemy, this.player.x, this.player.y, enemy.speed * 0.82, delta);
    if (enemy.attackTimer <= 0) {
      this.beginEliteAttack(
        enemy,
        enemy.attackSequence % 2 === 0 ? "vine-charge" : "rootquake",
      );
    }
  }

  updateRootfallTyrant(enemy, delta) {
    const enraged = enemy.hp / enemy.maxHp < 0.5;
    if (!enemy.phaseTransitioned && enraged) {
      enemy.phaseTransitioned = true;
      enemy.attackPattern = "black-sap-awakening";
      enemy.aimAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      enemy.state = "boss-phase";
      enemy.stateTimer = 1.08;
      enemy.attackTimer = 0.84;
      triggerEnemyAttack(enemy, enemy.stateTimer);
      this.spawnParticles(enemy.x, enemy.y, "#d98d36", 36, 235);
      return;
    }

    if (enemy.state === "boss-phase") {
      if (enemy.stateTimer <= 0) {
        this.fireRadialBurst(enemy, 12, 240, 12, 9, enemy.phaseTimer * 0.3);
        this.fireRadialBurst(enemy, 12, 340, 12, 9, enemy.phaseTimer * 0.3 + Math.PI / 12);
        triggerEnemyAttack(enemy, 0.42);
        enemy.state = "idle";
        enemy.attackPattern = null;
        enemy.attackTimer = 0.7;
      }
      return;
    }

    if (enemy.state === "boss-windup") {
      if (enemy.stateTimer <= 0) {
        if (enemy.attackPattern === "tyrant-rush") {
          enemy.state = "boss-dash";
          enemy.stateTimer = 0.44;
          enemy.dashRepeats = 2;
        } else {
          this.fireRootfallBossPattern(enemy, enraged);
          enemy.state = "idle";
          enemy.attackTimer = enraged ? 0.78 : 1.14;
        }
        triggerEnemyAttack(enemy, 0.34);
      }
      return;
    }

    if (enemy.state === "boss-dash") {
      enemy.x += enemy.dashX * 690 * delta;
      enemy.y += enemy.dashY * 690 * delta;
      if (enemy.stateTimer <= 0) {
        enemy.dashRepeats -= 1;
        if (enemy.dashRepeats > 0) {
          const direction = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
          enemy.dashX = direction.x;
          enemy.dashY = direction.y;
          enemy.aimAngle = Math.atan2(direction.y, direction.x);
          enemy.stateTimer = 0.4;
        } else {
          this.fireRadialBurst(enemy, 10, 310, 13, 9, enemy.aimAngle + Math.PI / 10);
          enemy.state = "idle";
          enemy.attackTimer = 0.84;
        }
      }
      return;
    }

    const targetX = VIEWPORT.width / 2 + Math.sin(enemy.phaseTimer * 0.64) * 155;
    const targetY = 350 + Math.cos(enemy.phaseTimer * 0.5) * 82;
    this.moveEnemyToward(enemy, targetX, targetY, enemy.speed * (enraged ? 1.28 : 1), delta);

    if (enemy.attackTimer <= 0) {
      const sequence = enemy.attackSequence % (enraged ? 3 : 2);
      enemy.attackPattern = sequence === 0
        ? "root-lanes"
        : sequence === 1 ? "thorn-crown" : "tyrant-rush";
      enemy.attackSequence += 1;
      enemy.aimAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      const direction = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
      enemy.dashX = direction.x;
      enemy.dashY = direction.y;
      enemy.state = "boss-windup";
      enemy.stateTimer = enraged ? 0.5 : 0.7;
      triggerEnemyAttack(enemy, enemy.stateTimer);
      this.spawnParticles(enemy.x, enemy.y, "#d98d36", 22, 175);
    }
  }

  fireRootfallBossPattern(enemy, enraged) {
    if (enemy.attackPattern === "root-lanes") {
      const offsets = enraged
        ? [-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45]
        : [-0.3, -0.15, 0, 0.15, 0.3];
      for (const offset of offsets) {
        this.fireEnemyProjectile(
          enemy.x,
          enemy.y,
          enemy.aimAngle + offset,
          enraged ? 440 : 395,
          enraged ? 14 : 12,
          9,
        );
      }
      return;
    }

    const count = enraged ? 18 : 16;
    const phaseOffset = enemy.phaseTimer * 0.42;
    const aimedIndex = Math.round((((enemy.aimAngle - phaseOffset) / TAU) * count + count) % count);
    for (let index = 0; index < count; index += 1) {
      const gapDistance = Math.min(
        (index - aimedIndex + count) % count,
        (aimedIndex - index + count) % count,
      );
      if (gapDistance <= 1) {
        continue;
      }
      const angle = phaseOffset + (index / count) * TAU;
      this.fireEnemyProjectile(enemy.x, enemy.y, angle, enraged ? 345 : 295, enraged ? 12 : 10, 8);
    }
  }

  updateBoss(enemy, delta) {
    const enraged = enemy.hp / enemy.maxHp < 0.5;
    if (!enemy.phaseTransitioned && enraged) {
      enemy.phaseTransitioned = true;
      enemy.attackPattern = "phase-transition";
      enemy.aimAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      enemy.state = "boss-phase";
      enemy.stateTimer = 0.92;
      enemy.attackTimer = 1.05;
      triggerEnemyAttack(enemy, enemy.stateTimer);
      this.spawnParticles(enemy.x, enemy.y, "#ffb84f", 30, 210);
      return;
    }

    if (enemy.state === "boss-phase") {
      if (enemy.stateTimer <= 0) {
        this.fireRadialBurst(enemy, 16, 300, 11, 8, enemy.phaseTimer * 0.36);
        triggerEnemyAttack(enemy, 0.38);
        enemy.state = "idle";
        enemy.attackPattern = null;
        enemy.attackTimer = 0.72;
        this.spawnParticles(enemy.x, enemy.y, "#ee7135", 34, 240);
      }
      return;
    }

    if (enemy.state === "boss-windup") {
      if (enemy.stateTimer <= 0) {
        this.fireBossPattern(enemy, enraged);
        triggerEnemyAttack(enemy, 0.32);
        enemy.state = "idle";
        enemy.attackTimer = enraged ? 0.82 : 1.24;
      }
      return;
    }

    const targetX = VIEWPORT.width / 2 + Math.sin(enemy.phaseTimer * 0.7) * 170;
    const targetY = 340 + Math.cos(enemy.phaseTimer * 0.55) * 80;
    this.moveEnemyToward(enemy, targetX, targetY, enemy.speed * (enraged ? 1.35 : 1), delta);

    if (enemy.attackTimer <= 0) {
      enemy.attackPattern = enemy.attackSequence % 2 === 0 ? "radial" : "pressure-lanes";
      enemy.attackSequence += 1;
      enemy.aimAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      enemy.state = "boss-windup";
      enemy.stateTimer = enraged ? 0.48 : 0.68;
      triggerEnemyAttack(enemy, enemy.stateTimer);
      this.spawnParticles(enemy.x, enemy.y, "#ee7135", 18, 165);
    }
  }

  fireBossPattern(enemy, enraged) {
    if (enemy.attackPattern === "pressure-lanes") {
      const offsets = enraged
        ? [-0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42]
        : [-0.28, -0.14, 0, 0.14, 0.28];
      for (const offset of offsets) {
        this.fireEnemyProjectile(
          enemy.x,
          enemy.y,
          enemy.aimAngle + offset,
          enraged ? 430 : 390,
          enraged ? 13 : 12,
          9,
        );
      }
      return;
    }

    const bulletCount = enraged ? 16 : 12;
    const phaseOffset = enemy.phaseTimer * 0.45;
    for (let index = 0; index < bulletCount; index += 1) {
      const angle = phaseOffset + (index / bulletCount) * TAU;
      this.fireEnemyProjectile(
        enemy.x,
        enemy.y,
        angle,
        enraged ? 330 : 275,
        enraged ? 11 : 9,
        8,
      );
    }
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
        if (!first.alive || !second.alive || first.defeated || second.defeated) {
          continue;
        }
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
      this.handleProjectileObstacles(projectile);

      if (!projectile.alive) {
        continue;
      }
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

  handleProjectileObstacles(projectile) {
    for (const destructible of this.destructibles ?? []) {
      if (!destructible.alive) {
        continue;
      }
      const collision = getCircleRectangleCollision(projectile, projectile.radius, destructible);
      if (!collision) {
        continue;
      }

      projectile.alive = false;
      if (projectile.friendly) {
        this.damageDestructible(
          destructible,
          Math.max(1, Number.isFinite(projectile.damage) ? projectile.damage : 1),
          projectile.x,
          projectile.y,
          projectile.color ?? this.player.accent,
        );
      } else {
        const definition = getDestructibleDefinition(destructible.type);
        this.spawnParticles(
          projectile.x,
          projectile.y,
          definition?.debrisColor ?? "#80664f",
          4,
          70,
        );
      }
      return;
    }

    for (const obstacle of this.roomDefinition?.obstacles ?? []) {
      const collision = getCircleRectangleCollision(projectile, projectile.radius, obstacle);
      if (!collision) {
        continue;
      }

      if (projectile.friendly && projectile.wallBounces > 0) {
        projectile.x += collision.normalX * Math.max(0.5, collision.depth);
        projectile.y += collision.normalY * Math.max(0.5, collision.depth);
        const velocityDotNormal = projectile.vx * collision.normalX
          + projectile.vy * collision.normalY;
        if (velocityDotNormal < 0) {
          projectile.vx -= 2 * velocityDotNormal * collision.normalX;
          projectile.vy -= 2 * velocityDotNormal * collision.normalY;
          projectile.wallBounces -= 1;
        }
        this.spawnParticles(
          projectile.x,
          projectile.y,
          projectile.color ?? this.player.accent,
          4,
          72,
        );
      } else {
        projectile.alive = false;
      }
      return;
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
      if (!enemy.alive || enemy.defeated || projectile.hitIds.has(enemy.id)) {
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
      if (!enemy.alive || enemy.defeated
        || enemy.id === impactEnemy.id || projectile.hitIds.has(enemy.id)) {
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
    if (!enemy.alive || enemy.defeated) {
      return;
    }

    enemy.hp = Math.max(0, enemy.hp - amount);
    enemy.hitFlash = enemy.isBoss ? 0.14 : enemy.isElite ? 0.13 : 0.09;
    triggerEnemyHit(enemy);
    this.spawnCombatText(Math.max(1, Math.round(amount)), impactX, impactY - 12, color, 22);
    this.spawnParticles(impactX, impactY, color, 6, 130);

    if (enemy.hp <= 0) {
      const definition = getEnemyDefinition(enemy.type);
      const hasDefeatReaction = Boolean(
        definition?.art?.reactionSprite
        || definition?.art?.reactionAnimation,
      );
      if (enemy.isBoss || hasDefeatReaction) {
        enemy.defeated = true;
        const defeatClip = definition?.art?.reactionAnimation?.clips?.defeat;
        const authoredDefeatSeconds = Number.isFinite(defeatClip?.fps)
          && defeatClip.fps > 0
          && Number.isInteger(defeatClip.frameCount)
          ? defeatClip.frameCount / defeatClip.fps
          : 0;
        enemy.defeatTimer = Math.max(
          enemy.isBoss ? 1.15 : 0.82,
          authoredDefeatSeconds + 0.05,
        );
        enemy.state = "defeated";
        enemy.stateTimer = 0;
        enemy.attackPattern = null;
        enemy.attackAnimation = 0;
        enemy.moving = false;
        triggerEnemyDefeat(enemy);
        enemy.contactTimer = Number.POSITIVE_INFINITY;
        if (enemy.isBoss) {
          for (const projectile of this.projectiles ?? []) {
            if (!projectile.friendly) {
              projectile.alive = false;
            }
          }
        }
      } else {
        enemy.alive = false;
      }
      this.score += enemy.score;
      this.screenShake = Math.max(this.screenShake ?? 0, enemy.isBoss ? 11 : enemy.isElite ? 7 : 2.5);
      this.spawnEnemyRewards(enemy);
      this.spawnParticles(
        enemy.x,
        enemy.y,
        ENEMY_COLOR,
        enemy.isBoss ? 46 : enemy.isElite ? 34 : 18,
        230,
      );
    }
  }

  damageDestructible(destructible, amount, impactX, impactY, color = "#e6b461") {
    if (!destructible?.alive || !Number.isFinite(amount) || amount <= 0) {
      return false;
    }

    const definition = getDestructibleDefinition(destructible.type);
    if (!definition) {
      return false;
    }
    destructible.hp = Math.max(0, destructible.hp - amount);
    destructible.hitFlash = 0.12;
    this.spawnCombatText(
      Math.max(1, Math.round(amount)),
      impactX,
      impactY - 10,
      color,
      19,
    );
    this.spawnParticles(impactX, impactY, definition.debrisColor, 6, 105);
    if (destructible.hp > 0) {
      return false;
    }

    destructible.alive = false;
    this.screenShake = Math.max(this.screenShake ?? 0, 4.5);
    this.spawnCombatText(
      "BREAK",
      destructible.x + destructible.width / 2,
      destructible.y - 8,
      "#f0c979",
      20,
    );
    this.spawnParticles(
      destructible.x + destructible.width / 2,
      destructible.y + destructible.height / 2,
      definition.debrisColor,
      22,
      185,
    );
    if (!destructible.rewarded) {
      destructible.rewarded = true;
      this.score += definition.score;
      this.spawnPickup(
        "xp",
        destructible.x + destructible.width / 2,
        destructible.y + destructible.height / 2,
        definition.xp,
      );
    }
    return true;
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

    const reduction = clamp(this.player.damageReduction ?? 0, 0, 0.75);
    const appliedDamage = Math.max(1, Math.round(amount * (1 - reduction)));
    this.player.hp = Math.max(0, this.player.hp - appliedDamage);
    this.player.invulnerability = 0.48;
    triggerPlayerHit(this.player);
    this.screenShake = Math.max(this.screenShake ?? 0, 7);
    this.spawnCombatText(`-${appliedDamage}`, this.player.x, this.player.y - 42, "#ff7a66", 25);
    this.spawnParticles(this.player.x, this.player.y, "#d74232", 14, 170);

    if (this.player.hp <= 0) {
      triggerPlayerDefeat(this.player);
      this.mode = "dying";
      this.pointer = null;
      this.keys.clear();
      for (const projectile of this.projectiles ?? []) {
        projectile.alive = false;
      }
    }
  }

  healPlayer(amount) {
    if (!Number.isFinite(amount) || amount <= 0 || this.player.hp >= this.player.maxHp) {
      return 0;
    }
    const previousHp = this.player.hp;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.round(amount));
    const restored = this.player.hp - previousHp;
    if (restored > 0) {
      this.spawnCombatText(`+${restored}`, this.player.x, this.player.y - 42, "#8df1aa", 23);
      this.spawnParticles(this.player.x, this.player.y, "#74d692", 14, 125);
    }
    return restored;
  }

  spawnEnemyRewards(enemy) {
    const shardCount = enemy.isBoss ? 6 : enemy.isElite ? 4 : 1;
    const shardBase = Math.floor(enemy.xp / shardCount);
    const remainder = enemy.xp % shardCount;
    for (let index = 0; index < shardCount; index += 1) {
      this.spawnPickup(
        "xp",
        enemy.x,
        enemy.y,
        shardBase + (index < remainder ? 1 : 0),
      );
    }

    if (enemy.isBoss) {
      return;
    }
    const healthRatio = this.player.hp / this.player.maxHp;
    const healChance = enemy.isElite ? 1 : healthRatio < 0.45 ? 0.15 : 0.07;
    if (this.rng.next() < healChance) {
      const healing = Math.round(this.player.maxHp * (enemy.isElite ? 0.18 : 0.1));
      this.spawnPickup("heal", enemy.x, enemy.y, healing);
    }
  }

  spawnPickup(type, x, y, value) {
    const angle = this.rng.next() * TAU;
    const force = 90 + this.rng.next() * 85;
    this.pickups.push({
      id: this.nextPickupId++,
      type,
      x: clamp(x, ARENA.left + 14, ARENA.right - 14),
      y: clamp(y, ARENA.top + 14, ARENA.bottom - 14),
      vx: Math.cos(angle) * force,
      vy: Math.sin(angle) * force,
      radius: type === "heal" ? 13 : 10,
      value,
      age: 0,
      alive: true,
    });
  }

  updatePickups(delta) {
    const pickupRadius = Math.max(40, this.player.pickupRadius ?? 92);
    const pickupSpeed = Math.max(180, this.player.pickupSpeed ?? 520);
    for (const pickup of this.pickups) {
      if (!pickup.alive) {
        continue;
      }
      pickup.age += delta;
      pickup.x += pickup.vx * delta;
      pickup.y += pickup.vy * delta;
      const friction = Math.pow(0.075, delta);
      pickup.vx *= friction;
      pickup.vy *= friction;
      pickup.x = clamp(pickup.x, ARENA.left + pickup.radius, ARENA.right - pickup.radius);
      pickup.y = clamp(pickup.y, ARENA.top + pickup.radius, ARENA.bottom - pickup.radius);

      const dx = this.player.x - pickup.x;
      const dy = this.player.y - pickup.y;
      const currentDistance = length(dx, dy);
      if (pickup.age > 0.18 && currentDistance <= pickupRadius) {
        const direction = normalize(dx, dy);
        const pull = pickupSpeed * (1.1 + (1 - currentDistance / pickupRadius) * 0.65);
        pickup.x += direction.x * pull * delta;
        pickup.y += direction.y * pull * delta;
      }

      if (currentDistance <= this.player.radius + pickup.radius + 8) {
        this.collectPickup(pickup);
        if (this.mode === "choice") {
          return;
        }
      }
    }
  }

  collectPickup(pickup) {
    if (!pickup.alive) {
      return;
    }
    pickup.alive = false;
    if (pickup.type === "heal") {
      this.healPlayer(pickup.value);
      return;
    }
    this.spawnParticles(pickup.x, pickup.y, "#d8a9ff", 8, 90);
    this.grantRunExperience(pickup.value);
  }

  grantRunExperience(amount) {
    const result = grantRunXp({ level: this.runLevel, xp: this.runXp }, amount);
    this.runLevel = result.level;
    this.runXp = result.xp;
    this.runXpToNext = result.requirement;
    if (result.levelsGained <= 0 || this.room >= this.tour.rooms.length) {
      return result;
    }

    this.pendingAbilityChoices += result.levelsGained;
    if (this.mode === "running" || this.mode === "exit") {
      this.openAbilityChoice("level", this.mode);
    }
    return result;
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

  spawnCombatText(text, x, y, color = "#fff0c2", size = 22) {
    this.combatTexts ??= [];
    this.nextCombatTextId ??= 1;
    this.combatTexts.push({
      id: this.nextCombatTextId++,
      text: String(text),
      x,
      y,
      color,
      size,
      life: 0.72,
      maxLife: 0.72,
    });
  }

  updateCombatTexts(delta) {
    for (const entry of this.combatTexts) {
      entry.y -= delta * 54;
      entry.life -= delta;
    }
  }

  handleRoomClear() {
    if (this.mode !== "running") {
      return;
    }

    const recoveryPct = clamp(this.player.healOnRoomClearPct ?? 0, 0, 0.5);
    if (recoveryPct > 0) {
      this.healPlayer(this.player.maxHp * recoveryPct);
    }
    this.mode = "exit";
    this.roomExitOpen = true;
    this.waveCountdown = null;
    this.projectiles = [];
    this.pointer = null;
    this.keys.clear();
    this.player.invulnerability = 0.7;
    this.spawnParticles(VIEWPORT.width / 2, ARENA.top + 22, "#e6b461", 24, 130);
    this.syncRoomAssetWindow(this.room, { combatRoomOffset: 1 });
  }

  handleRoomExit() {
    if (this.mode !== "exit") {
      return;
    }

    this.roomExitOpen = false;
    this.clearedRooms = Math.max(this.clearedRooms, this.room);
    if (this.room >= this.tour.rooms.length) {
      this.finishRun(true);
      return;
    }

    this.pointer = null;
    this.keys.clear();
    if (this.roomDefinition?.reward === "ability") {
      this.persistActiveRunCheckpoint("checkpoint-choice");
      this.openAbilityChoice("checkpoint", "running");
      return;
    }

    this.advanceToNextRoom();
  }

  finishRun(bossDefeated) {
    if (this.mode === "result" || this.mode === "idle") {
      return;
    }

    const roomsCleared = bossDefeated
      ? this.tour.rooms.length
      : Math.max(this.clearedRooms, Math.max(0, this.room - 1));
    const beanReward = calculateRunBeanReward({ roomsCleared, bossDefeated });
    const xpReward = calculateRunHeroXp({ roomsCleared, bossDefeated });
    const heroProgressBefore = this.profileStore.profile.heroProgress?.[this.hero.id];
    const heroProgressAfter = grantHeroXp(heroProgressBefore, xpReward);
    const inventoryHasSpace = this.profileStore.profile.inventory.length < MAX_INVENTORY_ITEMS;
    const equipmentDrop = inventoryHasSpace
      ? rollEquipmentDrop(this.rng, { roomsCleared, bossDefeated })
      : null;
    const receipt = createLocalRunReceipt({
      tourId: this.tour.id,
      heroId: this.hero.id,
      roomsCleared,
      bossDefeated,
      score: this.score,
    });

    this.profileStore.update((draft) => {
      draft.activeRun = null;
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
      draft.heroProgress[this.hero.id] = {
        level: heroProgressAfter.level,
        xp: heroProgressAfter.xp,
      };
      if (equipmentDrop) {
        draft.inventory.push({ ...equipmentDrop });
      }
    });

    this.mode = "result";
    this.roomExitOpen = false;
    this.waveCountdown = null;
    this.paused = false;
    this.accumulator = 0;
    this.pointer = null;
    this.keys.clear();
    this.projectiles = [];
    this.pickups = [];
    this.destructibles = [];
    this.combatTexts = [];
    this.screenShake = 0;
    this.activeAbilityChoices.clear();
    this.pendingAbilityChoices = 0;
    this.choiceContext = null;
    this.enemies = [];
    this.assetWindowEnemyIds = new Set();
    this.assetWindowDestructibleTypes = new Set();
    for (const enemyId of new Set([
      ...this.enemySprites.keys(),
      ...this.enemyMotionSprites.keys(),
      ...this.enemySpecialSprites.keys(),
      ...this.enemyReactionSprites.keys(),
      ...[...this.enemySpriteLeases.keys()].map((key) => key.split(":", 2)[1]),
    ])) {
      this.releaseEnemySpriteResources(enemyId);
    }
    this.enemySprites.clear();
    this.enemyMotionSprites.clear();
    this.enemySpecialSprites.clear();
    this.enemyReactionSprites.clear();
    this.enemySpriteLeases.clear();
    this.releaseAnimationPageMap(this.enemyMotionAnimationSprites);
    this.releaseAnimationPageMap(this.enemySpecialAnimationSprites);
    this.releaseAnimationPageMap(this.enemyReactionAnimationSprites);
    for (const lease of this.destructibleSpriteLeases.values()) {
      lease.release();
    }
    this.destructibleSpriteLeases.clear();
    this.destructibleSprites.clear();
    for (const lease of this.roomSpriteLeases.values()) {
      lease.release();
    }
    this.roomSpriteLeases.clear();
    this.roomSprites.clear();
    this.assetWindowRoomSprites = new Set();
    this.releaseAnimationPageMap(this.heroFullMotionAnimationSprites);
    this.releaseAnimationPageMap(this.heroReactionAnimationSprites);
    this.releaseHeroSpriteResources(this.loadedHeroId);
    this.loadedHeroId = null;
    this.heroSprite = null;
    this.heroDirectionalSprite = null;
    this.heroMotionSprite = null;
    this.heroFullMotionSprite = null;
    this.heroReactionSprite = null;
    this.heroSecondaryAttackSprite = null;
    this.animationPageCache.clear({ cancelPending: true });
    this.onProfile(this.profileStore.profile);
    this.onRunEnd({
      bossDefeated,
      tour: this.tour,
      hero: this.hero,
      roomsCleared,
      beanReward,
      xpReward,
      heroLevelBefore: heroProgressBefore?.level ?? 1,
      heroLevelAfter: heroProgressAfter.level,
      levelsGained: heroProgressAfter.levelsGained,
      equipmentDrop,
      inventoryFull: !inventoryHasSpace,
      score: this.score,
      runLevel: this.runLevel,
      runXp: this.runXp,
      receipt,
    });
  }

  emitHud() {
    this.onHud({
      room: this.room,
      totalRooms: this.tour.rooms.length,
      tourCode: this.tour.code,
      roomName: this.roomDefinition?.name ?? "SEALED CHAMBER",
      roomType: this.roomDefinition?.roomType ?? "combat",
      wave: this.wave,
      totalWaves: this.roomDefinition?.waves.length ?? 1,
      waveCountdown: this.waveCountdown === null ? null : Math.max(0, this.waveCountdown),
      exitOpen: this.roomExitOpen,
      heroName: this.hero.name,
      heroLevel: this.heroLevel,
      runLevel: this.runLevel,
      runXp: this.runXp,
      runXpToNext: this.runXpToNext,
      weaponName: this.hero.weapon,
      hp: Math.ceil(this.player.hp),
      maxHp: Math.ceil(this.player.maxHp),
    });
  }

  draw() {
    this.animationPageUsageFrame += 1;
    const context = this.context;
    context.fillStyle = "#070504";
    context.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
    context.save();
    if (this.screenShake > 0) {
      context.translate(
        Math.sin(this.visualClock * 83) * this.screenShake,
        Math.cos(this.visualClock * 67) * this.screenShake * 0.62,
      );
    }
    this.drawArena(context);

    for (const enemy of this.enemies) {
      this.drawEnemyTelegraph(context, enemy);
    }

    for (const particle of this.particles) {
      context.save();
      context.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, TAU);
      context.fill();
      context.restore();
    }

    for (const pickup of this.pickups) {
      this.drawPickup(context, pickup);
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

    for (const entry of this.combatTexts) {
      this.drawCombatText(context, entry);
    }
    context.restore();
    const liveMode = this.mode === "running"
      || this.mode === "exit"
      || this.mode === "dying";
    this.releaseUnusedAnimationPageLeases({ all: !liveMode || this.paused });
  }

  drawArena(context) {
    const environment = this.roomDefinition?.environment ?? "ash";
    const palette = ROOM_PALETTES[environment] ?? ROOM_PALETTES.ash;
    const roomArt = getRoomArt(environment, {
      roomId: this.roomDefinition?.id,
      roomNumber: this.room,
      artVariant: this.roomDefinition?.artVariant,
    });
    const roomSprite = roomArt ? this.roomSprites.get(roomArt.sprite) : null;

    if (roomSprite) {
      context.drawImage(roomSprite, 0, 0, VIEWPORT.width, VIEWPORT.height);
      context.save();
      const readabilityShade = context.createLinearGradient(0, ARENA.top, 0, ARENA.bottom);
      readabilityShade.addColorStop(0, "rgba(5, 3, 2, 0.11)");
      readabilityShade.addColorStop(0.45, "rgba(5, 3, 2, 0.03)");
      readabilityShade.addColorStop(1, "rgba(5, 3, 2, 0.16)");
      context.fillStyle = readabilityShade;
      context.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
      context.strokeStyle = `${palette.line}99`;
      context.lineWidth = 4;
      context.strokeRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
      context.restore();
    } else {
      const gradient = context.createLinearGradient(0, 0, 0, VIEWPORT.height);
      gradient.addColorStop(0, palette.top);
      gradient.addColorStop(0.52, palette.floor);
      gradient.addColorStop(1, palette.bottom);
      context.fillStyle = gradient;
      context.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

      context.save();
      context.fillStyle = palette.floor;
      context.fillRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
      context.strokeStyle = `${palette.line}44`;
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

      context.strokeStyle = `${palette.line}aa`;
      context.lineWidth = 4;
      context.strokeRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
      context.restore();
      this.drawRoomFixtures(context, environment, palette);
    }

    this.drawRoomAtmosphere(context, environment, palette);
    this.drawRoomHazards(context, palette);
    this.drawRoomObstacles(context, palette);
    this.drawRoomDestructibles(context, palette);
    this.drawArenaDoor(context, palette);

    context.save();
    context.fillStyle = `${palette.accent}38`;
    context.font = "700 54px Arial Narrow, sans-serif";
    context.textAlign = "center";
    context.fillText(String(Math.max(1, this.room)).padStart(2, "0"), VIEWPORT.width / 2, 92);
    context.font = "700 15px Arial Narrow, sans-serif";
    context.letterSpacing = "4px";
    context.fillText(this.roomDefinition?.name ?? "SEALED CHAMBER", VIEWPORT.width / 2, 118);

    if (this.waveCountdown !== null) {
      context.fillStyle = "rgba(8, 5, 4, 0.78)";
      context.fillRect(VIEWPORT.width / 2 - 112, 556, 224, 112);
      context.strokeStyle = palette.accent;
      context.lineWidth = 2;
      context.strokeRect(VIEWPORT.width / 2 - 112, 556, 224, 112);
      context.fillStyle = "rgba(243, 223, 189, 0.72)";
      context.font = "700 15px Arial Narrow, sans-serif";
      context.fillText(`WAVE ${this.wave + 1} IN`, VIEWPORT.width / 2, 589);
      context.fillStyle = palette.accent;
      context.font = "900 48px Arial Narrow, sans-serif";
      context.fillText(String(Math.max(1, Math.ceil(this.waveCountdown))), VIEWPORT.width / 2, 642);
    } else if (this.roomExitOpen) {
      context.fillStyle = palette.accent;
      context.font = "900 20px Arial Narrow, sans-serif";
      context.fillText("EXIT OPEN  ↑", VIEWPORT.width / 2, 202);
    }
    context.restore();
  }

  drawArenaDoor(context, palette) {
    const width = 150;
    const height = 86;
    const x = VIEWPORT.width / 2 - width / 2;
    const y = ARENA.top - 22;
    context.save();
    context.fillStyle = "#080605";
    context.strokeStyle = `${palette.line}dd`;
    context.lineWidth = 7;
    context.beginPath();
    context.roundRect(x, y, width, height, [32, 32, 5, 5]);
    context.fill();
    context.stroke();

    if (this.roomExitOpen) {
      const light = context.createLinearGradient(0, y, 0, y + height);
      light.addColorStop(0, palette.accent);
      light.addColorStop(1, "rgba(230, 180, 97, 0.08)");
      context.fillStyle = light;
      context.shadowBlur = 34;
      context.shadowColor = palette.accent;
      context.fillRect(x + 15, y + 17, width - 30, height - 17);
      context.fillStyle = "rgba(255, 242, 204, 0.82)";
      for (const offset of [-24, 0, 24]) {
        context.beginPath();
        context.moveTo(VIEWPORT.width / 2 + offset - 8, y + 58);
        context.lineTo(VIEWPORT.width / 2 + offset, y + 46);
        context.lineTo(VIEWPORT.width / 2 + offset + 8, y + 58);
        context.fill();
      }
    } else {
      context.fillStyle = "#1d120e";
      context.fillRect(x + 15, y + 17, width - 30, height - 17);
      context.strokeStyle = `${palette.accent}66`;
      context.lineWidth = 3;
      for (let bar = 0; bar < 5; bar += 1) {
        const barX = x + 28 + bar * 24;
        context.beginPath();
        context.moveTo(barX, y + 21);
        context.lineTo(barX, y + height - 4);
        context.stroke();
      }
    }
    context.restore();
  }

  drawRoomFixtures(context, environment, palette) {
    context.save();
    context.strokeStyle = `${palette.line}99`;
    context.fillStyle = `${palette.line}35`;
    context.lineWidth = 4;

    if (environment === "ash") {
      for (const x of [92, 628]) {
        for (const y of [310, 650, 990]) {
          context.beginPath();
          context.arc(x, y, 25, 0, TAU);
          context.fill();
          context.stroke();
          context.beginPath();
          context.arc(x, y, 11, 0, TAU);
          context.stroke();
        }
      }
    } else if (environment === "ember") {
      for (const [x, y] of [[88, 280], [632, 280], [88, 990], [632, 990]]) {
        context.fillRect(x - 20, y - 18, 40, 36);
        context.fillStyle = `${palette.accent}aa`;
        context.beginPath();
        context.moveTo(x, y - 50);
        context.quadraticCurveTo(x + 24, y - 24, x, y - 10);
        context.quadraticCurveTo(x - 20, y - 28, x, y - 50);
        context.fill();
        context.fillStyle = `${palette.line}35`;
      }
    } else if (environment === "brass") {
      for (const y of [270, 520, 770, 1020]) {
        context.strokeRect(64, y, 54, 120);
        context.strokeRect(602, y, 54, 120);
        context.beginPath();
        context.arc(91, y + 34, 14, 0, TAU);
        context.arc(629, y + 34, 14, 0, TAU);
        context.stroke();
      }
    } else if (environment === "smoke") {
      for (const y of [340, 610, 880]) {
        for (const x of [82, 638]) {
          context.fillRect(x - 24, y - 8, 48, 16);
          context.beginPath();
          context.moveTo(x - 16, y - 18);
          context.bezierCurveTo(x + 18, y - 48, x - 20, y - 74, x + 12, y - 108);
          context.stroke();
        }
      }
    } else if (environment === "pressure") {
      context.lineWidth = 12;
      context.beginPath();
      context.moveTo(74, 230);
      context.lineTo(74, 1090);
      context.moveTo(646, 230);
      context.lineTo(646, 1090);
      context.stroke();
      context.lineWidth = 4;
      for (const y of [330, 610, 890]) {
        context.beginPath();
        context.arc(74, y, 24, 0, TAU);
        context.arc(646, y, 24, 0, TAU);
        context.stroke();
      }
    } else if (environment === "heart") {
      context.lineWidth = 9;
      for (const radius of [128, 190, 260]) {
        context.beginPath();
        context.arc(VIEWPORT.width / 2, 650, radius, 0, TAU);
        context.stroke();
      }
      for (let index = 0; index < 12; index += 1) {
        const angle = (index / 12) * TAU;
        context.beginPath();
        context.moveTo(
          VIEWPORT.width / 2 + Math.cos(angle) * 265,
          650 + Math.sin(angle) * 265,
        );
        context.lineTo(
          VIEWPORT.width / 2 + Math.cos(angle) * 300,
          650 + Math.sin(angle) * 300,
        );
        context.stroke();
      }
    }
    context.restore();
  }

  drawRoomAtmosphere(context, environment, palette) {
    const state = getRoomEffectState({
      environment,
      roomId: this.roomDefinition?.id ?? `${environment}-idle`,
      roomNumber: Math.max(0, this.room),
      clock: this.visualClock,
    });

    this.drawRoomAmbientLighting(context, palette, state);
    this.drawRoomAmbientMotes(context, state);

    if (environment === "ember") {
      this.drawFurnaceBreath(context, palette, state);
    } else if (environment === "brass") {
      this.drawBrassMechanisms(context, palette, state);
    } else if (environment === "smoke") {
      this.drawSteamPlumes(context, state, false);
    } else if (environment === "pressure") {
      this.drawPressureMechanisms(context, palette, state);
    } else if (environment === "heart") {
      this.drawRoasterHeartPulse(context, palette, state);
    } else if (["canopy", "mire", "mycelium", "briar", "rootdeep", "rootheart"].includes(environment)) {
      this.drawRootfallAtmosphere(context, environment, palette, state);
    }
  }

  drawRootfallAtmosphere(context, environment, palette, state) {
    const centerX = VIEWPORT.width / 2;
    const centerY = 650;
    context.save();
    context.globalCompositeOperation = "screen";
    context.strokeStyle = `${palette.accent}88`;
    context.fillStyle = `${palette.accent}44`;
    context.lineWidth = 2;

    if (environment === "canopy") {
      for (let index = 0; index < 5; index += 1) {
        const x = 90 + index * 135 + Math.sin(state.time * 0.7 + index) * 12;
        const y = 280 + ((index * 197 + state.variant * 61) % 690);
        context.save();
        context.translate(x, y);
        context.rotate(state.time * 0.12 * state.direction + index);
        context.globalAlpha = 0.12 + state.pulse * 0.12;
        context.beginPath();
        context.ellipse(0, 0, 18, 6, 0, 0, TAU);
        context.fill();
        context.restore();
      }
    } else if (environment === "mire") {
      for (const [index, x] of [92, 154, 566, 628].entries()) {
        const y = 350 + ((index * 241 + state.variant * 83) % 620);
        const radius = 5 + state.pulse * 7;
        context.globalAlpha = 0.14 + state.pulse * 0.16;
        context.beginPath();
        context.arc(x, y, radius, 0, TAU);
        context.stroke();
        context.beginPath();
        context.arc(x + 12, y - 16, radius * 0.46, 0, TAU);
        context.stroke();
      }
    } else if (environment === "mycelium") {
      const glow = context.createRadialGradient(centerX, centerY, 20, centerX, centerY, 310);
      glow.addColorStop(0, `${palette.accent}55`);
      glow.addColorStop(1, `${palette.accent}00`);
      context.globalAlpha = 0.08 + state.pulse * 0.08;
      context.fillStyle = glow;
      context.fillRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
    } else if (environment === "briar") {
      context.globalAlpha = 0.14 + state.pulse * 0.14;
      for (const side of [-1, 1]) {
        for (let index = 0; index < 4; index += 1) {
          const x = side < 0 ? ARENA.left + 18 : ARENA.right - 18;
          const y = 330 + index * 220 + state.variant * 13;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(x - side * (24 + state.pulse * 18), y - 13);
          context.lineTo(x - side * 15, y - 28);
          context.stroke();
        }
      }
    } else {
      const glowY = environment === "rootheart" ? 250 : centerY;
      const glow = context.createRadialGradient(centerX, glowY, 12, centerX, glowY, 340);
      glow.addColorStop(0, `${palette.accent}aa`);
      glow.addColorStop(0.38, `${palette.accent}33`);
      glow.addColorStop(1, `${palette.accent}00`);
      context.globalAlpha = (0.08 + state.pulse * 0.13) * state.strength;
      context.fillStyle = glow;
      context.fillRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
      context.translate(centerX, centerY);
      context.rotate(state.time * 0.04 * state.direction);
      context.globalAlpha = 0.08 + state.pulse * 0.1;
      for (const radius of [120, 220, 294]) {
        context.beginPath();
        context.arc(0, 0, radius, 0, TAU);
        context.stroke();
      }
    }
    context.restore();
  }

  drawRoomAmbientLighting(context, palette, state) {
    const lightX = state.direction > 0 ? ARENA.left + 40 : ARENA.right - 40;
    const lightY = 250 + state.variant * 210;
    const glow = context.createRadialGradient(lightX, lightY, 10, lightX, lightY, 310);
    glow.addColorStop(0, palette.accent);
    glow.addColorStop(0.42, `${palette.accent}44`);
    glow.addColorStop(1, `${palette.accent}00`);

    context.save();
    context.globalCompositeOperation = "screen";
    context.globalAlpha = 0.035 + state.pulse * 0.045 * state.strength;
    context.fillStyle = glow;
    context.fillRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
    context.restore();
  }

  drawRoomAmbientMotes(context, state) {
    const profile = getRoomEffectProfile(state.environment);
    const arenaWidth = ARENA.right - ARENA.left;
    const arenaHeight = ARENA.bottom - ARENA.top;

    context.save();
    context.globalCompositeOperation = state.environment === "smoke" ? "source-over" : "screen";
    for (let index = 0; index < profile.moteCount; index += 1) {
      const mote = getRoomAmbientMote(state, index);
      if (!mote) {
        continue;
      }
      const x = ARENA.left + mote.x * arenaWidth;
      const y = ARENA.top + mote.y * arenaHeight;
      const isSmoke = state.environment === "smoke";
      context.save();
      context.translate(x, y);
      context.rotate(mote.rotation);
      context.globalAlpha = mote.alpha * (isSmoke ? 0.34 : 0.7);
      context.fillStyle = mote.color;
      context.shadowBlur = isSmoke ? 12 : state.environment === "ember" || state.environment === "heart" ? 8 : 2;
      context.shadowColor = mote.color;
      if (isSmoke) {
        context.beginPath();
        context.ellipse(0, 0, mote.size * 1.5, mote.size, 0, 0, TAU);
        context.fill();
      } else if (state.environment === "ash" || state.environment === "brass") {
        context.fillRect(-mote.size * 0.6, -0.8, mote.size * 1.2, 1.6);
      } else {
        context.beginPath();
        context.arc(0, 0, Math.max(1.1, mote.size * 0.52), 0, TAU);
        context.fill();
      }
      context.restore();
    }
    context.restore();
  }

  drawFurnaceBreath(context, palette, state) {
    const glow = context.createRadialGradient(
      VIEWPORT.width / 2,
      ARENA.top + 8,
      18,
      VIEWPORT.width / 2,
      ARENA.top + 20,
      390,
    );
    glow.addColorStop(0, "#ff9c4b");
    glow.addColorStop(0.34, `${palette.accent}88`);
    glow.addColorStop(1, `${palette.accent}00`);

    context.save();
    context.globalCompositeOperation = "screen";
    context.globalAlpha = (0.07 + state.pulse * 0.12) * state.strength;
    context.fillStyle = glow;
    context.fillRect(0, ARENA.top - 30, VIEWPORT.width, 410);
    context.strokeStyle = "rgba(255, 170, 86, 0.28)";
    context.lineWidth = 2;
    for (let index = 0; index < 3; index += 1) {
      const side = (index + state.variant) % 2 === 0 ? 1 : -1;
      const x = side > 0 ? ARENA.left + 54 : ARENA.right - 54;
      const y = 350 + index * 250;
      const sway = Math.sin(state.time * 1.4 + state.phase + index) * 18;
      context.beginPath();
      context.moveTo(x, y + 52);
      context.bezierCurveTo(x + sway, y + 24, x - sway, y - 10, x + sway * 0.35, y - 54);
      context.stroke();
    }
    context.restore();
  }

  drawBrassMechanisms(context, palette, state) {
    const positions = [
      [84, 310],
      [636, 310],
      [84, 610],
      [636, 610],
      [84, 910],
      [636, 910],
    ];

    context.save();
    context.strokeStyle = `${palette.accent}88`;
    context.fillStyle = "rgba(12, 8, 5, 0.48)";
    context.lineWidth = 2;
    for (let index = 0; index < positions.length; index += 1) {
      if ((index + state.variant) % 2 !== 0) {
        continue;
      }
      const [x, y] = positions[index];
      const rotation = state.time * (0.24 + index * 0.025) * state.direction + state.phase;
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.globalAlpha = 0.34 + state.pulse * 0.22;
      context.beginPath();
      context.arc(0, 0, 18, 0, TAU);
      context.fill();
      context.stroke();
      for (let spoke = 0; spoke < 6; spoke += 1) {
        const angle = (spoke / 6) * TAU;
        context.beginPath();
        context.moveTo(Math.cos(angle) * 5, Math.sin(angle) * 5);
        context.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
        context.stroke();
      }
      context.restore();
    }
    context.restore();
  }

  drawSteamPlumes(context, state, pressureJet) {
    const positions = [
      [ARENA.left + 22, 390],
      [ARENA.right - 22, 470],
      [ARENA.left + 22, 760],
      [ARENA.right - 22, 900],
    ];

    context.save();
    context.lineCap = "round";
    for (let index = 0; index < positions.length; index += 1) {
      if ((index + state.variant) % 2 !== 0) {
        continue;
      }
      const [x, y] = positions[index];
      const leftSide = x < VIEWPORT.width / 2;
      const inward = leftSide ? 1 : -1;
      const wave = Math.sin(state.time * 1.1 + state.phase + index * 1.9);
      const strength = pressureJet
        ? Math.pow(Math.max(0, Math.sin(state.time * 1.55 + state.phase + index * 0.8)), 5)
        : 0.46 + state.pulse * 0.38;
      if (strength < 0.025) {
        continue;
      }
      context.globalAlpha = strength * (pressureJet ? 0.34 : 0.2) * state.strength;
      context.strokeStyle = pressureJet ? "#f3e3c8" : "#b9a7b3";
      context.shadowBlur = pressureJet ? 18 : 12;
      context.shadowColor = context.strokeStyle;
      context.lineWidth = pressureJet ? 11 : 8;
      context.beginPath();
      context.moveTo(x, y + 34);
      context.bezierCurveTo(
        x + inward * (25 + wave * 8),
        y + 5,
        x + inward * (44 - wave * 10),
        y - 38,
        x + inward * (28 + wave * 12),
        y - (pressureJet ? 96 : 126),
      );
      context.stroke();
    }
    context.restore();
  }

  drawPressureMechanisms(context, palette, state) {
    this.drawSteamPlumes(context, state, true);

    const gauges = [
      [82, 285],
      [638, 545],
      [82, 830],
      [638, 1040],
    ];
    context.save();
    context.strokeStyle = `${palette.accent}aa`;
    context.lineWidth = 2;
    for (let index = 0; index < gauges.length; index += 1) {
      const [x, y] = gauges[index];
      const angle = -Math.PI * 0.72
        + (0.18 + state.pulse * 0.64) * Math.PI * 1.44
        + index * 0.08 * state.direction;
      context.globalAlpha = 0.36 + ((index + state.variant) % 2 === 0 ? 0.28 : 0);
      context.beginPath();
      context.arc(x, y, 14, Math.PI, TAU);
      context.stroke();
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + Math.cos(angle) * 11, y + Math.sin(angle) * 11);
      context.stroke();
    }
    context.restore();
  }

  drawRoasterHeartPulse(context, palette, state) {
    const reactorGlow = context.createRadialGradient(
      VIEWPORT.width / 2,
      176,
      16,
      VIEWPORT.width / 2,
      176,
      360,
    );
    reactorGlow.addColorStop(0, "#ffbb62");
    reactorGlow.addColorStop(0.2, `${palette.accent}aa`);
    reactorGlow.addColorStop(1, `${palette.accent}00`);

    context.save();
    context.globalCompositeOperation = "screen";
    context.globalAlpha = (0.08 + state.pulse * 0.12) * state.strength;
    context.fillStyle = reactorGlow;
    context.fillRect(0, ARENA.top - 60, VIEWPORT.width, 520);
    context.translate(VIEWPORT.width / 2, 650);
    context.rotate(state.time * 0.055 * state.direction + state.phase * 0.08);
    context.strokeStyle = palette.accent;
    context.lineWidth = 3;
    context.globalAlpha = 0.08 + state.pulse * 0.1;
    for (const radius of [128, 194, 264]) {
      for (let segment = 0; segment < 4; segment += 1) {
        const start = (segment / 4) * TAU + 0.08;
        context.beginPath();
        context.arc(0, 0, radius, start, start + 0.42);
        context.stroke();
      }
    }
    context.restore();
  }

  drawRoomHazards(context, palette) {
    for (const hazard of this.roomDefinition?.hazards ?? []) {
      const active = this.mode === "running" && isHazardActive(hazard, this.hazardClock);
      const pulse = 0.82 + Math.sin(this.hazardClock * 8 + hazard.phase) * 0.18;
      const color = HAZARD_COLORS[hazard.kind] ?? palette.accent;
      context.save();
      context.translate(hazard.x, hazard.y);
      context.globalAlpha = active ? 0.88 : 0.34;
      context.fillStyle = active ? color : palette.line + "66";
      context.strokeStyle = active ? "#ffd29b" : palette.accent + "88";
      context.lineWidth = active ? 4 : 2;
      context.setLineDash(active ? [] : [8, 8]);
      context.beginPath();
      context.arc(0, 0, hazard.radius * (active ? pulse : 1), 0, TAU);
      context.fill();
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = "rgba(16, 9, 7, 0.76)";
      context.beginPath();
      context.arc(0, 0, Math.max(12, hazard.radius * 0.3), 0, TAU);
      context.fill();
      context.strokeStyle = active ? "#fff0c2" : palette.line + "aa";
      context.lineWidth = 3;
      for (let index = 0; index < 4; index += 1) {
        const angle = (index / 4) * TAU + Math.PI / 4;
        context.beginPath();
        context.moveTo(
          Math.cos(angle) * hazard.radius * 0.42,
          Math.sin(angle) * hazard.radius * 0.42,
        );
        context.lineTo(
          Math.cos(angle) * hazard.radius * 0.76,
          Math.sin(angle) * hazard.radius * 0.76,
        );
        context.stroke();
      }
      if (active) {
        context.globalAlpha = 0.58;
        context.strokeStyle = color;
        context.lineWidth = 8;
        context.beginPath();
        context.arc(0, 0, hazard.radius * 1.12, 0, TAU);
        context.stroke();
      }
      context.restore();
    }
  }

  drawRoomObstacles(context, palette) {
    for (const obstacle of this.roomDefinition?.obstacles ?? []) {
      const pillar = obstacle.kind === "pillar" || obstacle.kind.endsWith("-pillar");
      const organic = ["root", "thorn", "fungal"].some((token) => obstacle.kind.includes(token));
      const radius = pillar ? 10 : 6;
      context.save();
      context.shadowBlur = 14;
      context.shadowColor = "rgba(0, 0, 0, 0.7)";
      const gradient = context.createLinearGradient(
        obstacle.x,
        obstacle.y,
        obstacle.x,
        obstacle.y + obstacle.height,
      );
      gradient.addColorStop(0, obstacle.kind === "crate" ? "#6b3824" : organic ? "#3f4a2d" : "#493428");
      gradient.addColorStop(1, organic ? "#11150d" : "#17100d");
      context.fillStyle = gradient;
      context.strokeStyle = palette.accent;
      context.lineWidth = 3;
      context.beginPath();
      context.roundRect(
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height,
        radius,
      );
      context.fill();
      context.stroke();
      context.shadowBlur = 0;
      context.strokeStyle = palette.accent + "88";
      context.lineWidth = 2;
      if (pillar) {
        context.beginPath();
        context.ellipse(
          obstacle.x + obstacle.width / 2,
          obstacle.y + obstacle.height * 0.24,
          obstacle.width * 0.32,
          obstacle.height * 0.18,
          0,
          0,
          TAU,
        );
        context.stroke();
      } else {
        context.beginPath();
        context.moveTo(obstacle.x + 12, obstacle.y + 10);
        context.lineTo(obstacle.x + obstacle.width - 12, obstacle.y + obstacle.height - 10);
        context.moveTo(obstacle.x + obstacle.width - 12, obstacle.y + 10);
        context.lineTo(obstacle.x + 12, obstacle.y + obstacle.height - 10);
        context.stroke();
      }
      context.restore();
    }
  }

  drawRoomDestructibles(context, palette) {
    for (const destructible of this.destructibles ?? []) {
      if (!destructible.alive) {
        continue;
      }
      const definition = getDestructibleDefinition(destructible.type);
      if (!definition) {
        continue;
      }

      const centerX = destructible.x + destructible.width / 2;
      const centerY = destructible.y + destructible.height / 2;
      const hitShake = destructible.hitFlash > 0
        ? Math.sin(this.visualClock * 95 + destructible.id) * 4
        : 0;
      const healthRatio = clamp(destructible.hp / destructible.maxHp, 0, 1);
      const sprite = this.destructibleSprites?.get(destructible.type);

      context.save();
      context.translate(centerX + hitShake, centerY);
      context.shadowBlur = 15;
      context.shadowColor = "rgba(0, 0, 0, 0.72)";
      context.filter = destructible.hitFlash > 0
        ? "brightness(1.65) saturate(0.72)"
        : healthRatio < 0.34
          ? "brightness(0.68) saturate(0.55)"
          : healthRatio < 0.67 ? "brightness(0.83) saturate(0.78)" : "none";
      if (sprite) {
        context.drawImage(
          sprite,
          -definition.art.renderWidth / 2,
          -definition.art.renderHeight / 2,
          definition.art.renderWidth,
          definition.art.renderHeight,
        );
      } else {
        const gradient = context.createLinearGradient(0, -destructible.height / 2, 0, destructible.height / 2);
        gradient.addColorStop(0, palette.accent);
        gradient.addColorStop(1, "#17100d");
        context.fillStyle = gradient;
        context.strokeStyle = "#d3ab6c";
        context.lineWidth = 3;
        context.beginPath();
        context.roundRect(
          -destructible.width / 2,
          -destructible.height / 2,
          destructible.width,
          destructible.height,
          8,
        );
        context.fill();
        context.stroke();
      }
      context.restore();

      if (healthRatio < 0.72) {
        context.save();
        context.strokeStyle = healthRatio < 0.34 ? "#f4b06a" : "rgba(28, 16, 12, 0.88)";
        context.lineWidth = healthRatio < 0.34 ? 3 : 2;
        context.beginPath();
        context.moveTo(centerX - 20, centerY - 24);
        context.lineTo(centerX - 5, centerY - 7);
        context.lineTo(centerX - 14, centerY + 10);
        context.moveTo(centerX + 19, centerY - 18);
        context.lineTo(centerX + 4, centerY + 2);
        context.lineTo(centerX + 16, centerY + 19);
        context.stroke();
        context.restore();
      }

      if (healthRatio < 1) {
        const barWidth = Math.max(52, destructible.width);
        const barX = centerX - barWidth / 2;
        const barY = destructible.y - 16;
        context.save();
        context.fillStyle = "rgba(7, 5, 4, 0.82)";
        context.fillRect(barX, barY, barWidth, 7);
        context.fillStyle = healthRatio < 0.34 ? "#d95635" : palette.accent;
        context.fillRect(barX + 1, barY + 1, (barWidth - 2) * healthRatio, 5);
        context.restore();
      }
    }
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

  drawPickup(context, pickup) {
    const bob = Math.sin(pickup.age * 5 + pickup.id) * 3;
    context.save();
    context.translate(pickup.x, pickup.y + bob);
    context.rotate(pickup.type === "xp" ? pickup.age * 2.4 : 0);
    context.shadowBlur = 20;
    context.shadowColor = pickup.type === "heal" ? "#74d692" : "#c586ff";
    context.strokeStyle = pickup.type === "heal" ? "#b9ffd0" : "#f0d0ff";
    context.fillStyle = pickup.type === "heal" ? "#327c50" : "#7d43a3";
    context.lineWidth = 2.5;

    if (pickup.type === "heal") {
      context.beginPath();
      context.arc(0, 0, pickup.radius, 0, TAU);
      context.fill();
      context.stroke();
      context.fillStyle = "#e8fff0";
      context.fillRect(-3, -8, 6, 16);
      context.fillRect(-8, -3, 16, 6);
    } else {
      context.beginPath();
      context.moveTo(0, -pickup.radius * 1.35);
      context.lineTo(pickup.radius, 0);
      context.lineTo(0, pickup.radius * 1.35);
      context.lineTo(-pickup.radius, 0);
      context.closePath();
      context.fill();
      context.stroke();
      context.fillStyle = "rgba(255, 239, 190, 0.72)";
      context.beginPath();
      context.arc(-2, -3, 2.5, 0, TAU);
      context.fill();
    }
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

    if (projectile.visual === "katana") {
      context.beginPath();
      context.arc(0, 0, projectile.radius * 1.8, -0.88, 0.88);
      context.stroke();
      context.fillRect(-projectile.radius * 0.25, -1.5, projectile.radius * 2.4, 3);
    } else if (projectile.visual === "bat") {
      context.lineWidth = Math.max(5, projectile.radius * 0.72);
      context.beginPath();
      context.moveTo(-projectile.radius * 0.8, 0);
      context.lineTo(projectile.radius * 1.7, 0);
      context.stroke();
    } else if (projectile.visual === "hammer") {
      context.rotate(Math.PI / 4);
      context.fillRect(-projectile.radius * 0.78, -projectile.radius * 0.78, projectile.radius * 1.56, projectile.radius * 1.56);
      context.strokeRect(-projectile.radius, -projectile.radius, projectile.radius * 2, projectile.radius * 2);
    } else if (projectile.visual === "bow") {
      context.lineWidth = Math.max(2, projectile.radius * 0.42);
      context.beginPath();
      context.moveTo(-projectile.radius * 2.7, 0);
      context.lineTo(projectile.radius * 2.4, 0);
      context.stroke();
      context.fillStyle = projectile.critical ? "#fff2b4" : projectile.secondary;
      context.beginPath();
      context.moveTo(projectile.radius * 3.2, 0);
      context.lineTo(projectile.radius * 1.7, -projectile.radius * 0.72);
      context.lineTo(projectile.radius * 1.7, projectile.radius * 0.72);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(-projectile.radius * 2.35, 0);
      context.lineTo(-projectile.radius * 3.25, -projectile.radius * 0.82);
      context.moveTo(-projectile.radius * 2.35, 0);
      context.lineTo(-projectile.radius * 3.25, projectile.radius * 0.82);
      context.stroke();
    } else if (projectile.visual === "shuriken") {
      context.rotate(Math.PI / 4 + projectile.age * 13);
      context.beginPath();
      context.moveTo(0, -projectile.radius * 1.6);
      context.lineTo(projectile.radius * 0.38, -projectile.radius * 0.38);
      context.lineTo(projectile.radius * 1.6, 0);
      context.lineTo(projectile.radius * 0.38, projectile.radius * 0.38);
      context.lineTo(0, projectile.radius * 1.6);
      context.lineTo(-projectile.radius * 0.38, projectile.radius * 0.38);
      context.lineTo(-projectile.radius * 1.6, 0);
      context.lineTo(-projectile.radius * 0.38, -projectile.radius * 0.38);
      context.closePath();
      context.fill();
    } else if (projectile.visual === "coffee-rifle") {
      context.fillStyle = "#6f351f";
      context.fillRect(-projectile.radius * 2.7, -projectile.radius * 0.7, projectile.radius * 4.8, projectile.radius * 1.4);
      context.fillStyle = projectile.critical ? "#fff2b4" : projectile.secondary;
      context.beginPath();
      context.arc(projectile.radius * 2.15, 0, projectile.radius * 0.9, 0, TAU);
      context.fill();
      context.strokeStyle = "rgba(244, 225, 195, 0.7)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-projectile.radius * 2.2, -projectile.radius);
      context.quadraticCurveTo(-projectile.radius * 1.5, -projectile.radius * 2, -projectile.radius * 0.8, -projectile.radius);
      context.stroke();
    } else {
      context.fillRect(-projectile.radius * 2.6, -projectile.radius * 0.5, projectile.radius * 5.2, projectile.radius);
    }
    context.restore();
  }

  drawPlayer(context) {
    const player = this.player;
    const pose = getPlayerAnimationPose(player);
    context.save();
    if (player.invulnerability > 0 && Math.floor(player.invulnerability * 18) % 2 === 0) {
      context.globalAlpha = 0.46;
    }

    const drewPlayerSprite = (
      this.heroReactionSprite
      || this.heroSecondaryAttackSprite
      || this.heroFullMotionSprite
      || this.heroMotionSprite
      || this.heroDirectionalSprite
      || this.heroSprite
    )
      ? this.drawPlayerSprite(context, player, pose)
      : false;
    if (!drewPlayerSprite) {
      context.save();
      context.translate(player.x + pose.hitJitter, player.y + pose.bob);
      context.rotate(player.facing + Math.PI / 2 + pose.lean);
      context.scale(pose.scaleX, pose.scaleY);

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

    this.drawPlayerCombatCue(context, player, pose);
    context.restore();
  }

  drawPlayerSprite(context, player, pose) {
    const directionalSprite = this.heroDirectionalSprite;
    const direction = getPlayerFacingDirection(player);
    let reactionFrame = (this.heroReactionSprite || this.hero.art.reactionAnimation)
      ? getPlayerFullMotionFrame(
        player,
        this.hero.art.reactionStateRows,
        this.hero.art.reactionAnimation,
      )
      : null;
    let reactionRenderSprite = reactionFrame?.page
      ? this.requestHeroAnimationPage("reaction", reactionFrame.page)
      : this.heroReactionSprite;
    if (reactionFrame?.page && !reactionRenderSprite && this.heroReactionSprite) {
      reactionFrame = getPlayerFullMotionFrame(
        player,
        this.hero.art.reactionStateRows,
      );
      reactionRenderSprite = this.heroReactionSprite;
    }
    const useReactionSprite = Boolean(
      reactionRenderSprite
      && reactionFrame,
    );
    const useSecondaryAttackSprite = Boolean(
      !useReactionSprite
      && this.heroSecondaryAttackSprite
      && player.attackAnimation > 0
      && player.lastAttackVisual === this.hero.combat.secondaryWeapon?.visual,
    );
    let fullMotionFrame = (
      !useReactionSprite
      && !useSecondaryAttackSprite
      && (this.heroFullMotionSprite || this.hero.art.fullMotionAnimation)
    )
      ? getPlayerFullMotionFrame(
        player,
        this.hero.art.fullMotionStateRows,
        this.hero.art.fullMotionAnimation,
      )
      : null;
    let fullMotionRenderSprite = fullMotionFrame?.page
      ? this.requestHeroAnimationPage("fullMotion", fullMotionFrame.page)
      : this.heroFullMotionSprite;
    if (fullMotionFrame?.page && !fullMotionRenderSprite && this.heroFullMotionSprite) {
      fullMotionFrame = getPlayerFullMotionFrame(
        player,
        this.hero.art.fullMotionStateRows,
      );
      fullMotionRenderSprite = this.heroFullMotionSprite;
    }
    const useFullMotionSprite = Boolean(
      !useReactionSprite
      && !useSecondaryAttackSprite
      && fullMotionRenderSprite
      && fullMotionFrame,
    );
    const useMotionSprite = Boolean(
      !useReactionSprite
      && !useSecondaryAttackSprite
      && !useFullMotionSprite
      && this.heroMotionSprite
      && this.hero.art.motionDirections.includes(direction),
    );
    const motionFrame = useMotionSprite
      ? getPlayerAnimationFrame(player, this.hero.art.motionFrames)
      : null;
    const sprite = useReactionSprite
      ? reactionRenderSprite
      : useSecondaryAttackSprite
        ? this.heroSecondaryAttackSprite
        : useFullMotionSprite
          ? fullMotionRenderSprite
          : useMotionSprite
            ? this.heroMotionSprite
            : directionalSprite ?? this.heroSprite;
    if (!sprite) {
      return false;
    }
    const targetHeight = 170;
    const frame = this.hero.art.directionalFrames[direction] ?? { index: 0 };
    const usesAtlas = useReactionSprite
      || useSecondaryAttackSprite
      || useFullMotionSprite
      || useMotionSprite
      || Boolean(directionalSprite);
    const sourceColumns = useReactionSprite
      ? reactionFrame.columns ?? 4
      : useSecondaryAttackSprite
        ? 4
        : useFullMotionSprite
          ? fullMotionFrame.columns ?? 4
          : usesAtlas ? 4 : 1;
    const sourceRows = useReactionSprite
      ? reactionFrame.rows ?? 4
      : useSecondaryAttackSprite
        ? 2
        : useFullMotionSprite
          ? fullMotionFrame.rows ?? 6
          : usesAtlas ? 2 : 1;
    const sourceWidth = sprite.width / sourceColumns;
    const sourceHeight = sprite.height / sourceRows;
    const targetWidth = targetHeight * (sourceWidth / sourceHeight);
    const sourceIndex = useReactionSprite
      ? reactionFrame.index
      : useSecondaryAttackSprite
        ? frame?.index ?? 0
        : useFullMotionSprite
          ? fullMotionFrame.index
          : motionFrame?.index ?? frame?.index ?? 0;
    const flipX = useReactionSprite || useSecondaryAttackSprite || useFullMotionSprite
      ? false
      : useMotionSprite
        ? direction === "west" || direction === "south-west"
        : Boolean(frame?.flipX);
    const authoredMotion = useReactionSprite
      || useSecondaryAttackSprite
      || useFullMotionSprite
      || Boolean(motionFrame);
    const authoredState = reactionFrame?.state
      ?? (useSecondaryAttackSprite ? "attack" : null)
      ?? fullMotionFrame?.state
      ?? motionFrame?.state;
    const renderBob = authoredMotion
      ? authoredState === "idle" ? pose.bob * 0.35 : 0
      : pose.bob;
    const renderLean = authoredMotion ? 0 : pose.lean;
    const renderScaleX = authoredMotion ? 1 : pose.scaleX;
    const renderScaleY = authoredMotion ? 1 : pose.scaleY;

    context.save();
    context.translate(player.x, player.y);
    context.fillStyle = "rgba(0, 0, 0, 0.38)";
    context.beginPath();
    context.ellipse(
      0,
      35,
      Math.min(52, targetWidth * 0.34) * pose.shadowScale,
      15 / pose.shadowScale,
      0,
      0,
      TAU,
    );
    context.fill();
    context.restore();

    context.save();
    context.translate(player.x + pose.hitJitter, player.y + renderBob);
    context.rotate(renderLean);
    context.scale((flipX ? -1 : 1) * renderScaleX, renderScaleY);
    context.imageSmoothingEnabled = false;
    context.shadowBlur = player.moving ? 6 : 13;
    context.shadowColor = player.accent;
    if (usesAtlas) {
      const selectedFrame = useReactionSprite
        ? reactionFrame
        : useSecondaryAttackSprite
          ? frame
          : useFullMotionSprite
            ? fullMotionFrame
            : motionFrame ?? frame;
      const sourceColumn = selectedFrame?.column ?? sourceIndex % sourceColumns;
      const sourceRow = selectedFrame?.row ?? Math.floor(sourceIndex / sourceColumns);
      const sourceX = sourceColumn * sourceWidth;
      const sourceY = sourceRow * sourceHeight;
      context.drawImage(
        sprite,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        -targetWidth / 2,
        -targetHeight * 0.74,
        targetWidth,
        targetHeight,
      );
    } else {
      context.drawImage(
        sprite,
        -targetWidth / 2,
        -targetHeight * 0.74,
        targetWidth,
        targetHeight,
      );
    }
    context.restore();
    return true;
  }

  drawPlayerCombatCue(context, player, pose) {
    if (pose.strike > 0 && !pose.defeated) {
      context.save();
      context.translate(player.x, player.y + pose.bob * 0.35);
      context.rotate(player.facing);
      context.globalAlpha = 0.32 + pose.strike * 0.68;
      context.strokeStyle = player.accent;
      context.fillStyle = player.secondary;
      context.shadowBlur = 24;
      context.shadowColor = player.accent;
      context.lineCap = "round";

      const attackVisual = player.lastAttackVisual ?? player.weaponVisual;
      if (attackVisual === "katana") {
        // Katana motion is carried by the character pose. A long colored arc
        // reads like a second weapon in the hand and is intentionally omitted.
      } else if (attackVisual === "bat") {
        context.lineWidth = 12;
        context.beginPath();
        context.arc(4, 0, 52, -0.82, 0.82);
        context.stroke();
      } else if (attackVisual === "hammer") {
        context.lineWidth = 6;
        context.beginPath();
        context.arc(55, 0, 18 + pose.strike * 22, 0, TAU);
        context.stroke();
        context.beginPath();
        context.moveTo(27, 0);
        context.lineTo(72, 0);
        context.stroke();
      } else if (attackVisual === "bow") {
        context.lineWidth = 4;
        context.beginPath();
        context.arc(18, 0, 42, -1.08, 1.08);
        context.stroke();
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(38, -37);
        context.lineTo(38, 37);
        context.moveTo(30, 0);
        context.lineTo(82 + pose.strike * 22, 0);
        context.stroke();
      } else if (attackVisual === "shuriken") {
        context.lineWidth = 4;
        for (const offset of [-0.2, 0, 0.2]) {
          context.beginPath();
          context.moveTo(25, offset * 58);
          context.lineTo(65 + pose.strike * 18, offset * 92);
          context.stroke();
        }
      } else if (attackVisual === "coffee-rifle") {
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(30, 0);
        context.lineTo(82 + pose.strike * 16, 0);
        context.stroke();
        context.beginPath();
        context.arc(78, 0, 7 + pose.strike * 9, 0, TAU);
        context.fill();
        context.strokeStyle = "rgba(240, 221, 196, 0.72)";
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(44, -8);
        context.quadraticCurveTo(58, -29, 72, -12);
        context.stroke();
      }
      context.restore();
    }

    if (pose.hit > 0) {
      context.save();
      context.globalAlpha = pose.hit * 0.72;
      context.strokeStyle = "#ff7a66";
      context.lineWidth = 5;
      context.beginPath();
      context.arc(player.x, player.y, 32 + (1 - pose.hit) * 24, 0, TAU);
      context.stroke();
      context.restore();
    }
  }

  drawCombatText(context, entry) {
    const opacity = clamp(entry.life / entry.maxLife, 0, 1);
    context.save();
    context.globalAlpha = Math.min(1, opacity * 1.65);
    context.fillStyle = entry.color;
    context.shadowBlur = 10;
    context.shadowColor = "rgba(0, 0, 0, 0.9)";
    context.font = `900 ${entry.size}px Arial Narrow, sans-serif`;
    context.textAlign = "center";
    context.fillText(entry.text, entry.x, entry.y);
    context.restore();
  }

  drawPlayerWeapon(context, player) {
    context.save();
    context.strokeStyle = player.secondary;
    context.fillStyle = player.accent;
    context.lineWidth = 6;
    context.lineCap = "round";

    if (player.weaponVisual === "katana") {
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(18, 23);
      context.lineTo(39, -47);
      context.stroke();
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(12, 10);
      context.lineTo(30, 15);
      context.stroke();
      if (player.secondaryWeapon?.visual === "shuriken") {
        context.lineWidth = 2;
        for (const x of [-23, -10, 3]) {
          context.save();
          context.translate(x, 29);
          context.rotate(Math.PI / 4);
          context.strokeRect(-4, -4, 8, 8);
          context.restore();
        }
      }
    } else if (player.weaponVisual === "bat") {
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
    } else if (player.weaponVisual === "bow") {
      context.lineWidth = 5;
      context.beginPath();
      context.arc(5, -8, 38, -1.08, 1.08);
      context.stroke();
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(23, -42);
      context.lineTo(23, 26);
      context.stroke();
    } else if (player.weaponVisual === "shuriken") {
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
    } else if (player.weaponVisual === "coffee-rifle") {
      context.fillRect(15, -39, 10, 62);
      context.fillRect(9, -42, 22, 11);
      context.fillRect(17, 18, 17, 7);
      context.fillStyle = "#6f351f";
      context.beginPath();
      context.arc(10, -7, 8, 0, TAU);
      context.fill();
    }

    context.restore();
  }

  drawEnemyTelegraph(context, enemy) {
    if (enemy.defeated) {
      return;
    }
    const stateDurations = {
      channel: 0.48,
      windup: 0.72,
      "volley-windup": 0.56,
      "pounce-windup": 0.42,
      "seed-windup": 0.5,
      "burrow-windup": 0.42,
      "spore-windup": 0.54,
      "elite-windup": enemy.telegraphDuration,
      "boss-windup": enemy.behavior === "rootfall_tyrant"
        ? enemy.hp / enemy.maxHp < 0.5 ? 0.5 : 0.7
        : enemy.hp / enemy.maxHp < 0.5 ? 0.48 : 0.68,
      "boss-phase": enemy.behavior === "rootfall_tyrant" ? 1.08 : 0.92,
    };
    const duration = stateDurations[enemy.state];
    if (!duration) {
      return;
    }

    const progress = clamp(1 - enemy.stateTimer / duration, 0, 1);
    const pulse = 0.55 + Math.sin(progress * Math.PI * 5) * 0.18;
    context.save();
    context.strokeStyle = `rgba(239, 113, 53, ${pulse})`;
    context.fillStyle = `rgba(239, 113, 53, ${0.07 + progress * 0.08})`;
    context.lineWidth = enemy.isBoss || enemy.isElite ? 4 : 3;
    context.setLineDash([12, 10]);

    if (enemy.state === "windup" || enemy.state === "pounce-windup"
      || (enemy.state === "elite-windup"
        && (enemy.attackPattern === "cleaver-charge"
          || enemy.attackPattern === "saw-charge"
          || enemy.attackPattern === "rake-chain"
          || enemy.attackPattern === "vine-charge"))
      || (enemy.state === "boss-windup" && enemy.attackPattern === "tyrant-rush")) {
      context.beginPath();
      context.moveTo(enemy.x, enemy.y);
      context.lineTo(enemy.x + enemy.dashX * 480, enemy.y + enemy.dashY * 480);
      context.stroke();
      context.lineWidth = 22;
      context.globalAlpha = 0.13 + progress * 0.12;
      context.stroke();
    } else if (enemy.state === "elite-windup"
      && (enemy.attackPattern === "steam-fan"
        || enemy.attackPattern === "tongue-lane"
        || enemy.attackPattern === "petal-clamp")) {
      const offsets = enemy.attackPattern === "tongue-lane"
        ? [-0.11, 0, 0.11]
        : enemy.attackPattern === "petal-clamp"
          ? [-0.52, -0.36, -0.2, 0.2, 0.36, 0.52]
          : [-0.38, -0.19, 0, 0.19, 0.38];
      for (const offset of offsets) {
        context.beginPath();
        context.moveTo(enemy.x, enemy.y);
        context.lineTo(
          enemy.x + Math.cos(enemy.aimAngle + offset) * 560,
          enemy.y + Math.sin(enemy.aimAngle + offset) * 560,
        );
        context.stroke();
      }
    } else if (enemy.state === "elite-windup" && enemy.attackPattern === "cinder-cross") {
      context.setLineDash([]);
      for (let index = 0; index < 8; index += 1) {
        const angle = enemy.phaseTimer * 0.45 + (index / 8) * TAU;
        context.beginPath();
        context.moveTo(enemy.x, enemy.y);
        context.lineTo(
          enemy.x + Math.cos(angle) * 520,
          enemy.y + Math.sin(angle) * 520,
        );
        context.stroke();
      }
    } else if (enemy.state === "channel"
      || enemy.state === "seed-windup"
      || enemy.state === "spore-windup") {
      const offsets = enemy.state === "seed-windup"
        ? enemy.attackPattern === "seed-fan" ? [-0.22, 0, 0.22] : [0]
        : enemy.state === "spore-windup" ? [-0.34, -0.17, 0, 0.17, 0.34] : [0];
      for (const offset of offsets) {
        const targetX = enemy.x + Math.cos(enemy.aimAngle + offset) * 520;
        const targetY = enemy.y + Math.sin(enemy.aimAngle + offset) * 520;
        context.beginPath();
        context.moveTo(enemy.x, enemy.y);
        context.lineTo(targetX, targetY);
        context.stroke();
      }
      context.setLineDash([]);
      context.beginPath();
      context.arc(enemy.x, enemy.y, 34 + progress * 14, 0, TAU);
      context.stroke();
    } else if (enemy.state === "burrow-windup") {
      context.setLineDash([]);
      context.beginPath();
      context.arc(enemy.x, enemy.y, enemy.radius + 18 + progress * 32, 0, TAU);
      context.fill();
      context.stroke();
    } else if (enemy.state === "volley-windup") {
      for (const offset of [-0.16, 0, 0.16]) {
        context.beginPath();
        context.moveTo(enemy.x, enemy.y);
        context.lineTo(
          enemy.x + Math.cos(enemy.aimAngle + offset) * 470,
          enemy.y + Math.sin(enemy.aimAngle + offset) * 470,
        );
        context.stroke();
      }
    } else if (enemy.attackPattern === "pressure-lanes" || enemy.attackPattern === "root-lanes") {
      for (const offset of [-0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42]) {
        context.beginPath();
        context.moveTo(enemy.x, enemy.y);
        context.lineTo(
          enemy.x + Math.cos(enemy.aimAngle + offset) * 640,
          enemy.y + Math.sin(enemy.aimAngle + offset) * 640,
        );
        context.stroke();
      }
    } else {
      context.setLineDash([]);
      context.beginPath();
      context.arc(enemy.x, enemy.y, 82 + progress * 78, 0, TAU);
      context.fill();
      context.stroke();
      context.beginPath();
      context.arc(enemy.x, enemy.y, 38 + progress * 44, 0, TAU);
      context.stroke();
    }

    context.restore();
  }

  drawEnemy(context, enemy) {
    const sprite = this.enemySprites.get(enemy.type);
    const motionSprite = this.enemyMotionSprites.get(enemy.type);
    const specialSprite = this.enemySpecialSprites?.get(enemy.type) ?? null;
    const reactionSprite = this.enemyReactionSprites?.get(enemy.type) ?? null;
    if (sprite || motionSprite || specialSprite || reactionSprite) {
      this.drawEnemySprite(
        context,
        enemy,
        sprite,
        motionSprite,
        specialSprite,
        reactionSprite,
      );
      this.drawEnemyHealth(context, enemy);
      return;
    }

    context.save();
    context.translate(enemy.x, enemy.y);
    const facing = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
    context.rotate(facing + Math.PI / 2);
    context.shadowBlur = enemy.isBoss ? 24 : enemy.isElite ? 18 : 11;
    context.shadowColor = enemy.hitFlash > 0 ? "#fff4d0" : "#a53d25";
    context.strokeStyle = enemy.hitFlash > 0 ? "#fff4d0" : "#d56b3c";
    context.fillStyle = enemy.hitFlash > 0 ? "#e9c695" : "#27110d";
    context.lineWidth = enemy.isBoss || enemy.isElite ? 6 : 4;

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

  drawEnemySprite(
    context,
    enemy,
    sprite,
    motionSprite = null,
    specialSprite = null,
    reactionSprite = null,
  ) {
    const definition = getEnemyDefinition(enemy.type);
    const art = definition?.art;
    let motionFrame = (motionSprite || art?.motionAnimation)
      ? getEnemyFullMotionFrame(enemy, art?.motionStateRows, art?.motionAnimation)
      : null;
    let motionRenderSprite = motionFrame?.page
      ? this.requestEnemyAnimationPage(enemy.type, "motion", motionFrame.page)
      : motionSprite;
    if (motionFrame?.page && !motionRenderSprite && motionSprite) {
      motionFrame = getEnemyFullMotionFrame(enemy, art?.motionStateRows);
      motionRenderSprite = motionSprite;
    }
    const specialState = (specialSprite || art?.specialAnimation)
      ? getEnemySpecialAnimationState(enemy)
      : null;
    let specialFrame = specialState
      ? getEnemyDirectionalStateFrame(
        enemy,
        specialState,
        art?.specialStateRows,
        art?.specialAnimation,
      )
      : null;
    let specialRenderSprite = specialFrame?.page
      ? this.requestEnemyAnimationPage(enemy.type, "special", specialFrame.page)
      : specialSprite;
    if (specialFrame?.page && !specialRenderSprite && specialSprite) {
      specialFrame = getEnemyDirectionalStateFrame(
        enemy,
        specialState,
        art?.specialStateRows,
      );
      specialRenderSprite = specialSprite;
    }
    const reactionState = (reactionSprite || art?.reactionAnimation)
      ? getEnemyReactionAnimationState(enemy)
      : null;
    let reactionFrame = reactionState
      ? getEnemyDirectionalStateFrame(
        enemy,
        reactionState,
        art?.reactionStateRows,
        art?.reactionAnimation,
      )
      : null;
    let reactionRenderSprite = reactionFrame?.page
      ? this.requestEnemyAnimationPage(enemy.type, "reaction", reactionFrame.page)
      : reactionSprite;
    if (reactionFrame?.page && !reactionRenderSprite && reactionSprite) {
      reactionFrame = getEnemyDirectionalStateFrame(
        enemy,
        reactionState,
        art?.reactionStateRows,
      );
      reactionRenderSprite = reactionSprite;
    }
    let directionalFrame = motionRenderSprite ? motionFrame : null;
    let renderedSprite = directionalFrame ? motionRenderSprite : sprite;
    let atlasColumns = directionalFrame?.columns ?? (directionalFrame ? 4 : 1);
    let atlasRows = directionalFrame?.rows ?? (directionalFrame ? 6 : 1);
    if (reactionState === "defeat" && reactionFrame && reactionRenderSprite) {
      directionalFrame = reactionFrame;
      renderedSprite = reactionRenderSprite;
      atlasColumns = reactionFrame.columns ?? 4;
      atlasRows = reactionFrame.rows ?? 4;
    } else if (reactionState === "hit" && reactionFrame && reactionRenderSprite) {
      directionalFrame = reactionFrame;
      renderedSprite = reactionRenderSprite;
      atlasColumns = reactionFrame.columns ?? 4;
      atlasRows = reactionFrame.rows ?? 4;
    } else if (specialState === "phase" && specialFrame && specialRenderSprite) {
      directionalFrame = specialFrame;
      renderedSprite = specialRenderSprite;
      atlasColumns = specialFrame.columns ?? 4;
      atlasRows = specialFrame.rows ?? 4;
    } else if (specialFrame && specialRenderSprite) {
      directionalFrame = specialFrame;
      renderedSprite = specialRenderSprite;
      atlasColumns = specialFrame.columns ?? 4;
      atlasRows = specialFrame.rows ?? 4;
    }
    if (!renderedSprite) {
      return;
    }
    const targetHeight = art?.renderHeight ?? enemy.radius * 3.5;
    const sourceWidth = directionalFrame
      ? renderedSprite.width / atlasColumns
      : renderedSprite.width;
    const sourceHeight = directionalFrame ? renderedSprite.height / atlasRows : renderedSprite.height;
    const targetWidth = targetHeight * (sourceWidth / sourceHeight);
    const anchorY = art?.anchorY ?? 0.6;
    const facingLeft = Math.cos(enemy.facing ?? 0) < 0;
    const floating = enemy.type === "ember_oracle"
      || enemy.type === "smoke_revenant"
      || enemy.type === "cinder_bishop"
      || enemy.type === "spore_moth";
    const bob = directionalFrame === motionFrame && motionFrame
      ? motionFrame.state === "idle" && floating
        ? Math.sin(enemy.animationClock * 0.82 + enemy.id) * 2.5
        : motionFrame.state === "move"
          ? Math.abs(Math.sin(enemy.animationClock)) * 1.5
          : 0
      : floating ? Math.sin(enemy.phaseTimer * 2.4 + enemy.id) * 4 : 0;

    context.save();
    context.translate(enemy.x, enemy.y);
    context.globalAlpha = enemy.submerged ? 0.1 : 1;
    context.fillStyle = "rgba(0, 0, 0, 0.42)";
    context.beginPath();
    context.ellipse(0, enemy.radius * 0.72, enemy.radius * 1.15, enemy.radius * 0.36, 0, 0, TAU);
    context.fill();
    if (enemy.state === "dash"
      || enemy.state === "pounce-dash"
      || enemy.state === "elite-dash"
      || enemy.state === "boss-dash") {
      context.rotate(Math.atan2(enemy.dashY, enemy.dashX) * 0.08);
    }
    context.scale(!directionalFrame && facingLeft ? -1 : 1, 1);
    context.imageSmoothingEnabled = false;
    context.shadowBlur = enemy.isBoss ? 25 : enemy.isElite ? 19 : 11;
    context.shadowColor = enemy.hitFlash > 0 ? "#fff4d0" : "#a53d25";
    if (enemy.hitFlash > 0) {
      context.filter = "brightness(1.75) saturate(0.5)";
    }
    if (directionalFrame) {
      const sourceColumn = directionalFrame.column
        ?? directionalFrame.index % atlasColumns;
      const sourceRow = directionalFrame.row
        ?? Math.floor(directionalFrame.index / atlasColumns);
      const sourceX = sourceColumn * sourceWidth;
      const sourceY = sourceRow * sourceHeight;
      context.drawImage(
        renderedSprite,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        -targetWidth / 2,
        -targetHeight * anchorY + bob,
        targetWidth,
        targetHeight,
      );
    } else {
      context.drawImage(
        renderedSprite,
        -targetWidth / 2,
        -targetHeight * anchorY + bob,
        targetWidth,
        targetHeight,
      );
    }
    context.restore();
  }

  drawEnemyHealth(context, enemy) {
    if (enemy.defeated || enemy.submerged) {
      return;
    }
    const isBoss = enemy.isBoss;
    const isElite = enemy.isElite;
    const prominent = isBoss || isElite;
    const width = isBoss ? 430 : isElite ? 360 : enemy.radius * 2.2;
    const y = prominent ? 145 : enemy.y - enemy.radius - 18;
    const x = prominent ? (VIEWPORT.width - width) / 2 : enemy.x - width / 2;
    const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
    context.save();
    context.fillStyle = "rgba(8, 5, 4, 0.8)";
    context.fillRect(x, y, width, prominent ? 11 : 5);
    context.fillStyle = isBoss ? "#d35b34" : isElite ? "#d9873f" : "#a84930";
    context.fillRect(x, y, width * ratio, prominent ? 11 : 5);
    if (prominent) {
      const definition = getEnemyDefinition(enemy.type);
      context.fillStyle = "rgba(243, 223, 189, 0.82)";
      context.font = "700 14px Arial Narrow, sans-serif";
      context.textAlign = "center";
      context.fillText(definition?.name ?? "UNKNOWN THREAT", VIEWPORT.width / 2, y - 10);
    }
    context.restore();
  }

  drawJoystick(context) {
    if (!this.pointer || (this.mode !== "running" && this.mode !== "exit")) {
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
