# 28 — Handoff State

**Last verified:** 2026-09-04 — **GATES 1-4 RE-PASS (node harness) + FRONTEND RELIABILITY FIX + BROWSER QA (chromium) — walletClient signing still CODE-EXISTS-BUT-UNVERIFIED via real MetaMask popup**
**Source run:** `npm run validate:write` — live Shannon 50312 (`scripts/validate/validate.mjs`)
**SDK:** 0.29.0 (`node_modules/@somnia-chain/markets-sdk/package.json:3`)

## Current phase
`Phase 1 — Steady Control Plane + Frontend Reliability — IN PROGRESS`
**Gates 1-4 RE-PASS 2026-09-04 (node harness, 14 live, Trading, book 0.261/0.288, tick 1000). Unit 13/13 PASS. Browser: homepage PASS, terminal shell+error states PASS (chromium), wallet connect (mock Rabby) PASS. Real MetaMask popup signing still CODE-EXISTS-BUT-UNVERIFIED. No mocks. No deployment yet.**

## Verification provenance — 2026-09-04 browser pass
| Flow | Provenance | Evidence |
|------|------------|----------|
| Homepage render | LIVE-PROVEN (browser) | Playwright chromium PASS: "Know the downside" visible, bg rgb(252,250,247), no purple |
| Terminal shell + loading/error states | LIVE-PROVEN (browser) | Playwright PASS: "Loading live markets…" → after 13s "Market data unavailable / Indexer timed out after 12s / Retry" + "App shell remains usable"; paper rgb(252,250,247); no pageerror |
| Wallet connect (mock Rabby provider) | LIVE-PROVEN (browser, mocked provider) | Playwright PASS: addr 0x0d6F… shown, status Connected (26s, esm.sh slow); proves Rabby `providers[]` handling + chain guard; NOT a real signature |
| Ticket preview render | LIVE-PROVEN (browser shell) | Ticket section renders with max-loss input + preview placeholders; live market selection needs reachable indexer (currently timing out from this env) |
| Real wallet signature → tx → fill (MetaMask popup) | CODE-EXISTS-BUT-UNVERIFIED | `app.js:execute()` single boundary via `createTrader({walletClient})`; Node http walletClient BUY_YES 0x6f6beb… + BUY_NO 0x882858… LIVE-PROVEN same SDK call; browser popup needs manual MetaMask |
| Settlement/redemption | LIVE-PROVEN (prior, privateKey path) | 0x...1074a YES 1000→0 via 0x3aa5ec…77444 block 478925556; unchanged |
| Deployment | NOT VERIFIED | `dist/` rebuilt 2026-09-04 (84K, includes terminal.html); no prod URL, no prod smoke test |
| Ticket correctness (preview = executable price) | LIVE-PROVEN (browser shell) | `computeTicket` now uses live bestAsk+0.02 tick-snapped (same as `execute()`), side-aware qty/pay (DOWN priced as 1-YES), UP=YES/DOWN=NO labels, lot caption fixed (1000 raw = 0.001 contracts) |
| Policy consistency (account state vs execution result) | LIVE-PROVEN (browser shell) | Preview shows "Trade policy: DENIED — cooldown active" when cooling; receipt header reads "policy at execution (not current account state)"; cooldown enforced at boundary with exact code |
| Mobile 375px | LIVE-PROVEN (browser) | Playwright PASS: 0px overflow, ticket visible, screenshot `test-results/terminal-mobile-375.png` (dark ink rail, nav tabs, loading states) |
| Full browser suite (merged tree) | LIVE-PROVEN (browser shell) | 5/5 Playwright PASS 2026-09-04: homepage, terminal shell+timeout, mock-Rabby connect, mobile 375px, ticket render |
| Frontend reconstruction (design.md + 38/39) | LIVE-PROVEN (browser) | Direction C Ledger Instrument; style.css v2; homepage narrative + terminal Honest Ticket; chromium qa-* shots (1280+390, 0 overflow); fixes: header nowrap, mobile empty-td, steps 1-col, mktShort last-6 IDs |
| Live discovery rows + ticket preview | LIVE-PROVEN (browser) | 4 Trading rows (BTC/ETH 15m/1h, bid/ask, spread) + select → preview 25.00→26.04 @ 0.960 from live book 0.918/0.940 (`qa-ticket-live.png`); status success bar; no pageerror |

