import { HERO_IDENTITY } from "../identity.js";
import { createBox, createCylinder, createSphere, createTube, mergeMeshes } from "./primitives.js";

export function createHoneyBadgerMeshes() {
  const height = HERO_IDENTITY.heightMeters;
  const skin = [];
  const clothes = [];
  const metal = [];
  const beard = [];
  const tattoos = [];

  clothes.push(createCylinder(0.17, 0.19, 0.72, 14, { y: 0.46 }));
  clothes.push(createBox(0.22, 0.12, 0.28, { x: -0.12, y: 0.1, z: 0.02 }));
  clothes.push(createBox(0.22, 0.12, 0.28, { x: 0.12, y: 0.1, z: 0.02 }));
  clothes.push(createBox(0.24, 0.11, 0.32, { x: -0.13, y: 0.06, z: 0.04 }));
  clothes.push(createBox(0.24, 0.11, 0.32, { x: 0.13, y: 0.06, z: 0.04 }));

  skin.push(createSphere(0.24, 14, { y: 1.18, latScale: 1.18 }));
  skin.push(createSphere(0.21, 12, { y: 1.02, z: 0.02, latScale: 0.7 }));
  skin.push(createCylinder(0.09, 0.11, 0.28, 10, { x: -0.28, y: 1.18, z: 0.02 }));
  skin.push(createCylinder(0.085, 0.09, 0.26, 10, { x: 0.28, y: 1.18, z: 0.02 }));
  skin.push(createSphere(0.08, 10, { x: -0.42, y: 1.05, z: 0.04 }));
  skin.push(createSphere(0.08, 10, { x: 0.42, y: 1.05, z: 0.04 }));
  skin.push(createCylinder(0.08, 0.075, 0.28, 10, { x: -0.28, y: 0.92 }));
  skin.push(createCylinder(0.08, 0.075, 0.28, 10, { x: 0.28, y: 0.92 }));

  const head = createSphere(0.13, 14, { y: height - 0.13, latScale: 1.12 });
  const cranium = createSphere(0.132, 12, { y: height - 0.11, z: -0.01, latScale: 0.85 });
  skin.push(head, cranium);

  beard.push(createSphere(0.09, 10, { y: height - 0.22, z: 0.08, latScale: 0.7 }));
  beard.push(createCylinder(0.07, 0.035, 0.42, 10, { y: height - 0.46, z: 0.1 }));
  beard.push(createSphere(0.04, 8, { y: height - 0.68, z: 0.11 }));

  tattoos.push(createBox(0.22, 0.22, 0.02, { y: 1.22, z: 0.235 }));
  tattoos.push(createBox(0.34, 0.1, 0.018, { y: 1.36, z: -0.22 }));

  const blade = createBox(0.045, 0.045, 1.02, { x: 0.46, y: 1.12, z: 0.42 });
  const guard = createBox(0.16, 0.04, 0.04, { x: 0.46, y: 1.12, z: -0.08 });
  const hilt = createCylinder(0.025, 0.028, 0.22, 8, { x: 0.46, y: 1.12, z: -0.2 });
  metal.push(blade, guard, hilt);
  metal.push(createBox(0.09, 0.02, 0.09, { x: -0.16, y: 0.86, z: 0.14 }));
  metal.push(createBox(0.09, 0.02, 0.09, { x: -0.16, y: 0.9, z: 0.08 }));
  metal.push(createBox(0.09, 0.02, 0.09, { x: -0.1, y: 0.88, z: 0.12 }));

  const body = mergeMeshes(skin, "honey-badger-body");
  const garment = mergeMeshes(clothes, "honey-badger-clothes");
  const steel = mergeMeshes(metal, "honey-badger-katana");
  const hair = mergeMeshes(beard, "honey-badger-beard");
  const ink = mergeMeshes(tattoos, "honey-badger-tattoos");
  return {
    height,
    body,
    garment,
    steel,
    hair,
    ink,
    parts: { body, garment, steel, hair, ink },
    backText: HERO_IDENTITY.backText,
    chestMark: HERO_IDENTITY.chestMark,
    headKind: HERO_IDENTITY.head.kind,
    weaponSheet: HERO_IDENTITY.weaponSheet,
  };
}

