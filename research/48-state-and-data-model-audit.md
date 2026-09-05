# 48 — State & Data Model Audit (no database — justified)

## State inventory
| State | Owner | Persisted | Canonical? | On refresh | On reconnect | Lag behavior |
|-------|-------|-----------|------------|------------|--------------|--------------|
| Markets (live rows) | indexer → `marketsCache` (memory) | No (re-fetch 90s) | Indexer is cache; chain `getMarketOnchain` is truth for status | Re-discovered | Re-validated | 12s timeout → error card, never stale-as-live |
| Selected market | UI (`selected`) | No | Ephemeral | Lost (must reselect) — acceptable, prevents stale-ticket trades | Lost | — |
| Book + tick/lot | RPC per selected pool | No | Chain truth at read time | Re-fetched on select | Re-fetched | Re-read before every sign (never cached across execution) |
| Wallet addr/client | wallet extension | No (extension owns) | Extension | `accountsChanged` → reload | Re-request | Wrong chain → switch/add flow |
| tUSDC balance | chain → `window.__tUSDCBalance` | No | Chain | Re-fetched on connect | Re-fetched | Fallback 10k preview only pre-connect, labeled |
| Fills | indexer → `fillsCache` | No | Indexer (lags); receipt is truth for own tx | Re-fetched post-tx (3s) | Re-fetched | UNKNOWN poll covers gap |
| Settled calls | derived fills + onchain | No | Chain (`winningOutcome`) | Recomputed | Recomputed | <5 → honest "Need 5 settled" |
| Cooldown | derived + `localStorage steady:cooldownUntil` | Yes (local only) | Derived streak + stored expiry | Restored if future, else cleared | Same | Cross-tab divergence possible (accepted: per-browser discipline, documented) |
| Receipts | per-trade DOM + console | No | Chain (tx hash) | Lost on reload — **GAP**: refresh loses receipt view (tx still verifiable via explorer/fills). P2: persist last receipt in localStorage. | — | — |
| Tx SUBMITTING flag | memory (`window.__submitting`) | No | — | Lost → buttons re-enable (safe: no auto-retry, receipt poll only if hash known) | Lost | Safe direction (no duplicate) |

## Why no database
All durable truth lives on-chain (fills, balances, outcomes, receipts) or in the wallet (identity). The app is a *view + signing shell*: everything is re-derivable via SDK reads. A DB would add custody, sync, and secret-handling risk for zero protocol need. `localStorage` holds exactly one value (cooldown expiry) — everything else recomputes. **Justified: no backend.**

## Never-duplicated / safely-recomputed
- Never duplicated: signed txs (SUBMITTING guard + no auto-retry + UNKNOWN reconciliation).
- Safely recomputed: markets, book, fills, scores, discipline streak, claimables.
