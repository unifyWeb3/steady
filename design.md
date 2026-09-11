# design.md — Steady Frontend Constitution & Design System (Authoritative)

**Status:** AUTHORITATIVE & BINDING CONSTITUTION for all frontend architecture, visual design, component construction, and styling. Supersedes all ad-hoc styling. Every frontend decision must be traceable to this document.  
**Product:** Steady — Discipline-First Event Contract Terminal for DreamDEX on Somnia Shannon 50312.  
**Core Thesis:** "Know the downside before you enter."

---

## 1. Product Essence & Personality

- **One-Line Brand Idea:** Discipline-first execution engine for short-window prediction contracts.
- **Product Personality:** Precision aviation checklist × Swiss financial telemetry × editorial research instrument. Calm, accountable, transparent, friction-conscious.
- **Core Tension:** Prediction markets reward speed and impulsive dopamine clicks; long-term account survival requires explicit risk bounding and disciplined friction.
- **User Promise:** Bounded loss before entry, policy authorization before execution, verifiable on-chain fills after execution, and automatic cool-down protection when chasing losses.
- **Emotional Feeling:** Calm control, clarity of downside, confidence in execution evidence.
- **Operational Mantra:** `DISCIPLINE OVER DOPAMINE. DECIDE → CHECK → EXECUTE → VERIFY.`

---

## 2. Semantic Visual Language

Color in Steady exists solely to communicate semantic state, structure, or actionable telemetry. **Zero decorative color.**

| Semantic Role | Token Name | Hex Value | Meaning & Context | Contrast Target |
|---|---|---|---|---|
| **Structure / Authority** | `--color-ink` | `#13251E` | Deep-green command rails, primary text, max-loss risk typography, structural anchors. | 14.88:1 (AAA) |
| **Secondary Ink** | `--color-ink-2` | `#33453C` | Secondary labels, captions, metadata, table headers. | 9.48:1 (AAA) |
| **Muted Ink / Void** | `--color-ink-3` | `#5D675F` | Disabled text, voided outcomes, neutral state copy. | 5.5:1 (AA) |
| **Archival Paper** | `--color-paper` | `#F6F7F2` | Off-white workspace background. Calm, non-glare reading canvas. | Base |
| **Surface Panel** | `--color-surface` | `#FFFFFF` | Raised decision panels (Honest Ticket, Discovery Table). | Base |
| **Inset Telemetry** | `--color-muted` | `#EEF1EA` | Previews, trade receipts, empty states, table hover highlights. | Base |
| **Rule Divider** | `--color-border` | `#D8E0D6` | 1px structural dividers, section rules. | N/A |
| **Strong Border** | `--color-border-2` | `#B8C8BA` | Table header borders, selected market outlines, input borders. | N/A |
| **Live Signal** | `--color-signal` | `#08635F` | **Live & active telemetry only**: selected market edge, live pulse dot, Explorer links. (<5% surface area). | 6.59:1 (AA) |
| **Up Direction / Success** | `--color-up` | `#145A43` | UP direction, won positions, verified execution. Always paired with text label. | 8.16:1 (AAA) |
| **Down Direction / Loss** | `--color-down` | `#A33A32` | DOWN direction, lost positions, blocked execution. Always paired with text label. | 6.54:1 (AA) |
| **Caution / Cooldown** | `--color-amber` | `#9A5A1F` | Spread warnings, headroom warnings, active cooldown timer bar. | 5.45:1 (AA) |
| **System Focus** | `--color-focus` | `#13251E` | 2px solid offset outline for keyboard navigation. | 14.88:1 (AAA) |

---

## 3. Typography Roles & Scale

Three font families, each assigned a non-overlapping operational role:
- **Display & Headlines:** `Newsreader` (serif, editorial authority, 500/600 weight, neutral tracking). Never used for numeric financial data.
- **Telemetry & Financial Data:** `JetBrains Mono` (tabular numbers, no ligatures, 400/600/700 weight). Used for prices, risk numbers, countdowns, hashes, and book bids/asks.
- **UI & Interface Copy:** `Inter` (sans-serif, clean legibility, 400/500/600 weight). Used for body prose, button labels, and input captions.

### Comprehensive Type Scale

