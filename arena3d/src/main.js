import {
  ArcRotateCamera,
  Color3,
  Engine,
  MeshBuilder,
  PBRMaterial,
  Scene,
  Vector3,
} from "@babylonjs/core";

import {
  SLICE,
  applyAttackCooldown,
  canAttack,
  createTelegraph,
  damageEnemy,
  damageHero,
  hitEnemiesInArc,
  moveToward,
  roomProgressRatio,
  stepTelegraph,
} from "./combatLogic.js";
import { applyI18n, normalizeLocale } from "./i18n.js";
import { createControls } from "./scene/controls.js";
import { createEnemySet, createSeedProjectile } from "./scene/enemies.js";
import { createHoneyBadger } from "./scene/hero.js";
import { assertNoConceptBillboard, buildRootfallRoom, resolveWallPush } from "./scene/room.js";

const canvas = document.getElementById("render-canvas");
const appRoot = document.getElementById("app");

let locale = normalizeLocale(localStorage.getItem("dofa-arena3d-locale") || "ru");
applyI18n(document, locale);

const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  adaptToDeviceRatio: true,
});
engine.setHardwareScalingLevel(Math.min(1, window.devicePixelRatio > 2 ? 1.15 : 1));

const scene = new Scene(engine);
// Archero / Unity top-down action camera: steep beta, hero in lower third, look toward enemies (-Z).
const actionCamera = new ArcRotateCamera(
  "actionCam",
  0,
  0.4,
  17.5,
  new Vector3(0, 0.15, 0.8),
  scene,
);
actionCamera.lowerRadiusLimit = 12;
actionCamera.upperRadiusLimit = 22;
actionCamera.lowerBetaLimit = 0.32;
actionCamera.upperBetaLimit = 0.65;
actionCamera.fov = 0.68;
actionCamera.panningSensibility = 0;
actionCamera.attachControl(canvas, false);
actionCamera.inputs.removeByType("ArcRotateCameraKeyboardInput");
actionCamera.inputs.removeByType("ArcRotateCameraPointersInput");
actionCamera.inputs.removeByType("ArcRotateCameraMouseWheelInput");

let orbitMode = false;
const orbitCamera = new ArcRotateCamera(
  "orbitCam",
  0.6,
  0.85,
  14,
  new Vector3(0, 1, 0),
  scene,
);
orbitCamera.lowerRadiusLimit = 4;
orbitCamera.upperRadiusLimit = 28;

scene.activeCamera = actionCamera;

const state = {
  paused: false,
  hp: SLICE.heroMaxHp,
  attackCd: 0,
  enemies: [],
  projectiles: [],
  telegraphs: [],
  frames: 0,
  fpsAccum: 0,
  lastFps: 0,
  room: null,
  hero: null,
};

const hud = {
  healthFill: document.getElementById("hud-health-fill"),
  healthText: document.getElementById("hud-health-text"),
  progress: document.getElementById("hud-progress-fill"),
  fps: document.getElementById("perf-fps"),
  mem: document.getElementById("perf-mem"),
  meshes: document.getElementById("perf-meshes"),
  pauseOverlay: document.getElementById("pause-overlay"),
  orbitChip: document.getElementById("orbit-chip"),
};

hud.progress.style.width = `${roomProgressRatio() * 100}%`;

const controls = createControls({
  stickEl: document.getElementById("move-stick"),
  knobEl: document.getElementById("move-knob"),
  attackBtn: document.getElementById("btn-attack"),
  canvas,
});

function setPaused(value) {
  state.paused = value;
  if (!orbitMode) {
    hud.pauseOverlay.hidden = !value;
  }
}

document.getElementById("btn-pause").addEventListener("click", () => setPaused(true));
document.getElementById("btn-resume").addEventListener("click", () => {
  if (orbitMode) toggleOrbit(false);
  setPaused(false);
});

function toggleOrbit(force) {
  orbitMode = typeof force === "boolean" ? force : !orbitMode;
  if (orbitMode) {
    orbitCamera.setTarget(state.hero?.root.position.clone() ?? Vector3.Zero());
    orbitCamera.alpha = 0.75;
    orbitCamera.beta = 0.9;
    orbitCamera.radius = 11;
    scene.activeCamera = orbitCamera;
    orbitCamera.attachControl(canvas, true);
    hud.pauseOverlay.hidden = true;
    if (hud.orbitChip) hud.orbitChip.hidden = false;
    state.paused = true;
  } else {
    orbitCamera.detachControl();
    scene.activeCamera = actionCamera;
    if (hud.orbitChip) hud.orbitChip.hidden = true;
    hud.pauseOverlay.hidden = !state.paused;
  }
}

