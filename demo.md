# Steady Demo — 2–3 Minute Shot Plan (record on production URL)

Target: 2:40. One story: **problem → Steady → decision → policy → execution → proof → discipline → why it matters.** No architecture narration.

Preconditions (verify before recording): production URL loads; indexer reachable (`npm run validate` gates 1–4 PASS); wallet funded (STT + tUSDC via ticket faucet); a BTC/ETH 1h/4h window with >10m headroom and visible book; screen recorder capturing browser + mic; resolution 1280×800; hide bookmarks/password managers.

| Time | Screen / action | Voice-over (say this) | Viewer must notice |
|------|-----------------|----------------------|--------------------|
| 0:00–0:15 | Homepage hero | "Prediction markets make the click easy. The decision is the hard part. Steady is a discipline-first terminal for DreamDEX Event Contracts — know the downside before you enter." | Thesis in one sentence; testnet badge |
| 0:15–0:30 | Scroll: problem + 4-stage loop | "Every competitor makes trading faster. Nobody makes it accountable. Steady runs decide, check, execute, verify on every trade." | DECIDE→CHECK→EXECUTE→VERIFY steps |
| 0:30–0:50 | Terminal: live windows rail | "Live BTC and ETH windows, Trading status verified on-chain, countdown, real bid and ask. This is the DreamDEX order book, not a mock." | Countdown ticking, bid/ask numbers |
| 0:50–1:10 | Click market → Honest Ticket, type max loss 2 | "I state the most I can lose — two tUSDC. The ticket converts it to quantity, pay, payout, and spread. Max loss is the biggest number here." | Pay → win line; max-loss figure largest |
| 1:10–1:25 | Policy gate box | "Before anything signs, policy decides: market Trading, headroom, liquidity, spread, balance, discipline. Denials carry exact codes." | 6 checks + Authorized badge |
| 1:25–1:55 | Click Buy UP → Rabby/MetaMask popup → confirm → hash appears | "One signature. Immediate-or-Cancel — fills what crosses, cancels the rest." Pause for popup; resume on hash. | Popup (crop generously); tx hash + explorer link |
| 1:55–2:10 | Receipt + position row | "Quoted 0.049, filled 0.021 — the taker pays the fill, not the quote. Steady shows both, with order and fill IDs." | Quoted vs actual; fill row LIVE |
| 2:10–2:25 | Calibration + cooldown + redemption | "Losses are scored with Brier, not hidden in PnL. Two in a row and the terminal blocks you for three minutes. Winnings are claimed, not auto-credited — one click redeems." | Brier bar; cooldown panel (or honest n<5 state); redeem scan |
| 2:25–2:40 | Homepage proof block → CTA | "Every claim links to a mined hash. Discipline is retention infrastructure: fewer blowups, more lifetime volume for DreamDEX. Open the terminal." | Proof hashes; final CTA |

Fallbacks (do not fake): if book is empty → show honest empty-book state and pick next window on camera; if settlement hasn't occurred → show Finalized scan + prior redeem tx `0x3aa5ec…`; if indexer lags → show timeout + Retry (reliability is part of the story).

Must NOT appear: password manager popups, other tabs, localhost URLs, `.env`/keys, Discord/Telegram notifications (enable Do Not Disturb).
