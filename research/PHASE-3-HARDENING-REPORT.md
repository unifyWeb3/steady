# Phase 3 Hardening Report — Steady

**Date:** 2026-09-11 (Africa/Lagos, session continuation; deadline 19:00 local)
**Scope:** Phase 3 release hardening only (D1–D9). No redesign, no features, no protocol changes, no backend, no deploy, no funded writes, no mock data, no raw-IP endpoint.
**Basis:** Dirty worktree as found (HEAD `dd9ee96`; extensive uncommitted P1 + frontend work preserved, not reverted). Prior records: `AGENTS.md`, `research/FINAL-RELEASE-AUDIT.md`, `research/65-final-release-blockers.md`, `research/68-indexer-incident.md`, `research/69-p1-verification.md`, `research/28-handoff-state.md`.

## Session verdict

**READY WITH EXTERNAL BLOCKER**

Code and local verification for D1–D9 are green and fresh read gates pass, but release still requires (a) an authorized production deployment (prod is provably stale), and (b) a human MetaMask/Rabby popup run for BUY_UP + BUY_DOWN with receipt/fill read-back plus observed settlement/redemption from current evidence. No funded write, popup signing, deployment, commit, or push was performed in this session.

## What this session changed

Only one implementation file was touched, plus records:

- `tests/unit/lifecycle.test.mjs` — fixed a suite-red blocker: the test imported `../../lib/steady/lifecycle.ts`, which fails on the session Node 18 (`ERR_UNKNOWN_FILE_EXTENSION`). Re-pointed to the shipped browser-safe resolver `../../lib/steady/position-state.js` with equivalent fail-closed assertions (`status 99 → UNKNOWN`, `status 1 → LIVE`). The standalone TS helper was source-verified to also return `UNKNOWN` for unmapped statuses and was not modified (outside allowlist).
- `research/PHASE-3-HARDENING-REPORT.md` — this file (create).
- `research/28-handoff-state.md`, `IMPLEMENTATION-STATUS.md`, `research/RESEARCH-LOG.md` — dated appends only (no re-dating of historical hashes).

No edits were made to `app/app.js`, `lib/steady/trade-intent.js`, or `lib/steady/redemption-state.js` in this session: verification below proves D1–D7 code was already present in the dirty worktree. No protected files were touched (`lib/dreamdex/*`, `lib/config/*`, `scripts/validate/*`, `package.json`, `serve.mjs`, `vercel.json`, `design.md`, `app/index.html`, `app/terminal.html`, `app/style.css`).

## D1 — Partial-fill accounting: PASS (verified present, test-proven)

- Root cause (per FINAL-RELEASE-AUDIT D1): old HEAD rendered submitted `qtyRaw` as filled and labelled any positive fill `FILL VERIFIED`.
- Worktree state: `lib/steady/trade-intent.js:281-319` (`summarizeOrderFills`) keeps raw bigint `requestedQuantityRaw` / `filledQuantityRaw` / `remainingQuantityRaw` with states `FULL_FILL` / `PARTIAL_FILL` / `NO_FILL` / `FILL_UNKNOWN`; `321-353` (`classifyPlaceOrderResult`) maps partial to explicit `PARTIAL_FILL`. `app/app.js:1167-1230` renders `Requested / Filled / Remaining / Status: FULL FILL|PARTIAL FILL|NO FILL|FILL UNKNOWN`, uses filled quantity (not requested) for `Actual` price and copy-proof text. `orderType: 2` (IOC) unchanged in `buildIocOrder`.
- Focused test: `tests/unit/trade-intent.test.mjs` “distinguishes full, partial, zero, and unknown fill quantities” (full 1000/1000 → FILLED; 400/1000 → PARTIAL_FILL with remaining 600; zero → NO_FILL; missing fills → FILL_UNKNOWN). Passes in the 67/67 run.
- Remaining risk: partial fills are rare on testnet IOC; no fresh live partial was observed in this session (no funded write). Representation is proven by unit + receipt code path, not by a new live partial.

