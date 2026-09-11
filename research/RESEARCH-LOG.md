# Research Log

## 2026-09-01 — Stage 1: Rule Lock
- Q: What are official hackathon dates/prize/rules?
- Source: SRC-001, SRC-020, SRC-010
- Finding: Registrations Aug 18, submissions Aug 25–Sep 8 18:00 UTC, $5,000 USDso, 291–292 hackers, BUIDL count inconsistent (0 vs 9–13 due to DoraHacks caching/filtering). Requirements: testnet prototype + GitHub + 2–3 min video, optional deck + SDK feedback.
- Confidence: VERIFIED (SRC-001 primary)
- Implication: Deadline in 7 days, must freeze MVP by Sep 5 to allow video + submission hardening.

## 2026-09-01 — Stage 2: Protocol Deep Dive
- Q: What do Event Contracts represent today?
- Source: SRC-002, SRC-003, SRC-004, SRC-005, SRC-006
- Finding: Binary Up/Down on BTC and ETH only, 15m/1h windows (docs: "15m/1h · more soon"), fixed payout, zero fees, on-chain CLOB shared with spot. Lifecycle via BinaryMarketsModule, pool recycling, ERC6909 singleton, oracle Hub with reactivity. Must gate on-chain status 1=Trading, use SDK >=0.28.0, IOC for taker, redemption via listBinaryMarkets status Finalized.
- Confidence: VERIFIED
- Implication: No arbitrary market creation; product must consume existing BTC/ETH windows. Settlement/reactivity is load-bearing.

## 2026-09-01 — SDK Investigation
- Q: What does markets-sdk 0.29.0 support?
- Source: SRC-007, SRC-021, local node_modules inspection
- Finding: 0.29.0 latest, browser+node, no HTTP for EC, exports SomniaMarkets, createClient, hooks, realtime via realtime_sendRawTransaction. Below 0.23 fails to read (longOpenInterest), below 0.28 price off tick grid (0.05 -> 0.050000... reverts). Addresses identical testnet/mainnet.
- Confidence: VERIFIED (local package.json + config.js)
- Implication: Pin to >=0.28.1, handle price quantize via SDK, handle worker expiry nanoseconds, lot grid.

## 2026-09-01 — Bot Kit
- Q: What's commoditized vs differentiated?
- Source: SRC-008
- Finding: 5 spot strategies (starter/maker/grid/momentum/mean-reversion/twap/ensemble) + 6 ec-* (ec-starter/maker/passive/laddering/oracle-follow/settlement). Shared core handles auth, WS, order lifecycle, nonce. Edge analytics, Railway deploy, session keys.
- Confidence: STRONGLY SUPPORTED
- Implication: Generic bots (grid/momentum) are commodity (A). Custom policy + settlement + session keys = moderately differentiated (B).

## 2026-09-01 — Somnia Ecosystem
- Q: How does Somnia position reactivity?
- Source: SRC-009
- Finding: Shannon testnet 50312, mainnet 5031, RPC dream-rpc.somnia.network, explorer shannon-explorer, sub-second finality, "Agentic Chain". DreamDEX is zero-fee CLOB liquidity layer, not consumer app — wants to be infra for third-party apps + agent venue.
- Confidence: VERIFIED
- Implication: DreamDEX not solving consumer UX, discovery, risk — that's the wedge.

## 2026-09-01 — Hackathon Competition Scan
- Q: What are active teams building?
- Source: SRC-011 through SRC-017, websearch github
- Finding: 7 public projects found outside DoraHacks BUIDL list: Telegram bot (Groq AI), PredictArena (social league Brier), Sluice (downside-capped sizing), Branch (conditional paths), Keel (redeem+roll), Vault (ERC4626), Template (starter). DoraHacks BUIDL page shows 0 due to filter bug — treated as moving target.
- Confidence: STRONGLY SUPPORTED (all repos cloned/inspected)
- Implication: AI trading + copy + analytics + gamified are saturating. Underexplored = discipline/risk, onboarding, settlement trust.

