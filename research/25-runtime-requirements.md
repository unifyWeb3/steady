# 25 — Runtime Requirements (Verified 2026-09-01, SDK 0.29.0)

Source of truth: `node_modules/@somnia-chain/markets-sdk/dist/config.d.ts:1`, `dist/chains/definitions/somniaShannon.js:1`, `dist/addresses.js:1`, `README.md`

## Chain (Shannon testnet)
- `id: 50312`, `name: "Somnia Testnet"`, `nativeCurrency STT 18`
- `rpcUrls.default.http: ["https://api.infra.testnet.somnia.network", "https://dream-rpc.somnia.network"]`
- `rpcUrls.default.webSocket: ["wss://api.infra.testnet.somnia.network/ws", "wss://dream-rpc.somnia.network/ws"]`
- `blockExplorers.default.url: "https://shannon-explorer.somnia.network"`
- `contracts.multicall3: 0x841b8199E6d3Db3C6f264f6C2bd8848b3cA64223 @ 71314235`

## Indexer
- Testnet: `https://dev.smk.somnia.host/v1/graphql`
- Mainnet: `https://prd.smk.somnia.host/v1/graphql` (reference, mainnet forbidden for MVP)
- Required field in `ClientConfig.indexerUrl` — no default (see `createClient.d.ts:1`).
- Optional server-only `indexerHeaders?: Record<string,string>` for Hasura admin/role (MUST stay server-only, see `config.d.ts:1`).

## SDK entry
```ts
import { createClient } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";

const client = createClient({
  indexerUrl,            // required
  chain: somniaShannon,  // required
  wsRpcUrl,              // optional if chain has webSocket (Shannon does) — override only if needed
  addresses: SOMNIA_TESTNET_ADDRESSES, // never hardcode, from SDK
  fees: DEFAULT_FEES     // optional, default 60 gwei ceiling, 0 tip
});
```

## Addresses (load from SDK, do not hardcode)
From `SOMNIA_TESTNET_ADDRESSES` (`addresses.js:1`):
- `binaryModule 0x3ecC694Cef705358864a646142ac17A90E29e388`
- `binarySettlement 0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23`
- `collateral / testUsdc 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E` (6 decimals, faucet-capable)
- `collateralRouter 0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C`
- `oracleHub 0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b`
- Full set also includes `binaryPoolBeacon`, `marketCreator`, etc. — not needed to hardcode.

## Trader (writes)
- `const trader = client.createTrader({ privateKey: "0x..." as `0x${string}` })`
- Private key is **NOT part of ClientConfig** — it is per-trader, local-only. Never pass via `NEXT_PUBLIC_*`.
- Fixed fees: `DEFAULT_FEES { maxFeePerGas: 60_000_000_000n, maxPriorityFeePerGas: 0n }` + `DEFAULT_GAS 10_000_000n` (see `config.d.ts:1`). 0.6 STT envelope, unused refunded, but mempool requires funding.

## What Steady needs at runtime
- **Reads (no key):** `listLiveBinaryMarkets`, `getMarketOnchain`, `getBinaryOrderBook`, `getBinaryBookParams`, `listPastBinaryMarkets({status:"Finalized"})`, `getOutcomeBalance`, `getUserFills`, `getMarketResolution` — indexer + WS RPC only.
- **Writes (needs funded key):** `trader.placeOrder` (tick/lot + expireTimestampNs), `trader.redeem`, `trader.faucet`, `trader.cancelOrder` — needs STT for gas + tUSDC collateral.
- **Live tail (no key, but needs WS):** `watchMarket`/`watchMarkets` for zero-round-trip book if used.

## Collateral specifics
- Testnet tUSDC 6 decimals, `faucet()` mints to msg.sender, capped at 10k per call (see docs `contracts-and-addresses.md` verified).
- Mainnet USDso 18 decimals — 1e12 scale difference. Derive from `decimals()` never literal.
- Wallet must hold STT (>~0.6 STT per write envelope) + tUSDC before trading.

## Price feed (optional, not required for MVP)
- `priceFeed: SOMNIA_TESTNET_PRICE_FEED { url: "https://price-feed.dev.oracle.somnia.host/v1/graphql", quote: "USDC" }` — only if using EMA feed for scoring context. Steady MVP does not require it (Brier from fills, not feed).
