# 07 — Somnia Ecosystem

**Source:** SRC-009, docs.somnia.network, SRC-018

- Somnia: high-performance EVM L1, "Agentic Chain", sub-second finality, sub-cent fees, claimed up to 1M TPS.
- Networks: mainnet 5031 (SOMI), testnet Shannon 50312 (STT), RPC dream-rpc.somnia.network / api.infra.* , explorer shannon-explorer.somnia.network, socialscan alt.
- Reactivity: native on-chain reactivity delivers oracle callback automatically; no keeper/cron needed. Useful beyond DreamDEX (agents, raffles, orchestrators).
- Accounts: wallets are users (no accounts), 12.8k traders on DreamDEX, validators 50, CLOB semantics.
- Ecosystem apps: DreamDEX (spot/event), upcoming perps/RWAs/vaults; prior hackathon winners were agent/ infra kits (Somnia Agent Kit, Infra Kit, MCP) — judges rewarded SDK/tooling.
- DeFi infra: tUSDC faucet 10k, USDso stable, bridge via collateralRouter, lend pool addresses.
- Community: Telegram dev https://t.me/+XHq0F0JXMyhmMzM0, Discord, @SomniaDevs tutorials.
- Implication: Event Contracts natural connect to reactivity (settlement) + agent narrative, but we reject forced agent integration unless load-bearing. Choose narrow integration (settlement audit via oracleQuestionId graph).
