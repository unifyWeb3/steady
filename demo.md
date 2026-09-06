# Steady Demo — Recordly Checklist + Voiceover Script + Remotion Direction

**Target:** 2:40 final cut. **Workflow:** (1) record with Recordly — screen + your voice, testing every function live; (2) drop the clips in a folder; (3) Claude + Remotion edits, adds visuals/voice polish/subtitles using this file as direction. One story: **problem → Steady → decision → policy → execution → proof → discipline → why it matters.** No architecture narration.

## Pre-flight (do once, before pressing record)

- [ ] `npm run validate` gates 1–4 PASS (indexer reachable — else reschedule; do not record the outage path as the main flow)
- [ ] Production URL loaded: `https://somnia-snowy.vercel.app` (record production, not localhost)
- [ ] Wallet funded: STT for gas + tUSDC (use the ticket faucet button if empty — record that click, it's part of onboarding)
- [ ] A BTC/ETH **1h or 4h** window live with >10m headroom and a visible book (no expiry pressure on camera)
- [ ] Do Not Disturb on; bookmarks bar hidden; resolution 1280×800; mic check in Recordly
- [ ] Decide max loss for the demo trade: **2 tUSDC**

## Recordly checklist (record in this order, pause between shots)

| # | Screen (URL + scroll position) | Action on camera | Voiceover (say while doing it) | What must be visible |
|---|---|---|---|---|
| 1 | Homepage top | Slow scroll hero → proof block | "Prediction markets make the click easy. The decision is the hard part. Steady is a discipline-first terminal for DreamDEX Event Contracts — know the downside before you enter." | Thesis headline, testnet badge, proof hashes |
| 2 | Homepage: 4-stage loop | Scroll through DECIDE → CHECK → EXECUTE → VERIFY | "Every trade runs four stages: decide what you can lose, check policy, execute one IOC, verify the fill. Nothing signs before policy passes." | All four steps |
| 3 | Terminal top (fresh load) | Let rail load; point at countdown + bid/ask | "Live BTC and ETH windows on Somnia Shannon. Trading status verified on-chain, countdown, real bid and ask — this is the DreamDEX book, not a mock." | Countdown ticking, bid/ask numbers |
| 4 | Click a 1h/4h market | Click Select; book + params load | "I pick a window with headroom. The ticket reads the live book and the tick grid." | Selected row highlighted, ticket populated |
| 5 | Honest Ticket | Type max loss 2; read the ticket aloud | "I state the most I can lose — two tUSDC. It converts to quantity, pay, payout, and spread. Max loss is the biggest number here." | Pay → win line; max-loss figure largest |
| 6 | Policy gate box | Hover each check slowly | "Before anything signs: market Trading, headroom, liquidity, spread, balance, discipline. A denial names its code — never 'something went wrong'." | 6 checks + Authorized badge |
| 7 | Click Buy UP → wallet popup → confirm | Click, pause for popup, confirm, wait for hash | "One signature. Immediate-or-Cancel — fills what crosses, cancels the rest." (pause during popup; resume on hash) | Popup (crop generously), then tx hash + explorer link |
| 8 | Receipt + position row | Scroll receipt; open explorer link in new tab briefly | "Quoted 0.049, filled 0.021 — the taker pays the fill, not the quote, and Steady shows both, with order and fill IDs." | Quoted vs actual; fill row LIVE |
| 9 | Calibration + tilt panel | Scroll score section | "Losses are scored with Brier, not hidden in PnL. Two in a row and the terminal blocks you for three minutes. If I have fewer than five settled, it says so instead of inventing a score." | Brier bar or honest n<5 state |
| 10 | Settlement scanner → redeem | Scan Finalized; redeem a winner if present (else show prior redeem `0x3aa5ec…`) | "Settled markets leave the live list, so winnings hide. Steady scans Finalized positions and redeems in one click — with the hash." | Finalized list; redeem tx or prior proof |
| 11 | Homepage proof → CTA | Back to homepage, end on CTA | "Every claim links to a mined hash. Fewer blowups means more lifetime volume for DreamDEX. Open the terminal." | Proof block; Open-terminal button |

## Fallbacks (do not fake — record the honest path)
- Empty book → keep the "no liquidity, try next window" state on camera and pick the next window; it proves honesty.
- Settlement not yet occurred → show the Finalized scan + the prior redeem hash; say so out loud.
- Indexer hiccup → show timeout + Retry once (reliability is part of the story), then continue when green.

## Must NOT appear in any clip
Password-manager popups, other tabs, localhost URLs, `.env`/keys, Discord/Telegram notifications, wallet seed phrases (blur the full address everywhere except first-6…last-4).

## Folder for Remotion (what you hand over)
- `01-homepage.mp4` (shots 1–2) · `02-discovery.mp4` (3–4) · `03-ticket-policy.mp4` (5–6) · `04-execution.mp4` (7) · `05-proof.mp4` (8–10) · `06-close.mp4` (11)
- Recordly voice track (your live narration — keep it; Remotion polishes, not replaces)
- This file as direction. Target 2:40; see `demo-editing.md` for cuts/captions/callouts.
