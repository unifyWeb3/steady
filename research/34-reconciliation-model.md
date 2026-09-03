# 34 — Reconciliation Model

**Goal:** detect where money/state actually is, not where UI hopes.

## Chain of custody per trade
wallet balance → allowance (qty, not escrow) → order intent → tx (realtime_sendRawTransaction) → token movement (ERC20 Transfer logs) → fill (getUserFills) → position (outcome balance) → settlement (getMarketOnchain 4/5) → redemption (redeemWinning) → final balance

## What to reconcile
- tx submitted but not mined (UNKNOWN — don't allow retry until receipt or timeout)
- tx mined but fill missing (INDEXED lag — poll getUserFills with 3s retry, show STALE badge)
- fill indexed but position not detected (check getOutcomeBalance, may be 0 after redeem)
- settlement resolved but redemption unavailable (listPastBinaryMarkets Finalized not yet indexed)
- redemption executed but balance not updated (RPC lag)
- indexer lag vs chain (display STALE, re-read onchain)

## UI states
PENDING (submitted), CONFIRMED (receipt success), INDEXED (fill seen), SETTLED (resolved), REDEEMED, plus UNKNOWN (timeout), STALE (indexer behind), CONFLICTING (on-chain vs indexer disagree) — never collapse to one “success”.
