# design.md — Steady Frontend Design System (authoritative)

**Status:** AUTHORITATIVE for all frontend work. Supersedes ad-hoc styling. Consistent with `research/29-design-direction.md` + `research/37-brand-direction.md` (hybrid selected), extended to production-grade.
**Product:** Steady — discipline-first Event Contract terminal. "Know the downside before you enter."
**Stack:** static `app/` (no framework), `style.css` single system, `app.js` real SDK via esm.sh. No build step beyond `cp -r app/* dist/`.

---

## 1. Product personality

Steady is an **instrument, not an app**. Precision tool × aviation checklist × Swiss editorial.

- **Discipline:** friction before action. The ticket makes loss explicit; cooldown is a feature, not an error.
- **Clarity:** one decision at a time. Priority order is fixed: what can I trade → what will I lose → what could I receive → is it allowed → what happened before.
- **Precision:** tabular numbers, 1px rules, exact codes (`SPREAD_TOO_WIDE`, `COOLDOWN`, `ImmediateOrCancelNoFill`). No vague errors.
- **Control:** policy is at the execution boundary. Buttons disable with reasons, not tooltips.
- **Trust:** every claim has evidence. Quoted vs actual, tx hash, fill ID, oracle link, Finalized scan. No badge without proof.
- **Verification:** progressive disclosure. Default "Trade completed." → "View proof" reveals the full receipt.

Voice: plain, short, financial. "Pay 22.40 → win 40.00 if UP." "Market locked — switched to next window." Never hype, never "moon", never "AI-powered".

## 2. Visual principles

1. **Risk is typographically loudest.** Max loss is the largest mono number on the ticket (28px). Price is secondary (15px). Action comes after decision info.
2. **Hierarchy over containers.** Use rules, dividers, tables, open space. Every container must earn its border. No bento grid, no card-for-everything.
3. **Signal, not brand.** One accent (cyan) for *live* only. Direction uses teal/brick + text label, never color alone.
4. **Dense but breathable.** 48px table rows, 12px ticket gaps, 24/32 section rhythm. Scan in 3 seconds.
5. **Ink authority, paper calm.** Dark ink rail = precision. Warm paper workspace = readability. No glow, no gradient, no glass.
6. **State is product.** Loading, empty, error, cooldown, signing, UNKNOWN are designed surfaces, not toasts.

## 3. Color system

| Token | Value | Use |
|---|---|---|
| `--ink` | `#141210` | header rail, primary buttons, primary text, risk number |
| `--ink-2` | `#3A3632` | secondary text, captions |
| `--ink-3` | `#6B6560` | tertiary, void/neutral |
| `--paper` | `#FCFAF7` | body background |
| `--surface` | `#FFFFFF` | raised panels (ticket, receipt) |
| `--muted` | `#F2EFEA` | inset panels, preview, empty states |
| `--border` | `#E8E2D9` | 1px rules |
| `--border-2` | `#D6CFBF` | stronger rules, table headers |
| `--signal` | `#0899A6` (text-safe) / `#0ADBE5` (dot/glow only) | **live only**: selected market edge, live dot, explorer links. <5% surface. Text on paper uses `#06707A` for 4.5:1. |
| `--up` | `#0A7A5A` | UP direction + success border. Always paired with "UP"/"WON" text. |
| `--down` | `#9E2B25` | DOWN direction + loss. Always paired with text. |
| `--risk` | `#B9512A` | warnings, amber left border, spread-wide, headroom-low |
| `--focus` | `#141210` | 2px offset outline |

Contrast: ink on paper 15.2:1 AAA. `--ink-2` on paper 7.1:1 AA. Signal text uses darkened `#06707A` (4.6:1), never `#0ADBE5` as text.

**Never:** purple gradients, rainbow gradients, generic blue SaaS `#2563EB` buttons, neon glow, glassmorphism, dark-card-everything.

## 4. Typography

Three families, each with a job. Loaded via Google Fonts with system fallbacks (offline-safe).

- **Display / editorial:** `Newsreader`, serif, 400/600, `-0.03em`. Headlines, homepage hero, philosophy statements. Never for numbers.
- **Data:** `JetBrains Mono`, 400/600/700, `tabular-nums`, no ligatures. Prices, countdowns, hashes, book, ticket numbers, badges, receipts. Prevents shimmer.
- **UI body:** `Inter`, system fallback, 400/500/600. Body copy, labels, buttons, table cells (non-numeric).

### Type scale

