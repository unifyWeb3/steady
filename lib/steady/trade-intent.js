export const ONE_6 = 1_000_000n;
export const MAX_SPREAD_RAW = 150_000n;

function asBigInt(value, label) {
  try {
    return BigInt(value);
  } catch {
    throw new Error(`${label} is not a valid integer`);
  }
}

function firstLevel(levels) {
  return Array.isArray(levels) && levels.length ? levels[0] : null;
}

function executableDepth(levels, limitRaw, label) {
  if (!Array.isArray(levels)) return { ok: false, total: 0n, reason: `${label} levels are unavailable` };
  let total = 0n;
  for (const level of levels) {
    try {
      const price = asBigInt(level?.price, `${label} price`);
      const quantity = asBigInt(level?.quantity ?? 0, `${label} quantity`);
      if (price < 0n || quantity < 0n) throw new Error(`${label} contains a negative level`);
      if (price <= limitRaw) total += quantity;
    } catch (error) {
      return { ok: false, total: 0n, reason: error.message || `${label} level is invalid` };
    }
  }
  return { ok: true, total };
}

function fail(code, reason, checks = []) {
  return { ok: false, code, reason, checks };
}

export function buildTradeIntent({
  side,
  maxLossHuman,
  book,
  params,
  marketStatus,
  expirySec,
  nowSec = Math.floor(Date.now() / 1000),
  availableBalanceRaw,
  requireBalance = false,
  maxSpreadRaw = MAX_SPREAD_RAW,
}) {
  const checks = [];
  if (side !== "BUY_YES" && side !== "BUY_NO") {
    return fail("INVALID_SIDE", `Unsupported side ${String(side)}`, checks);
  }
  if (!Number.isFinite(maxLossHuman) || maxLossHuman <= 0) {
    return fail("INVALID_MAX_LOSS", "Enter a max loss greater than zero", checks);
  }
  if (!book) {
    return fail("BOOK_UNAVAILABLE", "A fresh orderbook is unavailable; execution is denied", checks);
  }
  if (!params) {
    return fail("BOOK_PARAMS_UNAVAILABLE", "Book parameters are unavailable; execution is denied", checks);
  }

  if (marketStatus !== 1) {
    checks.push({ rule: "marketStatus", pass: false, code: "STATUS_UNAVAILABLE" });
    const reason = marketStatus === null || marketStatus === undefined
      ? "Market status is unavailable and cannot authorize a trade"
      : `Market is not Trading (status ${marketStatus})`;
    return fail(marketStatus === null || marketStatus === undefined ? "STATUS_UNAVAILABLE" : "MARKET_NOT_TRADING", reason, checks);
  }
  checks.push({ rule: "marketStatus", pass: true, code: "OK" });

  const headroomSec = Number(expirySec) - Number(nowSec);
  if (!Number.isFinite(headroomSec) || headroomSec < 60) {
    checks.push({ rule: "headroom", pass: false, code: "WINDOW_CLOSED" });
    return fail("WINDOW_CLOSED", "Market locks in less than 60 seconds", checks);
  }
  checks.push({ rule: "headroom", pass: true, code: "OK" });

  const yesAsk = firstLevel(book.yesAsks);
  const noAsk = firstLevel(book.noAsks);
  const yesBid = firstLevel(book.yesBids);
  const sideAsk = side === "BUY_YES" ? yesAsk : noAsk;
  if (!sideAsk) {
    checks.push({ rule: "liquidity", pass: false, code: "NO_LIQUIDITY" });
    return fail(
      "NO_LIQUIDITY",
      `No ${side === "BUY_YES" ? "UP (YES)" : "DOWN (NO)"} liquidity on this window`,
      checks,
    );
  }
  checks.push({ rule: "liquidity", pass: true, code: "OK" });

  if (!yesBid || !yesAsk) {
    checks.push({ rule: "spread", pass: false, code: "SPREAD_UNKNOWN" });
    return fail("SPREAD_UNKNOWN", "Current spread cannot be verified", checks);
  }

  let spreadRaw;
  try {
    spreadRaw = asBigInt(yesAsk.price, "YES ask") - asBigInt(yesBid.price, "YES bid");
  } catch {
    checks.push({ rule: "spread", pass: false, code: "INVALID_BOOK" });
    return fail("INVALID_BOOK", "Current orderbook contains an invalid price", checks);
  }
  if (spreadRaw < 0n) {
    checks.push({ rule: "spread", pass: false, code: "INVALID_BOOK" });
    return fail("INVALID_BOOK", "Current orderbook is crossed or malformed", checks);
  }
  if (spreadRaw > maxSpreadRaw) {
    checks.push({ rule: "spread", pass: false, code: "SPREAD_TOO_WIDE" });
    return fail(
      "SPREAD_TOO_WIDE",
      `Spread ${(Number(spreadRaw) / 1e6).toFixed(3)} exceeds ${(Number(maxSpreadRaw) / 1e6).toFixed(3)}`,
      checks,
    );
  }
  checks.push({ rule: "spread", pass: true, code: "OK" });

  let tick, lot, minQuantity;
  try {
    tick = asBigInt(params.tickSize, "tickSize");
    lot = asBigInt(params.lotSize, "lotSize");
    minQuantity = asBigInt(params.minQuantity, "minQuantity");
  } catch {
    return fail("INVALID_BOOK_PARAMS", "Tick, lot, and minimum quantity must be valid integers", checks);
  }
  if (tick <= 0n || lot <= 0n || minQuantity <= 0n) {
    return fail("INVALID_BOOK_PARAMS", "Tick, lot, and minimum quantity must be positive", checks);
  }

  let askRaw;
  try {
    askRaw = asBigInt(sideAsk.price, "side ask");
  } catch {
    checks.push({ rule: "liquidity", pass: false, code: "INVALID_BOOK" });
    return fail("INVALID_BOOK", "Selected-side orderbook price is invalid", checks);
  }
  const unsnappedYesPrice = side === "BUY_YES"
    ? askRaw + 20_000n
    : ONE_6 - (askRaw + 20_000n);
  const yesPriceRaw = (unsnappedYesPrice / tick) * tick;
  if (yesPriceRaw <= 0n || yesPriceRaw >= ONE_6) {
    return fail("INVALID_PRICE", `Executable YES price ${yesPriceRaw} is outside (0, 1)`, checks);
  }

  const sidePriceRaw = side === "BUY_YES" ? yesPriceRaw : ONE_6 - yesPriceRaw;
  const maxLossRaw = BigInt(Math.round(maxLossHuman * 1e6));
  let quantityRaw = (maxLossRaw * ONE_6) / sidePriceRaw;
  quantityRaw = (quantityRaw / lot) * lot;
  if (quantityRaw < minQuantity) {
    checks.push({ rule: "quantity", pass: false, code: "QUANTITY_TOO_SMALL" });
    return fail(
      "QUANTITY_TOO_SMALL",
      `Quantity ${(Number(quantityRaw) / 1e6).toFixed(3)} is below minimum ${(Number(minQuantity) / 1e6).toFixed(3)}`,
      checks,
    );
  }
  checks.push({ rule: "quantity", pass: true, code: "OK" });

  const depthLevels = side === "BUY_YES" ? book.yesAsks : book.noAsks;
  const depthResult = executableDepth(depthLevels, sidePriceRaw, side === "BUY_YES" ? "YES ask" : "NO ask");
  if (!depthResult.ok) {
    checks.push({ rule: "depth", pass: false, code: "DEPTH_UNKNOWN" });
    return fail("DEPTH_UNKNOWN", "Executable orderbook depth could not be verified", checks);
  }
  const depthRaw = depthResult.total;
  if (depthRaw < quantityRaw) {
    checks.push({ rule: "depth", pass: false, code: "DEPTH_INSUFFICIENT", availableRaw: depthRaw, requiredRaw: quantityRaw });
    return fail(
      "DEPTH_INSUFFICIENT",
      `Only ${(Number(depthRaw) / 1e6).toFixed(3)} ${side === "BUY_YES" ? "UP" : "DOWN"} contracts are executable at the submitted limit; ${(Number(quantityRaw) / 1e6).toFixed(3)} requested`,
      checks,
    );
  }
  checks.push({ rule: "depth", pass: true, code: "OK", availableRaw: depthRaw, requiredRaw: quantityRaw });

  const payRaw = (quantityRaw * sidePriceRaw) / ONE_6;
  if (availableBalanceRaw !== undefined && availableBalanceRaw !== null) {
    const balanceRaw = asBigInt(availableBalanceRaw, "available balance");
    if (balanceRaw < payRaw) {
      checks.push({ rule: "balance", pass: false, code: "INSUFFICIENT_BALANCE" });
      return fail(
        "INSUFFICIENT_BALANCE",
        `Need ${(Number(payRaw) / 1e6).toFixed(2)} tUSDC but have ${(Number(balanceRaw) / 1e6).toFixed(2)}`,
        checks,
      );
    }
    checks.push({ rule: "balance", pass: true, code: "OK" });
  } else {
    if (requireBalance) {
      checks.push({ rule: "balance", pass: false, code: "BALANCE_UNAVAILABLE" });
      return fail("BALANCE_UNAVAILABLE", "A fresh collateral balance is required before signing", checks);
    }
    checks.push({ rule: "balance", pass: null, code: "BALANCE_UNKNOWN" });
  }

  const payoutRaw = quantityRaw;
  return {
    ok: true,
    side,
    yesPriceRaw,
    sidePriceRaw,
    quantityRaw,
    maxLossRaw,
    payRaw,
    payoutRaw,
    profitRaw: payoutRaw - payRaw,
    spreadRaw,
    bookDepthRaw: depthRaw,
    tickSize: tick,
    lotSize: lot,
    minQuantity,
    headroomSec,
    checks,
  };
}

