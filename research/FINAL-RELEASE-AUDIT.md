# Steady Phase 2 Functional Release Audit

**Audit date:** 2026-09-11 (Africa/Lagos)
**Scope:** Evidence and contract audit only. No application, protocol, test, deployment, or configuration files were changed in this audit.
**Audited source:** current worktree on the existing dirty branch, plus the deployed `https://somnia-snowy.vercel.app` alias.

## 1. Executive Verdict

**NOT READY.** The local source has strong P0 behavior and the supplied browser-originated transactions are currently verifiable, but release readiness is contradicted by four concrete blockers:

1. A partially filled IOC is rendered with the submitted quantity rather than the actual filled quantity (`app/app.js:1085-1123`).
2. A successful receipt records `BALANCE_UNKNOWN` in its policy proof even though execution performed and passed a fresh balance check (`app/app.js:958-975`, `1008-1032`, `1123`).
3. Production serves an older artifact without the current runtime configuration and frontend hardening; its homepage still says `Trade completed` and `/runtime-config.js` is 404.
4. A failed post-redemption claim scan is converted to disabled `CONFIRMED`, not `UNKNOWN` or a retryable state (`app/app.js:1395-1426`).

The current browser transaction hashes are valid live evidence, but they do not prove the current source was used, do not prove popup signing in this environment, and do not remove the production artifact or partial-fill blockers.

## 2. Proven Current Browser Evidence

### Local browser shell

- Playwright: **8 passed**, one worker, `tests/e2e`.
- The local browser reached live market rows during the terminal timeout test (`BTC 5m`, bid/ask and spread rendered). The wallet fixture is intentionally a mocked Rabby/MetaMask provider and throws on `eth_sendTransaction`; this proves shell, read, and error behavior only, not a real popup signature.
- Local geometry checks passed at 1280, 768, 390, and 375 pixels with no horizontal overflow.
- The BUY_NO receipt presentation QA passed with `Quoted NO`, `Actual NO`, and `YES-equivalent` rows.

### Supplied current browser-originated transactions

Read-only Shannon RPC and the installed SDK/indexer were queried on 2026-09-11. Both transactions are from the funded wallet `0x0d6faee78dff4380e77d0e412f5cddd942673719`, have successful receipts, and are in the same market and pool.

| Evidence | YES transaction | NO transaction |
|---|---|---|
| Hash | `0xf70bc9d57f0da9aaef3b17e0fb4a69425a57268969bff0f8ffe632d8b9a978b5` | `0xd8000f2988b645c2fae1dbf3d4beb066d19992f69abcb290ffda0318b5c0aa14` |
| Mined block/time | `484287760`, 2026-09-10 01:00:01 UTC | `484287996`, 2026-09-10 01:00:25 UTC |
| Receipt | `success`, gas `828682`, 8 logs | `success`, gas `626781`, 8 logs |
| Pool (`to`) | `0xdc34cec6e50f056f4b0491a32128cd86a7b686b7` | same |
| Market | `0x00000000000000000000000000000000000000000000000000000000000188ec` | same |
| Calldata order | kind `0` (`BUY_YES`), YES price `515000`, quantity `3883000`, type `2` IOC | kind `2` (`BUY_NO`), YES price `436000`, quantity `3546000`, type `2` IOC |
| Indexed fill | YES fill price `490000`, quantity `3883000`, quote quantity `1902670` | YES-term fill price `455000`, quantity `3546000`, quote quantity `1613430` |
| User-facing price | UP/YES quote `0.515` -> actual `0.490` | NO quote `0.564` -> actual NO `0.545`; YES-equivalent `0.436` -> `0.455` |

The indexed `quoteQuantity` is defined by the SDK as `quantity * fillPrice` in YES terms. It must not be presented as the user-facing NO spend without conversion. The current market read is status `4` (resolved), `winningOutcome: 1` (NO), not a current Trading window; its orderbook is now empty. No redemption was attempted in this audit.

## 3. Historical Live Evidence

These remain historical and are not re-dated by this audit:

- `0xed05c...72464c`: private-key IOC, successful receipt and indexed fill, block `477265538`.
- `0x6f6beb80...`: wallet-client BUY_YES proof, quoted `0.742`, fill `0.722`.
- `0x88285864...`: wallet-client BUY_NO proof, quoted YES `0.258` / NO `0.742`, fill YES `0.701` / NO `0.299`.
- `0x3aa5ec79...77444`: historical redemption proof, successful receipt and balance delta.

