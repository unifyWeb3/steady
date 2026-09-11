# Design QA Contract & Evaluation Framework

**Product:** Steady — Discipline-First Event Contract Terminal  
**Status:** Authoritative QA contract for visual & functional verification.

---

## 1. Visual & Product Evaluation Criteria

Every screen and component in Steady must pass 10 strict quality gates before being declared complete:

| Gate | Category | Evaluation Question | Pass Condition |
|---|---|---|---|
| **G1** | **Hierarchy** | Where does the eye land first? Is risk visually primary? | Max Loss (28px Mono Ink) is unmistakably the largest, loudest element on the Honest Ticket. |
| **G2** | **Typography** | Does the typography establish THESIS → DATA → STATE → ACTION? | Headlines use `Newsreader`, data/numbers use `JetBrains Mono` tabular, UI labels use `Inter`. No font role confusion. |
| **G3** | **Spacing** | Does spacing strictly adhere to the scale (`4, 8, 12, 16, 24, 32, 48, 64`)? | Zero ad-hoc padding/margins (no 13px, no 10px gaps). Page gutters 24px desktop / 16px mobile. |
| **G4** | **Color** | Are colors strictly semantic with zero decorative accent usage? | Cyan reserved for live pulse & active selection (<5% surface). Teal for UP/Won, Brick for DOWN/Loss, Amber for caution/cooldown. |
| **G5** | **State** | Is every state visually explicit with non-color-only communication? | Badges and states combine text labels, structural border styles, and SVGs/glyphs (e.g., `✓ AUTHORIZED`, `⛔ BLOCKED`). |
| **G6** | **Responsiveness** | Does the layout recompose deliberately across 375px, 390px, 768px, 1280px+? | Zero horizontal overflow (0px). Priority stack on mobile: Risk → Decision → Action → State. |
| **G7** | **Interaction** | Do buttons and inputs provide clear focus, active, and disabled states with reasons? | Disabled buttons display explicit reason text in adjacent caption or title attribute. Focus is 2px solid offset ink. |
| **G8** | **Accessibility** | Does the interface target WCAG 2.2 AA contrast standards? | Ink on paper 15.2:1 AAA, captions 7.1:1 AA, signal text `#06707A` 4.6:1 AA. Touch targets ≥44px. |
| **G9** | **Brand Consistency** | Does the screen feel like an authored financial instrument rather than a template? | No purple gradients, no bento-grid card soup, no glassmorphism, no emojis, no stock illustrations. |
| **G10**| **AI-Detection Test** | Could this screen be mistaken for a generic AI/Web3 hackathon template? | FAIL if generic. PASS if it has a unique, recognizable Steady visual signature (Honest Ticket + Policy Control Gate + Trade Proof). |

---

## 2. Component QA Checklist

### 1. Honest Ticket
- [ ] Max Loss number is 28px bold mono (largest element).
- [ ] Preview updates dynamically as Max Loss input changes.
- [ ] Displays lot-snapped, tick-snapped contracts and expected pay → win output.
- [ ] Directional buttons (`Buy UP` / `Buy DOWN`) show calculated cost labels.

### 2. Policy Control Gate
- [ ] First-class control block embedded inside ticket.
- [ ] Shows structural status checks (`Trading 1`, `Headroom ≥60s`, `Book Liquidity`, `Spread <0.150`, `Discipline Clear`, `Balance`).
- [ ] Displays explicit `Authorized` or `Blocked` badge.

### 3. Trade Proof (Execution Receipt)
- [ ] Compact default state (`✓ TRADE VERIFIED`).
- [ ] Expandable `<details>` disclosure showing quoted vs actual fill, max loss, expiry, policy checks, order ID, and Explorer link.

### 4. Positions Lifecycle Ledger
- [ ] Non-color-dependent lifecycle status tracking (`LIVE`, `SETTLING`, `CLAIMABLE`, `WON`, `LOST`, `VOID`, `REDEEMED`).
- [ ] One-click redemption CTA for claimable winnings.

### 5. Calibration & Discipline Engine
- [ ] Brier score gauge with 0.25 guessing line marker.
- [ ] Edge indicator bar showing win rate vs average execution probability.
- [ ] Cooldown feature panel displaying live countdown timer during tilt guard.
