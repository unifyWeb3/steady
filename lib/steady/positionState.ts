// lib/steady/positionState.ts — pure fill → position-state resolver, no SDK
//
// The terminal tabs are ALL / LIVE / SETTLING / CLAIMABLE / WON / LOST / VOID.
// A fill row may only emit one of those six — anything else hides rows behind
// dead filters. Rules (deterministic, documented for the frontend session):
// - status: getMarketOnchain MarketStatus (0 Listed · 1 Trading · 2 Locked ·
//   3 Settling · 4 Resolved · 5 Voided; markets.d.ts:924).
// - winningOutcome is ONLY meaningful when isResolved (contract defaults 0 —
//   markets.d.ts:942-956). Unresolved markets must ignore it.
// - CLAIMABLE = settled winner with balance > 0, or voided with balance > 0
//   (void pays both sides half). WON/LOST = settled AND zero balance (closed).
// - redeemed=true demotes a CLAIMABLE to its closed form (WON or VOID) after the
//   redemption tx mines — caller tracks this per market+side.
// - Unknown status falls back to expiry: past expiry → SETTLING, else LIVE.
export type PositionTab = "LIVE" | "SETTLING" | "CLAIMABLE" | "WON" | "LOST" | "VOID";

export type FillPositionInput = {
  takerSide?: string;
  side?: string; // e.g. "BUY_YES" / "BUY_NO" / "SELL_YES" / "SELL_NO"
  status?: number | null;
  isResolved?: boolean;
  isVoided?: boolean;
  winningOutcome?: number | null; // 0 = YES, 1 = NO — only when isResolved
  yesBalanceRaw?: bigint;
  noBalanceRaw?: bigint;
  expirySec?: number;
  nowSec?: number;
  redeemed?: boolean;
};

function sideIsYes(p: FillPositionInput): boolean {
  return /YES/.test(`${p.takerSide ?? ""}${p.side ?? ""}`);
}

function heldBalanceRaw(p: FillPositionInput): bigint {
  return sideIsYes(p) ? (p.yesBalanceRaw ?? 0n) : (p.noBalanceRaw ?? 0n);
}

export function resolvePositionState(p: FillPositionInput): PositionTab {
  const yesBal = p.yesBalanceRaw ?? 0n;
  const noBal = p.noBalanceRaw ?? 0n;
  const held = heldBalanceRaw(p);
  const voided = p.isVoided === true || p.status === 5;
  const settledResolved = p.isResolved === true || p.status === 4;
  const outcomeKnown = p.winningOutcome === 0 || p.winningOutcome === 1;

  let state: PositionTab;
  if (voided) {
    state = yesBal > 0n || noBal > 0n ? "CLAIMABLE" : "VOID";
  } else if (settledResolved && !outcomeKnown) {
    // Resolved on-chain but the outcome snapshot hasn't been read yet —
    // never guess WON/LOST without it.
    state = "SETTLING";
  } else if (settledResolved) {
    const won = (p.winningOutcome === 0) === sideIsYes(p);
    if (won) state = held > 0n ? "CLAIMABLE" : "WON";
    else state = "LOST";
  } else if (p.status === 2 || p.status === 3) {
    state = "SETTLING";
  } else if (p.status === 0 || p.status === 1) {
    state = "LIVE";
  } else if (
    p.expirySec !== undefined &&
    p.nowSec !== undefined &&
    p.nowSec > p.expirySec
  ) {
    state = "SETTLING";
  } else {
    state = "LIVE";
  }

  // Post-redemption demotion: a mined redeem tx closes a CLAIMABLE.
  if (p.redeemed === true && state === "CLAIMABLE") {
    state = voided ? "VOID" : "WON";
  }
  return state;
}
