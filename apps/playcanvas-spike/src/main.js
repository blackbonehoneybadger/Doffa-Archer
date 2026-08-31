import {
  ADDRESS_CLAMP_TO_EDGE,
  Application,
  BLEND_ADDITIVE,
  BLEND_NORMAL,
  Color,
  CULLFACE_NONE,
  Entity,
  FILLMODE_FILL_WINDOW,
  GAMMA_SRGB,
  PROJECTION_ORTHOGRAPHIC,
  RESOLUTION_AUTO,
  StandardMaterial,
  TONEMAP_ACES,
  Vec2,
  Vec3,
} from "playcanvas";

import honeyMotionUrl from "../../../assets/heroes/honey-badger-full-motion-v3.png?url";
import honeyPortraitUrl from "../../../assets/heroes/portraits/honey-badger-portrait-v1.png?url";
import pressureWidowMotionUrl from "../../../assets/enemies/pressure-widow-motion-v1.png?url";
import {
  getHeroAtlasFrame,
  getHeroAtlasUv,
  getHeroDirection,
} from "./hero-animation.js";
import {
  createVolleyDirections,
  getWeaponProfile,
} from "./combat-profile.js";
import {
  createMobileQualityProfile,
  resolveActorPosition,
  ROOM_BOUNDS,
  ROOM_OBSTACLES,
} from "./room-layout.js";

const canvas = document.querySelector("#doffa-3d");
const loading = document.querySelector("#loading");
const healthFill = document.querySelector("#health-fill");
const healthLabel = document.querySelector("#health-label");
const statusPill = document.querySelector("#status-pill");
const performancePill = document.querySelector("#performance-pill");
const joystick = document.querySelector("#joystick");
const joystickKnob = joystick.querySelector("i");
const resetButton = document.querySelector("#reset-room");
const backButton = document.querySelector("#back-link");
const portrait = document.querySelector("#hero-portrait");
const weaponButtons = [...document.querySelectorAll("[data-weapon]")];
const attackIcon = document.querySelector("#attack-icon");
const attackLabel = document.querySelector("#attack-label");

portrait.src = honeyPortraitUrl;

const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
const quality = createMobileQualityProfile({
  deviceMemory: navigator.deviceMemory ?? 4,
  devicePixelRatio: window.devicePixelRatio,
  reducedMotion,
});

const app = new Application(canvas, {
  graphicsDeviceOptions: {
    alpha: false,
    antialias: quality.tier !== "low",
    powerPreference: "high-performance",
  },
});
app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);
app.graphicsDevice.maxPixelRatio = quality.maxPixelRatio;
app.scene.ambientLight = new Color(0.17, 0.105, 0.055);
app.scene.gammaCorrection = GAMMA_SRGB;
app.scene.toneMapping = TONEMAP_ACES;

function material({
  diffuse = [0.25, 0.25, 0.25],
  emissive = [0, 0, 0],
  emissiveIntensity = 1,
  metalness = 0,
  gloss = 0.4,
  opacity = 1,
  blendType = null,
} = {}) {
  const result = new StandardMaterial();
  result.diffuse = new Color(...diffuse);
  result.emissive = new Color(...emissive);
  result.emissiveIntensity = emissiveIntensity;
  result.metalness = metalness;
  result.gloss = gloss;
  result.opacity = opacity;
  if (blendType !== null || opacity < 1) {
    result.blendType = blendType ?? BLEND_NORMAL;
    result.depthWrite = opacity >= 0.98;
  }
  result.update();
  return result;
}