## Completed work
- Research 00-27 completed, `AGENTS.md` contamination audit 0 GenLayer hits in `/home/unify/somnia` (only `4221` in deps trusted-setups hex, not GenLayer)
- Env: `.env.example` + `.env` (gitignored, burner present locally, never `NEXT_PUBLIC_*`) + `.gitignore`
- Harness: `scripts/validate/validate.mjs` + `post_verify.mjs`
- Architecture: `lib/dreamdex/*` (client/markets/orderbook/execution/positions/settlement/redemption) + `lib/steady/*` (ticket/scoring/discipline/lifecycle) + `lib/config` (chain/env) — real SDK, pure domain, no backend
- Design: `research/29` (warm paper/ink, JetBrains Mono, risk-first) + `research/30` quality gates
- Control plane: `research/31` system arch + `31a` Cairn transfer (adopt policy→execution→reconciliation→audit→observability, reject heavy event-sourcing/DB/reputation-NFT/agent) + `32` control plane + `33` state machine + `34` reconciliation + `35` audit + `36` reliability + static `app/` shell (discovery/ticket/positions/score/settlement, real wallet via window.ethereum, no mocks)
- **Gates 1-4 PASS** at 20:16 and re-verified 21:54: `listLiveBinaryMarkets` 14 live, `getMarketOnchain` status 1 Trading, `getBinaryOrderBook` 1-3 bids/3 asks, `getBinaryBookParams` tick 1000 lot 1000
- **Gate 5 PASS** at 21:54 with real mined IOC:
  - Wallet: `0x0d6FAee78dFF4380E77D0e412F5Cddd942673719` (derived, not secret)
  - STT: `49.99144112` (49991441120000000000 wei)
  - tUSDC: `9999.999078` (9999999078 raw, after faucet `0xb0bd7bb1bbc01ebc6067a11eb5cbbe923bc5f073861079c84e348fd7dc908e46` minted 10k)
  - Market: `0x00000000000000000000000000000000000000000000000000000000000107fc` BTC 3600s pool `0x246a65643ad8b6C6Dbd0b017A259DA07681242FD` status 1 Trading expiry 1788300000 (6m50s headroom)
  - Book at send: yesAsk `29000n` (0.029) → price `49000n` (0.049, +0.02 cross, tick-snapped), qty `1000n` (1 lot), orderType `2 MARKET/IOC` (not FOK 1), expire `1788299726000000000` (now+120s capped at marketExpiry-10s)
  - Tx: `0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c` status `success` block `477265538` gas `828682` logs 8
  - Fill verified: `getUserFills` count 2, latest `fillPrice 21000` (0.021, taker pays fill not quoted) qty `1000` `quoteQuantity 21` `kind DIRECT_YES` taker BUY_YES vs maker SELL_YES `0x8a5093c7...` — explorer `https://shannon-explorer.somnia.network/tx/0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c`
- **Earlier Gate 5 FAIL** at 20:51: `FillOrKillNotFillable` on `0x...1074a` / `0x3bf5a438...` with `orderType 1 FOK` + non-crossing `550000` vs ask `819000` — classified as **IOC liquidity / order construction (harness bug)**, not protocol — fixed to IOC + crossing.
- **Indexer intermittency** observed 21:29 (`ConnectTimeoutError` / `UND_ERR_SOCKET` on `dev.smk.somnia.host`) — transient, retry passed — not persistent.

## Current task
Control plane + app shell built, browser E2E via walletClient NOW LIVE-PROVEN for both BUY_YES and BUY_NO (via http walletClient, same createTrader as browser). Next: browser MetaMask manual E2E (window.ethereum) + visual QA + prod build.

## Exact next action (CRITICAL PATH — browser E2E)
1. Re-verify reads:
```bash
npm run validate
```
2. Start app:
```bash
npm run dev  # http://localhost:5173 — real SDK via esm.sh, no mocks
```
3. In browser with MetaMask on Shannon 50312 (import TEST_WALLET_PRIVATE_KEY burner or use separate), small max loss (e.g. 2 tUSDC) → Buy UP on BTC 3600 with >5m headroom → sign → capture tx hash → verify receipt success + fill via getUserFills → position appears LIVE → after lock, listPastBinaryMarkets Finalized → redeem → verify balance.
4. Wire policy at boundary before trader.placeOrder: call lib/steady/discipline.deriveDiscipline with real settled outcomes, block with exact code/reason, disable button with tradeAttemptId, show quoted vs actual in receipt.
5. Visual QA desktop + 375px, fix hierarchy/spacing per 30.

## Files to touch next
- app/app.js (wire discipline.ts, add tradeAttemptId, disable SUBMITTING, structured logs)
- lib/steady/discipline.ts (already pure, integrate real outcomes)
- tests/unit (add lifecycle, reconciliation)

## Previous task (history)
Gate 5 proved via privateKey (0xed05c…72464c) + walletClient both directions (0x6f6beb… BUY_YES + 0x882858… BUY_NO) on 0x...12994 pool 0x443904…: receipt success, fill 722000/701000, position tracked.


## Verification provenance (LIVE-PROVEN vs TEST-PROVEN)

