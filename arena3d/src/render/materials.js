import {
  Color3,
  Constants,
  DynamicTexture,
  PBRMaterial,
  RawCubeTexture,
  StandardMaterial,
} from "@babylonjs/core";
import { HERO_IDENTITY, paintGlyphRow } from "../identity.js";

function noiseValue(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function paintNoiseTexture(scene, name, size, shade) {
  const texture = new DynamicTexture(name, { width: size, height: size }, scene, false);
  const ctx = texture.getContext();
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = 0.55 * noiseValue(x * 0.07, y * 0.07)
        + 0.3 * noiseValue(x * 0.19, y * 0.17)
        + 0.15 * noiseValue(x * 0.53, y * 0.41);
      const color = shade(n, x, y);
      const index = (y * size + x) * 4;
      image.data[index] = color[0];
      image.data[index + 1] = color[1];
      image.data[index + 2] = color[2];
      image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  texture.update();
  texture.wrapU = 1;
  texture.wrapV = 1;
  return texture;
}

export function paintStrongRootsTexture(scene) {
  const glyph = paintGlyphRow(HERO_IDENTITY.backText, { scale: 6, pad: 4, invert: false });
  const size = 256;
  const texture = new DynamicTexture("strong-roots", { width: size, height: size }, scene, false);
  const ctx = texture.getContext();
  ctx.fillStyle = "#6a4a38";
  ctx.fillRect(0, 0, size, size);
  const image = ctx.getImageData(0, 0, size, size);
  const ox = Math.floor((size - glyph.width) / 2);
  const oy = Math.floor((size - glyph.height) / 2);
  for (let y = 0; y < glyph.height; y += 1) {
    for (let x = 0; x < glyph.width; x += 1) {
      const src = (y * glyph.width + x) * 4;
      if (glyph.data[src + 3] < 10) {
        continue;
      }
      const dest = ((oy + y) * size + (ox + x)) * 4;
      image.data[dest] = glyph.data[src];
      image.data[dest + 1] = glyph.data[src + 1];
      image.data[dest + 2] = glyph.data[src + 2];
      image.data[dest + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  texture.update();
  texture.wrapU = 0;
  texture.wrapV = 0;
  texture.vScale = -1;
  return texture;
}

export function paintChestBadgerTexture(scene) {
  const size = 256;
  const texture = new DynamicTexture("chest-badger", { width: size, height: size }, scene, false);
  const ctx = texture.getContext();
  ctx.fillStyle = "#5c4030";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(128, 132, 70, 58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.ellipse(128, 150, 38, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.moveTo(70, 100);
  ctx.lineTo(92, 58);
  ctx.lineTo(112, 96);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(186, 100);
  ctx.lineTo(164, 58);
  ctx.lineTo(144, 96);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#eee";
  ctx.beginPath();
  ctx.arc(108, 128, 8, 0, Math.PI * 2);
  ctx.arc(148, 128, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.fillRect(118, 168, 20, 8);
  texture.update();
  return texture;
}

function pbr(scene, name, options) {
  const material = new PBRMaterial(name, scene);
  material.albedoColor = options.albedo;
  material.metallic = options.metallic ?? 0;
  material.roughness = options.roughness ?? 0.7;
  material.emissiveColor = options.emissive ?? Color3.Black();
  material.emissiveIntensity = options.emissiveIntensity ?? 0;
  material.directIntensity = options.directIntensity ?? 1.8;
  material.environmentIntensity = options.environmentIntensity ?? 0.55;
  material.specularIntensity = options.specularIntensity ?? 1;
  material.ambientColor = options.ambient ?? new Color3(0.35, 0.32, 0.28);
  material.backFaceCulling = options.backFaceCulling ?? true;
  if (options.albedoTexture) {
    material.albedoTexture = options.albedoTexture;
  }
  if (options.bumpTexture) {
    material.bumpTexture = options.bumpTexture;
  }
  material.maxSimultaneousLights = 8;
  return material;
}

export function createLocalEnvTexture(scene) {
  const size = 16;
  const faces = [];
  for (let face = 0; face < 6; face += 1) {
    const pixels = new Uint8Array(size * size * 4);
    const sky = face === 2;
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = sky ? 58 : 22;
      pixels[i + 1] = sky ? 64 : 32;
      pixels[i + 2] = sky ? 42 : 24;
      pixels[i + 3] = 255;
    }
    faces.push(pixels);
  }
  return new RawCubeTexture(scene, faces, size, Constants.TEXTUREFORMAT_RGBA, Constants.TEXTURETYPE_UNSIGNED_BYTE);
}

export function createMaterials(scene) {
  const stoneAlbedo = paintNoiseTexture(scene, "stone-albedo", 256, (n) => {
    const shade = 48 + n * 52;
    return [shade, shade * 0.9, shade * 0.78];
  });
  const mossAlbedo = paintNoiseTexture(scene, "moss-albedo", 256, (n) => {
    return [18 + n * 20, 48 + n * 70, 16 + n * 18];
  });
  const barkAlbedo = paintNoiseTexture(scene, "bark-albedo", 256, (n) => {
    return [42 + n * 40, 22 + n * 18, 12 + n * 10];
  });
  const skinAlbedo = paintNoiseTexture(scene, "skin-albedo", 128, (n) => {
    return [132 + n * 28, 92 + n * 18, 68 + n * 12];
  });

  return {
    stone: pbr(scene, "stone", { albedo: new Color3(0.42, 0.36, 0.3), roughness: 0.82, albedoTexture: stoneAlbedo }),
    moss: pbr(scene, "moss", { albedo: new Color3(0.18, 0.38, 0.12), roughness: 0.78, albedoTexture: mossAlbedo }),
    wetStone: pbr(scene, "wet-stone", { albedo: new Color3(0.22, 0.24, 0.22), roughness: 0.22, metallic: 0.04 }),
    bark: pbr(scene, "bark", { albedo: new Color3(0.32, 0.18, 0.1), roughness: 0.9, albedoTexture: barkAlbedo }),
    leaf: pbr(scene, "leaf", { albedo: new Color3(0.16, 0.42, 0.12), roughness: 0.55 }),
    ember: pbr(scene, "ember", {
      albedo: new Color3(0.8, 0.35, 0.08),
      roughness: 0.35,
      emissive: new Color3(1, 0.38, 0.05),
      emissiveIntensity: 2.4,
    }),
    vein: pbr(scene, "vein", {
      albedo: new Color3(0.05, 0.4, 0.12),
      roughness: 0.3,
      emissive: new Color3(0.08, 0.55, 0.16),
      emissiveIntensity: 1.4,
    }),
    skin: pbr(scene, "skin", { albedo: new Color3(0.72, 0.5, 0.38), roughness: 0.52, albedoTexture: skinAlbedo, directIntensity: 2.2 }),
    beard: pbr(scene, "beard", { albedo: new Color3(0.03, 0.025, 0.02), roughness: 0.9 }),
    pants: pbr(scene, "pants", { albedo: new Color3(0.07, 0.08, 0.1), roughness: 0.78, metallic: 0.04 }),
    sneaker: pbr(scene, "sneaker", { albedo: new Color3(0.12, 0.12, 0.13), roughness: 0.55, metallic: 0.1 }),
    sneakerSole: pbr(scene, "sneaker-sole", { albedo: new Color3(0.82, 0.82, 0.8), roughness: 0.7 }),
    steel: pbr(scene, "black-steel", { albedo: new Color3(0.05, 0.055, 0.06), roughness: 0.26, metallic: 0.94 }),
    steelEdge: pbr(scene, "steel-edge", {
      albedo: new Color3(0.35, 0.36, 0.38),
      roughness: 0.18,
      metallic: 1,
      emissive: new Color3(1, 0.45, 0.08),
      emissiveIntensity: 0.15,
    }),
    backTattoo: pbr(scene, "back-tattoo", {
      albedo: new Color3(0.7, 0.5, 0.38),
      roughness: 0.55,
      albedoTexture: paintStrongRootsTexture(scene),
      emissive: new Color3(0.35, 0.28, 0.16),
      emissiveIntensity: 0.45,
      directIntensity: 2.2,
    }),
    chestTattoo: pbr(scene, "chest-tattoo", {
      albedo: new Color3(0.7, 0.5, 0.38),
      roughness: 0.55,
      albedoTexture: paintChestBadgerTexture(scene),
      directIntensity: 2.2,
    }),
    chitin: pbr(scene, "chitin", { albedo: new Color3(0.16, 0.42, 0.14), roughness: 0.42, metallic: 0.18 }),
    wing: pbr(scene, "wing", {
      albedo: new Color3(0.35, 0.7, 0.28),
      roughness: 0.25,
      metallic: 0.05,
    }),
    seedPod: pbr(scene, "seed-pod", { albedo: new Color3(0.22, 0.38, 0.1), roughness: 0.55 }),
    seedCore: pbr(scene, "seed-core", { albedo: new Color3(0.55, 0.12, 0.08), roughness: 0.48 }),
    woodCreature: pbr(scene, "wood-creature", { albedo: new Color3(0.18, 0.09, 0.04), roughness: 0.9, albedoTexture: barkAlbedo }),
    eyeGlow: pbr(scene, "eye-glow", {
      albedo: new Color3(0.2, 1, 0.3),
      roughness: 0.2,
      emissive: new Color3(0.2, 1, 0.25),
      emissiveIntensity: 4,
    }),
    telegraph: pbr(scene, "telegraph", {
      albedo: new Color3(0.1, 0.8, 0.2),
      roughness: 0.4,
      emissive: new Color3(0.15, 1, 0.25),
      emissiveIntensity: 2.2,
    }),
    playerRing: pbr(scene, "player-ring", {
      albedo: new Color3(0.9, 0.45, 0.08),
      roughness: 0.35,
      emissive: new Color3(1, 0.4, 0.05),
      emissiveIntensity: 1.6,
    }),
    slash: pbr(scene, "slash", {
      albedo: new Color3(1, 0.55, 0.12),
      roughness: 0.2,
      emissive: new Color3(1, 0.42, 0.05),
      emissiveIntensity: 5,
    }),
    placeholder: (() => {
      const material = new StandardMaterial("placeholder-head-label", scene);
      material.emissiveColor = new Color3(0.7, 0.55, 0.2);
      material.disableLighting = true;
      return material;
    })(),
  };
}
