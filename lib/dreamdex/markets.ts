// lib/dreamdex/markets.ts — live discovery, no stale assumptions
import type { DreamDexClient } from "./client";

// Raw SDK type (keep loose to survive SDK patch)
type BinaryMarketRaw = {
  marketId: string;
  asset?: string;
  intervalSec?: number;
  expiry?: string | number;
  pool?: string;
  poolAddress?: string;
  // other fields from indexer
  [k: string]: any;
};

export type SteadyMarket = {
  marketId: `0x${string}`;
  asset: "BTC" | "ETH" | string;
  intervalSec: number;
  expirySec: number;
  pool: `0x${string}`;
  secondsLeft: number;
  onchainStatus?: number; // 1 Trading, 2 Locked, etc.
};

export async function listEligibleMarkets(
  client: DreamDexClient,
  opts: { minHeadroomSec?: number; assets?: string[]; intervals?: number[] } = {}
): Promise<SteadyMarket[]> {
  const minHeadroom = opts.minHeadroomSec ?? 60; // default 60s, caller may use 300 for stricter Steady filter
  const assets = new Set((opts.assets ?? ["BTC", "ETH"]).map((s) => s.toUpperCase()));
  const intervals = new Set(opts.intervals ?? [60, 300, 900, 3600]); // live includes 1m/5m/15m/1h

  const live: BinaryMarketRaw[] = await client.client.listLiveBinaryMarkets({ limit: 50 });
  const now = Math.floor(Date.now() / 1000);
  const eligible: SteadyMarket[] = [];

  for (const m of live) {
    const asset = (m.asset || "").toUpperCase();
    const intervalSec = Number(m.intervalSec ?? 0);
    const expirySec = Number(m.expiry ?? 0);
    const headroom = expirySec - now;
    const pool = (m.pool || m.poolAddress) as `0x${string}` | undefined;
    const marketId = m.marketId as `0x${string}` | undefined;
    if (!marketId || !pool) continue;
    if (!assets.has(asset)) continue;
    if (!intervals.has(intervalSec)) continue;
    if (headroom <= minHeadroom) continue;
    eligible.push({ marketId, asset, intervalSec, expirySec, pool, secondsLeft: headroom });
  }

  // Sort closing soon first (soonest expiry)
  eligible.sort((a, b) => a.expirySec - b.expirySec);
  return eligible;
}

// Gate on Trading status 1 — must be called before any write, per gotcha #1
export async function filterTradingMarkets(
  client: DreamDexClient,
  markets: SteadyMarket[]
): Promise<SteadyMarket[]> {
  const out: SteadyMarket[] = [];
  for (const m of markets) {
    try {
      const oc = await client.client.getMarketOnchain(m.marketId);
      if (oc.status === 1) out.push({ ...m, onchainStatus: oc.status });
    } catch {
      // skip on error — not Trading
    }
  }
  return out;
}

export async function getMarketOnchain(client: DreamDexClient, marketId: `0x${string}`) {
  return client.client.getMarketOnchain(marketId);
}
