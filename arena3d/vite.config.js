import { defineConfig } from "vite";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(dir, "..");
const TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function serveRepoAssets() {
  return {
    name: "serve-repo-assets",
    configureServer: attach,
    configurePreviewServer: attach,
  };

  function attach(server) {
    server.middlewares.use((request, response, next) => {
      const url = request.url?.split("?")[0] ?? "";
      if (!url.startsWith("/assets/")) {
        next();
        return;
      }
      const filePath = join(repoRoot, url);
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        response.statusCode = 404;
        response.end("Not found");
        return;
      }
      response.setHeader("Content-Type", TYPES[extname(filePath)] ?? "application/octet-stream");
      createReadStream(filePath).pipe(response);
    });
  }
}

export default defineConfig({
  root: dir,
  base: "/arena3d/",
  publicDir: join(dir, "public"),
  plugins: [serveRepoAssets()],
  server: {
    host: true,
    port: 4174,
    fs: { allow: [repoRoot] },
  },
  preview: {
    host: true,
    port: 4174,
  },
  build: {
    outDir: resolve(repoRoot, "dist/arena3d"),
    emptyOutDir: true,
    target: "es2022",
    assetsInlineLimit: 0,
  },
});