| Token | Size / line / tracking | Use |
|---|---|---|
| Display | 56/0.95/-0.03 (40 mobile) | homepage hero only |
| H1 | 32/1.1/-0.02 (24 mobile) | section titles, terminal philosophy |
| H2 | 20/1.2/-0.01 | panel titles (Live windows, Honest ticket) |
| H3 | 15/1.35/0 | subheads |
| Body | 14/1.5/0 | prose |
| Small | 13/1.45/0 | table cells, ticket rows |
| Caption | 11/1.4/+0.08em uppercase | labels, eyebrows, metadata |
| Mono price | 18/1.2 tabular | book bid/ask |
| Mono hero (risk) | 28/1.1 tabular 700 | **max loss number — largest on ticket** |
| Mono small | 12/1.4 tabular | hashes, IDs, receipt rows |
| Mono badge | 11/+0.08em uppercase | badges, state pills |

## 5. Spacing scale

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. No other values (no 13px, no 10px gaps).

- Section rhythm: 32 desktop / 24 mobile between panels.
- Component internal: 12/16.
- Ticket rows: 12 gaps. Table rows: 48px tall, 12/16 padding.
- Page max: 1280px, gutters 24 desktop / 16 mobile.

## 6. Radius system

- `--radius-s: 4px` — badges, inputs, small pills, tabs underline is 2px not radius.
- `--radius-m: 8px` — panels, ticket, receipt, tables wrapper.
- Buttons: 6px (deliberate middle — neither pill nor sharp).
- **Never** 16/24/32px cards, never full-pill containers (except live dot).

## 7. Border system

- Default: `1px solid var(--border)`.
- Strong: `1px solid var(--border-2)` for table headers, selected rows.
- Selected market: `1px solid var(--border-2)` + `3px inset left var(--signal)` (not full glow).
- Error/warning: `3px left var(--risk)` on `.alert`, plus mono code.
- Focus: `2px solid var(--ink)` offset 2px. No blue glow.
- Dividers: `1px var(--border)`, no shadows except `0 1px 2px rgba(20,18,16,.05)` on sticky ticket.

## 8. Shadows

Essentially flat. One elevation only: sticky ticket `0 1px 2px rgba(20,18,16,.06)`. No card shadows, no glow shadows, no colored shadows.

## 9. Surface system

| Surface | Style | Use |
|---|---|---|
| Paper | bare `--paper`, no border | page background, open editorial blocks |
| Panel | `--surface` + 1px border + 8px | ticket, discovery table wrapper, positions |
| Inset | `--muted` + 1px border + 8px | preview, receipt, empty states |
| Rail | `--ink` solid, paper text | top header, cooldown-active bar, claimable CTA (ink button) |
| Rule block | no box, `border-top: 1px` | homepage editorial splits, audit rows |

Every container must have a reason: ticket (decision), table (scan), receipt (proof). If a box adds no hierarchy, remove it and use a rule.

## 10. Iconography

Lucide-style inline SVG or text glyphs only. 16px, stroke 1.5, ink color. No emoji anywhere.

Allowed: clock (expiry), lock (locked), triangle (warning), check (policy pass), arrow-up-right (explorer), dot (live pulse). Risk icons only where they disambiguate — never decorative. No sparkles, no rocket, no chart-junk icons.

## 11. Buttons

- Height 40px (32px dense in tables). Padding `0 16px`. Radius 6px. Weight 600, 14px.
- **Primary (ink):** `bg ink, text paper`. Label is verb-forward with consequence: "Buy UP — 22.40 max loss". Hover `#232019`. Active translateY(1px).
- **Secondary (outline):** `bg surface, 1px ink border`. "Buy DOWN", "Retry", "View tx →".
- **Danger/claim (ink solid):** CLAIMABLE redeem is ink solid + "Redeem" verb. Never muted.
- **Disabled:** `opacity .35, not-allowed` + **reason in title + adjacent text**. Cooldown disables both Buy buttons and shows `COOLDOWN ACTIVE — resumes in 02:31`.
- No gradients, no glow, no pill, no giant full-width hero button stacks.

## 12. Inputs

- Height 36px (ticket max-loss 44px for thumb). 1px border, 4px radius, JetBrains Mono, `--surface` bg.
- Focus: 2px ink outline offset 2px.
- Labels: 11px uppercase caption above input. Helper: 12px `--ink-2` below ("One lot = 1000 raw · Tick 1000 = 0.001").
- Number inputs: right-aligned mono. Error: amber left border on wrapper + mono code + sentence.

## 13. Tables