The wallet-client calls use the same SDK `createTrader({ walletClient })` path as the browser, but they were Node HTTP-wallet tests, not a real browser extension popup.

## 4. Local Test-Proven Behavior

The mandated local checks completed as follows:

| Check | Result |
|---|---|
| `npm test` | **PASS, 60/60** |
| `npm run build` | **PASS** |
| `node --check app/app.js` | **PASS** |
| `git diff --check` | **PASS** |
| `npx playwright test tests/e2e --reporter=line --workers=1 --timeout=60000` | **PASS, 8/8** |

The tests prove canonical side-aware intent construction, fresh-book denial, status fail-closed behavior, zero-fill classification, late-fill unknown classification, incomplete claim scans, state reducers, browser configuration validation, and responsive shell behavior.

Evidence limits:

- `tests/unit/discipline.test.mjs:3-10`, `tests/unit/ticket.test.mjs:4-25`, `tests/unit/pricing.test.mjs:6-9`, and `tests/unit/redemption.test.mjs:6-15` define local copies of production logic rather than importing the shipped implementation. Their green results are not full parity evidence.
- No unit or browser test asserts the actual quantity shown for a partial IOC receipt.
- No test asserts that a successful receipt's policy proof contains the fresh balance pass.
- No test covers a post-receipt claim scan timing out after the final retry.
- No test covers a wrong-chain provider that reports success for a switch request without actually changing chain.

## 5. Current Reproducibility Status

- `npm run validate` was run once as required. Gate 1 passed (SDK client creation and SDK addresses). Gate 2 failed before market data with SDK `fetch failed`, caused by `getaddrinfo EAI_AGAIN dev.smk.somnia.host`.
- This classifies as an **external DNS/indexer transport incident**. It is not an application semantic failure or an SDK construction failure. No raw IP, undocumented endpoint, mock data, or funded write was used.
- The local browser read path succeeded transiently during Playwright, so live discovery is intermittently reachable, but the official validator is not currently reproducibly green.
- The supplied current hashes are reproducible by read-only RPC and, in this run, indexed fill reads. No fresh browser popup signature, settlement transition, or redemption was attempted.
- Production currently returns live rows in the older deployed application, but that is not proof of the current worktree or current hardening.

Evidence classes are intentionally separate: current read-only browser/chain evidence, historical live evidence, local test-proven behavior, intermittently reproducible reads, and externally blocked validation.

## 6. UI-to-Protocol Contract Findings

