# 27 — Integration Validation (Harness Spec)

**SDK:** 0.29.0 verified `node_modules/@somnia-chain/markets-sdk/package.json:3`
**Chain:** 50312 Shannon (see `somniaShannon.js:1`)
**Addresses:** `SOMNIA_TESTNET_ADDRESSES` (never hardcoded)

## Harness location
- `scripts/validate/validate.mjs` — ES module, runs with `node` (no build)
- `package.json` scripts: `validate` (reads only), `validate:write` (reads + one IOC if funded)

## Sequence (no mocks, no fake hashes)

### Phase A — Read-only (must pass before any UI)
1. **SDK client creation (verified 2026-09-01)**
   - `new SomniaMarkets({ indexerUrl: NEXT_PUBLIC_INDEXER_URL||"https://dev.smk.somnia.host/v1/graphql", chain: somniaShannon, wsRpcUrl: NEXT_PUBLIC_WS_RPC_URL, addresses: SOMNIA_TESTNET_ADDRESSES })` — `createClient` NOT exported from root (verified `dist/index.js`), use `SomniaMarkets`. Then `exchange.client.*`.
   - Asserts `exchange.client` has `listLiveBinaryMarkets`, `getMarketOnchain`, `getBinaryOrderBook`, `getBinaryBookParams`
   - On failure → BLOCKED, log `NotConfiguredError`

2. **`listLiveBinaryMarkets`**
   - `await client.listLiveBinaryMarkets({ limit: 20 })`
   - Asserts array, logs `marketId`, `asset`, `intervalSec`, `expiry`, `pool`, `outcome count`
   - Filters for Steady: `asset BTC|ETH`, `intervalSec 900|3600`, `secondsLeft = expiry - now >300`
   - If empty → not failure, but warn "no headroom markets, widen filter"

3. **`getMarketOnchain` gating**
   - For first 2 candidates: `await client.getMarketOnchain(marketId as 0x${string})`
   - Asserts `status === 1` (Trading) before any write. Logs `onchain.status`, `pool`, `marketAddress`
   - If status !=1 → skip market (expected for Locked), do not count as failure

4. **`getBinaryOrderBook`**
   - `await client.getBinaryOrderBook(pool, { depth: 5 })` — note: verify signature is `(pool, opts)` not `(symbol, depth)` for client tier; `exchange.fetchOrderBook(symbol)` is unified tier only
   - Logs `yesBids`, `yesAsks`

5. **`getBinaryBookParams`**
   - `await client.getBinaryBookParams(pool)`
   - Asserts `tickSize`, `lotSize`, `minQuantity` present
   - Logs values (testnet 6-decimal: tick/lot ~ 1000 = 0.001 probability/contract)

All outputs printed with real values; on indexer/WS failure the harness exits non-zero and records `tests failed` in handoff.

### Phase B — Write (gated)
Only if `TEST_WALLET_PRIVATE_KEY` present + `validate:write` invoked:

6. **Funding check**
   - Derive address via viem `privateKeyToAccount`, `client.getViemClient().getBalance`
   - Check STT >= 0.6 STT, tUSDC via `client.getOutcomeBalance` or ERC20 `balanceOf` on `collateral`
   - If underfunded → BLOCKED, print `faucet` instruction, do NOT send tx

7. **One real IOC (verified 2026-09-01 21:54)**
   - Quantize: `price = (bestAskRaw + 20000n)/tick*tick` capped in (0,1e6), `qty = lot` (1 lot = 1000 raw = 1 contract on 6-dec), `expireTimestampNs = min(now+120s, marketExpiry-10s) *1e9` — nanos, future, <= market expiry. Verify: `bestAsk 29000n (0.029)` → `price 49000n (0.049)` tick-snapped.
   - `trader = exchange.client.createTrader({privateKey}); await trader.placeOrder({pool, side:"BUY_YES", price, quantity, orderType: 2, expireTimestampNs})` — `ORDER_TYPE.MARKET=2` (IOC), not `FILL_OR_KILL=1` (which reverts FillOrKillNotFillable)
   - Fixed fees 60 gwei ceiling, 10M gas (SDK default, 0.6 STT envelope)
   - Logs real `receipt.transactionHash`, `receipt.status`, `blockNumber`, `gasUsed` — no fake
   - On revert → log decoded `errorName` (`ContractRevertError`) — e.g., `FillOrKillNotFillable` / `InvalidPrice` / `0xd48c4403` — classify per failure taxonomy below
   - **Verified live:** market `0x...107fc` pool `0x246a...` BTC 3600s → tx `0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c` status `success` block `477265538` gas `828682` fill `21000n` (0.021) qty `1000` (Direct_YES)

   **Failure taxonomy (Gate 5):**
   - insufficient STT: `getBalance` <0.6 STT + mempool reject
   - insufficient tUSDC: `ERC20InsufficientBalance` / tUSDC 0 before faucet
   - approval failure: `ERC20InsufficientAllowance` / `0xfb8f41b2` (qty not escrow)
   - market state: `status !=1` Locked/Reverted, expiry headroom <60s
   - IOC liquidity: `0xd48c4403 ImmediateOrCancelNoFill` or empty book (not failure if shown honestly) / `FillOrKillNotFillable` if using wrong orderType
   - tick/lot: `InvalidPrice` / quantity 0 after lot snap
   - SDK/RPC: `IndexerError`, `ConnectTimeoutError`, `UND_ERR_SOCKET`
   - contract revert: decoded `errorName` from `ContractRevertError`

8. **Post-fill verification**
   - `getOutcomeBalance` for YES/NO, `getUserFills` for tape, `listPastBinaryMarkets({status:"Finalized"})` note (not claiming in harness)

## Commands
```bash
npm run validate        # gates 1-4, no key needed, exits 0 only if 1-4 pass
npm run validate:write  # gates 1-5, needs TEST_WALLET_PRIVATE_KEY + STT + tUSDC (faucet auto)
```

## Success criteria
- `validate` green → read foundation PASS (gates 1-4)
- `validate:write` green → write foundation PASS (gate 5) — trading UI may enable wallet signing with same tick/lot/expiry/nanos logic

## Verified runs
- 2026-09-01 20:16: gates 1-4 PASS (14 markets, Trading pool `0xeaf51a48`, book 0.623/0.652)
- 2026-09-01 20:51: gate 5 **FAIL** FillOrKillNotFillable — harness used `orderType 1` FOK + non-crossing `550000` vs ask `819000` on `0x...1074a` / `0x3bf5a438...` — **not protocol bug, harness construction error**
- 2026-09-01 21:54: gate 5 **PASS** IOC — market `0x...107fc` BTC 3600s `0x246a...` price `49000n` (ask 29000+20000) qty `1000n` orderType `2 MARKET/IOC` → tx `0xed05c90f...72464c` status success block `477265538` fill `21000` Direct_YES

## Live proof artifacts
- Faucet: `0xb0bd7bb1bbc01ebc6067a11eb5cbbe923bc5f073861079c84e348fd7dc908e46` (10k tUSDC from 0)
- IOC: `0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c` `https://shannon-explorer.somnia.network/tx/0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c`
- Fills: `getUserFills` count 2, latest `21000` on `0x...107fc` Direct_YES (taker `0x0d6FAe...3719`)

## No-mock rule
- Every number in logs is from indexer or chain. No `0xdeadbeef` placeholder, no `Math.random()` fill.
- If a step cannot run, harness prints `BLOCKED: <reason>` and `process.exit(1)` — never prints fake success.
