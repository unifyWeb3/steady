# 33 — State Machine

## Market (protocol, from `getMarketOnchain.status`)
`LISTED(0) → TRADING(1) → LOCKED(2) → RESOLVED(4) | VOIDED(5)` — verify via chain, not indexer (gotcha #1). `3 Settling` never observed.

## Position/inbox (product, derived from fills + market + balances)
`LIVE(open, Trading) → SETTLING(Locked/awaiting) → CLAIMABLE(Resolved/Voided with positive outcome balance) → WON|LOST|VOID (after claim) → REDEEMED (balance 0)` + `PENDING/CONFIRMED/INDEXED` for write path.

Transitions with evidence:
- Market discovered (indexer) → eligible (>60s, BTC/ETH, 60/300/900/3600)
- Trade prepared (ticket compute) → policy approved (engine PASS)
- Tx submitted (hash) → mined (receipt success) → fill observed (getUserFills) → position opened
- Market locked (expiry) → resolved/voided → claimable (balance) → redeemed (tx)

## Trade attempt (control plane)
`INTENT → POLICY_CHECK → MARKET_VALIDATION → QUOTE → CONFIRM → SUBMITTING → MINED → INDEXED → SETTLED → REDEEMED` with branches FAILED/UNKNOWN/STALE.

Preserve per transition: timestamp, marketId, wallet, txHash, orderId, fillId, outcome, protocolState, source, prev/current.