const materials = {
  floor: material({ diffuse: [0.115, 0.085, 0.06], metalness: 0.15, gloss: 0.36 }),
  floorInset: material({ diffuse: [0.045, 0.04, 0.036], metalness: 0.52, gloss: 0.55 }),
  wall: material({ diffuse: [0.095, 0.07, 0.052], metalness: 0.7, gloss: 0.46 }),
  brass: material({ diffuse: [0.42, 0.22, 0.07], metalness: 0.88, gloss: 0.64 }),
  iron: material({ diffuse: [0.08, 0.075, 0.07], metalness: 0.82, gloss: 0.58 }),
  crate: material({ diffuse: [0.24, 0.105, 0.035], metalness: 0.18, gloss: 0.28 }),
  lava: material({ diffuse: [0.4, 0.055, 0.006], emissive: [1, 0.13, 0.01], emissiveIntensity: 4.8, gloss: 0.7 }),
  ember: material({ diffuse: [0.8, 0.17, 0.015], emissive: [1, 0.1, 0.005], emissiveIntensity: 5, blendType: BLEND_ADDITIVE }),
  shadow: material({ diffuse: [0.005, 0.004, 0.003], opacity: 0.46 }),
  enemy: material({ diffuse: [0.11, 0.08, 0.065], metalness: 0.88, gloss: 0.72 }),
  enemyCore: material({ diffuse: [0.5, 0.015, 0.005], emissive: [1, 0.015, 0.005], emissiveIntensity: 5.5 }),
  warning: material({ diffuse: [0.5, 0.015, 0.005], emissive: [1, 0.01, 0.005], emissiveIntensity: 4.5, opacity: 0.68, blendType: BLEND_ADDITIVE }),
  exit: material({ diffuse: [0.17, 0.45, 0.1], emissive: [0.03, 1, 0.03], emissiveIntensity: 3.3 }),
  shuriken: material({ diffuse: [0.55, 0.62, 0.66], emissive: [0.25, 0.5, 0.62], emissiveIntensity: 2.5, metalness: 0.96, gloss: 0.88 }),
};

function primitive(name, type, position, scale, primitiveMaterial, parent = app.root) {
  const entity = new Entity(name);
  entity.addComponent("render", { type });
  entity.setPosition(position[0], position[1], position[2]);
  entity.setLocalScale(scale[0], scale[1], scale[2]);
  entity.render.material = primitiveMaterial;
  entity.render.castShadows = true;
  entity.render.receiveShadows = true;
  parent.addChild(entity);
  return entity;
}

function addBand(parent, y, scale = 1) {
  const band = primitive("brass-band", "cylinder", [0, y, 0], [1.07 * scale, 0.12, 1.07 * scale], materials.brass, parent);
  band.setLocalEulerAngles(0, 0, 0);
  return band;
}

function createBoiler(name, x, z, scale = 1) {
  const root = new Entity(name);
  root.setPosition(x, 0, z);
  app.root.addChild(root);
  primitive("boiler-body", "cylinder", [0, 0.72 * scale, 0], [0.92 * scale, 1.44 * scale, 0.92 * scale], materials.iron, root);
  primitive("boiler-top", "sphere", [0, 1.43 * scale, 0], [0.88 * scale, 0.42 * scale, 0.88 * scale], materials.iron, root);
  addBand(root, 0.35 * scale, scale);
  addBand(root, 1.12 * scale, scale);
  primitive("gauge", "cylinder", [0, 0.92 * scale, -0.48 * scale], [0.24 * scale, 0.08, 0.24 * scale], materials.brass, root).setLocalEulerAngles(90, 0, 0);
  return root;
}

function createCrate(name, x, z) {
  const root = primitive(name, "box", [x, 0.58, z], [1.38, 1.16, 1.38], materials.crate);
  primitive("crate-band-a", "box", [0, 0, 0], [1.46, 0.15, 1.46], materials.brass, root);
  primitive("crate-band-b", "box", [0, 0, 0], [0.15, 1.23, 1.46], materials.brass, root);
  return root;
}

