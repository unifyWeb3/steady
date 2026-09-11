# 70 — Final Frontend Design Audit

**Date:** 2026-09-10  
**Phase:** 1 — visual audit only  
**Scope:** Steady homepage and terminal presentation. No protocol, domain, SDK,
wallet, settlement, redemption, or test implementation changes are authorized
in this phase.

## Audit Disposition

The current interface is already recognizably Steady: warm paper, ink rail,
editorial type, a risk-first ticket, explicit policy checks, and a quiet proof
ledger. The next pass should be a controlled refinement of hierarchy and state
communication, not a rebuild.

Kynlo could not be sampled from this environment. No exact Kynlo palette match
is claimed. The direction below is a documented off-white/deep-green proposal
derived from the existing Steady constitution and the local Cairn teardown.

## Phase 0 Baseline

### Environment and behavior

- Local server: `npm run dev`, `http://localhost:5173`.
- Browser suite: `npx playwright test tests/e2e --reporter=line --workers=1 --timeout=60000` — **6 passed** in 2.4 minutes.
- The suite proved homepage render, terminal timeout/retry shell, mocked Rabby connection, 375px overflow, and ticket shell behavior. It did not prove a real wallet popup or a fresh live transaction.
- The current network path remained in the honest indexer-loading/unavailable state during the baseline. No live market, fill, settlement, or redemption claim was added.
- Baseline body color at all widths: `rgb(252, 250, 247)` (`--paper`).
- Baseline `scrollWidth - clientWidth`: `0px` at 1280, 768, 390, and 375 widths.

### Captured screenshots

Captured at 900px desktop/tablet height, 844px at 390px, and 812px at 375px:

- `test-results/baseline-home-1280.png`
- `test-results/baseline-home-768.png`
- `test-results/baseline-home-390.png`
- `test-results/baseline-home-375.png`
- `test-results/baseline-terminal-1280.png`
- `test-results/baseline-terminal-768.png`
- `test-results/baseline-terminal-390.png`
- `test-results/baseline-terminal-375.png`

### Baseline visual read

The homepage makes the thesis legible immediately on desktop, but the full
page becomes a long sequence of bordered explanation blocks on mobile. The
terminal has the right operational ingredients, but its outage state exposes a
large empty left rail beside a taller ticket, and the mobile stage rail hides
part of the sequence behind horizontal scrolling. These are hierarchy and
composition issues, not evidence of protocol defects.

## Current Visual Weaknesses

### Homepage

1. **Illustrative and live language sit too close together.** The static ticket
   preview in [`app/index.html`](/home/unify/somnia/app/index.html:44) uses a
   `badge-live` labelled “Live logic” while its values are explicitly
   illustrative at line 61. The visual treatment should make “example” and
   “historical live proof” unmistakably different states.
2. **The first screen has two competing calls to action.** The header CTA at
   [`app/index.html`](/home/unify/somnia/app/index.html:24) and the hero pair at
   lines 38–41 are all visually strong. The terminal should remain the single
   primary action; the explanatory anchor should be quieter.
3. **The narrative is vertically expensive on narrow screens.** The repeated
   `.section` blocks, four `.step` cards, three discipline cards, proof card,
   and final CTA at [`app/index.html`](/home/unify/somnia/app/index.html:74)
   through line 159 produce a roughly 4.6k–4.7k pixel page at 375–390px. The
   content is valid, but the visual rhythm reads as a stack of modules rather
   than one authored account-control story.
4. **Card grouping is stronger than the constitution intends.** `.steps`,
   `.trio`, `.surface`, `.proof-strip`, and the receipt all have borders and
   rounded corners (`app/style.css:83`, `225–231`). The ticket may be raised;
   supporting homepage sections should use rules, columns, and open space.
5. **Historical proof lacks a visible date/provenance cue.** The proof strip at
   [`app/index.html`](/home/unify/somnia/app/index.html:65) presents mined hashes
   as “Live proof” without the historical date that the handoff requires.
6. **Inline layout styles make refinement brittle.** Repeated `style="..."`
   attributes throughout both HTML files bypass the token system and make
   mobile adjustments hard to reason about. A finishing pass should move only
   presentation rules into named classes, without changing behavior.

