# Implementation Status — Steady

## P0 correctness hardening — 2026-09-08 (current)

Authorized P0 fixes are implemented. Current verification: 48/48 unit tests, build pass, syntax pass, and Playwright 6/6. A fresh `npm run validate` reaches Gate 1 but Gate 2 currently fails with indexer DNS `EAI_AGAIN`; no new live Gate 2-6 evidence is claimed.

| P0 | Status | Evidence |
|---|---|---|
| DOWN consistency | PASS (test-proven) | `app/trade-intent.js` owns side-aware economics and `buildIocOrder`; regression compares DOWN display with BUY_NO order params |
| Fresh orderbook | PASS (test-proven) | `execute()` reads status, fresh book, rechecks status, then constructs the order; failures deny with explicit codes; stale-book regression passes |
| Fail-closed status | PASS (browser/test-proven) | discovery persists only on-chain status `1`; stale selection clears; unknown enrichment is `UNKNOWN` |
| Zero-fill IOC | PASS (test-proven) | evidence separates transaction confirmation, order acceptance, and fill verification; UI says `TRANSACTION CONFIRMED · NO FILL` |
| Incomplete redemption | PASS (test-proven) | bounded fallback returns attempted/completed counts and cannot report empty unless the indexer scan is complete |

See `research/65-final-release-blockers.md` and `research/66-p1-implementation-plan.md`.

Last updated: 2026-09-10 - lifecycle unknown-state alignment plus the approved frontend finishing pass. The current local verification is recorded below; live Gate 2 remains blocked by indexer DNS EAI_AGAIN.

## Current Phase
**Phase 1 — Steady Live** — **Gates 1-5 Re-verified 2026-09-03, 13 unit tests PASS, app shell live :5173 (real SDK via esm.sh, warm paper, no purple glow), lib/dreamdex + lib/steady complete**

## Completed
- [x] Research package 00-27 + SOURCES + RESEARCH-LOG verified (SDK 0.29.0, chain 50312, Event Contracts BTC/ETH 1m/5m/15m/1h live)
- [x] Product selected: Steady (discipline-first terminal) — see `research/18-product-selection.md`
- [x] `AGENTS.md` created (non-negotiables, SDK constraints, env contract, contamination audit: 0 GenLayer hits in `/home/unify/somnia`)
- [x] `research/25-runtime-requirements.md` — exact chain/RPC/indexer/addresses from SDK source (`somniaShannon.js`, `addresses.js`)
- [x] `research/26-environment-contract.md` — browser/server/wallet split (no `NEXT_PUBLIC` secrets)
- [x] `research/27-integration-validation.md` — harness spec 1-5 (real, no mocks)
- [x] `research/28-handoff-state.md` — live handoff (read PASS, write now PASS)
- [x] `.env.example` + `.env` + `.gitignore` (secrets gitignored, burner present locally but never committed)
- [x] `scripts/validate/validate.mjs` — real harness (SomniaMarkets + shannon + SOMNIA_TESTNET_ADDRESSES, bigint-safe)
- [x] `scripts/validate/post_verify.mjs` — post-fill verification helper
- [x] **Live verification: gates 1-5 PASS with real mined tx (0xed05c…72464c)**
- [x] `lib/dreamdex` + `lib/steady` + `lib/config` — real integration + pure domain, no backend
- [x] `research/29` + `30` design + quality gates
- [x] `research/31` + `31a Cairn transfer` + `32-36` control-plane/reconciliation/audit/reliability
- [x] `app/` static shell (warm paper, JetBrains Mono, no purple glow) on :5173 with real SDK via esm.sh, wallet via window.ethereum, no mocks
- [x] `tests/unit` 13/13 PASS (ticket, scoring, discipline) — pure, deterministic, no SDK mocks
- [x] `npm run validate` re-verified 2026-09-03 19:26: 14 live, Trading pool 0x171186a2, book 0.751/0.777, tick 1000
- [x] Frontend reconstruction 2026-09-04: `design.md` system + `research/38` (direction C selected) + homepage/terminal rebuild + `research/39` browser QA (qa-* shots 1280/390, 4 live rows, live ticket 25.00→26.04, fixes: header nowrap, mobile empty-td, steps 1-col, mktShort IDs); gates 1-4 re-PASS 2026-09-04 (14 live, book 0.590/0.619, tick/lot 1000), 13/13 unit, dist 84K no secrets

## Validation Gates (must pass before `app/`)

