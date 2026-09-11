import test from "node:test";
import assert from "node:assert/strict";
// Node 18 cannot import the standalone `.ts` helper directly. The active
// browser resolver is the shipped JS module below; the TS helper
// (`lib/steady/lifecycle.ts`) was source-verified to also return "UNKNOWN"
// for unmapped statuses and is not modified here.
import { resolvePositionState } from "../../lib/steady/position-state.js";

test("lifecycle mapping fails closed for unknown protocol status", async (t) => {
  await t.test("unknown status is UNKNOWN, not SETTLING", () => {
    assert.equal(resolvePositionState({ status: 99 }), "UNKNOWN");
  });

  await t.test("known trading status remains LIVE", () => {
    assert.equal(resolvePositionState({ status: 1 }), "LIVE");
  });
});
