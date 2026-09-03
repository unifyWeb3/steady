# 18 — Product Selection

**Date:** 2026-09-01  
**Decision:** Build **Steady — The Discipline-First Terminal for DreamDEX Event Contracts**  
**Status:** SELECTED (see 23-decisions.md)

## Executive thesis
DreamDEX's 15m BTC/ETH Up/Down windows on Somnia's 10ms chain maximally enable overtrading. Retail loses not from one wrong call but from chasing losses in rapid windows that are near coin-flip. Steady is the brake: a consumer terminal that makes you state max loss before you bet, shows your true forecasting skill (Brier/Edge) over live history, and enforces a cooldown when you're tilting — so you survive to redeem.

## User
Primary: **New-to-intermediate retail** who understands BTC direction roughly but has <20 event-contract trades, trades on phone or desktop, wants to "try Up/Down" but has blown a small testnet bag by re-entering after losses.
Not: pro market-makers, full-time quants, vault allocators.

## Problem
In one sentence: **Short-window binaries feel fun but cause rapid, undisciplined loss because the UI never shows true odds, affordable size, time left, or that you're tilting.**
Evidence: P4 tilt 4/5, P5 skill vs luck 4/5, P6 redemption 5/5, P8 expiry safety 5/5 (11-user-problems). Reviews: liquidity thin, fee opacity, no guardrails.

## Evidence
- Protocol gotchas #1, #8, #9, #10 directly prove expiry, redemption, and status pain (VERIFIED docs).
- Kalshi reviews: "low liquidity niche", "fee opacity" (STRONGLY SUPPORTED).
- PredictArena's own data: 377 wallets, but only 197 ranked (≥5 settled) — most never get to honest sample; many churn early.
- Sluice, Keel, Branch each solve one slice (sizing, redeem, path) — none solves behavioral loop.

## Existing alternatives
- DreamDEX app: shows price but not plain "pay X to win Y", no Brier, no cooldown, hides redemption.
- Sluice: downside-capped sizing via live book, but no scoring/tilt.
- PredictArena: Brier/Edge league, but needs DB/indexer host, heavy, not a shell you trade in.
- Telegram bots: automate, which worsens tilt for humans.
- Keel/Branch: redeem/roll or path, but narrow.

## Why existing alternatives insufficient
They optimize for speed or automation; none makes you slower. None surfaces settlement trust or lost winnings as primary desk. None enforces pause after consecutive losses using your own chain history.

## Product
**Steady** — One terminal, four panes:
1. **Live windows** — BTC/ETH 15m/1h only, filtered to Trading status (on-chain), >300s headroom, venue-scoped, sorted closingSoon. Shows time left countdown, spread, depth at touch.
2. **Honest ticket** — One input: "Max loss (tUSDC)". System reads book + tick/lot + wallet balance → shows "Pay X → win Y (if UP), max loss X, expires in M, spread S". Single IOC button (expiry = min(marketExpiry-10s, now+300s), tick-snapped).
3. **Score strip** — Brier (0=perfect, 0.25= guessing) + Edge (winRate - avg price) over last 20 settled, computed pure from fills + getMarketResolution. Gauge: Steady / Drifting / Tilting.
4. **Positions & Inbox** — Live/settling/claimable/won/lost/void via on-chain + portfolio, fills archive, Redeem all (Finalized scan + 6909 balances + explicit outcomeIdx + void 0.5).
5. **Tilt guard** — After 2 consecutive losses (from last 20), disable trade for 3 min + require second confirm with checkbox "I see my Brier is X".

Plain language, mobile-first, no AI, no token.

## Why DreamDEX Event Contracts are load-bearing
- **Foundational:** Without EC's fixed windows, fixed payout, capped risk, Up/Down shared book, ERC6909, Finalized redemption, and oracle settlement, the product has no value. Every capability uses EC-specific surface:
  - discovery: listLiveBinaryMarkets + getMarketOnchain + venue filter
  - execution: getBinaryOrderBook + getBinaryBookParams (tick/lot) + trader.placeOrder IOC + nanosecond expiry
  - positions: getOutcomeBalance + getUserFills + getMarketResolution
  - settlement trust: oracleQuestionId → graph link
  - redemption: listPastBinaryMarkets Finalized + claimableFrom/ redeem
  - scoring: pnlEventsFor/computePositionPnL helpers or manual
