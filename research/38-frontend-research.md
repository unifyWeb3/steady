# 38 — Frontend Research (visual intelligence, not cloning)

**Date:** 2026-09-04
**Purpose:** design intelligence for Steady reconstruction. References studied live (fetch + render notes), distilled into transferable patterns. No copying.
**Decision:** Direction C (Ledger Instrument — hybrid refined) SELECTED. See §7.

## 1. vigiltheta.vercel.app — Vigil (confidential execution)

- **What it is:** dark, monospace-heavy, confidential-execution vibe. Technical credibility through density.
- **Borrow:** tabular mono for all numbers (prevents shimmer), quiet surfaces (1px hairlines, no glow), high information density without clutter, restrained palette where color = meaning.
- **Reject:** dark-only. Vigil can stay dark because it is a console; Steady needs long-form readability (ticket math, discipline copy, receipts) — dark-only fails the calm-paper test on forms. Also reject any "classified / redacted" theater — Steady is transparent, not secretive.

## 2. cairnsui.vercel.app — Cairn (proof layer for AI memory)

- **What it is:** near-black hairline system, Answer Receipt as focal component, step rhythm (Teach → Gate → Prove → Anchor), honesty table (real vs mock explicit), roadmap with Now/Next/Vision.
- **Borrow:** proof-carrying receipt pattern (used/authorized/verified/blocked → quoted/actual/policy/tx/fill), progressive disclosure (default receipt → expand proof), step rhythm 01–04 for homepage control loop, honesty about what is live vs roadmap (no fake metrics), gate-before-generation language → policy-before-execution.
- **Reject:** Sui/Walrus/Seal stack visuals (not our chain), chatbot-centric layout, landing template feel in places. Steady's receipt is financial (pay/win/fill/balance), not memory-namespace.

## 3. swornic.vercel.app — SWORN (bonded dispute layer)

- **What it is:** Stark black/white ink, bonded economics as product, step rhythm 01–06, editorial weight, "Measured, not asserted" metrics, four-verbs developer surface.
- **Borrow:** opinionated typography (serif display + mono data), high-contrast risk framing, economics-as-product language ("The economics are the product" → "The downside is the product"), measured-not-asserted proof blocks (real tx hashes, no testimonials), numbered settlement flow (swear→window→challenge→consensus→slash → intent→policy→IOC→fill→redeem).
- **Reject:** dispute-specific visuals (TRUE/FALSE bond widgets), GenLayer chain references, maximalist black (Steady needs warm paper for consumer trust).

## 4. github.com/Enoch208/cairn (repo)

- **What it is:** framework-free `@cairn/core` engine, mock-first env-driven interfaces, honesty table, ESM export lesson.
- **Borrow (product, not visual):** pure domain (`lib/steady` mirrors `@cairn/core`), policy at boundary, receipt builder, honesty table discipline (LIVE-PROVEN vs TEST-PROVEN vs CODE-EXISTS-BUT-UNVERIFIED in handoff), ESM care (we hit `createClient` not exported — same lesson).
- **Reject for MVP:** Walrus/Seal/MemWal storage visuals, MCP server surface, reputation NFT. Documented in 31a.

## 5. github.com/Yu-369/VibeCurb (principle)

- **What it is:** extraction → explicit rules → build → visual diff → drift rejection.
- **Borrow:** the workflow itself. design.md is the explicit-rules artifact; 30 is the drift-rejection gate; 39-visual-review is the visual diff. Enforced here: no screen ships without hierarchy → risk → typography → spacing → contrast → slop check.
- **Reject:** nothing — it is process, not visuals.

## 6. Premium fintech / institutional / editorial / prediction-market survey

