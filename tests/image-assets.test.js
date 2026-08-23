import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateImageDirectory,
  validatePngBuffer,
} from "../scripts/validate-images.mjs";

const root = process.cwd();

test("every runtime PNG and JPEG has a complete decodable payload", () => {
  const result = validateImageDirectory(join(root, "assets"));
  assert.ok(result.files.length >= 140);
  assert.deepEqual(result.failures, []);
});

test("deep PNG validation rejects a truncated runtime sprite", () => {
  const source = readFileSync(join(root, "assets/enemies/pressure-widow.png"));
  assert.throws(
    () => validatePngBuffer(source.subarray(0, 12_800), "truncated-pressure-widow.png"),
    /truncated|incomplete|cannot be inflated|invalid CRC/,
  );
});