| Role Token | Font Family | Size / Line-Height | Weight / Tracking | Case | Maximum Measure | Purpose |
|---|---|---|---|---|---|---|
| `--type-display` | Newsreader | 56px / 0.95 | 500 / 0.00em | Sentence | 16ch | Homepage hero headline |
| `--type-h1` | Newsreader | 32px / 1.1 | 500 / 0.00em | Sentence | 24ch | Section titles, Operational Control |
| `--type-h2` | Inter | 20px / 1.2 | 600 / 0.00em | Title | 30ch | Panel heads (Live Windows, Honest Ticket) |
| `--type-h3` | Inter | 15px / 1.35 | 600 / 0.00em | Title | 40ch | Sub-headers, modal titles |
| `--type-body` | Inter | 14px / 1.5 | 400 / 0.00em | Sentence | 65ch | Explanatory prose, body text |
| `--type-small` | Inter | 13px / 1.45 | 400 / 0.00em | Sentence | 60ch | Table cells, ticket row values |
| `--type-caption` | Inter | 11px / 1.4 | 600 / +0.08em | UPPERCASE | 50ch | Field labels, eyebrows, section tags |
| `--type-mono-hero` | JetBrains Mono | 28px / 1.1 | 700 / 0.00em | Tabular | 12ch | **MAX LOSS RISK NUMBER (Centerpiece)** |
| `--type-mono-price` | JetBrains Mono | 18px / 1.2 | 600 / 0.00em | Tabular | 12ch | Orderbook best bid / best ask |
| `--type-mono-small` | JetBrains Mono | 12px / 1.4 | 400 / 0.00em | Tabular | 40ch | Hashes, IDs, proof receipts |
| `--type-mono-badge` | JetBrains Mono | 11px / 1.2 | 600 / +0.08em | UPPERCASE | 20ch | Badges, state pills |

---

## 4. Spacing System & Grid Rhythm

Spacing follows an explicit, uncompromising 8-point scale (with 4px micro-spacing):
`4px · 8px · 12px · 16px · 24px · 32px · 48px · 64px · 96px · 128px`

- **Page Max Width:** `1280px`
- **Page Gutters:** `24px` (Desktop) / `16px` (Mobile ≤768px)
- **Section Spacing:** `48px` (Desktop) / `32px` (Mobile)
- **Panel Internal Padding:** `18px` / `20px`
- **Table Row Height:** `48px` tall (12px top/bottom padding)
- **Ticket Row Gap:** `12px`
- **Input Height:** `36px` standard / `44px` thumb-friendly risk input
- **Button Height:** `40px` standard / `48px` large action / `32px` compact inline

---

## 5. Surface & Border System

Panels exist purely to serve structural hierarchy. **Zero nested card-soup.**

| Surface Role | Background Token | Border Token | Radius Token | Shadow | Purpose |
|---|---|---|---|---|---|
| **Page Workspace** | `--color-paper` (`#F6F7F2`) | None | `0px` | None | Base reading background. |
| **Command Rail** | `--color-ink` (`#13251E`) | `1px solid #08150F` | `0px` | None | Header masthead rail. |
| **Raised Panel** | `--color-surface` (`#FFFFFF`) | `1px solid --color-border` | `--radius-m` (`8px`) | `0 1px 2px rgba(20,18,16,.05)` | Honest Ticket, Discovery Rail, Positions. |
| **Inset Telemetry** | `--color-muted` (`#EEF1EA`) | `1px solid --color-border` | `--radius-m` (`8px`) | None | Previews, trade receipts, empty states. |
| **Policy Control Box**| `--color-paper` (`#F6F7F2`) | `1px solid --color-border-2` | `--radius-s` (`4px`) | None | Embedded Policy Gate primitive. |
| **Active Overlay** | `--color-ink` (`#13251E`) | `1px solid --color-ink` | `--radius-m` (`8px`) | None | Cooldown tilt-guard feature panel. |

---

## 6. Motion Vocabulary & Named System Transitions

Motion in Steady communicates system state transitions and validation progress. **No decorative float or hover gimmicks.** Respects `prefers-reduced-motion`.

