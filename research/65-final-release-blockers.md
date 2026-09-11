# 65 — Final Release Blockers

## P0 correctness report — 2026-09-08

This report covers the authorized correctness/security/reconciliation scope only. No new live protocol evidence is claimed: `npm run validate` reached Gate 1 and failed at Gate 2 because the configured indexer hostname intermittently returned `EAI_AGAIN` from this environment.

| P0 | Result | Exact implementation | Regression/evidence |
|---|---|---|---|
| P0-1 DOWN consistency | **PASS (test-proven)** | `app/trade-intent.js:20-224` owns side-aware intent, both fresh side slots, and `buildIocOrder`; `app/app.js:372-448,968-1017` uses the same intent for preview and signing | `tests/unit/trade-intent.test.mjs` compares BUY_NO display economics with submitted `side/price/quantity` and both fresh slots; current suite 48/48 passes |
| P0-2 fresh book | **PASS (test-proven)** | `app/app.js:821-919` reads current status, fresh orderbook, re-reads status, then builds intent; book failure returns `BOOK_UNAVAILABLE` | Narrow preview vs wide fresh-book denial regression in `tests/unit/trade-intent.test.mjs`; browser timeout path is explicit |
| P0-3 fail-closed status | **PASS (test/browser-proven)** | `app/app.js:191-347,455-492,566-580,821-919`; discovery persists/renders only status `1`; unknown position enrichment is `UNKNOWN` in `lib/steady/positionState.ts:15-63` | status-unavailable rows render retry state; unknown status test passes; Playwright 6/6 |
| P0-4 zero-fill semantics | **PASS (test-proven)** | `app/trade-intent.js:236-279` separates transaction/order/fill evidence and exact indexed-fill reconciliation; `app/app.js:1011-1049,1113-1125` renders `TRANSACTION CONFIRMED · NO FILL`, `FILL VERIFIED`, or fill-unknown recovery | zero-fill, fill, and late-receipt evidence tests; order acceptance requires order ID/event or a verified fill |
| P0-5 incomplete redemption scan | **PASS (test-proven)** | `app/app.js:1207-1270` returns attempted/completed/failed fallback evidence; `app/trade-intent.js:281-300` returns explicit scan result; incomplete fallback renders `Claims unavailable` | complete-empty vs incomplete vs partial-with-claims tests; fallback never claims full on-chain verification |

### Network investigation

- Read path: `SomniaMarkets` 0.29.0 → `listLiveBinaryMarkets` over `https://dev.smk.somnia.host/v1/graphql`; on-chain reads use the Shannon RPC from the SDK chain definition.
- Current result: `npm run validate` Gate 1 PASS, Gate 2 FAIL with `getaddrinfo EAI_AGAIN dev.smk.somnia.host`.
- DNS evidence: `dig +time=5 dev.smk.somnia.host` resolved `8.233.178.19`; a direct HTTPS request returned HTTP 200 with `PersistedQueryNotSupported` for an unshaped request, so the host is reachable but the SDK request still failed in this run.
- RPC evidence: Shannon endpoint returned `eth_chainId = 0xc488` (50312).
- Alternate documented read path: none for market discovery. `listPastBinaryMarkets` is also indexer-backed (`dist/createClient.js:419-424`, `dist/markets.d.ts:809-832`); it is not a safe live-discovery fallback.
- Safe fallback: keep the app shell usable, clear stale market selection, show retry/status-unavailable, and do not sign orders. Do not claim a fresh Gate 2 pass.

## Latest live retry — 2026-09-09

`timeout 50 npm run validate` reproduced the same boundary: Gate 1 SDK client creation passed, while Gate 2 `listLiveBinaryMarkets` failed before any market data was returned with `getaddrinfo EAI_AGAIN dev.smk.somnia.host`. This confirms the blocker is still external indexer/DNS reachability; it does not invalidate the local P0 tests or authorize a new live-protocol claim.

## Additional P0 verification — 2026-09-09

The late-receipt reconciliation branch was hardened so a recovered successful receipt is never treated as a fill without matching `getUserFills` evidence for the same market and transaction. Current local verification is 48/48 unit tests, build pass, syntax pass, diff check pass, and Playwright 6/6 pass. No new live transaction evidence is claimed.

## Prior audit snapshot (superseded by the P0 report above)

