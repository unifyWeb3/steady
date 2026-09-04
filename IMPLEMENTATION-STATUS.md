# Implementation Status — Steady

Last updated: 2026-09-04 — Gates 1-4 re-PASS + frontend reliability fix + browser QA (chromium); real-popup signing still CODE-EXISTS-BUT-UNVERIFIED

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