function buildRoom() {
  primitive("foundation", "box", [0, -0.3, 0], [9.25, 0.6, 15.4], materials.floor);
  primitive("floor-inset", "box", [0, 0.015, 0], [7.65, 0.035, 13.65], materials.floorInset);
  primitive("left-wall", "box", [-4.48, 0.82, 0], [0.7, 1.64, 15.35], materials.wall);
  primitive("right-wall", "box", [4.48, 0.82, 0], [0.7, 1.64, 15.35], materials.wall);
  primitive("bottom-wall", "box", [0, 0.82, 7.35], [9.25, 1.64, 0.7], materials.wall);
  primitive("top-left-wall", "box", [-2.85, 0.82, -7.35], [3.55, 1.64, 0.7], materials.wall);
  primitive("top-right-wall", "box", [2.85, 0.82, -7.35], [3.55, 1.64, 0.7], materials.wall);

  primitive("left-lava", "box", [-3.57, 0.06, 0], [0.42, 0.08, 11.9], materials.lava);
  primitive("right-lava", "box", [3.57, 0.06, 0], [0.42, 0.08, 11.9], materials.lava);

  for (let z = -5.9; z <= 5.9; z += 1.48) {
    primitive(`floor-rib-left-${z}`, "box", [-2.88, 0.07, z], [0.65, 0.045, 0.08], materials.brass);
    primitive(`floor-rib-right-${z}`, "box", [2.88, 0.07, z], [0.65, 0.045, 0.08], materials.brass);
  }

  for (const x of [-4.18, 4.18]) {
    for (const z of [-5.4, -1.8, 1.8, 5.4]) {
      const pipe = primitive(`pipe-${x}-${z}`, "cylinder", [x, 1.32, z], [0.22, 1.35, 0.22], materials.brass);
      pipe.setLocalEulerAngles(0, 0, 0);
      addBand(pipe, -0.35, 1);
      addBand(pipe, 0.35, 1);
    }
  }

  createCrate("left-crate", -2.2, 1.1);
  createCrate("right-crate", 2.15, 0.15);
  createBoiler("center-boiler", 0, -1.55, 0.9);
}

buildRoom();

const camera = new Entity("camera");
camera.addComponent("camera", {
  projection: PROJECTION_ORTHOGRAPHIC,
  orthoHeight: 8.45,
  clearColor: new Color(0.012, 0.009, 0.006),
  nearClip: 0.1,
  farClip: 100,
});
camera.setPosition(8.7, 15.2, 15.8);
camera.lookAt(0, 0, -0.35);
app.root.addChild(camera);

const keyLight = new Entity("key-light");
keyLight.addComponent("light", {
  type: "directional",
  color: new Color(1, 0.57, 0.25),
  intensity: 2.1,
  castShadows: quality.tier !== "low",
  shadowResolution: quality.shadowResolution,
  shadowDistance: 28,
  normalOffsetBias: 0.05,
});
keyLight.setEulerAngles(48, 32, 0);
app.root.addChild(keyLight);

for (const [name, x, z, color] of [
  ["left-fire", -3.45, -2.8, new Color(1, 0.11, 0.015)],
  ["right-fire", 3.45, 2.6, new Color(1, 0.22, 0.025)],
]) {
  const light = new Entity(name);
  light.addComponent("light", {
    type: "omni",
    color,
    intensity: quality.tier === "low" ? 1.2 : 2.1,
    range: 6.5,
    castShadows: false,
  });
  light.setPosition(x, 0.75, z);
  app.root.addChild(light);
}

const exitDoor = primitive("exit-door", "box", [0, 1.15, -7.37], [2.4, 2.3, 0.42], materials.iron);
const exitGlow = primitive("exit-glow", "box", [0, 0.045, -6.85], [2.1, 0.04, 0.74], materials.exit);
exitGlow.enabled = false;

const heroRoot = new Entity("honey-badger");
heroRoot.setPosition(0, 0.08, 4.75);
app.root.addChild(heroRoot);
primitive("hero-shadow", "cylinder", [0, -0.01, 0], [0.78, 0.025, 0.58], materials.shadow, heroRoot).render.castShadows = false;
const heroRing = primitive("hero-ring", "cylinder", [0, 0.002, 0], [0.88, 0.018, 0.68], materials.brass, heroRoot);
heroRing.render.castShadows = false;

