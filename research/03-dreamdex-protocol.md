# 03 — DreamDEX Protocol

**Source:** SRC-018, SRC-002, SRC-003, SRC-005

## Positioning
- DreamDEX is **fully on-chain CLOB** for perps/spot/event contracts, zero fees (maker/taker/settlement = 0 on dreamDEX), on Somnia L1.
- Tagline: "the onchain liquidity layer", "endgame DEX". Stats (404 fetch): $55.4m 30d vol, 12.8k traders, 3.1m fills, $1.3m TVL, 4 CLOB markets.
- Roadmap: spot live, event contracts live, perps building, RWAs/vaults planned.
- Wants to be liquidity/execution layer for third-party apps + agent venue (built for bots, no rate limits, CLI/ccxt/MCP).

## Not solving (wedge)
- Consumer discovery, odds comprehension, risk management, redemption UX, settlement trust, reputation. That's the product layer.

## Infrastructure
- Validator clearing, 50 validators, no centralized sequencer, all events on-chain.
- Yield-bearing CLOB with USDso rewards for market makers.
- 10ms execution, 1m+ trades/sec (claim, evm-compatible).
