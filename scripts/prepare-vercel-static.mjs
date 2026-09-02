#!/usr/bin/env node
/**
 * Assemble a single static output directory for Vercel.
 *
 * Root cause this fixes: vercel.json set buildCommand for arena3d without
 * outputDirectory. After a custom build, Vercel (framework "Other") expects an
 * explicit output folder and fails when root `dist`/`public` is missing.
 *
 * Layout:
 *   vercel-static/           ← 2D Canvas/PWA prototype (unchanged)
 *   vercel-static/arena3d/   ← built Vite/Babylon bundle from arena3d/dist
 */
import { cpSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "vercel-static");
const arenaDist = join(root, "arena3d", "dist");

const ROOT_FILES = ["index.html", "manifest.webmanifest", "service-worker.js"];
const ROOT_DIRS = ["assets", "src", "styles"];

function assertExists(path, label) {
  if (!existsSync(path)) {
    throw new Error(`prepare-vercel-static: missing ${label} at ${path}`);
  }
}

assertExists(arenaDist, "arena3d build output (run npm run arena3d:build first)");
for (const file of ROOT_FILES) {
  assertExists(join(root, file), file);
}
for (const dir of ROOT_DIRS) {
  assertExists(join(root, dir), `${dir}/`);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const file of ROOT_FILES) {
  cpSync(join(root, file), join(outDir, file));
}
for (const dir of ROOT_DIRS) {
  cpSync(join(root, dir), join(outDir, dir), { recursive: true });
}

const arenaOut = join(outDir, "arena3d");
mkdirSync(arenaOut, { recursive: true });
cpSync(arenaDist, arenaOut, { recursive: true });

const arenaIndex = join(arenaOut, "index.html");
assertExists(arenaIndex, "arena3d/index.html in output");

const sizeMB = (path) => (statSync(path).isDirectory()
  ? null
  : (statSync(path).size / (1024 * 1024)).toFixed(1));

console.log(`prepare-vercel-static: wrote ${outDir}`);
console.log(`  2D shell + assets/src/styles`);
console.log(`  arena3d/index.html present (${sizeMB(arenaIndex)} MB html)`);
