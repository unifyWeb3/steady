# 49 — Gimmick Audit (KEEP / MODIFY / REMOVE)

## KEEP (strengthens DECISION / CONTROL / EXECUTION / PROOF)
- Honest ticket (max-loss-first, tick/lot-snapped, side-aware) — the product.
- Policy gate with codes (Trading/headroom/liquidity/spread/balance/cooldown) at execution boundary.
- Trade receipt with quoted-vs-actual + explorer links.
- Tilt cooldown from real outcomes + Brier/Edge with honest <5 state.
- UNKNOWN reconciliation + SUBMITTING guard.
- Timeout/error/empty states with Retry; decoupled shell.
- Oracle graph links; Finalized-scan redemption.
- Warm paper/ink/cyan system; Newsreader+Mono; tabular numbers.

## MODIFY (keep, sharpen)
- Homepage preview block ("Live terminal preview"): currently static numbers (22.40→40.00) — label clearly as *illustrative math example*, or better, render last proven trade (0xed05c… quoted 0.049→fill 0.021). → Change caption to "Illustrative example" + link real tx. (P1, 5 min)
- Position tabs (7 tabs): WON/LOST/VOID derivations still placeholder (expiry-based, not outcome-based). → Either wire outcome-based mapping or collapse to All/Live/Claimable/History. (P1)
- Score "last5" dots: depend on ≥5 resolved; fine, but label source ("from settled fills"). (P2)

## REMOVE
- `previewCapped` empty div + `scoreDetail` dead refs (commented out in reconstruction): remove elements or wire them; dead DOM is slop. (P1, trivial)
- `console.log("loadSdk started"/"imports done")` debug logs in production path: gate behind `localStorage steady:debug` or remove. (P1, trivial)
- Video `trace: on-first-retry` + retained webm artifacts in test-results/: keep out of repo (already untracked; ensure never committed). (P0 hygiene — done)
- Any "MEDIUM-granularity" marketing adjectives on homepage ("production-grade" etc.): verify each claim has evidence or cut. Homepage currently clean — keep sweeping.

## Verdict
No gamification, no token, no AI, no leaderboard, no fake metrics found. The product is gimmick-clean; remaining items are dead-code hygiene, not scope cuts.