### Terminal

1. **The outage state creates an uneven workspace.** The grid defined by
   `.term-grid` (`app/style.css:273–278`) gives the ticket a row-spanning area.
   When discovery is loading or unavailable, the left column has a large empty
   interval before Positions while the ticket continues down the right side.
   The ticket should remain sticky on desktop, but the supporting column should
   size itself independently.
2. **Network and market health are visually ambiguous.** `#statusBar` and
   `#marketHealth` are adjacent in the masthead
   ([`app/terminal.html`](/home/unify/somnia/app/terminal.html:41)); baseline copy
   reads as “LOADING SDK…” plus “LOADING CHECKING STATUS”. They need separate
   labels and codes for network initialization, market discovery, and verified
   Trading status.
3. **The stage rail is clipped on mobile.** `.stage-item{min-width:142px}` and
   horizontal overflow (`app/style.css:315–316`) show only part of the fourth
   stage at 390px. The current interaction remains reachable, but the sequence
   should be fully scannable without guessing that it scrolls.
4. **The disconnected wallet placeholder is an orphaned dash.** The `—`
   address in [`app/terminal.html`](/home/unify/somnia/app/terminal.html:25) is
   visually detached from Connect at narrow widths. The state needs a compact
   “Disconnected” label or a clearly grouped status treatment while retaining
   the same `#connectBtn` handler.
5. **Stage numbering is inconsistent.** Policy is labelled `03 / Control` at
   [`app/terminal.html`](/home/unify/somnia/app/terminal.html:173), while the
   execution block is also labelled `03 / Execute + prove` at line 202. The
   stage rail has a distinct four-step sequence; the content labels should use
   the same sequence.
6. **The ticket is correct but not yet visually side-explicit enough.** The
   rows at [`app/terminal.html`](/home/unify/somnia/app/terminal.html:162) are
   generic “UP economics” and “DOWN economics”. The selected direction, pay,
   payout, quantity, and probability need a stronger relationship without
   duplicating math or changing the canonical intent.
7. **The receipt needs an explicit NO-term representation.** The current runtime
   receipt writes a YES-term “Quoted” row and only includes the NO equivalent in
   the actual-fill string (`app/app.js:1094–1097`). Any redesign must show
   `NO quote → NO fill`, or both YES-equivalent and NO-term rows. It must never
   imply that the SDK’s YES-term price is the user-facing DOWN quote.
8. **Execution readiness is visually under-specified.** The dark
   `.ticket-execution-block` (`app/style.css:265–271`) is a strong anchor, but
   before a market is selected it contains a faucet, checkbox, and disabled
   actions without a single concise “not executable” explanation. The block
   should expose readiness, blocked, submitting, and proof states without
   inventing values.
9. **Lifecycle tabs become a horizontal text strip.** The seven `.tab` buttons
   (`app/style.css:217–220`) remain usable but lose context at 390–375px. The
   selected tab needs a stronger non-color indicator and an accessible label;
   the ledger itself should retain the current honest empty state.
10. **Calibration is visually quieter than its meaning.** Both score bars use
    the same ink fill and tiny captions (`app/terminal.html:234–248`). The
    “Need 5 settled” state should read as insufficient evidence, not as a zero
    score, while preserving the tested scoring behavior.
11. **Settlement empty and unavailable states need distinct visual grammar.**
    The initial “No finalized records in view” copy at
    [`app/terminal.html`](/home/unify/somnia/app/terminal.html:123) is a valid
    empty state, but it should not resemble a completed claim scan when the
    indexer or bounded fallback is incomplete. The existing `Claims unavailable`
    behavior must be visually prominent when it occurs.

## Proposed Homepage Hierarchy

1. Keep the dark/ink-or-green command rail, brand, testnet identity, and one
   primary `Open terminal` action. Keep the explanatory anchors as quiet text
   links.
2. Make the first viewport one composed instrument: thesis on the left, a
   clearly labelled illustrative ticket preview on the right, and a compact
   historical-proof strip below. Use `Illustrative example` and
   `Historical live proof · YYYY-MM-DD` as separate provenance labels.
