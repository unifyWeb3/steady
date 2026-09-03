# AGENTS.md — Somnia × DreamDEX Event Contracts Hackathon

> Read `research/28-handoff-state.md` before any work. It is the only up-to-date handoff.

## Non-negotiables
- **No mocks for DreamDEX protocol.** No fake tx hashes, no simulated fills as real, no placeholder backend where SDK integration required.
- **Testnet only** unless explicitly authorized. Chain `50312` (Shannon).
- **No secrets in repo.** No private keys in `NEXT_PUBLIC_*`, no `.env` committed. `SOMNIA_TESTNET_ADDRESSES` from SDK — never hardcode addresses.
- **Research is source of truth.** Do not change protocol assumptions without updating `research/`. Verify against `node_modules/@somnia-chain/markets-sdk/dist/*.d.ts`.
- **Milestone discipline.** Every milestone updates `IMPLEMENTATION-STATUS.md` + `research/28-handoff-state.md` (+ `research/RESEARCH-LOG.md` if research changes).

## Product: Steady (selected 2026-09-01)
Discipline-first terminal for BTC/ETH 15m/1h Up/Down. See `research/18-product-selection.md`, `research/19-mvp-spec.md`. Non-goals: no AI forecaster, no leaderboard, no vault/pooling, no custom token, no custom contracts.

## Repo shape (current)
```
research/          # 00-28 + SOURCES.md + RESEARCH-LOG.md — read before code
scripts/validate/  # real SDK harness (no mocks) — listLiveBinaryMarkets → getMarketOnchain → getBinaryOrderBook → getBinaryBookParams
package.json       # SDK 0.29.0, viem — check before adding deps
.env.example       # required vars template
IMPLEMENTATION-STATUS.md
```
No `app/` yet — frontend is BLOCKED until integration foundation passes.

## Verified SDK (0.29.0)
- Entry: `createClient({ indexerUrl, chain: somniaShannon, wsRpcUrl?, addresses? })` — `indexerUrl` required, `wsRpcUrl` optional when chain has `rpcUrls.default.webSocket` (Shannon does).
- Addresses from `SOMNIA_TESTNET_ADDRESSES` (`node_modules/@somnia-chain/markets-sdk/dist/addresses.d.ts:1`).
- Reads: `listLiveBinaryMarkets`, `getMarketOnchain`, `getBinaryOrderBook`, `getBinaryBookParams`, `listPastBinaryMarkets({status:"Finalized"})`.
- Writes via `client.createTrader({privateKey})` — server/local only. Fixed fees `DEFAULT_FEES` 60 gwei, `DEFAULT_GAS` 10M.
- Gotchas: gate on-chain status `1`, tick/lot snap, `expireTimestampNs` nanoseconds capped at market expiry, approval quantity not escrow.

## Env contract (see research/26-environment-contract.md)
- **Browser-safe:** `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_INDEXER_URL`, `NEXT_PUBLIC_WS_RPC_URL`, `NEXT_PUBLIC_RPC_HTTP_URL` — never secrets.
- **Local/test-wallet:** `TEST_WALLET_PRIVATE_KEY` (hex 0x…) — validate only, never commit, never expose to client.
- **Server-only:** `INDEXER_HEADERS` if needed — never browser.
- **Optional:** `PRICE_FEED_URL` (if using EMA feed).

## Commands
```bash
npm install                 # SDK 0.29.0 + viem
npm run validate            # real harness: SDK create → listLive → onchain → book → params (no mocks)
npm run validate:write      # same + one real IOC on funded wallet (requires TEST_WALLET_PRIVATE_KEY, STT + tUSDC)
```
If harness fails, fix integration before UI — do not mock around it.

## Validation gates (must pass before frontend)
1. SDK client creation
2. `listLiveBinaryMarkets` returns BTC/ETH 15m/1h
3. `getMarketOnchain` status `1` filtering
4. `getBinaryOrderBook` + `getBinaryBookParams`
5. (only if funded) real IOC with tick/lot + `expireTimestampNs`

See `research/27-integration-validation.md` for harness spec. Record results in `IMPLEMENTATION-STATUS.md` + `research/28-handoff-state.md`.

## Architecture rule
Browser → SDK → (Indexer GraphQL + RPC WS) → chain. No DB, no backend unless you prove Steady needs one. Smallest architecture wins.

## Do NOT do next (until gates pass)
- Scaffold `app/` / `components/` / UI polish
- Add AI, leaderboard, vault, token
- Hardcode venueId, pool, market addresses
- Add `NEXT_PUBLIC_*` private keys

## Where to look first
- `research/24-implementation-plan.md` — stack + time budget
- `research/25-runtime-requirements.md` — exact env separation
- `research/00-executive-summary.md` — 7-day thesis in 72 lines
