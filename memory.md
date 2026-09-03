# Steady — Operational Memory

**Product:** Steady — Discipline-First Event Contract Terminal for DreamDEX on Shannon 50312. Consumer shell, honest max-loss, Brier/Edge, 2-loss cooldown, transparent lifecycle.

**Architecture:** Browser → SDK (SomniaMarkets 0.29.0, SOMNIA_TESTNET_ADDRESSES) → indexer dev.smk + WS wss://api.infra.testnet.somnia.network/ws → chain. No backend/DB; lib/dreamdex (real SDK) + lib/steady (pure) + app/ (warm paper static via esm.sh, window.ethereum). See research/31.

**Phase:** Phase 1 live, gates 1-5 PASS re-verified 2026-09-03 19:26. App shell live :5173, 13 unit tests PASS.

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

