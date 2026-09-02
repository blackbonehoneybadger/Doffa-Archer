#!/usr/bin/env node
/**
 * Emit a minimal PBR floor tile glTF for the Rootfall 08 spike.
 * Real mesh + metallicRoughness — not a concept JPEG plate.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), "../public/assets/gltf");
await mkdir(outDir, { recursive: true });

// Unit box centered, y-up. Positions + normals + uvs + indices.
const positions = Float32Array.from([
  -0.55, 0.0, -0.55, 0.55, 0.0, -0.55, 0.55, 0.0, 0.55, -0.55, 0.0, 0.55,
  -0.55, 0.16, -0.55, 0.55, 0.16, -0.55, 0.55, 0.16, 0.55, -0.55, 0.16, 0.55,
]);
const normals = Float32Array.from([
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
]);
const uvs = Float32Array.from([
  0, 0, 1, 0, 1, 1, 0, 1,
  0, 0, 1, 0, 1, 1, 0, 1,
]);
const indices = Uint16Array.from([
  0, 1, 2, 0, 2, 3,
  4, 6, 5, 4, 7, 6,
  0, 4, 5, 0, 5, 1,
  1, 5, 6, 1, 6, 2,
  2, 6, 7, 2, 7, 3,
  3, 7, 4, 3, 4, 0,
]);

function concat(...parts) {
  const total = parts.reduce((n, p) => n + p.byteLength, 0);
  const buffer = new ArrayBuffer(total);
  const view = new Uint8Array(buffer);
  let offset = 0;
  for (const part of parts) {
    view.set(new Uint8Array(part.buffer, part.byteOffset, part.byteLength), offset);
    offset += part.byteLength;
  }
  return buffer;
}

const bin = concat(positions, normals, uvs, indices);
const binPath = resolve(outDir, "rootfall-floor-tile.bin");
await writeFile(binPath, Buffer.from(bin));

const posByte = positions.byteLength;
const nrmByte = normals.byteLength;
const uvByte = uvs.byteLength;

const gltf = {
  asset: { version: "2.0", generator: "dofa-arena3d-generate-floor-gltf" },
  scenes: [{ nodes: [0] }],
  scene: 0,
  nodes: [{ mesh: 0, name: "RootfallFloorTile" }],
  meshes: [{
    name: "RootfallFloorTile",
    primitives: [{
      attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 },
      indices: 3,
      material: 0,
    }],
  }],
  materials: [{
    name: "RootfallStonePBR",
    pbrMetallicRoughness: {
      baseColorFactor: [0.18, 0.2, 0.16, 1],
      metallicFactor: 0.04,
      roughnessFactor: 0.86,
    },
  }],
  accessors: [
    { bufferView: 0, componentType: 5126, count: 8, type: "VEC3", max: [0.55, 0.16, 0.55], min: [-0.55, 0, -0.55] },
    { bufferView: 1, componentType: 5126, count: 8, type: "VEC3" },
    { bufferView: 2, componentType: 5126, count: 8, type: "VEC2" },
    { bufferView: 3, componentType: 5123, count: indices.length, type: "SCALAR" },
  ],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: posByte, target: 34962 },
    { buffer: 0, byteOffset: posByte, byteLength: nrmByte, target: 34962 },
    { buffer: 0, byteOffset: posByte + nrmByte, byteLength: uvByte, target: 34962 },
    { buffer: 0, byteOffset: posByte + nrmByte + uvByte, byteLength: indices.byteLength, target: 34963 },
  ],
  buffers: [{ byteLength: bin.byteLength, uri: "rootfall-floor-tile.bin" }],
};

const gltfPath = resolve(outDir, "rootfall-floor-tile.gltf");
await writeFile(gltfPath, `${JSON.stringify(gltf, null, 2)}\n`);
console.log(`Wrote ${gltfPath}`);
console.log(`Wrote ${binPath}`);
