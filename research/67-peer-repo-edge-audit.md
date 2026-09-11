# 67 — Peer Repository Edge Audit

Reviewed 2026-09-08 from the public GitHub profiles requested by the project owner. The purpose is competitive learning, not code copying. Steady keeps its selected scope: no agents, leaderboard, database, custom contracts, or non-DreamDEX execution path.

## Highest-value findings

| Source | Useful edge | Steady application | Decision |
|---|---|---|---|
| [mystiquemide/iacta](https://github.com/mystiquemide/iacta) | Direct DreamDEX competitor with receipt-backed fills/redemptions, restart reconciliation, negative proof, and independently recomputable evidence | Make every UI claim evidence-specific; recover submitted activity from SDK reads after uncertain responses; verify redemption effects rather than trusting transaction status | P0 evidence model adopted in smaller browser-only form; durable reconciliation deferred to P1 |
| [mrnetwork0001/Deltr](https://github.com/mrnetwork0001/Deltr) | Deterministic multi-check risk gate before every write | Keep one canonical intent with named status, headroom, liquidity, spread, grid, quantity, balance, and cooldown checks | Adopted; do not copy its agent/MCP architecture |
| [mystiquemide/veyctum](https://github.com/mystiquemide/veyctum) | Separates transaction success from the intended financial effect and requires independent evidence | Distinguish transaction confirmation, order acceptance, fill verification, and redemption balance/event effects | Transaction/order/fill dimensions adopted; redemption effect verification planned |
| [Kingnanaweb3/crucible](https://github.com/Kingnanaweb3/crucible) | Fault injection exposes silent corruption rather than only happy-path failure | Add deterministic cases for stale book, missing status, zero fills, incomplete claim scans, timeouts, and response reordering | Core P0 fault cases added; full fault matrix deferred |
| [Enoch208/lens](https://github.com/Enoch208/lens) | Browser-observable regression contracts and `MISSING != SAME` | Protect visible ticket/order identity, status-unavailable behavior, and receipt wording in Playwright | Add focused browser assertions in P1; no new test framework needed |

## Other useful patterns

- `mrnetwork0001/Deflow`: hash-linked refusals are persuasive proof. Steady should retain named denial codes in its receipt/audit surface, without adding a database.
- `mrnetwork0001/Truvian`: grade exact verifiable facts, not narrative similarity. Steady’s demo should lead with order params, explorer receipt, fill, and claim evidence.
- `mystiquemide/kyvrane`: pre-execution orderbook-depth checks support adding a tested depth cap after P0.
- `Enoch208/Cairn`: proof-carrying output and progressive disclosure already influenced the receipt hierarchy; its Sui/Walrus/Seal stack remains irrelevant.
- `Enoch208/Sigil`: cross-checking logs, source, and CI is useful for a release evidence bundle, but a new observability product is out of scope.

## What not to borrow

- Autonomous traders, AI forecasts, leaderboards, tournaments, or social competition: conflict with Steady’s discipline-first consumer product.
- SQLite/event-sourced backends: unnecessary for the current browser → SDK → chain architecture unless restart-safe reconciliation is later proven impossible without one.
- Custom contracts, tokens, cross-chain rails, MCP servers, or custody layers: weaken DreamDEX centrality and expand risk.
- Visual skins copied from unrelated products: judges need an inspectable ticket and proof flow, not another themed dashboard.

## Competitive conclusion

IACTA is the strongest technical comparison because it uses the same SDK and chain. Its advantage is durable, independently recomputable evidence; Steady’s advantage is a clearer human decision product with explicit max loss, cooldown discipline, and honest per-trade execution semantics. The best route is to make Steady’s narrower promise exceptionally provable, not to imitate IACTA’s arena.