export function createRazorMantisMesh() {
  const parts = [
    createSphere(0.28, 12, { y: 0.55, z: 0, latScale: 1.4 }),
    createSphere(0.18, 10, { y: 0.72, z: 0.28, latScale: 0.8 }),
    createSphere(0.12, 8, { y: 0.7, z: 0.46 }),
    createBox(0.08, 0.04, 0.55, { x: -0.22, y: 0.82, z: 0.35 }),
    createBox(0.08, 0.04, 0.55, { x: 0.22, y: 0.82, z: 0.35 }),
    createBox(0.05, 0.42, 0.08, { x: -0.18, y: 0.28, z: 0.12 }),
    createBox(0.05, 0.42, 0.08, { x: 0.18, y: 0.28, z: 0.12 }),
    createBox(0.05, 0.38, 0.08, { x: -0.26, y: 0.26, z: -0.12 }),
    createBox(0.05, 0.38, 0.08, { x: 0.26, y: 0.26, z: -0.12 }),
    createSphere(0.16, 8, { y: 0.9, z: -0.05, latScale: 0.35 }),
    createSphere(0.16, 8, { y: 0.9, z: 0.08, latScale: 0.35 }),
  ];
  return mergeMeshes(parts, "razor-mantis-elite");
}

export function createSeedSpitterMesh() {
  const parts = [
    createCylinder(0.16, 0.28, 0.35, 12, { y: 0.18 }),
    createSphere(0.34, 14, { y: 0.52, latScale: 1.15 }),
    createSphere(0.18, 10, { y: 0.78, z: 0.12 }),
    createBox(0.12, 0.28, 0.06, { x: -0.22, y: 0.62, z: 0.1 }),
    createBox(0.12, 0.28, 0.06, { x: 0.22, y: 0.62, z: 0.1 }),
    createBox(0.18, 0.2, 0.05, { y: 0.7, z: 0.28 }),
    createCylinder(0.05, 0.12, 0.22, 8, { y: 0.08, z: -0.16 }),
    createCylinder(0.05, 0.12, 0.22, 8, { y: 0.08, z: 0.16 }),
  ];
  return mergeMeshes(parts, "seed-spitter-pod");
}

export function createRootStalkerMesh() {
  const parts = [
    createCylinder(0.12, 0.16, 0.55, 8, { y: 0.42 }),
    createSphere(0.2, 10, { y: 0.78, z: 0.04, latScale: 1.1 }),
    createSphere(0.12, 8, { y: 1.02, z: 0.06 }),
    createBox(0.08, 0.08, 0.42, { x: -0.22, y: 0.72, z: 0.18 }),
    createBox(0.08, 0.08, 0.42, { x: 0.22, y: 0.72, z: 0.18 }),
    createBox(0.04, 0.18, 0.04, { x: -0.38, y: 0.62, z: 0.34 }),
    createBox(0.04, 0.18, 0.04, { x: 0.38, y: 0.62, z: 0.34 }),
    createBox(0.07, 0.42, 0.08, { x: -0.1, y: 0.22, z: 0.02 }),
    createBox(0.07, 0.42, 0.08, { x: 0.1, y: 0.22, z: 0.02 }),
    createCylinder(0.04, 0.03, 0.28, 6, { x: -0.16, y: 0.9, z: -0.08 }),
    createCylinder(0.04, 0.03, 0.22, 6, { x: 0.14, y: 0.86, z: -0.1 }),
  ];
  return mergeMeshes(parts, "root-stalker-wood");
}

