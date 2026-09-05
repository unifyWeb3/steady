# 51 — Final Competitive Scan (2026-09-05, 3 days left, 27 BUIDLs / 345 hackers)

## Tock (PhiBao/tock) — STRONGEST DIRECT THREAT
- Thesis: 15-min arcade, one-tap UP/DOWN, Ride auto-roll parlays, AI-agent delegation + MCP endpoint, streaks + shareable win cards.
- Live: `tock-delta.vercel.app` (+/proof, +/mcp), 18 commits, CI, FEEDBACK.md, Next.js 15, SDK 0.28.1, real IOC, faucet onboarding, Finalized redeem scan, oracle audit links.
- Judge appeal: HIGHE — deployed, fast demo (2 taps), viral share cards, agent/MCP checks the AI box, /proof preempts mock accusations.
- Weaknesses: streaks reward luck as skill (no calibration); Ride parlays multiply impulsive volume (anti-discipline); no max-loss framing, no policy gate, no quoted-vs-actual honesty, no cooldown.
- Steady better: risk-first ticket, execution-boundary policy, fill reconciliation, tilt cooldown, UNKNOWN handling.
- Steady worse: no deployment yet, no shareable artifact, no agent surface, slower demo setup.
- Likely score: 78-84.

## PredicTrader AI (binasalama12) — AI + copy-trading + audit
- Live: `predictrader-ai-phi.vercel.app`, 3-model ensemble, copy-trading with fill proof, settlement audit, DRY_RUN bot.
- Threat: MEDIUM-HIGH. Ensemble + copy-trading + audit is a lot of surface; risk: AI accuracy claims collapse under skeptical questions ("walk-forward Sharpe?").
- Steady better: honesty (no accuracy claims), policy, discipline. Worse: no AI story, no social loop.

## Market Dungeon (CryptoMickle) — gamified roguelite, HAS VIDEO (2:34) + live demo + mainnet
- Thesis: BTC 15m EC as dungeon survival gate, sealed replay with AES commitment, read-only contest build.
- Threat: MEDIUM. Only competitor with a submitted video; game is memorable; but DreamDEX is settlement-oracle for a game, not load-bearing trading — judges may score Technical lower. Read-only = zero trading activity (hurts Business 20%).
- Learn: video exists → we are behind on Presentation. Do NOT copy game skin.

## Somnia-DreamDEX-Agent (Ishant5436) — volatility agent + custom router (verified 0x589fE…c4cE5)
- Threat: MEDIUM. Custom contract looks deep but routes around the venue CLOB (weaker DreamDEX-dependence); autonomy without user control.
- dreamdesk (icohangar-ops) multi-agent desk, Pryzm 7-agent swarm, iamsuperfly Telegram bot, somnia-sigma odds layer: all LOW-MEDIUM, red-ocean automation/analytics.

## Rivo — UNVERIFIED (not found on GitHub/DoraHacks/X this pass). Treat as rumor. If real, calibration overlap is dashboard-level, not execution-enforced.

## Why a judge picks Steady over Tock/PredicTrader/Dungeon
Tock wins fun, PredicTrader wins AI surface, Dungeon wins memorability — **Steady is the only one that makes trading safer while proving it**: max-loss-first ticket, policy codes at the boundary, quoted-vs-actual receipts, losses that block execution, UNKNOWN reconciliation. Against "arcade vs discipline," our 30-second line: "Tock makes the click faster; Steady makes the decision accountable — and every claim links to a mined hash."