| Finding | Evidence | Impact | Fix | Effort | Owner |
|---|---|---|---|---|---|
| DOWN ticket display does not match BUY_NO parameters | `app/app.js:367-386`; preview uses `yes`, execution computes `sidePrice` for NO | User may sign a trade whose displayed pay/qty/profit are false | Build/render one side-aware ticket per action, or show separate UP/DOWN values tied to exact params | 2–4h | Frontend |
| Live end-to-end release is not currently evidenced | `npm run validate` Gate 2 fails DNS; browser popup path intentionally mock/unverified | Cannot truthfully claim current live market discovery and browser execution | Restore indexer, rerun Gates 1–6, perform real MetaMask UP/DOWN and redemption, capture hashes/fills | 1–3h external + 1h | Release owner |
| Claimable fallback can say “Nothing claimable” after scanning zero markets | `app/app.js:1080-1091`; empty `fillsCache` produces empty on-chain scan | Winnings can be stranded and UI asserts a conclusion without complete coverage | Report “scan incomplete” unless market universe is known; use Finalized discovery/cache with explicit stale state | 2–4h | Frontend/domain |

## P1

| Finding | Evidence | Impact | Fix | Effort | Owner |
|---|---|---|---|---|---|
| Spread gate reads stale book | `app/app.js:798-820` reads `bookNow`, line 820 uses `book` | Wide current spread can bypass policy | Compute spread from `bookNow` and use same snapshot for quote/policy | 15m | Frontend |
| DOWN Brier/Edge uses YES-term price | SDK `units.d.ts:167-190`; `app/app.js:675-684` uses `f.fillPrice` unchanged | Calibration and discipline evidence are wrong for NO fills | Invert BUY_NO prices or call a shared tested converter | 30–60m | Domain/frontend |
| Status-read failure falls back to live rows | `app/app.js:225-233` | UI labels unverified markets as Trading | Only render status-1 rows; otherwise show stale/unknown/error | 30m | Frontend |
| Preview balance/depth cap is unused | `app/app.js:323` computes `availableRaw` but never applies it; `bookDepth` not used | Ticket may show unexecutable quantity | Apply balance/depth caps or mark values as indicative | 30–60m | Frontend |
| Redemption lacks idempotency and UNKNOWN handling | `app/app.js:1066-1111` no guard/poll | Double click or timeout can create ambiguous redemption state | Disable/guard, retain attempt/hash, poll receipt before failure | 1–2h | Frontend |
| Enrichment failure can render LIVE | `app/app.js:577-603` fallback resolver | Unknown position state is presented as active | Add UNKNOWN/STALE state or explicit unresolved badge | 1h | Frontend/domain |
| External indexer fields enter innerHTML unescaped | `app/app.js:251,627,636,1034` | Malicious/compromised indexer data can inject markup | Validate enum/hex fields and use text nodes/escaping | 1–2h | Frontend |
| Browser has CDN/config single points of failure | import map esm.sh; hard-coded URLs in `app/app.js` | Cold browser or CDN/indexer outage blocks normal demo | Bundle pinned dependencies or provide explicit unavailable state/config | 2–6h | Frontend/release |

## P2

| Finding | Evidence | Impact | Fix | Effort | Owner |
|---|---|---|---|---|---|
| Receipt DOM disappears on reload | `research/48` and no receipt persistence in `app.js` | Proof is not durable in the UI | Persist last receipt metadata, never as authority | 1h | Frontend |
| Static server/config lacks security headers | `serve.mjs:13`, `vercel.json` only build/output | Reduced defense in depth | Add CSP/nosniff/referrer policy after validating CDN needs | 1–2h | Release |
| Discovery requests can overlap | 90s interval + 15s retry; no request generation guard | Older response can overwrite newer rows | Add abort/generation token | 30m | Frontend |
| Domain lifecycle helper can assume WON without winner side | `lib/steady/lifecycle.ts:10` | Future callers can misclassify resolved losers | Require winner/outcome input or remove helper | 30m | Domain |

## P3

| Finding | Evidence | Impact | Fix | Effort | Owner |
|---|---|---|---|---|---|
| No current video/deck evidence in this audit | `research/60`, `README` claims demo section but no artifact here | Presentation score only | Record/link after P0 live proof | 1–2h | Submission owner |
| No current 390px capture in this audit | Existing historical status claims 375px only | Minor judge confidence gap | Capture after live pass | 15m | Submission owner |