export function createRoom08Geometry(rng) {
  const tiles = [];
  const roots = [];
  const foliage = [];
  const props = [];
  const glow = [];
  for (let ix = -8; ix <= 8; ix += 1) {
    for (let iz = -14; iz <= 14; iz += 1) {
      const jitterY = rng.float(-0.03, 0.04);
      const cracked = rng.next() > 0.82;
      const moss = rng.next() > 0.55;
      const tile = createBox(
        cracked ? 0.68 : 0.78,
        0.09 + (moss ? 0.02 : 0),
        cracked ? 0.68 : 0.78,
        { x: ix * 0.82 + rng.float(-0.05, 0.05), y: jitterY, z: iz * 0.82 + rng.float(-0.05, 0.05) },
      );
      tile.kind = moss ? "moss-tile" : "stone-tile";
      tiles.push(tile);
    }
  }

  const rootPaths = [
    [[-5.8, 0.15, -9], [-4.2, 0.55, -6], [-3.8, 1.4, -3], [-5.1, 2.6, -1], [-5.6, 3.8, 2]],
    [[5.7, 0.2, -8.5], [4.6, 0.7, -5], [5.1, 1.8, -2], [5.5, 3.2, 1], [5.8, 4.2, 4]],
    [[-2.2, 0.2, -10], [-0.2, 0.9, -9.2], [1.4, 1.8, -8.6], [0.1, 2.8, -7.8]],
    [[-6, 0.1, 6], [-5.2, 0.8, 5], [-4.6, 1.9, 3.6], [-5.4, 3.1, 2.2]],
    [[6, 0.12, 7], [5.1, 0.7, 5.5], [4.7, 1.7, 4], [5.6, 2.9, 2.6]],
  ];
  for (const path of rootPaths) {
    roots.push(createTube(path, 0.22, 7));
  }

  for (let i = 0; i < 18; i += 1) {
    const x = rng.float(-5.8, 5.8);
    const z = rng.float(-9.8, 9.8);
    if (Math.abs(x) < 1.4 && Math.abs(z) < 6) {
      continue;
    }
    foliage.push(createSphere(rng.float(0.35, 0.7), 8, { x, y: rng.float(0.7, 1.6), z, latScale: 0.55 }));
    foliage.push(createCylinder(0.04, 0.07, rng.float(0.4, 0.9), 6, { x, y: 0.4, z }));
  }

  props.push(createCylinder(0.18, 0.22, 1.15, 8, { x: -4.6, y: 0.6, z: -1.5 }));
  props.push(createCylinder(0.18, 0.22, 1.15, 8, { x: 4.5, y: 0.6, z: -2.1 }));
  props.push(createBox(1.8, 0.55, 0.7, { x: 0, y: 0.35, z: -6.95 }));
  props.push(createBox(0.35, 1.8, 1.4, { x: -1.5, y: 1.1, z: -7.1 }));
  props.push(createBox(0.35, 1.8, 1.4, { x: 1.5, y: 1.1, z: -7.1 }));
  props.push(createBox(2.2, 1.6, 0.4, { x: 0, y: 2.1, z: -7.35 }));

  for (let i = 0; i < 10; i += 1) {
    const x = rng.float(-4.5, 4.5);
    const z = rng.float(-8, 8);
    glow.push(createTube(
      [[x, 0.04, z], [x + rng.float(-1.2, 1.2), 0.05, z + rng.float(-1.4, 1.4)], [x + rng.float(-2, 2), 0.04, z + rng.float(-2, 2)]],
      0.035,
      5,
    ));
  }

  return {
    tiles: mergeMeshes(tiles, "rootfall-floor"),
    roots: mergeMeshes(roots, "rootfall-roots"),
    foliage: mergeMeshes(foliage, "rootfall-foliage"),
    props: mergeMeshes(props, "rootfall-cover"),
    glow: mergeMeshes(glow, "rootfall-veins"),
  };
}
