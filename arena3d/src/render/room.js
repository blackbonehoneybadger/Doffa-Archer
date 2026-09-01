import {
  Color3,
  DirectionalLight,
  GlowLayer,
  HemisphericLight,
  MeshBuilder,
  PointLight,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { createRng } from "../sim/rng.js";
import { TOUR } from "../identity.js";
import { createRoom08Obstacles } from "../sim/slice.js";

function torch(scene, materials, x, y, z, parent) {
  const pole = MeshBuilder.CreateCylinder(`torch-pole-${x}-${z}`, { height: 1.15, diameter: 0.09, tessellation: 8 }, scene);
  pole.position = new Vector3(x, y, z);
  pole.material = materials.bark;
  pole.parent = parent;
  const bowl = MeshBuilder.CreateCylinder(`torch-bowl-${x}-${z}`, { height: 0.12, diameter: 0.2, tessellation: 8 }, scene);
  bowl.position = new Vector3(x, y + 0.58, z);
  bowl.material = materials.stone;
  bowl.parent = parent;
  const flame = MeshBuilder.CreateSphere(`torch-flame-${x}-${z}`, { diameter: 0.22, segments: 8 }, scene);
  flame.position = new Vector3(x, y + 0.74, z);
  flame.scaling.y = 1.4;
  flame.material = materials.ember;
  flame.parent = parent;
  const light = new PointLight(`torch-light-${x}-${z}`, new Vector3(x, y + 0.9, z), scene);
  light.diffuse = new Color3(1, 0.55, 0.18);
  light.specular = new Color3(1, 0.4, 0.12);
  light.intensity = 18;
  light.range = 9;
  light.parent = parent;
  return { meshes: [pole, bowl, flame], light };
}

function flower(scene, materials, x, z, parent, index) {
  const stem = MeshBuilder.CreateCylinder(`flower-stem-${index}`, { height: 0.35, diameter: 0.05, tessellation: 6 }, scene);
  stem.position = new Vector3(x, 0.18, z);
  stem.material = materials.leaf;
  stem.parent = parent;
  const bloom = MeshBuilder.CreateSphere(`flower-bloom-${index}`, { diameter: 0.22, segments: 8 }, scene);
  bloom.position = new Vector3(x, 0.38, z);
  bloom.material = materials.ember;
  bloom.parent = parent;
  return [stem, bloom];
}

export function createRootfallRoom(scene, materials) {
  const rng = createRng(TOUR.seed);
  const root = new TransformNode("rootfall-room-08", scene);
  const staticMeshes = [];

  const floor = MeshBuilder.CreateGround("rootfall-floor", { width: 14.2, height: 22.2, subdivisions: 36 }, scene);
  floor.material = materials.stone;
  floor.parent = root;
  const positions = floor.getVerticesData("position");
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    positions[i + 1] = Math.sin(x * 1.7 + z * 0.9) * 0.03 + Math.sin(x * 4.2) * 0.015;
  }
  floor.updateVerticesData("position", positions);
  floor.createNormals(true);
  floor.receiveShadows = true;
  staticMeshes.push(floor);

  for (let ix = -7; ix <= 7; ix += 1) {
    for (let iz = -11; iz <= 11; iz += 1) {
      if (rng.next() < 0.62) {
        continue;
      }
      const moss = MeshBuilder.CreateBox(`moss-${ix}-${iz}`, {
        width: rng.float(0.55, 0.95),
        height: 0.04,
        depth: rng.float(0.55, 0.95),
      }, scene);
      moss.position = new Vector3(ix * 0.9 + rng.float(-0.1, 0.1), 0.045, iz * 0.92 + rng.float(-0.1, 0.1));
      moss.material = materials.moss;
      moss.parent = root;
      staticMeshes.push(moss);
    }
  }

  for (let i = 0; i < 7; i += 1) {
    const puddle = MeshBuilder.CreateDisc(`puddle-${i}`, { radius: rng.float(0.35, 0.7), tessellation: 12 }, scene);
    puddle.rotation.x = Math.PI / 2;
    puddle.position = new Vector3(rng.float(-4.5, 4.5), 0.06, rng.float(-8, 7));
    puddle.material = materials.wetStone;
    puddle.parent = root;
    staticMeshes.push(puddle);
  }

  const wallSpecs = [
    { w: 14.8, h: 4.4, d: 0.7, x: 0, y: 2.1, z: -11.1 },
    { w: 14.8, h: 4.4, d: 0.7, x: 0, y: 2.1, z: 11.1 },
    { w: 0.7, h: 4.4, d: 22.8, x: -7.1, y: 2.1, z: 0 },
    { w: 0.7, h: 4.4, d: 22.8, x: 7.1, y: 2.1, z: 0 },
  ];
  for (const [index, spec] of wallSpecs.entries()) {
    const wall = MeshBuilder.CreateBox(`wall-${index}`, { width: spec.w, height: spec.h, depth: spec.d }, scene);
    wall.position = new Vector3(spec.x, spec.y, spec.z);
    wall.material = materials.stone;
    wall.parent = root;
    wall.receiveShadows = true;
    staticMeshes.push(wall);
  }

  const arch = MeshBuilder.CreateBox("north-arch", { width: 3.2, height: 2.6, depth: 0.55 }, scene);
  arch.position = new Vector3(0, 1.4, -10.55);
  arch.material = materials.stone;
  arch.parent = root;
  staticMeshes.push(arch);

  const rootCurves = [
    [new Vector3(-6.4, 0.1, -9), new Vector3(-4.8, 0.7, -5.5), new Vector3(-5.2, 1.8, -2), new Vector3(-6.1, 3.4, 1.5)],
    [new Vector3(6.3, 0.12, -8.2), new Vector3(5.1, 0.8, -4.8), new Vector3(5.6, 2.1, -1.4), new Vector3(6.2, 3.6, 2.4)],
    [new Vector3(-2.4, 0.2, -10.4), new Vector3(-0.4, 1.1, -9.4), new Vector3(1.6, 2.2, -8.8), new Vector3(0.2, 3.3, -8)],
    [new Vector3(-6.5, 0.1, 7.5), new Vector3(-5.4, 1.1, 5.4), new Vector3(-4.8, 2.4, 3.2)],
    [new Vector3(6.5, 0.12, 8), new Vector3(5.2, 1, 5.8), new Vector3(4.9, 2.3, 3.5)],
    [new Vector3(-3.8, 0.08, 1.2), new Vector3(-2.1, 0.35, 0.2), new Vector3(-0.6, 0.12, -1.1)],
  ];
  for (const [index, path] of rootCurves.entries()) {
    const tube = MeshBuilder.CreateTube(`root-${index}`, { path, radius: 0.2 + (index % 3) * 0.05, tessellation: 7, cap: 3 }, scene);
    tube.material = materials.bark;
    tube.parent = root;
    staticMeshes.push(tube);
  }

  for (const obstacle of createRoom08Obstacles().filter((item) => item.kind === "cover")) {
    const width = obstacle.maxX - obstacle.minX;
    const depth = obstacle.maxZ - obstacle.minZ;
    const cover = MeshBuilder.CreateCylinder(`cover-${obstacle.id}`, {
      height: 1.05 + width * 0.2,
      diameterTop: Math.min(width, depth) * 0.85,
      diameterBottom: Math.max(width, depth) * 0.95,
      tessellation: 8,
    }, scene);
    cover.position = new Vector3(
      (obstacle.minX + obstacle.maxX) / 2,
      0.55,
      (obstacle.minZ + obstacle.maxZ) / 2,
    );
    cover.material = materials.bark;
    cover.parent = root;
    staticMeshes.push(cover);
  }

  for (let i = 0; i < 16; i += 1) {
    const x = rng.float(-6.2, 6.2);
    const z = rng.float(-10, 10);
    if (Math.hypot(x, z) < 2.4) {
      continue;
    }
    const cluster = MeshBuilder.CreateSphere(`leaf-${i}`, { diameter: rng.float(0.7, 1.3), segments: 7 }, scene);
    cluster.position = new Vector3(x, rng.float(1.1, 2.4), z);
    cluster.scaling.y = 0.45;
    cluster.material = materials.leaf;
    cluster.parent = root;
    staticMeshes.push(cluster);
  }

  const torchSet = [
    torch(scene, materials, -5.7, 1.1, -8.6, root),
    torch(scene, materials, 5.7, 1.1, -8.4, root),
    torch(scene, materials, -5.8, 1.1, 8.2, root),
    torch(scene, materials, 5.8, 1.1, 8.4, root),
  ];

  flower(scene, materials, -5.2, -4.4, root, 0);
  flower(scene, materials, 5.1, -3.8, root, 1);
  flower(scene, materials, -4.8, 6.4, root, 2);
  flower(scene, materials, 4.9, 6.8, root, 3);

  for (let i = 0; i < 9; i += 1) {
    const path = [
      new Vector3(rng.float(-5, 5), 0.05, rng.float(-9, 8)),
      new Vector3(rng.float(-5, 5), 0.06, rng.float(-9, 8)),
      new Vector3(rng.float(-5, 5), 0.05, rng.float(-9, 8)),
    ];
    const vein = MeshBuilder.CreateTube(`vein-${i}`, { path, radius: 0.04, tessellation: 5 }, scene);
    vein.material = materials.vein;
    vein.parent = root;
    staticMeshes.push(vein);
  }

  const hemi = new HemisphericLight("jungle-fill", new Vector3(0.15, 1, 0.25), scene);
  hemi.intensity = 0.22;
  hemi.diffuse = new Color3(0.35, 0.55, 0.32);
  hemi.groundColor = new Color3(0.05, 0.04, 0.03);

  const moon = new DirectionalLight("canopy-break", new Vector3(-0.35, -1, 0.28), scene);
  moon.position = new Vector3(4, 12, -6);
  moon.intensity = 0.55;
  moon.diffuse = new Color3(0.55, 0.72, 0.48);

  scene.fogMode = 3;
  scene.fogColor = new Color3(0.03, 0.05, 0.04);
  scene.fogStart = 8;
  scene.fogEnd = 24;
  scene.ambientColor = new Color3(0.04, 0.05, 0.04);

  const glow = new GlowLayer("rootfall-glow", scene, { blurKernelSize: 24 });
  glow.intensity = 0.65;

  return { root, staticMeshes, lights: [...torchSet.map((item) => item.light), moon, hemi], keyLight: moon };
}
