# 20 — Demo Strategy (2:40 target)

Total 3:00 max. Rehearse to 2:40.

## 0:00–0:20 Problem
"You can bet BTC Up or Down in 15 minutes on DreamDEX. It's fun — and it's built to make you overtrade. Price is probability, windows die every 15m, and after two losses most people chase."

Visual: DreamDEX app scroll, 15m window flipping, PnL going negative.

## 0:20–0:40 Why current sucks
"DreamDEX is blazing fast (10ms) but shows you a price, not a max loss. It hides whether you're good or lucky, and it leaves winnings unredeemed. The boring-but-true fixes are buried in 13 gotchas."

Visual: highlight gotchas #1, #10, #9.

## 0:40–1:20 Product workflow (Live)
- Connect wallet → live BTC/ETH windows with time left, spread, depth.
- Pick BTC 15m (9:12 left) → ticket says "Max loss 25 → Pay 22.4 to win 40 if UP, expires 8:47, spread 0.02".
- Show pre-checks (on-chain Trading, lot snap, balance).
- Sign IOC → tx hash appears → position in Live.

## 1:20–1:50 Real DreamDEX interaction (settlement & redeem)
- Switch to Positions → one window Settling → one Claimable (void 0.5 example).
- Click Redeem all → tx → tUSDC bumps.
- Open oracle graph link for one market (prd.oracle.../questions/{id}?view=graph) → median + sources.

## 1:50–2:15 What makes this different
- Score strip: Brier 0.31 / Edge -4.2 → "Tilting" badge after 2 losses → trade disabled 2:43 + checkbox "I see my Brier".
- Compare to Sluice/PredictArena: "They make you faster or rank you. We make you slower. That's why you survive."

## 2:15–2:40 Ecosystem / future
- Retention story: fewer blowups = more sessions = more lifetime volume + more redeems.
- Roadmap: paper calibration, session-key copy, market health.
- Close on testnet tx + GitHub + "Steady is on Shannon now — same code runs on mainnet."

## Backup plan
If book empty or network lags: cut to pre-recorded fill with tx hash overlay, still show live book empty state honestly ("no liquidity — next window in 4m").

