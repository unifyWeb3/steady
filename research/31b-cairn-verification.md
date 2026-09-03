# 31b — Cairn Verification (Steady vs Transferable Concepts)

**Date:** 2026-09-03 — verifies `research/31a-cairn-transfer.md` against actual Steady code

Source: `/tmp/cairn` (Enoch208/cairn, 319-line README, verified Walrus/Seal/Sui), Steady `lib/` + `app/` + tests

| Cairn concept | Steady implementation | Verdict | Location | Reason / Evidence |
|---|---|---|---|---|
| Gate before action (recall before LLM) | Policy before `placeOrder` | **PARTIALLY ADOPTED** | `lib/steady/discipline.ts` + `lib/dreamdex/execution.ts:buildIocParams` + `app/app.js:execute()` checks `getMarketOnchain` status 1, headroom, tick/lot, balance, spread before `trader.placeOrder` | Gate exists but tilt guard still placeholder (`Math.random`) in app.js:356 — not yet enforced at boundary with real `deriveDiscipline` + disabled button |
| Policy enforcement at real boundary (cannot bypass via UI) | Execution boundary | **PARTIALLY ADOPTED** | `lib/dreamdex/execution.ts` throws on invalid price/qty/expiry; `app.js` disables via `confirmBox` + cooldown check, but direct calls to `trader.placeOrder` could bypass UI — no server policy | Pure checks are in lib, but no centralized `policyEngine.evaluate()` that every path must call — need single `evaluatePolicy()` before trader |
| Verifiable receipts (used/authorized/verified/blocked, Walrus GET) | Trade receipt (quoted vs actual) | **ADOPTED** | `research/32-control-plane.md` + `IMPLEMENTATION-STATUS.md` gate 5 detail (quoted 49000 vs fill 21000) + `app.js` shows tx hash + explorer link | Receipt distinguishes QUOTED vs ACTUAL live (gotcha #7), includes marketId/pool/txHash/orderId/fillId via `getUserFills` |
| Provenance (timestamp, marketId, wallet, txHash, orderId, fillId, outcome, source, prev/current) | Audit trail | **ADOPTED** | `research/35-audit-model.md` + `lib/steady/lifecycle.ts` + handoff `28` preserves all fields per tradeAttemptId | Every trade keeps marketId, wallet 0x0d6F…, tx 0xed05…, orderId 5534…, fillId 477265538_8, timestamps |
| Explicit real-vs-mock separation + honesty table | No mock rendering | **ADOPTED** | `AGENTS.md:6` + `research/29` + app shows `— Need 5 settled` when n<5, `No positions — connect wallet`, `ImmediateOrCancelNoFill` honest | No simulated fills rendered as real; fixtures only in `tests/unit` clearly labeled |
| Machine-readable state | State machine | **ADOPTED** | `research/33-state-machine.md` LISTED→TRADING→LOCKED→RESOLVED/VOIDED + LIVE→SETTLING→CLAIMABLE→WON/LOST/VOID→REDEEMED + tradeAttempt PENDING→CONFIRMED→INDEXED→SETTLED + `lib/steady/lifecycle.ts` | States derived from `getMarketOnchain` + `getUserFills`, not frontend assumptions |
| Critical-flow tests (13 passing, gate, receipt) | Tests | **ADOPTED** | `tests/unit/*.mjs` 13/13 (ticket capping, tick snap, Brier 0/0.25, Edge, cooldown 2-loss), `scripts/validate/validate.mjs` gates 1-5 live, `post_verify.mjs` receipt+fill | Pure domain tested, integration harness live-proven, but browser walletClient path not yet live-proven (privateKey path only) — mark as CODE-EXISTS-BUT-UNVERIFIED |
| Independent verification (aggregator GET, Sui devInspect, walletless verifier) | Explorer + receipt re-check | **PARTIALLY ADOPTED** | Explorer links `shannon-explorer.../tx/{hash}` in app + harness, `getTransactionReceipt` + `getUserFills` re-check, but no Sui-style hash chain (not applicable, Somnia has no Sui object) | Verifiable via explorer + SDK re-read, not via Walrus blob GET (Somnia uses indexer, not Walrus) |
| Sui Walrus/Seal/MemWal storage + encryption | Content on Walrus | **REJECTED** | — | Correctly rejected: Somnia collateral is ERC20/ERC6909, not Walrus blobs; no Seal; provenance via tx logs + indexer, not Walrus (per 31a) |
| Sui Move `cairn::access` on-chain policy + Receipt NFT hash chain | On-chain enforcement | **REJECTED** | — | Correctly rejected: Somnia has no Move policy object; Steady policy is local pure before signing, not consensus-enforced; could anchor hash but not needed for MVP |
| MCP server for any agent | Agent memory tools | **REJECTED** | `research/31a` + `32` (future `monitor→evaluate→propose→policy→approval→execute→verify` documented, not shipped) | Correctly rejected: autonomous financial execution not safe/testable before deadline; philosophy adopted (agent proposes, policy decides) without shipping |
| Framework-free pure engine `@cairn/core` | `@steady/core` | **ADOPTED** | `lib/steady/*` dependency-free pure (ticket, scoring, discipline, lifecycle) importable without SDK, tested | Mirrors Cairn's engine boundary |

**Summary:** 7 adopted, 3 partially (gate, boundary, independent verify need wiring to be fully at execution boundary + walletClient prove), 3 correctly rejected Sui-specific. No Sui stack copied.

**Next to make gate fully at boundary:**
- Single `evaluatePolicy({market, book, balance, history}) → {pass, code}` called inside `execution.ts` before any trader path (both privateKey and walletClient)
- Wire `deriveDiscipline` with real settled outcomes (not random) + disabled SUBMITTING button with `tradeAttemptId`
- WalletClient E2E: prove `createTrader({walletClient})` IOC with small maxLoss via injected wallet (same params as privateKey success)
