import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(repositoryRoot, "dist");
const copyEntries = [
  "assets",
  "src",
  "styles",
  "index.html",
  "manifest.webmanifest",
  "service-worker.js",
];

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const entry of copyEntries) {
  await cp(join(repositoryRoot, entry), join(outputRoot, entry), {
    recursive: true,
  });
}

await build({
  configFile: join(repositoryRoot, "vite.playcanvas.config.js"),
});

process.stdout.write("DOFFA web and PlayCanvas preview built in dist/.\n");
