import { Color4, Engine, Scene, ShadowGenerator } from "@babylonjs/core";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent.js";
import "@babylonjs/core/Rendering/boundingBoxRenderer.js";
import { GAME_NAME, HERO_IDENTITY, SLICE_LOOT_POLICY, TOUR } from "./identity.js";
import { sliceText, normalizeSliceLocale } from "./i18n.js";
import { attachJoystick } from "./input.js";
import { applyInput, createSliceWorld, snapshotSlice, stepSlice } from "./sim/slice.js";
import { createMaterials, createLocalEnvTexture } from "./render/materials.js";
import { createRootfallRoom } from "./render/room.js";
import { createHoneyBadger, syncHoneyBadger } from "./render/hero.js";
import { createEnemyActors, syncEnemies } from "./render/enemies.js";
import { createCombatFx } from "./render/fx.js";
import { createSliceCamera, disableOrbitProof, enableOrbitProof, syncCombatCamera } from "./render/camera.js";

function $(id) {
  return document.getElementById(id);
}

function bindHud(locale) {
  $("game-name").textContent = sliceText(locale, "game");
  $("tour-line").textContent = sliceText(locale, "tourLine");
  $("room-counter").textContent = `${String(TOUR.room).padStart(2, "0")} / ${TOUR.roomTotal}`;
  $("hero-name").textContent = HERO_IDENTITY.name;
  $("hero-weapon").textContent = HERO_IDENTITY.weaponPrimary;
  $("pause-button").setAttribute("aria-label", sliceText(locale, "pause"));
  $("attack-button").setAttribute("aria-label", sliceText(locale, "attack"));
  $("placeholder-banner").textContent = sliceText(locale, "placeholderHead");
  $("pause-title").textContent = sliceText(locale, "pausedTitle");
  $("resume-button").textContent = sliceText(locale, "resume");
  $("orbit-button").textContent = sliceText(locale, "orbit");
  $("combat-cam-button").textContent = sliceText(locale, "combatCamera");
  $("back-2d-button").textContent = sliceText(locale, "back2d");
  $("pause-loot").textContent = sliceText(locale, "loot");
  $("pause-antagonist").textContent = sliceText(locale, "antagonist");
  $("pause-site").textContent = sliceText(locale, "site");
  $("status-line").textContent = sliceText(locale, "hint");
}

function syncHealth(world) {
  const ratio = world.player.hp / world.player.maxHp;
  $("health-fill").style.width = `${Math.max(0, ratio) * 100}%`;
  $("health-text").textContent = `${Math.round(world.player.hp)} / ${world.player.maxHp}`;
  $("progress-fill").style.width = `${(TOUR.room / TOUR.roomTotal) * 100}%`;
}

export async function bootArena3d(canvas) {
  const locale = normalizeSliceLocale(localStorage.getItem("dofa-arena3d-locale") || navigator.language);
  bindHud(locale);
  $("locale-select").value = locale;

  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    adaptToDeviceRatio: true,
    powerPreference: "high-performance",
  }, true);
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.015, 0.02, 0.018, 1);
  scene.environmentTexture = createLocalEnvTexture(scene);
  scene.environmentIntensity = 0.32;

  const materials = createMaterials(scene);
  const room = createRootfallRoom(scene, materials);
  const hero = createHoneyBadger(scene, materials);
  const enemies = createEnemyActors(scene, materials);
  const fx = createCombatFx(scene, materials);
  const camera = createSliceCamera(scene, canvas);
  try {
    const shadows = new ShadowGenerator(1024, room.keyLight);
    shadows.useBlurExponentialShadowMap = true;
    shadows.blurKernel = 8;
    for (const mesh of hero.root.getChildMeshes()) {
      shadows.addShadowCaster(mesh);
    }
    for (const actor of Object.values(enemies)) {
      for (const mesh of actor.getChildMeshes()) {
        shadows.addShadowCaster(mesh);
      }
    }
  } catch {
    // Shadows are a quality extra; the slice stays playable without them.
  }

  const world = createSliceWorld();
  const input = { moveX: 0, moveZ: 0, attack: false };
  attachJoystick(document, (next) => {
    if (typeof next.moveX === "number") {
      input.moveX = next.moveX;
      input.moveZ = next.moveZ;
    }
    if (next.attack) {
      input.attack = true;
    }
  });
  $("attack-button").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    input.attack = true;
  });

  const pauseLayer = $("pause-layer");
  const setPaused = (paused) => {
    world.paused = paused;
    pauseLayer.hidden = !paused;
  };
  $("pause-button").addEventListener("click", () => setPaused(!world.paused));
  $("resume-button").addEventListener("click", () => setPaused(false));
  $("orbit-button").addEventListener("click", () => {
    world.cameraMode = "orbit";
    enableOrbitProof(camera, canvas);
  });
  $("combat-cam-button").addEventListener("click", () => {
    world.cameraMode = "combat";
    disableOrbitProof(camera, canvas);
  });
  $("locale-select").addEventListener("change", (event) => {
    const next = normalizeSliceLocale(event.target.value);
    localStorage.setItem("dofa-arena3d-locale", next);
    bindHud(next);
  });

  if (new URLSearchParams(location.search).get("orbit") === "1") {
    world.cameraMode = "orbit";
    enableOrbitProof(camera, canvas);
    setPaused(true);
  }

  let frames = 0;
  let fpsWindow = performance.now();
  let fps = 0;
  let accumulator = 0;
  engine.runRenderLoop(() => {
    applyInput(world, input);
    const frameDt = Math.min(0.05, (engine.getDeltaTime() || 16.6) / 1000);
    accumulator += frameDt;
    while (accumulator >= 1 / 60) {
      stepSlice(world, 1 / 60);
      accumulator -= 1 / 60;
    }
    input.attack = false;
    syncHoneyBadger(hero, world, frameDt);
    syncEnemies(enemies, world);
    fx.sync(world);
    if (world.cameraMode === "combat") {
      syncCombatCamera(camera, world);
    }
    syncHealth(world);
    if (world.cleared) {
      $("status-line").textContent = sliceText($("locale-select").value, "cleared");
    } else if (world.defeated) {
      $("status-line").textContent = sliceText($("locale-select").value, "defeated");
    }
    scene.render();
    frames += 1;
    const now = performance.now();
    if (now - fpsWindow >= 500) {
      fps = Math.round((frames * 1000) / (now - fpsWindow));
      frames = 0;
      fpsWindow = now;
      const heap = performance.memory ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB` : "n/a";
      $("perf-line").textContent = `${fps} FPS · ${heap} · ${scene.getActiveMeshes().length} meshes`;
    }
  });
  window.addEventListener("resize", () => engine.resize());
  window.__DOFA_SLICE__ = {
    game: GAME_NAME,
    tour: TOUR,
    identity: HERO_IDENTITY,
    loot: SLICE_LOOT_POLICY,
    snapshot: () => snapshotSlice(world),
    engine,
    scene,
    world,
    getFps: () => fps,
  };
  window.__DOFA_SLICE_READY__ = true;
  return window.__DOFA_SLICE__;
}

const canvas = document.getElementById("arena3d");
if (canvas) {
  bootArena3d(canvas).catch((error) => {
    document.getElementById("status-line").textContent = error.message;
    console.error(error);
  });
}
