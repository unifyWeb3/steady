# 15 — Technical Feasibility

## Stack chosen to minimize risk
- Next.js 15 + React 19 + Tailwind 4 (familiar, fast)
- viem + wagmi + @somnia-chain/markets-sdk 0.29.0 (pinned)
- Shannon 50312 only (testnet mode enforced, mainnet rejected at runtime)
- No custom contracts (vault requires audit, cut)

## Verification steps (pre-code)
1. SDK connection: createClient with indexer https://dev.smk.somnia.host/v1/graphql + wsRpc wss://api.infra.testnet.somnia.network/ws — expect OK
2. Market discovery: listLiveBinaryMarkets limit 50 → filter BTC/ETH 15m/1h, check expiry headroom >300s
3. On-chain gate: getMarketOnchain per market, expect status 1
4. Book reads: getBinaryOrderBook + getBinaryBookParams for tick/lot
5. Wallet connect: wagmi injected, chainId guard 50312
6. Trade: createTrader with burner privateKey → placeOrder IOC with tick-snapped price, lot-snapped qty, expireNs = min(expiry*1e9-10e9, now+300e9)
7. Redemption: listPastBinaryMarkets Finalized → getOutcomeBalance → trader.redeem outcomeIdx 0/1
8. External deps: none (no Groq/Vertex, no Binance, no Supabase). Risk isolated to Somnia RPC/indexer.

## Hardest dependency first
- Discovery + on-chain gating — if this fails we pivot to mock data but still demo lifecycle via reads.

## Effort estimate (remaining 7 days)
- Research ✅, architecture 0.5d, SDK integration + discovery 0.5d, book/ticket UI 1d, positions+redeem 1d, scoring+Brier+tilt 0.5d, e2e testnet proof + faucet 0.5d, polish/mobile 1d, video + submission 1d. Fits.

## Fallbacks
- If indexer down: show on-chain status only + cached markets + stale badge.
- If book empty: show "no liquidity → can't quote max loss, try next window" (unfillable selector 0xd48c4403 handled).
- If settlement lag: poll getMarketResolution with deadline, show settling spinner.
