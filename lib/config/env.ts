// lib/config/env.ts — verified against research/25+26 + SDK source
// Browser-safe must never contain secrets; server/wallet keys loaded only via process.env without NEXT_PUBLIC prefix

export type Env = {
  chainId: 50312;
  indexerUrl: string;
  wsRpcUrl?: string;
  rpcHttpUrl?: string;
  // server/wallet only — not exposed
  testWalletPrivateKey?: string;
};

function required(name: string, fallback?: string): string {
  const v = process.env[name] || fallback;
  if (!v) throw new Error(`Missing required env ${name} (see .env.example)`);
  return v;
}

export function getBrowserEnv(): Pick<Env, "chainId" | "indexerUrl" | "wsRpcUrl" | "rpcHttpUrl"> {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "50312");
  if (chainId !== 50312) throw new Error(`Only Shannon testnet 50312 allowed (got ${chainId}) — see AGENTS.md`);
  return {
    chainId: 50312 as const,
    indexerUrl: required("NEXT_PUBLIC_INDEXER_URL", "https://dev.smk.somnia.host/v1/graphql"),
    wsRpcUrl: process.env.NEXT_PUBLIC_WS_RPC_URL || undefined,
    rpcHttpUrl: process.env.NEXT_PUBLIC_RPC_HTTP_URL || "https://api.infra.testnet.somnia.network",
  };
}

export function getServerEnv(): Env {
  const browser = getBrowserEnv();
  return {
    ...browser,
    testWalletPrivateKey: process.env.TEST_WALLET_PRIVATE_KEY || undefined,
  };
}

// Guard: never allow private key via NEXT_PUBLIC
export function assertNoLeakedSecrets() {
  if (process.env.NEXT_PUBLIC_TEST_WALLET_PRIVATE_KEY || process.env.NEXT_PUBLIC_PRIVATE_KEY) {
    throw new Error("SECURITY: private key must never be in NEXT_PUBLIC_* — see research/26");
  }
}
