# 64 — Final Interaction Matrix

| Control | Rendered | Handler/action | Success state | Error/recovery | Mobile/browser result |
|---|---:|---|---|---|---|
| Homepage Open terminal (header) | Yes | `terminal.html` | terminal | browser 404 | source verified |
| Homepage Open terminal (hero) | Yes | `terminal.html` | terminal | browser 404 | source verified |
| Homepage How it works | Yes | `#how` anchor | scroll | none | source verified |
| Homepage Discipline | Yes | `#discipline` anchor | scroll | none | source verified |
| Homepage Proof | Yes | `#proof` anchor | scroll | none | source verified |
| Homepage Read docs | Yes | external docs | docs page | network error | source verified |
| Homepage Explorer links | Yes | explorer | explorer | network error | source verified |
| Terminal Markets/Ticket/Discipline/Positions/Audit nav | Yes | anchors | scroll | none | source verified |
| Connect | Yes | injected wallet connect | address + client | alert/status failure | mock only; real popup unverified |
| Home | Yes | `index.html` | homepage | 404 | source verified |
| Refresh | Yes | `loadMarkets` | rows or empty/error | timeout + Retry | current indexer unavailable |
| Generated Retry | Conditional | `window.loadMarkets` | new read | error card | source verified |
| Market row click | Conditional | `selectMarket` | ticket/book | “Book error” | live row unavailable today |
| Market Select button | Conditional | `selectMarket` | same | same | source verified |
| Max loss input | Yes | `updatePreview` | numbers | inline math error | source verified; DOWN mismatch |
| Confirm checkbox | Yes | checked in `execute` | permits attempt | alert if unchecked | source verified |
| Get 10k test tUSDC | Yes | `trader.faucet` | receipt/balance | faucet failed | real popup unverified |
| Buy UP | Yes | `execute(BUY_YES)` | receipt/fill/position | policy, revert, UNKNOWN branches | real popup unverified |
| Buy DOWN | Yes | `execute(BUY_NO)` | receipt/fill/position | same | display/execution mismatch |
| Copy proof | Conditional | clipboard write | “Copied” | “Copy blocked” | browser unverified |
| Position tabs All/Live/Settling/Claimable/Won/Lost/Void | Yes | `renderPositions` | filtered rows | honest empty row | source verified |
| Redeem Claimable | Yes | scan + `redeemMany` | redemption receipt | generic failure/empty | real popup unverified |
| Dynamic tx Explorer links | Conditional | external explorer | tx page | network error | source verified |

No decorative button without a handler was found. Core controls are present, but “rendered/clickable” is not equivalent to “live-proven” for wallet writes.

