// Browser-safe runtime configuration. Secrets are intentionally absent.
export const DEFAULT_BROWSER_CONFIG = Object.freeze({
  chainId: 50312,
  indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
  wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
  rpcHttpUrl: "https://api.infra.testnet.somnia.network",
});

function url(value, name, protocols) {
  try {
    const parsed = new URL(String(value));
    if (!protocols.includes(parsed.protocol)) throw new Error("unsupported protocol");
    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid browser config ${name}`);
  }
}

export function getBrowserConfig(source = globalThis.__STEADY_CONFIG || {}) {
  const chainId = Number(source.chainId ?? source.NEXT_PUBLIC_CHAIN_ID ?? DEFAULT_BROWSER_CONFIG.chainId);
  if (chainId !== 50312) throw new Error(`Only Shannon testnet 50312 allowed (got ${chainId})`);
  return {
    chainId,
    indexerUrl: url(source.indexerUrl ?? source.NEXT_PUBLIC_INDEXER_URL ?? DEFAULT_BROWSER_CONFIG.indexerUrl, "indexerUrl", ["http:", "https:"]),
    wsRpcUrl: url(source.wsRpcUrl ?? source.NEXT_PUBLIC_WS_RPC_URL ?? DEFAULT_BROWSER_CONFIG.wsRpcUrl, "wsRpcUrl", ["ws:", "wss:"]),
    rpcHttpUrl: url(source.rpcHttpUrl ?? source.NEXT_PUBLIC_RPC_HTTP_URL ?? DEFAULT_BROWSER_CONFIG.rpcHttpUrl, "rpcHttpUrl", ["http:", "https:"]),
  };
}