## D2 — Fresh balance policy proof: PASS (verified present, test-proven)

- Root cause (audit D2): receipt rendered a pre-balance check array containing `BALANCE_UNKNOWN`.
- Worktree state: `app/app.js:950` gates wallet/client/chain; `1073-1080` reads fresh `getErc20Balance` with timeout and fails closed on error; `1082-1091` builds `buildSideIntents({ availableBalanceRaw: _bal, requireBalance: true })`; `1100-1101` builds `policyChecks` from `executableIntent.checks` (the exact fresh intent used for `buildIocOrder`), plus boundary cooldown check. `lib/steady/trade-intent.js:177-194` enforces `BALANCE_UNAVAILABLE` when `requireBalance` and no balance, `INSUFFICIENT_BALANCE` with have/need numbers otherwise.
- Focused test: `trade-intent.test.mjs` “binds executable policy proof to the fresh balance result” (fresh balance → `balance:OK` in proof; missing balance with `requireBalance` → `BALANCE_UNAVAILABLE`). Passes.
- Remaining risk: none in code path; live balance read depends on RPC availability at signing time (fails closed by design).

## D3 — Post-redemption reconciliation: PASS (verified present, test-proven)

- Root cause (audit D4): final post-receipt scan failure became disabled `CONFIRMED`.
- Worktree state: `lib/steady/redemption-state.js:28-34` (`redemptionStateAfterReconcile`: receipt FAILED → FAILED; non-CONFIRMED receipt → UNKNOWN; incomplete scan → UNKNOWN; 0 remaining + complete → REDEEMED; otherwise CONFIRMED). `app/app.js:1533-1569` (`reconcileRedemptionClaims`) retries up to 6 scans; final scan exception → `UNKNOWN` with “Retry verification only” (`1563`); `1371-1393` (`retryRedemptionVerification`) retries receipt + claim scan only, never calls `redeemMany` when `redemptionHash` is known. `1361` keeps the button retryable for `UNKNOWN` with known hash.
- Focused tests: `redemption-state.test.mjs` covers receipt→CONFIRMED vs REDEEMED vs UNKNOWN, timeout-by-hash classification, repeated UNKNOWN retries without new submission, and matching-claim counting. Passes.
- Remaining risk: no redemption was attempted in this session (correct — needs human popup + demo camera). Post-receipt scan still depends on indexer availability; UNKNOWN path is the honest fallback.

## D4 — Non-executable controls: PASS (verified present, browser-proven)

- Worktree state: `app/app.js:484-525` (`updateExecutionControls`) disables both buy buttons with `aria-disabled`, `title="Blocked: <reason>"`, and `dataset.blockReason` when any of: wallet disconnected / unverified chain / no selection / non-1 status / missing/stale book / missing max loss / unacknowledged terms / cooldown / submitting / unresolved prior tx / unavailable balance, plus per-side policy denials (liquidity, depth, spread, balance). Badge and `previewCapped` show `BLOCKED` with the reason; buttons are never enabled merely because cooldown is absent.
- Focused test: `tests/e2e/steady.spec.ts` “buy controls are visibly blocked before executable authorization” (both disabled, title matches `Blocked:`, preview contains `BLOCKED`). Passed in the 11/11 rerun.
- Remaining risk: visual gating is proven; boundary enforcement remains the authority (alerts + early returns + policy denials in `execute()`).

## D5 — Post-switch chain verification: PASS (verified present, browser-proven)

- Root cause (audit D6): chain was trusted after switch/add without re-read.
- Worktree state: `app/app.js:667-679` reads `eth_chainId`, attempts switch then add, then re-reads `eth_chainId` and throws `Wrong chain after wallet switch` unless `50312` before constructing the wallet client; `catch` resets to `Disconnected` with no retained client (`703-712`). `chainChanged`/`accountsChanged` reload the page.
- Focused test: `tests/e2e/steady.spec.ts` “rejects a switch request that reports success but remains on the wrong chain” (sticky `0x1` provider → `Disconnected` + `Connect failed` + buy disabled). Passed in the 11/11 rerun.
- Remaining risk: none in code path; relieves “sign on unverified chain” class entirely.

