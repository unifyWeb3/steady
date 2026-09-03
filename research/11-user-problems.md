# 11 — User Problems

Evidence score 0–5.

| ID | Problem | Who/when/how often | Current behavior | Why sucks | Evidence | Score |
|----|---------|--------------------|------------------|-----------|----------|-------|
| P1 | Discover useful markets (which window to trade) | Retail every 15m | Scroll DreamDEX app, guess | No headroom/liquidity ranking, expiry surprise | Docs gotcha #9 + Sluice motivation | 3 |
| P2 | Understand odds (price=prob) | First-timers every trade | See 0.54, think $0.54 | Price is probability, payout is fixed — misread as price target | Gate FAQ + DreamDEX ticket | 3 |
| P3 | Size bet to affordable loss | Every trade | Stake arbitrary tUSDC | Lose more than intended, no max-loss mapping | Sluice thesis, Kalshi fee opacity | 4 |
| P4 | Avoid tilting / chasing losses | After 1-2 losses, frequent in 15m cadence | Re-enter immediately, martingale | Short windows enable rapid revenge trading, near coin-flip | General trading psych, PredictArena loss streak | 4 |
| P5 | Know if you're skillful or lucky | After 5+ trades | Look at PnL | PnL doesn't distinguish edge; Brier > luck | PredictArena thesis (197 ranked) | 4 |
| P6 | Redeem winnings (forgotten claim) | After settlement, often | Do nothing, leave tokens | Settled markets hidden from loadMarkets, no inbox | Gotcha #10 + recipes redemption, Keel motivation | 5 |
| P7 | Trust settlement (did oracle cheat?) | At settlement, occasional | Trust blindly or ignore | No surface of oracleQuestionId graph or median proof | Docs "worth surfacing" | 2 |
| P8 | Handle expiry/pool recycling without revert | At window close, every 15m | Submit order that reverts, pay gas | Indexer lag + pool reuse + expiry mandatory | Gotchas #1, #8, #12 | 5 |
| P9 | Manage approvals/lot correctly | First trade | Approve wrong amount, trade 0 contracts | Approval must cover quantity not escrow, lot floors to 0 | PredictArena approval.test.ts, gotcha #6 | 4 |
| P10 | Stay engaged without blowing up | Between sessions | Quit after blowup | No cooldown, no paper mode | Churn data inferred | 3 |

P4+P5+P6+P8 are strongest and DreamDEX-necessary.
