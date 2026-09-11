# 69 — P1 Verification (2026-09-09)

| P1 item | Status | Evidence |
|---|---|---|
| P1-1 canonical browser-safe domain path | PASS | `lib/steady/trade-intent.js`, `position-state.js`, `scoring.js`; app imports canonical modules; compatibility export retained |
| P1-2 BUY_NO Brier/Edge orientation | PASS | `outcomeProbabilityFromYesPrice`; regression test covers YES-term 0.25 → BUY_NO 0.75 |
| P1-3 redemption idempotency/state machine | PASS | single-flight guard and `READY/SUBMITTING/UNKNOWN/CONFIRMED/FAILED/REDEEMED`; post-receipt scan required |
| P1-4 external HTML safety | PASS | `escapeHtml`, validated explorer links, malicious-input regression tests, interpolated external fields escaped |
| P1-5 centralized browser config | PASS | `getBrowserConfig()` validates chain 50312 and URL protocols; no secrets exposed |
| P1-6 stale-response protection | PASS | generation guards for discovery, selection/book, fills/enrichment, score, and redemption |
| P1-7 indexer incident investigation | PASS | `research/68-indexer-incident.md` records DNS, HTTPS, GraphQL, SDK, endpoint search, and safe fallback |
| P1-8 fresh validation | BLOCKED | Gate 1 PASS; Gate 2 blocked by SDK `EAI_AGAIN`; no fresh live protocol evidence claimed |
| P1-9 local/browser verification | PASS | 12 unit test files / 60 cases pass, build, syntax, diff check, Playwright 6/6 |
| P1-10 status/handoff/research records | PASS | implementation status, memory, handoff, research log updated for this milestone |

## Scoring convention

SDK fill prices are raw YES-term probabilities. The canonical scoring reducer uses `p = fillPrice / 1e6` for BUY_YES and `p = 1 - fillPrice / 1e6` for BUY_NO, then computes Brier as the mean `(p - outcome)^2` and Edge as `winRate - mean(p)`. Void calls are excluded, and fewer than five settled non-void calls returns the honest insufficient-history state.

## Exact checks

- `npm test`: PASS (12 unit test files, 60 cases)
- `npm run build`: PASS
- `node --check app/app.js`: PASS
- `git diff --check`: PASS
- `npx playwright test tests/e2e --reporter=line --workers=1 --timeout=60000`: 6/6 PASS (rerun after one transient wallet-connect timeout)
- `npm run validate`: Gate 1 PASS; Gate 2 BLOCKED by `getaddrinfo EAI_AGAIN dev.smk.somnia.host`

The browser suite exercises the honest outage/retry path and mocked wallet connection. It does not prove a real extension popup signature or a new live transaction.

## Verification refresh — 2026-09-09 19:44 WAT

- Added focused tests for redemption single-flight starts, timeout/hash classification, matching-claim filtering, request-generation invalidation, and explicit UP/DOWN Brier and Edge values.
- `npm test` now reports 60/60 passing cases across 12 unit files.
- Direct indexer checks resolved DNS and answered shaped GraphQL probes; Shannon RPC separately returned chain `0xc488` (`50312`). The SDK `listLiveBinaryMarkets` call still failed with `EAI_AGAIN`; Gate 2 remains BLOCKED. HTTP `HEAD` returned 500, so these direct probes are not treated as healthy SDK discovery evidence.
- No fresh live market, fill, settlement, or redemption evidence is claimed. Historical evidence remains historical.

Final exact-tree rerun at 21:29 WAT: 60/60 unit cases, build, syntax, diff check, and Playwright 6/6 passed. `npm run validate` again passed Gate 1 and failed Gate 2 with SDK DNS `EAI_AGAIN`; the live-read blocker is unchanged.

## Fresh gate disposition

| Gate | Current disposition | Evidence |
|---|---|---|
| 1 — SDK client creation | PASS | Fresh `npm run validate` created `SomniaMarkets` with Shannon addresses |
| 2 — live market discovery | BLOCKED | SDK `listLiveBinaryMarkets` failed during DNS resolution with `EAI_AGAIN` |
| 3 — on-chain market status | NOT RUN | Harness stops after the Gate 2 failure; no fresh market ID was authorized |
| 4 — orderbook/book parameters | NOT RUN | Requires a fresh discovered market; historical reads remain historical |
| 5 — write/IOC/fill | NOT RUN | No funded write was attempted and no new transaction evidence is claimed |
| 6 — claimable/redemption | NOT RUN | No fresh claim scan or redemption was attempted |

The direct `eth_chainId` result (`0xc488`) proves RPC chain identity/connectivity only; it does not substitute for the SDK discovery gate.

## Release-gate audit refresh — 2026-09-09

- Local gates: `npm test` **PASS (60/60)**; `npm run build` **PASS**; `node --check app/app.js` **PASS**; `git diff --check` **PASS**.
- Browser E2E: Playwright `tests/e2e` **6/6 PASS** with the local server. The suite proves shell/error handling, mocked wallet connection, ticket shell, and 375px overflow behavior; it does not prove a real extension popup signature.
- Official live validation: `npm run validate` **BLOCKED** on two fresh runs at Gate 2 with SDK `fetch failed` / Node `getaddrinfo EAI_AGAIN dev.smk.somnia.host`. One separately captured exact SDK retry returned 16 rows, but intermittent success is not a release-gate pass.
- Production smoke: `https://somnia-snowy.vercel.app/` and `/terminal` returned HTTP 200. Chromium checks at 1280px and 375px found no horizontal overflow and no broken HTTP responses. The terminal rendered the honest indexer timeout/unavailable state; no production live-market proof was claimed.
- Confirmed UI defects: none. The mobile stage rail's horizontal scroll is intentional and the outage state exposes a working Retry action; no clipping, dead action, contradictory ticket value, loading deadlock, broken link, or misleading executable status was reproduced.
- No funded write, popup signing, settlement, or redemption was attempted. Historical hashes remain historical.