// Build both user-facing directions from one market snapshot. The caller can
// choose either result for execution, while the UI always receives correctly
// side-labeled values even when the clicked action is BUY_NO.
export function buildSideIntents({
  maxLossHuman,
  book,
  params,
  marketStatus,
  expirySec,
  nowSec,
  availableBalanceRaw,
  requireBalance,
  maxSpreadRaw,
}) {
  const common = { maxLossHuman, book, params, marketStatus, expirySec, nowSec, availableBalanceRaw, requireBalance, maxSpreadRaw };
  return {
    BUY_YES: buildTradeIntent({ ...common, side: "BUY_YES" }),
    BUY_NO: buildTradeIntent({ ...common, side: "BUY_NO" }),
  };
}

export function formatPolicyProof(checks) {
  return (Array.isArray(checks) ? checks : []).map((check) => `${String(check?.rule || "unknown")}:${String(check?.code || "UNKNOWN")}`).join(" · ");
}

export function intentDisplay(intent) {
  if (!intent?.ok) {
    return { available: false, summary: intent?.reason || "Unavailable", buttonAmount: null };
  }
  const pay = (Number(intent.payRaw) / 1e6).toFixed(2);
  const payout = (Number(intent.payoutRaw) / 1e6).toFixed(2);
  const profit = (Number(intent.profitRaw) / 1e6).toFixed(2);
  const quantity = (Number(intent.quantityRaw) / 1e6).toFixed(3);
  const probability = (Number(intent.sidePriceRaw) / 1e6).toFixed(3);
  return {
    available: true,
    pay,
    payout,
    profit,
    quantity,
    probability,
    buttonAmount: pay,
    summary: `Pay ${pay} → ${payout} · profit +${profit} · ${quantity} contracts @ ${probability}`,
  };
}

