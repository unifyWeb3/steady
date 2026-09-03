# 12 — Opportunity Map

For each promising problem, map existing solution + DreamDEX relevance (A decorative → E impossible without EC).

| Problem | Existing solution | Price | Why insufficient | DreamDEX relevance | Rating |
|---------|-------------------|-------|------------------|--------------------|--------|
| P1 Discovery with tradability rank | DreamDEX app market list + kit listLiveBinaryMarkets | Free | No liquidity/headroom scoring | C important (live book) | C |
| P2 Odds comprehension | DreamDEX ticket shows 0.54 Up | Free | Jargon, no plain "pay X to win Y" | C | C |
| P3 Loss-capped sizing | Sluice, spreadsheets | Free | Sluice is only policy engine | D foundational (book depth + lot + balance) | D |
| P4 Tilt/ cooldown | None (manual) | — | No guardrail in any EC product | C/D (needs fills + resolution history) | C |
| P5 Skill vs luck (Brier/Edge) | PredictArena league | Free | League not shell-integrated, heavy infra | D (needs fills + resolutions) | D |
| P6 Redemption inbox | Keel journal, manual scan | Free | Journal misses chain balances, loadMarkets hides | E impossible without EC (Finalized scan + 6909) | E |
| P7 Settlement audit | Oracle explorer deep-link | Free | Not surfaced in any product | D (needs questionId graph) | D |
| P8 Expiry-safe execution | Gotcha guards in kit | — | Kit guards not in consumer UX | E (status gating, expiryNs, tick) | E |

Only D/E survive per rejection rules (plus strong C). Survivors: P3, P5, P6, P7, P8. We combine them into one shell: **Steady** handles P3+P5+P6+P8 with P4 wedge.
