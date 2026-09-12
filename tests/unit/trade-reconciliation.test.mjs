import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyTradeSubmissionError } from "../../lib/steady/trade-reconciliation.js";

const previousHash = "0x" + "aa".repeat(32);
const currentHash = "0x" + "bb".repeat(32);

describe("trade submission reconciliation", () => {
  it("never reuses a previous attempt hash", () => {
    const currentAttempt = {
      tradeAttemptId: "new",
      txHash: "",
      previousTxHash: previousHash,
      submissionStarted: true,
    };
    const result = classifyTradeSubmissionError({
      error: { message: "RPC timeout", previousAttemptHash: previousHash },
      attempt: currentAttempt,
    });
    assert.equal(result.tradeAttemptId, currentAttempt.tradeAttemptId);
    assert.equal(result.txHash, "");
    assert.notEqual(result.txHash, previousHash);
    assert.equal(result.receiptPollable, false);
    assert.equal(result.duplicateBlocked, true);
  });

  it("keeps a no-hash timeout UNKNOWN and duplicate-blocked", () => {
    const result = classifyTradeSubmissionError({
      error: new Error("wallet request timed out"),
      attempt: { tradeAttemptId: "current", submissionStarted: true, txHash: "" },
    });
    assert.deepEqual(result, {
      state: "UNKNOWN",
      tradeAttemptId: "current",
      txHash: "",
      duplicateBlocked: true,
      receiptPollable: false,
    });
  });

  it("polls only a valid hash belonging to the current attempt", () => {
    const result = classifyTradeSubmissionError({
      error: { data: { hash: currentHash }, message: "RPC timeout" },
      attempt: { tradeAttemptId: "current", submissionStarted: true, txHash: "" },
    });
    assert.equal(result.state, "UNKNOWN");
    assert.equal(result.txHash, currentHash);
    assert.equal(result.receiptPollable, true);
  });

  it("does not turn a pre-submission timeout into an unresolved write", () => {
    const result = classifyTradeSubmissionError({
      error: new Error("orderbook timeout"),
      attempt: { tradeAttemptId: "current", submissionStarted: false, txHash: "" },
    });
    assert.equal(result.state, "FAILED");
    assert.equal(result.duplicateBlocked, false);
  });
});
