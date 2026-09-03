# 06 — Bot Kit Analysis

**Source:** SRC-008

## Architecture
- Shared core in `packages/core`: auth, REST, WS, order execution, gotcha guards, nonce manager, TS + Python.
- Backtest engine `packages/backtest`: SimPool, fill model, metrics, `npm run backtest`.
- Railway deploy, session keys (hot key can't withdraw), edge-analytics tool.

## Strategies
All clone → configure → run, default DRY_RUN=true.

| Class | Members | Diff |
|-------|---------|------|
| Spot | starter (edit decide()), market-making, grid, momentum, mean-reversion, twap, ensemble (+LLM) | Commodity |
| Event Contracts | ec-starter, ec-maker, ec-passive, ec-laddering-bot, ec-oracle-follow, ec-settlement | Reuses ec-core via markets-sdk |
| Advanced | batch-7702 (EIP-7702 demo) | Technique |
| Tools | edge-analytics (maker edge vs adverse selection) | Analysis |

## Reusable patterns classification
- A commodity / already easy: grid/momentum/mean-reversion signals, basic order placement, DRY_RUN harness
- B moderately differentiated: quoting both sides with zero inventory (mint-a-pair), post-only requote, session-key scoped trader, edge measurement
- C technically difficult: mantaining live tail across pool recycling, correct redemption scanning (Finalized vs loadMarkets), handling revert bare selectors (ImmediateOrCancelNoFill 0xd48c4403)
- D genuinely unexplored: behavioral discipline (tilt), paper calibration with Brier, settlement audit surfacing

## Operational guidance
- Run doctor.ts (read-only check) before live, then one-ioc.ts.
- Use NETWORK=testnet 50312 first, then mainnet 5031.
- Gotcha: placeOrder now payable with auto-pull, removed placeTakerOrderWithoutVault.

We leverage core patterns (order lifecycle, fee/gas) but avoid rebuilding matching/settlement.
