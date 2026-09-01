import { MeshBuilder, TransformNode, Vector3 } from "@babylonjs/core";

function glowEyes(scene, materials, parent, y, z, spread) {
  for (const side of [-1, 1]) {
    const eye = MeshBuilder.CreateSphere(`eye-${parent.name}-${side}`, { diameter: 0.07, segments: 6 }, scene);
    eye.position = new Vector3(side * spread, y, z);
    eye.material = materials.eyeGlow;
    eye.parent = parent;
  }
}

export function createRazorMantis(scene, materials) {
  const root = new TransformNode("razor-mantis-elite", scene);
  const thorax = MeshBuilder.CreateCapsule("mantis-thorax", { height: 0.7, radius: 0.18, tessellation: 8 }, scene);
  thorax.rotation.x = Math.PI / 2;
  thorax.position.y = 0.55;
  thorax.material = materials.chitin;
  thorax.parent = root;
  const abdomen = MeshBuilder.CreateSphere("mantis-abdomen", { diameter: 0.42, segments: 8 }, scene);
  abdomen.position = new Vector3(0, 0.48, -0.38);
  abdomen.scaling.z = 1.4;
  abdomen.material = materials.chitin;
  abdomen.parent = root;
  const head = MeshBuilder.CreateSphere("mantis-head", { diameter: 0.28, segments: 8 }, scene);
  head.position = new Vector3(0, 0.72, 0.38);
  head.material = materials.chitin;
  head.parent = root;
  glowEyes(scene, materials, head, 0.04, 0.1, 0.08);
  for (const side of [-1, 1]) {
    const scythe = MeshBuilder.CreateBox(`mantis-scythe-${side}`, { width: 0.06, height: 0.05, depth: 0.7 }, scene);
    scythe.position = new Vector3(side * 0.28, 0.82, 0.42);
    scythe.rotation.y = side * 0.35;
    scythe.rotation.x = -0.4;
    scythe.material = materials.steelEdge;
    scythe.parent = root;
    const wing = MeshBuilder.CreateBox(`mantis-wing-${side}`, { width: 0.55, height: 0.02, depth: 0.7 }, scene);
    wing.position = new Vector3(side * 0.22, 0.78, -0.05);
    wing.rotation.z = side * 0.35;
    wing.material = materials.wing;
    wing.parent = root;
    for (const rear of [0.12, -0.16]) {
      const leg = MeshBuilder.CreateCylinder(`mantis-leg-${side}-${rear}`, {
        height: 0.55,
        diameter: 0.05,
        tessellation: 5,
      }, scene);
      leg.position = new Vector3(side * 0.22, 0.28, rear);
      leg.rotation.z = side * 0.45;
      leg.material = materials.chitin;
      leg.parent = root;
    }
  }
  return root;
}

export function createSeedSpitter(scene, materials) {
  const root = new TransformNode("seed-spitter-pod", scene);
  const base = MeshBuilder.CreateCylinder("spitter-base", {
    height: 0.28,
    diameterTop: 0.28,
    diameterBottom: 0.5,
    tessellation: 10,
  }, scene);
  base.position.y = 0.14;
  base.material = materials.seedPod;
  base.parent = root;
  const bulb = MeshBuilder.CreateSphere("spitter-bulb", { diameter: 0.62, segments: 12 }, scene);
  bulb.position.y = 0.48;
  bulb.material = materials.seedPod;
  bulb.parent = root;
  const core = MeshBuilder.CreateSphere("spitter-core", { diameter: 0.28, segments: 8 }, scene);
  core.position = new Vector3(0, 0.55, 0.18);
  core.material = materials.seedCore;
  core.parent = root;
  for (const side of [-1, 1]) {
    const petal = MeshBuilder.CreateBox(`spitter-petal-${side}`, { width: 0.16, height: 0.32, depth: 0.05 }, scene);
    petal.position = new Vector3(side * 0.24, 0.62, 0.12);
    petal.rotation.z = side * -0.4;
    petal.material = materials.leaf;
    petal.parent = root;
  }
  const mouth = MeshBuilder.CreateCylinder("spitter-mouth", {
    height: 0.18,
    diameterTop: 0.12,
    diameterBottom: 0.2,
    tessellation: 8,
  }, scene);
  mouth.rotation.x = Math.PI / 2;
  mouth.position = new Vector3(0, 0.58, 0.32);
  mouth.material = materials.seedCore;
  mouth.parent = root;
  return root;
}

export function createRootStalker(scene, materials) {
  const root = new TransformNode("root-stalker-wood", scene);
  const body = MeshBuilder.CreateCapsule("stalker-body", { height: 0.7, radius: 0.16, tessellation: 8 }, scene);
  body.position.y = 0.55;
  body.rotation.x = 0.25;
  body.material = materials.woodCreature;
  body.parent = root;
  const head = MeshBuilder.CreateSphere("stalker-head", { diameter: 0.24, segments: 8 }, scene);
  head.position = new Vector3(0, 0.98, 0.12);
  head.material = materials.woodCreature;
  head.parent = root;
  glowEyes(scene, materials, head, 0.02, 0.1, 0.06);
  for (const side of [-1, 1]) {
    const arm = MeshBuilder.CreateBox(`stalker-arm-${side}`, { width: 0.07, height: 0.07, depth: 0.55 }, scene);
    arm.position = new Vector3(side * 0.22, 0.72, 0.22);
    arm.rotation.y = side * 0.2;
    arm.rotation.x = -0.35;
    arm.material = materials.woodCreature;
    arm.parent = root;
    const claw = MeshBuilder.CreateBox(`stalker-claw-${side}`, { width: 0.04, height: 0.16, depth: 0.04 }, scene);
    claw.position = new Vector3(side * 0.34, 0.58, 0.46);
    claw.material = materials.steel;
    claw.parent = root;
    const leg = MeshBuilder.CreateCylinder(`stalker-leg-${side}`, {
      height: 0.5,
      diameterTop: 0.12,
      diameterBottom: 0.08,
      tessellation: 6,
    }, scene);
    leg.position = new Vector3(side * 0.1, 0.25, -0.02);
    leg.material = materials.woodCreature;
    leg.parent = root;
    const horn = MeshBuilder.CreateCylinder(`stalker-horn-${side}`, {
      height: 0.28,
      diameterTop: 0.02,
      diameterBottom: 0.06,
      tessellation: 5,
    }, scene);
    horn.position = new Vector3(side * 0.08, 1.14, -0.02);
    horn.rotation.z = side * 0.35;
    horn.material = materials.woodCreature;
    horn.parent = root;
  }
  return root;
}

export function createEnemyActors(scene, materials) {
  return {
    "razor-mantis": createRazorMantis(scene, materials),
    "seed-spitter-west": createSeedSpitter(scene, materials),
    "seed-spitter-east": createSeedSpitter(scene, materials),
    "root-stalker-west": createRootStalker(scene, materials),
    "root-stalker-east": createRootStalker(scene, materials),
  };
}

export function syncEnemies(actors, world) {
  for (const enemy of world.enemies) {
    const actor = actors[enemy.id];
    if (!actor) {
      continue;
    }
    actor.setEnabled(enemy.alive);
    actor.position.x = enemy.x;
    actor.position.z = enemy.z;
    actor.rotation.y = Math.atan2(enemy.facingX, enemy.facingZ);
    const breathe = 1 + Math.sin(world.time * 3 + enemy.x) * 0.03;
    actor.scaling.y = enemy.alive ? breathe : 0.2;
  }
}
