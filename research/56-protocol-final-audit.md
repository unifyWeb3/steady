# 56 — Protocol Final Audit (2026-09-05; SDK 0.29.0 still latest, no drift)

Re-verified against installed `node_modules/@somnia-chain/markets-sdk` + live Shannon behavior:

- placeOrder path: `trader.placeOrder({pool, side, price, quantity, orderType: 2, expireTimestampNs})` — ORDER_TYPE.MARKET=2 IOC. No SDK API change since 0.29.0.
- Expiry nanos: now+120s capped at marketExpiry−10s; `OrderAlreadyExpired` on past values — handled.
- Tick/lot/min: 1000/1000/1000 (6-dec testnet); float→bigint via tick snap; qty 0 after snap blocked with message.
- Lifecycle: status 1 gate before every write; pools recycled → key by marketId (verified: same pool served successive markets in fills).
- Funding/allowance: tUSDC faucet 10k; SDK auto-allowance qty-based; `0xfb8f41b2` mapped to guidance.
- Receipts: `receipt.status` + logs; OrderPlaced/OrderFilled evidenced via `getUserFills` (fill IDs `477265538_8`, takerOrderIds) — a bare success receipt is never trusted alone.
- Quoted vs actual: proven twice (49000→21000; 742000→722000 / 258000→701000). UI labels QUOTED vs ACTUAL everywhere.
- Settlement/redemption: Finalized scan (never loadMarkets), `getOutcomeBalance{account,id}` (param name corrected 2026-09-03), redeem winner-only / void-both, losing redeem correctly pays 0 (verified by *not* redeeming 0x...107fc).
- Void: 0.5 both sides surfaced in copy; no live void observed on our fills (honest gap, unit-covered).
- Indexer lag: reads re-validated on-chain before writes; WS unused for critical path (polling 90s + on-demand) — no stale-quote execution: book re-read inside `execute()` after gate.
- No SDK upgrade needed. No example drift affects us (we use only verified surfaces).