document.getElementById("btn-orbit").addEventListener("click", () => toggleOrbit(true));
document.getElementById("btn-exit-orbit")?.addEventListener("click", () => {
  toggleOrbit(false);
  setPaused(false);
});

for (const btn of document.querySelectorAll("#lang-bar button")) {
  btn.addEventListener("click", () => {
    locale = normalizeLocale(btn.getAttribute("data-lang"));
    localStorage.setItem("dofa-arena3d-locale", locale);
    applyI18n(document, locale);
    for (const other of document.querySelectorAll("#lang-bar button")) {
      other.setAttribute("aria-pressed", String(other === btn));
    }
  });
  btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === locale));
}

function syncEnemyTransforms() {
  for (const enemy of state.enemies) {
    enemy.x = enemy.root.position.x;
    enemy.z = enemy.root.position.z;
  }
}

function updateHud() {
  const ratio = state.hp / SLICE.heroMaxHp;
  hud.healthFill.style.width = `${Math.max(0, ratio * 100)}%`;
  hud.healthText.textContent = `${Math.round(state.hp)} / ${SLICE.heroMaxHp}`;
}

function spawnTurretShot(enemy) {
  const telegraphMesh = MeshBuilder.CreateDisc(`tg_${enemy.id}_${state.telegraphs.length}`, {
    radius: 0.55,
    tessellation: 24,
  }, scene);
  telegraphMesh.rotation.x = Math.PI / 2;
  telegraphMesh.position = new Vector3(enemy.x, 0.05, enemy.z);
  const mat = new PBRMaterial(`tgMat_${enemy.id}`, scene);
  mat.albedoColor = new Color3(0.1, 0.8, 0.2);
  mat.emissiveColor = new Color3(0.2, 1, 0.3);
  mat.emissiveIntensity = 1.5;
  mat.alpha = 0.45;
  mat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
  telegraphMesh.material = mat;

  const tg = createTelegraph({ x: enemy.x, z: enemy.z, radius: 0.55 });
  tg.mesh = telegraphMesh;
  tg.ownerId = enemy.id;
  state.telegraphs.push(tg);
}

