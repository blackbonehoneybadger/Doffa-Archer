import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { defineConfig } from "vite";

const repositoryRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(repositoryRoot, "apps/playcanvas-spike"),
  base: "/next/",
  publicDir: false,
  build: {
    outDir: resolve(repositoryRoot, "dist/next"),
    emptyOutDir: true,
    sourcemap: true,
    target: "es2022",
  },
  server: {
    host: "0.0.0.0",
    port: 4174,
    strictPort: false,
    fs: {
      allow: [repositoryRoot],
    },
  },
});
