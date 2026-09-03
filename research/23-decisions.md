# 23 — Decisions

## D001 — Select Steady as product
- Date: 2026-09-01
- Decision: Build discipline-first terminal (capped ticket + Brier/Edge + cooldown + redeem) as described in 18.
- Why: Highest risk-adjusted score (6.7), spans 3 GREEN wedges, load-bearing, feasible in 7 days.
- Evidence: Scorecard 17, saturation 13, gotchas 04.
- Alternatives: Paper calibration (heavier), oracle lens utility (thinner), league clone (red ocean).
- Rejected: AI bot (RED), vault (needs audit), social league (needs DB host).
- Confidence: Medium-High (7/10).

## D002 — Pin SDK to 0.29.0
- Date: 2026-09-01
- Why: Fixes tick (0.28) and revert decoding (0.23) and lot (0.24). Verified local.
- Alternatives: 0.28.1 (also ok), but 0.29 latest.
- Rejected: <0.28 (InvalidPrice on 12/15 floats).

## D003 — Shannon testnet only for MVP
- Date: 2026-09-01
- Why: Submission requires testnet prototype; mainnet is 18dp vs 6dp scale trap.
- Enforcement: Runtime reject chainId 5031 until mainnet toggle.

## D004 — No custom contracts
- Date: 2026-09-01
- Why: Vault needs audit + time; risk of pooled custody.
- Consequence: Stay pure SDK consumer.

## D005 — No AI, no leaderboard
- Date: 2026-09-01
- Why: Saturated, adds model risk, time cost, against "earn right to select product" (not add AI because brief says AI).
- Confidence: High.

## D006 — Research structure as defined in prompt
- Date: 2026-09-01
- Why: Required for audit trail; produce 00-23 + SOURCES + LOG.