| Motion Token | Named Pattern | Trigger Event | Duration / Easing | Visual Behavior | Operational Purpose |
|---|---|---|---|---|---|
| `--motion-pulse` | `LIVE-PULSE` | Continuous | 2000ms ease-in-out infinite | Signal dot subtle ring expansion (`0 0 0 3px` → `0 0 0 6px`). | Indicates active indexer connection & live markets. |
| `--motion-preview` | `TICKET-PREVIEW` | Input change | 150ms ease-out | Smooth opacity transition during max-loss recalculation. | Signals tick/lot snapped preview update. |
| `--motion-gate` | `POLICY-CHECK` | Market select / input | 2000ms step-sequence | Sequential checkmarks (`✓`) populating policy list. | Visualizes authorization gate execution. |
| `--motion-submit` | `EXECUTE-LOCK` | Buy click | 150ms ease-in | Action buttons disable, label switches to `Signing IOC…`. | Prevents duplicate trade submission. |
| `--motion-receipt` | `PROOF-REVEAL` | Transaction mined | 250ms ease-out | Trade Proof receipt panel slides down with teal border. | Displays verifiable execution receipt. |
| `--motion-cooldown` | `COOLDOWN-TICK` | 2 consecutive losses | 1000ms step-end | Digital countdown clock ticks down (`02:31` → `02:30`). | Communicates exact time remaining in tilt guard. |

---

## 7. Content System & Voice Rules

- **Tone:** Concise, calm, technical, financial, accountable.
- **Forbidden Words:** "Moon", "LFG", "AI-Powered", "100x", "Guaranteed", "Frictionless", "Instant Wealth".
- **Punctuation:** Zero exclamation marks (`!`). Zero emojis (`🚀`, `🔥`). Plain periods and arrows (`→`, `↗`).

### Microcopy Standards
- **Primary Action Verb:** Always explicit with calculated cost: `Buy UP — 22.40` or `Buy DOWN — 22.40`.
- **Policy Denial:** Always includes exact code and remaining duration: `Policy blocked: COOLDOWN — 142s remaining (2 consecutive losses)`.
- **Error Messages:** `amber left border` + `Mono 12px exact error code` + plain human explanation + recovery button.
- **Receipt Proof:** `TRANSACTION CONFIRMED · FILL VERIFIED — steady-1725... · quoted 0.049 → fill 0.021`.
- **BUY_NO receipt:** show `NO quote → NO fill` first. Preserve the SDK's YES-term
  evidence beneath it as `YES-equivalent quote → YES-equivalent fill`.

---

## 8. Canonical State Vocabulary

Every state in Steady has a mandatory non-color indicator (label + code + border style):

```
NETWORK:
CONNECTED     ── [ 0x0d6F…3719 · Shannon 50312 ]
DISCONNECTED  ── [ Connect Wallet CTA ]
WRONG_NETWORK ── [ Switch to Shannon 50312 Button ]

MARKET:
TRADING       ── [ Status 1 · Live Bid/Ask · Headroom ≥60s ]
LOCKED        ── [ Status 2 · Switched to Next Window ]
FINALIZED     ── [ Status 4 · Outcome Resolved · Claimable Scan ]
VOIDED        ── [ Status 5 · Void · 0.5 Payout per Side ]

ORDER:
READY         ── [ Policy Authorized · Buy UP / Buy DOWN Active ]
SUBMITTING    ── [ Signing IOC… · Buttons Disabled · Attempt ID Active ]
CONFIRMED     ── [ Mined in Block · Hash Recorded · Polling Fill ]
FILLED        ── [ Fill Verified · Quoted vs Actual Logged ]
FAILED        ── [ Error Code Logged · Reverted / Empty Book ]

POSITION:
LIVE          ── [ Pulse Dot · Active Countdown ]
SETTLING      ── [ Lock Icon · Market Expired ]
CLAIMABLE     ── [ Solid Ink CTA Button · Redeem Winnings ]
WON           ── [ Teal Border · Payout Settled ]
LOST          ── [ Brick Border · Loss Settled ]
VOID          ── [ Dashed Border · 0.5 Refund Settled ]
REDEEMED      ── [ Quiet Muted · ERC-6909 Burned ]

POLICY:
AUTHORIZED    ── [ ✓ All Checks Passed ]
BLOCKED       ── [ ⛔ Policy Denied: Cooldown / Spread / Headroom ]
```

---

## 9. Iconography System

- **Style:** Lucide-style inline SVGs, 16px size, 1.5px stroke width, stroke currentColor.
- **Allowed Glyphs:** Clock (expiry), Lock (locked market), Check (policy pass), Cross (policy deny), Arrow-Up-Right (explorer link), Dot (live signal).
- **Hard Rule:** **ZERO EMOJIS.** Zero Unicode symbols pretending to be icons.

---

## 10. Signature Product Primitives

