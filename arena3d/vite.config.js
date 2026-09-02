import { defineConfig } from "vite";
import { createReadStream, existsSync } from "node:fs";
import { extname, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const TYPES = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function parentAssetsMiddleware(req, res, next) {
  if (!req.url?.startsWith("/assets/")) return next();
  const pathname = req.url.split("?")[0];
  const filePath = resolve(repoRoot, `.${pathname}`);
  if (!filePath.startsWith(resolve(repoRoot, "assets")) || !existsSync(filePath)) {
    res.statusCode = 404;
    res.end("missing asset");
    return;
  }
  const type = TYPES[extname(filePath)];
  if (type) res.setHeader("Content-Type", type);
  createReadStream(filePath).pipe(res);
}

export default defineConfig({
  base: "/arena3d/",
  root: resolve(import.meta.dirname),
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Sourcemaps bloat the Vercel static upload; keep off for deploy builds.
    sourcemap: false,
    target: "es2022",
    chunkSizeWarningLimit: 1800,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    fs: { allow: [repoRoot] },
  },
  preview: {
    host: "0.0.0.0",
    port: 5174,
    strictPort: true,
  },
  plugins: [
    {
      name: "serve-parent-assets",
      configureServer(server) {
        server.middlewares.use(parentAssetsMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(parentAssetsMiddleware);
      },
    },
  ],
});
