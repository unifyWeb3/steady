# 19 — MVP Spec

## Core user
New retail, first 20 trades, wants to try BTC/ETH Up/Down but fears blowing bag quickly.

## Core problem
Overtrading in 15m windows due to no risk framing, no skill honesty, no pause.

## Core workflow (happy path, 90 sec)
1. Connect wallet (wagmi injected) → chain guard 50312.
2. See Live windows list (BTC 15m closing in 9:23, ETH 1h closing in 42:11). Each row: asset, window, time left (countdown), spread, depth, venue.
3. Pick BTC 15m → ticket shows book (best bid/ask in Up terms), input "Max loss: 25 tUSDC" → system computes max contracts: min(walletBalance/lot, bookDepthAtPrice/lot) snapped, shows "Pay 22.40 → win 40.00 if UP (line $61,000), max loss 22.40, expires in 8:47". Stake quantized to lot, price to tick.
4. Press "Back UP" → pre-checks run (on-chain status 1, headroom >60s, approval qty, balance) → wallet signs IOC → receipt shown + tx hash → position appears in Live.
5. After settlement (or fast-forward to mock finalized for demo), position moves to Claimable → press Redeem all → tx → balance bumps.
6. After 2 consecutive losses, Score strip shows Brier 0.31 (worse than 0.25) + "Tilting" + trade button disabled 2:47 + checkbox second confirm.

## Screens
- Header: wallet, chain, faucet link (testnet), steady toggle
- Live: window list + ticket (two-column desktop, stacked mobile)
- Positions: tabs Live / Settling / Claimable / History (won/lost/void, with oracle graph link per market)
- Score: strip above ticket or in Positions header (Brier gauge + Edge delta + last 5 dots W/L)

## User actions
- Connect/disconnect, switch window, set maxLoss, place IOC, cancel open order (if resting, though IOC rarely rests), redeem one/all, acknowledge cooldown.

## Backend responsibilities
- Thin Next.js API proxy for indexer reads if needed (same-origin RPC proxy with allowlist like Branch) — optional; can read indexer directly from client if CORS allows. Prefer client-side reads via SDK where possible.
- No DB required for MVP: store paper tilt history + Brier in localStorage + derive from chain on load via getUserFills + getMarketResolution. If we add persistence, use simple JSON file.

## On-chain responsibilities
- All escrow/settlement via BinaryMarketsModule, BinaryPool, OutcomeToken6909, OracleHub — we don't deploy contracts.

## SDK usage (exact)
- `createClient({indexerUrl: "https://dev.smk.somnia.host/v1/graphql", chain: somniaShannon, wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws", addresses: SOMNIA_TESTNET_ADDRESSES})`.
- `client.listLiveBinaryMarkets({limit:50})` → filter by asset (BTC/ETH), intervalSec (900/3600), expiry - now >300, venueId.
- Per market: `client.getMarketOnchain(marketId)` → require status 1.
- `client.getBinaryOrderBook(pool, {depth:5})` + `client.getBinaryBookParams(pool)` → tick/lot.
- `client.createTrader({privateKey})` for writes (burner key from env or wallet signing via buildPlaceOrder for injected).
- Place: `trader.placeOrder({pool, side:"BUY_YES"|"BUY_NO", price: ticks(p), quantity: lots(q), orderType: ORDER_TYPE.MARKET (IOC), expireTimestampNs: BigInt(...)})` or unified `exchange.createOrder(symbol, "limit", "buy", q, p, {timeInForce:"IOC"})`.
- History: `client.getUserFills(account, {since: 0})` + `client.listPastBinaryMarkets({status:"Finalized", limit:60})` + `client.getMarketResolution(marketId)` + `client.getOutcomeBalance(token, owner, id)`.
- Redeem: `trader.redeem({marketId, market: oc.marketAddress, outcomeToken: oc.outcomeToken, outcomeIdx: 0|1, amount})`.
- Faucet: `trader.faucet()` for testnet.

## Data flow
Browser → SDK → (Indexer GraphQL + RPC WS) → chain. No server polling loop; use SDK watchMarket for live book if needed, else poll on interval with on-chain re-read.

## State model
- `selectedMarketId: string | null`
- `maxLoss: string` (input, human tUSDC)
- `derivedQuote: { contracts, pay, payout, lotSnapped, tickSnapped } | null`
- `positions: Array<{marketId, symbol, side, contracts, avgPrice, status: Live|Locked|Resolved|Voided|Finalized, oracleQuestionId}>`
- `fills: Array<{trade, marketId, price, qty}>`
- `score: {brier, edge, wins, losses, last5: boolean[]}`
- `tilt: {consecutiveLosses, cooldownUntil: number|null}`

## Wallet flow
- Connect via wagmi (injected). Show STT balance + tUSDC balance. If <0.1 STT warn gas, link faucet Telegram. If tUSDC <maxLoss warn and suggest faucet(). Approvals: build exact approval for quantity, not escrow, else 0xfb8f41b2.

## Error states
- CHAIN_MISMATCH → switch to 50312
- WINDOW_CLOSED → market just locked, auto-select next window
- NO_LIQUIDITY → ImmediateOrCancelNoFill 0xd48c4403, show "book empty, next window in Xm"
- NEEDS_APPROVAL → show approve CTA
- INSUFFICIENT_BALANCE → faucet CTA
- RATE_LIMITED / API_DOWN → retry with backoff, show stale badge
- Tilt cooldown → timer + checkbox

## Empty states
- No live windows (filter too strict) → widen headroom or show "All windows settling, next in Xm"
- No positions → "No calls yet — pick a window above"
- No history → Brier "— (need 5 settled)"

## Realtime behavior
- Countdown ticks every 1s (derived from expiry).
- Book refresh every 3s or via watchMarket subscription.
- After place, poll getUserFills + getMarketOnchain until confirmed.

## Testnet strategy
- Use burner private key with 10k tUSDC faucet + STT from Telegram. Keep 50 tUSDC max loss per trade, 2 concurrent max. Trades are IOC so remainder cancels.

## Demo environment
- Shannon testnet live. Pre-seed one funded burner to have 3 wins/2 losses history so Brier is populated at demo start (else dash).

## Fallback behavior
- If live discovery fails, show cached last-good list with stale badge.
- If redemption scan empty, show "No claimables — your winnings auto-appear here after settlement".

## Analytics to capture
- Placed trades, fills, settlement outcomes, redeems, cooldown triggers — for video proof.

## Future roadmap (not MVP)
- Paper calibration mode (virtual fills), seasons/divisions, copy via session keys, oracle graph modal, push notifications for redeem, market health scanner.

