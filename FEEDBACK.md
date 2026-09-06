# DreamDEX SDK / Documentation Feedback (from building Steady)

Built against `@somnia-chain/markets-sdk@0.29.0` on Shannon 50312, Sep 1–6 2026. All observations reproduced live.

## What worked well
- `listLiveBinaryMarkets` + `getMarketOnchain` + `getBinaryOrderBook` + `getBinaryBookParams` cover the full consumer read path with no raw RPC needed.
- Fixed fees (60 gwei / 10M gas) + `realtime_sendRawTransaction` make writes one-round-trip and predictable.
- `getUserFills` + `listPastBinaryMarkets({status:"Finalized"})` + ERC-6909 balances compose into a complete settlement/redemption flow.
- Decoded `ContractRevertError` names (`FillOrKillNotFillable`, `PriceOutOfBounds`, `ImmediateOrCancelNoFill`) made our failure taxonomy possible.

## Gaps / gotchas encountered (all verified live)
1. **`createClient` not exported from package root** — docs example uses it; actual entry is `new SomniaMarkets(config)` → `exchange.client.*`. Cost us an hour.
2. **`getOutcomeBalance` param is `{outcomeToken, account, id}`** — easy to mistype as `owner` (we did); error is generic `Address "undefined" is invalid`, which hides the real cause.
3. **OrderType numbering is a footgun**: `1 = FillOrKill`, `2 = MARKET/IOC`. Our first live order used FOK + non-crossing price and reverted `FillOrKillNotFillable`. Docs could bold that IOC takers want `2`.
4. **Price must cross or IOC reports `ImmediateOrCancelNoFill` (`0xd48c4403`)** — correct behavior, but a first-timer reading "empty book" from a populated-looking book is confusing; staleness between book read and send isn't surfaced.
5. **`loadMarkets()` hides settled markets** — winnings live in `listPastBinaryMarkets({status:"Finalized"})`, a separate surface. Every consumer must discover this independently; docs should call it out in the lifecycle page.
6. **Pool recycling** (`pool` serves successive markets) means keying anything by pool silently corrupts history — marketId keying should be the documented default with a warning.
7. **No `getBookLevels` graceful degradation** — reverts (empty data) instead of returning empty levels when a pool has no orders on a side; consumers must catch.
8. **Indexer intermittency** (HTTP 504 + connect timeouts observed Sep 5–6): no documented SLA/retry guidance; we built 12s timeout + Retry + on-chain re-validation.

## Recommendations
- Export (or alias) `createClient` at root, or fix the docs example.
- Name missing-address errors after the offending field.
- A "consumer checklist" page (gate status 1 → headroom → book → tick/lot → IOC-2 → expiry nanos → Finalized scan → redeem winner-only) would save every team 2–3 days. Steady's harness (`scripts/validate/validate.mjs`) is essentially that checklist executable.
