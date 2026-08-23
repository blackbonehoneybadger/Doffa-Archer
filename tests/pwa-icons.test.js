import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { validatePngBuffer } from "../scripts/validate-images.mjs";

const root = process.cwd();
const iconSpecs = new Map([
  ["/assets/icon-192.png", { width: 192, height: 192, purpose: "any" }],
  ["/assets/icon-512.png", { width: 512, height: 512, purpose: "any" }],
  ["/assets/icon-maskable-512.png", { width: 512, height: 512, purpose: "maskable" }],
]);

test("PWA PNG icons fully decode at their declared dimensions", () => {
  for (const [source, specification] of iconSpecs) {
    const file = join(root, source.slice(1));
    const result = validatePngBuffer(readFileSync(file), source);
    assert.deepEqual(
      { width: result.width, height: result.height },
      { width: specification.width, height: specification.height },
    );
  }
});

test("manifest declares separate install and maskable PNG icons", () => {
  const manifest = JSON.parse(
    readFileSync(join(root, "manifest.webmanifest"), "utf8"),
  );
  assert.equal(new Set(manifest.icons.map((icon) => icon.src)).size, manifest.icons.length);

  for (const [source, specification] of iconSpecs) {
    const icon = manifest.icons.find((candidate) => candidate.src === source);
    assert.ok(icon, `Missing manifest icon ${source}`);
    assert.equal(icon.type, "image/png");
    assert.equal(icon.sizes, `${specification.width}x${specification.height}`);
    assert.equal(icon.purpose, specification.purpose);
  }

  const svg = manifest.icons.find((icon) => icon.src === "/assets/icon.svg");
  assert.equal(svg?.purpose, "any", "the unpadded SVG must not be marked maskable");
});

test("Apple touch icon and the offline shell use the production PNG set", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const worker = readFileSync(join(root, "service-worker.js"), "utf8");

  assert.match(
    html,
    /<link rel="apple-touch-icon" href="\/assets\/icon-192\.png" sizes="192x192">/,
  );
  for (const source of iconSpecs.keys()) {
    assert.equal(worker.includes(`"${source}"`), true, `${source} must be offline-ready`);
  }
});
