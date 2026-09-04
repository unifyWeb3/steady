# Steady — Operational Memory

**Product:** Steady — Discipline-First Event Contract Terminal for DreamDEX on Shannon 50312. Consumer shell, honest max-loss, Brier/Edge, 2-loss cooldown, transparent lifecycle.

**Architecture:** Browser → SDK (SomniaMarkets 0.29.0, SOMNIA_TESTNET_ADDRESSES) → indexer dev.smk + WS wss://api.infra.testnet.somnia.network/ws → chain. No backend/DB; lib/dreamdex (real SDK) + lib/steady (pure) + app/ (warm paper static via esm.sh, window.ethereum). See research/31.

**Phase:** Phase 1 hardening merged 2026-09-04. Gates 1-4 re-PASS (node). Unit 13/13 PASS. Browser 5/5 PASS (chromium): homepage, terminal shell+timeout, mock-Rabby connect, mobile 375px (0 overflow), ticket render. Ticket preview = executable price, policy DENIED shown during cooldown, receipt = policy-at-execution. Real popup signing CODE-EXISTS-BUT-UNVERIFIED. dist/ 84K rebuilt, no prod URL yet.

**Verified protocol:** listLiveBinaryMarkets 14 live (60/300/900/3600 BTC/ETH), getMarketOnchain status 1 Trading, getBinaryOrderBook 0.751/0.777 spread, tick/lot 1000, IOC 2 with expire nanos, faucet 10k tUSDC.

**Latest real tx:** 0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c BTC 3600s market 0x...107fc pool 0x246a... price 49000 (quoted 0.049) fill 21000 (0.021) qty 1000 Direct_YES block 477265538. Faucet 0xb0bd7bb1...908e46. See IMPLEMENTATION-STATUS.md.

**Test wallet:** 0x0d6FAee78dFF4380E77D0e412F5Cddd942673719 — STT 49.99, tUSDC 9999.99 (local .env, never NEXT_PUBLIC, never committed).

**Testnet:** 50312 Shannon, http https://api.infra.testnet.somnia.network, ws wss://..., indexer https://dev.smk.somnia.host/v1/graphql, explorer https://shannon-explorer.somnia.network, collateral 0x70a86D... (6d), binaryModule 0x3ecC69...

**Decisions:** Steady selected 18, no AI/leaderboard/vault/token, no custom contracts, testnet-only, SomniaMarkets not createClient, tick snap 1000, IOC 2 not FOK, control-plane light (policy→execution→reconciliation→audit, reject heavy event-sourcing/DB/reputation-NFT/agent/Walrus/Sui) per 31a.

**Gotchas:** gate onchain 1, tick/lot 1000, expire nanos capped marketExpiry-10s, FOK→IOC fix, taker pays fill not quoted, 60/300 windows live (not only 15m/1h), approval qty not escrow, pool recycling key by marketId, indexer transient timeouts retry, BigInt JSON needs replacer.

**Blockers:** Injected-wallet browser E2E (walletClient IOC) not yet live-proven (privateKey path proven) — next; settlement→redeem needs Finalized market (currently 2 fills not yet settled); tilt guard placeholder random — needs real discipline wiring.

**Next:** npm run validate → browser E2E via window.ethereum (small maxLoss IOC) → verify fill/position → wait for lock → redeem via Finalized → audit receipt quoted vs actual → visual QA mobile → build/deploy smoke test.

**Commands:** npm run validate, npm run validate:write, npm test, npm run dev (node serve.mjs → http://localhost:5173)

**Files:** AGENTS.md, IMPLEMENTATION-STATUS.md, research/28-handoff-state.md (truth), research/31-36, lib/dreamdex/*, lib/steady/*, app/index.html|style.css|app.js, scripts/validate/*, tests/unit/*

**Demo:** not ready — needs wallet→fill→position→settlement→redeem trace.


**Latest verification 2026-09-03 20:50:** Redemption LIVE-PROVEN market 0x...1074a winning 0 YES bal 1000→0 via 0x3aa5ec…77444 block 478925556 delta +0.001 tUSDC. Policy at boundary now enforced (maxSpread 0.15, tradeAttemptId, SUBMITTING disable). App still serves :5173, no backend.

**2026-09-03 21:37 walletClient both directions LIVE-PROVEN:** BUY_YES 0x6f6beb80… (quoted 742000→ fill 722000) + BUY_NO 0x88285864… (quoted 258000→ fill 701000) on 0x...12994 pool 0x443904… via createWalletClient http (same createTrader as browser). Tilt guard now wired to real deriveDiscipline, tradeAttemptId + SUBMITTING disable + UNKNOWN reconciliation + receipt quoted vs actual. Refresh 90s discovery, 1s local countdown.

**Visual QA:** Code inspection PASS per 30, curl 200, warm paper, no purple glow, responsive 1280/16px, dist 52K build success, no secrets, screenshots deferred (no chromium).
