// lib/steady/positionState.ts — pure fill → position-state resolver, no SDK
//
// The terminal tabs are ALL / LIVE / SETTLING / CLAIMABLE / WON / LOST / VOID.
// UNKNOWN is deliberately retained for rows whose market status cannot be
// verified; it is never treated as executable LIVE state.
// - status: getMarketOnchain MarketStatus (0 Listed · 1 Trading · 2 Locked ·
//   3 Settling · 4 Resolved · 5 Voided; markets.d.ts:924).
// - winningOutcome is ONLY meaningful when isResolved (contract defaults 0 —
//   markets.d.ts:942-956). Unresolved markets must ignore it.
// - CLAIMABLE = settled winner with balance > 0, or voided with balance > 0
//   (void pays both sides half). WON/LOST = settled AND zero balance (closed).
// - redeemed=true demotes a CLAIMABLE to its closed form (WON or VOID) after the
//   redemption tx mines — caller tracks this per market+side.
// - Unknown status → UNKNOWN. Expiry is not proof of a protocol state.
import { resolvePositionState as resolvePositionStateBrowser } from "./position-state.js";
export type PositionTab = "LIVE" | "SETTLING" | "CLAIMABLE" | "WON" | "LOST" | "VOID" | "UNKNOWN";

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

export function resolvePositionState(p: FillPositionInput): PositionTab {
  return resolvePositionStateBrowser(p) as PositionTab;
}
