# 61 — WalletClient Redemption (backend track, 2026-09-06)

**Problem:** browser "Redeem Claimable" only scanned `listPastBinaryMarkets({Finalized})`
and rendered rows — no write path. `lib/dreamdex/redemption.ts` took `privateKey`
only, so the browser could never call it. Positions tabs CLAIMABLE/WON/LOST/VOID
had no resolver behind them (audit §2).

**Verified SDK surface (0.29.0, all LIVE-PROVEN by Gate 6 unless noted):**

| Call | Source | Notes |
|---|---|---|
| `client.getClaimable(account)` → `ClaimablePosition[]` | `somniaMarketsClient.d.ts:456-466`, `derivedReads.d.ts:253-276` | `{marketId, pool, outcomeIdx 0\|1, amount, estPayout, status}` — shaped for `redeemMany`. Losers/trading omitted. **Gate 6 PASS 2026-09-06: 3 claimable on funded wallet** (2005000000 / 1243000 / 1000 raw). |
| `trader.redeemMany({entries})` | `trade.d.ts:1341-1371` | ONE tx, all-or-nothing. CODE-EXISTS (harness Gate 5 proves `placeOrder`; redeemMany shares `createTrader` + write pipeline — live redeem to be captured in demo). |
| `trader.redeem({marketId, amount, outcomeIdx?})` | `trade.d.ts:1292-1335` | Module-routed; `outcomeToken`/`module` auto-looked-up. Old `marketAddress` plumbing deleted. |
| `createTrader({walletClient})` | `trade.d.ts:15-36` | Same call the browser `execute()` already uses — redeem works through the popup with zero new auth. |
| `getOutcomeBalance({outcomeToken, account, id})` | `binary/portfolio.d.ts:279-286` | Singleton + `yesId`/`noId` from `getMarketOnchain` (`markets.d.ts:904-956`). |
| `MarketStatus` | `markets.d.ts:924` | 0 Listed · 1 Trading · 2 Locked · 3 Settling · 4 Resolved · 5 Voided. `winningOutcome` meaningful ONLY when `isResolved` (contract defaults 0). |
| New windows observed | Gate 2 live 2026-09-06 | 14400s (4h), 86400s (1d), 3888000s (45d) BTC/ETH now listed. App/harness filters still 60/300/900/3600 — **frontend call whether to surface 4h/1d** (4h already recommended for demo headroom). |

**Shipped (backend track, no `app/` edits — frontend session owns those):**
- `lib/dreamdex/redemption.ts` — `buildRedeemEntry` (pure, throws on zero/bad),
  `entriesFromClaimable`, `getClaimable`, `redeemMany(client, signer, entries)`,
  `redeemAllClaimable` (scan → one tx; `redeemed:false` when empty, never throws),
  legacy `redeemWinning` fixed to module-routed form.
- `lib/steady/positionState.ts` — pure `resolvePositionState()` emitting ONLY
  `LIVE|SETTLING|CLAIMABLE|WON|LOST|VOID` (see file header for rules).
- `tests/unit/positionState.test.mjs` (10) + `tests/unit/redemption.test.mjs` (6).
  Suite now **29/29 PASS** (was 13).
- `scripts/validate/validate.mjs` — **Gate 6** `getClaimable` read-only scan
  (funded wallet when key present, else zero address expecting `[]`).

**Wiring contract for the frontend session** (`app/app.js`, vanilla port — `lib/` is TS):
```js
const claimable = await ex.client.getClaimable(walletAddress);   // ClaimablePosition[]
const entries = claimable.filter(c => BigInt(c.amount) > 0n)
  .map(c => ({ marketId: c.marketId, outcomeIdx: c.outcomeIdx, amount: BigInt(c.amount) }));
if (!entries.length) { /* honest empty state */ return; }
const trader = ex.client.createTrader({ walletClient });
const res = await trader.redeemMany({ entries });                // ONE popup, ONE tx
```
Positions: port `resolvePositionState` verbatim (pure, no imports) and feed it
`getMarketOnchain` (status/isResolved/isVoided/winningOutcome) + `getOutcomeBalance`
×2 per fill; `redeemed:true` after a mined redeem. This makes every tab live.

**Do NOT:** run `validate:write` casually (spends real tUSDC/STT); redeem the 3
live claimables except on camera for the demo; mock `getClaimable` anywhere.