| Flow | Provenance | Evidence |
|------|------------|----------|
| SDK create + listLiveBinaryMarkets + getMarketOnchain + getBinaryOrderBook + getBinaryBookParams | LIVE-PROVEN | Gates 1-4 PASS 2026-09-03 19:26 (14 live, Trading) |
| Faucet + IOC via privateKey | LIVE-PROVEN | Tx 0xb0bd7bb1…908e46 + 0xed05c…72464c block 477265538 fill 21000 |
| Ticket max-loss→qty/pay (pure) | TEST-PROVEN | 13/13 unit PASS (ticket, scoring, discipline) |
| Brier/Edge <5 → null honest | TEST-PROVEN | scoring.test.mjs |
| Cooldown 2-loss → 3m block | TEST-PROVEN | discipline.test.mjs |
| Lifecycle LISTED→TRADING→LOCKED→RESOLVED/VOIDED→CLAIMABLE→REDEEMED | LIVE-PROVEN | fill LIVE (0x...107fc 0x...1074a) → LOCKED→RESOLVED status 4 Finalized → CLAIMABLE bal 1000 → REDEEMED tx 0x3aa5ec… | lifecycle.ts + getUserFills 2, but no Finalized win yet for our wallet |
| Injected-wallet IOC via walletClient | LIVE-PROVEN (both directions, via http walletClient — same `createTrader({walletClient})` as browser) | BUY_YES 0x6f6beb80… status success fill 722000 (quoted 742000) + BUY_NO 0x88285864… status success fill 701000 (quoted 258000→742000 NO) on market 0x...12994 pool 0x443904… via `createWalletClient({account, http})` → `createTrader({walletClient})` → `placeOrder` orderType 2 IOC, same as browser `custom(window.ethereum)` |
| Positions inbox live rendering | CODE-EXISTS-BUT-UNVERIFIED | app renders fills via getUserFills, but settlement state still SETTLING placeholder |
| Redemption via Finalized | LIVE-PROVEN | 0x...1074a winning 0 YES 1000→0 via 0x3aa5ec…77444 success block 478925556 (losing 0x...107fc correctly 0) |
| Deployment | NOT VERIFIED | No prod build/URL, serve.mjs only localhost |

## Blockers (current, 2026-09-04)
- **Real MetaMask popup signing BLOCKED (needs human):** walletClient construction + policy + order construction proven (Node http both directions LIVE-PROVEN 0x6f6beb…/0x882858…); mock-Rabby connect proven in chromium; but no automated tool here can click a real extension popup. Mock intentionally throws on `eth_sendTransaction` (honest) — do NOT mark browser E2E PASS until manual test.
- **Indexer currently timing out from this env** (curl 15s timeout + browser 12s timeout path exercised): node harness passed earlier same day when reachable; app now degrades gracefully with Retry. Live market rows need reachable indexer at demo time.
- **esm.sh slow (~10s for viem):** shell now boots instantly via lazy SDK import; first data load waits for SDK with explicit "Loading SDK…" + 30s timeout. Acceptable, documented.
- **Mobile screenshots deferred:** responsive CSS exists (768px breakpoint); no narrow-viewport capture yet.
- **Redemption LIVE-PROVEN** (0x3aa5ec…) via privateKey path; browser redemption uses same `redeemWinning` — CODE-EXISTS-BUT-UNVERIFIED via popup.

## Required credentials
- Present locally in `.env`: `TEST_WALLET_PRIVATE_KEY` (0x…66, STT 49.99, tUSDC 10k) — never `NEXT_PUBLIC_*`, never committed. Verified.

## Verified environment

| Item | Value | Proof |
|------|-------|-------|
| chainId | 50312 | `somniaShannon.js` + gate 1 |
| chain name | Somnia Testnet | SDK chain def |
| rpc http | `https://api.infra.testnet.somnia.network` | SDK chain def |
| rpc ws | `wss://api.infra.testnet.somnia.network/ws` | SDK chain def (alt `dream-rpc.somnia.network`) |
| indexer | `https://dev.smk.somnia.host/v1/graphql` | gate 2 live success |
| explorer | `https://shannon-explorer.somnia.network` | SDK chain def |
| SDK | 0.29.0 | `package.json` + harness header |
| collateral | `0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E` (tUSDC 6d, faucet 10k cap) | `SOMNIA_TESTNET_ADDRESSES` |
| binaryModule | `0x3ecC694Cef705358864a646142ac17A90E29e388` | same |
| test market | `0x...107fc` BTC 3600s pool `0x246a...` expiry 22:00, Trading | gate 3 live |
| book (at 21:54) | yesBid 8000n, yesAsk 29000n, tick 1000 lot 1000 | gate 4 live |
| wallet | `0x0d6FAe...3719` | derived, not secret |
| STT | 49.99 | `getBalance` live |
| tUSDC | 9999.999078 | `getErc20Balance` live post-faucet |
| faucet tx | `0xb0bd7bb1...908e46` | live |
| IOC tx | `0xed05c90f...72464c` status success block 477265538 | live |
| fill | price 21000 (0.021) qty 1000 Direct_YES | `getUserFills` live |

## Tests passed
- Gate 1 SDK creation — PASS (binaryModule 0x3ecC69)
- Gate 2 listLiveBinaryMarkets — PASS (14 live, steady 4)
- Gate 3 getMarketOnchain — PASS (1 Trading)
- Gate 4a getBinaryOrderBook — PASS (1/3 levels)
- Gate 4b getBinaryBookParams — PASS (tick/lot 1000)
- Gate 5 placeOrder IOC — PASS (real tx success + fill verified)
- Post-verify: receipt success, logs 8, `getUserFills` 2, fillPrice 21000, Explorer reachable
- Redemption — LIVE-PROVEN 2026-09-03 20:50: market 0x...1074a winning 0 YES bal 1000→0 via 0x3aa5ec…77444 success block 478925556 gas 272707 delta +0.001 tUSDC

