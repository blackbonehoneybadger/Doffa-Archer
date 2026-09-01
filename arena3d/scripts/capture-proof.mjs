#!/usr/bin/env node
/**
 * In-engine proof capture for the Rootfall 08 true-3D slice.
 * Uses headless Chrome + Playwright. Does NOT reuse the concept JPEG.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { createStaticServer } from "../../scripts/serve.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(root, "..");
const outDir = resolve(repoRoot, "docs/previews/arena3d");
const chromePath = process.env.CHROME_PATH || "/usr/bin/google-chrome-stable";

async function startServer() {
  const server = createStaticServer({ root: repoRoot });
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  return { server, origin: `http://127.0.0.1:${address.port}` };
}

async function waitForSlice(page) {
  await page.waitForFunction(() => Boolean(window.__DOFA_ARENA3D__?.getStats), null, {
    timeout: 60_000,
  });
  await page.waitForTimeout(1500);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const { server, origin } = await startServer();
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--no-sandbox",
    ],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 720, height: 1280 },
      deviceScaleFactor: 1,
    });
    page.on("pageerror", (err) => console.error("pageerror", err));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error("console", msg.text());
    });

    await page.goto(`${origin}/arena3d/`, { waitUntil: "networkidle", timeout: 120_000 });
    await waitForSlice(page);

    const actionPath = resolve(outDir, "rootfall-08-action-camera.png");
    await page.screenshot({ path: actionPath, type: "png" });

    await page.evaluate(() => window.__DOFA_ARENA3D__.setOrbit(true));
    await page.waitForTimeout(800);
    // Orbit a bit to prove depth (not a flat billboard).
    await page.mouse.move(360, 640);
    await page.mouse.down();
    await page.mouse.move(520, 520, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(400);

    const orbitPath = resolve(outDir, "rootfall-08-orbit-depth-proof.png");
    await page.screenshot({ path: orbitPath, type: "png" });

    const stats = await page.evaluate(() => window.__DOFA_ARENA3D__.getStats());
    const report = {
      capturedAt: new Date().toISOString(),
      origin,
      engine: "babylon.js",
      note: "In-engine captures. Concept quality-bar JPEG was not used as a scene texture.",
      stats,
      files: [
        "rootfall-08-action-camera.png",
        "rootfall-08-orbit-depth-proof.png",
      ],
    };
    await writeFile(resolve(outDir, "capture-report.json"), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
