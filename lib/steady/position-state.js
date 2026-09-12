// Browser-safe position resolver. Unknown protocol state is never inferred.
export function resolvePositionState(p = {}) {
  const yesBal = p.yesBalanceRaw ?? 0n;
  const noBal = p.noBalanceRaw ?? 0n;
  const accountSide = p.accountSide ?? p.takerSide ?? p.side;
  // An explicitly unresolved account side must never fall through to the NO
  // branch just because the side string is absent.
  if (accountSide === "UNKNOWN") return "UNKNOWN";
  const isYes = /YES/.test(String(accountSide ?? ""));
  const held = isYes ? yesBal : noBal;
  const voided = p.isVoided === true || p.status === 5;
  const settledResolved = p.isResolved === true || p.status === 4;
  const outcomeKnown = p.winningOutcome === 0 || p.winningOutcome === 1;
  let state;
  if (voided) state = (yesBal > 0n || noBal > 0n) ? "CLAIMABLE" : "VOID";
  else if (settledResolved && !outcomeKnown) state = "SETTLING";
  else if (settledResolved) state = ((p.winningOutcome === 0) === isYes) ? (held > 0n ? "CLAIMABLE" : "WON") : "LOST";
  else if (p.status === 2 || p.status === 3) state = "SETTLING";
  else if (p.status === 0 || p.status === 1) state = "LIVE";
  else state = "UNKNOWN";
  if (p.redeemed === true && state === "CLAIMABLE") state = voided ? "VOID" : "WON";
  return state;
}
