# 47 — Interaction Audit (every control, verified against source)

Legend: OK = works/exercised, HONEST-BLOCK = correctly refuses, UNVERIFIED = code exists, needs live click.

## Homepage (`app/index.html`)
| TEXT | LOCATION | INTENDED → ACTUAL | DEPS | SUCCESS | FAILURE → RECOVERY | STATUS |
|------|----------|-------------------|------|---------|-------------------|--------|
| Open terminal (hero + final CTA) | hero, final | → terminal.html → loads | none | terminal renders | 404 → fix link | OK (browser PASS) |
| How it works | hero | → #how anchor | none | scrolls | — | OK |
| Read docs | final | → docs.dreamdex.io | network | docs open | offline → browser error | OK |
| View tx → | proof block | → explorer 0xed05c… | network | explorer tx | — | OK |

## Terminal (`app/terminal.html` + `app.js`)
| TEXT | LOCATION | INTENDED → ACTUAL | DEPS | SUCCESS | FAILURE → RECOVERY | STATUS |
|------|----------|-------------------|------|---------|-------------------|--------|
| Connect | header | eth_requestAccounts → addr + chain guard 50312 → tUSDC → fills | window.ethereum | "Connected …" + fills | No provider → alert install; wrong chain → switch/add; reject → "Connect failed" | OK (mock-Rabby browser PASS; real popup UNVERIFIED) |
| Home / Explorer ↗ | header | nav / explorer | none | navigates | — | OK |
| Refresh | discovery | re-run listLiveBinaryMarkets + onchain gate | indexer+RPC | rows update | timeout → error card + Retry + auto-retry 15s | OK (timeout path browser-proven) |
| Market row Select | discovery rows | select → book+params+preview | RPC | ticket populates | book revert → "Book error" | UNVERIFIED (needs reachable indexer; empty-book path TEST-PROVEN via 0xd48c4403 harness) |
| Retry | error card | window.loadMarkets() (global exposed) | — | reload attempt | still down → error again (no loop) | OK (present in timeout HTML) |
| Max loss input | ticket | drives computeTicket preview | selected+bookParams | Pay/win/profit/qty update | invalid → inline error | OK (browser PASS render; math TEST-PROVEN 13/13) |
| Buy UP | ticket | BUY_YES IOC via policy→sign→tx→receipt→fill | wallet+market+book+policy | hash + receipt + fill row | 19 mapped states incl. COOLDOWN/SPREAD/EMPTY/UNKNOWN — each with exact message | UNVERIFIED (popup; Node same-call LIVE-PROVEN both directions) |
| Buy DOWN | ticket | BUY_NO IOC (YES-terms price) | same | same | same + PriceOutOfBounds guard | UNVERIFIED (same) |
| Confirm checkbox | ticket | required ack gate | — | enables execution path | unchecked → alert | OK |
| Tilt bar + countdown | ticket | shows cooldown + blocks buttons | localStorage + settled calls | buttons disabled with reason | expiry → auto-clear | PARTIAL (logic TEST-PROVEN; live 2-loss sequence not yet observed — only 1W/1L on record) |
| Trade receipt | ticket | per-trade proof (quoted vs actual, policy codes, tx/order links) | executed trade | renders | — | OK (renders post-tx; content verified on 0xed05c… data) |
| Tabs ALL/LIVE/…/VOID | positions | filter fills by derived state | fillsCache | rows filter | no rows → honest empty | OK |
| Redeem claimable | positions | Finalized scan → balances → per-market redeem | wallet+indexer+RPC | tx + balance delta | none claimable → "Found N — checking balances" (honest) | PARTIAL (scan browser-wired; redeem LIVE-PROVEN via harness 0x3aa5ec…) |
| Oracle graph links | settlement | prd.oracle…/questions/{id} | network | graph opens | — | OK |
| Tabs nav (Markets/Ticket/…) | terminal header rail | anchor scroll | none | scrolls | — | OK (present; anchor behavior standard) |

## Dead-control check
No decorative controls found. Every button maps to exactly one handler in `app.js` Events section. `scoreDetail`/`brierLabel` elements referenced but commented in latest reconstruction — dead *display* refs guarded with `&&` (no crash). No control promises what it doesn't do.
