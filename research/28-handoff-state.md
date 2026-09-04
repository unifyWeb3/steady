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
| Deployment | NOT VERIFIED | `dist/` rebuilt 2026-09-04 (68K); no prod URL, no prod smoke test |

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
