# 35 — Audit Model

## Every trade answers
WHY allowed (policy receipt) → WHAT submitted (market/direction/qty/price/expiry) → WHICH market (marketId/pool) → HOW executed (orderType IOC 2, tick/lot snap) → WHAT filled (actual fillPrice vs quoted) → WHEN (timestamp, block) → WHAT resolved (WON/LOST/VOID) → WHETHER redeemed (tx)

## Provenance
Each receipt field traces to source: quote from `getBinaryOrderBook` + `getBinaryBookParams`, policy from `lib/steady/discipline`, tx from `trader.placeOrder` receipt, fill from `getUserFills` logs, settlement from `getMarketOnchain` + explorer, redemption from `redeemWinning`.

## Proof surface
Per trade: Policy ✓ Market trading ✓ Quote within limits ✓ Wallet funded ✓ Tx mined ✓ Fill verified — each with check or reason, then IDs: `tradeAttemptId`, `marketId`, `txHash`, `orderId`, `fillId`, `oracleQuestionId` → `https://prd.oracle.somnia.host/questions/{id}?view=graph`

No verification badge without evidence.
