# 44 — Competitive Delta (fresh scan 2026-09-05)

**Field:** 16 BUIDLs (was 13), 314 hackers. Deadline Sep 8 18:00.

## Verified competitors

### Tock (PhiBao/tock) — arcade consumer
- URL: `github.com/PhiBao/tock`. Thesis: 15-min arcade for BTC/ETH direction, zero fees, self-custody, **streaks, shareable win cards**.
- User: casual degen. EC dependency: foundational (real SDK, real IOC claimed).
- Differentiation vs Steady: gamification + social sharing (dopamine). Steady is the inverse (discipline, brakes).
- Weakness: streaks without calibration reward luck; no risk framing visible.
- Likely judge score: 70-75. Threat: HIGH on UX/fun, LOW on technical depth.
- Learn: share cards are cheap judge-legible virality. Do NOT copy: streak-as-skill.

### Somnia-DreamDEX-Agent (Ishant5436) — volatility agent + custom router
- URL: `dorahacks.io/buidl/48231` + github. Thesis: Parkinson volatility-gated autonomous agent + `DreamDEXRouter.sol` (verified `0x589fE…c4cE5`).
- EC dependency: partial — routes through **custom pari-mutuel contract**, not the DreamDEX CLOB directly. Risk: judges may question "meaningful use of DreamDEX" if settlement bypasses the venue.
- Threat: MEDIUM. Strong technical theater (custom contract + verified address), but autonomy without user control scores weakly on UX; "100% passing in <0.05s" tests are unit-only.
- Learn: verified on-chain artifact impresses. Do NOT copy: autonomy without accountability.

### Pryzm (Marvy247) — 7-agent AI swarm
- Thesis: swarm of 7 specialized AI agents every 5 min on DreamDEX EC.
- Threat: LOW-MEDIUM. Agent swarms are red-ocean (brief explicitly lists them); 5-min cadence on 1m/5m windows risks overtrading demo; no evidence of discipline/risk layer.
- Learn: nothing structural. Do NOT copy: agent count as innovation.

### iamsuperfly/event-contracts-hackathon — Telegram bot
- Thesis: Up/Down trading via Telegram. Threat: LOW (thin client, no discipline).
- somnia-sigma — fair-value/odds layer. Thesis: "One line to beat." Threat: MEDIUM on analytics; complements rather than competes (no execution/discipline).

### Rivo (probability calibration, walk-forward validation, MCP)
- Status: **UNVERIFIED** — not found in GitHub/DoraHacks/search this pass. Treat supplied notes as rumor, not fact.
- If real: calibration + walk-forward overlaps Steady's Brier/Edge dimension. Our defense: Brier is *enforced at execution* (cooldown blocks), not displayed as dashboard. Do not build MCP to chase it.

## Delta: real gaps in Steady exposed by this scan?
1. **Shareable proof card (from Tock):** judges love one viral artifact. Steady already has trade receipts with hashes — packaging one as a share card is LOW-RISK, HIGH-legibility. Adopt as receipt export (text + link), not as streak gamification.
2. **Verified on-chain artifact (from Agent):** we have 4+ mined txs but no single "systems" artifact. Our equivalent: the policy-gated execution boundary + forensics table in README. No custom contract needed.
3. **Nothing else transfers.** No competitor does: max-loss-first ticket, execution-boundary policy, quoted-vs-actual honesty, tilt cooldown from real outcomes, UNKNOWN reconciliation.

## Differentiation test (assume strong team clones "discipline terminal" in 1 day)
- Reproducible in 1 day: warm-paper styling, max-loss input, cooldown timer UI.
- Takes substantially longer: tick/lot/expiry nanos correctness, Finalized-scan redemption, ERC-6909 balance proof, fill-vs-quote reconciliation, indexer-lag-tolerant state machine — all live-proven here over 4 days of testnet forensics.
- Proprietary: nothing (open source) — moat is **evidence density** (4 mined txs, failure taxonomy, harness), not secrecy.
- Judge notices in 30s: "Pay X → win Y, max loss Z" as the largest number + policy PASS/DENIED with code + explorer-linked receipt.
