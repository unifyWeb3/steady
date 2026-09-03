# 32 — Control Plane

**Policy → execution → reconciliation → audit — one coherent system, not seven modules.**

## Policy (first-class, at boundary)
Location: `lib/steady/discipline.ts` + `lib/steady/ticket.ts` called from `lib/dreamdex/execution.ts` before `trader.placeOrder`.

Rules (all deny with exact reason, cannot be bypassed by UI click):
- maxLoss >0, price (0,1), tick-snapped (InvalidPrice)
- quantity >0 after lot snap, >= minQuantity (lot 1000)
- market status 1 Trading (on-chain, not indexer)
- headroom >=60s (Lock avoidance)
- liquidity: bestAsk exists, or show ImmediateOrCancelNoFill honest (empty book)
- spread max (e.g., >0.10 deny — not yet enforced, but rule exists)
- wallet STT >=0.6 envelope, tUSDC >= payRaw (or faucet)
- cooldown: streak >=2 losses → blocked 3min (discipline)
- concurrent positions: (future) max 3 LIVE
- allowed intervals: 60/300/900/3600 (no hardcode 900/3600 only)

Engine returns `{ pass: boolean, code: string, reason: string }`. UI must render reason, not generic error.

## Execution authorization
- Browser wallet: `walletClient` via `createWalletClient(custom(window.ethereum))`, `client.createTrader({ walletClient })` — private key never in browser
- Test harness: `privateKey` via `client.createTrader({ privateKey })` — local only
- Fixed fees 60 gwei / 10M gas (SDK default) — never estimated per-order

## Audit
Every trade produces `TradeReceipt`:
```
tradeAttemptId (uuid v4, client-side)
marketId, pool, asset, intervalSec, expirySec
direction (BUY_YES/BUY_NO), quantityRaw, priceRawQuoted, priceRawActual (fill)
maxLossRaw, payRaw, payoutRaw, profitRaw, spread, expiry
policyChecks[] { rule, pass, code }
wallet, txHash, orderId, fillId, timestamp
source: indexer|chain|receipt
```
Distinguish QUOTED vs ACTUAL (fillPrice 0.021 vs quoted 0.049 verified).

## Reconciliation
States: PENDING (submitted) → CONFIRMED (receipt success) → INDEXED (getUserFills) → SETTLED (status 4/5) → REDEEMED (balance 0 after redeem) + UNKNOWN/STALE/CONFLICTING.
Detect: tx mined but fill missing (indexer lag), fill but position not detected, settlement but redemption unavailable, redemption but balance not updated.

## Observability
Structured console logs with `tradeAttemptId` across policy→quote→order→tx→receipt→fill→position→settlement, no secrets. Use `getViemClient().getTransactionReceipt` + `getUserFills` for verify.

## Receipt UI
Settlement surface shows: market → resolution → outcome → oracle URL → tx evidence + Policy Passed badge + QUOTED vs ACTUAL.

## Automation (lightweight, justified)
- Expiry monitor: refresh markets every 30s, re-validate selected market still Trading
- Settlement monitor: poll `getMarketOnchain` for LOCKED→RESOLVED
- Reconciliation: retry fills after 3s if receipt success but fills empty (indexer lag)
- Cooldown timer: countdown every 1s

Skip: background job queue, DB, heavy event store.

## Agent workflow (documented, not shipped)
`monitor → evaluate → propose → policy-check → approval → execute → verify → report`. LLM may propose, policy decides, user authorizes, system verifies. No unrestricted wallet.