let heroPlane = null;
let heroMaterial = null;
let heroFrameKey = "";
let heroFacing = "north";

function applyHeroAnimation(state, animationClock) {
  if (!heroMaterial) return;
  const frame = getHeroAtlasFrame({ state, direction: heroFacing, animationClock });
  const frameKey = `${frame.row}:${frame.column}`;
  if (frameKey === heroFrameKey) return;
  const uv = getHeroAtlasUv(frame);
  heroMaterial.diffuseMapTiling.set(uv.scaleX, uv.scaleY);
  heroMaterial.diffuseMapOffset.set(uv.offsetX, uv.offsetY);
  heroMaterial.opacityMapTiling.set(uv.scaleX, uv.scaleY);
  heroMaterial.opacityMapOffset.set(uv.offsetX, uv.offsetY);
  heroMaterial.update();
  heroFrameKey = frameKey;
}

function createAtlasMaterial(texture) {
  const atlasMaterial = new StandardMaterial();
  atlasMaterial.diffuseMap = texture;
  atlasMaterial.opacityMap = texture;
  atlasMaterial.opacityMapChannel = "a";
  atlasMaterial.alphaTest = 0.05;
  atlasMaterial.blendType = BLEND_NORMAL;
  atlasMaterial.depthWrite = false;
  atlasMaterial.cull = CULLFACE_NONE;
  atlasMaterial.diffuseMapTiling = new Vec2(0.25, 1 / 6);
  atlasMaterial.diffuseMapOffset = new Vec2(0.5, 5 / 6);
  atlasMaterial.opacityMapTiling = new Vec2(0.25, 1 / 6);
  atlasMaterial.opacityMapOffset = new Vec2(0.5, 5 / 6);
  atlasMaterial.update();
  return atlasMaterial;
}

app.assets.loadFromUrl(honeyMotionUrl, "texture", (error, asset) => {
  if (error || !asset?.resource) {
    statusPill.textContent = "НЕ УДАЛОСЬ ЗАГРУЗИТЬ HERO ART";
    return;
  }
  asset.resource.addressU = ADDRESS_CLAMP_TO_EDGE;
  asset.resource.addressV = ADDRESS_CLAMP_TO_EDGE;
  heroMaterial = createAtlasMaterial(asset.resource);
  heroMaterial.useMetalness = true;
  heroMaterial.metalness = 0.05;
  heroMaterial.gloss = 0.42;
  heroMaterial.update();
  heroPlane = primitive("identity-locked-honey-art", "plane", [0, 0.07, 0], [1.48, 1, 2.28], heroMaterial, heroRoot);
  heroPlane.render.castShadows = true;
  applyHeroAnimation("idle", 0);
  loading.classList.add("is-hidden");
  statusPill.textContent = "ДВИГАЙСЯ · ОСТАНОВИСЬ ДЛЯ АТАКИ";
});

let enemyArtMaterial = null;

function attachEnemyArt(subject) {
  if (!enemyArtMaterial || subject.plane) return;
  subject.fallback.enabled = false;
  subject.plane = primitive("pressure-widow-art", "plane", [0, -0.18, 0], [1.72, 1, 2.45], enemyArtMaterial, subject.root);
  subject.plane.render.castShadows = true;
  subject.frameKey = "";
}

function applyEnemyAnimation(subject, state, animationClock) {
  if (!enemyArtMaterial || !subject.plane) return;
  const frame = getHeroAtlasFrame({ state, direction: subject.facing, animationClock });
  const frameKey = `${frame.row}:${frame.column}`;
  if (frameKey === subject.frameKey) return;
  const uv = getHeroAtlasUv(frame);
  enemyArtMaterial.diffuseMapTiling.set(uv.scaleX, uv.scaleY);
  enemyArtMaterial.diffuseMapOffset.set(uv.offsetX, uv.offsetY);
  enemyArtMaterial.opacityMapTiling.set(uv.scaleX, uv.scaleY);
  enemyArtMaterial.opacityMapOffset.set(uv.offsetX, uv.offsetY);
  enemyArtMaterial.update();
  subject.frameKey = frameKey;
}

