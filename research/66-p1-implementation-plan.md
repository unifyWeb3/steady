# 66 — P1 Implementation Plan (Not Implemented)

This is a planning artifact only. P1 work starts after a fresh live Gate 2-6 run and human wallet E2E.

1. Remove browser/domain duplication: expose shared JS-safe ticket, lifecycle, and score reducers from `lib/` or generate a browser build; add parity tests against the shipped bundle.
2. Fix DOWN calibration orientation: normalize BUY_NO fill prices to side probability before Brier/Edge; add BUY_YES/BUY_NO vectors with resolved YES and NO winners.
3. Redemption idempotency and UNKNOWN reconciliation: add a single-flight guard, persist `{attemptId, entries, txHash, status}`, poll `getTransactionReceipt`, then re-scan claimable balances before declaring redeemed.
4. External-field escaping: validate addresses/IDs/enums and replace indexer-derived `innerHTML` with text nodes or an escaping helper. Keep explorer URLs built only from validated hashes.
5. Runtime endpoint contract: read browser-safe endpoint values from an explicit generated config; validate chain ID and reject non-Shannon endpoints before SDK construction.
6. Request-generation guards: add `AbortController`/generation tokens to discovery, selection, fills, and settlement scans so an older response cannot overwrite newer state.
7. Frontend/backend state consistency: share one position-state schema with `UNKNOWN`/`STALE` provenance, expose read timestamps/source, and reconcile cached rows against current chain reads on reload.

Borrowed principles from the reviewed repositories: IACTA's receipt-backed recomputation and restart reconciliation, Deltr's deterministic risk-gate checklist, Veyctum's independent transaction-effect verification, Crucible's fault-injection matrix, and LENS's browser-observable regression contracts. No code or protocol dependency from those repositories is copied into Steady.

Detailed comparison: `research/67-peer-repo-edge-audit.md`.
