# 36 — Reliability Model

## Failure → defense

| Failure | Defense | Steady behavior |
|---|---|---|
| RPC failure | retry with backoff, show UNKNOWN not FAILED | don't claim failed if maybe mined |
| Indexer lag | re-read onchain, show STALE badge, poll fills after 3s | don't mock |
| Stale market (Locked) | gate onchain status 1 before write, headroom >=60s | select next window |
| WS disconnect | SDK live tail heals via backoff + backfill (per SDK) | no custom |
| Duplicated events | dedupe by txHash/fillId/marketId | idempotent |
| Delayed fills | PENDING→CONFIRMED→INDEXED, retry | not optimistic |
| Tx replacement | none — fixed nonce via SDK trader, no replacement | — |
| Revert | decoded ContractRevertError (FillOrKillNotFillable, InvalidPrice etc.) with taxonomy | explain, not generic |
| Empty book | 0xd48c4403 ImmediateOrCancelNoFill honest empty state | not fake liquidity |
| Market expiry during submit | expiryNs capped at marketExpiry-10s, re-validate before sign | block |
| Page refresh | tradeAttemptId in localStorage, re-reconcile on load | no double submit |
| Double click | SUBMITTING disables button, associate attemptId+orderId+txHash | no duplicate tx |
| Wrong chain | guard 50312, wallet_switchEthereumChain | block |

## Pattern everywhere
READ → VALIDATE → WRITE → WAIT → VERIFY → RECONCILE — never "write succeeded therefore correct".
