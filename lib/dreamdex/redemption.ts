// lib/dreamdex/redemption.ts — real redemption, no fake claim
//
// Verified SDK 0.29.0 surface (node_modules/@somnia-chain/markets-sdk/dist/*.d.ts):
// - client.getClaimable(account) -> ClaimablePosition[] { marketId, pool, outcomeIdx,
//   amount, estPayout, status }, shaped to feed straight into trader.redeemMany({ entries })
//   (somniaMarketsClient.d.ts:456-466; ClaimablePosition in derivedReads.d.ts:253-276).
// - trader.redeem({ marketId, amount, outcomeIdx? }) — module-routed, outcomeToken/module
//   auto-looked-up when omitted (trade.d.ts:1292-1335).
// - trader.redeemMany({ entries: [{ marketId, outcomeIdx, amount }] }) — ONE tx for all
//   claimables, all-or-nothing (trade.d.ts:1341-1371).
// - createTrader accepts { privateKey } | { account } | { walletClient } — the browser
//   popup path uses { walletClient } (trade.d.ts:15-36, somniaMarketsClient.d.ts:2237-2242).
// - getOutcomeBalance({ outcomeToken, account, id }) — outcomeToken singleton + yesId/noId
//   from getMarketOnchain (binary/portfolio.d.ts:279-286; markets.d.ts:904-956).
// See research/61-walletclient-redemption.md
import type { DreamDexClient } from "./client";

export type SignerConfig =
  | { privateKey: `0x${string}` }
  | { account: `0x${string}` }
  | { walletClient: any };

export type RedeemEntry = {
  marketId: `0x${string}`;
  outcomeIdx: 0 | 1;
  amount: bigint; // outcome tokens, raw collateral decimals
};

export type ClaimablePosition = {
  marketId: string;
  pool: string;
  outcomeIdx: 0 | 1;
  amount: bigint;
  estPayout: bigint;
  status: string;
};

// Pure: validate + shape one redeem entry. Throws on bad input — never silently
// builds a zero-amount or out-of-range redemption.
export function buildRedeemEntry(
  marketId: `0x${string}`,
  outcomeIdx: 0 | 1,
  amount: bigint,
): RedeemEntry {
  if (!/^0x[0-9a-fA-F]{64}$/.test(marketId)) throw new Error(`Invalid marketId ${marketId}`);
  if (outcomeIdx !== 0 && outcomeIdx !== 1) throw new Error(`outcomeIdx must be 0|1, got ${outcomeIdx}`);
  if (typeof amount !== "bigint" || amount <= 0n) throw new Error(`amount must be positive bigint, got ${String(amount)}`);
  return { marketId, outcomeIdx, amount };
}

// Pure: map SDK ClaimablePosition rows to redeemMany entries (drops dust/zero rows).
export function entriesFromClaimable(rows: ClaimablePosition[]): RedeemEntry[] {
  return rows
    .filter((r) => r && BigInt(r.amount) > 0n && (r.outcomeIdx === 0 || r.outcomeIdx === 1))
    .map((r) => buildRedeemEntry(r.marketId as `0x${string}`, r.outcomeIdx, BigInt(r.amount)));
}

// Read path: account's redeemable positions across all SETTLED markets.
// Loser-side and still-trading positions are omitted by the SDK itself.
export async function getClaimable(
  client: DreamDexClient,
  account: `0x${string}`,
): Promise<ClaimablePosition[]> {
  return client.client.getClaimable(account);
}

// Write path: redeem entries in ONE transaction. Works with a browser walletClient
// (popup signing) exactly as with a server privateKey — same createTrader doctrine.
export async function redeemMany(
  client: DreamDexClient,
  signer: SignerConfig,
  entries: RedeemEntry[],
): Promise<{ redeemed: boolean; entries: RedeemEntry[]; result?: any }> {
  if (!entries.length) return { redeemed: false, entries: [] };
  const trader: any = client.client.createTrader(signer as any);
  const result = await trader.redeemMany({ entries });
  return { redeemed: true, entries, result };
}

// Full close-out: scan claimables, redeem all in one tx. Returns redeemed:false with
// the (empty) scan when there is nothing to claim — never throws for "nothing to do".
export async function redeemAllClaimable(
  client: DreamDexClient,
  signer: SignerConfig,
  account: `0x${string}`,
): Promise<{ redeemed: boolean; entries: RedeemEntry[]; claimable: ClaimablePosition[]; result?: any }> {
  const claimable = await getClaimable(client, account);
  const entries = entriesFromClaimable(claimable);
  if (!entries.length) return { redeemed: false, entries: [], claimable };
  const { result } = await redeemMany(client, signer, entries);
  return { redeemed: true, entries, claimable, result };
}

// Legacy single-market scan (kept for compat): Finalized markets list. Prefer
// getClaimable() — it already filters to winner/void positions with balances.
export async function getClaimableForAccount(client: DreamDexClient, account: `0x${string}`) {
  void account;
  return client.client.listPastBinaryMarkets({ status: "Finalized" as any, limit: 20 });
}

// Legacy single-market privateKey path, fixed to module-routed redeem
// (outcomeToken/module auto-looked-up; old marketAddress plumbing no longer needed).
export async function redeemWinning(
  client: DreamDexClient,
  privateKey: `0x${string}`,
  args: { marketId: `0x${string}`; outcomeIndex: 0 | 1; amountRaw: bigint },
) {
  const entry = buildRedeemEntry(args.marketId, args.outcomeIndex, args.amountRaw);
  const trader: any = client.client.createTrader({ privateKey });
  return trader.redeem({ marketId: entry.marketId, amount: entry.amount, outcomeIdx: entry.outcomeIdx });
}
