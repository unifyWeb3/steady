# Source Registry — Somnia × DreamDEX Event Contracts Hackathon

Accessed: 2026-09-01

## Tier definitions
- Tier 1: official docs, repos, contracts, hackathon page, SDK
- Tier 2: maintainer statements, official calls
- Tier 3: reputable independent analysis
- Tier 4: social posts, community
- Tier 5: aggregators

| ID | URL | Tier | Publisher | Date Accessed | Reliability | Claim Supported |
|----|-----|------|-----------|---------------|-------------|-----------------|
| SRC-001 | https://dorahacks.io/hackathon/event-contracts/detail | Tier 1 | DoraHacks / Somnia Network | 2026-09-01 | High | Hackathon timeline Aug 18–Sep 8, $5k USDso, submission reqs (testnet+github+video), judging 20/25/20/20/15 |
| SRC-002 | https://docs.dreamdex.io/developers/event-contracts | Tier 1 | DreamDEX docs | 2026-09-01 | High | Event Contracts uses @somnia-chain/markets-sdk only, SDK >=0.28.0, no HTTP API for EC, IOC recommended |
| SRC-003 | https://docs.dreamdex.io/developers/event-contracts/market-structure.md | Tier 1 | DreamDEX docs | 2026-09-01 | High | Market lifecycle Listed(0) Trading(1) Locked(2) Resolved(4) Voided(5), one book two sides, mint-a-pair, escrow model, reactivity settlement |
| SRC-004 | https://docs.dreamdex.io/developers/event-contracts/gotchas.md | Tier 1 | DreamDEX docs | 2026-09-01 | High | 13 gotchas: gate on-chain status, revert handling, tick/lot, loadMarkets hides finalized, pool recycling, etc. |
| SRC-005 | https://docs.dreamdex.io/developers/event-contracts/recipes.md | Tier 1 | DreamDEX docs | 2026-09-01 | High | Snippets for discovery, book reads, tick/lot, IOC taking, post-only, mintSet, open orders, redemption via Finalized |
| SRC-006 | https://docs.dreamdex.io/developers/event-contracts/contracts-and-addresses.md | Tier 1 | DreamDEX docs | 2026-09-01 | High | Addresses identical testnet/mainnet via CREATE3, tUSDC 0x70a86... 6 decimals, USDso 18 decimals, faucet 10k cap |
| SRC-007 | https://www.npmjs.com/package/@somnia-chain/markets-sdk | Tier 1 | npm | 2026-09-01 | High | Current version 0.29.0, exports, browser support |
| SRC-008 | https://github.com/somnia-chain/dreamdex-bot-kit | Tier 1 | Somnia Chain | 2026-09-01 | High | Bot kit architecture, 5 spot + 6 ec strategies, Railway, session keys |
| SRC-009 | https://docs.somnia.network/developer/network-info | Tier 1 | Somnia docs | 2026-09-01 | High | Chain IDs 50312 testnet Shannon, 5031 mainnet, RPCs, explorer |
| SRC-010 | https://dorahacks.io/hackathon/event-contracts/buidl | Tier 1 | DoraHacks | 2026-09-01 | Medium | Shows 0 BUIDLs visible (caching) vs 13 BUIDLs expected, inconsistency noted |
| SRC-011 | https://github.com/iamsuperfly/event-contracts-hackathon | Tier 2 | Community (iamsuperfly) | 2026-09-01 | Medium | Telegram bot with Groq AI, multi-slot IOC, auto-claim, 228 commits |
| SRC-012 | https://github.com/UjjwalCodes01/PredictArena | Tier 2 | Community (Ujjwal) | 2026-09-01 | Medium | Social league, Brier+Edge, 377 wallets/6265 calls, AI player, Next.js |
| SRC-013 | https://github.com/Godwin-web3/keel | Tier 2 | Community (Godwin) | 2026-09-01 | Medium | Redeem+roll, plain-language ticket, Vite React, local journal |
| SRC-014 | https://github.com/UEddy/dreamdex-event-vault | Tier 2 | Community (UEddy) | 2026-09-01 | Medium | ERC-4626 vault, pooled capital, ec-vault-bots cron |
| SRC-015 | https://github.com/IronicDeGawd/ec-dreamdex-hackathon-template | Tier 2 | Community (IronicDeGawd) | 2026-09-01 | Medium | Starter template, not a product, lifecycle primitive |
| SRC-016 | https://tajudeeen.github.io/sluice/ | Tier 2 | Community (tajudeeen) | 2026-09-01 | Medium | Sluice Markets: downside-capped sizing, policy-controlled execution |
| SRC-017 | https://dorahacks.io/buidl/48123 | Tier 2 | Community (nftkingiii) | 2026-09-01 | Medium | Branch: conditional paths across windows, settlement-gated |
| SRC-018 | https://www.dreamdex.io/ | Tier 1 | DreamDEX | 2026-09-01 | High | Positioning: zero-fee CLOB, endgame dex, onchain liquidity layer, event contracts live BTC/ETH 15m/1h |
| SRC-019 | https://cryptogames.gg/dreamdex-opens-btc-and-eth-event-contracts-on-somnia-settled-in-usdso/ | Tier 3 | CryptoGames | 2026-08-18 | Medium | BTC/ETH Up/Down settled in USDso, zero fee order book |
| SRC-020 | https://predictionnews.com/story/somnia-and-dreamdex-host-event-contracts-hackathon | Tier 3 | Prediction News | 2026-08-18 | Medium | $5k prize, two-week sprint, context vs Gate $3M grant |
| SRC-021 | https://node_modules/@somnia-chain/markets-sdk/dist/config.js | Tier 1 | SDK source | 2026-09-01 | High | SOMNIA_TESTNET_ADDRESSES, DEFAULT_FEES 60 gwei, DEFAULT_GAS 10M |
| SRC-022 | https://stg.api.dreamdex.io/v0/markets (live fetch) | Tier 1 | DreamDEX API | 2026-09-01 | High | Live spot markets: WETH:USDso, SOMI:USDso, WBTC:USDso (spot only, no EC via HTTP) |
| SRC-023 | https://shannon-explorer.somnia.network/ | Tier 1 | Somnia explorer | 2026-09-01 | High | Testnet explorer live, gas 20.4 Gwei |