- Replacement test: If EC disappeared, Steady collapses (no windows, no Brier, no redeem).

## Competitive differentiation
- Only product that deliberately slows trading (memorable vs 1M tps narrative).
- Only consumer shell that combines capped sizing + Brier/Edge + cooldown + redemption inbox in one place (Sluice has 1 of 4, PredictArena has 1 of 4).
- Technical moat for hackathon: correct handling of all 13 gotchas visible in UI (headroom badge, on-chain re-read, tick/lot snap, void enum, pool-id keying) — many teams will miss at least 2.

## Why another team cannot trivially copy in 7 days
- PredictArena would need to strip DB/indexer and add transaction signing + tilt guard — direction reversal.
- Sluice would need to add Brier engine + redemption scanning + history join — 3 new data paths.
- AI bot teams are locked into Groq/provider flow, not discipline UX.
- Vault/Keel teams are in different stacks.
- Our thin wedge looks copyable, but correct end-to-end (approval quantity not escrow, unfillable selector, nanosecond expiry, Finalized vs loadMarkets) is easy to get subtly wrong — tests pin it.

## Hackathon scoring thesis
- Innovation 7/10: "slow trading" is contrarian, not AI.
- Technical 8/10: real on-chain gating, tick/lot, Finalized scan, ERC6909, oracle graph.
- UX 8/10: one input, one sentence ticket, countdown, Brier gauge, redeem inbox.
- Business 6/10: reduces per-session volume but increases retention and redeem rate (argue LTV > churn).
- Demo 8/10: live discovery → honest ticket → fill → Brier drift → cooldown → redeem — all in 2:30 with real tx hash.

Risk-adjusted 6.7/10 highest in scorecard.

## Business/ecosystem thesis
- Top of funnel: lower fear for first-timers (max loss explicit + paper-like Brier before confidence).
- Retention: tilt guard prevents blowup → more sessions.
- Trading activity: quality over quantity; redeem inbox recovers forgotten volume.
- Ecosystem: showcase of correct SDK usage (feedback report) + settlement trust deep-links.

## Technical feasibility
- No custom contracts, no indexer host, no AI provider, no Supabase. Only SDK + RPC + viem. Hardest piece (live discovery) is SDK-provided. Brier is pure function. Tilt is localStorage + history fetch. All buildable in 5–6 days, 1 day buffer.

## Key risks & mitigations (see 21-risks)
- Empty book at demo → show unfillable state with "next window in Xm" fallback.
- Indexer lag → on-chain re-read badge + stale warning.
- New user no history → show "—" for Brier, explain need 5 settled, demo with seeded history.

## Why NOW, Why THIS hackathon
- Event Contracts just opened to everyone (cryptogames Aug 18) — window to set UX standard before habits harden.
- $5k prize is small but builder mindshare is first-mover (Prediction News framing vs Gate $3M) — a disciplines product sets a responsible narrative early.

## Why THIS product
- Survives truth test: solves 4 top pains (P3,P5,P6,P8) with E/D necessity, GREEN underexplored, lowest execution risk, highest demoability, and a story judges will remember ("the one that makes you slower").

## MVP
See 19-mvp-spec.md — MUST: live discovery filtered, honest ticket with capped sizing, IOC with guards, positions+redeem, Brier/Edge strip, 2-loss cooldown.

## Explicit non-goals (DO NOT BUILD)
- No AI forecaster/advisor, no leaderboard ranking, no vault/pooling, no custom token, no perpetuals, no multi-chain, no Telegram bot, no market creation.

## Confidence
- Research confidence: Medium-High (7/10). Top unknown: will judges penalize friction? Mitigated by toggle + retention argument.
- Product confidence: High for MVP delivery.

