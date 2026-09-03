# 31 — System Architecture (Steady Control Plane)

**Date:** 2026-09-02
**Baseline:** Gates 1-5 PASS (21:54), lib/dreamdex + lib/steady built, app static shell at `app/` — *not discarding*, expanding.

## Component architecture
```
Browser (no backend, no DB)                Somnia Shannon 50312
┌─────────────────────────┐                ┌──────────────────┐
│ Steady UI (app/*.html)  │                │ DreamDEX CLOB    │
│  Discovery · Ticket     │                │ BinaryModule     │
│  Score · Positions      │◄── SDK ───────►│ OutcomeToken6909 │
│  Settlement · Audit     │  indexer+WS    │ OracleHub        │
└──────────┬──────────────┘                └──────────────────┘
           │ lib/dreamdex (real SDK, no mocks)    lib/steady (pure)
           ├─ client.ts  (SomniaMarkets singleton)
           ├─ markets.ts (listEligible, filterTrading)
           ├─ orderbook.ts (getSteadyBook, tick/lot snap)
           ├─ execution.ts (buildIocParams, placeIoc) ◄─ policy boundary
           ├─ positions.ts (getUserFills)
           ├─ settlement.ts (lifecycle, oracle URL)
           └─ redemption.ts (redeemWinning)
           ├─ ticket.ts (max-loss → qty/pay)
           ├─ scoring.ts (Brier/Edge <5 → null)
           ├─ discipline.ts (2-loss cooldown)
           └─ lifecycle.ts (protocol→inbox)
             lib/config (env, chain)
             wallet (viem walletClient, no NEXT_PUBLIC secrets)
```

**Trust boundaries:** wallet private key never leaves signer (injected `window.ethereum` → `walletClient`), env `TEST_WALLET_PRIVATE_KEY` only in `scripts/validate` local.

**Secret boundaries:** `NEXT_PUBLIC_*` only chain/indexer/WS (browser-safe); server never needed (no `INDEXER_HEADERS` for dev endpoint).

**Failure boundaries:** indexer lag → on-chain re-read; FOK→IOC fix; empty book → `ImmediateOrCancelNoFill` honest; expiry <60s → block.

## Data flow (one trade)
INTENT(maxLoss, side) → POLICY CHECK → MARKET VALIDATION(onchain 1 + headroom) → QUOTE(tick/lot + book) → USER CONFIRM → TX(realtime_sendRawTransaction 60gwei/10M) → RECEIPT → FILL(getUserFills) → POSITION → SETTLEMENT(status 4/5) → REDEMPTION

## Why no backend?
Zero evidence user needs one: no DB (fills are chain), no auth (wallet is auth), no queue (markets roll 60-3600s, not high-frequency). Adding REST/DB/queue is architecture theater. Keep browser→SDK direct, add thin proxy only if CORS blocks (Branch pattern).

## Control-plane vs UI
UI is calm instrument (29). Control plane is serious inside: policy at execution boundary, reconciliation after write, audit receipt distinguishes QUOTED vs ACTUAL (fillPrice 0.021 vs quoted 0.049 verified).

## State is ledger-minded but not heavy event-sourced
Preserve per tradeAttemptId: marketId, pool, side, qtyRaw, priceRaw, maxLossRaw, policyChecks, txHash, orderId, fillId, outcome, timestamps, source. Store in `localStorage` + chain; no separate event store.

## Adopted vs rejected (see 32)
Adopt: policy engine, execution boundary, receipt, lifecycle state machine, reconciliation, observability, audit, reliability, idempotency.
Reject for MVP: heavy event-sourcing DB, reputation beyond Brier/Edge, autonomous agent, token/payments, backend queue.

