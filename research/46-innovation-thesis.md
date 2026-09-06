# 46 — Innovation Thesis

## The one thing judges should remember
**Steady is the only DreamDEX terminal that makes you slower — and proves why.**

## The novel insight
Short-window binary markets (1m–1h) on a 10ms chain maximize *execution speed* while leaving *decision quality* at zero. Every competitor accelerates the click (arcade, agent, bot, one-tap). Steady is the first to package **accountability as the product**: the downside is computed before entry, policy decides at the boundary (not as a tooltip), the fill is reconciled against the quote, and repeated losses physically block execution.

## What Steady enables that a normal terminal doesn't
1. **Pre-commitment:** max-loss input → lot-snapped quantity before any signature. Normal terminals ask amount; Steady asks affordable loss.
2. **Enforced calibration:** Brier/Edge over real settled fills gates future trades (2-loss cooldown). Normal UIs show PnL; Steady converts history into *permission*.
3. **Quoted-vs-actual honesty:** taker pays fill, not quote (proven 0.049→0.021 live). No competitor surfaces this; all imply quote = fill.
4. **UNKNOWN-first reliability:** timed-out submissions reconcile via receipt poll instead of claiming failure — a financial-systems pattern, not a hackathon pattern.

## Why it must exist (problem, not feature)
15m windows + near-coin-flip short-horizon crypto + zero-fee instant execution = maximal tilt surface. Churn (blown bags → quit) hurts DreamDEX retention more than any single trade helps volume. Steady is retention infrastructure disguised as a terminal.

## Smallest strengthening (no novelty theatre)
Package the trade receipt as a shareable proof card (text + explorer link, from Tock lesson). Zero new protocol work; makes the invisible (policy + fill honesty) visible in 5 seconds.
