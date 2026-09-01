import { GAME_NAME, HERO_IDENTITY, TOUR } from "../identity.js";

function floatToBytes(value) {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setFloat32(0, value, true);
  return new Uint8Array(buffer);
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

export function meshToGltfMesh(mesh, materialIndex) {
  return {
    name: mesh.name,
    primitives: [{
      attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 },
      indices: 3,
      material: materialIndex,
    }],
    extras: {
      game: GAME_NAME,
      vertexCount: mesh.positions.length / 3,
    },
  };
}

export function createSliceGltfDocument({ hero, room, enemies }) {
  const materials = [
    { name: "hero-skin", pbrMetallicRoughness: { baseColorFactor: [0.45, 0.32, 0.24, 1], metallicFactor: 0, roughnessFactor: 0.62 } },
    { name: "hero-cloth", pbrMetallicRoughness: { baseColorFactor: [0.07, 0.08, 0.1, 1], metallicFactor: 0.05, roughnessFactor: 0.78 } },
    { name: "black-steel", pbrMetallicRoughness: { baseColorFactor: [0.08, 0.09, 0.1, 1], metallicFactor: 0.92, roughnessFactor: 0.28 } },
    { name: "beard", pbrMetallicRoughness: { baseColorFactor: [0.04, 0.03, 0.03, 1], metallicFactor: 0, roughnessFactor: 0.84 } },
    { name: "stone", pbrMetallicRoughness: { baseColorFactor: [0.18, 0.16, 0.14, 1], metallicFactor: 0, roughnessFactor: 0.86 } },
    { name: "root-bark", pbrMetallicRoughness: { baseColorFactor: [0.16, 0.09, 0.05, 1], metallicFactor: 0, roughnessFactor: 0.9 } },
    { name: "foliage", pbrMetallicRoughness: { baseColorFactor: [0.08, 0.22, 0.07, 1], metallicFactor: 0, roughnessFactor: 0.7 } },
    { name: "chitin", pbrMetallicRoughness: { baseColorFactor: [0.18, 0.42, 0.16, 1], metallicFactor: 0.12, roughnessFactor: 0.45 } },
    { name: "seed-pod", pbrMetallicRoughness: { baseColorFactor: [0.28, 0.38, 0.12, 1], metallicFactor: 0, roughnessFactor: 0.6 } },
    { name: "wood-creature", pbrMetallicRoughness: { baseColorFactor: [0.2, 0.11, 0.06, 1], metallicFactor: 0, roughnessFactor: 0.88 } },
    {
      name: "glow-vein",
      pbrMetallicRoughness: { baseColorFactor: [0.05, 0.18, 0.07, 1], metallicFactor: 0, roughnessFactor: 0.4 },
      emissiveFactor: [0.12, 0.85, 0.22],
    },
  ];

  return {
    asset: {
      version: "2.0",
      generator: "DOFA ARENA true-3D slice",
    },
    extras: {
      game: GAME_NAME,
      tour: `${TOUR.code} · ${TOUR.name}`,
      room: `${String(TOUR.room).padStart(2, "0")} / ${TOUR.roomTotal}`,
      seed: TOUR.seed,
      hero: HERO_IDENTITY.name,
      backText: HERO_IDENTITY.backText,
      backTextMirror: HERO_IDENTITY.backTextMirror,
      chestMark: HERO_IDENTITY.chestMark,
      head: HERO_IDENTITY.head,
      weaponSheet: HERO_IDENTITY.weaponSheet,
      fakeBackground: false,
      billboardRoom: false,
      conceptImageAsPlane: false,
    },
    scene: 0,
    scenes: [{ name: "rootfall-08", nodes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }],
    nodes: [
      { name: "HoneyBadger", mesh: 0, extras: { height: HERO_IDENTITY.heightMeters, head: "placeholder" } },
      { name: "HoneyBadgerClothes", mesh: 1 },
      { name: "BlackSteelKatana", mesh: 2 },
      { name: "RootfallFloor", mesh: 3 },
      { name: "RootfallRoots", mesh: 4 },
      { name: "RootfallFoliage", mesh: 5 },
      { name: "RootfallCover", mesh: 6 },
      { name: "RazorMantisElite", mesh: 7 },
      { name: "SeedSpitterPod", mesh: 8 },
      { name: "RootStalkerWood", mesh: 9 },
    ],
    meshes: [
      { ...meshToGltfMesh(hero.body, 0), name: "HoneyBadgerBody" },
      { ...meshToGltfMesh(hero.garment, 1), name: "HoneyBadgerClothes" },
      { ...meshToGltfMesh(hero.steel, 2), name: "BlackSteelKatana" },
      { ...meshToGltfMesh(room.tiles, 4), name: "RootfallFloor" },
      { ...meshToGltfMesh(room.roots, 5), name: "RootfallRoots" },
      { ...meshToGltfMesh(room.foliage, 6), name: "RootfallFoliage" },
      { ...meshToGltfMesh(room.props, 4), name: "RootfallCover" },
      { ...meshToGltfMesh(enemies.mantis, 7), name: "RazorMantisElite" },
      { ...meshToGltfMesh(enemies.spitter, 8), name: "SeedSpitterPod" },
      { ...meshToGltfMesh(enemies.stalker, 9), name: "RootStalkerWood" },
    ],
    materials,
  };
}

export function gltfHasImagePlaneBackground(document) {
  const names = [
    ...(document.nodes ?? []).map((node) => node.name ?? ""),
    ...(document.meshes ?? []).map((mesh) => mesh.name ?? ""),
    ...(document.images ?? []).map((image) => image.uri ?? image.name ?? ""),
  ].join(" ").toLowerCase();
  if (document.extras?.conceptImageAsPlane || document.extras?.billboardRoom) {
    return true;
  }
  return /v01-dofa-arena|concept-art|background-plane|billboard-room/.test(names);
}

export function encodeAccessorPreview(mesh) {
  const chunks = [];
  for (const value of mesh.positions.slice(0, 12)) {
    chunks.push(floatToBytes(value));
  }
  return concatBytes(chunks);
}
