import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
const out = new URL("dist/", root);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of ["index.html", "manifest.webmanifest", "service-worker.js", "src", "styles", "assets"]) {
  await cp(new URL(name, root), new URL(name, out), { recursive: true });
}
console.log(`Web build: ${fileURLToPath(out)}`);