| Visible action/state | Handler and owner | Inputs and output/state | Error/timeout behavior | Divergence risk |
|---|---|---|---|---|
| Connect wallet (`#connectBtn`, `terminal.html:25-29`) | `connect()` (`app/app.js:582-635`), viem custom wallet client, SDK config | Injected accounts and chain -> committed `walletClient`, address, balance, fills | Missing provider, wallet error, SDK error reset to `Disconnected`; balance failure remains unknown | Chain is not re-read after switch/add; see D6 |
| SDK load and retry | `loadSdk()` and `loadMarkets()` (`app/app.js:41-58`, `247-416`) | esm.sh imports and indexer read -> SDK, rows, explicit unavailable state | Import/read timeout, retry button, scheduled retry; stale selection is cleared on failed refresh | Underlying promises are not aborted; generation guards protect DOM writes |
| Market discovery | `loadMarkets()` -> SDK `listLiveBinaryMarkets`, then `getMarketOnchain` | Asset/window/headroom/pool fields -> only status-1 rows | Empty, status unavailable, indexer timeout are explicit and non-authorizing | Current source is fail-closed; deployed alias is stale |
| Market selection | `selectMarket()` (`app/app.js:419-444`) -> SDK orderbook and params | Selected row -> ticket identity and book snapshot | Book error writes an error string but does not clear the prior book | A failed selection can leave old economics under a new market label; see D9 |
| Max-loss ticket | `updatePreview()` and `buildSideIntents()` (`app/app.js:446-525`, `lib/steady/trade-intent.js:162-200`) | User max loss plus selected snapshot -> side-specific pay, payout, profit, quantity, probability | Invalid/empty side/status/spread/params are denied or shown unavailable | Depth is recorded but not enforced/displayed; see D7 |
| BUY UP / BUY YES | `execute("BUY_YES")` (`app/app.js:871-1203`) -> `buildTradeIntent`, `buildIocOrder`, SDK `trader.placeOrder` | Fresh status, book, params, balance, max loss -> YES-term IOC | Status/book/params/balance/policy failures return explicit denial; receipt is classified | Partial fill quantity is rendered incorrectly; see D1 |
| BUY DOWN / BUY NO | `execute("BUY_NO")` plus same canonical module | Fresh NO ask -> YES-limit price and NO economics -> `placeOrder` | Same fail-closed policy path | Current source is side-correct; stale production artifact lacks the current NO proof treatment |
| Policy gate | `renderPolicyGate()` and boundary checks (`app/app.js:527-568`, `973-1032`) | Status, headroom, liquidity, spread, discipline, balance | Unknown checks remain circles; failed checks block at execution | Visual badge can say Authorized while selection/wallet/acknowledgement is still missing; see D5 |
| Balance and liquidity | `buildTradeIntent`, fresh `getErc20Balance`, orderbook reads | Raw balance and side asks -> pass/deny and order terms | Read failure blocks signing | Only non-empty top ask is required; desired quantity can exceed available depth |
| Cooldown | `renderDiscipline()` and inline boundary streak check (`app/app.js:816-865`, `976-988`) | Settled calls and local cooldown timestamp -> disabled buttons or exact denial | Local storage restores future cooldown; boundary blocks again | Browser does not import `lib/steady/discipline.ts`; tests use a local copy |
| Duplicate trade click | `window.__submitting` and disabled buttons (`app/app.js:871-889`) | One attempt id -> one in-flight call | Duplicate click renders a wait message | Buttons are enabled before a valid executable intent exists |
| Transaction/order/fill proof | `classifyPlaceOrderResult`, `summarizeOrderFills`, receipt renderer (`app/app.js:1062-1127`) | Receipt status, order id/events, in-transaction fill legs | `NO FILL`, `FILL VERIFIED`, `UNKNOWN`, revert are distinct | Partial fills have no explicit state/actual quantity display; policy proof is stale |
| Positions | `refreshFills()`, `resolveFillStates()`, `renderPositions()` (`app/app.js:638-767`) | Indexed fills plus on-chain status/balances -> lifecycle rows | Indexer error can use cached fills; unresolved enrichment remains `UNKNOWN` | Position rows are honest after enrichment; no literal `LOCKED` or `FINALIZED` tab state |
| Settlement/claim scan | `redeemAll` plus `scanClaimableOnchain()` (`app/app.js:1242-1352`) | Complete SDK claim scan or bounded known-market fallback | Incomplete fallback explicitly says `Claims unavailable` | Initial empty view is not a scan result; correct, but internal state maps unavailable to FAILED |
| Redemption | `beginRedemption`, `redeemMany`, receipt polling, `reconcileRedemptionClaims()` (`app/app.js:1297-1431`) | Positive claim entries -> one SDK redemption tx and post-receipt scan | Duplicate guard, reverted/unknown states, post-receipt retries | Final post-scan failure becomes disabled `CONFIRMED`; see D4 |

The browser path calls the SDK directly from `app/app.js`; `lib/dreamdex/*` is the parallel typed integration/harness surface, not the runtime owner of these browser DOM actions. The pure browser-safe `lib/steady/*` modules own the canonical calculations and reducers used by the current source.

## 7. BUY_UP Economic Audit

The current source path is coherent for a fully filled order:

1. `buildTradeIntent("BUY_YES")` reads `yesAsks[0]`, crosses by `0.02`, tick-snaps, computes quantity from max loss, and computes pay/payout/profit.
2. `updatePreview()` renders `intentDisplay()` for the UP slot.
3. `execute()` re-reads status, fresh book, status, params, and balance, rebuilds the intent, and passes `buildIocOrder()` fields directly to `trader.placeOrder`.
4. The receipt quotes the exact YES order price and computes actual YES price from the returned fill legs.

