# 05 — SDK Analysis

**SDK:** @somnia-chain/markets-sdk **0.29.0** (latest)  
**Sources:** SRC-007 inspection, local node_modules, SRC-002

## Install & version floors
- `npm install @somnia-chain/markets-sdk viem`, use **>=0.28.0** (price tick snap). <0.23.0 fails to read (longOpenInterest), <0.24 lot sizing floors <1 to 0, <0.28 floats revert.

## API surface (verified 0.29.0)
- Entry: `createClient({indexerUrl, chain, wsRpcUrl, addresses, privateKey})` or `SomniaMarkets` unified. React hooks in `/react`, chains in `/chains`, reactivity in `/reactivity`.
- Unified: `loadMarkets`, `fetchOrderBook`, `createOrder`, `cancelOrder`, `fetchOpenOrders`, `fetchMyTrades`, `mintSet`/`burnSet` via module.
- Client reads: `client.listLiveBinaryMarkets`, `listBinaryMarkets` (filter status), `listPastBinaryMarkets`, `getMarketOnchain`, `getBinaryBookParams`, `getOutcomeBalance`, `getMarketResolution`, `getOpeningPrices`, `getBinaryPositionPnL`, `countBinaryMarkets`, `getCandles`/`getFills` (scoped by pool + from/until), `getUserFills`.
- Trader writes: `trader.placeOrder` (raw bigint price/qty, pool, side BUY_YES/SELL_YES/BUY_NO/SELL_NO), `trader.redeem` (explicit outcomeIdx), `trader.faucet`, `trader.cancelOrder`, etc. Writes use fixed fees (60 gwei ceiling, 10M gas) via realtime_sendRawTransaction, one round-trip.
- Helpers: `outcomeId`, `decodeOutcomeId`, `priceToProbability`, `averageEntryPrice`, `computePositionPnL`, `quoteBinaryStakeOverBook`, etc.
- Envs: browser + node, no polling, WS for liveTail + price feed.

## Chain config (local addresses.js)
- testnet Shannon: binaryModule 0x3ecC69…, oracleHub 0xe40db3…, collateral 0x70a86… (6dp)
- mainnet: same module addresses (CREATE3), collateral USDso 0x000… (18dp) — differing scale 1e12.

## Hazards
- Price must be on tick grid (1e15 on 18dp, 1e3 on 6dp) — SDK >=0.28 snaps.
- Amount quantize to lot — check >0 else skip.
- expireTimestampNs mandatory, in nanoseconds, capped at market expiry, set ~now+300s as dead-man.
- Receipt location: unified `order.info.receipt`, trader `res.receipt`; from 0.23 throws decoded revert else check receipt.status.
- Indexer status trails — always re-read on-chain before write.
- Venue scoping required — filter by venueId.

## Sample minimal loop
See SRC-002 snippet: loadMarkets → isBinaryMarket → getMarketOnchain status 1 → fetchOrderBook → createOrder IOC.

Record version **0.29.0** pinned.