- Header: 11px uppercase `--ink-2`, 12/16 padding, bottom 1px `--border-2`.
- Rows: 48px, 13px, bottom 1px `--border`. Hover `--muted`. Selected: inset 3px signal + `--muted` bg.
- Numeric columns: JetBrains Mono tabular, right-aligned where comparable (bid/ask, spread).
- Countdown <2m: amber text + "locks in 43s" label. <60s: risk text + lock icon. Never color-only.
- Mobile: table → stacked rows (block layout, label/value pairs). No horizontal scroll.

## 14. Badges

Mono 11px uppercase, 4px radius, 1px border, `4px 8px` padding.

- `LIVE` — paper bg, signal dot (pulsing 2px) + "LIVE" text.
- `TRADING` — muted bg, ink text.
- `LOCKED/SETTLING` — muted + lock glyph.
- `CLAIMABLE` — **ink solid, paper text** (actionable, loudest in positions).
- `WON` — up teal border + "WON" text (not solid green).
- `LOST` — down brick border + "LOST" text.
- `VOID` — neutral dashed border + "VOID · 0.5" text.
- `REDEEMED` — muted strikethrough-ish, quiet (terminal state).
- `STALE` — dashed amber border + "STALE" (indexer behind).
- `UNKNOWN` — dashed ink border + "UNKNOWN — reconciling".

State is never color-only: every badge has text + optional glyph + border style difference.

## 15. Status indicators

- Live dot: 8px signal `#0ADBE5` with 150ms pulse ring (motion respects `prefers-reduced-motion`).
- Pending: 8px dot pulse next to order row, not fullscreen spinner.
- Countdowns: mono tabular, `Mm Ss` format, `aria-live="off"` (timer region `aria-live="polite"` only for cooldown).
- Brier bar: 8px track `--border`, fill ink, dashed marker at 0.25 "guessing". Edge bar: centered at 0, teal right / brick left.

## 16. Navigation

**Homepage (`/`):** left `STEADY` wordmark (Newsreader 600) + `SHANNON 50312 · TESTNET` badge. Right: `How it works` (anchor), `Terminal` (primary outline), `Explorer ↗` + `Docs ↗` (quiet badges). No wallet button on homepage (homepage is narrative, not dashboard).

**Terminal (`/terminal.html`):** dark ink rail. Left: `STEADY` + testnet badge + `BTC/ETH · 1m/5m/15m/1h` caption. Center (desktop): anchor links `Markets · Ticket · Discipline · Positions · Audit`. Right: truncated wallet `0x0d6F…3719` mono + `Connect` (secondary on dark) + `Home` + `Explorer ↗`. Mobile: wordmark + Connect only; anchors collapse to horizontal scroll row under rail.

No framework router. Two static pages. Active section indicated by 2px paper underline (rail) / 2px ink underline (panels).

## 17. Motion

- Ticket preview update: 150ms ease-out opacity/transform. Cooldown countdown: 1s tick, no animation.
- Row select: instant (no slide). Receipt expand: `<details>` native, no JS animation.
- Live dot pulse: 2s ease-in-out infinite. Disabled with `prefers-reduced-motion`.
- **Never:** bouncing, floating blobs, parallax, hover lifts, skeleton shimmer gradients, page transitions.

## 18. Responsive behavior

- **1280:** 12-col, `1.2fr .8fr` terminal grid (discovery + sticky ticket). Homepage 4-col steps.
- **768:** terminal grid → single column, ticket `position: static` (no double sticky), tables keep columns but tighter padding, score 2-col → 1-col at 640.
- **390/375:** single column, 16px gutters. Priority order: risk → decision → action → state. Ticket max-loss input 44px thumb, Buy buttons 48px tall full-width stacked (UP first). Tables → stacked cards. Cooldown bar full-width sticky under rail. Countdowns stay mono, never truncate.
- No horizontal overflow at any width. Hashes truncate middle with copy button. No horizontal scroll tables.

## 19. Empty states

Centered, inset surface, 12px icon (SVG), 14px body, 12px caption + **action**. Paper bg, 1px border.

- No live windows: "No live windows with headroom — next window in ~1m." + auto-retry note + Retry button.
- No positions: "No calls yet — pick a window above." (wallet connected) / "Connect wallet to see positions." (disconnected).
- No history: "— Need 5 settled" + "You have N fills — settlement appears after lock."
- No claimables: "No claimables — winnings appear here after Finalized."
- Never "Nothing here" or lorem.

## 20. Loading states

- Discovery: table body single row "Loading live markets…" + status bar "Loading SDK…" → "Loading live markets…". No blank, no infinite spinner without message. 12s timeout → explicit error (see below).
- Ticket: preview shows "Pay — → win —" until market + max-loss present. Book line shows "Book —".
- Positions: "Connect wallet to see positions." until connected; then "Fetching fills…" briefly.
- Boot guard: if SDK import fails in 15s, replace spinner with "App failed to initialize — SDK/network blocked. Reload." Never infinite.

