import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  beginRedemption,
  redemptionButtonDisabled,
  redemptionStateAfterSubmissionError,
  redemptionStateAfterReceipt,
  redemptionStateAfterReconcile,
  countMatchingClaims,
  canRetryReconciliation,
  redemptionReconciliationState,
} from "../../lib/steady/redemption-state.js";

describe("redemption state", () => {
  it("prevents duplicate actions while submission is unresolved", () => {
    const first = beginRedemption("READY");
    assert.deepEqual(first, { started: true, state: "SUBMITTING" });
    assert.deepEqual(beginRedemption(first.state), { started: false, state: "SUBMITTING" });
    assert.equal(redemptionButtonDisabled("SUBMITTING"), true);
    assert.equal(redemptionButtonDisabled("UNKNOWN"), true);
    assert.equal(redemptionButtonDisabled("CONFIRMED"), true);
    assert.equal(redemptionButtonDisabled("RECONCILING"), true);
    assert.equal(redemptionButtonDisabled("REDEEMED"), true);
    assert.equal(redemptionButtonDisabled("READY"), false);
  });

  it("keeps receipt confirmation distinct from redeemed", () => {
    assert.equal(redemptionStateAfterReceipt("success"), "CONFIRMED");
    assert.equal(redemptionStateAfterReceipt("reverted"), "FAILED");
    assert.equal(redemptionStateAfterReceipt("pending"), "UNKNOWN");
    assert.equal(redemptionStateAfterReconcile({ receiptStatus: "success", claimsRemaining: 0, scanComplete: true }), "REDEEMED");
    assert.equal(redemptionStateAfterReconcile({ receiptStatus: "success", claimsRemaining: 1, scanComplete: true }), "CONFIRMED");
    assert.equal(redemptionStateAfterReconcile({ receiptStatus: "success", claimsRemaining: 0, scanComplete: false }), "UNKNOWN");
    assert.equal(canRetryReconciliation("UNKNOWN", true), true);
    assert.equal(canRetryReconciliation("UNKNOWN", false), false);
  });

  it("exposes reconciliation as a distinct non-terminal state", () => {
    assert.equal(redemptionReconciliationState(), "RECONCILING");
    assert.equal(redemptionStateAfterReconcile({ receiptStatus: "success", claimsRemaining: 0, scanComplete: false }), "UNKNOWN");
    assert.equal(canRetryReconciliation("RECONCILING", true), false);
  });

  it("classifies timeout outcomes by whether a transaction hash is known", () => {
    assert.equal(redemptionStateAfterSubmissionError({ timedOut: true, txHashKnown: true }), "UNKNOWN");
    assert.equal(redemptionStateAfterSubmissionError({ timedOut: true, txHashKnown: false }), "FAILED");
    assert.equal(redemptionStateAfterSubmissionError({ timedOut: false, txHashKnown: true }), "FAILED");
  });

  it("keeps repeated UNKNOWN retries on the verification path without a new submission", () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      assert.equal(canRetryReconciliation("UNKNOWN", true), true);
      assert.deepEqual(beginRedemption("UNKNOWN"), { started: false, state: "UNKNOWN" });
    }
  });

  it("counts only positive claims matching submitted market and outcome entries", () => {
    const entries = [
      { marketId: "0xAA", outcomeIdx: 0, amount: 100n },
      { marketId: "0xbb", outcomeIdx: 1, amount: 200n },
    ];
    const claims = [
      { marketId: "0xaa", outcomeIdx: 0, amount: 1n },
      { marketId: "0xBB", outcomeIdx: 1, amount: "2" },
      { marketId: "0xcc", outcomeIdx: 0, amount: 9n },
      { marketId: "0xaa", outcomeIdx: 0, amount: 0n },
    ];
    assert.equal(countMatchingClaims(claims, entries), 2);
  });
});