3. Replace the “Without / With” two-column paragraph block with one concise
   control thesis band. Preserve the copy, but make the downside and policy
   contrast scannable in two rule-separated columns.
4. Convert the four control-loop cards into a numbered rule list or four
   narrow bands. Keep the sequence `Decide → Check → Execute → Verify`; remove
   redundant rounded containers.
5. Keep discipline and calibration as a second authored band. The cooldown
   example must remain visibly an example state, not a current account state.
6. Keep one proof receipt as the sole raised artifact below the fold. Its
   historical status, block, transaction, and fill provenance must be explicit.
7. Fold the final CTA into the proof/footer transition so the page ends with a
   clear next action without repeating the hero composition.

## Proposed Terminal Hierarchy

### Desktop workspace (1280px)

- Masthead: product thesis, `NETWORK` state, and `MARKETS` state as separate
  compact status lines.
- Stage rail: `Discover → Decide → Control → Prove`, with the active stage
  indicated by text, border, and focus state.
- Workspace: independent left stack for Live Windows, Positions, and Audit;
  sticky right ticket for market identity, max loss, side economics, policy,
  execution, and receipt. Do not allow the ticket's height to create a blank
  left-column gap.
- The Honest Ticket remains the only strongly raised panel. Discovery and
  lifecycle use continuous surfaces and rules.
- Use deep green for the primary action/verified direction, brick for DOWN and
  blocked risk, amber for warnings/cooldown, teal only for live telemetry and
  explorer links.

### Tablet workspace (768px)

- Collapse to one column in task order: masthead, stage rail, discovery, ticket,
  positions, audit, calibration.
- Keep ticket inputs and action buttons at least 44px high. The ticket should
  not be sticky and should not cover the discovery table.
- Present the stage rail as a two-by-two grid or a full-width four-item row;
  do not hide stage labels behind an unhinted scroller.

### Narrow workspace (390px and 375px)

- Use 16px page gutters and a single column. Keep the decision order:
  market identity → max loss → outcome matrix → policy gate → actions →
  lifecycle → settlement → calibration.
- Show all four stages in a compact two-by-two rail. If horizontal scrolling is
  retained for tabs, show the active tab and a visible continuation cue.
- Keep the action pair side-by-side only when each button can preserve a 44px
  target and an unbroken label; otherwise stack them with UP first and DOWN
  second.
- Keep hashes and transaction links monospace with safe truncation. No value,
  label, or button may overflow its parent.
- Convert tables into labelled blocks as the current `data-l` approach does,
  but keep state and amount on the first scan line.

## Typography System

Retain the three-role system already established in `design.md`:

| Role | Family | Proposed use |
|---|---|---|
| Editorial thesis | Newsreader | Homepage thesis and section headings; sentence case; restrained display size. |
| Interface copy | Inter | Navigation, labels, explanations, button text, empty/error recovery. |
| Financial telemetry | JetBrains Mono | Max loss, prices, quantities, countdowns, status codes, IDs, hashes. |

Proposed rhythm:

- Homepage display: 52px desktop, 36px narrow; line-height around 1.0 and a
  maximum measure of roughly 16–18 characters for the thesis.
- Terminal title: 36–42px desktop, 30–34px narrow; never compete with the
  28px max-loss number.
- Panel headings: 18–20px Inter, sentence case.
- Body: 14px Inter with 1.45–1.55 line-height; supporting copy max 60–65ch.
- Captions: 11px, uppercase only for eyebrows, provenance, and short state
  codes. In-ticket labels remain sentence case.
- Telemetry: 12–18px mono; max loss remains the largest number in the ticket.
- Keep all responsive text inside its container. New tokens should use neutral
  tracking (`letter-spacing: 0`) unless an approved design token explicitly
  requires otherwise.

## Off-White / Deep-Green Palette Proposal