## 21. Errors

Pattern: `amber 3px left border + Mono 12px code + human sentence + recovery`. In `--muted` inset.

- `INDEXER_TIMEOUT`: "Market data unavailable — Indexer timed out after 12s." + Retry + "App shell remains usable."
- `MARKET_LOCKED`: "Market not Trading (status 2) — picking next window." + auto re-list.
- `HEADROOM`: "Market locks in <60s — choose next window."
- `NO_LIQUIDITY` (`0xd48c4403`): "Empty book — no liquidity on either side (honest, not fake). Try next window."
- `INVALID_PRICE` / `FillOrKillNotFillable` (`0xc04ad919`): exact code + "price off tick grid / FOK not fillable".
- `NEEDS_APPROVAL` (`0xfb8f41b2`): "Approval qty not escrow — approve exact quantity."
- `CHAIN_MISMATCH`: "Wrong chain — switch to Shannon 50312." + switch button.
- `WALLET_DISCONNECTED`: connect CTA, positions show connect empty state.
- `UNKNOWN`: dashed badge + "submitted … but RPC timed out. Reconciling…" + poll receipt (never claim failed if maybe mined).
- Never "Something went wrong."

## 22. Success states

- Submitted: `alert-success` (up-teal left border) + "Sent — `hash…` status success" + explorer link + receipt panel appears.
- Filled: receipt updates "Fill verified — price 0.021 (quoted 0.049)" + position row LIVE.
- Redeemed: balance delta line "+0.001 tUSDC" + `REDEEMED` badge + explorer link.
- Quiet, no confetti, no "WIN 🎉".

## 23. Risk states

- Max loss number: 28px mono 700 ink — largest on ticket. Always visible before Buy buttons.
- Spread >0.15: policy block `SPREAD_TOO_WIDE` + amber border on preview.
- Headroom <2m: amber countdown. <60s: block writes, risk text.
- Balance < pay: "Insufficient tUSDC — faucet 10k" + faucet hint.
- All risk states have text + number, never color-only.

## 24. Cooldown states

Cooldown is a **feature panel**, not a banner.

```
┌ COOLDOWN ACTIVE — ink solid bar, paper text ─────────────┐
│ 2 consecutive losses. Trading resumes in 02:31           │
│ Brier 0.31 · Edge −0.04 · [ ] I see my Brier is 0.31     │
└──────────────────────────────────────────────────────────┘
Buy UP / Buy DOWN: disabled, not-allowed, title "Blocked: 2 losses — wait Ns"
```

Distinguish **current discipline state** (this panel, live countdown) from **policy result at execution** (receipt line "Policy blocked: COOLDOWN — 142s remaining"). No contradictory text ("Steady" + "blocked" together is a bug).

## 25. Trade states

`INTENT → POLICY_CHECK → MARKET_VALIDATION → QUOTE → CONFIRM → SUBMITTING → MINED → INDEXED → SETTLED → REDEEMED` + `FAILED / UNKNOWN / STALE`.

- `SUBMITTING`: buttons disabled, execStatus "Signing IOC…", no duplicate (attemptId guard).
- `MINED`: receipt success + hash + explorer.
- `INDEXED`: fill row appears (poll 3s, STALE badge if lagging).
- `SETTLED`: position → SETTLING → CLAIMABLE/WON/LOST/VOID.
- `REDEEMED`: balance 0 + tx.
- `UNKNOWN`: timeout path, reconcile via `getTransactionReceipt`, never auto-retry blindly.

## 26. WHAT STEADY MUST NEVER LOOK LIKE

1. Generic SaaS (blue `#2563EB` buttons, 60px section padding, illustration islands, testimonial carousel, "AI-powered").
2. Purple crypto gradient + glassmorphism hero with centered glass card.
3. Neon casino (flashing green/red, confetti, giant WIN badges, odds ticker marquee).
4. Template dashboard (bento grid, 24px rounded cards, floating blobs, Inter everywhere, meaningless icons).
5. AI landing page (sparkles icon, "Ask AI", omnipresent chatbot, gradient CTA).
6. Excessive rounded corners (>8px), excessive pills, emoji-driven UI, stock illustrations.
7. Giant headings with no content structure, whitespace without purpose, decorative animation, hover gimmicks.

**Slop test:** if a screenshot could be mistaken for a generic AI dashboard, FAIL. Fix the system (hierarchy, risk emphasis, mono discipline, rules), not individual pixels.

---

*End of design system. All frontend work must cite this file for visual decisions.*