## Tests failed / skipped
- Gate 5 at 20:51 FTK fail — **not counted as protocol failure** — was harness bug (FOK + non-cross). Fixed and re-passed at 21:54.
- No other failures. `getOutcomeBalance` probe via `oc.outcomeToken` hit `Address "undefined"` — need to use correct field (`outcomeToken` vs `outcomeTokenAddress`); not blocking for gate (fills prove position), to be fixed in product layer with proper SDK helper.

## Cairn verification (31b)
- 7 ADOPTED (gate, receipt, provenance, real-vs-mock, machine-readable state, critical tests, framework-free engine), 3 PARTIALLY (gate at boundary, independent verify), 3 REJECTED Sui-specific (Walrus/Seal/MCP) — see research/31b

## Files changed (this handoff)
- `scripts/validate/validate.mjs` — fixed `orderType 1→2` + crossing price `bestAsk+0.02` snapped (after FillOrKillNotFillable classification)
- `scripts/validate/post_verify.mjs` — new post-fill verification (receipt/fills/balances)
- `IMPLEMENTATION-STATUS.md` — gates 1-5 PASS + gate 5 detail (wallet, balances, market, params, hash, fill, explorer)
- `research/27-integration-validation.md` — added verified run, failure taxonomy, live proof artifacts
- `research/28-handoff-state.md` — this file (now write PASS)
- `research/RESEARCH-LOG.md` — to be appended next
- `.env` — now contains funded burner (not changed in repo, local only)

