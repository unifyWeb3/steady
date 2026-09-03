# 31a — Cairn → Steady Transfer Analysis

**Source:** `https://github.com/Enoch208/cairn` cloned to `/tmp/cairn` 2026-09-02, README 319 lines, verified real Walrus/Seal/Sui stack.

## What Cairn does
Proof-carrying memory for AI agents: Gate before generation, `agent × namespace` policy, Answer Receipt (used/authorized/verified Walrus/blocked), Walrus blob verification via `GET /v1/blobs/{id}`, Sui `cairn::access` on-chain policy + `Receipt` hash-chained NFT, mock-first interfaces, honesty table (real vs mock).

## Mechanism → problem solved

| Cairn mechanism | Problem | Transferable to Steady? |
|---|---|---|
| `recall()` gate before LLM (pure, tested) | Prevent leak of blocked memory to model | **Yes** — policy before execution: Steady gate before `placeOrder` (max loss, headroom, liquidity, spread, cooldown) is same pattern |
| `buildReceipt()` used/authorized/verified/blocked | User can't know what agent used | **Yes** — Trade Receipt: quoted vs actual fill, policy checks, marketId, txHash, orderId, fillId, outcome |
| Walrus blob `GET` verification (live, not flag) | Badge would be fake otherwise | **Yes** — verify fill/position via `getUserFills` + receipt logs, settlement via `getMarketOnchain` + explorer link, not flag |
| `@cairn/core` framework-free pure engine | UI glue not reusable, not testable | **Yes** — `lib/steady` pure (ticket, scoring, discipline, lifecycle) already mirrors this |
| Honesty table (real vs mock explicit) | Hard to know what's faked | **Yes** — Steady must never render simulated fill as real; fixtures isolated & labeled, live state labeled "LIVE" |
| Mock-first env-driven interfaces | Demo fails on flaky testnet | **Partial** — SDK reads are always real; app shell degrades to empty-book honest state, not mock; test fixtures only for unit tests |
| Sui `access::policy` + `Receipt` hash chain | Server can't lie about authorized | **No/Sui-specific** — Somnia has no equivalent Move policy object; Steady's policy is local pure check before signing, not on-chain enforcement. Could anchor receipt hash to tx data, but not Sui Seal/Walrus |
| Walrus/Seal/MemWal storage + encryption | Content must be provably stored/encrypted | **No** — Somnia collateral is ERC20 + ERC6909 outcome tokens, not Walrus blobs; no Seal equivalent; provenance is via tx logs + indexer, not Walrus |
| MCP server (cursor/claude tools) | Memory must travel across agents | **No for MVP** — future optional: expose `steady_*` tools gated by policy, but not in hackathon scope |
| ESM export bug lesson (type:module) | Latent interop trap | **Yes** — keep packages ESM, verify via `validate.mjs` import (we already hit `createClient` not exported) |

## What is NOT transferable (Sui-specific)
- Walrus publisher/aggregator (`PUT /v1/blobs` / `GET`) — Somnia uses indexer `dev.smk.somnia.host/v1/graphql` + RPC WS, not Walrus
- Seal/MemWal encryption — not applicable to DreamDEX collateral; outcome tokens are ERC6909, not encrypted
- Sui Move `cairn::access` + `Receipt` NFT hash chain — no Sui consensus in Steady; Steady's verification is tx receipt + fill + explorer, not Sui object
- MCP memory tools — different domain; Steady's future agent would be `monitor→evaluate→propose→policy-check→approval→execute→verify` but not in MVP

## What materially strengthens Steady without scope creep (adopt)

1. **Policy engine as execution boundary** — move tilt guard from UI gimmick to `lib/steady/discipline.ts` + `lib/dreamdex/execution.ts` gate before `placeOrder`; deny with exact reason, cannot be bypassed by button.
2. **Proof-carrying receipt** — every trade produces `TradeReceipt` (tradeAttemptId, market, direction, qty, quoted vs actual, max loss, payout, spread, expiry, policyChecks, wallet, txHash, fillId) — display in audit surface.
3. **Reconciliation layer** — distinguish PENDING/CONFIRMED/INDEXED/SETTLED/REDEEMED, detect tx mined but fill missing, indexer lag honest.
4. **Observability** — structured logs with `tradeAttemptId` across policy→order→tx→fill→position→settlement, no secrets.
5. **Failure-first states** — SUCCESS/PENDING/FAILED/UNKNOWN/STALE/CONFLICTING, especially UNKNOWN for timeout (don't claim failed if maybe mined).
6. **Idempotency guard** — SUBMITTING disables button, associate attemptId+orderId+txHash, prevent double-click.
7. **Auditability surface** — Proof/Details view per trade (policy passed, market trading, quote, funding, tx mined, fill verified, tx/order/fill/market IDs).

Reject for MVP: heavy event-sourcing system, reputation NFT, payments tokenomics, autonomous execution, backend.

**Quote to keep:** "Simple outside, serious inside — policy engine → execution boundary → reconciliation → audit receipt → observable lifecycle." That's Cairn's philosophy without its stack.