This is a proposed token set, not an exact Kynlo sample.

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F6F7F2` | Workspace background. |
| `--surface` | `#FFFFFF` | Honest Ticket and the one proof artifact. |
| `--ink` | `#13251E` | Brand rail, primary text, structural authority. |
| `--ink-2` | `#33453C` | Secondary copy and metadata. |
| `--ink-3` | `#5D675F` | Muted/disabled copy and unknown state text. |
| `--muted` | `#EEF1EA` | Inset telemetry and empty states. |
| `--border` | `#D8E0D6` | Structural dividers. |
| `--border-2` | `#B8C8BA` | Selected/strong borders and inputs. |
| `--action` | `#145A43` | Primary action and verified UP state. |
| `--signal-text` | `#08635F` | Live telemetry and explorer links only. |
| `--down` | `#A33A32` | DOWN direction, loss, blocked risk. |
| `--amber` | `#9A5A1F` | Warnings, cooldown, unavailable recovery. |

Measured contrast against the proposed base:

- `#13251E` on `#F6F7F2`: **14.88:1**.
- `#33453C` on `#F6F7F2`: **9.48:1**.
- `#08635F` on `#F6F7F2`: **6.59:1**.
- `#145A43` on white: **8.16:1**.
- `#A33A32` on white: **6.54:1**.
- `#9A5A1F` on white: **5.45:1**.

The palette deliberately keeps semantic colors sparse. The interface should
not become an undifferentiated green surface: paper, rule dividers, neutral
unknown states, brick risk, amber warnings, and teal live telemetry remain
distinct.

## Semantic State Mapping

Every state must combine a text label/code with a border or structural cue;
color is never the only signal.

| State | Visual treatment | Required wording behavior |
|---|---|---|
| Loading | Neutral muted surface, quiet static indicator, no live badge | `LOADING` plus what is being read. Keep shell usable. |
| Empty | Neutral surface and concise explanation | Distinguish no live windows, no positions, and no finalized records. |
| Unavailable | Amber/neutral left rule, monospace code, Retry/recovery action | `STATUS_UNAVAILABLE`, `BOOK_UNAVAILABLE`, `CLAIMS_UNAVAILABLE`, or exact source error. |
| Blocked | Brick rule, exact policy code, disabled Buy buttons | State why signing is forbidden; never imply an order was attempted. |
| Cooldown | Amber structural emphasis and mono countdown | Show streak, remaining time, and that execution is disabled. |
| Submitting | Dark command band, disabled directional buttons, attempt ID | `SUBMITTING` / `Signing IOC…`; prevent duplicate actions. |
| Confirmed | Neutral or green proof line depending on fill evidence | Separate `TRANSACTION CONFIRMED`, `ORDER ACCEPTED`, `FILL VERIFIED`, and `NO FILL`. |
| Fill unknown | Dashed neutral state | Explain receipt recovery succeeded but indexed fill evidence is not complete. |
| Position unknown | Dashed neutral badge | Never fall back to LIVE because enrichment failed. |
| Settling | Lock/neutral treatment and expiry context | Do not show claimable actions before finalized evidence. |
| Claimable | Strong action treatment with amount and outcome | Show claim scan provenance and one redeem action. |
| Redemption incomplete | Amber/brick recovery panel | `Claims unavailable`; never report “nothing claimable” after partial coverage. |
| Redeemed | Quiet confirmed treatment with transaction proof | Only after receipt and complete post-receipt scan. |

## Loading, Empty, Error, and Proof Rules

- **Discovery loading:** retain table structure, show a neutral loading row, and
  keep the ticket visibly non-executable. Do not show a green live count.
- **Discovery unavailable:** keep the shell, show a single retryable error row,
  and clear stale selected market/book state as the current behavior requires.
- **No eligible markets:** say there are no windows with required headroom; do
  not fabricate a next-window price or countdown.
- **Ticket before selection:** show a concise “Select a verified Trading window”
  state, not a matrix of unexplained dashes.
- **Policy blocked:** keep exact code and reason adjacent to the disabled
  action. The disabled state must be visibly different from loading.
- **Receipt:** default to the mined transaction/fill state, with proof details
  collapsed. For BUY_NO, show either `NO quote → NO fill` or both
  `YES-equivalent quote → YES-equivalent fill` and `NO quote → NO fill`.
- **Zero-fill IOC:** say `TRANSACTION CONFIRMED · NO FILL`; never “trade
  completed” or “filled”.