function createEnemy() {
  const root = new Entity("pressure-widow");
  root.setPosition(0.35, 0.28, -4.15);
  app.root.addChild(root);
  const fallback = new Entity("pressure-widow-fallback");
  root.addChild(fallback);
  primitive("enemy-body", "sphere", [0, 0.45, 0], [1.05, 0.72, 1.28], materials.enemy, fallback);
  primitive("enemy-core", "sphere", [0, 0.55, 0.53], [0.3, 0.3, 0.16], materials.enemyCore, fallback);
  for (const side of [-1, 1]) {
    for (const z of [-0.36, 0, 0.36]) {
      const leg = primitive(`leg-${side}-${z}`, "cylinder", [side * 0.61, 0.25, z], [0.09, 0.48, 0.09], materials.brass, fallback);
      leg.setLocalEulerAngles(0, 0, side * 58);
    }
  }
  const warning = primitive("attack-warning", "cylinder", [0, -0.24, 0], [1.28, 0.015, 1.28], materials.warning, root);
  warning.enabled = false;
  const subject = {
    root,
    fallback,
    warning,
    plane: null,
    frameKey: "",
    facing: "south",
    hp: 180,
    maxHp: 180,
    cooldown: 1.35,
    telegraph: 0,
    alive: true,
  };
  attachEnemyArt(subject);
  return subject;
}

let enemy = createEnemy();
app.assets.loadFromUrl(pressureWidowMotionUrl, "texture", (error, asset) => {
  if (error || !asset?.resource) return;
  asset.resource.addressU = ADDRESS_CLAMP_TO_EDGE;
  asset.resource.addressV = ADDRESS_CLAMP_TO_EDGE;
  enemyArtMaterial = createAtlasMaterial(asset.resource);
  enemyArtMaterial.metalness = 0.08;
  enemyArtMaterial.gloss = 0.5;
  enemyArtMaterial.update();
  attachEnemyArt(enemy);
  applyEnemyAnimation(enemy, "idle", 0);
});
let heroHealth = 2450;
let attackCooldown = 0;
let attackFlash = 0;
let roomCleared = false;
let roomFinished = false;
let elapsed = 0;
let frameCounter = 0;
let fpsClock = 0;
let displayedFps = 0;
let weaponMode = "katana";
const projectiles = [];
const movement = { active: false, pointerId: null, originX: 0, originY: 0, x: 0, z: 0 };

const slash = primitive("katana-slash", "box", [0, 0.19, -0.82], [0.09, 0.08, 1.5], materials.lava, heroRoot);
slash.enabled = false;

const embers = Array.from({ length: quality.emberCount }, (_, index) => {
  const side = index % 2 === 0 ? -1 : 1;
  const ember = primitive(`ember-${index}`, "sphere", [side * 3.55, 0.18 + (index % 7) * 0.12, -6.2 + ((index * 1.77) % 12.4)], [0.035, 0.035, 0.035], materials.ember);
  ember.render.castShadows = false;
  return { entity: ember, phase: index * 0.73, side };
});

function clearProjectiles() {
  while (projectiles.length > 0) {
    projectiles.pop().root.destroy();
  }
}