## Important discoveries
- Live windows are 60s/300s/3600s (1m/5m/1h), not only 15m/1h per earlier docs — filter must include 60/300.
- SDK entry is `new SomniaMarkets` not `createClient` — verified and corrected.
- `ORDER_TYPE.MARKET=2` (IOC), not 1 (FOK); price must cross `bestAsk` (+0.02) or FillOrKillNotFillable.
- Taker pays fill price 0.021 not quoted 0.049 (gotcha #7 verified live).
- Faucet works on-demand: 0→10k tUSDC in one `trader.faucet()` tx.
- `createClient.getViemClient().getBalance` and `getErc20Balance` are the correct balance checks before signing.
- WS stays open → `npm run validate:write` needs timeout or explicit exit; harness exits 124 via timeout kill but already logged success — will handle graceful close in product.

## DO NOT DO NEXT
- Do not put private key in `NEXT_PUBLIC_*` or commit `.env`
- Do not scaffold `app/` until handoff review passes (despite gates passing, per task: stop before frontend)
- Do not mock fills/hashes — every hash above is mined on 50312
- Do not hardcode venue/pool/market addresses — use `SOMNIA_TESTNET_ADDRESSES` + live discovery
- Do not reuse GenLayer config or inspect `/tmp` for this project
- Do not skip `npm run validate` re-check before Phase 1 starts

If interrupted, verify: `npm run validate` then `npm run validate:write` (should still show fill count ≥2 and same wallet).

## Production build (2026-09-03)
- npm run build → mkdir -p dist && cp -r app/* dist/ (static, no bundling, esm.sh CDN) — success dist 52K
- Smoke test dist http://localhost:5174/ 200, no secrets in dist (grep TEST_WALLET_PRIVATE_KEY 0 hits)
- Not yet deployed to Vercel (requires manual vercel --prod), but build is Vercel-ready static

## Penultimate audit (2026-09-05, branch frontend-reconstruction-v2 @ 93b0a9d)
- Rules re-verified live: Sep 8 18:00 (treat as UTC, submit by Sep 8 12:00 UTC), $5k USDso single pool, testnet+GitHub+video required, no tracks, 16 BUIDLs/314 hackers. Research/43.
- Forensics re-PASS just now: 0xed05c (b477265538), 0x3aa5ec (b478925556), 0x6f6beb (b478978327), 0x882858 (b478978375) — all success, senders/pools match handoff.
- Secrets PASS: no 64-hex keys in source/dist/history; .env never committed.
- Competitors verified: Tock arcade+streaks, volatility Agent (custom router, weaker DreamDEX-dependence), Pryzm swarm, sigma odds layer; Rivo = unverified rumor. Adopted: shareable receipt card. Research/44.
- Honest score 73/100 → ~80 with video + manual E2E. Research/45. Innovation thesis: accountability as product (46).
- Interaction audit (47): no dead controls; tilt/positions PARTIAL as before; receipt panel wired.
- State audit (48): no DB justified; one gap — receipt view lost on reload (P2, localStorage).
- Gimmick audit (49): clean; debug logs gated, preview relabeled; dead refs guarded.
- Readiness (50): top-5 = manual E2E hash, README/LICENSE/public-flip, hygiene (done), vercel --prod (no auth in env), video + SDK feedback.
- Artifacts: README + LICENSE added; vercel.json ready; dist/ rebuilt (uncommitted? rebuilt — verify before submit).
- Branch note: this audit committed on frontend-reconstruction-v2 (93b0a9d, pushed). main stays at 6067026 until reconstruction merges. Other session's untracked research/40-42/GEMINI-*/design-qa left for that session.
- DO NOT claim: popup E2E, video, deploy, submission-ready.

## Final execution window (2026-09-05, branch frontend-reconstruction-v2)
- Gates 1-4 re-PASS on demand (`timeout 50 node scripts/validate/validate.mjs`, exit 0). Live now: 12 markets incl. 4h BTC/ETH windows (129m headroom) — recommend 1h/4h for human session (zero expiry pressure).
- Vercel: CLI present (52.0.0) but `vercel whoami` hangs = NO non-interactive auth (no token, no .vercel). BLOCKED for human `vercel login` + `vercel --prod`. vercel.json ready + validated.
- Faucet P1 DONE: ticket has "Get 10k test tUSDC" button → `createTrader({walletClient}).faucet()` → hash + balance refresh; browser-verified rendering, no pageerror. Judge with empty wallet no longer dead-ends.
- Human session brief: open terminal → Connect (Rabby/MetaMask, 50312 auto-switch) → faucet if tUSDC 0 → pick BTC/ETH 1h/4h window (>5m headroom) → max loss 2 → Buy UP → sign → capture hash → repeat Buy DOWN → wait lock → Finalized → Redeem → screenshots.
- DO NOT claim: popup E2E, video, deploy, submission-ready.

## Frontend hierarchy pass (2026-09-06, video audit vs cairnsui.vercel.app)
- Trigger: screen recording (`Recording 2026-09-06 161139.mp4`) showed Steady terminal reading as unstructured slop next to Cairn's disciplined hierarchy (one idea/viewport, designed tables, no dead centerpiece).
- Fixes, all presentation-only — `lib/`, `scripts/`, order construction untouched:
  - Ticket: `#ticketCta` replaces 4-dash dead matrix until window picked + max loss entered (`terminal.html`, `app.js:updatePreview`); auto-select soonest live window on load (read-only book fetch); 3 blocks separated by `.ticket-div` rules; `[hidden]` override fix (`.ticket-rows[hidden]{display:none}` — author `display:grid` was beating UA hidden).
  - Positions: qty `/1000`→`/1e6` (was rendering 1000× vs ticket, e.g. 330000.000); fills grouped under one market header row; `Action`→`Expiry` honest label; header `Qty`→`Contracts`.
  - Type: sentence-case in-ticket labels (uppercase kept for eyebrows only); ticket elevated via `.ticket-featured` (border-2 + shadow); discovery rows densified; audit scanner slim until Finalized results exist.
  - Auxlo verdict: `md.auxlo.xyz/docs` is a URL-to-Markdown API, not a UI kit — not applicable to this task.
- Verified: `node --check` OK, 13/13 unit PASS, Playwright chromium 1280+375: 0px overflow, CTA-visible/rows-hidden default state, 0 pageerrors (`/tmp/opencode/term-*.png`); `npm run build` dist refreshed (gitignored).
- Backend-safe: zero SDK call changes; `execute()` untouched; no mocks added.

## Release execution (2026-09-06, branch frontend-reconstruction-v2)
- Pre-deploy: unit 13/13 PASS; build OK (dist 92K). Gates 1-4: indexer 504 then timeout (transient outage, honest error path in app covers it); protocol unchanged since last PASS.
- Deploy: `vercel --prod --yes` as oxunifyy → Production https://somnia-hhacr531b-oxunify.vercel.app, alias https://somnia-snowy.vercel.app (17s build).
- Prod smoke (Playwright chromium, real prod URL): home+terminal × 1280/375 all load with correct titles, ZERO console/page errors, no localhost refs, no secrets. Screenshots test-results/prod-*.png.
- Docs: README (prod URL + limitations), FEEDBACK.md (8 items), demo.md (10-shot plan), demo-editing.md. Faucet button live in ticket.
- Human tail: popup E2E (UP+DOWN hashes) → video → public flip → BUIDL before Sep 8 12:00 UTC. Recommend 1h/4h windows at session time; verify via npm run validate first.

## Backend track addendum (2026-09-06 — no `app/` edits, frontend session owns wiring)
- Redemption write path now exists lib-side: `redeemAllClaimable` (scan → ONE `redeemMany` tx via `walletClient`); pure `resolvePositionState` for all 6 tabs. Contract + snippets: `research/61-walletclient-redemption.md`.
- Gate 6 PASS (read-only): 3 claimables live on funded wallet — DO NOT redeem off-camera; save for demo.
- Suite 29/29, validate 1-4+6 PASS, build OK. Tree: backend files + `.gitignore` (*.mp4, test-results/) + frontend checkpoint commit pending merge to `main`.
- Frontend session: port the two snippets in 61 into `app.js` (`redeemAll` → real redeem; `renderPositions` → resolver + `getOutcomeBalance`×2). Receipt share-card still open (P1).

## Full-E2E addendum (2026-09-06 evening — DONE, all branches merged, on `main`)
- Frontend wiring complete: real redeem, enriched ledger, live policy gate, 4h/1d, copy-proof. Verification: 29/29 unit, 5/5 Playwright (during outage), shipped-resolver 6/6, gate DOM ○+Check. See IMPLEMENTATION-STATUS.
- Indexer 504 outage at verify time — app degrades honestly (proven in-test). Re-run `npm run validate` when green before demo recording.
- Human tail unchanged: popup UP/DOWN hashes (incl. one REDEEMED tx — 3 claimables waiting) → video → public flip → BUIDL before Sep 8 12:00 UTC.

## Redeem post-mortem (2026-09-06 night — user caught it dead, fixed + proven)
- Causes: indexer 504 (no fallback) + BUY_NO over-cross misprice + half-connected wallet + cached SDK failure + missing timeouts + decorative balance gate. All fixed in `app.js`; `crossingYesPriceForSide` added to lib + 5 pricing tests (34/34).
- Browser proof during outage: on-chain fallback found all 3 claimables → redeemMany attempted → blocked only by mock signing. Real wallet = one popup away.
- Repo now PUBLIC. Indexer still 504 at last check — re-run `npm run validate` when green, then record.

## P0 correctness hardening — 2026-09-08

Scope was limited to correctness/security/reconciliation; no visual redesign or deployment work.

- `app/trade-intent.js` is now imported by `app/app.js` and is the canonical policy/math boundary for both preview and execution. BUY_UP and BUY_DOWN use side-specific liquidity and economics; execution rebuilds the intent from fresh params/book/status before signing.
- Discovery is fail-closed: only markets with verified on-chain status `1` are displayed and cached. Status read failures render an unverified/retry state.
- Receipt rendering distinguishes `FILL VERIFIED` from a mined `NO FILL` IOC. A zero-fill transaction is never described as a completed trade.
- Redemption distinguishes complete-empty scans from incomplete/partial scans. An incomplete scan renders `Claims unavailable` and does not claim that nothing is claimable.
- Added regression coverage in `tests/unit/trade-intent.test.mjs` for side economics, fresh spread, status/lock, empty-side liquidity, zero-fill receipts, and incomplete claim scans.

Verification on 2026-09-08: `npm test` 40/40 PASS; `npm run build` PASS; Playwright `tests/e2e` 6/6 PASS; `node --check app/app.js` PASS. `npm run validate` reached Gate 1 but Gate 2 is currently blocked by DNS `EAI_AGAIN dev.smk.somnia.host`; historical live IOC/redemption evidence remains unchanged and is not re-dated by this failed read.

P0 phase complete. Do not claim a new live Gate 2 pass, browser popup signature, or fresh settlement/redemption transaction until independently observed.

## Cairn-informed terminal hierarchy pass — 2026-09-08

Presentation-only follow-up requested after P0. The terminal now uses a clear `Discover → Decide → Control → Prove` stage rail, an authored masthead, a dominant Honest Ticket, quieter discovery/ledger surfaces, and a dark execute/proof band. Mobile grid order follows the same task sequence instead of exposing the positions ledger before the ticket. Live, checking, and status-unavailable health states are visually distinct.

No protocol code or historical evidence was modified. Screenshots: `test-results/terminal-desktop.png`, `test-results/terminal-mobile-375.png`, `test-results/minimal.png`. Full browser suite: 6/6 PASS. Cairn itself was not reachable from this environment (`Could not resolve host: cairnsui.vercel.app`); `research/40-cairn-ui-teardown.md`, `41-dashboard-reconstruction.md`, and `42-visual-review.md` remain the local reference.

## P0 strict-audit closure — 2026-09-08

Implemented remaining correctness/reconciliation items without redesign or deployment: pure `buildIocOrder`; status → fresh book → status recheck → params → intent execution; explicit book/status denial; stale selection clearing; `UNKNOWN` position state; and bounded redemption fallback evidence. Verification: 43/43 unit, build, syntax, and Playwright 6/6 pass. `npm run validate` Gate 1 PASS, Gate 2 FAIL with `EAI_AGAIN dev.smk.somnia.host`; `dig` resolved `8.233.178.19`, RPC returned `0xc488`, and `listPastBinaryMarkets` is confirmed indexer-backed. No fresh live protocol evidence is claimed. Reviewed IACTA/Deltr/Veyctum/Crucible/LENS for principles only; no external code imported. See `research/65-final-release-blockers.md` and `research/66-p1-implementation-plan.md`.

## Lifecycle unknown-state alignment — 2026-09-09

The standalone `lib/steady/lifecycle.ts` mapper now returns `UNKNOWN` for protocol statuses outside the verified `STATUS_MAP`, matching the active browser position resolver and fail-closed P0 contract. Added a focused regression test. No live protocol evidence changed.

## Late-receipt fill reconciliation — 2026-09-09

The timeout-reconciliation path now distinguishes a recovered transaction receipt from fill proof. It queries `getUserFills` scoped to the exact market and transaction, reports `FILL VERIFIED` only for positive matched quantity, and leaves indexer-lag/no-match cases as `FILL UNKNOWN`. Added pure regression coverage. Current local suite: 48/48; no live protocol evidence changed.

## P0 verification report — 2026-09-09

- Completed the requested code/test audit in `research/67-p0-verification.md`.
- All five approved P0 fixes are locally PASS: side-aware DOWN economics, fresh-book authorization, status-1 fail-closed gating, zero-fill/late-fill semantics, and incomplete redemption scan handling.
- Verification: `npm test` 48/48, `npm run build`, `node --check app/app.js`, `git diff --check`, and Playwright 6/6 PASS.
- `npm run validate` is currently BLOCKED at Gate 2 after Gate 1 with `getaddrinfo EAI_AGAIN dev.smk.somnia.host`; no fresh live market, fill, settlement, or redemption evidence is claimed. Historical hashes remain historical.

## P1 architectural/release hardening — 2026-09-09

- Canonical browser-safe modules are served from `/lib/steady/` and `/lib/config/`; the app imports shared trade intent, scoring, position state, DOM safety, redemption state, and browser configuration. The old `app/trade-intent.js` path is only a compatibility re-export.
- BUY_NO Brier/Edge uses outcome probability `1 - YES fillPrice` for BUY_NO. Redemption uses a single-flight state machine and does not emit `REDEEMED` until a complete post-receipt claim scan confirms zero remaining claims.
- External values used in templates are escaped; transaction URLs require a full 32-byte hash. Discovery, selection, fills, scoring, and redemption have request-generation guards so stale completions cannot overwrite current state.
- The indexer incident is documented in `research/68-indexer-incident.md`; no raw-IP or production-indexer substitution was introduced. Direct shaped GraphQL probes responded on 2026-09-09, but `npm run validate` still failed at Gate 2 with SDK DNS `EAI_AGAIN`; this remains a live verification blocker.
- P1 verification is in `research/69-p1-verification.md`: local implementation/test items PASS, live Gate 2 BLOCKED. Current local checks: 12 unit test files / 60 cases, build, syntax, diff check, Playwright 6/6.

Verification refresh 2026-09-09 19:44 WAT: direct DNS resolved `8.233.178.19`, HTTPS `HEAD` returned 500, and shaped GraphQL probes returned `query_root` plus one `Market.id`; a 21:32 WAT JSON-RPC probe returned `0xc488` (`50312`). These direct responses do not upgrade the SDK Gate 2 result. The added redemption, scoring, and request-generation regressions are included in the 60-case local suite.

Final exact-tree rerun 21:29 WAT: 60/60 unit cases, build, syntax, diff check, and Playwright 6/6 PASS. `npm run validate` again passed Gate 1 and failed Gate 2 with SDK DNS `EAI_AGAIN`; no fresh live evidence is claimed.

Fresh gate disposition: Gate 1 PASS; Gate 2 BLOCKED; Gates 3–6 NOT RUN because the SDK harness stops at discovery. The 21:32 WAT RPC probe returned `0xc488` (`50312`) for chain identity only. Historical Gate 3–6 and transaction evidence remains historical.

## Release-gate audit refresh — 2026-09-09

- Frozen audit only: no frontend redesign, protocol edit, endpoint substitution, funded write, deployment, commit, or push.
- Required local checks: 60/60 unit cases PASS; build PASS; `node --check app/app.js` PASS; `git diff --check` PASS.
- Browser E2E: 6/6 PASS locally, including honest timeout recovery and 375px zero-overflow. Real MetaMask/Rabby signing remains human-unverified.
- Current live disposition: two official `npm run validate` runs passed Gate 1 and failed Gate 2 with SDK `fetch failed` / Node `getaddrinfo EAI_AGAIN dev.smk.somnia.host`. Gates 3-6 were not run. A separate exact SDK call intermittently returned 16 rows, while direct DNS, curl GraphQL, and Chromium GraphQL probes also answered; this mixed evidence does not establish a stable Gate 2 pass. See `research/68-indexer-incident.md`.
- Existing production `https://somnia-snowy.vercel.app`: home and terminal returned HTTP 200 and rendered at 1280px/375px without overflow or broken responses. Terminal market discovery degraded to the explicit timeout/unavailable state during smoke.
- Confirmed UI defects: none. Safest next action: wait for stable indexer resolution, rerun `npm run validate` until the official read gate passes consistently, then perform the human wallet popup/read-back evidence session before deployment or funded writes.

## Final frontend design audit — 2026-09-10

Phase 1 is complete in `research/70-final-frontend-design-audit.md`.
Baseline browser verification passed 6/6 against the local shell, with current
indexer loading/unavailable behavior preserved and screenshots captured at
1280, 768, 390, and 375px for both pages. The proposed next pass is visual only:
off-white/deep-green tokens, clearer provenance/state grammar, tighter homepage
hierarchy, independent desktop terminal columns, and explicit BUY_NO receipt
terms. No fresh live protocol evidence was created.

The approved frontend finishing pass is complete within the allowlist. It implemented the documented off-white/deep-green system and hierarchy in design.md, app/index.html, app/terminal.html, and app/style.css; added presentation-only BUY_NO receipt terminology and state styling in app/app.js; and extended tests/e2e/steady.spec.ts for four approved widths, lifecycle-tab clipping, exact NO-term receipt rows, and honest disconnected-wallet outcomes.

Final screenshots: test-results/final-home-{1280,768,390,375}.png and test-results/final-terminal-{1280,768,390,375}.png. Review found zero page-level overflow at 1280, 768, 390, and 375px; the mobile stage rail is fully scannable; and all seven lifecycle filters remain visible at 390/375px. No protocol, SDK, order, policy, settlement, redemption, or scoring behavior was changed. Current network provenance remains honest: indexer/CDN loading is intermittent and the UI degrades to explicit loading/unavailable/retry states. No fresh live market, fill, settlement, or redemption evidence was created. Real MetaMask/Rabby popup signing remains human-unverified; no funded write, deployment, commit, push, or npm run validate:write was performed.


## Final verification refresh - 2026-09-11

- npm test: 60/60 PASS.
- npm run build: PASS.
- node --check app/app.js: PASS.
- git diff --check: PASS.
- Playwright: 8/8 PASS with one worker. The isolated minimal test passed on rerun after an earlier combined-run timeout; the complete rerun passed. Optional screenshot helper calls timed out in some runs, but assertions passed.
- Existing server on port 5173 was reused because a second start returned EADDRINUSE. No new server or deployment was created.
- Browser evidence remains local/test-proven only. The indexer/CDN path was intermittent and rendered explicit loading/unavailable states; no fresh live market, fill, settlement, redemption, or signing evidence was created.

- Post-fix geometry probe: all 8 page/width combinations reported zero page overflow and zero clipped elements; the probe also found no page errors. The targeted mobile terminal header-nav fix tightened only the navlinks spacing/font sizing at narrow widths, removing a 1px Audit link overrun at 375px.
- Refreshed screenshots were explicitly written and size-checked: final-home-1280.png (250601 bytes), final-home-768.png (258374 bytes), final-home-390.png (200713 bytes), final-home-375.png (193601 bytes), final-terminal-1280.png (187889 bytes), final-terminal-768.png (180698 bytes), final-terminal-390.png (174222 bytes), and final-terminal-375.png (175866 bytes).

## Phase 3 hardening — 2026-09-11 (continuation, deadline 19:00 local)

- Scope was D1–D9 only. No redesign, feature, protocol, backend, deploy, or funded write. Dirty worktree preserved; no revert/reset/clean/branch-switch/commit/push.
- D1–D7 code verified already present in the worktree (partial-fill receipt with Requested/Filled/Remaining + FULL/PARTIAL states; fresh-balance-bound intent + policy proof; UNKNOWN post-receipt scan with verification-only retry; disabled controls with reasons; post-switch `eth_chainId` re-read; aggregate `DEPTH_INSUFFICIENT` fail-closed; stale-selection clearing). No `app/app.js` or domain edits were needed in this session.
- One test fix: `tests/unit/lifecycle.test.mjs` imported `.ts` and failed on Node 18; re-pointed to shipped `lib/steady/position-state.js` with equivalent UNKNOWN/LIVE assertions. TS helper source-verified unchanged.
- Verification: `npm test` 67/67 PASS; `npm run build` PASS; `node --check app/app.js` PASS; `git diff --check` PASS; Playwright 9/11 then 11/11 PASS on rerun (Node 22.22.3, server 5173 reused; mock wallet, no popup claim).
- Fresh `npm run validate`: Gates 1–4 + 6 PASS (20 live, 4 steady-filtered, status 1, book 3/3, tick/lot/min 1000; 2 claimables observed, not redeemed). Write gate skipped. No EAI_AGAIN this run; no raw IP/mock/proxy.
- D8: local `dist/` current (runtime-config present, 6 steady + config modules, NO-term + PARTIAL FILL wording, no secrets, no `Trade completed`). Prod `https://somnia-snowy.vercel.app` read-only smoke: `/` 200, `/terminal` 200 (15,983 bytes), `/runtime-config.js` 404, prod app.js 66,874 bytes with `Trade completed` and without current NO-term/depth wording — stale until authorized deploy.
- Full defect/record detail: `research/PHASE-3-HARDENING-REPORT.md`. Verdict: READY WITH EXTERNAL BLOCKER (authorized deploy + human popup UP/DOWN + observed settlement/redemption still required). Historical hashes not re-dated.

## Release checkpoint regression — 2026-09-11 15:00 UTC (pre-commit, no deploy / no funded writes)

FRESH EVIDENCE (exact worktree verified before the release commit):

- `npm test` 67/67 PASS (12 suites).
- `npm run build` PASS (`dist/app.js` 87,183 bytes, `dist/runtime-config.js` present, 6 steady + config modules, PARTIAL FILL + Quoted NO present, obsolete `Trade completed` absent, no secrets).
- `node --check app/app.js` PASS; `git diff --check` PASS.
- Playwright 11/11 PASS (`tests/e2e`, one worker, 60s timeout, Node v22.22.3).
- `npm run validate` first run, no retry: Gates 1-4 + 6 PASS. Gate 2 returned 20 live; Steady-filtered BTC/ETH 900/3600 >300s was 0 at 14:59 UTC because every window was near expiry (harness: not a failure). Trading market found via status search (0x...1a3a5 / pool 0xf0981caa..., status 1); book 5/5 levels (best yesBid 444000 / best yesAsk 514000); tick/lot/min 1000. Gate 6: 2 claimables observed, NOT redeemed. Write gate skipped. No EAI_AGAIN, mock, raw IP, or proxy.

HISTORICAL EVIDENCE (unchanged, not re-dated): earlier live IOC, browser YES/NO, settlement, and redemption hashes remain as recorded above. No fresh transaction is claimed.