### Signature Primitive 1: The Honest Ticket
- **Role:** Centerpiece decision instrument.
- **Hierarchy:**
  1. `Max Loss Input & 28px Mono Risk Display` (Dominant)
  2. `Expected Outcome Matrix` (Pay → Win, Profit, Expiry, Spread, Book Depth)
  3. `Embedded Policy Gate` (6 validation checks)
  4. `Directional Action Buttons` (`Buy UP — 22.40` / `Buy DOWN — 22.40`)

### Signature Primitive 2: The Policy Control Gate
- **Role:** First-class structural authorization block embedded directly inside the ticket.
- **Visual Grammar:** Solid 1px border box displaying structural checkmarks (`✓`) for 6 explicit policy criteria:
  - `Market Status: Trading (1)`
  - `Expiry Headroom: ≥60s`
  - `Book Liquidity: Active`
  - `Max Spread: ≤0.150`
  - `Discipline Clear: 0/2 Losses`
  - `Balance Sufficient: tUSDC`

### Signature Primitive 3: Trade Proof (Execution Receipt)
- **Role:** Verifiable post-trade receipt card (Cairn Answer Receipt equivalent).
- **Default:** `✓ TRADE VERIFIED — Hash 0xed05c…72464c`
- **Expanded:** Native `<details>` showing quoted price vs actual fill price, executed contracts, max loss, expiry nanoseconds, policy checks array, order ID, block number, and Explorer proof link.

---

## 11. Responsive Transformations

- **1280px+ (Desktop Workspace):** Independent support and decision columns at
  `1.2fr : 0.8fr`; the sticky Honest Ticket is on the right without forcing a
  blank interval into the support column.
- **768px - 1024px (Tablet):** Terminal converts to a one-column task stack.
  The ticket follows the stage rail and remains static above lifecycle surfaces.
- **375px - 390px (Mobile):** Single column, 16px gutters, 0px horizontal overflow.
  - Priority Stack: Market Discovery → Max Loss Risk Input → Outcome Matrix → Policy Gate → Directional Buttons → Positions Ledger → Settlement.
  - Tables convert to block cards with `data-l` caption prefixes.

---

## 12. Accessibility Targets (WCAG 2.2 AA)

- **Contrast Ratios:** Text on paper ≥ 7:1 (AA/AAA). Live signal text `#08635F` on paper = 6.59:1 (AA).
- **Touch Targets:** Minimum 44px height for risk inputs, direction buttons, and mobile tabs.
- **Focus Rings:** `2px solid #13251E` offset 2px. Visible on keyboard tab navigation.
- **Non-Color State:** Every state combines text + label + border style. Never rely on color alone.

---

## 13. Hard "NEVER LOOK LIKE" List

Steady must NEVER contain:
1. Generic blue SaaS buttons (`#2563EB`).
2. Purple gradients, rainbow glows, or glassmorphism panels.
3. Bento-grid card-soup where 12 identical rounded boxes compete for attention.
4. Neon casino aesthetics, flashing odds tickers, or "WIN 🎉" confetti.
5. AI landing page clichés (sparkles icons, "Ask AI", chatbots).
6. Stock illustrations, decorative floating blobs, or parallax hovers.

---

## 14. CSS Token Mapping

```css
:root {
  /* Colors */
  --color-ink: #13251E;
  --color-ink-2: #33453C;
  --color-ink-3: #5D675F;
  --color-paper: #F6F7F2;
  --color-surface: #FFFFFF;
  --color-muted: #EEF1EA;
  --color-border: #D8E0D6;
  --color-border-2: #B8C8BA;
  --color-signal: #08635F;
  --color-signal-text: #08635F;
  --color-signal-dot: #22B8A8;
  --color-up: #145A43;
  --color-down: #A33A32;
  --color-amber: #9A5A1F;
  --color-focus: #13251E;

  /* Spacing */
  --space-4: 4px;
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-24: 24px;
  --space-32: 32px;
  --space-48: 48px;
  --space-64: 64px;

  /* Radii */
  --radius-s: 4px;
  --radius-m: 8px;
  --radius-btn: 6px;

  /* Typography Sizes */
  --type-display-size: 56px;
  --type-h1-size: 32px;
  --type-h2-size: 20px;
  --type-risk-hero-size: 28px;
}
```

---

*End of Frontend Constitution (`design.md`). All UI reconstruction must strictly adhere to this document.*
