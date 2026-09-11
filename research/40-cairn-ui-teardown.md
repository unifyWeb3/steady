# 40 — Cairn UI Teardown & Steady Transfer Matrix

**Date:** 2026-09-04  
**Primary Reference:** `https://cairnsui.vercel.app/` (Cairn UI)  
**Objective:** Deconstruct Cairn's finished product identity, structural patterns, and visual confidence, then translate them directly into Steady's discipline-first event contract terminal.

---

## 1. Executive Analysis: Why Cairn Feels Finished

Cairn UI does not look like a collection of generic Web3/SaaS components. It looks like **one unified product expressing one clear thesis**.

### The 6 Structural Pillars of Cairn UI:
1. **Thesis Dominance:** The core value proposition ("Gate before generation") is immediately obvious through typography, layout hierarchy, and structural placement.
2. **First-Class Gate Primitive:** Validation is not a hidden backend check or a small toast; it is an authoritative visual control block with pass/fail criteria and clear status codes.
3. **The Signature Proof Artifact ("Answer Receipt"):** Every output is accompanied by a verifiable, compact proof block showing inputs, checks, transaction/execution hashes, and status.
4. **Surface Restraint & Rule Dividers:** Cairn avoids "card-soup" (boxed grids of 8 identical cards). It uses continuous surfaces, structural 1px dividers, open space, and high-contrast typography to create grouping.
5. **Restrained Telemetry Signal:** Color is used exclusively for state signal (e.g., live dot, verified green, blocked amber/red). Backgrounds are neutral, surfaces are flat or subtle insets.
6. **Unified System Rhythm:** The public landing surface and the operational product workspace use the exact same design language, typography scale, border rules, and button primitives.

---

## 2. Comparative Matrix: Cairn → Steady

| Cairn Structural Pattern | What It Achieves | Steady Equivalent Primitive | How We Implement It in Steady |
|---|---|---|---|
| **Gate Before Generation** | Enforces verification before executing LLM generation or transaction. | **The Policy Gate (`DECISION → CONTROL`)** | A persistent, explicit control block in the Honest Ticket showing 5 exact checks: `MARKET_TRADING`, `HEADROOM_60S`, `LIQUIDITY_DEPTH`, `SPREAD_CHECK`, `DISCIPLINE_CLEAR`. |
| **Answer Receipt** | Provides immutable proof of input, policy, and execution verification. | **Execution Receipt / Trade Proof (`PROOF`)** | A signature, compact proof card: `TRADE VERIFIED` (default) with an expandable details disclosure revealing quoted vs. actual fill, max loss, expiry, policy checks, order ID, and Explorer link. |
| **Interactive Verifiable Demo** | Shows real logic in action right on the homepage hero without leaving the page. | **Interactive Honest Ticket Simulator** | A live-feeling max loss calculator on the homepage that performs real lot/tick snapping and preview math in real time. |
| **Telemetry Stream / Live Feed** | Communicates that the protocol engine is live, active, and monitoring on-chain state. | **Operational Control Bar (`LIVE STATE`)** | A top command bar indicating live Shannon 50312 indexer health, market counts, wallet balance, and active window countdowns without fake pulse animations. |
| **Rule-Divided Workspace Layout** | Replaces card-soup with structural 1px borders, clear column dividers, and asymmetrical focus. | **Instrument Workspace (`ACTION & DECISION`)** | An asymmetrical 2-column layout where **The Honest Ticket** commands primary visual weight (large risk numbers, clear decision inputs) supported by a clean Market Discovery rail. |
| **Lifecycle Badge System** | Clear, non-color-dependent states for every verification item. | **Position Lifecycle Ledger** | Badges with explicit border styles + text labels + glyphs: `LIVE` (pulse dot), `SETTLING` (lock icon), `CLAIMABLE` (solid ink CTA), `WON` (teal border), `LOST` (brick border), `VOID` (dashed border), `REDEEMED` (quiet). |

---

## 3. Redefining Steady's Product Primitives

Steady's interface will be rebuilt around 4 distinct operational stages:

```
[ DECISION ] ──► [ CONTROL ] ──► [ EXECUTION ] ──► [ PROOF ]
   (Honest Ticket)    (Policy Gate)     (IOC Order)      (Trade Receipt)
```

### 1. Primary Object: The Honest Ticket
- **Role:** The decision centerpiece.
- **Hierarchy:** 
  1. `MAX LOSS` (Largest mono number, 28px bold ink)
  2. `EXPECTED PAYOUT & PROFIT` (Secondary telemetry)
  3. `HEADROOM / EXPIRY / SPREAD` (Market constraints)
  4. `POLICY CONTROL GATE` (Pre-execution validation)
  5. `BUY UP / BUY DOWN` (Directional actions)

### 2. Control Object: The Policy Gate
- **Role:** The explicit authorization engine.
- **State A (AUTHORIZED):** `✓ ALL POLICY CHECKS PASSED — READY TO SIGN IOC`
- **State B (BLOCKED / COOLDOWN):** `⛔ TRADE BLOCKED — COOLDOWN ACTIVE (02:31 REMAINING — 2 CONSECUTIVE LOSSES)`

### 3. Proof Object: Execution Receipt ("Trade Proof")
- **Role:** The post-execution signature artifact.
- **Default:** `✓ TRADE VERIFIED — Hash 0xed05c…72464c`
- **Expanded:** Quoted vs. actual fill price, quantity, max loss, expiry, policy checks, order ID, block number, Explorer link.

### 4. Supporting Plane: Market Discovery & Positions Ledger
- **Market Discovery:** A scannable telemetry rail displaying BTC/ETH live windows, bid/ask spreads, and countdowns.
- **Positions Ledger:** Lifecycle-driven positions table with clear state badges and one-click redemption evidence.

---

## 4. Next Implementation Step

Update `design.md` and create `research/41-dashboard-reconstruction.md` to document the exact architectural layout experiments, primitive component specifications, and step-by-step rebuild sequence for the Steady terminal.