// The order submitted to DreamDEX is derived from the same intent rendered in
// the ticket. Keeping this pure makes preview/order drift testable without a
// wallet, browser, or protocol mock.
export function buildIocOrder(intent, pool, expireTimestampNs) {
  if (!intent?.ok) throw new Error("Cannot build an order from a denied intent");
  if (typeof pool !== "string" || !pool) throw new Error("Order pool is required");
  const expiry = asBigInt(expireTimestampNs, "expireTimestampNs");
  if (expiry <= 0n) throw new Error("expireTimestampNs must be positive");
  return {
    pool,
    side: intent.side,
    price: intent.yesPriceRaw,
    quantity: intent.quantityRaw,
    orderType: 2,
    expireTimestampNs: expiry,
  };
}

export function summarizeOrderFills(side, fills, requestedQuantityRaw, evidenceKnown = true) {
  let requestedRaw = null;
  if (requestedQuantityRaw !== undefined && requestedQuantityRaw !== null) {
    requestedRaw = asBigInt(requestedQuantityRaw, "requested quantity");
  }
  let quantityRaw = 0n;
  let yesNotionalRaw = 0n;
  if (!evidenceKnown) {
    return {
      filled: false,
      state: "FILL_UNKNOWN",
      quantityRaw: 0n,
      filledQuantityRaw: 0n,
      requestedQuantityRaw: requestedRaw,
      remainingQuantityRaw: requestedRaw,
    };
  }
  for (const fill of Array.isArray(fills) ? fills : []) {
    const quantity = asBigInt(fill?.quantityFilled ?? 0, "fill quantity");
    const yesPrice = asBigInt(fill?.fillPrice ?? 0, "fill price");
    quantityRaw += quantity;
    yesNotionalRaw += quantity * yesPrice;
  }
  if (quantityRaw <= 0n) {
    return {
      filled: false,
      state: requestedRaw === null ? "NO_FILL" : "NO_FILL",
      quantityRaw: 0n,
      filledQuantityRaw: 0n,
      requestedQuantityRaw: requestedRaw,
      remainingQuantityRaw: requestedRaw,
    };
  }
  const averageYesPriceRaw = yesNotionalRaw / quantityRaw;
  const averageSidePriceRaw = side === "BUY_NO" ? ONE_6 - averageYesPriceRaw : averageYesPriceRaw;
  const remainingQuantityRaw = requestedRaw === null ? null : requestedRaw > quantityRaw ? requestedRaw - quantityRaw : 0n;
  const state = requestedRaw === null || quantityRaw >= requestedRaw ? "FULL_FILL" : "PARTIAL_FILL";
  return { filled: true, state, quantityRaw, filledQuantityRaw: quantityRaw, requestedQuantityRaw: requestedRaw, remainingQuantityRaw, averageYesPriceRaw, averageSidePriceRaw };
}

