# 10 — Hackathon Projects (Active Scan 2026-09-01)

**Method:** GitHub search "DreamDEX", "event contracts", "Somnia hackathon", DoraHacks /buidl fetch, websearch.

**DoraHacks BUIDL page:** Shows 0 (filter bug) — treated as UNKNOWN, not fact. External scan found 7 public repos dated Aug–Sep 2026; all likely participants.

| # | Repository | Thesis | Stack | EC dep | Maturity | Likely judge score | Weakness | Overlap |
|---|------------|--------|-------|--------|----------|--------------------|----------|---------|
| 1 | iamsuperfly/event-contracts-hackathon (Telegram Bot) | Telegram trading, Groq AI for 5m/15m+, Binance for 1m, auto 15m loop, claim | Node/grammY/Express/Supabase/viem 0.28.1 | Load-bearing (live discovery, IOC, redeem) | High (228 commits, multi-slot) | Med-High | Autonomous AI may worry judges; Groq failure mode | Our auto is manual+cooldown, not AI |
| 2 | UjjwalCodes01/PredictArena (Social League) | Weekly league, Brier+Edge, 377 wallets/6265 calls, duels, AI player | Next.js 16/Drizzle/Neon/packages/dex 2691 LOC | Foundational (every call) | Very high (354 tests) | High | Complex, needs indexer host, not paper | We share scoring but not league |
| 3 | tajudeeen.github.io/sluice (Sluice Markets) | Downside-capped sizing: max loss → largest order via live depth | Unknown (policy engine) | Foundational | Live demo | High | Narrow to execution risk | Similar sizing but we add discipline |
| 4 | nftkingiii/branch (Branch) | Conditional paths across windows, verification via settlement | TS, SDK via RPC proxy, next window verify | Load-bearing (settlement determines next) | Verified 2-leg proof | Med-High | Niche path thesis, non-custodial manual | Our roll is simple, not conditional path |
| 5 | Godwin-web3/keel (Keel) | Fixed line, plain ticket, redeem, roll next window, local journal | Vite React TS, SDK >=0.28.1 | Important | 25 commits, live vercel | Med | Local journal misses unjournaled balances | Our redeem scans chain, not journal |
| 6 | UEddy/dreamdex-event-vault | ERC4626 vault, pooled capital, strategies trade pooled assets, ranked | Fork of bot-kit, cron jobs | Important | Spike proven (cost 1.35pp) | Med | Needs audit, custody risk | We do self-custody, no pooling |
| 7 | IronicDeGawd/ec-dreamdex-hackathon-template | Starter template, not product, lifecycle brick | TS + Solidity Foundry | N/A | 6 commits | Low (template) | No app | We build product layer |

**Saturation implication:** AI bot + social league + execution sizing are dense; redeem/roll is contested but thin; vault is lone but heavy.

**Confidence:** STRONGLY SUPPORTED (each repo README inspected)
