export const REDEMPTION_STATES = Object.freeze(["READY", "SUBMITTING", "CONFIRMED", "RECONCILING", "UNKNOWN", "FAILED", "REDEEMED"]);

export function redemptionButtonDisabled(state) {
  return state === "SUBMITTING" || state === "UNKNOWN" || state === "CONFIRMED" || state === "RECONCILING" || state === "REDEEMED";
}

export function beginRedemption(state) {
  if (redemptionButtonDisabled(state)) return { started: false, state };
  return { started: true, state: "SUBMITTING" };
}

export function redemptionStateAfterSubmissionError({ timedOut, txHashKnown }) {
  return timedOut && txHashKnown ? "UNKNOWN" : "FAILED";
}

export function redemptionStateAfterScan({ complete, claimableCount }) {
  if (!complete) return { state: "READY", outcome: "INCOMPLETE" };
  if (claimableCount <= 0) return { state: "READY", outcome: "EMPTY" };
  return { state: "SUBMITTING", outcome: "CLAIMS_FOUND" };
}

export function redemptionStateAfterReceipt(status) {
  if (status === "success" || status === 1 || status === "0x1") return "CONFIRMED";
  if (status === "reverted" || status === 0 || status === "0x0") return "FAILED";
  return "UNKNOWN";
}

export function redemptionStateAfterReconcile({ receiptStatus, claimsRemaining, scanComplete }) {
  const receiptState = redemptionStateAfterReceipt(receiptStatus);
  if (receiptState === "FAILED") return "FAILED";
  if (receiptState !== "CONFIRMED") return "UNKNOWN";
  if (!scanComplete) return "UNKNOWN";
  return claimsRemaining === 0 ? "REDEEMED" : "CONFIRMED";
}

export function redemptionReconciliationState() {
  return "RECONCILING";
}

export function canRetryReconciliation(state, txHashKnown) {
  return state === "UNKNOWN" && txHashKnown === true;
}

export function countMatchingClaims(claims, entries) {
  const keys = new Set((Array.isArray(entries) ? entries : []).map((entry) =>
    `${String(entry?.marketId || "").toLowerCase()}:${Number(entry?.outcomeIdx)}`));
  let count = 0;
  for (const claim of Array.isArray(claims) ? claims : []) {
    let positive = false;
    try { positive = BigInt(claim?.amount ?? 0) > 0n; } catch {}
    const key = `${String(claim?.marketId || "").toLowerCase()}:${Number(claim?.outcomeIdx)}`;
    if (positive && keys.has(key)) count += 1;
  }
  return count;
}