The supplied YES transaction corroborates the protocol terms: calldata quoted YES `0.515`, indexed fill YES `0.490`, quantity `3.883` contracts, successful type-2 IOC. The economic quote/fill relationship is proven. The receipt quantity defect still means a partial fill would not be represented honestly.

## 8. BUY_DOWN Economic Audit

The current source is side-aware:

1. `buildTradeIntent("BUY_NO")` reads `noAsks[0]`, crosses the NO ask by `0.02`, converts to a YES-term limit for the SDK, then computes side price as `1 - yesPrice`.
2. The DOWN preview uses the NO-side pay, payout, profit, quantity, and probability.
3. `buildIocOrder()` submits the same intent's YES-term `price`, quantity, side `BUY_NO`, type `2`, and expiry.
4. `receiptPricePresentation("BUY_NO", ...)` presents `Quoted NO`, `Actual NO`, and YES-equivalent evidence.

The supplied NO transaction corroborates this: calldata YES-equivalent quote `0.436` (user-facing NO quote `0.564`), indexed YES-term fill `0.455` (user-facing NO fill `0.545`), quantity `3.546` contracts, successful type-2 IOC. This is current read-only evidence of the side conversion, not a new write.

The production alias does not contain the current `Quoted NO`/`Actual NO` implementation and therefore cannot be accepted as the current BUY_DOWN proof surface.

## 9. Receipt and NO-Term Audit

Current source behavior:

- Successful receipt with positive fill: `TRANSACTION CONFIRMED · FILL VERIFIED`.
- Successful IOC with no positive fill: `TRANSACTION CONFIRMED · NO FILL` and `nothing paid`.
- Reverted receipt: explicit failure.
- Unknown receipt status: `UNKNOWN`.
- Timeout with a recovered hash: receipt polling separates transaction confirmation from indexed fill proof and retains `FILL UNKNOWN` without matching evidence.
- BUY_NO receipt rows put NO terms first and preserve YES-term SDK evidence underneath.

Defects:

- The receipt uses `qtyRaw`, the submitted quantity, in `app/app.js:1116` and `1119`. `summarizeOrderFills()` has the actual `quantityRaw` at `lib/steady/trade-intent.js:221-234`, but the value is not rendered. A partial IOC is therefore labelled `FILL VERIFIED` while displaying the full requested quantity. This violates the required partial-state and actual-fill proof contract.
- `Fill evidence` at `app/app.js:1121` reports only the number of fill legs, not actual filled quantity.
- `policyChecks` rendered at `app/app.js:1123` was created before the fresh balance read and contains `BALANCE_UNKNOWN`, even when the trade passed the later balance gate.

## 10. Redemption Audit

The intended path is present:

1. `getClaimable()` is attempted with a timeout.
2. Indexer failure invokes a bounded scan over known fill markets using on-chain status and ERC-6909 balances.
3. `classifyClaimScan()` distinguishes complete-empty from incomplete and partial fallback coverage.
4. Incomplete scans render `Claims unavailable` and do not assert an empty wallet.
5. `beginRedemption()` and `redemptionButtonDisabled()` prevent duplicate in-flight actions.
6. A successful receipt is initially `CONFIRMED`; `REDEEMED` is emitted only after a complete post-receipt claim scan finds no submitted claims remaining.

The failure path is incomplete. In `reconcileRedemptionClaims()` (`app/app.js:1395-1426`), after the sixth post-receipt scan failure the code sets `CONFIRMED` with `post-receipt claim scan unavailable`. `CONFIRMED` disables the button, so the user receives neither `UNKNOWN` nor a retryable action. A confirmed transaction is not falsely called redeemed, but the recovery contract is not satisfied. No current redemption was attempted in this audit.

## 11. State-Machine Audit

