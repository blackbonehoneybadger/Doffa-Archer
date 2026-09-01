import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build, preview } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "docs/previews");
mkdirSync(outDir, { recursive: true });
const configFile = resolve(root, "arena3d/vite.config.js");
await build({ configFile });

function chromePath() {
  return process.env.CHROME_PATH
    || "/usr/bin/google-chrome-stable";
}

function runChrome(args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(chromePath(), args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) {
        resolveRun();
      } else {
        rejectRun(new Error(`chrome exited ${code}: ${stderr.slice(-800)}`));
      }
    });
  });
}

async function waitForReady(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const previewServer = await preview({
  configFile,
  preview: { host: "127.0.0.1", port: 4174, strictPort: true },
});
const origin = (previewServer.resolvedUrls?.local?.[0] || "http://127.0.0.1:4174").replace(/\/$/, "");
const sliceUrl = origin.endsWith("/arena3d") ? `${origin}/` : `${origin}/arena3d/`;
await waitForReady(sliceUrl);

const chromeArgs = [
  "--headless=new",
  "--disable-gpu",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
  "--allow-insecure-localhost",
  "--hide-scrollbars",
  "--window-size=720,1280",
  "--virtual-time-budget=16000",
];

try {
  await runChrome([
    ...chromeArgs,
    `--screenshot=${resolve(outDir, "arena3d-rootfall-08-combat.png")}`,
    sliceUrl,
  ]);
  await runChrome([
    ...chromeArgs,
    `--screenshot=${resolve(outDir, "arena3d-rootfall-08-orbit.png")}`,
    `${sliceUrl}?orbit=1`,
  ]);
  writeFileSync(resolve(outDir, "arena3d-rootfall-08-metrics.json"), `${JSON.stringify({
    capturedAt: new Date().toISOString(),
    urls: [sliceUrl, `${sliceUrl}?orbit=1`],
    note: "Chrome SwiftShader captures. Phone WebGL FPS/memory are reported in-slice on device.",
  }, null, 2)}\n`);
  process.stdout.write(`Wrote combat + orbit captures under ${outDir}\n`);
} finally {
  await previewServer.close();
}
