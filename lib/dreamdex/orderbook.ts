// lib/dreamdex/orderbook.ts — real book + tick/lot, no mocks
import type { DreamDexClient } from "./client";

export type BookLevelRaw = { price: string | bigint; quantity: string | bigint };
export type SteadyBook = {
  yesBids: { price: bigint; quantity: bigint }[];
  yesAsks: { price: bigint; quantity: bigint }[];
  noBids: { price: bigint; quantity: bigint }[];
  noAsks: { price: bigint; quantity: bigint }[];
  bestBid?: bigint;
  bestAsk?: bigint;
  spread?: bigint;
  raw: any;
};

export type BookParams = { tickSize: bigint; lotSize: bigint; minQuantity: bigint };

function toBigInt(v: any): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "string" && v.endsWith("n")) return BigInt(v.slice(0, -1));
  return BigInt(v);
}

export async function getSteadyBook(client: DreamDexClient, pool: `0x${string}`): Promise<SteadyBook> {
  const raw = await client.client.getBinaryOrderBook(pool, { depth: 5 });
  const yesBids = (raw.yesBids || []).map((l: any) => ({ price: toBigInt(l.price ?? l[0]), quantity: toBigInt(l.quantity ?? l[1]) }));
  const yesAsks = (raw.yesAsks || []).map((l: any) => ({ price: toBigInt(l.price ?? l[0]), quantity: toBigInt(l.quantity ?? l[1]) }));
  const noBids = (raw.noBids || []).map((l: any) => ({ price: toBigInt(l.price ?? l[0]), quantity: toBigInt(l.quantity ?? l[1]) }));
  const noAsks = (raw.noAsks || []).map((l: any) => ({ price: toBigInt(l.price ?? l[0]), quantity: toBigInt(l.quantity ?? l[1]) }));
  const bestBid = yesBids[0]?.price;
  const bestAsk = yesAsks[0]?.price;
  const spread = bestBid !== undefined && bestAsk !== undefined ? bestAsk - bestBid : undefined;
  return { yesBids, yesAsks, noBids, noAsks, bestBid, bestAsk, spread, raw };
}

export async function getBookParams(client: DreamDexClient, pool: `0x${string}`): Promise<BookParams> {
  const p = await client.client.getBinaryBookParams(pool);
  return { tickSize: BigInt(p.tickSize), lotSize: BigInt(p.lotSize), minQuantity: BigInt(p.minQuantity) };
}

// Tick/lot snapping — verification from research/27 and live gate 4b (1000 raw)
export function snapPrice(priceRaw: bigint, tick: bigint): bigint {
  if (tick === 0n) return priceRaw;
  return (priceRaw / tick) * tick;
}
export function snapQuantity(qtyRaw: bigint, lot: bigint): bigint {
  if (lot === 0n) return qtyRaw;
  return (qtyRaw / lot) * lot;
}
export function isValidQuantity(qty: bigint, lot: bigint, min: bigint): boolean {
  if (qty === 0n) return false;
  if (qty < min) return false;
  if (qty % lot !== 0n) return false;
  return true;
}

// Human helpers (6 decimals tUSDC)
export const ONE_6 = 1_000_000n;
export function priceToRaw(prob: number, tick: bigint): bigint {
  const raw = BigInt(Math.round(prob * Number(ONE_6)));
  return snapPrice(raw, tick);
}
export function rawToProb(raw: bigint): number {
  return Number(raw) / Number(ONE_6);
}