| Gate | Check | Status | Evidence |
|------|-------|--------|----------|
| 1 | SDK client creation (`new SomniaMarkets` with `SOMNIA_TESTNET_ADDRESSES`) | ✅ PASS | 2026-09-01 21:54 live: binaryModule 0x3ecC69 |
| 2 | `listLiveBinaryMarkets` returns BTC/ETH windows | ✅ PASS | 14 live (60s/300s/3600s) steady-filtered 4 — live 21:54 |
| 3 | `getMarketOnchain` status `1` filtering | ✅ PASS | status 1 Trading pool `0x246a65643ad8b6C6Dbd0b017A259DA07681242FD` market `0x3c96c5b263137E4d6Fe52C83324C9980d6D2C510` |
| 4 | `getBinaryOrderBook` + `getBinaryBookParams` | ✅ PASS | yesBids 1 yesAsks 3 tick 1000 lot 1000 (6-dec) — book 0.008/0.029 |
| 5 | Real IOC with tick/lot + `expireTimestampNs` nanos | ✅ PASS | tx `0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c` status success block 477265538 gas 828682 — see below |

### Gate 5 detail (real transaction)
- **Wallet:** `0x0d6FAee78dFF4380E77D0e412F5Cddd942673719` (derived, not secret)
- **Balances pre-trade:** STT `49.99144112` (49991441120000000000 wei), tUSDC `9999.999078` (9999999078 raw, after faucet `0xb0bd7bb1bbc01ebc6067a11eb5cbbe923bc5f073861079c84e348fd7dc908e46` minted 10k)
- **Faucet:** `trader.faucet()` verified — collateral `0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E`, 6 decimals, cap 10k (SDK addresses.js)
- **Market:** `0x00000000000000000000000000000000000000000000000000000000000107fc` (BTC 3600s), pool `0x246a65643ad8b6C6Dbd0b017A259DA07681242FD`, status 1 Trading, expiry `1788300000` (2026-09-01T22:00:00Z, 6m50s headroom at send), `getBinaryBookParams` tick 1000 lot 1000
- **Orderbook at send:** yesAsk `29000n` (0.029), next `37000n`; yesBid `8000n` (0.008)
- **Order params (real):** `pool 0x246a…`, `side BUY_YES`, `price 49000n` (0.049 = 29000+20000 cross), `quantity 1000n` (1 lot), `orderType 2 MARKET/IOC` (not FOK 1), `expireTimestampNs 1788299726000000000` (now+120s capped at marketExpiry-10s) — tick-snapped via `(price/tick)*tick`, nanos verified
- **Tx:** `0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c` — `status success` `block 477265538` `gasUsed 828682` `logs 8` (ERC20 transfers)
- **Fill (verified via `getUserFills`):** `fillPrice 21000` (0.021, taker charged fill not quoted per gotcha), `quantity 1000`, `quoteQuantity 21` (0.000021 tUSDC? actually 21 raw = 0.000021? but quote is 6-dec so 21 = 0.000021? — however book was 0.029, fill 0.021 shows improvement), `kind DIRECT_YES`, `taker BUY_YES` vs `maker SELL_YES 0x8a5093c7...`, `takerOrderId 55340232221128712364`
- **Approval:** none needed beyond faucet tUSDC (SDK auto-handles ERC20 allowance qty, not escrow)
- **Post-state:** `getMarketOnchain` now status 4 Finalized (both fills settled, winning 0 for 0x...1074a, 1 for 0x...107fc); `getBinaryOrderBook` after: yesAsks `20000n/28000n/35000n` (book moved); `getUserFills` count 2 (includes prior `0x4621e9...` on `0x...1074a`)
- **Redemption (LIVE-PROVEN 2026-09-03 20:50):** market `0x...1074a` winning 0 YES — before balYes 1000 tUSDC 9999.999057 → redeem `0x3aa5ec79dc9542633545645b540ec9d45c5a470ea86d8c8eb33054cbc1e77444` status success block 478925556 gas 272707 logs 2 → after balYes 0 tUSDC 10000.000057 delta +0.001 (1 lot =0.001 contracts) — proves CLAIMABLE→REDEEMED; losing market `0x...107fc` winning 1 with YES 1000 correctly not claimable (would pay 0)
- **Explorer:** `https://shannon-explorer.somnia.network/tx/0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c`

Previous **FillOrKillNotFillable** failure at 20:51 (same market `0x...1074a` pool `0x3bf5a438...` with `orderType 1 FOK` + non-crossing `550000` vs ask `819000`) was harness bug, not protocol — corrected to IOC + crossing price; classified as **IOC liquidity / order construction** (see research/28).

## Live Environment (verified live)

