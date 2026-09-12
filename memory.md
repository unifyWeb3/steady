# Steady — Operational Memory

**Product:** Steady — Discipline-First Event Contract Terminal for DreamDEX on Shannon 50312. Consumer shell, honest max-loss, Brier/Edge, 2-loss cooldown, transparent lifecycle.

**Architecture:** Browser → SDK (SomniaMarkets 0.29.0, SOMNIA_TESTNET_ADDRESSES) → indexer dev.smk + WS wss://api.infra.testnet.somnia.network/ws → chain. No backend/DB; lib/dreamdex (real SDK) + lib/steady (pure) + app/ (warm paper static via esm.sh, window.ethereum). See research/31.

**Phase:** Correctness/reconciliation hardening 2026-09-12. Discipline, current-attempt reconciliation, role-specific fill attribution, and display freshness are implemented locally; real popup/funded proof and healthy live discovery remain external.

**Verified protocol:** listLiveBinaryMarkets 14 live (60/300/900/3600 BTC/ETH), getMarketOnchain status 1 Trading, getBinaryOrderBook 0.751/0.777 spread, tick/lot 1000, IOC 2 with expire nanos, faucet 10k tUSDC.

**Latest real tx:** 0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c BTC 3600s market 0x...107fc pool 0x246a... price 49000 (quoted 0.049) fill 21000 (0.021) qty 1000 Direct_YES block 477265538. Faucet 0xb0bd7bb1...908e46. See IMPLEMENTATION-STATUS.md.

**Test wallet:** 0x0d6FAee78dFF4380E77D0e412F5Cddd942673719 — STT 49.99, tUSDC 9999.99 (local .env, never NEXT_PUBLIC, never committed).

**Testnet:** 50312 Shannon, http https://api.infra.testnet.somnia.network, ws wss://..., indexer https://dev.smk.somnia.host/v1/graphql, explorer https://shannon-explorer.somnia.network, collateral 0x70a86D... (6d), binaryModule 0x3ecC69...

**Decisions:** Steady selected 18, no AI/leaderboard/vault/token, no custom contracts, testnet-only, SomniaMarkets not createClient, tick snap 1000, IOC 2 not FOK, control-plane light (policy→execution→reconciliation→audit, reject heavy event-sourcing/DB/reputation-NFT/agent/Walrus/Sui) per 31a.

**Gotchas:** gate onchain 1, tick/lot 1000, expire nanos capped marketExpiry-10s, FOK→IOC fix, taker pays fill not quoted, 60/300 windows live (not only 15m/1h), approval qty not escrow, pool recycling key by marketId, indexer transient timeouts retry, BigInt JSON needs replacer.

**Blockers:** Playwright Chromium launch is restricted in this environment (`SIGTRAP` / Crashpad permission); the read-only SDK validator currently times out at Gate 2 indexer discovery; real MetaMask/Rabby popup signing and fresh funded proof remain human/external. The discipline gate is now wired to real settled outcomes.

**Next:** rerun read-only `npm run validate` when indexer discovery is healthy; rerun Playwright in a permitted Chromium environment; then perform only explicitly authorized human popup/funded verification. Never use `npm run validate:write` to manufacture evidence.

