# 62 — Frontend → Backend/Domain Contract Map

| Action | UI control | Handler | Domain/integration call | Network/on-chain | Result/state | Audit result |
|---|---|---|---|---|---|---|
| Open terminal | Homepage links | browser navigation | none | static `terminal.html` | shell loads | Code path exists; current browser run unavailable |
| Connect wallet | `#connectBtn` | `connect()` | `getInjectedProvider`, viem `createWalletClient(custom(provider))` | `eth_requestAccounts`, `eth_chainId`, optional switch/add; RPC balance | wallet address/client, fills refresh | Mock-Rabby test only; real popup unverified |
| Select market | row / Select button | `selectMarket(m)` | `getBinaryOrderBook`, `getBinaryBookParams` | RPC book/params | `selected`, `book`, `bookParams`, preview | Real calls; no read timeout |
| Refresh | `#refreshBtn` | `loadMarkets()` | `listLiveBinaryMarkets`, `getMarketOnchain`, book reads | indexer + RPC | rows/cache | Current indexer fails; fallback can label unverified rows live |
| Retry | generated retry button | `window.loadMarkets()` | same as Refresh | same | error/retry card | Handler exists |
| Set max loss | `#maxLoss` | `updatePreview()` | local `computeTicket()` | none | ticket numbers | DOWN uses YES display; balance/depth not applied |
| Buy UP | `#buyYes` | `execute("BUY_YES")` | local policy/math; `createTrader({walletClient})` | on-chain status, params, book, balance, `placeOrder` IOC | receipt, optional fills, positions refresh | Real boundary exists; stale spread and no current browser proof |
| Buy DOWN | `#buyNo` | `execute("BUY_NO")` | same, side-aware execution math | same | same | Visible ticket does not match execution math |
| View proof | receipt `<details>` | native details | none | none | expanded DOM receipt | Exists after success only; no persistence |
| Copy proof | generated `#copyProofBtn` | assigned in receipt | `navigator.clipboard.writeText` | none | button label | Handler exists; browser unverified |
| Faucet | `#faucetBtn` | inline async handler | `createTrader({walletClient}).faucet()` | chain transaction | faucet receipt/balance | Real SDK call; popup unverified |
| Position tabs | `.tab` buttons | inline onclick | `renderPositions()` | none | filtered fills | Works on loaded state; state can be unknown→LIVE |
| Redeem | `#redeemAll` | inline async handler | `getClaimable` or `scanClaimableOnchain`; `redeemMany` | indexer/RPC + one chain tx | receipt, demotion, fill refresh | Real call exists; no concurrent/UNKNOWN guard; fallback incomplete scan |
| Explorer | generated/static links | browser navigation | none | explorer HTTP | external proof page | Links are real; tx hashes historical/static |
| Home | header Home | browser navigation | none | static page | homepage | Code path exists |

## Core trade call graph

`#buyYes/#buyNo` → `execute(side)` → wallet/confirmation/max-loss guards → `getExchange()` → `getMarketOnchain(marketId)` → `getBinaryBookParams(pool)` → `getBinaryOrderBook(pool)` → local price/quantity/policy → `createTrader({walletClient})` → `trader.placeOrder({pool, side, price, quantity, orderType:2, expireTimestampNs})` → receipt DOM → `res.fills` immediate display → delayed `refreshFills()` → `getUserFills(account)` → per-market `getMarketOnchain` + `getOutcomeBalance` → `resolvePositionState` → positions/score/discipline render.

The pure `lib/steady/*` and `lib/dreamdex/execution.ts` functions are not called by this browser graph. The browser ports selected logic manually.