function setWeaponMode(id) {
  weaponMode = getWeaponProfile(id).id;
  const profile = getWeaponProfile(weaponMode);
  for (const button of weaponButtons) {
    const selected = button.dataset.weapon === weaponMode;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
  attackIcon.textContent = weaponMode === "katana" ? "刀" : "✦";
  attackLabel.textContent = `${profile.label} · АВТО`;
  statusPill.textContent = weaponMode === "katana" ? "КАТАНА ВЫБРАНА" : "СЮРИКЕНЫ ВЫБРАНЫ";
}

function damageEnemy(amount, weaponLabel) {
  if (!enemy.alive) return;
  enemy.hp = Math.max(0, enemy.hp - amount);
  statusPill.textContent = `${weaponLabel} · ${enemy.hp} HP`;
  if (enemy.hp > 0) return;
  enemy.alive = false;
  enemy.warning.enabled = false;
  enemy.root.enabled = false;
  roomCleared = true;
  exitGlow.enabled = true;
  statusPill.textContent = "КОМНАТА ЗАЧИЩЕНА · ИДИ К ВЫХОДУ";
}

function spawnShurikenVolley(dx, dz) {
  const profile = getWeaponProfile("shuriken");
  const origin = heroRoot.getPosition();
  for (const direction of createVolleyDirections(dx, dz, profile.spread)) {
    const root = new Entity("honey-shuriken");
    root.setPosition(origin.x, 0.22, origin.z);
    app.root.addChild(root);
    primitive("blade-a", "box", [0, 0, 0], [0.34, 0.045, 0.08], materials.shuriken, root);
    primitive("blade-b", "box", [0, 0, 0], [0.08, 0.045, 0.34], materials.shuriken, root);
    projectiles.push({
      root,
      x: origin.x,
      z: origin.z,
      vx: direction.x * profile.projectileSpeed,
      vz: direction.z * profile.projectileSpeed,
      damage: profile.damage,
      lifetime: profile.projectileLifetime,
      bounces: 1,
    });
  }
}

function setHeroHealth(value) {
  heroHealth = Math.max(0, Math.min(2450, value));
  healthFill.style.width = `${(heroHealth / 2450) * 100}%`;
  healthLabel.textContent = `${Math.ceil(heroHealth)} / 2450`;
}

for (const button of weaponButtons) {
  button.addEventListener("pointerdown", (event) => event.stopPropagation());
  button.addEventListener("click", () => setWeaponMode(button.dataset.weapon));
}
setWeaponMode("katana");

function setMovementFromPointer(clientX, clientY) {
  const dx = clientX - movement.originX;
  const dy = clientY - movement.originY;
  const length = Math.hypot(dx, dy);
  const bounded = Math.min(32, length);
  const nx = length > 2 ? dx / length : 0;
  const ny = length > 2 ? dy / length : 0;
  movement.x = nx * Math.min(1, length / 22);
  movement.z = ny * Math.min(1, length / 22);
  joystickKnob.style.setProperty("--stick-x", `${nx * bounded}px`);
  joystickKnob.style.setProperty("--stick-y", `${ny * bounded}px`);
}

canvas.addEventListener("pointerdown", (event) => {
  if (movement.active || roomFinished) return;
  movement.active = true;
  movement.pointerId = event.pointerId;
  movement.originX = event.clientX;
  movement.originY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
  setMovementFromPointer(event.clientX, event.clientY);
});
canvas.addEventListener("pointermove", (event) => {
  if (!movement.active || event.pointerId !== movement.pointerId) return;
  setMovementFromPointer(event.clientX, event.clientY);
});
function releasePointer(event) {
  if (!movement.active || (event && event.pointerId !== movement.pointerId)) return;
  movement.active = false;
  movement.pointerId = null;
  movement.x = 0;
  movement.z = 0;
  joystickKnob.style.setProperty("--stick-x", "0px");
  joystickKnob.style.setProperty("--stick-y", "0px");
}
canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);
canvas.addEventListener("contextmenu", (event) => event.preventDefault());

function resetRoom() {
  if (enemy?.root) enemy.root.destroy();
  clearProjectiles();
  enemy = createEnemy();
  heroRoot.setPosition(0, 0.08, 4.75);
  exitDoor.setPosition(0, 1.15, -7.37);
  exitGlow.enabled = false;
  roomCleared = false;
  roomFinished = false;
  attackCooldown = 0;
  attackFlash = 0;
  heroFacing = "north";
  heroFrameKey = "";
  applyHeroAnimation("idle", 0);
  setWeaponMode("katana");
  setHeroHealth(2450);
  statusPill.textContent = "ДВИГАЙСЯ · ОСТАНОВИСЬ ДЛЯ АТАКИ";
}

