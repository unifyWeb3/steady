# 04 — Event Contracts (High-priority deep dive)

**Sources:** SRC-002/003/004/005/006

## What they represent TODAY
- Binary Up/Down on **BTC and ETH price** only, fixed window, fixed payout. If you are right you redeem 1 USDso per contract (0 fee), wrong = 0, void = 0.5 each side.
- Windows: **15m / 1h · more soon** (docs lineage, gate shows 5m on Gate but DreamDEX docs list 15m/1h). No sports/politics today.
- Market creation: **Not permissionless for external builders**. Venue rolls successor automatically via MarketCreator/Series. Builders **consume** existing windows only.
- Settlement: oracle-driven, permissionless to observe. OracleHub question scheduled at creation, gas reserved, Somnia reactivity delivers callback at expiry → BinaryMarketsModule resolves (Resolved) or void after window if no answer (Voided). Manual backstops: pokeOracle(questionId), voidExpired().
- Assets existing: BTC, ETH (listBinaryAssets). Testnet collateral tUSDC 0x70a86… 6 decimals, faucet 10k cap; mainnet USDso 0x000… 18 decimals. STT gas.

## Lifecycle (VERIFIED)
`0 Listed → 1 Trading → 2 Locked → 4 Resolved | 5 Voided` (3 Settling effectively never observable). Gate every write on on-chain status 1.

## Order book: one book, two sides
- Up and Down share single book quoted in Up probability (0,1). Down price = 1 - Up.
- Four fill paths: BuyUp×SellUp direct, BuyDown×SellDown direct, **BuyUp×BuyDown mint-a-pair**, SellUp×SellDown burn-a-pair. Mint enables zero-inventory two-sided quotes.
- Escrow: buys collateral, sells outcome tokens (6909 ids). Complete set mint: 1 USDso ↔ 1 Up + 1 Down via BinaryMarketsModule. Cancels refund to wallet, taker charged fill price not quoted.

## What can/can't be done
- Can: discover via SDK, stream books/fills/candles, place/cancel by symbol in human units, mint/merge, redeem (explicit outcomeIdx), read on-chain status/balances, audit oracleQuestionId graph.
- Can't via SDK: create arbitrary markets, use HTTP API for EC (spot only), assume pool address permanent (pools recycled, key by marketId/symbol), parse question text (use typed asset/intervalSec).
- Expires: market locks, cancels still work, settlement then redemption. Settled leaves live list — must scan Finalized.

## Gotchas (must handle)
See SRC-004: indexer lag, revert reach, float price reverts <0.28, IOC vs resting, expiry mandatory nanoseconds, lot grid, wallet reconciliation, venue scoping, headroom, hidden settled, settlement rail fees zero, pool recycling, don't parse question.
