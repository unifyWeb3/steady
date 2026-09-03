# 17 — Opportunity Scorecard

Scored 0–10.

## Raw opportunity factors (weighted)

Weighting: Problem 12%, Evidence 8%, Necessity 12%, Innovation 10%, Diff 10%, Adoption 8%, Trading 8%, Ecosystem 8%, Feasibility 10%, Demo 6%, Continuity 6%, Risk penalty -10%

| # | Candidate | Prob | Evid | Nec | Innov | Diff | Adopt | Trade | Eco | Feas | Demo | Cont | Risk | RAW* | Risk-adj |
|---|-----------|------|------|-----|-------|------|-------|-------|-----|------|------|------|------|------|----------|
| A | Sluice clone (capped sizing) | 7 | 7 | 9 | 4 | 3 | 6 | 6 | 6 | 8 | 7 | 5 | 3 | 5.9 | 5.3 |
| B | PredictArena clone (league) | 8 | 8 | 9 | 4 | 2 | 7 | 7 | 7 | 4 | 7 | 6 | 4 | 5.8 | 4.9 |
| C | Telegram Groq bot | 6 | 6 | 7 | 3 | 3 | 6 | 6 | 5 | 5 | 6 | 4 | 4 | 5.1 | 4.3 |
| D | Vault ERC4626 | 6 | 5 | 8 | 7 | 6 | 4 | 7 | 7 | 3 | 6 | 7 | 5 | 5.6 | 4.4 |
| E | Keel clone (redeem+roll) | 6 | 7 | 9 | 5 | 4 | 5 | 4 | 5 | 9 | 6 | 5 | 2 | 6.0 | 5.6 |
| F | Branch clone (path) | 6 | 6 | 8 | 7 | 6 | 4 | 5 | 6 | 6 | 6 | 5 | 3 | 5.9 | 5.3 |
| **G** | **Steady (discipline + capped + redeem + Brier)** | **8** | **7** | **9** | **7** | **7** | **6** | **6** | **7** | **8** | **8** | **6** | **2** | **7.1** | **6.7** |
| H | Paper calibration prop | 8 | 6 | 7 | 7 | 7 | 7 | 4 | 7 | 5 | 7 | 7 | 4 | 6.3 | 5.5 |
| I | Oracle lens + inbox (utility) | 6 | 5 | 9 | 6 | 6 | 4 | 3 | 5 | 9 | 5 | 4 | 2 | 5.7 | 5.3 |

*RAW = weighted sum before risk penalty (for illustration). Risk penalty = Risk(1-5)/5 *10% deduction.

## Judging score (5-factor) estimate

| # | Innov 20 | Tech 25 | UX 20 | Biz 20 | Demo 15 | Total |
|---|----------|---------|-------|--------|---------|-------|
| G Steady | 7 | 8 | 8 | 6 | 8 | 7.3 |
| H Paper | 7 | 6 | 7 | 7 | 7 | 6.8 |
| E Keel | 5 | 7 | 6 | 5 | 6 | 5.9 |
| B League clone | 4 | 7 | 7 | 7 | 7 | 6.4 |

**Top risk-adjusted is G Steady.** Runner-up H Paper is heavier to build (virtual fill engine + DB) and lower Tech demoability (paper vs real tx). We select G.

Confidence: Medium-High (evidence for pains 4-6 is 4-5/5, but tilt adoption is inference).
