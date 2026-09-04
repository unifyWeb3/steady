# 37 — Brand Direction (Steady)

**Date:** 2026-09-03
**Status:** SELECTED — Hybrid dark ink base + warm neutral surfaces + Somnia/DreamDEX cyan signal

## Exploration
Investigated three directions per brief:

**A. DreamDEX/Somnia-inspired (deep blue / electric cyan / dark neutral)**
- Deep navy #0B1426, cyan #00E5FF, dark ink. Strong infrastructure feel, but too cold for consumer trust, risk colors competed with cyan, and dark-only failed the “calm paper” readability test on long forms.

**B. Institutional (ink / bone / muted signal)**
- Ink #11110F, bone #F2EFEA, muted teal/brick. Very credible, but felt too quiet for hackathon demo — lacking a signal that ties to Somnia/DreamDEX without being generic.

**C. Hybrid (selected)**
- **Dark ink header + warm paper body + cyan signal accent** — ink header gives precision and trust (Vigil), warm paper body gives editorial readability (SWORN bone), cyan #0ADBE5 as single signal accent for live data (DreamDEX electric, but desaturated to avoid neon).

## Selected palette
- **Ink:** #11110F (header, primary buttons, text)
- **Paper:** #FCFAF7 (body)
- **Surface:** #FFFFFF (cards), #F2EFEA (muted)
- **Border:** #E8E2D9 / #D6CFBF
- **Cyan signal:** #0ADBE5 (live dot, selected market, explorer links) — used sparingly, <5% surface
- **Up:** #0A7A5A teal (not glaring green)
- **Down:** #9E2B25 brick (not neon red)
- **Risk/amber:** #B9512A
- **Void:** #6B6560

**Rejected:** A (too cold, cyan overload), B (too quiet), plus any purple crypto gradient, neon, glassmorphism, rainbow, excessive dark-card.

## Typography
- **Display/hero:** Newsreader 6..72, 400/600, -0.03em — editorial trust, not Inter
- **Data:** JetBrains Mono 400/600, tabular-nums — prices, hashes, countdowns, book
- **UI:** Inter 14/1.5 for body, 11px 0.08em uppercase for captions
- Scale: Display 56→40 mobile, H1 32, H2 20, Body 14, Caption 11, Mono price 18

## Color meaning
- Ink = authority, risk number is ink bold (largest on ticket)
- Cyan = live (market selected, explorer link, live dot pulse)
- Teal/brick = direction, but also label (UP/DOWN text) — not color-only
- Amber left border = error/warning (market locked, spread wide)
- Paper = calm, not casino

## Contrast & states
- Ink on paper 15.2:1, ink-2 on paper 7.1:1 — AAA
- Focus: 2px ink offset, not blue glow
- Disabled: ink 30% + not-allowed cursor + reason text
- Empty: centered 12px icon + 14px body + 12px caption + action
- Error: amber left border 3px + Mono 12px code + human sentence + retry
- Trading: dot pulse 2px next to order, hash mono 12px copyable

## Why it fits Steady
Discipline = ink/paper editorial restraint; trust = high contrast + no glow; precision = mono tabular + 1px borders + 8px radius; market intelligence = cyan signal for live, not decoration; modern infrastructure = dark ink header (Vigil) + warm body (SWORN) hybrid — simple outside, serious inside.
