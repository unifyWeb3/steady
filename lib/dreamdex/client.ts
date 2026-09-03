// lib/dreamdex/client.ts — real SDK integration, no mocks
// Verified entry: new SomniaMarkets({...}) then exchange.client.* (not createClient)
// See research/25,27 and harness scripts/validate/validate.mjs

import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { getBrowserEnv, assertNoLeakedSecrets } from "../config/env";

export type DreamDexClient = SomniaMarkets;
let singleton: DreamDexClient | null = null;

export function getDreamDexClient(opts?: { privateKey?: `0x${string}` }): DreamDexClient {
  assertNoLeakedSecrets();
  const env = getBrowserEnv();
  // Reuse singleton for reads; if privateKey supplied create isolated instance for writes
  if (opts?.privateKey) {
    return new SomniaMarkets({
      indexerUrl: env.indexerUrl,
      chain: somniaShannon,
      ...(env.wsRpcUrl ? { wsRpcUrl: env.wsRpcUrl } : {}),
      addresses: SOMNIA_TESTNET_ADDRESSES,
      privateKey: opts.privateKey,
    });
  }
  if (!singleton) {
    singleton = new SomniaMarkets({
      indexerUrl: env.indexerUrl,
      chain: somniaShannon,
      ...(env.wsRpcUrl ? { wsRpcUrl: env.wsRpcUrl } : {}),
      addresses: SOMNIA_TESTNET_ADDRESSES,
    });
  }
  return singleton;
}

// For server/validate scripts that need explicit indexerUrl
export function createDreamDexClientExplicit(indexerUrl: string, wsRpcUrl?: string, privateKey?: `0x${string}`) {
  return new SomniaMarkets({
    indexerUrl,
    chain: somniaShannon,
    ...(wsRpcUrl ? { wsRpcUrl } : {}),
    addresses: SOMNIA_TESTNET_ADDRESSES,
    ...(privateKey ? { privateKey } : {}),
  });
}
