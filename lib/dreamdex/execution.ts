// lib/dreamdex/execution.ts — real IOC construction, no mocks
import type { DreamDexClient } from "./client";
import { snapPrice } from "./orderbook";
import { ORDER_TYPE } from "@somnia-chain/markets-sdk";

export type Side = "BUY_YES" | "BUY_NO"; // Steady MVP only buys (capped downside), sells via redeem

export type BuildOrderOpts = {
  pool: `0x${string}`;
  marketId: `0x${string}`;
  marketExpirySec: number; // for expiry capping
  side: Side;
  priceRaw: bigint; // already tick-snapped, in 1e6
  quantityRaw: bigint; // lot-snapped, 1 lot = 1000 raw = 1 contract
  tickSize: bigint;
};

export function buildIocParams(opts: BuildOrderOpts) {
  const tick = opts.tickSize;
  const priceSnapped = snapPrice(opts.priceRaw, tick);
  if (priceSnapped <= 0n || priceSnapped >= 1_000_000n) throw new Error(`InvalidPrice: ${priceSnapped} out of (0,1e6) — tick ${tick}`);
  if (opts.quantityRaw <= 0n) throw new Error(`InvalidQuantity: 0 after lot snap`);
  // expireTimestampNs: now+120s capped at marketExpiry-10s, nanos, future (gotcha #5)
  const nowNs = BigInt(Date.now()) * 1_000_000n;
  const soonNs = BigInt(Math.floor(Date.now() / 1000 + 120) * 1_000_000_000);
  const marketExpiryNs = BigInt(opts.marketExpirySec) * 1_000_000_000n;
  const expiryNs = soonNs < marketExpiryNs - 10_000_000_000n ? soonNs : marketExpiryNs - 10_000_000_000n;
  if (expiryNs <= nowNs) throw new Error(`OrderAlreadyExpired: expiry ${expiryNs} <= now ${nowNs} — market locked`);
  return {
    pool: opts.pool,
    side: opts.side,
    price: priceSnapped,
    quantity: opts.quantityRaw,
    orderType: ORDER_TYPE.MARKET, // 2 IOC, not FOK 1
    expireTimestampNs: expiryNs,
  };
}

// Execute with local signer (harness or browser wallet via createTrader)
// For browser injected wallet, caller should use walletClient path — this helper is for privateKey trader
export async function placeIocOrder(client: DreamDexClient, privateKey: `0x${string}`, params: ReturnType<typeof buildIocParams>) {
  // gate: ensure market still Trading (caller should have called getMarketOnchain and checked status 1)
  const trader = client.client.createTrader({ privateKey });
  const res = await trader.placeOrder({
    pool: params.pool,
    side: params.side,
    price: params.price,
    quantity: params.quantity,
    orderType: params.orderType,
    expireTimestampNs: params.expireTimestampNs,
  });
  const receipt: any = (res as any).receipt || (res as any).info?.receipt || res;
  const hash: string = receipt.transactionHash || (res as any).transactionHash || "unknown";
  const status: string = receipt.status || (res as any).status || "unknown";
  if (status === "reverted" || status === 0 || status === "0x0") throw new Error(`Contract revert: ${hash}`);
  return { hash, status, receipt, raw: res };
}

// Crossing price helper: bestAsk + 0.02 (20000n) capped <1e6, tick-snapped
export function crossingPriceFromBook(bestAskRaw: bigint | undefined, tick: bigint): bigint {
  if (bestAskRaw === undefined || bestAskRaw === 0n) return snapPrice(500_000n, tick); // 0.5 if empty
  const withSlippage = bestAskRaw + 20_000n; // +0.02
  const capped = withSlippage >= 1_000_000n ? bestAskRaw : withSlippage;
  return snapPrice(capped, tick);
}
