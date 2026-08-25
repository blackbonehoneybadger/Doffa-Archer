import test from "node:test";
import assert from "node:assert/strict";

import { createStaticServer } from "../scripts/serve.mjs";

async function startServer() {
  const server = createStaticServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
  };
}

test("Replit server exposes the game shell, icons, and service-worker scope securely", async () => {
  const { server, origin } = await startServer();
  try {
    const shell = await fetch(`${origin}/`);
    assert.equal(shell.status, 200);
    assert.match(shell.headers.get("content-type") ?? "", /^text\/html/);
    assert.match(shell.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
    assert.match(await shell.text(), /PROTOTYPE 0\.18\.6/);

    const icon = await fetch(`${origin}/assets/icon-192.png`);
    assert.equal(icon.status, 200);
    assert.equal(icon.headers.get("content-type"), "image/png");
    assert.ok((await icon.arrayBuffer()).byteLength > 1_000);

    const worker = await fetch(`${origin}/service-worker.js`, { method: "HEAD" });
    assert.equal(worker.status, 200);
    assert.equal(worker.headers.get("service-worker-allowed"), "/");
    assert.match(worker.headers.get("cache-control") ?? "", /must-revalidate/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Replit server rejects unsupported methods and never escapes the project root", async () => {
  const { server, origin } = await startServer();
  try {
    const post = await fetch(`${origin}/`, { method: "POST" });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get("allow"), "GET, HEAD");

    const missing = await fetch(`${origin}/../../../../etc/passwd`);
    assert.equal(missing.status, 404);
    assert.doesNotMatch(await missing.text(), /root:x:/);

    for (const privatePath of ["/package.json", "/.git/config", "/tests/static-shell.test.js"]) {
      const privateResponse = await fetch(`${origin}${privatePath}`);
      assert.equal(privateResponse.status, 404, `${privatePath} must not be publicly served`);
    }

    const encodedTraversal = await fetch(`${origin}/assets/%2e%2e/package.json`);
    assert.ok(
      encodedTraversal.status === 403 || encodedTraversal.status === 404,
      "an allowlisted prefix must not expose a private root file",
    );
    assert.doesNotMatch(await encodedTraversal.text(), /\"scripts\"\s*:/);

    const malformed = await fetch(`${origin}/%E0%A4%A`);
    assert.equal(malformed.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
