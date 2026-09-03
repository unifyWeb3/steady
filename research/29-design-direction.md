# 29 — Design Direction (Steady)

**Status:** APPROVED — must pass before major frontend code
**Date:** 2026-09-02
**Product:** Steady — discipline-first terminal, not dashboard

## Visual concept
Steady is an **instrument, not an app**. Think: precision tool (trading terminal + aviation checklist + Swiss editorial). Calm, dense, high-contrast, low-chroma, with risk made typographically louder than action. Impulsive trading should feel frictionful; understanding should feel effortless.

Reference analysis (inputs, not clones):
- **Vigil (vigiltheta)** — confidential execution vibe, dark, monospace, technical credibility, restrained palette, strong hierarchy. Borrow: density, monospace for prices, quiet surfaces.
- **SWORN (swornic)** — bonded truth layer, Stark black/white with ink, bonded economics as product, step rhythm 01-06, no purple glow, editorial weight. Borrow: opinionated typography, truth-bonded language, high-contrast risk framing.
- **VibeCurb principle** — extraction → explicit rules → build → visual diff → drift rejection. Enforced here.

## Typography
- **Primary: JetBrains Mono** for all data (prices, book, ticket numbers, hashes, countdowns). Why: credible, tabular, prevents price shimmer.
- **Secondary: Newsreader** (serif) for headlines / philosophy, or **Inter** if Newsreader unavailable — for human readable sections (scoring explanation, discipline copy). Serif gives editorial trust vs generic sans SaaS.
- **Tertiary mono labels:** `SF Mono` fallback, 11px uppercase tracking 0.08em for captions.

Type scale (desktop):
- Display 48 / -0.03em (hero statement only: “Know the downside before you enter.”)
- H1 32 / -0.02em
- H2 20 / -0.01em
- Body 14 / 1.5
- Caption 11 / 0.08em uppercase
- Mono price 18 / tabular-nums
- Mono small 12 / tabular-nums

Mobile: -2px each, preserve hierarchy.

## Colors
Base is **warm paper + ink**, not dark neon.

- Background: `#FCFAF7` warm paper (light mode default)
- Surface: `#FFFFFF` cards, `#F2EFEA` muted
- Ink: `#11110F` primary, `#3A3632` secondary
- Border: `#E8E2D9` subtle, `#D6CFBF` stronger
- Accent: **signal not brand** — use semantic:
  - Up/Buy: `#0A7A5A` teal (not glaring green)
  - Down/Sell: `#9E2B25` brick (not neon red)
  - Risk/warning: `#B9512A` amber-brown
  - Void/neutral: `#6B6560`
- Focus: `#11110F` 2px offset, not blue glow.

No gradients. No purple. No glass.

## Surfaces
- Flat, thin borders 1px, no drop shadows except subtle 0 1px 2px rgba(0,0,0,0.04) where depth needed.
- Cards are not rounded blobs: **radius 8px** for surfaces, **4px** for badges, **2px** for inputs. Never 24px pill containers.
- Dense, not airy. 16px base unit.

## Grid & density
- 12-col grid, max 1280px, gutter 24px desktop / 16 mobile.
- Density: **high but breathable**. Market list is a table, not cards. Ticket is single column with tight stacking (12px between rows). Avoid bento grid.
- Steady feels like a tool you scan quickly, not scroll forever.

## Spacing system
- 4, 8, 12, 16, 24, 32, 48, 64 — no arbitrary 13px.
- Section rhythm: 32/48. Component internal: 12/16. List rows: 48px tall.

## Iconography
- **No emoji.** Lucide outline, 16px, stroke 1.5, same ink color. Risk icons are not decorative — only where they disambiguate (warning triangle, lock, clock).

## Button language
- Primary action: **ink solid** `#11110F` on white text, 40px height, 6px radius, label verb-forward (“Buy UP — 22.40 max loss”). Not giant pill.
- Secondary: outline 1px ink, white bg.
- Disabled (cooldown): **paper + ink 30%**, cursor not-allowed, plus explanatory text, not just grey.
- No gradient buttons. No glow.

## Data viz
- Brier: horizontal bar 0→0.5, marker at 0.25 “guessing” dashed, fill to brier value.
- Edge: delta bar centered at 0, teal/brick direction.
- Market countdown: tabular mono, turns amber at <2m, red at <60s but also adds label “locks in 43s” — not color-only.
- Book: compact two-level table (bid/ask), mono, no chart junk.

## Motion
- 150ms ease-out for ticket updates, 0.5s for cooldown timer. No spring bounciness, no floating blobs.

## Mobile
- Market list → collapsible rows, priority: asset → time left → spread → expand for book.
- Ticket: full-width sticky bottom on mobile? No — ticket remains **above fold, single column, primary CTA thumb-reach**. Not double sticky.
- Position cards: 100% width, stacked, no horizontal scroll.
- Score strip: horizontal scroll not allowed — stack vertically on mobile.

## Empty / error / trading states
- Empty: centered 12px icon + 14px body + 12px caption with **action** (e.g., “No live windows — next in 3m” with countdown, not “nothing here”). Paper background, ink border.
- Error: amber left border 3px + Mono 12px code + human sentence + recovery link (e.g., “Market locked — switched to next window”). Never “Something went wrong.”
- Trading: pending dot pulse (2px) next to order, not full-screen spinner. Transaction hash is copyable mono link to explorer.
- Risk: max-loss number is **largest mono on ticket** (18px bold), not price. Cooldown is full-width amber bar with countdown, not toast.
- Settlement: CLAIMABLE is **ink badge + button**, not muted.

## What Steady must NOT look like
1. NOT purple gradient + glassmorphism hero with centered card (violates calm/ink)
2. NOT casino/memecoin terminal with green/red flashing, confetti, giant “WIN” badges
3. NOT generic Inter bento dashboard with 32px rounded cards, floating blobs, Inter everywhere
4. NOT AI dashboard with “Ask AI” omnipresent, Sparkles icon, purple glow buttons
5. NOT SaaS marketing page with 60px section padding, illustration islands, testimonial carousel

## Test
Every screen must pass: hierarchy > risk emphasis > typography > spacing > contrast > generic-AI slop check. See `research/30-ui-quality-gates.md`.
