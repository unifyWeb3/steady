# 41 — Dashboard Reconstruction Plan & Layout Experiments

**Date:** 2026-09-04  
**Product:** Steady Terminal  
**Core Reference:** `https://cairnsui.vercel.app/` (Cairn UI)  
**Objective:** Recompose the Steady terminal into an authoritative, highly authored operational workspace based on Cairn UI's principles.

---

## 1. Layout Experimentation Analysis

We evaluated 4 layout compositions for the Steady operational terminal:

| Layout Model | Structure | Pros | Cons | Decision |
|---|---|---|---|---|
| **A. Large Ticket / Supporting Rail** | 45% Ticket / 55% Market Discovery | Ticket is immediately prominent; risk number is impossible to miss. | Can squeeze orderbook telemetry if table has many columns. | **SELECTED (Refined)** |
| **B. Wide Market Workspace / Fixed Sidebar** | 70% Table / 30% Compact Sidebar | High table visibility; feels like a standard DEX terminal. | Ticket becomes a generic sidebar swap widget (loses product identity). | **REJECTED** — Too conventional. |
| **C. Single-Column Editorial Command** | Stacked full-width blocks | Extreme focus; clean mobile parity. | Requires vertical scrolling to move between market selection and ticket execution. | **REJECTED for Desktop** — Great for mobile. |
| **D. 3-Column Split (Discovery \| Ticket \| Audit)** | 35% / 40% / 25% | Everything visible at once. | Cluttered; visually noisy; forces tiny font sizes; breaks hierarchy. | **REJECTED** |

### Selected Architecture: Asymmetric Instrument Workspace (Model A + Editorial Command)
- **Grid Ratio:** `1.2fr : 0.8fr` on desktop (1280px+). Single-column recomposition on mobile (375px/390px).
- **Left Column (1.2fr):** Market Discovery Rail + Active Orderbook Depth + Positions Ledger.
- **Right Column (0.8fr):** The Honest Ticket (Centerpiece) + Policy Control Gate + Trade Proof (Execution Receipt) + Calibration / Discipline Engine.

---

## 2. Component Primitive Specifications

### Primitive 1: The Honest Ticket (Decision Engine)
- **Headline:** `Honest Ticket` (Newsreader 600) + `Type 2 IOC` badge.
- **Max Loss Input:** 44px height, JetBrains Mono 17px, offset focus border.
- **Dominant Risk Display:** 28px JetBrains Mono bold ink number: `22.40 tUSDC`. Caption: `Capped downside · tick-snapped · lot-snapped`.
- **Outcome Matrix:** 
  - `Pay → Win if UP:` `22.40 → 40.00 tUSDC`
  - `Profit / Contracts:` `+17.60 · 40.000 contracts`
  - `Expiry / Spread:` `8m 47s · 0.034`
  - `Order Type:` `IOC (Type 2) · 60 gwei / 10M gas`
- **Actions:** Dual direction buttons (`Buy UP — 22.40` in Teal / `Buy DOWN — 22.40` in Brick Outline).

### Primitive 2: The Policy Gate (Control System)
- **Visual Style:** Embedded control box inside the Honest Ticket with structural status ticks (`✓` or `⛔`).
- **Pass State:**
  ```
  CONTROL GATE: AUTHORIZED
  ✓ Market Status: Trading (1)
  ✓ Expiry Headroom: 8m 47s (≥60s required)
  ✓ Book Liquidity: 40.000 contracts available
  ✓ Max Spread: 0.034 (≤0.150 required)
  ✓ Discipline: Clear (0/2 consecutive losses)
  ```
- **Denied / Cooldown State:**
  ```
  CONTROL GATE: BLOCKED
  ⛔ COOLDOWN ACTIVE — 2 CONSECUTIVE LOSSES
  Resumes in 02:31 · Brier 0.31 · Edge -0.04
  ```

### Primitive 3: Trade Proof / Execution Receipt (Verification Signature)
- **Visual Style:** Compact proof box below ticket.
- **Default (Collapsed):** `✓ TRADE VERIFIED — Tx 0xed05c…72464c` (Teal up badge + Explorer link).
- **Expanded Details (`<details>` Native):**
  - Quoted Price vs. Actual Fill Price
  - Executed Quantity & Max Loss
  - Expiry Nanoseconds & Market ID
  - Policy Verification Array
  - Order ID & Block Number
  - Explorer Link (`https://shannon-explorer.somnia.network/tx/0x...`)

### Primitive 4: Position Lifecycle Ledger
- **Table Columns:** `Market`, `Side`, `Fill Price`, `Quantity`, `Lifecycle State`, `Transaction`, `Action`.
- **States:** `LIVE` (pulsing signal dot), `SETTLING` (lock icon), `CLAIMABLE` (solid ink CTA button), `WON` (teal border), `LOST` (brick border), `VOID` (dashed border), `REDEEMED` (quiet muted).

### Primitive 5: Calibration & Discipline Engine
- **Brier Meter:** Track length representing 0.0 (sharp) to 0.5 (poor), with a dashed marker at 0.25 (guessing).
- **Edge Indicator:** Win rate minus average execution probability.
- **Historical Streak Dots:** Dot indicators showing last 5 settled outcomes (`W` / `L`).

---

## 3. Screen-by-Screen Reconstruction Sequence

Per instruction 18, we will build and verify sequentially:

1. **Screen 1: Dashboard Shell & Command Masthead**
2. **Screen 2: Market Discovery Rail**
3. **Screen 3: Honest Ticket (Centerpiece)**
4. **Screen 4: Policy Control Gate**
5. **Screen 5: Trade Proof / Execution Receipt**
6. **Screen 6: Position Lifecycle Ledger**
7. **Screen 7: Calibration & Discipline Engine**

At each step: **BUILD → RENDER → INSPECT → SCREENSHOT → CRITIQUE → CONTINUE**.
