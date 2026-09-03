// lib/dreamdex/redemption.ts — real redemption, no fake claim
import type { DreamDexClient } from "./client";

export async function getClaimableForAccount(client: DreamDexClient, account: `0x${string}`) {
  // Use derivedReads claimableFrom if available, else manual via outcome balances on Finalized markets
  // Keep integration thin: caller will call trader.redeem per market
  const past = await client.client.listPastBinaryMarkets({ status: "Finalized" as any, limit: 20 });
  // caller must check balances per market via getOutcomeBalance — not fetched here to avoid N+1 without owner
  return past;
}

export async function redeemWinning(client: DreamDexClient, privateKey: `0x${string}`, args: { marketId: `0x${string}`; outcomeIndex: 0 | 1; amountRaw: bigint }) {
  // Need full onchain context: marketAddress, outcomeToken, yesId/noId
  const oc: any = await client.client.getMarketOnchain(args.marketId);
  const marketAddress = oc.marketAddress || oc.market;
  const outcomeToken = oc.outcomeToken || oc.token;
  if (!marketAddress || !outcomeToken) throw new Error("Missing marketAddress/outcomeToken from getMarketOnchain — cannot redeem");
  const trader: any = client.client.createTrader({ privateKey });
  // SDK redeem signature varies: try object form first
  try {
    return await trader.redeem({
      marketId: args.marketId,
      market: marketAddress,
      outcomeToken,
      outcomeIdx: args.outcomeIndex,
      amount: args.amountRaw,
    });
  } catch (e: any) {
    // fallback to alternative name
    if (e.message?.includes("not a function")) {
      return await trader.redeemDirect?.({ marketId: args.marketId, market: marketAddress, outcomeToken, outcomeIdx: args.outcomeIndex, amount: args.amountRaw });
    }
    throw e;
  }
}