## 2026-09-01 — Market Landscape
- Q: What do Kalshi/Polymarket users complain about?
- Source: websearch alphascope, milehigh
- Finding: Praise regulation/fast withdraw/clean UX, complaints low liquidity on niche markets, fee opacity, no live chat, thin order books. Prediction market exploit risk if low liquidity.
- Confidence: STRONGLY SUPPORTED (multiple review aggregations)
- Implication: Liquidity depth, execution quality, and transparent fees are real pains.

## 2026-09-01 — User Problems
- Q: What sucks for short-window binary?
- Finding: (see 11-user-problems.md) Top pains: chasing losses/tilt, odds misinterpretation, dying window expiry, sizing, redemption forgetting, trust in settlement.
- Confidence: INFERENCE from protocol gotchas + competitor gaps + review data
- Next: Map opportunities, score, adversarial.

## 2026-09-01 20:16 — Integration foundation handoff prep
- Q: Does live testnet match docs (15m/1h only)?
- Source: `npm run validate` live (14 markets, gates 1-4 PASS)
- Finding: Live returns 60s, 300s, 900s (1m/5m/15m). Candidate BTC 900s 14m headroom, Trading status 1, book 0.623/0.652 tick 1000. No 1h (3600) in this snapshot — may roll. SDK entry is `new SomniaMarkets` not `createClient` (not exported).
- Confidence: VERIFIED (live chain/indexer)
- Implication: Update research/04 to include 1m/5m, avoid hardcoding 900/3600 only. Harness corrected, 4 gates pass. Write gate remains BLOCKED (no funded key) — correct, not mocked.
- Q: GenLayer contamination?
- Source: `grep -R genlayer|bradbury|rpc-bradbury /home/unify/somnia` → 0 project matches (only 4221 in deps trusted-setups hex blobs, not GenLayer)
- Finding: No contamination inside somnia workspace. /tmp ignored per instruction.
- Confidence: VERIFIED

## 2026-09-01 20:51 — Gate 5 first attempt FAIL
- Q: Real IOC on live market 0x...1074a / 0x3bf5a438... with tUSDC 0→10k via faucet
- Source: `npm run validate:write` live Shannon, STT 50, tUSDC 0 then 10k after faucet 0xb0bd7bb1...908e46
- Finding: placeOrder threw ContractRevertError FillOrKillNotFillable() with data 0xc04ad919, address 0x3bf5a438..., function placeBinaryOrder. Used orderType 1 (FILL_OR_KILL) + price 550000 (0.55) vs ask 819000 (0.819) — non-crossing FOK cannot fill. Not a protocol or liquidity failure.
- Confidence: VERIFIED (receipt + decoded errorName)
- Classification: IOC liquidity / order construction (harness bug)
- Implication: Fix to ORDER_TYPE.MARKET=2 (IOC) + price = bestAsk+20000 tick-snapped, retry.

## 2026-09-01 21:29 — Indexer intermittency
- Q: Is dev.smk.somnia.host stable?
- Source: `npm run validate` retries, curl POST __typename
- Finding: ConnectTimeoutError / UND_ERR_SOCKET at 21:29 (timeout 10s, socket closed) on dev.smk.somnia.host:443, but curl after 15s returned {"data":{"__typename":"query_root"}}. Transient, not persistent.
- Confidence: VERIFIED
- Implication: Harness must retry, not fail fast. Not a blocker for Gate 5 (retry passed at 21:54).

