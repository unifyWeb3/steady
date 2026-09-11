# 67 - P0 Fix Verification

**Date:** 2026-09-09
**Scope:** Verify the five approved P0 fixes against current source, tests, browser behavior, and the current live validation boundary. No feature, redesign, deployment, or new live transaction was added.

## 1. DOWN economics

**FINDING**

BUY_NO must show and submit the NO-side economics, while the SDK order price remains in YES terms.

**ROOT CAUSE**

The previous browser ticket rendered YES economics for both buttons while execution constructed a separate BUY_NO quantity and price.

**FIX**

`app/trade-intent.js:20-159` is the canonical side-aware intent. It reads `noAsks[0]` for BUY_NO, converts the crossed NO price into the YES-limit price, computes side spend, payout, profit, quantity, liquidity, spread, headroom, status, and balance checks, and returns the values used by the ticket. `app/app.js:372-386` uses it for preview; `app/app.js:908-1010` rebuilds the fresh intent and `buildIocOrder()` derives the submitted `side`, `price`, `quantity`, `orderType`, and expiry from that intent.

**TEST**

`tests/unit/trade-intent.test.mjs` covers side-specific asks, DOWN display-to-order equality, both fresh UP/DOWN slots, empty NO liquidity, and the exact order fields. A direct current-state probe produced:

- DOWN YES-limit price `680000`; side price `320000`.
- Quantity `78125000`; pay `25000000`; payout `78125000`; profit `53125000` raw.
- Display: `Pay 25.00 -> 78.13`, profit `53.13`, `78.125` contracts at `0.320`.
- Order: `side=BUY_NO`, `price=680000`, `quantity=78125000`, `orderType=2`.

**LIVE EVIDENCE**

BLOCKED for a fresh run. `npm run validate` created the SDK client (Gate 1) but failed before market discovery at Gate 2 with `getaddrinfo EAI_AGAIN dev.smk.somnia.host`. Historical IOC transactions in the handoff are unchanged and are not new proof of this browser path.

**STATUS**

PASS (source and regression proof); fresh live evidence BLOCKED.

## 2. Fresh-book execution

**FINDING**

The write boundary must not authorize from the selected preview book.

**ROOT CAUSE**

The prior execution path reused the global preview book for policy decisions, so a book change could bypass a current spread check.

**FIX**

`execute()` reads `getMarketOnchain()` at `app/app.js:852-866`, reads `getBinaryOrderBook(currentPool, { depth: 5 })` with a timeout at `:867-875`, rechecks status at `:876-897`, reads fresh book params at `:898-907`, builds the intent from `bookNow` at `:908-915`, rebuilds both fresh side intents after the balance read at `:968-976`, and only then calls `buildIocOrder()` and `trader.placeOrder()` at `:1008-1011`. The global `book` appears in preview/rendering paths only; no write authorization uses it.

**TEST**

The regression `denies on the fresh execution snapshot even when the preview snapshot was wide enough` builds a passing preview intent, a wide-spread fresh intent, and asserts the fresh intent is denied with `SPREAD_TOO_WIDE`; `buildIocOrder()` rejects the denied intent.

**LIVE EVIDENCE**

BLOCKED by the same Gate 2 indexer/DNS failure. The browser suite exercised the timeout/retry shell, not a live signing path.

**STATUS**

PASS (source and regression proof); fresh live evidence BLOCKED.

## 3. Market status fail-closed

**FINDING**

Only verified on-chain status `1` may display a market as executable or authorize a write.

**ROOT CAUSE**

The prior discovery path fell back to indexer-eligible rows when status reads failed.

**FIX**

`loadMarkets()` at `app/app.js:251-292` retains only rows whose `getMarketOnchain()` result has `status === 1`; failed or non-Trading reads are omitted, selection is cleared, and the UI renders a retry/status-unavailable state. `execute()` independently rejects status read failures and every status other than `1` at `:852-866` and `:878-897`. The pure intent also rejects `null`, `undefined`, and non-`1` status. Unknown enriched positions map to `UNKNOWN` in `lib/steady/positionState.ts:15-63` and `lib/steady/lifecycle.ts:6-15`.

**TEST**

The intent suite proves status `1` can produce an executable intent and that unavailable/locked status returns `STATUS_UNAVAILABLE`/`MARKET_NOT_TRADING`. The lifecycle and position-state suites prove unknown status is `UNKNOWN`, not an implied live or settling state. Playwright 6/6 passed the current status-unavailable shell behavior.

**LIVE EVIDENCE**

BLOCKED for new market reads. DNS lookup currently resolves `dev.smk.somnia.host` to `8.233.178.19`, but the SDK request still fails with `EAI_AGAIN`. No unverified market row was treated as live in the browser run.