| Item | Value | Verified |
|------|-------|----------|
| Chain | `50312` Shannon testnet | `somniaShannon.js` + live gate 1 |
| RPC http | `https://api.infra.testnet.somnia.network` / `https://dream-rpc.somnia.network` | SDK chain def |
| RPC WS | `wss://api.infra.testnet.somnia.network/ws` | SDK chain def |
| Indexer | `https://dev.smk.somnia.host/v1/graphql` | gate 2 live success |
| Explorer | `https://shannon-explorer.somnia.network` | SDK chain def |
| SDK | `0.29.0` | `package.json:10` + harness header |
| Addresses | `SOMNIA_TESTNET_ADDRESSES` (`0x3ecC69...` `0x70a86D...`) | imported, not hardcoded |
| Wallet | `0x0d6FAee...3719` | derived via `privateKeyToAccount`, not logged secret |
| STT | `49.99` | `getBalance` live |
| tUSDC | `9999.999078` (post-faucet) | `getErc20Balance` live |
| Collateral decimals | 6 | addresses + `getBinaryBookParams` |
| Faucet | `trader.faucet()` 10k cap | live tx `0xb0bd7bb1...908e46` |

## Status Reconciliation — 2026-09-03 (corrected, replaces optimistic Todo)

| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Research 00-30 | VERIFIED COMPLETE | Gates 1-4 re-verified 19:26, 04 assumption updated (60/300/900/3600 live), 29 warm paper live via app/style.css | — |
| Integration core lib/dreamdex | VERIFIED COMPLETE | Gates 1-5 PASS with real tx 0xed05c…72464c, post_verify receipt+fill, lib/dreamdex/*.ts real SDK | — |
| Steady domain lib/steady | VERIFIED COMPLETE (unit) / PARTIALLY COMPLETE (live) | 13/13 unit PASS; Brier/Edge <5 → null honest; live Brier needs 5 settled — currently 2 fills, not yet 5 | Need 3 more settled or test-prove |
| Frontend shell app/ | PARTIALLY COMPLETE | Shell decoupled from SDK/indexer (lazy import, 12s timeout + Retry, boot guard); homepage `/` + dashboard `/terminal.html` structure; warm paper verified in chromium (rgb 252,250,247, no purple) | Manual popup signing + mobile screenshots |
| Browser wallet E2E (popup) | CODE-EXISTS-BUT-UNVERIFIED | Mock-Rabby connect PASS in chromium; `createTrader({walletClient})` shares placeOrder with Node LIVE-PROVEN 0x6f6beb…/0x882858…; mock throws honestly on eth_sendTransaction | Manual MetaMask test needed |
| Positions inbox | PARTIALLY COMPLETE | getUserFills 2 live, table renders, but lifecycle PENDING→CONFIRMED→INDEXED proven, SETTLED→REDEEMED not yet live (no Finalized with our market yet) | Wait for lock or use known Finalized |
| Settlement/redemption | VERIFIED COMPLETE (live) | listPastBinaryMarkets Finalized + getOutcomeBalance account/id + redeemWinning LIVE-PROVEN 2026-09-03 20:50: 0x...1074a winning 0 YES 1000→0 via 0x3aa5ec…77444 success, 0x...107fc winning 1 YES correctly 0 | — |
| Policy at boundary | PARTIALLY COMPLETE | lib/steady/discipline + ticket checks exist, app.js checks status/headroom/tick/balance/cooldown before placeOrder, but tilt guard still placeholder (random) — not enforced at execution boundary yet | Wire discipline.ts before trader.placeOrder, disable button |
| Idempotency/failure safety | PARTIALLY COMPLETE | SUBMITTING disables? Not yet (double-click risk), UNKNOWN handling exists in 34 but not in app.js | Add tradeAttemptId + disabled |
| Observability | PARTIALLY COMPLETE | Structured logs with tradeAttemptId in validate.mjs, but app.js logs only console, not structured | Add tradeAttemptId to app.js |
| Tests | VERIFIED COMPLETE (unit) / PARTIALLY (integration/E2E) | 13 unit PASS; integration harness 1-5 PASS; E2E wallet→fill live via privateKey, not yet via browser | Browser E2E |
| Visual QA | PARTIALLY COMPLETE | Code inspection PASS per 30 (warm paper, mono, 8px, no glow), curl 200, but no mobile screenshot, no injected-wallet visual check | Render desktop/mobile, screenshot |
| Deployment | NOT VERIFIED | No production build, no deployed URL, no prod env smoke test | Build + deploy after browser E2E |
| Demo | NOT VERIFIED | No video, no traceable receipt demo | After full lifecycle |

## Blockers (reconciled) — updated 2026-09-03 20:50
- **Browser walletClient IOC NOW LIVE-PROVEN via http (same `createTrader({walletClient})` as browser):** BUY_YES 0x6f6beb… + BUY_NO 0x882858… both success on 0x...12994 pool 0x443904… at 2026-09-03 21:37 — proves browser path; privateKey path LIVE-PROVEN 0xed05c…
- Remaining consideration: indexer intermittency (ConnectTimeoutError at 21:29) — transient, not persistent; retry succeeded.

## P0 verification closure — 2026-09-09

- Added `research/67-p0-verification.md` covering DOWN economics, fresh-book execution, status fail-closed behavior, zero-fill IOC semantics, and incomplete redemption scans.
- Current local verification: `npm test` 48/48 PASS, `npm run build` PASS, `node --check app/app.js` PASS, `git diff --check` PASS, Playwright 6/6 PASS.
- Fresh `npm run validate` remains blocked at Gate 2: SDK `listLiveBinaryMarkets` fails with DNS `EAI_AGAIN dev.smk.somnia.host` after Gate 1 client creation. No new live protocol evidence is claimed.

## P1 architectural/release hardening — 2026-09-09

- Canonical browser-safe domain modules now live under `lib/steady/`; `app/app.js` imports shared trade-intent, scoring, position-state, DOM safety, redemption-state, and browser-config paths. `app/trade-intent.js` is compatibility-only.
- BUY_NO scoring converts SDK YES-term fill prices to the selected outcome probability before Brier/Edge calculation.
- Redemption is single-flight and stateful: `READY → SUBMITTING → UNKNOWN/CONFIRMED → REDEEMED|FAILED`; a mined receipt is not called redeemed until a complete post-receipt claim scan confirms no remaining claims.
- External values rendered into HTML are escaped; explorer links require a full 32-byte transaction hash. Added malicious-input, browser-config, BUY_NO scoring, and redemption-state tests.
- Browser configuration is centralized and chain/protocol validated. The static server and build now expose browser-safe `lib/` modules under `/lib/`.
- Request generations prevent stale discovery, selection, fills, scoring, and redemption completions from mutating current state.
- `research/68-indexer-incident.md` and `research/69-p1-verification.md` record the incident and P1 evidence.

Verification: `npm test` **PASS (12 unit test files, 60 cases)**; `npm run build` **PASS**; `node --check app/app.js` **PASS**; `git diff --check` **PASS**; Playwright **6/6 PASS**. `npm run validate` remains **BLOCKED at Gate 2** after Gate 1 because the SDK run received `getaddrinfo EAI_AGAIN dev.smk.somnia.host`; direct shaped GraphQL probes responded, but that does not establish a healthy SDK discovery path. No fresh live market, fill, settlement, or redemption evidence is claimed.

Verification refresh 2026-09-09 19:44 WAT: direct DNS resolved `8.233.178.19`; HTTPS `HEAD` returned 500 while shaped GraphQL probes returned `query_root` and one `Market.id`. A 21:32 WAT JSON-RPC probe returned `0xc488` (`50312`). The SDK discovery failure is unchanged and remains the authoritative Gate 2 result.

Final exact-tree rerun 21:29 WAT: 60/60 unit cases, build, syntax, diff check, and Playwright 6/6 PASS. Gate 1 PASS / Gate 2 SDK DNS `EAI_AGAIN` remains the current live validation result.

Fresh gate disposition: Gate 1 independently PASS; Gate 2 BLOCKED by SDK DNS; Gates 3–6 were not run because discovery stopped at Gate 2. The 21:32 WAT RPC `eth_chainId` probe returned `0xc488` (`50312`) but does not substitute for market discovery. No funded write or fresh live protocol evidence was attempted.

## Required credentials (now present, still never committed)
- `TEST_WALLET_PRIVATE_KEY` — present locally in `.env` (0x…66), 50 STT, 10k tUSDC — never `NEXT_PUBLIC_*`, never printed.

## Files changed this milestone
- `scripts/validate/validate.mjs` — fixed `orderType 1→2` + crossing price (`bestAsk+0.02` snapped) after FillOrKillNotFillable analysis
- `scripts/validate/post_verify.mjs` — new post-fill verification (receipt/fills/balances)
- `IMPLEMENTATION-STATUS.md` — gates 1-5 PASS + gate 5 detail
- `research/28-handoff-state.md` — updated to write PASS, discoveries
- `research/27-integration-validation.md` — add write gate verified details (to be updated)
- `research/RESEARCH-LOG.md` — gate 5 live proof (to be updated)

## Control-plane adoption (2026-09-02)
- Adopted: policy engine at execution boundary, trade receipt (quoted vs actual 0.021 vs 0.049), lifecycle PENDING→CONFIRMED→INDEXED→SETTLED→REDEEMED + UNKNOWN/STALE, audit Proof surface, structured logs with tradeAttemptId, idempotency guard, failure-first states, lightweight reconciliation (poll fills after 3s, re-validate MarketLocked).
- Rejected for MVP: heavy event-sourced ledger/DB, reputation beyond Brier/Edge, autonomous agent (documented as future `monitor→evaluate→propose→policy→approval→execute→verify`), token/payments, backend queue, Walrus/Seal/Sui stack (Cairn transfer 31a).
- Principle: simple outside, serious inside — policy→execution→reconciliation→audit→observability (Cairn philosophy, not its Sui stack).

## Discovery update (live)
- Indexer returns 60s/300s/3600s (not only 15m/1h) — harness steady-filter handles 900/3600 + will need 60/300 for full product; `research/04` needs update before UI hardcodes.
- SDK entry is `new SomniaMarkets` not `createClient` (not exported root) — harness verified.
- `getBinaryOrderBook` prices are raw bigint (tick 1000 = 0.001), not human; quantity 1000 = 1 contract at 6 decimals.
- `FillOrKillNotFillable` at 20:51 was harness bug (FOK+non-cross); IOC + crossing price succeeded at 21:54.
- Taker charged fill price 0.021 not quoted 0.049 (gotcha #7 verified live).

## Next action (exact command)
1. Update `research/27`, `research/28`, `research/RESEARCH-LOG` with gate 5 PASS details (done next)
2. Then unblock `app/` scaffolding per `research/24-implementation-plan.md`:
```bash
npm run validate   # re-verify reads before UI work
# next: scaffold Next.js + wagmi + tailwind for Steady ticket
```

## Do NOT do next (until handoff reviewed)
- Do not put private key in `NEXT_PUBLIC_*` or commit `.env`
- Do not mock fills/hashes — every hash above is mined on Shannon 50312
- Do not hardcode pool/market/venue addresses

## Backend track — WalletClient redemption (2026-09-06, no `app/` edits)
- `lib/dreamdex/redemption.ts` rebased on verified `getClaimable` → `redeemMany` (one tx; `walletClient` + `privateKey` both supported); legacy single-market path fixed to module-routed `redeem`.
- `lib/steady/positionState.ts` NEW — pure fill→`LIVE|SETTLING|CLAIMABLE|WON|LOST|VOID` resolver (tab-compatible only); wiring contract for frontend in `research/61-walletclient-redemption.md`.
- Harness **Gate 6** NEW (`getClaimable` read-only): PASS 2026-09-06 — 3 real claimables on funded wallet (2005000000/1243000/1000 raw, Finalized), deliberately NOT redeemed (demo camera).
- Tests **29/29 PASS** (was 13): +10 positionState, +6 redemption shapers. `npm run validate` gates 1-4 + 6 PASS; `npm run build` OK (dist 96K).
- New windows observed live: 4h/1d/45d BTC/ETH — filters unchanged (frontend call).

## Full-E2E wiring (2026-09-06 evening, `app/` — all branches merged to `main`)
- `redeemAll` is now a REAL close-out: `getClaimable` scan → `redeemMany` ONE tx via `walletClient` popup → receipt + `__redeemedKeys` demotion → ledger refresh. Empty scan = honest empty, never throws.
- Positions ledger state-enriched: `resolvePositionState` (verbatim port of `lib/steady/positionState.ts`, 6/6 vectors PASS against shipped `app.js`) fed by `getMarketOnchain` + 2× `getOutcomeBalance` per market (≤8 markets, all guarded). All 6 tabs now live.
- Policy gate reports live: ✓/✗/○ per check + `Authorized/Blocked/Check` badge (default `Check`, not green). Fixed boot bug where badge stayed `Authorized` with zero data.
- Discovery extended to 4h/1d (live per Gate 2); receipt has `Copy proof` text+link share.
- Verified: unit 29/29, build OK, Playwright 5/5 (during indexer 504 outage — honest-degradation path proven: shell usable, Retry, 0 overflow, no pageerrors), shipped-resolver 6/6, gate DOM check (○+Check, no errors).
- Indexer 504 outage ongoing at verification time (3× Gate 2 fails) — last full live PASS earlier today (gates 1-4 + 6, 3 claimables). No code path changed since; browser popup redeem still needs the human click (user manual check).

## Redeem diagnosis + hardening (2026-09-06 night — user reported redeem dead)
- Root causes found live: (a) indexer 504 outage kills `getClaimable`/`getUserFills` (all indexer-backed; chain RPC fine) — the button failed with no fallback; (b) REAL BUG: BUY_NO passed `1−(YESask+0.02)` as the YES-limit, over-crossing the NO book by ~0.09 and misprinting DOWN probability (SDK escrow: BUY_NO pays `1−price`; NO asks = `1−YESbids` per `toBinaryBook`) — fixed to cross NO asks by 0.02; (c) REAL BUG: half-connected wallet (address shown, `walletClient` null after SDK failure) made redeem alert despite "Connected" — connect is now atomic with clean reset; (d) `loadSdk` cached failures forever, bricking Retry until reload — now retries fresh; (e) redeem scan + fills had no timeout (UI dangled on "Scanning…") — 15s `withTimeout` everywhere indexer-backed; (f) "Balance Sufficient" gate was decorative — real balance gate in `execute()` with have/need numbers; (g) receipt "Actual: awaiting fill" faith gap closed — IOC fills ride in `PlaceOrderResult.fills` (in-tx average, YES-equiv + NO rate for DOWN).
- Outage armor: bigint-safe `localStorage` fills/markets cache; `scanClaimableOnchain` fallback (winner/void-with-balance via `getMarketOnchain` + ERC-6909 — both chain reads, outage-proof).
- PROVEN in Chromium just now (outage ongoing): fallback scan found the exact 3 Gate-6 claimables (NO 2005.000 + YES 1.243 + …) → `redeemMany` attempted → failed ONLY on mock-wallet signing (`rpc writeContract failed`), i.e. every line before the human popup works. With real MetaMask this pops ONE signature for ~2006 tUSDC.
- `lib/dreamdex/execution.ts`: new pure `crossingYesPriceForSide` (app ports it verbatim); tests 34/34 (new `pricing.test.mjs` ×5). Repo flipped PUBLIC (`gh repo view`: `steady`, PUBLIC).
- Still human-only: real popup signature (trade + redeem) on camera → video → BUIDL.

## P0 correctness hardening — 2026-09-08

| Finding | Code change | Test/result |
|---|---|---|
| DOWN preview could diverge from executable economics | Added browser-safe `app/trade-intent.js`; preview and execution now use the same side-aware YES/NO price, quantity, payout, spread, liquidity, headroom, status, and balance policy | `tests/unit/trade-intent.test.mjs`: UP/DOWN economics pass; full unit suite **40/40** |
| Spread check used stale preview book | Execution now rebuilds the canonical intent from a fresh orderbook and fresh on-chain status immediately before signing | Wide fresh-spread denial test passes |
| Market status discovery failed open | `loadMarkets()` displays/persists only rows with verified on-chain status `1`; status errors render retry/unverified state | Status-unavailable and locked-market denial tests pass |
| Mined zero-fill IOC was called completed | Receipt/status now distinguishes `FILL VERIFIED` from `NO FILL`; no-fill receipts explicitly say nothing was paid | Zero-fill classification test passes |
| Incomplete claim scan could say “Nothing claimable” | Redemption classifies complete-empty vs partial/incomplete scans; incomplete scans show retryable “Claims unavailable” | Claim-scan regression tests pass |

Verification: `npm test` **40/40 PASS**; `npm run build` **PASS**; Playwright `tests/e2e` **6/6 PASS** including honest indexer-timeout behavior; `node --check app/app.js` **PASS**. `npm run validate` was re-run but is currently blocked at Gate 2 by DNS `EAI_AGAIN dev.smk.somnia.host`; no new live protocol evidence is claimed from that run. Historical live IOC/redemption hashes remain independently confirmed above.

## Cairn-informed terminal hierarchy pass — 2026-09-08

Presentation-only milestone. No SDK, order construction, settlement, or protocol assumptions were changed.

- Reframed the terminal masthead around one accountable decision and made the execution narrative visible as `Discover → Decide → Control → Prove`.
- Made the workspace responsive by grid area rather than DOM-column order: discovery first, then the Honest Ticket, then positions, reconciliation, and calibration on mobile.
- Elevated the Honest Ticket with a restrained dark execute/proof band, numbered stage labels, a clear control-gate boundary, and quieter supporting telemetry rails.
- Corrected the top health treatment so `live windows`, `checking status`, and `status unavailable` are visually distinct. The outage state no longer presents an error count as live data.
- Preserved all existing honest loading, retry, empty, and wallet states. No decorative data or fake protocol state was added.

Visual evidence: `test-results/terminal-desktop.png`, `test-results/terminal-mobile-375.png`, and `test-results/minimal.png`. Verification after the pass: `npm test` **40/40 PASS**, `npm run build` **PASS**, `node --check app/app.js` **PASS**, `git diff --check` **PASS**, Playwright **6/6 PASS** with one worker. Direct fetch of `https://cairnsui.vercel.app` was unavailable from this environment (`Could not resolve host`); the local Cairn teardown in `research/40-42` was used as the design source.

## Lifecycle unknown-state alignment — 2026-09-09

- Aligned the standalone `lib/steady/lifecycle.ts` helper with the active position-state contract: unrecognized protocol statuses now map to `UNKNOWN`, never an implied `SETTLING` state.
- Added a regression test covering unknown status fail-closed behavior and known Trading status.
- Verification: 48/48 unit tests, build, syntax, diff check, and Playwright 6/6 pass. This is a local semantics change only; no new live protocol evidence is claimed.

## Late-receipt fill reconciliation — 2026-09-09

- A receipt recovered after an RPC timeout now reports `TRANSACTION CONFIRMED` separately and queries `getUserFills` for the exact market/transaction before showing `FILL VERIFIED`.
- Missing or lagging indexed evidence remains `FILL UNKNOWN`; it cannot be presented as a filled trade.
- Added pure `classifyIndexedFillEvidence` coverage. No live protocol evidence changed.

## Release-gate audit refresh — 2026-09-09

The frozen audit made no product-code changes. Local verification remains **60/60 unit tests PASS**, build PASS, syntax PASS, diff check PASS, and Playwright **6/6 PASS**. Two fresh official `npm run validate` runs passed Gate 1 and failed Gate 2 with SDK `fetch failed` caused by `getaddrinfo EAI_AGAIN dev.smk.somnia.host`; one separately captured exact SDK retry returned 16 rows, but this intermittent response does not upgrade Gate 2. Direct DNS/GraphQL/browser probes are recorded in `research/68-indexer-incident.md` and do not substitute for the official gate.

Production smoke of the existing `https://somnia-snowy.vercel.app` URL returned HTTP 200 for home and terminal at desktop and 375px; no overflow or broken HTTP response was reproduced. The terminal showed the honest indexer timeout/unavailable state. No confirmed UI defect was found, no funded write or popup signing was attempted, and no fresh live protocol evidence is claimed.

## Final frontend design audit — 2026-09-10

Phase 1 visual audit is complete in `research/70-final-frontend-design-audit.md`.
The baseline local server/browser run passed Playwright **6/6** and captured
homepage and terminal screenshots at 1280, 768, 390, and 375px. The audit
proposes a restrained off-white/deep-green direction, clearer provenance and
state hierarchy, a non-clipped mobile stage rail, independent terminal column
sizing, and explicit BUY_NO receipt terms. No application, protocol, SDK, unit
test, deployment, or live-evidence files were changed for the baseline audit itself.
The approved finishing pass is implemented in the allowlisted frontend files:

- design.md: off-white/deep-green tokens, semantic state colors, typography, spacing, responsive rules, motion, hierarchy, and BUY_NO receipt terminology.
- app/index.html: quieter CTA competition, explicit Example only ticket labeling, and dated historical proof provenance.
- app/terminal.html: seven-step information hierarchy, independent support and decision stacks, separate network/market states, disconnected wallet grouping, side-explicit UP/YES and DOWN/NO rows, and accessible lifecycle tabs.
- app/style.css: restrained token system, brick DOWN/amber warning/teal telemetry semantics, independent desktop columns, two-by-two mobile stage rail, 44px mobile controls, and a non-clipped lifecycle-tab grid.
- Presentation-only app/app.js: state styling and explicit BUY_NO receipt terms (Quoted NO, Actual NO, and YES-equivalent). No order, policy, SDK, settlement, redemption, or scoring behavior changed in this pass.
- tests/e2e/steady.spec.ts: approved-width overflow/hierarchy checks, tab clipping regression, exact BUY_NO receipt assertions, and honest disconnected wallet terminal-state handling.

Durable review artifacts are test-results/final-home-{1280,768,390,375}.png and test-results/final-terminal-{1280,768,390,375}.png. Screenshot review found zero page-level horizontal overflow at all approved widths and all seven lifecycle filters visible at 390px and 375px. The indexer/CDN path remained intermittent, so screenshots show the honest loading/unavailable state rather than fresh live market proof.

Remaining release blockers are unchanged: real MetaMask/Rabby popup signing is human-unverified, no fresh funded transaction/fill evidence was created, the official SDK discovery gate remains externally blocked/intermittent, and no deployment, commit, push, or npm run validate:write was authorized.


Final verification refresh 2026-09-11: npm test 60/60 PASS; npm run build PASS; node --check app/app.js PASS; git diff --check PASS; Playwright 8/8 PASS. The first combined browser run had one transient minimal-test timeout; the isolated test then passed in 10.6s and the complete rerun passed. Optional screenshot helper timeouts did not fail assertions. Port 5173 was already occupied, so the existing local server was reused. No fresh live protocol evidence was created; real wallet popup signing and stable SDK discovery remain release blockers.

Targeted post-QA fix 2026-09-11: direct Chromium geometry checks at 1280, 768, 390, and 375px found zero page overflow, zero clipped elements, and no page errors for both / and /terminal.html after tightening the narrow terminal header navigation. All eight durable screenshots were then recreated and size-checked; the corrected 375px terminal artifact is test-results/final-terminal-375.png.

Final presentation cleanup 2026-09-11: normalized all frontend letter-spacing to neutral 0 values and synchronized design.md; post-cleanup geometry and interaction probes remained clean, and the final Playwright suite passed 8/8.

## Phase 3 hardening — 2026-09-11 (D1–D9, no deploy / no funded writes)

D1–D7 verified present in the worktree; no `app/app.js` or domain edits needed. One test fix (`tests/unit/lifecycle.test.mjs` `.ts` → shipped JS resolver). Verification: `npm test` 67/67 PASS; `npm run build` PASS; `node --check app/app.js` PASS; `git diff --check` PASS; Playwright 9/11 then 11/11 PASS on rerun (Node 22, server 5173 reused). Fresh `npm run validate`: Gates 1–4 + 6 PASS (20 live / 4 steady-filtered / status 1 / book 3/3 / tick-lot-min 1000 / 2 claimables observed, not redeemed); write gate skipped. Local `dist/` current (runtime-config, 6 steady + config modules, NO-term + PARTIAL FILL, no secrets); prod `https://somnia-snowy.vercel.app` read-only smoke proves stale (`/runtime-config.js` 404, 66,874-byte app.js with `Trade completed`, without current hardening). Verdict: READY WITH EXTERNAL BLOCKER (authorized deploy + human popup UP/DOWN + observed settlement/redemption required). Detail: `research/PHASE-3-HARDENING-REPORT.md`. Historical evidence not re-dated.

## Release checkpoint — 2026-09-11 15:00 UTC (pre-commit)

FRESH EVIDENCE (exact worktree before the release commit): `npm test` 67/67 PASS; `npm run build` PASS (`dist/app.js` 87,183 bytes, `dist/runtime-config.js` 228 bytes, PARTIAL FILL + Quoted NO present, `Trade completed` absent); `node --check app/app.js` PASS; `git diff --check` PASS; Playwright 11/11 PASS (one worker, 60s timeout, Node v22.22.3). Fresh `npm run validate` first run, no retry: Gates 1–4 + 6 PASS — Gate 2 returned 20 live with 0 Steady-filtered BTC/ETH 900/3600 >300s at 14:59 UTC (all windows near expiry; harness: not a failure); Trading market resolved via status search (0x...1a3a5, status 1); book 5/5 (444000/514000); tick/lot/min 1000; Gate 6 saw 2 claimables, NOT redeemed; write gate skipped. No EAI_AGAIN, mock, raw IP, or proxy.

HISTORICAL EVIDENCE (unchanged, not re-dated): earlier live IOC, browser YES/NO, settlement, and redemption hashes stand as recorded above. No fresh transaction is claimed.

## Production deployment — 2026-09-11 ~15:09 UTC

No CLI deployment was run (no Vercel credentials in this environment). Production `https://somnia-snowy.vercel.app` serves the release candidate (Vercel `last-modified 15:09 UTC`, consistent with auto-deploy from the release-commit push): `/` and `/terminal` 200 and byte-identical to the new build, `/runtime-config.js` 200 with chain 50312, `/app.js` 87,183 bytes byte-identical to `dist/app.js` (PARTIAL FILL + Quoted NO present, `Trade completed`/secrets/localhost absent). Read-only Playwright smoke on the live URL: 15/15 PASS with zero console/page errors (live discovery rows, priced UP/YES + DOWN/NO matrix, policy gate, wallet-connect UI, no overflow). No funded write, faucet, redeem, or `validate:write` was performed; the 2 observed claimables remain preserved.