## 2026-09-01 21:54 — Gate 5 PASS with real mined IOC
- Q: Real IOC after faucet + correct crossing?
- Source: `npm run validate:write` live, wallet 0x0d6FAe...3719, STT 49.991, tUSDC 9999.999078, market 0x...107fc BTC 3600s pool 0x246a..., book yesAsk 29000 (0.029), price 49000 (0.049, +0.02), qty 1000, orderType 2 MARKET/IOC, expiry nanos 1788299726000000000
- Finding: tx 0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c status success block 477265538 gas 828682 logs 8. Post-verify: receipt success, getUserFills count 2 latest fillPrice 21000 (0.021) qty 1000 Direct_YES taker BUY_YES vs maker SELL_YES 0x8a5093c7..., book after shows asks 20000/28000/35000. Taker paid fill not quoted (gotcha #7). Faucet + STT sufficient.
- Confidence: VERIFIED (explorer + receipt + fills)
- Implication: Integration foundation PASSED. All 5 gates live-proved. No mocks. Update IMPLEMENTATION-STATUS.md + 27 + 28, stop before frontend per task.

## 2026-09-04 — Frontend reliability + browser QA pass
- Root causes found: (1) duplicate `connect()` shadowed Rabby provider handling (provider var undefined in dead branch) — fixed to single Rabby-compatible version; (2) static top-level esm.sh imports (~10s each) blocked module execution → domcontentloaded timeout on terminal.html — fixed via lazy dynamic SDK import with 30s timeout, shell boots instantly; (3) `onclick="loadMarkets()"` unreachable from module scope — fixed via window.loadMarkets; (4) execute() logged maxLoss before defined + left __submitting stuck on early returns — fixed with _resetSubmit on all paths.
- Browser evidence (Playwright chromium 1234, real render): homepage PASS (bg 252,250,247, no purple); terminal shell PASS ("Loading live markets…" → 13s "Market data unavailable / Indexer timed out / Retry", no pageerror); mock-Rabby connect PASS (addr shown, Connected status, 26s due to esm.sh). Indexer timing out from this env (curl 15s + browser 12s) — graceful path exercised honestly; node harness passed same day when reachable.
- Status: walletClient popup signing remains CODE-EXISTS-BUT-UNVERIFIED (mock throws honestly on eth_sendTransaction). No mocks presented as real.

## 2026-09-04 — Frontend hardening merge (two sessions reconciled)
- Reliability session: fixed duplicate connect() shadowing Rabby handling, lazy SDK import (shell boots instantly), window.loadMarkets for Retry, _resetSubmit on all early returns, tradeAttemptId + SUBMITTING guard, UNKNOWN reconciliation, receipt quoted-vs-actual.
- Reconstruction session (merged): design.md authoritative system, research/38 frontend research (Vigil/Cairn/SWORN distilled, Direction C Ledger Instrument selected), terminal nav tabs, dark ink rail, receipt-head with Mined badge, homepage narrative.
- Ticket correctness: preview now uses live bestAsk+0.02 (same as execution), side-aware qty/pay, UP=YES/DOWN=NO labels, lot caption 1000 raw = 0.001 contracts.
- Policy consistency: preview shows DENIED during cooldown; receipt labeled policy-at-execution; cooldown enforced at boundary.
- Browser (chromium 1234): 5/5 Playwright PASS on merged tree; mobile 375px 0 overflow + screenshot; indexer timeout path exercised honestly (transient from this env, node harness passes when reachable).
- Real-popup signing still CODE-EXISTS-BUT-UNVERIFIED (mock throws honestly on eth_sendTransaction). No mocks as real. dist/ rebuilt 84K.

## 2026-09-05 — Penultimate audit (3 days to deadline)
- Rules re-verified live (DoraHacks): Sep 8 18:00, $5k USDso, testnet+GitHub+video, no tracks, 16 BUIDLs/314 hackers. Gaps found: NO README, NO LICENSE → both written from verified evidence only.
- Forensics re-PASS: all 4 headline txs success on-chain just now (0xed05c b477265538, 0x3aa5ec b478925556, 0x6f6beb b478978327, 0x882858 b478978375).
- Secrets scan PASS: no 64-hex keys in source/dist/history; .env never committed.
- Competitors: Tock (arcade+streaks), volatility Agent (custom router — weaker DreamDEX-dependence), Pryzm swarm, sigma odds layer. Rivo unverified rumor. No one in discipline wedge. Adopted one idea: shareable receipt card (text+link, no gamification).
- Honest score: 73/100 (80 with video + manual E2E). Research/43-50 written.
- Hygiene: debug logs gated behind localStorage steady:debug; homepage preview relabeled illustrative.

## 2026-09-05 — Release-candidate audit (51-60)
- Rules re-locked live: Sep 8 18:00, $5k, testnet+GitHub+video, no tracks, 27 BUIDLs/345 hackers. SDK still 0.29.0, no drift.
- Forensics re-PASS just now on all 4 txs (success, blocks/gas match handoff).
- Fresh intel: Tock live+breathed (proof/MCP/rides), PredicTrader live (ensemble+copy), Dungeon HAS VIDEO + mainnet, Agent verified contract. Rivo unverified rumor. Adopted: receipt share-card (text+link only).
- Honest score 73 → ~80 with video + manual E2E. No scope added; P1 hygiene (debug gate, preview relabel, lot caption, side-aware preview) applied and verified (APP_OK, 13/13, 5/5 browser).
- Secrets re-PASS. No DB justified (48). No gimmicks found (49).

## 2026-09-06 — WalletClient redemption backend (61)
- Verified: `getClaimable` → `redeemMany` one-tx close-out, `createTrader({walletClient})` for popup redeem, module-routed `redeem`, MarketStatus enum + `winningOutcome`-only-when-`isResolved` (all d.ts refs in 61).
- Live: Gate 6 PASS — 3 real claimables on funded wallet (2005000000/1243000/1000 raw, Finalized). NOT redeemed (saved for demo camera).
- New intel: 4h/1d/45d BTC/ETH windows now listed (Gate 2); filters still 60/300/900/3600 — frontend call to surface 4h/1d.
- Suite 13 → 29/29 PASS. No scope added; no `app/` edits (frontend session owns wiring per contract in 61).

## 2026-09-08 — P0 correctness/security hardening
- Q: Can the browser preview and signed IOC drift on side pricing or stale state?
- Source: `app/trade-intent.js`, `app/app.js`, `tests/unit/trade-intent.test.mjs`, Playwright outage run, `npm run validate`.
- Finding: A single pure intent now owns BUY_YES/BUY_NO economics and policy checks. Execution rebuilds it from a fresh orderbook, book params, on-chain status, expiry, and balance immediately before `placeOrder`. DOWN uses NO-side liquidity and escrow math; no-side liquidity, wide spread, locked/unverified status, insufficient balance, and short headroom fail closed.
- Finding: Market discovery no longer falls back to displaying unverified rows. Mined zero-fill IOC receipts are labeled `NO FILL`, not “Trade completed”. Incomplete claim scans render `Claims unavailable` instead of “Nothing claimable”.
- Confidence: TEST-PROVEN for pure logic and browser error-state behavior; live Gate 2 is currently unavailable because `dev.smk.somnia.host` returns DNS `EAI_AGAIN`.
- Verification: 40/40 unit tests, 6/6 Playwright tests, build pass, syntax check pass. No new live transaction evidence claimed.

## 2026-09-08 — Cairn-informed terminal hierarchy pass
- Q: Does the terminal communicate Steady's thesis quickly enough for a judge, including on mobile and during indexer outage?
- Source: local Cairn teardown/reconstruction notes (`research/40-42`), rendered screenshots, Playwright Chromium, and current `app/terminal.html` / `app/style.css`.
- Finding: The prior terminal had correct primitives but too many equal-weight card surfaces. A presentation-only pass added a numbered `Discover → Decide → Control → Prove` rail, stronger masthead, a dominant ticket, quiet telemetry rails, a dark execute/proof band, and mobile ordering that follows the task flow.
- Finding: Health badges now separate live, checking, and status-unavailable states; outage copy remains explicit and does not imply live market authorization.
- Confidence: Browser-rendered and screenshot-verified; direct Cairn fetch was unavailable from this environment (`Could not resolve host`), so the repository's existing teardown is the reference used.
- Verification: Playwright 6/6, unit 40/40, build/syntax/diff checks pass. No live protocol evidence changed.

## 2026-09-08 — P0 strict-audit closure
- Finding: Pure `buildIocOrder` binds displayed BUY_YES/BUY_NO intent fields to submitted params; execution uses current status, fresh book, status recheck, and explicit denial states. Unknown enrichment is `UNKNOWN`; zero-fill receipts separate transaction confirmation, order acceptance, and fill verification; redemption fallback reports bounded scan completeness.
- Verification: 43/43 unit, Playwright 6/6, build and syntax pass. `npm run validate` Gate 1 PASS, Gate 2 FAIL with `getaddrinfo EAI_AGAIN dev.smk.somnia.host`; `dig` resolved `8.233.178.19`, RPC `eth_chainId` returned `0xc488`, direct indexer probe returned HTTP 200 `PersistedQueryNotSupported` for an unshaped request. `listPastBinaryMarkets` is indexer-backed.
- Confidence: test/browser-proven for behavior; live Gate 2 remains FAIL. Safe fallback is retry/status-unavailable and no order authorization.
- Reviewed IACTA, Deltr, Veyctum, Crucible, and LENS for receipt recomputation, deterministic gates, independent effects, chaos tests, and browser contracts. No external code imported; P1 plan recorded in `research/66-p1-implementation-plan.md`.

## 2026-09-09 — P0 evidence reconciliation follow-up
- Q: Can a successful receipt recovered after an RPC timeout be called a filled trade without indexed evidence?
- Source: `app/app.js`, `app/trade-intent.js`, `tests/unit/trade-intent.test.mjs`, and the SDK `FillRow` contract (`txHash`, `market`, `quantity`).
- Finding: No. The recovery branch now reports transaction confirmation separately, scopes `getUserFills` to the exact market, matches the transaction hash, and emits `FILL VERIFIED` only for positive quantity. Empty/lagging indexer results remain `FILL UNKNOWN`.
- Finding: The fresh two-sided execution snapshot now assigns each rebuilt intent to its correct UP/DOWN display slot, including BUY_NO clicks.
- Verification: 48/48 unit tests, Playwright 6/6, build, syntax, and diff checks pass. Latest live retry remains Gate 1 PASS / Gate 2 DNS `EAI_AGAIN`; no new live protocol evidence claimed.
- Confidence: TEST-PROVEN for local behavior; live Gate 2 remains externally blocked.

## 2026-09-09 — P0 verification report
- Q: Are the five approved P0 fixes proven against current code, tests, and the live boundary?
- Source: `research/67-p0-verification.md`, `app/trade-intent.js`, `app/app.js`, `lib/steady/{lifecycle,positionState}.ts`, unit tests, Playwright, and `npm run validate`.
- Finding: DOWN ticket/order economics, fresh-book execution, status fail-closed behavior, zero-fill/late-fill classification, and redemption scan completeness are PASS by source and regression evidence.
- Finding: `npm run validate` is BLOCKED at Gate 2 with `getaddrinfo EAI_AGAIN dev.smk.somnia.host`; the browser suite passes the honest timeout/retry state, but no new live protocol evidence is claimed.
- Verification: 48/48 unit, build, syntax, diff check, and Playwright 6/6 PASS.
- Confidence: TEST/BROWSER-PROVEN for the approved local scope; LIVE BLOCKED by external indexer reachability.

## 2026-09-09 — P1 architectural/release hardening
- Canonicalized browser-safe trade intent, scoring, position state, DOM safety, redemption state, and runtime configuration under `lib/`; static serving/build now exposes the required browser modules.
- Corrected BUY_NO Brier/Edge orientation from SDK YES-term fill prices, added explicit redemption idempotency and post-receipt reconciliation, escaped external HTML fields, and added request-generation guards.
- Verification: all 12 unit test files / 60 cases, build, syntax, diff check, and Playwright 6/6 pass.
- Current live boundary: Gate 1 passes; Gate 2 remains blocked by SDK DNS `EAI_AGAIN dev.smk.somnia.host`. Direct shaped GraphQL probes returned data during the incident, but no fresh live protocol evidence is claimed. See `research/68-indexer-incident.md` and `research/69-p1-verification.md`.

## 2026-09-09 19:44 WAT — P1 verification refresh
- Added regression coverage for duplicate redemption starts, timeout/hash state classification, submitted-claim matching, stale request generations, and explicit UP/DOWN Brier and Edge results.
- Direct checks: DNS `8.233.178.19`; HTTPS `HEAD` 500; shaped GraphQL `{ __typename }` and `Market { id }` responded; Shannon RPC `eth_chainId` returned `0xc488` (`50312`). `npm run validate` still fails at SDK Gate 2 with `getaddrinfo EAI_AGAIN dev.smk.somnia.host`.
- Confidence: local behavior is test/browser-proven; live discovery remains BLOCKED. No new market, fill, settlement, redemption, or signing evidence is claimed.

## 2026-09-09 21:29 WAT — P1 final exact-tree rerun
- `npm test` 60/60, build, syntax, diff check, and Playwright 6/6 PASS after the final generation and canonical-intent test tightening.
- `npm run validate` again passed Gate 1 and failed Gate 2 with SDK DNS `EAI_AGAIN dev.smk.somnia.host`.
- No fresh live market, fill, settlement, redemption, or signing evidence is claimed.
- Gate disposition: Gate 1 PASS; Gate 2 BLOCKED; Gates 3–6 NOT RUN because discovery stopped. A later read-only RPC probe returned `0xc488` (`50312`) for chain identity only.

## 2026-09-10 — Final frontend design audit (Phase 1)

- Q: What visual hierarchy can make the existing Steady homepage and terminal
  judge-ready without changing protocol behavior or hiding financial state?
- Source: `design.md`, `memory.md`, `IMPLEMENTATION-STATUS.md`, handoff state,
  research/40-42 and 61-69, current `app/` files, rendered Chromium baseline,
  and the existing Playwright suite.
- Baseline: local `npm run dev`; Playwright **6/6 PASS**; screenshots captured
  at 1280, 768, 390, and 375px for homepage and terminal; zero horizontal
  overflow at all four widths. The indexer path remained in its honest
  loading/unavailable state; no live protocol evidence changed.
- Finding: the next controlled pass should reduce homepage card repetition,
  separate illustrative versus historical proof, remove the terminal's desktop
  row-span dead space, make mobile stages fully scannable, and make BUY_NO
  receipt terms explicit while preserving the canonical intent boundary.
- Proposal: documented off-white/deep-green palette with measured AA contrast,
  semantic state mapping, responsive rules, interaction preservation map, and
  measurable acceptance criteria in `research/70-final-frontend-design-audit.md`.
- Confidence: browser-rendered/test-proven for the baseline only; Kynlo and
  Cairn were not reachable from this environment, so no exact external visual
  match is claimed. Implementation was approved and completed in the scoped frontend files below.

## 2026-09-10 - Approved frontend finishing pass

- Scope: design.md, app/index.html, app/terminal.html, app/style.css, presentation-only portions of app/app.js, and tests/e2e/steady.spec.ts.
- Implemented: off-white/deep-green tokens and semantic colors; reduced homepage card/CTA competition; explicit illustrative versus historical provenance; seven-step terminal hierarchy; independent desktop support and ticket stacks; separate network and market state surfaces; disconnected wallet state; side-explicit UP/YES and DOWN/NO economics; two-by-two mobile stage rail; 44px mobile controls; accessible non-clipped lifecycle tabs; and explicit BUY_NO receipt rows (Quoted NO, Actual NO, YES-equivalent).
- Preservation: no order construction, policy decision, wallet/SDK call, settlement, redemption, scoring, or protocol configuration changed.
- Browser QA artifacts: test-results/final-home-{1280,768,390,375}.png and test-results/final-terminal-{1280,768,390,375}.png. Review measured zero page-level horizontal overflow at all four widths and no clipped lifecycle filter at 390px or 375px. The indexer/CDN remained intermittent; the UI showed honest loading/unavailable states and no fresh live evidence was claimed.
- Verification: npm test 60/60 PASS; npm run build PASS; node --check app/app.js PASS; git diff --check PASS; Playwright 8/8 PASS. An earlier combined-run timeout in minimal.spec.ts was transient; the isolated test passed in 10.6s and the complete rerun passed. Optional screenshot helper timeouts did not fail assertions. The wallet browser test accepts only connected, explicit connect failure, or explicit SDK/read-unavailable while disconnected; it rejects half-connected state.
- Remaining risks: real MetaMask/Rabby popup signing and fresh funded fill evidence remain human/external prerequisites; do not run npm run validate:write.
- Post-QA fix: a direct Chromium probe initially found the terminal header Audit link 1px beyond the 375px viewport; the mobile nav spacing/font rule was tightened, then the probe passed zero overflow/clipping/page errors for all 8 page/width combinations. All eight final screenshots were recreated and size-checked.

- Final presentation cleanup: all frontend tracking values are now neutral 0 in CSS and design.md; refreshed screenshot byte counts are recorded in the handoff.

## 2026-09-11 - Phase 3 hardening (D1–D9, no deploy / no funded writes)

- Verified D1–D7 already present in the dirty worktree (partial-fill receipt, fresh-balance policy proof, UNKNOWN post-receipt scan with verification-only retry, disabled controls with reasons, post-switch chain re-read, aggregate DEPTH_INSUFFICIENT fail-closed, stale-selection clearing); no app/domain edits needed.
- Fixed `tests/unit/lifecycle.test.mjs` `.ts` import failure on Node 18 by re-pointing to shipped `lib/steady/position-state.js` (UNKNOWN/LIVE preserved; TS helper untouched).
- Verification: npm test 67/67 PASS; build PASS; node --check PASS; git diff --check PASS; Playwright 9/11 then 11/11 PASS on rerun (Node 22, port 5173 reused).
- Fresh `npm run validate`: Gates 1–4 + 6 PASS (20 live, 4 steady-filtered, status 1, 3/3 book, tick/lot/min 1000, 2 claimables not redeemed); write gate skipped; no EAI_AGAIN, mock, or raw IP.
- D8: local dist current (runtime-config + lib + NO-term/PARTIAL wording, no secrets); prod read-only smoke proves stale (runtime-config 404, 66,874-byte app.js with old wording).
- Verdict: READY WITH EXTERNAL BLOCKER (authorized deploy + human popup + observed settlement/redemption required). Full record: `research/PHASE-3-HARDENING-REPORT.md`.

## 2026-09-11 15:00 UTC - Release checkpoint regression (pre-commit, no deploy / no funded writes)

- FRESH EVIDENCE (this run, exact tree before release commit):
  - `npm test`: 67/67 PASS (12 suites).
  - `npm run build`: PASS (`dist/app.js` 87,183 bytes, `dist/runtime-config.js` 228 bytes, 6 steady + config modules copied, PARTIAL FILL + Quoted NO present, obsolete `Trade completed` absent, no secrets).
  - `node --check app/app.js`: PASS. `git diff --check`: PASS.
  - Playwright: 11/11 PASS (`npx playwright test tests/e2e --reporter=line --workers=1 --timeout=60000`, Node v22.22.3, ~1.9m).
  - `npm run validate` (first run, no retry needed): Gate 1 PASS (binaryModule 0x3ecC69); Gate 2 PASS (20 live); Steady-filtered BTC/ETH 900/3600 >300s = 0 at 14:59 UTC (all windows near expiry; harness reports not-a-failure); Gate 3 PASS via Trading search (market 0x...1a3a5 pool 0xf0981caa..., status 1); Gate 4a PASS (5/5 levels, best yesBid 444000 / best yesAsk 514000); Gate 4b PASS (tick/lot/min 1000); Gate 6 PASS (2 claimables preserved, NOT redeemed); write gate skipped. No EAI_AGAIN, no mock, no raw IP, no proxy.
- HISTORICAL EVIDENCE (unchanged, not re-dated): earlier real IOC hashes, browser YES/NO hashes, and settlement/redemption transactions remain as recorded above.

## 2026-09-11 ~15:09 UTC - Production deployment verification (read-only, no funded writes)

- No Vercel CLI credentials existed here, so no CLI deploy ran. Live `https://somnia-snowy.vercel.app` serves the release candidate (Vercel `last-modified 15:09 UTC`, consistent with auto-deploy from the release-commit push).
- Artifact: `/` + `/terminal` 200 byte-identical to the new build; `/runtime-config.js` 200 (chain 50312); `/app.js` 87,183 bytes byte-identical to `dist/app.js` with PARTIAL FILL + Quoted NO present and `Trade completed`/secrets/localhost absent.
- Smoke: 15/15 Playwright PASS on the prod URL, zero console/page errors. The 2 claimables remain unredeemed; no `validate:write` ran.
