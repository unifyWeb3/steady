# 57 — Final Interaction Audit (delta vs research/47; terminal reconstructed since)

Re-checked every control in current `app/terminal.html` + `app.js` + `app/index.html`:

- Open terminal (×2), How it works, Read docs, View tx, Explorer, Home: all navigate, no dead links. PASS.
- Connect: Rabby `providers[]` + MetaMask single + wrong-chain switch/add + disconnect/reconnect via reload. Mock-Rabby browser PASS; real popup UNVERIFIED (manual boundary documented).
- Market Select: populates ticket + book + params; book revert → "Book error" (not crash). Needs reachable indexer (environmental).
- Refresh / Retry: `window.loadMarkets` global verified; error card Retry present; 15s auto-retry only when visible.
- Max-loss input: drives side-aware preview (UP=YES/DOWN=NO, lot caption fixed). Invalid → inline error, no execution.
- Buy UP / Buy DOWN: single `execute()` boundary; 19 mapped failure states; SUBMITTING disables both; cooldown blocks with seconds. Popup signing UNVERIFIED; everything around it browser-proven.
- Confirm checkbox: hard gate (alert if unchecked).
- Tilt bar/countdown: renders from real streak; expiry auto-clears + localStorage.
- Trade receipt: renders post-tx with quoted/actual/policy/tx/order links; labeled policy-at-execution.
- Tabs (7): filter fills; empty → honest empty row.
- Redeem claimable: Finalized scan + balances; redeem LIVE-PROVEN via harness; browser button wired to scan (per-market redeem buttons: N/A by design — one scan + guided redeem; acceptable, documented).
- Oracle links: per-market graph URLs.
- No dead buttons found. No label contradicts behavior. Mobile: actions thumb-reachable, no overflow at 375px.
