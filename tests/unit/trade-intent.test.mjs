import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildTradeIntent,
  buildSideIntents,
  buildIocOrder,
  intentDisplay,
  classifyClaimScan,
  classifyPlaceOrderResult,
  classifyIndexedFillEvidence,
  summarizeOrderFills,
  formatPolicyProof,
} from "../../lib/steady/trade-intent.js";

const params = { tickSize: 1000n, lotSize: 1000n, minQuantity: 1000n };
const future = Math.floor(Date.now() / 1000) + 600;

function book(overrides = {}) {
  return {
    yesBids: [{ price: 550000n, quantity: 100000000n }],
    yesAsks: [{ price: 600000n, quantity: 100000000n }],
    noAsks: [{ price: 300000n, quantity: 100000000n }],
    ...overrides,
  };
}

describe("canonical trade intent", () => {
  it("prices UP and DOWN from their side-specific asks", () => {
    const up = buildTradeIntent({
      side: "BUY_YES", maxLossHuman: 25, book: book(), params,
      marketStatus: 1, expirySec: future, availableBalanceRaw: 100000000n,
    });
    const down = buildTradeIntent({
      side: "BUY_NO", maxLossHuman: 25, book: book(), params,
      marketStatus: 1, expirySec: future, availableBalanceRaw: 100000000n,
    });
    assert.equal(up.ok, true);
    assert.equal(down.ok, true);
    assert.equal(up.yesPriceRaw, 620000n);
    assert.equal(down.yesPriceRaw, 680000n);
    assert.equal(up.sidePriceRaw, 620000n);
    assert.equal(down.sidePriceRaw, 320000n);
    assert.notEqual(up.payRaw, down.payRaw);
  });

  it("denies a wide spread from the fresh book", () => {
    const result = buildTradeIntent({
      side: "BUY_YES", maxLossHuman: 2,
      book: book({ yesBids: [{ price: 100000n }], yesAsks: [{ price: 400000n }] }),
      params, marketStatus: 1, expirySec: future,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "SPREAD_TOO_WIDE");
  });

  it("fails closed when status is unavailable or locked", () => {
    const unavailable = buildTradeIntent({ side: "BUY_YES", maxLossHuman: 2, book: book(), params, marketStatus: null, expirySec: future });
    const locked = buildTradeIntent({ side: "BUY_YES", maxLossHuman: 2, book: book(), params, marketStatus: 2, expirySec: future });
    assert.equal(unavailable.code, "STATUS_UNAVAILABLE");
    assert.equal(locked.code, "MARKET_NOT_TRADING");
  });

  it("denies an empty side instead of constructing a fallback price", () => {
    const result = buildTradeIntent({
      side: "BUY_NO", maxLossHuman: 2,
      book: book({ noAsks: [] }), params, marketStatus: 1, expirySec: future,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "NO_LIQUIDITY");
  });

  it("accounts for aggregate executable depth on both directions", () => {
    const levels = { yesAsks: [{ price: 600000n, quantity: 1000000n }, { price: 620000n, quantity: 50000000n }] };
    const up = buildTradeIntent({ side: "BUY_YES", maxLossHuman: 25, book: book(levels), params, marketStatus: 1, expirySec: future, availableBalanceRaw: 100000000n });
    assert.equal(up.ok, true);
    assert.equal(up.bookDepthRaw, 51000000n);

    const downBook = book({ noAsks: [{ price: 300000n, quantity: 1000000n }, { price: 320000n, quantity: 80000000n }] });
    const down = buildTradeIntent({ side: "BUY_NO", maxLossHuman: 25, book: downBook, params, marketStatus: 1, expirySec: future, availableBalanceRaw: 100000000n });
    assert.equal(down.ok, true);
    assert.equal(down.bookDepthRaw, 81000000n);
  });

  it("fails closed with DEPTH_INSUFFICIENT instead of reducing quantity", () => {
    const up = buildTradeIntent({ side: "BUY_YES", maxLossHuman: 25, book: book({ yesAsks: [{ price: 600000n, quantity: 1000000n }] }), params, marketStatus: 1, expirySec: future, availableBalanceRaw: 100000000n });
    assert.equal(up.ok, false);
    assert.equal(up.code, "DEPTH_INSUFFICIENT");
    const down = buildTradeIntent({ side: "BUY_NO", maxLossHuman: 25, book: book({ noAsks: [{ price: 300000n, quantity: 1000000n }] }), params, marketStatus: 1, expirySec: future, availableBalanceRaw: 100000000n });
    assert.equal(down.ok, false);
    assert.equal(down.code, "DEPTH_INSUFFICIENT");
  });

  it("fails closed when a depth level is malformed", () => {
    const result = buildTradeIntent({
      side: "BUY_YES", maxLossHuman: 2,
      book: book({ yesAsks: [{ price: 600000n, quantity: 100000000n }, { price: "not-an-integer", quantity: 100000000n }] }),
      params, marketStatus: 1, expirySec: future, availableBalanceRaw: 100000000n,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "DEPTH_UNKNOWN");
  });

  it("denies a malformed best price without throwing", () => {
    const result = buildTradeIntent({
      side: "BUY_YES", maxLossHuman: 2,
      book: book({ yesAsks: [{ price: "not-an-integer", quantity: 100000000n }] }),
      params, marketStatus: 1, expirySec: future, availableBalanceRaw: 100000000n,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INVALID_BOOK");
  });

  it("binds executable policy proof to the fresh balance result", () => {
    const fresh = buildTradeIntent({ side: "BUY_YES", maxLossHuman: 2, book: book(), params, marketStatus: 1, expirySec: future, availableBalanceRaw: 10000000n, requireBalance: true });
    assert.equal(fresh.ok, true);
    assert.deepEqual(fresh.checks.find((check) => check.rule === "balance"), { rule: "balance", pass: true, code: "OK" });
    assert.match(formatPolicyProof([...fresh.checks, { rule: "cooldown(2-loss)", pass: true, code: "OK" }]), /balance:OK/);

    const unavailable = buildTradeIntent({ side: "BUY_YES", maxLossHuman: 2, book: book(), params, marketStatus: 1, expirySec: future, requireBalance: true });
    assert.equal(unavailable.ok, false);
    assert.equal(unavailable.code, "BALANCE_UNAVAILABLE");
  });

  it("keeps ticket values identical to order parameters for both UP and DOWN", () => {
    for (const side of ["BUY_YES", "BUY_NO"]) {
      const intent = buildTradeIntent({
        side, maxLossHuman: 25, book: book(), params,
        marketStatus: 1, expirySec: future, availableBalanceRaw: 100000000n,
      });
      const display = intentDisplay(intent);
      const order = buildIocOrder(intent, "0x" + "12".repeat(20), 1234567890000000000n);
      assert.equal(order.side, side);
      assert.equal(order.price, intent.yesPriceRaw);
      assert.equal(order.quantity, intent.quantityRaw);
      assert.equal(display.pay, (Number(order.quantity) * Number(intent.sidePriceRaw) / 1e12).toFixed(2));
      assert.equal(display.payout, (Number(intent.payoutRaw) / 1e6).toFixed(2));
      assert.equal(display.quantity, (Number(order.quantity) / 1e6).toFixed(3));
      assert.equal(display.probability, (Number(intent.sidePriceRaw) / 1e6).toFixed(3));
    }
  });

  it("keeps fresh UP and DOWN display slots side-correct when BUY_NO is clicked", () => {
    const intents = buildSideIntents({
      maxLossHuman: 25,
      book: book(),
      params,
      marketStatus: 1,
      expirySec: future,
      availableBalanceRaw: 100000000n,
    });
    assert.equal(intents.BUY_YES.side, "BUY_YES");
    assert.equal(intents.BUY_NO.side, "BUY_NO");
    assert.equal(intents.BUY_YES.sidePriceRaw, 620000n);
    assert.equal(intents.BUY_NO.sidePriceRaw, 320000n);
    assert.notEqual(intents.BUY_YES.quantityRaw, intents.BUY_NO.quantityRaw);
  });

  it("denies on the fresh execution snapshot even when the preview snapshot was wide enough", () => {
    const previewBook = book({ yesBids: [{ price: 500000n, quantity: 100000000n }], yesAsks: [{ price: 600000n, quantity: 100000000n }] });
    const freshBook = book({ yesBids: [{ price: 100000n, quantity: 100000000n }], yesAsks: [{ price: 400000n, quantity: 100000000n }] });
    const preview = buildTradeIntent({ side: "BUY_YES", maxLossHuman: 2, book: previewBook, params, marketStatus: 1, expirySec: future });
    const fresh = buildTradeIntent({ side: "BUY_YES", maxLossHuman: 2, book: freshBook, params, marketStatus: 1, expirySec: future });
    assert.equal(preview.ok, true);
    assert.equal(fresh.ok, false);
    assert.equal(fresh.code, "SPREAD_TOO_WIDE");
    assert.throws(() => buildIocOrder(fresh, "0x" + "12".repeat(20), 123n), /denied intent/);
  });

  it("marks a confirmed order only when an order id or acceptance evidence exists", () => {
    assert.equal(classifyPlaceOrderResult({ receipt: { status: "success" }, fills: [] }).orderAccepted, false);
    assert.equal(classifyPlaceOrderResult({ receipt: { status: "success" }, orderId: 7n, fills: [] }).orderAccepted, true);
  });
});

describe("execution evidence classification", () => {
  it("distinguishes a confirmed zero-fill IOC from a fill", () => {
    assert.deepEqual(
      classifyPlaceOrderResult({ receipt: { status: "success" }, fills: [] }),
      { state: "NO_FILL", transactionConfirmed: true, orderAccepted: false, fillVerified: false },
    );
    const filled = classifyPlaceOrderResult({ receipt: { status: "success" }, fills: [{ quantityFilled: 1000n, fillPrice: 500000n }] });
    assert.equal(filled.state, "FILLED");
    assert.equal(filled.orderAccepted, true);
    assert.equal(
      classifyPlaceOrderResult({ receipt: {}, status: "success", fills: [] }).state,
      "NO_FILL",
    );
  });

  it("distinguishes full, partial, zero, and unknown fill quantities", () => {
    const full = classifyPlaceOrderResult({ receipt: { status: "success" }, side: "BUY_YES", requestedQuantityRaw: 1000n, fills: [{ quantityFilled: 1000n, fillPrice: 500000n }] });
    assert.equal(full.state, "FILLED");
    const partial = classifyPlaceOrderResult({ receipt: { status: "success" }, side: "BUY_YES", requestedQuantityRaw: 1000n, fills: [{ quantityFilled: 400n, fillPrice: 500000n }] });
    assert.equal(partial.state, "PARTIAL_FILL");
    const partialSummary = summarizeOrderFills("BUY_YES", [{ quantityFilled: 400n, fillPrice: 500000n }], 1000n);
    assert.deepEqual({ filled: partialSummary.filled, filledQuantityRaw: partialSummary.filledQuantityRaw, remainingQuantityRaw: partialSummary.remainingQuantityRaw, state: partialSummary.state }, { filled: true, filledQuantityRaw: 400n, remainingQuantityRaw: 600n, state: "PARTIAL_FILL" });
    const zero = classifyPlaceOrderResult({ receipt: { status: "success" }, side: "BUY_YES", requestedQuantityRaw: 1000n, fills: [] });
    assert.equal(zero.state, "NO_FILL");
    const unknown = classifyPlaceOrderResult({ receipt: { status: "success" }, side: "BUY_YES", requestedQuantityRaw: 1000n });
    assert.equal(unknown.state, "FILL_UNKNOWN");
  });

  it("does not upgrade a late receipt without matching indexed fill evidence", () => {
    assert.deepEqual(
      classifyIndexedFillEvidence([], "0x" + "ab".repeat(32)),
      { state: "FILL_UNKNOWN", matchedCount: 0, quantityRaw: 0n },
    );
    assert.equal(
      classifyIndexedFillEvidence([
        { txHash: "0x" + "ab".repeat(32), quantity: "1000", fillPrice: "500000" },
        { txHash: "0x" + "cd".repeat(32), quantity: "9000" },
      ], "0x" + "ab".repeat(32)).state,
      "FILL_VERIFIED",
    );
  });

  it("never treats an incomplete claim scan as an empty wallet", () => {
    assert.equal(classifyClaimScan({ indexerSucceeded: false, knownMarketCount: 0, claimableCount: 0 }).state, "INCOMPLETE");
    assert.equal(classifyClaimScan({ indexerSucceeded: false, knownMarketCount: 2, claimableCount: 0 }).state, "INCOMPLETE");
    assert.equal(classifyClaimScan({ indexerSucceeded: true, knownMarketCount: 0, claimableCount: 0 }).state, "COMPLETE_EMPTY");
    const partial = classifyClaimScan({ indexerSucceeded: false, knownMarketCount: 2, claimableCount: 1, attemptedCount: 2, completedCount: 2 });
    assert.equal(partial.state, "PARTIAL_WITH_CLAIMS");
    assert.equal(partial.complete, false);
    assert.equal(partial.source, "KNOWN_MARKETS_FALLBACK");
    assert.equal(classifyClaimScan({ indexerSucceeded: false, knownMarketCount: 2, claimableCount: 1, attemptedCount: 2, completedCount: 1 }).state, "INCOMPLETE");
  });
});
