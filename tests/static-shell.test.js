import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function localReferences(content) {
  return [...content.matchAll(/(?:href|src)="(\/[^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => path !== "/");
}

test("HTML shell references only files that exist", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const references = localReferences(html);
  assert.ok(references.length >= 4);
  for (const reference of references) {
    assert.equal(existsSync(join(root, reference)), true, `Missing ${reference}`);
  }
});

test("manifest and Vercel configuration are valid JSON", () => {
  const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
  const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  assert.equal(manifest.name, "DOFFA Heroes");
  assert.equal(manifest.start_url, "/");
  assert.equal(vercel.headers[0].headers.some((header) => header.key === "Content-Security-Policy"), true);
});

test("browser shell has no external runtime scripts or styles", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.equal(/<(?:script|link)[^>]+(?:src|href)="https?:\/\//i.test(html), false);
});

test("offline shell includes the data-driven tour catalog", () => {
  const worker = readFileSync(join(root, "service-worker.js"), "utf8");
  assert.equal(worker.includes('"/src/game/content.js"'), true);
  assert.equal(worker.includes("doffa-heroes-v0.2.0"), true);
});

test("every required UI element exists in the HTML shell", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const app = readFileSync(join(root, "src/ui/app.js"), "utf8");
  const requiredIds = [...app.matchAll(/requiredElement\("([^"]+)"\)/g)].map((match) => match[1]);

  assert.ok(requiredIds.length > 20);
  for (const id of requiredIds) {
    assert.equal(html.includes(`id="${id}"`), true, `Missing #${id}`);
  }
});