| State | Current implementation | Audit classification |
|---|---|---|
| `IDLE` | Initial DOM before selection | Implicit only; no central state |
| `LOADING` | Discovery table/status and SDK import | Explicit and honest |
| `READY` | Policy badge and enabled action controls | Ambiguous: controls can look ready without wallet, selection, max loss, or fresh book (D5) |
| `SUBMITTING` | `window.__submitting`, attempt id, disabled buy buttons | Explicit and duplicate-protected |
| `TRANSACTION CONFIRMED` | Receipt status branch | Explicit |
| `ORDER ACCEPTED` | Order id/event evidence appended to status | Explicit when evidence exists |
| `FILL VERIFIED` | Positive in-transaction fill quantity | Explicit, but partial quantity is misrepresented (D1) |
| `NO FILL` | Confirmed success with zero fill legs | Explicit and non-optimistic |
| `FILL UNKNOWN` | Late receipt without matching indexed fill | Explicit in timeout reconciliation |
| `FAILED` | Revert, policy, SDK, scan errors | Explicit, but used for claims-unavailable internal state |
| `UNKNOWN` | Unknown receipt, unresolved position, late fill | Explicit |
| `LOCKED` | No literal position state; protocol status 2/3 maps to `SETTLING` | Documented state is not emitted |
| `FINALIZED` | No literal position tab; status 4 feeds resolved/claimable/lost states | Documented state is represented indirectly |
| `CLAIMABLE` | Positive winner/void ERC-6909 balance | Explicit |
| `REDEEMED` | Complete post-receipt scan proves no matching claims remain | Explicit when scan succeeds |
| `CLAIMS UNAVAILABLE` | Visible message, internal `redemptionState = FAILED` | Visible wording exists, but internal state is conflated and not retryable after final post-scan failure (D4) |

## 12. Security and Stale-State Findings

- External market, pool, hash, and status values are generally escaped or validated before current-source markup (`lib/steady/dom.js`, `app/app.js:174-180`, `377-383`, `747-763`, `1118-1127`).
- Browser configuration is centralized and chain-limited in the current source (`lib/config/browser.js:19-27`), but the deployed alias does not ship `runtime-config.js` (D3).
- `connect()` checks the provider chain before attempting a switch/add, but does not call `eth_chainId` again before constructing the wallet client (`app/app.js:595-604`). A provider that returns success without changing chain is not rejected before signing (D6).
- Buy buttons are present and enabled in the HTML (`app/terminal.html:217-220`) and are only boundary-blocked by alerts/early returns until a valid intent exists (`app/app.js:871-878`). Unknown/unavailable/unselected states should be visibly non-executable (D5).
- `selectMarket()` assigns the new market before its book read and leaves the previous `book`/`bookParams` in memory if the read fails (`app/app.js:419-440`). The execution boundary re-reads safely, but the interim ticket can show old economics under a new market label (D9).
- Discovery, selection, fills, score, and redemption have generation guards. The score's individual market reads do not use the shared timeout helper (`app/app.js:783-813`), leaving a possible long-running calibration read during RPC trouble (P2).

## 13. Indexer Incident Classification

The single mandated validator run reached Gate 1 and failed at Gate 2:

```
@somnia-chain/markets-sdk: indexer LiveBinaryMarkets failed: fetch failed
cause: getaddrinfo EAI_AGAIN dev.smk.somnia.host
```

The configured read path is SDK 0.29.0 -> `https://dev.smk.somnia.host/v1/graphql`; Shannon RPC is a separate on-chain path and returned the correct chain in earlier read-only checks. This is an external DNS/indexer transport issue. The safe behavior is the current source's retry/status-unavailable shell with no executable stale market. Gates 3-6 are not claimed from this run.

## 14. Exact Defects and Release Blockers

### D1 - P0: Partial IOC quantity is not proven in the receipt

`app/app.js:1085-1089` classifies any positive fill as `FILL VERIFIED`; `app/app.js:1116` and `1119` display `qtyRaw` (submitted quantity), while `lib/steady/trade-intent.js:221-234` computes but does not render actual filled quantity. This can claim the requested quantity after a partial fill.

### D2 - P1: Receipt policy proof contains stale balance status

`app/app.js:958-975` creates `policyChecks` without `availableBalanceRaw`, so balance is `BALANCE_UNKNOWN`. The actual balance read and fresh intent occur at `1008-1032`, but the receipt still renders the earlier array at `1123`. A successful receipt therefore contradicts the execution checks.

### D3 - P0: Production alias is stale and missing browser-safe runtime configuration

Read-only production checks on 2026-09-11:

