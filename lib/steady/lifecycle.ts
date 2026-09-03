// lib/steady/lifecycle.ts — map protocol → product inbox states
import { STATUS_MAP } from "../dreamdex/settlement";

export type SteadyPositionState = "LIVE" | "LOCKED" | "SETTLING" | "CLAIMABLE" | "WON" | "LOST" | "VOID" | "REDEEMED";

export function mapLifecycle(status: number, hasClaimableBalance?: boolean, isRedeemed?: boolean): SteadyPositionState {
  if (isRedeemed) return "REDEEMED";
  const proto = STATUS_MAP[status];
  if (proto === "VOIDED") return hasClaimableBalance ? "CLAIMABLE" : "VOID";
  if (proto === "RESOLVED") return hasClaimableBalance ? "CLAIMABLE" : "WON"; // if not claimable, assume won? caller should disambiguate won/lost via outcome
  if (proto === "LOCKED") return "SETTLING"; // awaiting settlement
  if (proto === "TRADING") return "LIVE";
  if (proto === "LISTED") return "LIVE";
  return "SETTLING";
}

export function isEligibleForRedeem(status: number, hasPositiveBalance: boolean): boolean {
  return (status === 4 || status === 5) && hasPositiveBalance; // RESOLVED or VOIDED with balance
}
