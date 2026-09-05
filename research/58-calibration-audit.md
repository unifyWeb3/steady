# 58 — Calibration Audit (scientific honesty)

- Minimum sample: n≥5 settled non-void fills before Brier/Edge display; below → "Need 5 settled" + current n. No metric shown early. PASS.
- Brier: mean((price−outcome)²) over settled fills, 0 perfect / 0.25 guessing baseline labeled on the bar. Unit-verified (perfect→0, coin-flip→0.25).
- Edge: winRate − avgPrice, signed with +/−, labeled "Positive = you beat the price." Unit-verified (+0.20 case).
- Voids excluded from both (neither skill nor failure). Correct.
- Live record (1W/1L, n=2): UI honestly shows insufficient — cooldown cannot fire live pre-submit (needs 2 trailing losses). Cooldown state machine unit-verified (4/4) incl. expiry→allow + storage restore.
- No overclaim: labels say "calibration," never "skill score" or "alpha." Precision capped at 3 decimals; no confidence intervals advertised (unlike Rivo rumor — we refuse intervals we can't defend).
- If still n<5 at demo: show the honest empty state on camera + explain with the unit test — never seed fills.
