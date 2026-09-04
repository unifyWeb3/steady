# 39 — Visual Review (browser evidence, not source inspection)

**Date:** 2026-09-04
**Method:** Playwright chromium, real render of `app/` via localhost:5173. Screenshots in `test-results/qa-*.png`.
**Standard:** design.md §26 slop test + research/30 nine gates.

## Round 1 — reconstruction review

### 1. Homepage hero — 1280 (`qa-home-1280-top.png`)
- Works: Newsreader display "Know the downside before you enter.", mono eyebrow, honest-ticket preview panel with 28px risk number, proof strip with real tx hashes (0xed05c…72464c, 0x3aa5ec…77444), warm paper rgb(252,250,247), ink primary CTA.
- Wrong: nothing structural.
- Generic: no — editorial + instrument, not SaaS.
- Status: PASS.

### 2. Homepage — 390 (`qa-home-390-full.png`, `qa-home-390-steps.png`)
- Works: single column, hero → preview → proof → problem → control loop → discipline → verification → CTA. Overflow 0px.
- Wrong (found): control-loop steps rendered 2-column at 390 (cramped ~170px cards) — inline `<style>` 1-col rule was lost in rewrite; proof-strip hashes wrapped mid-token awkwardly.
- Fixed: `.steps 1fr` under 600px in style.css; `.proof-strip .kv` overflow-wrap + min-width 0. Re-shot `qa-home-390-steps.png`: 1-col readable. Overflow 0.
- Status: PASS after fix.

### 3. Terminal discovery + ticket — 1280 live (`qa-terminal-1280-rows.png` → `qa-ticket-live.png`)
- Works: ink rail, 4 live Trading rows (BTC/ETH 15m/1h, bid/ask, spread, countdowns), selected-row signal inset, success status bar, ticket risk hero 25.00 tUSDC with live preview (25.00 → 26.04 @ 0.960 from real book 0.918/0.940 + crossing), verb-forward buttons "Buy UP — 25.00", policy PASS line.
- Wrong (found): (a) header rail wrapped at 1280 — brand stacked, "Positions" clipped to "Pos"; (b) ticket "CAPPED BY" key wrapped to two lines; (c) market IDs all read "0x00000000…" (sequential IDs, first-10 useless).
- Fixed: (a) `.brand` nowrap + `.brand-cluster` + caption hidden <1280 — re-shot `qa-header-1280.png`, all 5 nav items visible; (b) `.ticket-row .k` nowrap + flex none; (c) `mktShort()` shows last-6 (`…0136e3`) in discovery, ticket, positions, receipt, settlement.
- Status: PASS after fix.

### 4. Cooldown — 1280 (`qa-terminal-1280-cooldown.png`, DOM-forced panel; logic unit-tested in discipline.test.mjs)
- Works: ink-solid panel, "Cooldown active / 02:31", "2 consecutive losses. Trading resumes in 02:31.", both Buy buttons disabled + washed out.
- Wrong: nothing. Distinguishes current state (panel) from execution result (receipt "Policy blocked: COOLDOWN" path in code).
- Status: PASS (visual). Live trigger needs 2 settled losses — not yet available on test wallet.

### 5. Terminal — 390 (`qa-terminal-390-full.png`)
- Works: rail stacks (brand → wallet → scrollable nav), ticket full-width with 52px Buy buttons, calibration stacked, settlement stacked. Overflow 0px.
- Wrong (found): empty-state table cells rendered title/body side-by-side — mobile `td{display:flex}` applied to `.empty` td children.
- Fixed: `td.empty{display:grid}` + `::before{content:none}` in 768 query.
- Status: PASS after fix (fix verified by rule inspection + overflow 0; empty-state re-shot pending next live-empty window).

### 6. Empty state honesty — observed live
- At first screenshot pass the indexer had no >60s windows: terminal showed "No live windows with headroom — next window in ~1m, retrying automatically" + status bar, shell usable. Later pass with 4 live windows rendered rows. Both paths browser-proven.
- Status: PASS.

## Slop check (all screens)
No purple gradient, no glass, no bento, no neon, no glow CTAs, no emoji, no AI sparkles, no testimonial carousel, no fake metrics. Typography: Newsreader display, JetBrains Mono data, Inter body — all rendered. Radius 8/4/6, 1px borders, spacing on-scale. PASS.

## Remaining (not visual defects)
- Positions with real fills + claimable/redeem visuals need a connected wallet with fills (manual MetaMask) or Finalized markets — code path unchanged from verified shell.
- Receipt "View proof" expansion visual needs a real submission — structure reviewed in code, browser-pending.
- Narrow-viewport empty-state re-shot deferred to next live-empty window.