- **Institutional terminals (Bloomberg, dYdX, Kalshi, Polymarket):** dense tables, tabular numbers, countdown-first, spread/depth inline, one-ticket focus. Kalshi's plain "Yes at 54¢ → win $1" language validates the honest-ticket pattern. Polymarket's resolution + oracle link validates the audit surface. Borrow density + plain-language payout. Reject casino flashing, leverage theater, leaderboard-first layouts.
- **Editorial finance (FT, Bloomberg Opinion, The Economist):** serif headlines, rules/dividers over cards, deliberate asymmetry, strong alignment. Borrow for homepage narrative + terminal philosophy block. Reject paywall chrome, article endlessness.
- **Modern protocol dashboards (Uniswap, Aave, Lido):** quiet surfaces, one primary action, tx-hash-first receipts, explorer deep-links. Borrow receipt + explorer pattern. Reject generic blue SaaS buttons,=>" borrow nothing visual from rainbow-gradient eras.
- **High-quality dark mode (Linear, Vercel, Raycast):** ink rails, 1px borders, 6–8px radius, restrained motion, keyboard focus visible. Borrow rail + focus + motion restraint. Reject dark-everything, glow CTAs.

## 7. Three directions evaluated

### A. Market Control Room (dark, dense, terminal-native)

- **Look:** full dark ink `#101012`, cyan data glow restrained, 6-pane grid, mono everywhere, sparklines.
- **Fit:** high technical feel, strong for pros. **Fails:** consumer trust (dark-only forms tire), risk colors compete with cyan on dark, mobile 375px density collapses, hackathon judges read discipline as "another dark trading UI". Implementation: medium (theme inversion of existing shell).
- **Score:** fit 6, distinctiveness 5 (crowded), readability 6, trust 6, Somnia alignment 7, feasibility 7 → **6.2**.

### B. Editorial Finance (paper, serif-led, FT-like)

- **Look:** warm paper, Newsreader-dominant, rules not cards, long-form discipline copy, ticket as "order slip" with perforated receipt edge.
- **Fit:** highest trust + differentiation ("the one that makes you slower" reads editorial). **Fails:** weak live feel (paper can feel static — needs live dot + countdown choreography to feel real), risk of feeling like a blog not a terminal. Implementation: easy (current shell is closest).
- **Score:** fit 8, distinctiveness 8, readability 9, trust 9, technical feel 6, Somnia alignment 6, feasibility 8 → **7.7**.

### C. Ledger Instrument — Hybrid refined (SELECTED)

- **Look:** dark ink rail (Vigil precision) + warm paper workspace (SWORN bone) + single cyan live signal (DreamDEX electric, desaturated to text-safe). Newsreader display, JetBrains Mono data, Inter body. Tables + rules, one sticky ticket, ink-solid cooldown, progressive-disclosure receipt.
- **Fit:** discipline = editorial restraint; trust = contrast + evidence; precision = mono + hairlines; live = cyan pulse + countdowns; Somnia/DreamDEX = cyan signal without neon overload. Solves A's trust problem and B's live problem simultaneously.
- **Implementation:** incremental — keep `app/` structure + IDs + SDK logic, rebuild `style.css` system + homepage narrative + ticket/risk hierarchy + receipt disclosure + responsive stacking. No framework, no deps.
- **Score:** fit 9, distinctiveness 8, readability 9, trust 9, technical feel 8, Somnia alignment 9, feasibility 9 → **8.7. SELECTED.**

## 8. What this means for build

- Keep hybrid palette from 37, but fix cyan text contrast (`#06707A` for text, `#0ADBE5` dot only) and make max loss 28px mono (was 18px — too quiet).
- Homepage: editorial narrative (B) + live proof strip (C) + 4-step control loop (Cairn rhythm).
- Terminal: control-room density (A) inside editorial surfaces (B) under ink rail (C).
- Receipt: Cairn Answer Receipt pattern, financial fields (quoted/actual/qty/max-loss/expiry/policy/tx/fill/position/settlement/redemption).
- Cooldown: ink-solid feature panel (C), not amber banner.
- All screens must pass design.md §26 slop test + research/30 nine gates, evidenced in 39-visual-review with real screenshots.