resetButton.addEventListener("click", resetRoom);
backButton.addEventListener("click", () => { window.location.href = "/"; });

const scratch = new Vec3();
app.on("update", (dt) => {
  elapsed += dt;
  frameCounter += 1;
  fpsClock += dt;
  if (fpsClock >= 0.5) {
    displayedFps = Math.round(frameCounter / fpsClock);
    frameCounter = 0;
    fpsClock = 0;
    performancePill.textContent = `WEBGL2 · ${quality.tier.toUpperCase()} · ${displayedFps} FPS`;
  }

  for (const ember of embers) {
    const entity = ember.entity;
    const position = entity.getPosition();
    const y = 0.12 + ((elapsed * 0.55 + ember.phase) % 1.75);
    entity.setPosition(ember.side * (3.55 + Math.sin(elapsed + ember.phase) * 0.08), y, position.z);
    const flicker = 0.6 + Math.sin(elapsed * 7 + ember.phase) * 0.24;
    entity.setLocalScale(0.025 + flicker * 0.018, 0.025 + flicker * 0.018, 0.025 + flicker * 0.018);
  }

  if (roomFinished || heroHealth <= 0) return;

  const heroPosition = heroRoot.getPosition();
  const moving = Math.hypot(movement.x, movement.z) > 0.08;
  if (moving) {
    const next = resolveActorPosition({
      x: heroPosition.x + movement.x * 3.25 * dt,
      z: heroPosition.z + movement.z * 3.25 * dt,
    }, 0.48);
    heroRoot.setPosition(next.x, 0.08 + Math.abs(Math.sin(elapsed * 9)) * 0.025, next.z);
    heroFacing = getHeroDirection(movement.x, movement.z, heroFacing);
  }

  attackCooldown = Math.max(0, attackCooldown - dt);
  attackFlash = Math.max(0, attackFlash - dt);
  slash.enabled = attackFlash > 0 && weaponMode === "katana";
  if (slash.enabled) {
    slash.setLocalEulerAngles(0, -55 + (1 - attackFlash / 0.16) * 110, 0);
  }

  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index];
    projectile.lifetime -= dt;
    projectile.x += projectile.vx * dt;
    projectile.z += projectile.vz * dt;

    if (projectile.x < ROOM_BOUNDS.minX || projectile.x > ROOM_BOUNDS.maxX) {
      if (projectile.bounces > 0) {
        projectile.vx *= -1;
        projectile.bounces -= 1;
        projectile.x = Math.min(ROOM_BOUNDS.maxX, Math.max(ROOM_BOUNDS.minX, projectile.x));
      } else {
        projectile.lifetime = 0;
      }
    }
    if (projectile.z < ROOM_BOUNDS.minZ || projectile.z > ROOM_BOUNDS.maxZ) {
      if (projectile.bounces > 0) {
        projectile.vz *= -1;
        projectile.bounces -= 1;
        projectile.z = Math.min(ROOM_BOUNDS.maxZ, Math.max(ROOM_BOUNDS.minZ, projectile.z));
      } else {
        projectile.lifetime = 0;
      }
    }

    projectile.root.setPosition(projectile.x, 0.22, projectile.z);
    projectile.root.rotateLocal(0, dt * 850, 0);
    if (enemy.alive) {
      const enemyPosition = enemy.root.getPosition();
      if (Math.hypot(projectile.x - enemyPosition.x, projectile.z - enemyPosition.z) < 0.72) {
        damageEnemy(projectile.damage, "СЮРИКЕН");
        projectile.lifetime = 0;
      }
    }
    if (!enemy.alive || projectile.lifetime <= 0) {
      projectile.root.destroy();
      projectiles.splice(index, 1);
    }
  }

  if (enemy.alive) {
    const enemyPosition = enemy.root.getPosition();
    const currentHeroPosition = heroRoot.getPosition();
    const dx = currentHeroPosition.x - enemyPosition.x;
    const dz = currentHeroPosition.z - enemyPosition.z;
    const distance = Math.max(0.001, Math.hypot(dx, dz));
    enemy.facing = getHeroDirection(dx, dz, enemy.facing);
    let enemyMoving = false;

    if (distance > 1.5 && enemy.telegraph <= 0) {
      enemyMoving = true;
      const next = resolveActorPosition({
        x: enemyPosition.x + (dx / distance) * 1.32 * dt,
        z: enemyPosition.z + (dz / distance) * 1.32 * dt,
      }, 0.62, ROOM_OBSTACLES.filter((obstacle) => obstacle.id !== "center-boiler"));
      enemy.root.setPosition(next.x, 0.28 + Math.abs(Math.sin(elapsed * 5)) * 0.05, next.z);
    }

    enemy.cooldown -= dt;
    if (enemy.telegraph > 0) {
      enemy.telegraph -= dt;
      enemy.warning.enabled = true;
      const pulse = 1 + Math.sin(elapsed * 19) * 0.08;
      enemy.warning.setLocalScale(1.28 * pulse, 0.015, 1.28 * pulse);
      if (enemy.telegraph <= 0) {
        enemy.warning.enabled = false;
        enemy.cooldown = 1.55;
        if (distance < 1.85) {
          setHeroHealth(heroHealth - 210);
          statusPill.textContent = heroHealth > 0 ? "УКЛОНЯЙСЯ ОТ КРАСНОГО КРУГА" : "HONEY BADGER ПОВЕРЖЕН";
        }
      }
    } else if (enemy.cooldown <= 0 && distance < 2.2) {
      enemy.telegraph = 0.72;
      statusPill.textContent = "ОПАСНОСТЬ · ОТОЙДИ";
    }

    applyEnemyAnimation(enemy, enemy.telegraph > 0 ? "attack" : enemyMoving ? "run" : "idle", elapsed);

    const weapon = getWeaponProfile(weaponMode);
    if (!moving && attackCooldown <= 0 && distance <= weapon.range) {
      attackCooldown = weapon.interval;
      attackFlash = 0.16;
      heroFacing = getHeroDirection(-dx, -dz, heroFacing);
      if (weaponMode === "katana") {
        damageEnemy(weapon.damage, weapon.label);
      } else {
        spawnShurikenVolley(-dx, -dz);
        statusPill.textContent = "СЮРИКЕНЫ · ТРОЙНОЙ ЗАЛП";
      }
    }
  }

  applyHeroAnimation(moving ? "run" : attackFlash > 0 ? "attack" : "idle", elapsed);

  if (roomCleared) {
    const doorPosition = exitDoor.getPosition();
    if (doorPosition.y > -0.25) {
      exitDoor.setPosition(0, Math.max(-0.25, doorPosition.y - dt * 2.3), -7.37);
    }
    const current = heroRoot.getPosition();
    if (current.z < ROOM_BOUNDS.minZ + 0.42 && Math.abs(current.x) < 1.25) {
      roomFinished = true;
      statusPill.textContent = "PLAYCANVAS ROOM 01 ПРОЙДЕНА";
      exitGlow.setLocalScale(2.1, 0.04, 0.74);
    }
  }

  const currentHero = heroRoot.getPosition();
  scratch.set(currentHero.x * 0.035, 0, currentHero.z * 0.018);
  camera.camera.orthoHeight = 8.45 + Math.sin(elapsed * 0.65) * 0.015;
});

window.addEventListener("resize", () => app.resizeCanvas());
document.addEventListener("visibilitychange", () => {
  app.timeScale = document.hidden ? 0 : 1;
  releasePointer();
});

window.__DOFFA_PLAYCANVAS_SPIKE__ = Object.freeze({
  version: 1,
  quality,
  reset: resetRoom,
  getState: () => ({
    heroHealth,
    enemyHealth: enemy.hp,
    roomCleared,
    roomFinished,
    fps: displayedFps,
    heroFacing,
    heroFrame: heroFrameKey,
    weaponMode,
    projectileCount: projectiles.length,
  }),
});

app.start();
