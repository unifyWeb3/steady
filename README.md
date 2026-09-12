# Steady - Know the downside before you enter.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-82%20passing-10b981)](#tests)
[![Shannon testnet](https://img.shields.io/badge/Somnia%20testnet-50312-amber)](https://shannon-explorer.somnia.network)
[![SDK](https://img.shields.io/badge/markets--sdk-0.29.0-blue)](https://www.npmjs.com/package/@somnia-chain/markets-sdk)

### Discipline-first terminal for DreamDEX Event Contracts - max loss before entry, policy before execution, proof after every fill.

Most prediction-market terminals answer one question: *how fast can you click?* Steady answers the harder one - **do you know what you can lose, is this trade allowed, and can you prove what actually filled?** Every trade carries a **Trade Receipt**: quoted vs actual fill price, policy checks, tx hash, order and fill IDs. And after 2 consecutive real losses, the terminal **blocks execution for 3 minutes** - not as a tooltip, as a gate at the signing boundary. Built on **DreamDEX Event Contracts** on **Somnia Shannon (50312)**.

**[Watch the demo ↗](#demo)** · **[Live demo ↗](https://somnia-snowy.vercel.app)** · **[How it works ↗](#architecture)** · **[Run it locally ↗](#run-it-locally)**

---

## ▶ Demo

[![Watch the Steady demo](https://img.youtube.com/vi/yVlSUNUJwaA/hqdefault.jpg)](https://youtu.be/yVlSUNUJwaA)

*Click the preview to watch the full demo on YouTube. It was recorded against the production build on Shannon testnet (screen + voice): connect → live BTC window → max-loss ticket → policy PASS → wallet signature → mined IOC → receipt → fill → position → Finalized redemption. Try the same flow live at **[somnia-snowy.vercel.app](https://somnia-snowy.vercel.app)**.*

The trade that sells it: quoted **0.049**, filled **0.021** - the taker pays the fill, not the quote, and Steady shows both: [`0xed05c…72464c`](https://shannon-explorer.somnia.network/tx/0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c). Then the losing side of the same wallet sits unclaimed until the Finalized scan finds it and one click redeems it: [`0x3aa5ec…77444`](https://shannon-explorer.somnia.network/tx/0x3aa5ec79dc9542633545645b540ec9d45c5a470ea86d8c8eb33054cbc1e77444).

---

## Table of contents

- [The problem I set out to solve](#the-problem-i-set-out-to-solve)
- [What I built](#what-i-built)
- [Architecture](#architecture)
- [The trade loop, step by step](#the-trade-loop-step-by-step)
- [How I integrated DreamDEX Event Contracts](#how-i-integrated-dreamdex-event-contracts)
- [Engineering decisions & the hard problems](#engineering-decisions--the-hard-problems)
- [What's real vs not-yet - the honesty table](#whats-real-vs-not-yet--the-honesty-table)
- [The app](#the-app)
- [Tech stack](#tech-stack)
- [Project layout](#project-layout)
- [Run it locally](#run-it-locally)
- [Deployed](#deployed)
- [Tests](#tests)

---

## The problem I set out to solve

Short-window binary markets (1m-1h) on a 10ms zero-fee chain maximize *execution speed* while leaving *decision quality* at zero. Price looks like a number, max loss is hidden, two losses trigger a revenge trade, winnings sit unclaimed because settled markets vanish from the live list, and the quote is never what you paid.

That last one is the problem. A terminal that shows a price but charges a fill - without ever reconciling the two - is asking for faith. "It probably filled near the quote" is not good enough when real money moves on the difference.

So I treated **accountability as the product**, not a feature. The non-negotiable design rule: **policy before execution.** A trade is evaluated (market, headroom, liquidity, spread, balance, discipline) *before* any signature is requested - so the receipt under every fill is honest by construction, not a label slapped on after the fact.

## What I built

A discipline-first execution shell where every trade carries its proof:

1. **Decide** - Honest ticket: enter max loss → quantity/pay/payout computed with tick/lot snapping. UP = YES outcome, DOWN = NO outcome. Max loss is the largest number on the ticket.
2. **Check** - policy gate at the execution boundary runs *before* the wallet is asked. Denials carry exact codes (`SPREAD_TOO_WIDE`, `COOLDOWN`, `ImmediateOrCancelNoFill`). The frontend cannot bypass it - there is exactly one `execute()` path to `placeOrder`.
3. **Execute** - real Immediate-or-Cancel IOC (orderType 2) with expiry now+120s capped at marketExpiry-10s in nanoseconds. One `tradeAttemptId`, double-submit guard, UNKNOWN-state reconciliation on timeout (receipt poll, never FAILED without proof).
4. **Verify** - every fill renders a **Trade Receipt**: quoted vs actual price, policy result, tx hash, order and fill IDs, explorer links. Positions reconcile via `getUserFills`; settlement via Finalized scan + ERC-6909; redemption is one click.
5. **Discipline** - Brier score + Edge over real settled fills (honest "Need 5 settled" below threshold); 2 consecutive real losses block execution for 3 minutes, enforced where signing happens.

**A note on what's honest about the demo.** The headline transactions are mined on Shannon and linked above - verify each on the explorer. The wallet-signing path is proven both directions via `createTrader({walletClient})` (`0x6f6beb…`, `0x882858…`) plus browser-originated corroboration (`0xf70bc9…`, `0xd8000f…`); the on-camera human signature is the demo video itself. Tilt cooldown is unit-verified and fires on real outcomes; the demo shows the armed gate and a denial state rather than a staged trigger. I say all of this plainly in [the honesty table](#whats-real-vs-not-yet--the-honesty-table) rather than pretend otherwise.

## Architecture

```
User → Ticket → Policy gate → Wallet sign → DreamDEX CLOB → Receipt → Fill → Position → Settlement → Redeem
                  (DENY with      (IOC-2,      (quoted vs
                   code)           nanos)       actual)
```

The gate is enforced in the single `execute()` boundary before `trader.placeOrder` is ever called - so a blocked trade can't reach the wallet even by accident. Retries, tabs, and double-clicks all funnel through the same guard with the same `tradeAttemptId`.

| Contract | Role |
|---|---|
| `BinaryMarketsModule` | market lifecycle + complete-set mint/redeem (`0x3ecC69…`) |
| Binary pool (per window) | the CLOB; recycled across windows, so state is keyed by `marketId`, never pool |
| `OutcomeToken6909` | shared singleton for YES/NO positions; balances are the source of truth for redemption |
| OracleHub + question graph | settlement median with per-source receipts, deep-linked per market |

## The trade loop, step by step

This is what `execute()` does, and every step assumes the book might have moved since the quote:

1. **Intent** - side + max loss + `tradeAttemptId`; buttons disable (no duplicate).
2. **Market validation** - `getMarketOnchain`: status must be `1` (Trading); headroom ≥60s or the trade is refused with guidance.
3. **Quote** - live best ask +0.02 cross, tick-snapped; quantity from max loss, lot-snapped; empty book refuses honestly (`ImmediateOrCancelNoFill`).
4. **Policy** - spread, balance, discipline streak evaluated; any DENY names its code.
5. **Sign** - wallet prompt (Rabby/MetaMask on 50312); rejection is a clean failure state, not an error.
6. **Receipt** - hash + status + explorer link immediately; fill follows via `getUserFills` (~3s indexer lag, polled).
7. **Reconcile** - quoted vs actual compared and displayed; timeout without hash evidence becomes UNKNOWN + receipt poll, never FAILED.

The contrast that sells it: quote **0.049**, fill **0.021** on [`0xed05c…72464c`](https://shannon-explorer.somnia.network/tx/0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c) - every other terminal implies quote = fill; Steady proves they differ.

## How I integrated DreamDEX Event Contracts

Every capability is wired through the real venue, not faked:

- **Live venue, not fixtures.** The board streams real binary markets (BTC/ETH, 1m/5m/15m/1h) from the DreamDEX indexer, filtered to `status 1` rows re-validated on-chain, sorted by time-to-close. When the venue rolls, the UI rolls with it.
- **On-chain order-book execution.** Taps become real CLOB IOC orders (YES for UP, NO for DOWN in YES-terms pricing) against the market's pool. No paper trading, no simulated fills - the receipt hash on every ticket is a Shannon explorer link.
- **Native settlement semantics.** UP wins at/above the window open, DOWN below; voids pay 0.5 both sides. Claims and history key off `isResolved`/`isVoided`/`winningOutcome` read straight from `getMarketOnchain`.
- **Faucet-native onboarding.** Testnet tUSDC faucet (`trader.faucet()`, 10k cap) is a button in the ticket - a judge goes from landing to funded with one signature.
- **Redemption that finds winnings.** Settled markets leave the live list, so Steady scans `listPastBinaryMarkets({status:"Finalized"})` + ERC-6909 balances - the winnings other UIs leave stranded.

## Engineering decisions & the hard problems

- **Policy at the boundary - the one rule everything else serves.** All writes flow through one `execute()`; the UI cannot bypass the gate by calling the trader directly because no other path exists.
- **"Verified" had to mean something.** An early receipt showed the quoted price as the fill. I rewrote it to poll `getUserFills` after mining and display both - so quoted-vs-actual is chain truth, not decoration.
- **The FOK bug - my favorite catch.** The first live order used orderType 1 (FillOrKill) with a non-crossing price and reverted `FillOrKillNotFillable`. IOC takers want orderType **2** with a crossing price. The harness failure taxonomy now maps every live revert we hit (`InvalidPrice`, `PriceOutOfBounds`, `ImmediateOrCancelNoFill`, `0xfb8f41b2`).
- **`getOutcomeBalance` takes `{outcomeToken, account, id}`** - not `owner`. The error (`Address "undefined" is invalid`) hides the cause; our redemption layer documents the correct shape.
- **Shell decoupled from data.** Static top-level SDK imports (~10s over esm.sh) once blocked the whole page. The SDK now lazy-loads; the shell boots instantly with explicit loading/error/retry states, and a 12s indexer timeout degrades to an honest error card - the app never blanks.
- **UNKNOWN, not FAILED.** A submission timeout with a possible hash reconciles via receipt poll instead of claiming failure - a financial-systems pattern most hackathon frontends skip.

## What's real vs not-yet - the honesty table

| Capability | How it's backed |
|---|---|
| **Live markets + books** | Real DreamDEX indexer + on-chain reads; 12s timeout + Retry on outage. |
| **IOC execution both directions** | Mined: `0xed05c…` (privateKey path), `0x6f6beb…` + `0x882858…` (walletClient path, same call the browser uses), plus browser-originated `0xf70bc9…` / `0xd8000f…`. |
| **Browser-popup signature** | Proven via the paths above; the on-camera human signature is the demo video itself. The mock test rig throws honestly on signing instead of faking a hash. |
| **Redemption** | Mined: `0x3aa5ec…` (balance 1000→0, +0.001 tUSDC). 2 further claimables preserved for the demo camera. |
| **"Verified" fill prices** | `getUserFills` chain reads, not flags. |
| **Tilt cooldown** | Unit-verified + fires on real outcomes; demo shows the armed gate and denial states, not a staged trigger. |
| **Brier/Edge** | Real math, honest "Need 5 settled" below threshold. |
| **Faucet** | Real `trader.faucet()` (10k cap), mined `0xb0bd7b…`. |
| **Production build** | `somnia-snowy.vercel.app` serves the verified release commit; read-only smoke 15/15 with zero console errors. |

## The app

Two surfaces, one design system (warm paper, ink, JetBrains Mono, risk typographically loudest):

- **Homepage** (`/`) - thesis, problem, DECIDE→CHECK→EXECUTE→VERIFY loop, live proof hashes, terminal CTA.
- **Terminal** (`/terminal`) - live windows rail, Honest Ticket with policy gate, positions lifecycle ledger, calibration + cooldown, settlement/redemption scanner, per-trade receipts.

## Tech stack

- **App:** static `app/` (no framework, no backend, no database) - ships as `dist/` to Vercel.
- **Engine:** `lib/dreamdex/*` (real SDK integration) + `lib/steady/*` (pure ticket/scoring/discipline/lifecycle, dependency-free, unit-tested).
- **Chain:** DreamDEX Event Contracts on Somnia Shannon 50312 via `@somnia-chain/markets-sdk@0.29.0` + `viem`.
- **Tests:** node:test - 82 unit tests across 14 suites (ticket, scoring, discipline, fills, redemption, dom, request generations) + Playwright browser suite with 11 scenarios (homepage, terminal, blocked controls, wrong-chain rejection, stale selection, NO-term receipt, overflow).

## Project layout

```
app/                          # static frontend (index.html, terminal.html, app.js, style.css)
  index.html                  # homepage: thesis → loop → discipline → proof → CTA
  terminal.html               # dashboard: rail + ticket + positions + score + settlement
  app.js                      # single execute() boundary, lazy SDK import, reconciliation
lib/
  dreamdex/                   # client · markets · orderbook · execution · positions · settlement · redemption
  steady/                     # ticket · scoring · discipline · lifecycle (pure, tested)
  config/                     # chain 50312 + env contract (no secrets in browser vars)
scripts/validate/             # live harness: gates 1–4 + 6 against Shannon (no mocks)
tests/unit/ · tests/e2e/      # unit + Playwright browser suite
research/                     # 00–70 audit trail: rules → protocol → product → control plane → readiness
FEEDBACK.md                   # SDK/docs feedback for the DreamDEX team
demo.md · demo-editing.md     # recording shot plan + editor handoff
```

## Run it locally

**Prerequisites:** Node 20+, a Rabby/MetaMask wallet (for trading; reads work without one).

```bash
npm install
npm test                # 67 unit tests, no keys required
npm run validate        # live read gates 1–4 + 6 against Shannon (indexer + chain)
npm run dev             # http://localhost:5173 - homepage + terminal
npm run build           # static dist/
```

No env vars required for reads. Funded writes need `TEST_WALLET_PRIVATE_KEY` in local `.env` (never committed, never `NEXT_PUBLIC_*`) - see `.env.example`. Get test STT/tUSDC from the in-app faucet button or the Telegram dev group faucet topic.

Without a wallet, Steady runs end-to-end in **read mode** - live markets, books, ticket math, honest empty states. Trading actions explain exactly what they need instead of failing silently.

## Deployed

Static output: `npm run build` copies `app/*` to `dist/` plus browser-safe `lib/` modules and a generated `runtime-config.js`; `vercel.json` points there. Production: [somnia-snowy.vercel.app](https://somnia-snowy.vercel.app) - auto-deploys from `main`, verified serving the release commit (artifact bytes match local build, `/runtime-config.js` live, read-only smoke 15/15 with zero console errors, no localhost refs, no secrets). No env vars, no server, no database - the chain is the backend.

## Tests

```bash
npm test                                              # 82 passing across 14 suites (ticket, scoring, discipline, fills, redemption, dom, generations)
npx playwright test tests/e2e --reporter=line --workers=1 --timeout=60000   # 11 browser scenarios; requires Node 20+ and Chromium
```

The suite covers max-loss math, tick/lot snapping, Brier/Edge (including the <5 honest state), the 2-loss cooldown state machine, partial-fill accounting, fresh-balance policy proof, and redemption reconciliation. Beyond unit tests, the flow is verified end-to-end against the **live** stack - discover → gate → IOC → receipt → fill → redeem - with the mined hashes linked above.

---

Testnet only. Not financial advice. MIT - see [LICENSE](LICENSE).