**Commands:** npm run validate, npm run validate:write, npm test, npm run dev (node serve.mjs → http://localhost:5173)

**Files:** AGENTS.md, IMPLEMENTATION-STATUS.md, research/28-handoff-state.md (truth), research/31-36, lib/dreamdex/*, lib/steady/*, app/index.html|style.css|app.js, scripts/validate/*, tests/unit/*

**Demo:** not ready — needs wallet→fill→position→settlement→redeem trace.


**Latest verification 2026-09-03 20:50:** Redemption LIVE-PROVEN market 0x...1074a winning 0 YES bal 1000→0 via 0x3aa5ec…77444 block 478925556 delta +0.001 tUSDC. Policy at boundary now enforced (maxSpread 0.15, tradeAttemptId, SUBMITTING disable). App still serves :5173, no backend.

**2026-09-03 21:37 walletClient both directions LIVE-PROVEN:** BUY_YES 0x6f6beb80… (quoted 742000→ fill 722000) + BUY_NO 0x88285864… (quoted 258000→ fill 701000) on 0x...12994 pool 0x443904… via createWalletClient http (same createTrader as browser). Tilt guard now wired to real deriveDiscipline, tradeAttemptId + SUBMITTING disable + UNKNOWN reconciliation + receipt quoted vs actual. Refresh 90s discovery, 1s local countdown.

**Visual QA:** Code inspection PASS per 30, curl 200, warm paper, no purple glow, responsive 1280/16px, dist 52K build success, no secrets, screenshots deferred (no chromium).

**Frontend reconstruction 2026-09-04 (design.md + 38/39):** direction C Ledger Instrument selected; style.css v2 system; homepage narrative + terminal Honest Ticket (risk hero, verb-forward buys, policy line), ink-solid cooldown, progressive-disclosure receipt, mktShort last-6 IDs; browser-proven chromium screenshots test-results/qa-* (home/terminal 1280+390, overflow 0, 4 live rows, live ticket preview 25.00→26.04); fixed header wrap, mobile empty-td, steps 1-col; tests 13/13, validate gates 1-4 re-PASS, dist 84K no secrets.

**Audit 2026-09-05:** penultimate audit on branch frontend-reconstruction-v2 @93b0a9d (pushed). Rules/forensics/browser re-verified; README+LICENSE added; honest 73/100. Remaining: manual popup hash, vercel --prod, video, public flip. Main untouched at 6067026.

**RC audit 2026-09-05:** research/51-60 done. Rules unchanged, forensics 4/4 re-PASS, Tock/PredicTrader/Dungeon mapped, honest 73/100. P0 tail: manual popup hash, video, vercel --prod, public flip.

**Final window 2026-09-05:** faucet button live in ticket (browser-verified render). Vercel BLOCKED (no auth, whoami hangs). Human brief ready: 1h/4h window, max loss 2, UP then DOWN. Branch frontend-reconstruction-v2.

**Release 2026-09-06:** PROD https://somnia-snowy.vercel.app LIVE, smoke 4/4 views 0 errors. Docs: README/FEEDBACK/demo.md/demo-editing. Tail: popup hashes, video, public flip, BUIDL.

**P0 strict audit 2026-09-08:** Added pure `buildIocOrder`, fresh status/book/status-recheck denial, selected-market snapshotting, explicit UNKNOWN position state, and redemption scan completeness. Unit 43/43, Playwright 6/6, build/syntax pass. `npm run validate` Gate 1 pass/Gate 2 `EAI_AGAIN` on `dev.smk.somnia.host`; Shannon RPC returns `0xc488`. Do not claim fresh live Gate 2-6. Competitor review: IACTA/Deltr/Veyctum/Crucible/LENS; P1 plan only in `research/66-p1-implementation-plan.md`.

**P0 follow-up 2026-09-09:** Fixed fresh two-sided rendering when the clicked side is BUY_NO; late receipt reconciliation now requires exact-market/tx `getUserFills` evidence before `FILL VERIFIED`, otherwise stays `FILL UNKNOWN`. Lifecycle unknown statuses map to `UNKNOWN`. Current local suite 48/48, Playwright 6/6, build/syntax/diff pass. Latest `npm run validate`: Gate 1 pass, Gate 2 DNS `EAI_AGAIN`; no new live protocol evidence.

**P1 hardening 2026-09-09:** Canonical browser-safe JS domain modules are under `lib/steady/` and imported by the terminal; app trade-intent is compatibility-only. BUY_NO scoring uses `1 - YES fillPrice`. Redemption is single-flight with explicit READY/SUBMITTING/UNKNOWN/CONFIRMED/FAILED/REDEEMED states and complete post-receipt reconciliation. External HTML fields are escaped and tx links require validated hashes. Browser config is centralized for Shannon 50312; static server/build expose `/lib/`. Generation guards cover discovery, selection, fills, score, and redemption. Final 21:29 WAT verification: 12 unit files / 60 cases, build/syntax/diff, and Playwright 6/6 pass. Gate 1 passes; Gate 2 remains externally blocked by SDK DNS `EAI_AGAIN`. Direct probes returned shaped GraphQL data but did not establish healthy SDK discovery. See research/68 and 69.

**Frontend finishing pass 2026-09-10:** Approved visual pass is implemented in design.md, app/index.html, app/terminal.html, app/style.css, presentation-only app/app.js, and tests/e2e/steady.spec.ts. The pass adds restrained off-white/deep-green tokens, explicit example versus historical provenance, independent terminal columns, a two-by-two mobile stage rail, non-clipped lifecycle tabs, disconnected-wallet grouping, side-explicit UP/YES and DOWN/NO rows, and BUY_NO receipt rows (Quoted NO, Actual NO, YES-equivalent). Durable screenshots are test-results/final-home-{1280,768,390,375}.png and test-results/final-terminal-{1280,768,390,375}.png; review found zero horizontal overflow at all approved widths and all lifecycle filters visible on 390/375px. No protocol behavior or fresh live evidence changed. Final verification: npm test 60/60, build, syntax, diff check, and Playwright 8/8 PASS; an earlier isolated minimal timeout passed on rerun. Remaining blockers are human popup signing, fresh live evidence, and intermittent SDK/indexer discovery. A post-QA 375px header-nav overrun was fixed; direct geometry checks and refreshed screenshots now pass all four widths.

**Final presentation cleanup 2026-09-11:** Removed legacy negative letter-spacing from the frontend CSS and synchronized the design token tables. Final geometry probe: zero clipping/overflow/page errors at all four widths; Playwright 8/8 remains green.

**Release checkpoint 2026-09-11 15:00 UTC (pre-commit):** FRESH: npm test 67/67, build (dist/app.js 87,183 bytes, runtime-config present, PARTIAL FILL + Quoted NO, no `Trade completed`), node --check, diff check, Playwright 11/11 (Node 22), validate Gates 1-4+6 PASS first run (20 live, 0 Steady-filtered >300s at 14:59 UTC as all windows near expiry, Trading via search, book 444000/514000, tick/lot/min 1000, 2 claimables NOT redeemed, write skipped). HISTORICAL: earlier IOC/settlement/redemption hashes unchanged, not re-dated.

**Current verification 2026-09-12 03:06 WAT:** npm test 82/82 PASS, build PASS, app syntax PASS, diff check PASS. Playwright was attempted with Node 22.22.3 but every test stopped at Chromium launch (`SIGTRAP`, Crashpad `setsockopt: Operation not permitted`), so no browser pass is claimed. Read-only `npm run validate` passed Gate 1 and timed out at Gate 2 `LiveBinaryMarkets`; Gates 3 onward did not run and no new live protocol evidence is claimed.
