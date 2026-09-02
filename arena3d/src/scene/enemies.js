import {
  Color3,
  MeshBuilder,
  PBRMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

function mat(scene, name, albedo, extras = {}) {
  const m = new PBRMaterial(name, scene);
  m.albedoColor = albedo;
  m.metallic = extras.metallic ?? 0.05;
  m.roughness = extras.roughness ?? 0.7;
  if (extras.emissive) {
    m.emissiveColor = extras.emissive;
    m.emissiveIntensity = extras.emissiveIntensity ?? 1.4;
  }
  return m;
}

function ring(scene, parent, name, diameter, color) {
  const mesh = MeshBuilder.CreateTorus(name, {
    diameter,
    thickness: 0.05,
    tessellation: 32,
  }, scene);
  mesh.parent = parent;
  mesh.position.y = 0.04;
  mesh.material = mat(scene, `${name}Mat`, color, {
    emissive: color,
    emissiveIntensity: 1.8,
    roughness: 0.4,
  });
  return mesh;
}

function createInsectElite(scene, shadow, position) {
  const root = new TransformNode("insectElite", scene);
  root.position = position;
  const bodyMat = mat(scene, "insectBody", new Color3(0.12, 0.45, 0.18), {
    emissive: new Color3(0.05, 0.35, 0.08),
    emissiveIntensity: 0.6,
  });
  const body = MeshBuilder.CreateSphere("insectBody", { diameter: 1.05, segments: 12 }, scene);
  body.parent = root;
  body.position.y = 0.85;
  body.scaling = new Vector3(0.95, 0.65, 1.45);
  body.material = bodyMat;
  body.castShadow = true;
  if (shadow) shadow.addShadowCaster(body);

  const head = MeshBuilder.CreateSphere("insectHead", { diameter: 0.45, segments: 8 }, scene);
  head.parent = root;
  head.position = new Vector3(0, 1.05, 0.55);
  head.material = bodyMat;

  for (const side of [-1, 1]) {
    const scythe = MeshBuilder.CreateCylinder(`scythe${side}`, {
      height: 1.1,
      diameterTop: 0.04,
      diameterBottom: 0.12,
      tessellation: 6,
    }, scene);
    scythe.parent = root;
    scythe.position = new Vector3(side * 0.55, 1.0, 0.35);
    scythe.rotation.z = side * 1.1;
    scythe.rotation.x = -0.5;
    scythe.material = bodyMat;
  }

  for (let i = 0; i < 6; i += 1) {
    const leg = MeshBuilder.CreateCylinder(`insectLeg${i}`, {
      height: 0.85,
      diameter: 0.07,
      tessellation: 5,
    }, scene);
    leg.parent = root;
    const ang = (i / 6) * Math.PI * 2;
    leg.position = new Vector3(Math.cos(ang) * 0.5, 0.4, Math.sin(ang) * 0.45);
    leg.rotation.z = Math.cos(ang) * 0.75;
    leg.rotation.x = Math.sin(ang) * 0.45;
    leg.material = bodyMat;
  }

  for (const side of [-1, 1]) {
    const wing = MeshBuilder.CreatePlane(`wing${side}`, { width: 0.85, height: 0.4 }, scene);
    wing.parent = root;
    wing.position = new Vector3(side * 0.28, 1.15, -0.15);
    wing.rotation.y = side * 0.4;
    wing.material = mat(scene, `wingMat${side}`, new Color3(0.4, 0.9, 0.5), {
      emissive: new Color3(0.1, 0.4, 0.15),
      roughness: 0.35,
    });
    wing.material.alpha = 0.55;
    wing.material.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
  }

  const aura = ring(scene, root, "insectAura", 1.6, new Color3(0.15, 0.95, 0.35));
  return {
    id: "insect_elite",
    kind: "insect_elite",
    root,
    aura,
    hp: 420,
    maxHp: 420,
    radius: 0.55,
    alive: true,
    contact: 18,
    pattern: "chase",
    telegraph: null,
  };
}

function createPlantTurret(scene, shadow, position, id) {
  const root = new TransformNode(id, scene);
  root.position = position;
  const leafMat = mat(scene, `${id}Leaf`, new Color3(0.1, 0.35, 0.12));
  const podMat = mat(scene, `${id}Pod`, new Color3(0.55, 0.12, 0.14), {
    emissive: new Color3(0.45, 0.05, 0.08),
    emissiveIntensity: 0.9,
  });
  const base = MeshBuilder.CreateCylinder(`${id}Base`, {
    height: 0.5,
    diameterTop: 0.5,
    diameterBottom: 0.9,
    tessellation: 8,
  }, scene);
  base.parent = root;
  base.position.y = 0.25;
  base.material = leafMat;
  const pod = MeshBuilder.CreateSphere(`${id}Pod`, { diameter: 0.7, segments: 10 }, scene);
  pod.parent = root;
  pod.position.y = 0.85;
  pod.material = podMat;
  pod.castShadow = true;
  if (shadow) shadow.addShadowCaster(pod);
  for (let i = 0; i < 5; i += 1) {
    const frond = MeshBuilder.CreateBox(`${id}Frond${i}`, { width: 0.12, height: 0.55, depth: 0.35 }, scene);
    frond.parent = root;
    const ang = (i / 5) * Math.PI * 2;
    frond.position = new Vector3(Math.cos(ang) * 0.45, 0.4, Math.sin(ang) * 0.45);
    frond.rotation.y = ang;
    frond.rotation.z = 0.5;
    frond.material = leafMat;
  }
  const aura = ring(scene, root, `${id}Aura`, 1.3, new Color3(0.2, 0.9, 0.3));
  return {
    id,
    kind: "plant_turret",
    root,
    aura,
    hp: 260,
    maxHp: 260,
    radius: 0.5,
    alive: true,
    contact: 10,
    pattern: "turret",
    shootTimer: 1.2 + Math.random(),
    telegraph: null,
  };
}

function createWoodHumanoid(scene, shadow, position, id) {
  const root = new TransformNode(id, scene);
  root.position = position;
  const wood = mat(scene, `${id}Wood`, new Color3(0.2, 0.11, 0.05), { roughness: 0.95 });
  const glow = mat(scene, `${id}Eyes`, new Color3(0.1, 0.4, 0.1), {
    emissive: new Color3(0.2, 1, 0.25),
    emissiveIntensity: 2,
  });
  const body = MeshBuilder.CreateCapsule(`${id}Body`, {
    radius: 0.28,
    height: 1.1,
    tessellation: 8,
  }, scene);
  body.parent = root;
  body.position.y = 0.55;
  body.material = wood;
  body.castShadow = true;
  if (shadow) shadow.addShadowCaster(body);
  for (const side of [-1, 1]) {
    const arm = MeshBuilder.CreateCylinder(`${id}Arm${side}`, {
      height: 0.7,
      diameter: 0.12,
      tessellation: 5,
    }, scene);
    arm.parent = root;
    arm.position = new Vector3(side * 0.35, 0.7, 0.1);
    arm.rotation.z = side * 0.7;
    arm.material = wood;
    const eye = MeshBuilder.CreateSphere(`${id}Eye${side}`, { diameter: 0.1, segments: 4 }, scene);
    eye.parent = root;
    eye.position = new Vector3(side * 0.1, 1.05, 0.22);
    eye.material = glow;
  }
  const aura = ring(scene, root, `${id}Aura`, 1.25, new Color3(0.15, 0.85, 0.3));
  return {
    id,
    kind: "wood_humanoid",
    root,
    aura,
    hp: 300,
    maxHp: 300,
    radius: 0.45,
    alive: true,
    contact: 14,
    pattern: "flank",
    telegraph: null,
  };
}

export function createEnemySet(scene, shadow) {
  // Archero / reference layout: elite top-center, turrets mid flanks, wood units lower flanks.
  const enemies = [
    createInsectElite(scene, shadow, new Vector3(0, 0, -3.6)),
    createPlantTurret(scene, shadow, new Vector3(-2.8, 0, -1.1), "plant_turret_l"),
    createPlantTurret(scene, shadow, new Vector3(2.8, 0, -1.0), "plant_turret_r"),
    createWoodHumanoid(scene, shadow, new Vector3(-2.2, 0, 0.9), "wood_humanoid_l"),
    createWoodHumanoid(scene, shadow, new Vector3(2.2, 0, 0.8), "wood_humanoid_r"),
  ];
  return enemies;
}

export function createSeedProjectile(scene, from, to) {
  const root = new TransformNode("seed", scene);
  root.position = from.clone();
  const mesh = MeshBuilder.CreateSphere("seedMesh", { diameter: 0.22, segments: 6 }, scene);
  mesh.parent = root;
  mesh.material = mat(scene, "seedMat", new Color3(0.2, 0.9, 0.25), {
    emissive: new Color3(0.15, 0.95, 0.3),
    emissiveIntensity: 2.5,
  });
  const dir = to.subtract(from);
  const dist = dir.length();
  dir.normalize();
  return {
    root,
    dir,
    speed: 5.5,
    life: Math.min(2.2, dist / 5.5 + 0.2),
    damage: 40,
    radius: 0.18,
    alive: true,
  };
}
