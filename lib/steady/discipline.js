// Browser-safe discipline state. Calls are normalized oldest-first before the
// trailing loss streak is derived, because the SDK fills read is newest-first.

export const COOLDOWN_MS = 3 * 60 * 1000;
export const LOSS_THRESHOLD = 2;

function comparable(value) {
  if (value === undefined || value === null || value === "") return null;
  try { return BigInt(value); } catch { return null; }
}

function compareRows(a, b) {
  const aTimestamp = comparable(a.call?.timestamp ?? a.call?.ts);
  const bTimestamp = comparable(b.call?.timestamp ?? b.call?.ts);
  if (aTimestamp !== null && bTimestamp !== null && aTimestamp !== bTimestamp) {
    return aTimestamp < bTimestamp ? -1 : 1;
  }

  const aBlock = comparable(a.call?.blockNumber);
  const bBlock = comparable(b.call?.blockNumber);
  if (aBlock !== null && bBlock !== null && aBlock !== bBlock) {
    return aBlock < bBlock ? -1 : 1;
  }

  const aLog = comparable(a.call?.logIndex);
  const bLog = comparable(b.call?.logIndex);
  if (aLog !== null && bLog !== null && aLog !== bLog) {
    return aLog < bLog ? -1 : 1;
  }

  return a.index - b.index;
}

export function normalizeCallsChronologically(calls) {
  return (Array.isArray(calls) ? calls : [])
    .map((call, index) => ({ call, index }))
    .sort(compareRows)
    .map(({ call }) => call);
}

function callKey(call, fallbackIndex) {
  for (const field of ["eventKey", "fillId", "id", "txHash"]) {
    const value = call?.[field];
    if (value !== undefined && value !== null && String(value) !== "") return `${field}:${String(value)}`;
  }
  const timestamp = call?.timestamp ?? call?.ts;
  if (timestamp !== undefined && timestamp !== null && String(timestamp) !== "") {
    return `timestamp:${String(timestamp)}:${call?.won === true ? "W" : "L"}`;
  }
  return `position:${fallbackIndex}:${call?.won === true ? "W" : "L"}`;
}

export function trailingLosses(calls) {
  const ordered = normalizeCallsChronologically(calls);
  const settled = ordered.filter((call) =>
    call && call.void !== true && call.voided !== true &&
    (call.won === true || call.won === false));
  let consecutiveLosses = 0;
  for (let index = settled.length - 1; index >= 0; index -= 1) {
    if (settled[index].won === false) consecutiveLosses += 1;
    else break;
  }
  const triggerIndex = consecutiveLosses >= LOSS_THRESHOLD
    ? settled.length - consecutiveLosses
    : -1;
  return {
    ordered,
    settled,
    consecutiveLosses,
    triggerKey: triggerIndex >= 0 ? callKey(settled[triggerIndex], triggerIndex) : null,
  };
}

function baseState(streak, cooldownUntilMs, cooldownKey, blocked, reason, resumeInSec) {
  const result = {
    consecutiveLosses: streak,
    cooldownUntilMs,
    cooldownKey,
    blocked,
  };
  if (reason) result.reason = reason;
  if (resumeInSec !== undefined) result.resumeInSec = resumeInSec;
  return result;
}

export function deriveDiscipline(calls, nowMs = Date.now(), existingCooldownMs = null, lastCooldownKey = null) {
  const now = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  const result = trailingLosses(calls);
  const existing = Number.isFinite(Number(existingCooldownMs)) ? Number(existingCooldownMs) : null;
  const previousKey = lastCooldownKey === undefined || lastCooldownKey === null || lastCooldownKey === ""
    ? null
    : String(lastCooldownKey);

  if (existing !== null && existing > now) {
    return baseState(
      result.consecutiveLosses,
      existing,
      previousKey || result.triggerKey,
      true,
      `${result.consecutiveLosses} consecutive losses - cooldown active`,
      Math.ceil((existing - now) / 1000),
    );
  }

  // The first loss in the current trailing streak identifies the streak. Once
  // it has fired, keeping that key prevents an unchanged old streak from
  // creating another cooldown after the original three minutes expire.
  if (result.consecutiveLosses >= LOSS_THRESHOLD && result.triggerKey !== previousKey) {
    const until = now + COOLDOWN_MS;
    return baseState(
      result.consecutiveLosses,
      until,
      result.triggerKey,
      true,
      `${result.consecutiveLosses} consecutive losses - 3 min cooldown`,
      COOLDOWN_MS / 1000,
    );
  }

  return baseState(result.consecutiveLosses, null, previousKey || result.triggerKey, false);
}

export function shouldBlockForCooldown(calls, cooldownUntilMs, nowMs = Date.now(), lastCooldownKey = null) {
  return deriveDiscipline(calls, nowMs, cooldownUntilMs, lastCooldownKey).blocked;
}
