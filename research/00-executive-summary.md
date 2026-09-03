# 00 — Executive Summary

**Date:** 2026-09-01  
**Deadline:** 2026-09-08 18:00 (7 days)  
**Package:** Somnia Shannon 50312, DreamDEX Event Contracts, SDK 0.29.0

## What did we learn?
- Event Contracts today are narrow: **BTC/ETH Up/Down only, 15m and 1h windows**, rolling, zero fees, on-chain CLOB. No arbitrary market creation for builders — consume only.
- Technical surface is well-documented but riddled with gotchas: on-chain status gating, tick/lot grids, pool recycling, hidden settlement (Finalized not in loadMarkets), price quantization pre-0.28 fails 12 of 15 floats.
- DreamDEX wants to be **liquidity/execution layer**, not consumer app. It leaves discovery, risk, education, social trust unsolved.
- Somnia is high-perf EVM (50312 testnet) with reactivity (oracle callback on settlement), but testnet infra (indexer, WS) lags seconds.
- Competition is already dense for obvious wedges: 7 public repos cover AI bot (Telegram+Groq), social league (PredictArena, 377 wallets scored), downside-capped execution (Sluice), conditional paths (Branch), redeem/roll (Keel), pooled vault (Vault). DoraHacks BUIDL list is broken (shows 0), but external scan finds them.

## What is DreamDEX actually good at?
- Single on-chain order book with mint-a-pair (two opposite buyers mint Up+Down without seller) — cold-start liquidity.
- Cheap, deterministic settlement via Oracle Hub reactivity (no keeper), plus permissionless voidExpired backstop.
- Fully collateralized, capped risk (max loss = stake), redeemable ERC6909 positions.
- Real-time book via SDK realtime tail (no polling), scope by marketId not pool.

## What are builders already building?
- AI signal agents, Telegram trading, copy/social, analytics dashboards, vaults. All chase "faster, smarter, more automated".

## What is saturated? (RED)
- AI trader / signal bot — 3+ projects + 6 ec-* kit strategies
- Telegram trading bot — iamsuperfly covers
- Social feed / leaderboard — PredictArena dominates with 8k LOC + Brier

## What is underexplored? (GREEN)
- **Discipline / tilt protection** — no one builds the brake
- **Onboarding / paper calibration** — no zero-risk practice that proves edge before real funds
- **Settlement trust / oracle audit** — docs say "worth surfacing", no product does
- **Redemption inbox** — gotcha #10 is known, only Keel partially solves via local journal

## Strongest 3 opportunities
1. **Steady: Discipline-First Terminal** — risk-capped ticket + Brier/Edge scoring + cooldown when tilting. (Chosen)
2. **Calibration Desk (Paper + Graduate)** — virtual fills until proven edge, prop-firm style. (Runner-up, heavier)
3. **Oracle Lens + Redemption Inbox** — auto-discover claimables + verify settlement graph. (Utility, thinner)

## Why others rejected? (see 17/18)
- Social league requires DB/indexer host we don't have time for.
- AI bot is commoditized and needs model risk we can't hedge.
- Vault needs audited Solidity + pooled custody.
- Pure analytics is thin for Demo.

## What did we choose?
**Steady — A risk-first trading shell for BTC/ETH 15m/1h windows: state max loss → see true odds/payout/expiry → IOC with safety guards → track Brier/Edge → cooldown on tilt → one-click redeem with void handling.**

Why now: 15m windows + 10ms chain speed maximally enable overtrading; short-horizon crypto is near coin-flip, so skill measurement + brakes are durable value.

Why DreamDEX: Every step is load-bearing on Event Contracts lifecycle (status gating, book params, mint-a-pair awareness, recycled pools, Finalized scan, ERC6909).

Why users care: They lose from chasing, not from wrong direction once. Steady makes loss explicit before entry and pause explicit after loss.

Why DreamDEX/Somnia care: Increases repeat *quality* trades and retention, reduces churn from blowups, surfaces settlement trust, drives redeem volume (currently forgotten).

## MVP
- Next.js + viem + markets-sdk 0.29.0 + wagmi
- Wallet connect, live discovery (filtered >300s headroom, venue-scoped, on-chain gated)
- Single ticket: asset/ window selector, max-loss input (≈ tUSDC), live book-derived contract count, ticket line "Pay X to win Y | Max loss X | Expires in M | Spread S"
- IOC order with nanosecond expiry = min(market.expiry-10, now+300s), tick/lot snapped
- Positions workspace: live/settling/claimable/won/lost/void via on-chain + indexer, fills archive
- Score strip: Brier + Edge over last 20 settled (pure function, from fills + getMarketResolution)
- Tilt guard: 2 consecutive losses → 3-min cooldown + second confirm
- Redeem all: scan Finalized, check outcome balances, redeem with explicit outcomeIdx

## What could kill thesis?
- Testnet liquidity empty at demo time (mitigate: pre-seed fills recording, fallback to show empty-book state)
- Indexer lag breaks discovery (mitigate: on-chain re-read + stale badge)
- Users reject friction (mitigate: toggle "steady mode" off, but default on)

## Next step
Implement research/19-mvp-spec.md spec, validate SDK live connectivity, then build.
