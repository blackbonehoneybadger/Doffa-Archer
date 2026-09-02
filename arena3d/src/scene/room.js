import {
  Color3,
  Color4,
  DirectionalLight,
  HemisphericLight,
  MeshBuilder,
  PBRMaterial,
  PointLight,
  Scene,
  SceneLoader,
  ShadowGenerator,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

import { SLICE } from "../combatLogic.js";

function pbr(scene, name, opts = {}) {
  const mat = new PBRMaterial(name, scene);
  mat.albedoColor = opts.albedo ?? new Color3(0.2, 0.25, 0.18);
  mat.metallic = opts.metallic ?? 0.05;
  mat.roughness = opts.roughness ?? 0.72;
  if (opts.emissive) {
    mat.emissiveColor = opts.emissive;
    mat.emissiveIntensity = opts.emissiveIntensity ?? 1.2;
  }
  return mat;
}

export async function buildRootfallRoom(scene) {
  scene.clearColor = new Color4(0.01, 0.025, 0.018, 1);
  scene.ambientColor = new Color3(0.04, 0.07, 0.05);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.048;
  scene.fogColor = new Color3(0.015, 0.04, 0.025);

  const hemi = new HemisphericLight("hemi", new Vector3(0.1, 1, 0.15), scene);
  hemi.intensity = 0.22;
  hemi.groundColor = new Color3(0.02, 0.05, 0.03);

  const sun = new DirectionalLight("sun", new Vector3(-0.25, -1, 0.35), scene);
  sun.position = new Vector3(3, 14, -4);
  sun.intensity = 0.42;

  const torchL = new PointLight("torchL", new Vector3(-4.6, 2.6, 0.8), scene);
  torchL.diffuse = new Color3(1, 0.48, 0.12);
  torchL.intensity = 28;
  torchL.range = 12;

  const torchR = new PointLight("torchR", new Vector3(4.6, 2.6, 0.6), scene);
  torchR.diffuse = new Color3(1, 0.42, 0.1);
  torchR.intensity = 28;
  torchR.range = 12;

  const venomFill = new PointLight("venomFill", new Vector3(0, 3.2, -2.2), scene);
  venomFill.diffuse = new Color3(0.2, 1.0, 0.35);
  venomFill.intensity = 9;
  venomFill.range = 11;

  const shadow = new ShadowGenerator(1024, sun);
  shadow.useBlurExponentialShadowMap = true;
  shadow.blurKernel = 16;

  const stone = pbr(scene, "stone", {
    albedo: new Color3(0.045, 0.06, 0.05),
    roughness: 0.93,
    metallic: 0.02,
  });
  const moss = pbr(scene, "moss", {
    albedo: new Color3(0.04, 0.14, 0.05),
    roughness: 0.95,
    emissive: new Color3(0.05, 0.55, 0.12),
    emissiveIntensity: 1.7,
  });
  const bark = pbr(scene, "bark", {
    albedo: new Color3(0.09, 0.05, 0.03),
    roughness: 0.94,
  });
  const leaf = pbr(scene, "leaf", {
    albedo: new Color3(0.03, 0.11, 0.045),
    roughness: 0.85,
  });
  const ember = pbr(scene, "ember", {
    albedo: new Color3(0.35, 0.1, 0.02),
    emissive: new Color3(1, 0.4, 0.05),
    emissiveIntensity: 3.2,
    roughness: 0.35,
  });

  const root = new TransformNode("rootfallRoom", scene);
  const colliders = [];

  // Prefer real glTF floor tile when present; fall back to procedural grid.
  let loadedGltf = false;
  try {
    const result = await SceneLoader.ImportMeshAsync(
      "",
      "./assets/gltf/",
      "rootfall-floor-tile.gltf",
      scene,
    );
    if (result.meshes.length) {
      loadedGltf = true;
      for (let i = -5; i <= 5; i += 1) {
        for (let j = -5; j <= 5; j += 1) {
          const tile = i === 0 && j === 0
            ? result.meshes[0]
            : result.meshes[0].clone(`floor_${i}_${j}`, root);
          tile.position = new Vector3(i * 1.2, 0, j * 1.2);
          tile.receiveShadows = true;
          tile.parent = root;
          if ((i + j) % 5 === 0) {
            const vein = MeshBuilder.CreateBox(`vein_${i}_${j}`, {
              width: 1.05,
              height: 0.04,
              depth: 0.12,
            }, scene);
            vein.position = new Vector3(i * 1.2, 0.03, j * 1.2);
            vein.material = moss;
            vein.parent = root;
          }
        }
      }
    }
  } catch {
    loadedGltf = false;
  }

  if (!loadedGltf) {
    for (let i = -5; i <= 5; i += 1) {
      for (let j = -5; j <= 5; j += 1) {
        const tile = MeshBuilder.CreateBox(`floor_${i}_${j}`, {
          width: 1.15,
          height: 0.18,
          depth: 1.15,
        }, scene);
        tile.position = new Vector3(i * 1.2, -0.09, j * 1.2);
        tile.material = ((i + j) % 3 === 0) ? moss : stone;
        tile.receiveShadows = true;
        tile.parent = root;
        if ((i + j) % 4 === 0) {
          const crack = MeshBuilder.CreateBox(`crack_${i}_${j}`, {
            width: 0.9,
            height: 0.03,
            depth: 0.08,
          }, scene);
          crack.rotation.y = ((i * 17 + j * 9) % 40) * 0.05;
          crack.position = new Vector3(i * 1.2, 0.02, j * 1.2);
          crack.material = moss;
          crack.parent = root;
        }
      }
    }
  }

  const borderRoots = [
    [-6.4, 0, 0, 0],
    [6.4, 0, 0, Math.PI],
    [0, 0, -6.4, Math.PI / 2],
    [0, 0, 6.4, -Math.PI / 2],
  ];
  for (const [x, y, z, rot] of borderRoots) {
    for (let k = -3; k <= 3; k += 1) {
      const trunk = MeshBuilder.CreateCylinder(`root_${x}_${z}_${k}`, {
        height: 2.4 + Math.abs(k) * 0.2,
        diameterTop: 0.35,
        diameterBottom: 0.7,
        tessellation: 8,
      }, scene);
      trunk.material = bark;
      trunk.parent = root;
      trunk.position = new Vector3(
        x + (Math.abs(rot) < 0.1 || Math.abs(rot - Math.PI) < 0.1 ? 0 : k * 1.5),
        1.1,
        z + (Math.abs(rot) < 0.1 || Math.abs(rot - Math.PI) < 0.1 ? k * 1.5 : 0),
      );
      trunk.rotation.z = (k % 2 === 0 ? 0.15 : -0.12);
      trunk.rotation.y = rot;
      trunk.castShadow = true;
      shadow.addShadowCaster(trunk);
      colliders.push({
        x: trunk.position.x,
        z: trunk.position.z,
        radius: 0.55,
      });

      const canopy = MeshBuilder.CreateSphere(`leaf_${x}_${z}_${k}`, {
        diameter: 1.6,
        segments: 6,
      }, scene);
      canopy.material = leaf;
      canopy.parent = trunk;
      canopy.position = new Vector3(0, 1.1, 0);
      canopy.scaling = new Vector3(1.4, 0.7, 1.1);
    }
  }

  // Corner vines / hanging foliage (real meshes, not plates).
  for (const [x, z] of [[-5.5, -5.2], [5.4, -5.1], [-5.3, 5.3], [5.2, 5.1]]) {
    for (let v = 0; v < 4; v += 1) {
      const vine = MeshBuilder.CreateTube(`vine_${x}_${z}_${v}`, {
        path: [
          new Vector3(x + v * 0.15, 3.2, z),
          new Vector3(x + v * 0.1, 2.0, z + 0.2),
          new Vector3(x - 0.1 + v * 0.05, 0.8, z + 0.35),
        ],
        radius: 0.05,
        tessellation: 6,
        updatable: false,
      }, scene);
      vine.material = leaf;
      vine.parent = root;
    }
    const glowFlower = MeshBuilder.CreateSphere(`fungi_${x}_${z}`, {
      diameter: 0.28,
      segments: 6,
    }, scene);
    glowFlower.position = new Vector3(x, 0.2, z + 0.4);
    glowFlower.material = ember;
    glowFlower.parent = root;
  }

  for (const light of [torchL, torchR]) {
    const post = MeshBuilder.CreateCylinder(`torchPost_${light.name}`, {
      height: 2.2,
      diameter: 0.18,
      tessellation: 6,
    }, scene);
    post.position = light.position.add(new Vector3(0, -1.1, 0));
    post.material = bark;
    post.parent = root;
    const flame = MeshBuilder.CreateSphere(`flame_${light.name}`, {
      diameter: 0.35,
      segments: 6,
    }, scene);
    flame.position = light.position.clone();
    flame.material = ember;
    flame.parent = root;
  }

  // Soft hero pool light marker (geometry ring, not a JPEG).
  const pool = MeshBuilder.CreateTorus("heroPool", {
    diameter: 2.2,
    thickness: 0.05,
    tessellation: 24,
  }, scene);
  pool.position = new Vector3(0, 0.04, 2.8);
  pool.material = pbr(scene, "pool", {
    albedo: new Color3(0.3, 0.12, 0.02),
    emissive: new Color3(1, 0.4, 0.05),
    emissiveIntensity: 1.5,
    roughness: 0.5,
  });
  pool.parent = root;

  return {
    root,
    colliders,
    lights: { hemi, sun, torchL, torchR },
    shadow,
    bounds: SLICE.arenaHalf,
    usedGltfFloor: loadedGltf,
  };
}

export function resolveWallPush(position, colliders, radius = 0.35) {
  let { x, z } = position;
  for (const c of colliders) {
    const dx = x - c.x;
    const dz = z - c.z;
    const dist = Math.hypot(dx, dz);
    const min = radius + c.radius;
    if (dist > 0 && dist < min) {
      const push = (min - dist) / dist;
      x += dx * push;
      z += dz * push;
    }
  }
  return { x, z };
}

/** Debug helper: never attach the concept JPEG as albedo. */
export function assertNoConceptBillboard(scene) {
  for (const mat of scene.materials) {
    if (!(mat instanceof PBRMaterial) && !(mat instanceof StandardMaterial)) continue;
    const tex = mat.albedoTexture ?? mat.diffuseTexture;
    if (tex instanceof Texture && typeof tex.url === "string") {
      const url = tex.url.toLowerCase();
      if (url.includes("quality-bar") || url.includes("rootfall-08-target")) {
        throw new Error("Concept quality-bar JPEG must not be used as a scene texture");
      }
    }
  }
}
