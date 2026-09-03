// lib/dreamdex/settlement.ts — real lifecycle + oracle ref, no mocks
import type { DreamDexClient } from "./client";

export type Lifecycle = "LISTED" | "TRADING" | "LOCKED" | "RESOLVED" | "VOIDED" | "FINALIZED" | "UNKNOWN";
export const STATUS_MAP: Record<number, Lifecycle> = { 0: "LISTED", 1: "TRADING", 2: "LOCKED", 4: "RESOLVED", 5: "VOIDED" };

export async function getMarketLifecycle(client: DreamDexClient, marketId: `0x${string}`): Promise<{ status: number; lifecycle: Lifecycle; raw: any }> {
  const oc: any = await client.client.getMarketOnchain(marketId);
  const status = Number(oc.status ?? -1);
  const lifecycle = STATUS_MAP[status] || "UNKNOWN";
  return { status, lifecycle, raw: oc };
}

export async function getMarketResolution(client: DreamDexClient, marketId: `0x${string}`) {
  // SDK may expose getMarketResolution or getMarketResolutionEvent
  const anyClient: any = client.client;
  if (typeof anyClient.getMarketResolution === "function") return anyClient.getMarketResolution(marketId);
  if (typeof anyClient.getMarketResolutionEvent === "function") return anyClient.getMarketResolutionEvent(marketId);
  return null;
}

export async function listPastSettled(client: DreamDexClient, limit = 20) {
  // listPastBinaryMarkets with Finalized — for inbox + scoring
  return client.client.listPastBinaryMarkets({ status: "Finalized" as any, limit });
}

export function oracleExplorerUrl(oracleQuestionId?: string | bigint): string | null {
  if (!oracleQuestionId) return null;
  const id = String(oracleQuestionId);
  return `https://prd.oracle.somnia.host/questions/${id}?view=graph`;
}