**STATUS**

PASS (source, unit, and browser error-state proof); fresh live evidence BLOCKED.

## 4. Zero-fill IOC semantics

**FINDING**

A successful transaction with no matched quantity is not a filled trade; a positive matched quantity is separate fill proof.

**ROOT CAUSE**

The previous receipt surface treated transaction success as completion even when the IOC result had no fills.

**FIX**

`classifyPlaceOrderResult()` at `app/trade-intent.js:236-259` separates failed, unknown, confirmed zero-fill, and filled results. `app/app.js:1011-1040` renders `TRANSACTION CONFIRMED · FILL VERIFIED` only for positive `quantityFilled`; a successful empty fill list renders `TRANSACTION CONFIRMED · NO FILL` and says nothing was paid. The timeout recovery path at `:1109-1126` requires a matching positive-quantity `getUserFills()` row for the same market and transaction before it emits `FILL VERIFIED`; otherwise it remains `FILL UNKNOWN`.

**TEST**

The unit suite covers successful transaction plus fill, successful transaction plus empty fills, and late receipt reconciliation with both matching and missing indexed evidence. The direct probe returned `FILLED`, `NO_FILL`, and `FILL_UNKNOWN` as distinct states.

**LIVE EVIDENCE**

BLOCKED for a new browser transaction. Historical mined fill evidence remains historical only.

**STATUS**

PASS (source and regression proof); fresh live evidence BLOCKED.

## 5. Redemption scan completeness

**FINDING**

`Nothing claimable` is valid only after a complete indexer scan. A bounded fallback over known markets cannot prove the wallet is empty.

**ROOT CAUSE**

The previous outage fallback could scan zero known markets and still report an empty claimable wallet.

**FIX**

`scanClaimableOnchain()` at `app/app.js:1207-1230` returns attempted, completed, and failed counts. `classifyClaimScan()` at `app/trade-intent.js:281-295` marks an indexer empty result `COMPLETE_EMPTY`, but a fallback with no complete coverage `INCOMPLETE`; only fallback results with positive claims and every attempted market completed are `PARTIAL_WITH_CLAIMS`. The handler at `app/app.js:1257-1275` renders `Claims unavailable` and stops before redeeming or claiming empty when the scan is incomplete.

**TEST**

The unit suite distinguishes complete empty, incomplete zero-claim, complete fallback-with-claims, and partial fallback cases. The direct probe returned `COMPLETE_EMPTY` for a successful empty indexer scan and `INCOMPLETE` for a failed two-market fallback with no claims. Browser outage handling passed without claiming a complete wallet scan.

**LIVE EVIDENCE**

BLOCKED for a fresh claimable read or redemption transaction because Gate 2 is unavailable. No redemption hash was created or re-dated.

**STATUS**

PASS (source and regression proof); fresh live evidence BLOCKED.

## Diff audit

- Duplicate ticket math: no executable duplicate remains between preview and signing; both use `buildTradeIntent`, and the submitted object comes from `buildIocOrder`. Receipt humanization recomputes a display-only max-loss string and does not authorize or submit a value.
- Duplicate side conversion: executable BUY_NO conversion is centralized in `buildTradeIntent`. The receipt's `1 - averageYes` text is presentation-only and matches the helper's side-price result; consolidating that formatting is P1 cleanup, not an authorization path.
- Stale book policy paths: remaining global `book` reads are preview/policy-indicator rendering. `execute()` policy and order construction use `bookNow` only.
- Fail-open status paths: no discovery or execution fallback authorizes an unknown/non-`1` status; unknown position enrichment remains `UNKNOWN`.
- Receipt-only completion wording: the runtime app contains no `Trade completed` receipt path. The old phrase in `design.md` is a historical design reference, not rendered runtime behavior.
- Redemption fallback: incomplete fallback coverage cannot reach the `Nothing claimable` branch.

## Verification commands

- `npm test`: PASS, 48/48.
- `npm run build`: PASS.
- `node --check app/app.js`: PASS.
- `git diff --check`: PASS.
- `npx playwright test tests/e2e --reporter=line`: PASS, 6/6. The live-indexer timeout/retry state was exercised; no live wallet signature was claimed.
- `npm run validate`: BLOCKED, Gate 1 PASS and Gate 2 FAIL with `EAI_AGAIN dev.smk.somnia.host`.

## Overall status

All five approved P0 fixes are PASS by current source, unit regression, and browser error-state evidence. Fresh protocol evidence is BLOCKED by the current DreamDEX indexer/DNS failure. The safest next action is to rerun `npm run validate` when Gate 2 is reachable before claiming any new live market, fill, settlement, or redemption evidence.
