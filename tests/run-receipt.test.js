import test from "node:test";
import assert from "node:assert/strict";

import { createLocalRunReceipt } from "../src/core/run-receipt.js";

test("prototype receipts can never be mistaken for token claims", () => {
  const receipt = createLocalRunReceipt(
    { roomsCleared: 6, bossDefeated: true, score: 3_000 },
    { idFactory: () => "test-id", now: () => "2026-08-19T00:00:00.000Z" },
  );

  assert.equal(receipt.id, "test-id");
  assert.equal(receipt.authority, "local-prototype");
  assert.equal(receipt.chain, "none");
  assert.equal(receipt.claimable, false);
  assert.equal(Object.isFrozen(receipt), true);
});
