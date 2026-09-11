# GEMINI-FRONTEND-AUDIT.md — Steady Frontend Audit

**Date:** 2026-09-04  
**Product:** Steady — Discipline-First Event Contract Terminal (DreamDEX / Somnia Shannon 50312)  
**Scope:** Comprehensive audit of existing frontend architecture, design, UI components, data flows, and gaps prior to frontend reconstruction.

---

## 1. Executive Audit Summary

Steady’s existing domain layer (`lib/steady/*`) and protocol integration (`lib/dreamdex/*`) are exceptionally robust, fully tested (13/13 unit tests pass), and proven live on-chain (Gate 5 IOC write mined successfully at `0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c`). 

However, the existing frontend (`app/index.html`, `app/terminal.html`, `app/style.css`, `app/app.js`) is an early prototype. While functionally connected to real SDK endpoints, its visual presentation suffers from prototype fatigue: card containers are overused, typography lacks editorial authority, the homepage reads like a feature-list landing page rather than a serious financial instrument launch, and the terminal layout competes for attention rather than centering the Honest Ticket as the core decision engine.

---

## 2. What Works (Preserve & Protect)

- **SDK Decoupled Boot & Timeout Handling:** Non-blocking async SDK loader with a 12s indexer timeout and explicit retry/error states (`INDEXER_TIMEOUT`, `NO_LIQUIDITY`). Prevents blank-screen hangs.
- **Strict Protocol & Domain Alignment:** Real `listLiveBinaryMarkets`, `getMarketOnchain`, `getBinaryOrderBook`, `getBinaryBookParams`, and `createTrader({ walletClient })`. No mocks, no fake hashes.
- **Order Construction Integrity:** Tick and lot snapping, nanosecond expiry headroom enforcement (`marketExpiry - 10s`), and strict execution boundaries (orderType 2 IOC, fixed 60 gwei / 10M gas).
- **Control-Plane & Policy Guardrails:** Pre-execution checks for trading status 1, headroom ≥ 60s, spread limits, and 2-loss cooldown integration.
- **Idempotency & Audit Trail:** `tradeAttemptId` logging, progressive disclosure trade receipts, and real-time fill tracking via `getUserFills`.

---

## 3. What Looks Weak

- **Card-Soup Layouts:** Over-reliance on uniform `.surface` white cards with 1px borders and 8px radii. Information is boxed rather than structured with typographic rhythm and editorial rules.
- **Homepage Structure:** The current landing page places marketing copy into standard boxes above a static feature list. It lacks the authoritative restraint, asymmetrical composition, and typographic confidence of elite financial protocol sites (e.g., Cairn, Swornic, Vigil Theta).
- **Terminal Hierarchy:** In `terminal.html`, the discovery table and ticket panel sit side-by-side without clear visual priority. The risk number on the ticket does not command immediate, unmistakable visual dominance.
- **Badge & Status Uniformity:** Too many standard grey/muted badges (`.badge`) without strong semantic differentiation between live pulse, success state, and risk warnings.

---

## 4. What Feels Generic

- **Typography & Spacing:** Standard font weights and generic paddings that resemble a default Web3 template dashboard rather than a specialized aviation/Swiss financial terminal.
- **Interactive States:** Basic disabling of buttons without contextual explanations embedded directly into the risk telemetry.
- **Color Discipline:** Occasional drift toward generic UI blue buttons or standard green/red alerts without pairing them with explicit textual labels and structural borders.

---

## 5. What Is Confusing

- **Asset & Window Identification:** Market IDs (`0x0000...107fc`) are long hex hashes; while truncated, the distinction between 1m, 5m, 15m, and 1h windows requires more scannable telemetry.
- **Spread & Probabilities:** Ingestion of raw bigints into human decimals is functional, but the spread vs. orderbook depth presentation lacks instant visual legibility.
- **Cooldown State:** While cooldown logic exists in `discipline.ts`, its representation in the UI feels like an error banner rather than an intentional operational feature panel.

---

## 6. What Should Be Preserved

- All files under `lib/dreamdex/*` and `lib/steady/*`.
- The async SDK import loader pattern (`loadSdk()`) and timeout graceful degradation.
- All live transaction flows, wallet connection handlers (Rabby/MetaMask multi-provider), and explorer hash linkages.
- The 13 unit tests under `tests/unit/*.mjs`.

---

## 7. What Should Be Replaced

- **`app/style.css`:** Completely rewritten to enforce the "Ledger Instrument / Editorial Financial Instrument" design system (`design.md`), removing all generic card styles, soft shadows, and non-system spacings.
- **`app/index.html`:** Completely rebuilt as a serious, publication-grade product launch page with asymmetrical storytelling, tactile control-loop breakdown, and live protocol proof.
- **`app/terminal.html`:** Recomposed into an authoritative decision environment prioritizing risk, telemetry, and the Honest Ticket.

---

## 8. What the Current Product Is Missing

1. **Brand Gravitas:** A distinct editorial voice that treats discipline as a product feature rather than an afterthought.
2. **Tactile Telemetry:** Clean tabular layouts, monospace alignment, and precise 1px rule dividers that replace decorative containers.
3. **Progressive Audit Disclosure:** Compact, highly readable receipt structures that prove every claim instantly.
4. **Deliberate Mobile Recomposition:** Purpose-built stacked layouts for 375px/390px viewports where risk, decision, and action remain paramount.
