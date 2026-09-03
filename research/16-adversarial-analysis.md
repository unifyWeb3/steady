# 16 — Adversarial Analysis

## Why this idea (Steady discipline terminal) sucks — 10 weaknesses
1. Adds friction to trading; users seeking speed will toggle it off or leave for DreamDEX app.
2. Cooldown reduces short-term volume — judges may see as anti-business (20% criterion).
3. Brier/Edge needs ≥5 settled calls to be meaningful — first-time user sees dash, not value, during demo.
4. Short-horizon crypto is near coin-flip (PredictArena notes) — Edge may be ~0 for everyone, making tilt guard look useless.
5. Requires historical fetch (fills + resolutions) — if user is new, no history, tilt guard can't trigger.
6. Settlement audit graph is niche; retail may not care about oracle median.
7. Redemption inbox is utility, not excitement — hard to make visually memorable in video.
8. Capped sizing is already Sluice's thesis — perceived as clone unless narrative is distinct.
9. No AI — judges expecting "AI agent" may see as less innovative (though prompt biases toward product value over AI).
10. No token/points — may look less Web3-native than vault or league.

## Why users might ignore it — 5 reasons
1. They want degen speed, not discipline.
2. They don't understand Brier and won't read explanation.
3. They already use DreamDEX app and don't want second UI.
4. Testnet tokens have no value, so "max loss" feels fake.
5. Cooldown feels paternalistic.

## Why DreamDEX might not care — 5 reasons
1. They want more volume, not less.
2. They already plan first-party redeem UI, making ours redundant.
3. They want agent activity, not human discipline.
4. They might see discipline as off-brand for "endgame dex, 1m trades/sec".
5. Small hackathon prize not worth ecosystem slot if not viral.

## Why another team could beat us — 5 scenarios
1. PredictArena adds discipline toggle in one commit (they have scoring + DB + 354 tests).
2. Sluice adds Brier + cooldown and claims same.
3. A team with better designer ships same idea but more polished (our weakness if we underinvest in UX).
4. A pure AI team demos flashy autonomous trader that prints paper PnL and wows judges despite being non-credible.
5. Vault team ships on-chain vault with real yield and looks more "technical" (25% weight).

## What evidence would kill thesis?
- If DoraHacks shows 0 BUIDLs truly exist → saturated is overstated — but we already found 7 external repos, so not killed.
- If SDK 0.29 breaks listPastBinaryMarkets or getMarketResolution → redemption impossible — verified via recipes, but needs live test.
- If testnet has 0 live markets at demo time → discovery empty — need live check now.
- If Brier distribution on Shannon is random (Edge ~0 for top 20) → skill story weak — PredictArena data shows 197 ranked but not distribution; need to fetch.
- If DreamDEX closes Event Contracts after hackathon → no continuity — contrary to roadmap (event contracts "live" Q3).

We attempted to find killer evidence: no blocking API absence, no track confirming AI required, no pool address stability to exploit. Thesis survives.