export function classifyPlaceOrderResult(result) {
  const receipt = result?.receipt || result;
  const status = receipt?.status ?? result?.status;
  const fillsKnown = Array.isArray(result?.fills) || Array.isArray(receipt?.fills);
  const fills = Array.isArray(result?.fills) ? result.fills : (Array.isArray(receipt?.fills) ? receipt.fills : []);
  const requestedQuantityRaw = result?.requestedQuantityRaw ?? result?.quantityRaw ?? result?.order?.quantity;
  const fillVerified = fills.some((fill) => asBigInt(fill?.quantityFilled ?? 0, "fill quantity") > 0n);
  const orderAccepted = fillVerified || Boolean(
    (result?.orderId !== undefined && result?.orderId !== null)
      || (result?.order?.id !== undefined && result?.order?.id !== null)
      || (result?.acceptedOrderId !== undefined && result?.acceptedOrderId !== null)
      || result?.orderAccepted === true
      || (Array.isArray(result?.events) && result.events.some((event) =>
        /order.*(placed|accepted)|accepted.*order/i.test(String(event?.name ?? event?.type ?? "")))),
  );
  if (status === "reverted" || status === 0 || status === "0x0") {
    return { state: "FAILED", transactionConfirmed: true, orderAccepted, fillVerified: false };
  }
  const transactionConfirmed = status === "success" || status === 1 || status === "0x1";
  if (!transactionConfirmed) {
    return { state: "UNKNOWN", transactionConfirmed: false, orderAccepted, fillVerified: false };
  }
  const summary = summarizeOrderFills(result?.side ?? result?.order?.side, fills, requestedQuantityRaw, fillsKnown);
  if (summary.state === "FILL_UNKNOWN") {
    return { state: "FILL_UNKNOWN", transactionConfirmed: true, orderAccepted, fillVerified: false };
  }
  if (summary.state === "PARTIAL_FILL") {
    return { state: "PARTIAL_FILL", transactionConfirmed: true, orderAccepted: true, fillVerified: true };
  }
  return summary.filled
    ? { state: "FILLED", transactionConfirmed: true, orderAccepted, fillVerified: true }
    : { state: "NO_FILL", transactionConfirmed: true, orderAccepted, fillVerified: false };
}

// A receipt that arrived after an RPC timeout has no in-memory PlaceOrderResult.
// Only a positive fill quantity for the same transaction can upgrade it from
// transaction-confirmed to fill-verified; an empty/lagging indexer is unknown.
export function classifyIndexedFillEvidence(fills, txHash) {
  const target = String(txHash || "").toLowerCase();
  if (!target || !Array.isArray(fills)) return { state: "FILL_UNKNOWN", matchedCount: 0, quantityRaw: 0n };
  let matchedCount = 0;
  let quantityRaw = 0n;
  for (const fill of fills) {
    if (String(fill?.txHash || "").toLowerCase() !== target) continue;
    matchedCount += 1;
    try { quantityRaw += asBigInt(fill?.quantity ?? 0, "fill quantity"); } catch {}
  }
  return {
    state: quantityRaw > 0n ? "FILL_VERIFIED" : "FILL_UNKNOWN",
    matchedCount,
    quantityRaw,
  };
}

export function classifyClaimScan({ indexerSucceeded, knownMarketCount, claimableCount, attemptedCount = knownMarketCount, completedCount = 0 }) {
  const source = indexerSucceeded ? "INDEXER" : "KNOWN_MARKETS_FALLBACK";
  const state = indexerSucceeded
    ? (claimableCount > 0 ? "COMPLETE_WITH_CLAIMS" : "COMPLETE_EMPTY")
    : (attemptedCount > 0 && completedCount === attemptedCount && claimableCount > 0
      ? "PARTIAL_WITH_CLAIMS"
      : "INCOMPLETE");
  return {
    state,
    source,
    complete: indexerSucceeded,
    attemptedCount,
    completedCount,
    claimableCount,
  };
}