## D6 — Liquidity and depth: PASS (fail-closed, test-proven)

- Decision documented: verified executable depth below intended quantity fails closed with explicit `DEPTH_INSUFFICIENT`; the ticket/policy/receipt path does **not** silently reduce quantity, claim a full fill, or change IOC semantics. Partial IOC economics are still represented honestly at receipt time via D1 (requested/filled/remaining) if a fill is partial for other reasons.
- Worktree state: `lib/steady/trade-intent.js:16-30` (`executableDepth` aggregates **all** levels with `price <= limitRaw` in raw bigint, rejects negative/malformed levels); `159-174` selects the correct `yesAsks` (BUY_YES) or `noAsks` (BUY_NO) levels, compares aggregate `depthRaw` to intended `quantityRaw`, respects tick/lot/min (`118-156`), and exposes `bookDepthRaw` + depth check (`availableRaw`/`requiredRaw`) in the policy/ticket state.
- Focused tests: `trade-intent.test.mjs` “accounts for aggregate executable depth on both directions” (multi-level sums 51M / 81M), “fails closed with DEPTH_INSUFFICIENT instead of reducing quantity” (both sides), “fails closed when a depth level is malformed” (`DEPTH_UNKNOWN`), plus empty-side `NO_LIQUIDITY`. Passes.
- Remaining risk: NO-side depth assumes SDK `noAsks` are NO-term levels at the NO limit (consistent with the shipped BUY_NO conversion and Gate 4 shape `yesBids/yesAsks/noBids/noAsks`); no silent fallback exists by design.

## D7 — Stale market selection: PASS (verified present, browser-proven)

- Root cause (audit D9): new label could inherit the prior market’s economics on failed reads.
- Worktree state: `app/app.js:430-443` assigns the new market then immediately clears `book`/`bookParams`/`selectionError` and calls `updatePreview()` (ticket shows loading/unavailable); `445-460` fetches book + params at `EXECUTION_BOOK_DEPTH=100`, commits only if the request generation is current, and on failure clears both and sets `Book unavailable…`. Discovery refresh with unverifiable selection also clears (`357-364`, `419-422`).
- Focused test: `tests/e2e/steady.spec.ts` “failed market selection clears the prior economic snapshot” (injected market + aborted RPC → snapshot `{ hasBook: false, hasBookParams: false }`, buy disabled, preview shows loading/unavailable). Passed in the 11/11 rerun (failed transiently in the first run under load; passed on rerun — recorded under browser results).
- Remaining risk: underlying promises are not aborted (generation guards prevent stale DOM writes); score’s per-market reads don’t use the shared timeout helper (pre-existing P2, out of scope).

## D8 — Production artifact drift: VERIFIED (local current, prod stale)

- Local build (`npm run build`, Node 18): PASS. `dist/runtime-config.js` exists (228 bytes, frozen `{ chainId: 50312, indexerUrl, wsRpcUrl, rpcHttpUrl }`, no secrets). Browser-safe modules copied into `dist/lib/steady/` (6 files) + `dist/lib/config/browser.js`. `dist/app.js` (87,183 bytes) contains current hardening + NO-term wording (`PARTIAL FILL` ×2, `Policy at execution`, `Quoted NO`) and zero `Trade completed`. `dist/terminal.html` (18k) references `runtime-config.js`. Secret scan over `dist/`, `app/app.js`, `lib/steady/`: zero hits for `TEST_WALLET_PRIVATE_KEY`.
- Read-only prod smoke 2026-09-11: `/` → 200; `/terminal` → 200 (15,983 bytes); `/terminal.html` → 308 → `/terminal`; `/runtime-config.js` → **404**. Prod `app.js` (66,874 bytes) contains `Trade completed` + `Policy at execution` but **no** `Quoted NO` / `PARTIAL FILL` — provably stale vs local `dist/app.js`. No Vercel config was modified. **Do not treat prod as current until a later authorized deployment + smoke.**