- **Late receipt:** show transaction confirmation separately from fill proof;
  preserve `FILL UNKNOWN` until a matching positive fill is verified.
- **Redemption:** show scan, submitting, unknown, confirmed, post-receipt
  reconciliation, and redeemed as separate visible states. An incomplete scan
  must block the empty-wallet message and the claim action.

## Spacing and Layout System

Use the existing 8-point rhythm with 4px micro-spacing:

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`

- Max content width: 1280px; 24px desktop gutters, 16px narrow gutters.
- Desktop workspace gap: 24px; ticket internal blocks: 16–20px.
- Section rules: 48px desktop, 32px narrow; avoid stacking multiple large empty
  margins between related state blocks.
- Standard control: 40px; risk input and primary actions: at least 44px;
  mobile directional actions: 48–52px.
- Table row target: about 48px; mobile labelled blocks keep 8–12px row gaps.
- Radius: 0–4px for structural panels; up to 8px only for the Honest Ticket
  and repeated proof items. Do not nest cards inside cards.
- Sticky ticket offset must clear the dark header and never obscure focused
  controls or status messages.

## Motion Rules

- Use motion only to communicate state: live pulse, ticket recalculation,
  submit lock, proof reveal, and cooldown countdown.
- Keep transitions between 150–250ms with ease-out; do not animate prices,
  quantities, or balances as decoration.
- No floating panels, parallax, shimmer-heavy skeletons, gradients, or celebratory
  effects.
- Respect `prefers-reduced-motion: reduce`; disable pulse, slide, and smooth
  scrolling while retaining text/state changes.
- A state change must be understandable without waiting for an animation.

## Accessibility and Contrast Checks

- Preserve visible `:focus-visible` rings with at least 2px contrast against the
  current surface.
- Maintain 44px minimum touch targets for Connect, max loss, Buy, Redeem, Retry,
  and mobile tabs.
- Add/retain `aria-live="polite"` for preview and status updates; use `role="alert"`
  for policy blocks and claim-scan failures.
- Mark the active lifecycle tab with `aria-selected` and a non-color indicator.
- Keep heading order and landmarks intact: header, nav, main, section headings,
  footer.
- Use text, code, border style, and icon/shape together for state. Do not rely
  on green/red alone.
- Verify at every target width that `scrollWidth === clientWidth`, text stays
  inside parent bounds, and no sticky element covers a decisive number.

## Interaction Preservation Map

| Existing interaction | Must remain true after the visual pass |
|---|---|
| Homepage nav, hero CTA, anchors, Docs, Explorer | Same destinations and external-link safety. |
| Market refresh/retry and row selection | Same `loadMarkets()` / `selectMarket()` paths; no unverified row becomes executable. |
| Max-loss input | Same `buildTradeIntent`-derived values; no presentation-only duplicate math. |
| Confirmation checkbox and faucet | Same handlers, honest wallet requirement, and explicit receipt/error states. |
| Connect / chain guard | Same injected provider selection and Shannon 50312 guard. |
| Buy UP / Buy DOWN | Same `execute()` boundary, fresh status/book/params reads, exact order values, and duplicate-submit guard. |
| Receipt details and Copy proof | Same proof data and explorer links; update only wording/layout needed for NO-term clarity. |
| Position tabs and ledger | Same filters and `UNKNOWN`/lifecycle states; no decorative rows. |
| Redeem Claimable | Same scan completeness rules, single-flight guard, receipt reconciliation, and no optimistic success. |
| Retry/recovery controls | Remain keyboard reachable, visible, and available in loading/unavailable states. |

## Explicit Anti-Patterns

- No single-color green wash, neon telemetry, gradients, glassmorphism, or
  decorative blobs.
- No generic SaaS blue buttons, casino language, confetti, gamification, or AI
  landing-page motifs.
- No nested card-soup where every sentence becomes a rounded box.
- No invented market rows, balances, prices, fills, hashes, claim counts, or
  “healthy” telemetry during an outage.
- No optimistic “Trade completed” after a zero-fill IOC.
- No YES-term-only receipt for a BUY_NO proof surface.
- No status-unavailable row styled as Trading, no stale ticket authorization,
  and no fallback from unknown position state to LIVE.
- No horizontal overflow, clipped decisive numbers, hidden action labels, or
  tiny controls below the touch target.
- No new backend, database, dependency, framework, protocol call, or custom
  contract to solve a presentation problem.

## Proposed Implementation Order (After Approval)

1. Token and structural cleanup in `app/style.css`; introduce named classes for
   the current inline presentation rules without changing handlers.
2. Homepage hierarchy pass in `app/index.html`: provenance labels, fewer
   competing containers, tighter mobile narrative, and one primary CTA.
3. Terminal composition pass in `app/terminal.html` and `app/style.css`:
   independent support-column sizing, status-code hierarchy, full mobile stage
   rail, and consistent stage numbering.
4. Presentation-safe `app/app.js` adjustments only where required for visible
   state wording/classes, especially the BUY_NO receipt terms. Do not alter
   order construction, policy logic, SDK usage, or redemption behavior.
5. Add or update `tests/e2e/*` only when a visible selector or interaction
   contract genuinely changes; cover all four target widths and outage states.
6. Re-run local unit/build/syntax/diff/browser checks, then update the status and
   handoff records with exact evidence. No deployment or repository change is
   part of this phase.

### Files expected to change after approval

- `app/index.html`
- `app/terminal.html`
- `app/style.css`
- `app/app.js` only for presentation-safe wiring or confirmed receipt/state-copy defects
- `tests/e2e/*` only if selectors or interaction contracts change
- `design.md` only if the approved visual tokens differ from its authoritative system

### Files that must remain untouched by the visual pass

- `lib/dreamdex/*`
- `lib/steady/*`
- `lib/config/*`
- `scripts/validate/*`
- `tests/unit/*`
- SDK declarations and protocol dependencies
- Historical live-evidence records, private environment files, and deployment configuration

## Measurable Acceptance Criteria

1. First-viewport hierarchy: at 1280px and 768px the homepage presents one
   thesis, one primary terminal CTA, one clearly labelled illustrative preview,
   and a separate historical-proof cue without ambiguity.
2. Terminal hierarchy: at 1280px the ticket remains the dominant decision
   object, the discovery/positions/audit column has no ticket-induced blank gap,
   and network/market status are separately readable.
3. Responsive behavior: screenshots at 1280px, 768px, 390px, and 375px have
   `scrollWidth === clientWidth`, no clipped text, no obscured max-loss value,
   and no hidden stage/action label required for the primary workflow.
4. State honesty: loading, empty, unavailable, blocked, cooldown, zero-fill,
   fill-unknown, claim-incomplete, and redeemed states each have distinct
   text/code plus structural treatment. No state relies on color alone.
5. Receipt correctness: a BUY_NO receipt visibly includes NO-term quote/fill
   semantics while preserving YES-term SDK evidence and exact submitted values.
6. Accessibility: proposed palette ratios remain at or above WCAG AA for body
   text and controls; primary controls are at least 44px; keyboard focus and
   live status announcements remain visible.
7. Interaction safety: existing handlers and domain boundaries remain intact;
   no new protocol calls, mock data, backend, dependency, or secret appears.
8. Verification after implementation: `npm test`, `npm run build`,
   `node --check app/app.js`, `git diff --check`, and the available Playwright
   suite pass. A presentation-only pass does not create fresh live protocol
   evidence; `npm run validate` remains separately labelled.

## Unresolved Questions Before Implementation

1. Approve the deep-green token proposal, or keep the current ink token and use
   green only for actions and verified states?
2. Should the homepage preview retain concrete illustrative numbers, or should
   it use a visibly annotated example treatment with no “Live” badge?
3. At 390/375px, should the four-stage rail become a two-by-two grid (recommended
   for full scanability) or remain a horizontally scrollable rail with an
   explicit continuation cue?
4. Should the expanded receipt show both YES-equivalent and NO-term rows by
   default for BUY_NO, or show the NO-term row first with YES terms beneath it?
5. If approved tokens differ from `design.md`, may that authoritative document
   be updated in the implementation phase before CSS changes land?

## Exact Next Action

Stop after this audit and request approval on the visual direction and the five
unresolved questions above. No application code has been changed in Phase 1.
