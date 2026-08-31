import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const scanner = join(process.cwd(), "scripts", "secret-scan.mjs");

function scanFixture(files) {
  const directory = mkdtempSync(join(tmpdir(), "doffa-secret-scan-"));
  try {
    for (const [fileName, content] of Object.entries(files)) {
      const target = join(directory, fileName);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
    return spawnSync(process.execPath, [scanner], {
      cwd: directory,
      encoding: "utf8",
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("secret scanner passes a clean non-git source tree and allows env templates", () => {
  const result = scanFixture({
    "src/app.ts": "export const mode = 'local';\n",
    ".env.example": "API_KEY=replace-me\n",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Secret scan passed/);
});

test("secret scanner catches modern tokens and OpenSSH private key material", () => {
  const githubToken = ["github", `_pat_${"a".repeat(70)}`].join("");
  const privateKeyHeader = ["-----BEGIN", "OPENSSH PRIVATE KEY-----"].join(" ");
  const result = scanFixture({
    "src/runtime.ts": `const token = '${githubToken}';\n${privateKeyHeader}\n`,
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /GitHub token/);
  assert.match(result.stderr, /private key material/);
});

test("secret scanner rejects env variants and key containers even without text extensions", () => {
  const result = scanFixture({
    ".env.production": "MODE=production\n",
    "keys/signing.pem": "placeholder\n",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\.env\.production: sensitive filename/);
  assert.match(result.stderr, /keys\/signing\.pem: sensitive filename/);
});

test("secret scanner catches a Solana keypair array outside a suspicious filename", () => {
  const keypair = JSON.stringify(Array.from({ length: 64 }, (_, index) => index));
  const result = scanFixture({
    "src/local-config.json": keypair,
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Solana keypair byte array/);
});