## D9 — Indexer incident: FRESH PASS (no workaround, no mock)

- `npm run validate` (once, as required, plus one confirmatory rerun): **Gates 1–4 + 6 PASS**, write Gate 5 SKIPPED (no funded write, as required).
  - Gate 1: SDK client creation, `binaryModule 0x3ecC69…`.
  - Gate 2: `listLiveBinaryMarkets` 20 markets, steady-filtered 4 (BTC/ETH 900/3600 with headroom).
  - Gate 3: `getMarketOnchain` status 1 Trading on the candidate market.
  - Gate 4a/4b: orderbook 3/3 levels with `yesBids/yesAsks/noBids/noAsks` shape; `tickSize/lotSize/minQuantity = 1000`.
  - Gate 6: `getClaimable` scan found **2 claimables** for `0x0d6FAe…3719` (amounts 3,546,000 and 1,000, Finalized). Deliberately not redeemed in this session.
- No `EAI_AGAIN` in this session’s runs; prior incident classification (`research/68-indexer-incident.md`) stands as history. No raw IP, undocumented endpoint, mock market, DNS pinning, or proxy was used. Gate 2 is reported separately from app correctness; Gates 3–6 are claimed only from this run’s own evidence above.

## Testing (exact results, this session)

- `npm test` (Node 18): **67/67 PASS**, 12 suites, 0 fail. (Prior state 64/65 with `lifecycle.test.mjs` file-level failure; fixed by the import change above.)
- `npm run build`: **PASS** (`build done`, dist refreshed).
- `node --check app/app.js`: **PASS**.
- `git diff --check`: **PASS**.
- Playwright `tests/e2e --reporter=line --workers=1 --timeout=60000` (Node 22.22.3, existing server on 5173 reused): first run **9/11** (transient failures: `minimal` + `failed market selection clears the prior economic snapshot` under load); rerun **11/11 PASS** including D4 blocked-controls, D5 wrong-chain rejection, D7 stale-selection clearing, BUY_NO NO-term receipt rows, and width/overflow checks. Screenshots written to `test-results/`. No real popup signing is claimed (mock wallet throws honestly on `eth_sendTransaction`).
- `npm run validate`: **Gates 1–4 + 6 PASS** (fresh, see D9); write gate skipped. No `validate:write`, no funded transaction.

## Live evidence status

- Fresh (2026-09-11, this session): Gates 1–4 + 6 read evidence above; 2 claimables observed but not redeemed. No new fill, settlement transition, or redemption is claimed.
- Historical (unchanged, not re-dated): `0xed05c…72464c` (private-key IOC + fill), `0x6f6beb…` / `0x882858…` (walletClient BUY_YES/BUY_NO), `0x3aa5ec…77444` (redemption), plus the 2026-09-10 browser-originated `0xf70bc9…978b5` (BUY_YES) / `0xd8000f…0aa14` (BUY_NO) read-only corroboration per FINAL-RELEASE-AUDIT. Real browser-extension popup signing remains human-unverified in this environment.

## Remaining blockers (exact)

1. Authorized production deployment + smoke (prod is stale per D8; do not deploy in this session).
2. Human MetaMask/Rabby popup run from the current build: BUY_UP and BUY_DOWN with receipt/fill read-back (mock wallet cannot substitute).
3. Observed settlement/redemption from current evidence with complete scans and post-receipt proof (2 claimables waiting; save for demo camera).
4. Pre-existing P2s left untouched per scope: score per-market reads lack shared timeout; no receipt persistence across reload; no new video/deck artifact in this session.

## Files changed (this session)

- `tests/unit/lifecycle.test.mjs` (import fix only; intent preserved).
- `research/PHASE-3-HARDENING-REPORT.md` (this file).
- `research/28-handoff-state.md`, `IMPLEMENTATION-STATUS.md`, `research/RESEARCH-LOG.md` (dated appends).