async function boot() {
  state.room = await buildRootfallRoom(scene);
  state.hero = createHoneyBadger(scene, state.room.shadow);
  state.enemies = createEnemySet(scene, state.room.shadow);
  syncEnemyTransforms();
  assertNoConceptBillboard(scene);
  updateHud();

  // Expose diagnostics for capture scripts / honest FPS reporting.
  window.__DOFA_ARENA3D__ = {
    version: "0.1.0-spike",
    engine: "babylon.js",
    slice: SLICE,
    getStats: () => ({
      fps: state.lastFps,
      meshes: scene.meshes.length,
      materials: scene.materials.length,
      vertices: scene.getTotalVertices(),
      usedGltfFloor: state.room.usedGltfFloor,
      skeletonBones: state.hero.skeleton?.bones?.length ?? 0,
      strongRootsLocked: state.hero.strongRootsMesh?.scaling?.x === 1,
      placeholderHead: Boolean(state.hero.placeholderHead),
      orbitMode,
      hp: state.hp,
      enemiesAlive: state.enemies.filter((e) => e.alive).length,
      jsHeapMB: performance.memory
        ? Math.round(performance.memory.usedJSHeapSize / (1024 * 1024))
        : null,
    }),
    screenshot: async () => {
      const data = await engine.createScreenshotAsync(scene.activeCamera, {
        precision: 1,
        width: 720,
        height: 1280,
      });
      return data;
    },
    setOrbit: toggleOrbit,
    setOrbitPose: ({ alpha = 0.85, beta = 0.95, radius = 12 } = {}) => {
      if (!orbitMode) toggleOrbit(true);
      orbitCamera.alpha = alpha;
      orbitCamera.beta = beta;
      orbitCamera.radius = radius;
      if (state.hero?.root) {
        orbitCamera.setTarget(state.hero.root.position.clone());
      }
    },
    resetHeroPose: () => {
      if (!state.hero) return;
      state.hero.setPosition(0, 3.15);
      state.hero.setFacing(Math.PI);
    },
  };

  engine.runRenderLoop(() => {
    const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
    state.frames += 1;
    state.fpsAccum += dt;
    if (state.fpsAccum >= 0.5) {
      state.lastFps = Math.round(state.frames / state.fpsAccum);
      state.frames = 0;
      state.fpsAccum = 0;
      hud.fps.textContent = `FPS ${state.lastFps || "—"}`;
      const heap = performance.memory
        ? `${Math.round(performance.memory.usedJSHeapSize / (1024 * 1024))} MB`
        : "n/a";
      hud.mem.textContent = `MEM ${heap}`;
      hud.meshes.textContent = `MESH ${scene.meshes.length}`;
    }

    if (!state.paused && !orbitMode && state.hp > 0) {
      const input = controls.sample();
      const moved = moveToward(
        state.hero.position,
        input,
        dt,
        SLICE.heroSpeed,
        state.room.bounds,
      );
      let pos = resolveWallPush(moved.position, state.room.colliders);
      pos = {
        x: Math.max(-state.room.bounds, Math.min(state.room.bounds, pos.x)),
        z: Math.max(-state.room.bounds, Math.min(state.room.bounds, pos.z)),
      };
      state.hero.setPosition(pos.x, pos.z);
      if (moved.facing != null) state.hero.setFacing(moved.facing);

      let fired = false;
      if (input.attack && canAttack(state.attackCd)) {
        fired = true;
        state.hero.playAttack();
        syncEnemyTransforms();
        const hits = hitEnemiesInArc(
          { x: pos.x, z: pos.z, facing: state.hero.getFacing() },
          state.enemies.map((e) => ({
            id: e.id,
            x: e.x,
            z: e.z,
            radius: e.radius,
            alive: e.alive,
          })),
        );
        for (const id of hits) {
          const enemy = state.enemies.find((e) => e.id === id);
          if (!enemy || !enemy.alive) continue;
          Object.assign(enemy, damageEnemy(enemy, SLICE.attackDamage));
          enemy.root.scaling.setAll(enemy.alive ? 1 : 0.01);
          if (!enemy.alive) enemy.root.setEnabled(false);
        }
      }
      state.attackCd = applyAttackCooldown(state.attackCd, dt, fired);
      state.hero.update(dt, moved.moving);

      // Enemy AI
      syncEnemyTransforms();
      for (const enemy of state.enemies) {
        if (!enemy.alive) continue;
        if (enemy.pattern === "chase" || enemy.pattern === "flank") {
          const dx = pos.x - enemy.x;
          const dz = pos.z - enemy.z;
          const len = Math.hypot(dx, dz) || 1;
          const speed = enemy.pattern === "chase" ? 1.6 : 1.25;
          const side = enemy.pattern === "flank" ? 0.55 : 0;
          enemy.root.position.x += ((dx / len) + side * (-dz / len)) * speed * dt;
          enemy.root.position.z += ((dz / len) + side * (dx / len)) * speed * dt;
          enemy.root.rotation.y = Math.atan2(dx, dz);
          if (len < enemy.radius + 0.4) {
            state.hp = damageHero(state.hp, enemy.contact * dt);
          }
        }
        if (enemy.pattern === "turret") {
          enemy.shootTimer -= dt;
          if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 2.1;
            spawnTurretShot(enemy);
          }
        }
      }

      for (const tg of state.telegraphs) {
        const next = stepTelegraph(tg, dt);
        Object.assign(tg, next);
        if (tg.fired && !tg._spawned) {
          tg._spawned = true;
          const owner = state.enemies.find((e) => e.id === tg.ownerId);
          if (owner?.alive) {
            const proj = createSeedProjectile(
              scene,
              owner.root.position.add(new Vector3(0, 0.9, 0)),
              new Vector3(pos.x, 0.9, pos.z),
            );
            state.projectiles.push(proj);
          }
        }
        if (tg.done && tg.mesh) {
          tg.mesh.dispose();
          tg.mesh = null;
        }
      }
      state.telegraphs = state.telegraphs.filter((tg) => !tg.done);

      for (const proj of state.projectiles) {
        if (!proj.alive) continue;
        proj.root.position.addInPlace(proj.dir.scale(proj.speed * dt));
        proj.life -= dt;
        const d = Math.hypot(proj.root.position.x - pos.x, proj.root.position.z - pos.z);
        if (d < 0.4 + proj.radius) {
          state.hp = damageHero(state.hp, proj.damage);
          proj.alive = false;
        }
        if (proj.life <= 0) proj.alive = false;
        if (!proj.alive) proj.root.dispose();
      }
      state.projectiles = state.projectiles.filter((p) => p.alive);

      // Keep Archero framing: camera south of hero, look slightly ahead toward enemy pack.
      actionCamera.setTarget(new Vector3(pos.x, 0.15, pos.z - 2.6));
      actionCamera.alpha = 0;
      actionCamera.beta = 0.4;
      actionCamera.radius = 17.5;
      updateHud();
    }

    scene.render();
  });

  window.addEventListener("resize", () => engine.resize());
}

boot().catch((error) => {
  console.error(error);
  const banner = document.getElementById("placeholder-banner");
  if (banner) {
    banner.textContent = `3D boot failed: ${error.message}`;
  }
});