- `/` and `/terminal` returned HTTP 200 with no browser request failures or console errors.
- `/runtime-config.js` returned 404.
- Deployed homepage contains `Default: “Trade completed.”` and `Live logic`, not the current `Example only` / `Historical live proof` terminology.
- Deployed `app.js` is 66,874 bytes and contains the old `Trade completed` receipt; current built `dist/app.js` is 78,475 bytes and contains `Quoted NO` and `Policy at execution`.
- Deployed `terminal.html` is 15,983 bytes and lacks `runtime-config.js`; current built `dist/terminal.html` is 17,913 bytes and includes it.

The deployed route can be transport-healthy while still serving the wrong implementation. Production must be rebuilt and re-smoked from the current source before release.

### D4 - P1: Final post-redemption scan failure is not retryable/unknown

`app/app.js:1423-1426` maps the final scan exception to `CONFIRMED`, and `redemptionButtonDisabled("CONFIRMED")` disables the action. The user cannot retry the missing proof and the state is not `UNKNOWN`.

### D5 - P1: Non-executable states still expose enabled buy controls

`app/terminal.html:217-220` renders both buttons enabled. `app/app.js:463-486` does not disable them when no verified selection/book/max loss exists, and `853-860` re-enables them whenever cooldown is absent. The boundary is safe, but the visible state violates the requirement that unknown/unavailable/locked states remain visibly non-executable.

### D6 - P1: Chain switch is not verified again before wallet construction/signing

`app/app.js:595-604` attempts `wallet_switchEthereumChain`/`wallet_addEthereumChain` but trusts the result without a second `eth_chainId` read. The security contract requires rejecting an unexpected chain before signing.

### D7 - P1: Canonical liquidity depth is not enforced or shown as depth

`lib/steady/trade-intent.js:61-73` requires a non-empty side ask and `141-153` records only one level's `bookDepthRaw`; it never compares desired quantity to available depth. `app/app.js:511` labels bid/ask, tick, and lot as `Book depth`. The passing depth cap at `tests/unit/ticket.test.mjs:47-50` exercises a separate local helper, not the shipped intent.

### D8 - P1 test-contract gap: key tests mirror production logic

The local discipline, ticket, pricing, and redemption-shaper tests use copied functions (`tests/unit/discipline.test.mjs:3-10`, `ticket.test.mjs:4-25`, `pricing.test.mjs:6-9`, `redemption.test.mjs:6-15`). This weakens the evidence required for cooldown, depth, pricing, and redemption correctness and leaves D1/D2/D4 untested.

### D9 - P2: Failed selection read can show stale economics

`app/app.js:419-440` changes `selected` before fetching the new book and does not clear the old book/params on failure. The boundary later re-reads safely, but the visible ticket can temporarily diverge from the selected market.

### D10 - P2: Init-failure boot guard checks stale copy

Current `app/terminal.html:42` starts with `Initializing Shannon read path`, while the non-module boot guard at `285-297` only replaces the status when it contains `Connecting to indexer`. A synchronous module/config failure can update the table but leave the network status line misleadingly unchanged.

## 15. Exact Release Blockers

Release remains blocked until all of the following are true:

- D1 partial-fill receipt quantity/state is corrected and covered by regression tests.
- D2 receipt policy proof is rebuilt from the exact fresh intent/check array used for signing.
- D3 current source is deployed, `/runtime-config.js` is present, and production smoke confirms current receipt, NO-term, unavailable, and retry behavior.
- D4 post-redemption scan failure is explicitly `UNKNOWN` or retryable, with proof preserved.
- D5 and D6 are resolved or explicitly accepted by the release owner under the security/UX contract.
- D7 liquidity semantics are made explicit: either cap/deny against the executable depth or label partial IOC economics and actual fill quantity without implying a full fill.
- A healthy indexer run independently passes Gate 2 and then Gates 3-6; no claim is made from the failed run above.
- A human MetaMask popup run proves browser wallet signing for BUY_UP and BUY_DOWN, followed by receipt/fill verification. No automated mock can substitute for this.
- Settlement and redemption are observed from current evidence, with complete scans and post-receipt proof.

## 16. Safest Next Action

Keep this audit as the release record. In a separately authorized implementation session, address D1-D7 with focused tests, rebuild and deploy the current artifact, rerun the local matrix, rerun `npm run validate` when the indexer is reachable, then perform the manual MetaMask and settlement/redemption evidence run. Do not use `validate:write`, a raw indexer IP, mock market data, or optimistic production copy to close these blockers.

