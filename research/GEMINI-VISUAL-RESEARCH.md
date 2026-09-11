# GEMINI-VISUAL-RESEARCH.md — Visual & Architectural Reference

**Date:** 2026-09-04  
**Product:** Steady — Discipline-First Event Contract Terminal  
**References Studied:** `vigiltheta.vercel.app`, `cairnsui.vercel.app`, `swornic.vercel.app`, Cairn / VibeCurb repositories, institutional financial research terminals, and Swiss editorial design principles.

---

## 1. Reference Analysis

| Reference | Core Architectural Takeaway | What Steady Adopts | What Steady Rejects |
|---|---|---|---|
| **Cairn (`cairnsui.vercel.app`)** | Information density, strict tabular rules, zero rounded card soup, ink-first contrast. | Strict 1px borders, tabular monospace data, editorial headline rhythm (`Newsreader`). | Overly complex multi-pane window managers not suited for event contracts. |
| **Vigil Theta (`vigiltheta.vercel.app`)** | High-contrast telemetry, risk-first visual hierarchy, deliberate empty states. | Max-loss as the loudest typographical element on screen; uncompromising error telemetry. | Dark-mode-only bias (Steady uses warm archival paper `#FCFAF7` for calm reading). |
| **Swornic (`swornic.vercel.app`)** | Swiss grid precision, restrained color usage, signal reserved exclusively for live indicators. | Cyan signal (`#0899A6` / `#0ADBE5`) kept strictly under 5% of surface area; intentional whitespace. | Decorative gradients, floating glassmorphism blobs, generic SaaS cards. |

---

## 2. Design System Translation

### Typography
- **Headlines / Narrative:** `Newsreader` (serif, editorial authority, 500/600 weight) for hero statements and philosophy blocks.
- **Data / Telemetry / Numbers:** `JetBrains Mono` (tabular-nums, precise alignment) for prices, max loss, countdowns, hashes, and book bids/asks.
- **UI & Body:** `Inter` for robust legibility across all form inputs, table cells, and button labels.

### Surface Philosophy
- **Ink Rail (`--ink` `#141210`):** Used for primary header rails, high-priority cooldown active bars, and solid action buttons.
- **Archival Paper (`--paper` `#FCFAF7`):** The primary reading and workspace background, replacing stark digital white with a warm, calm paper feel.
- **Raised Panels (`--surface` `#FFFFFF` + 1px border + 8px radius):** Reserved strictly for functional decision instruments (the Honest Ticket, live discovery tables). No arbitrary card grids.
- **Inset Telemetry (`--muted` `#F2EFEA`):** Used for previews, receipts, and state containers.

### Color Hierarchy
- **Primary Structure:** `--ink` (`#141210`) and `--border` (`#E8E2D9`).
- **Live Signal:** `--signal` (`#0899A6`) / `--signal-dot` (`#0ADBE5`) — used *only* for live dots, selected market accent lines, and explorer links.
- **Direction & Outcome:** Up is teal (`#0A7A5A`), Down is brick (`#9E2B25`), Risk is amber (`#B9512A`). Never color-only: always paired with explicit text labels.

---

## 3. Brand Direction: Editorial Financial Instrument

Steady rejects both the "neon casino" prediction-market template and the "purple gradient SaaS" AI wrapper. It adopts the persona of a specialized physical aviation checklist meets Swiss financial terminal:
- **Calm over Hype:** "Know the downside before you enter."
- **Friction over Frictionless:** Cooldowns and max-loss prompts are protective features.
- **Evidence over Claims:** Every trade links directly to a mined transaction hash and verified fill price.
