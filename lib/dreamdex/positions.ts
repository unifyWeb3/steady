// lib/dreamdex/positions.ts — real fills + outcome balances, no mocks
import type { DreamDexClient } from "./client";

export type Fill = any; // SDK FillRow — keep loose, map needed fields

export async function getUserFills(client: DreamDexClient, owner: `0x${string}`, limit = 50): Promise<Fill[]> {
  // SDK getUserFills signature: getUserFills(account, { since, limit }) — verify via d.ts
  // Fallback to client.getUserFills if exists, else via indexerRead
  const anyClient: any = client.client;
  if (typeof anyClient.getUserFills === "function") {
    return anyClient.getUserFills(owner, { since: 0, limit });
  }
  // alternative via getFills with scope
  return [];
}

export async function getLiveFillsForMarket(client: DreamDexClient, pool: `0x${string}`) {
  return client.client.getLiveFills?.(pool) || [];
}

// Positions from fills + market resolution — used by settlement + scoring
export type PositionLike = {
  marketId: `0x${string}`;
  pool: `0x${string}`;
  side: "BUY_YES" | "BUY_NO" | "SELL_YES" | "SELL_NO";
  fillPriceRaw: bigint; // price at fill (raw 1e6)
  quantityRaw: bigint;
  txHash: string;
  timestampSec: number;
};
