# 26 — Environment Contract

Determined 2026-09-01 from `config.d.ts`, `somniaShannon.js`, `addresses.js`. No invented vars.

## 1. Browser-safe (may be `NEXT_PUBLIC_*`)
These may be exposed to client bundle. No secrets.

| Var | Required | Value / source | Notes |
|-----|----------|----------------|-------|
| `NEXT_PUBLIC_CHAIN_ID` | yes | `50312` | Shannon testnet only. Code MUST reject `5031` until explicitly authorized. |
| `NEXT_PUBLIC_INDEXER_URL` | yes | `https://dev.smk.somnia.host/v1/graphql` | Testnet Hasura. From SDK README example. |
| `NEXT_PUBLIC_WS_RPC_URL` | optional | `wss://api.infra.testnet.somnia.network/ws` | Override only; default from `somniaShannon.rpcUrls.default.webSocket[0]` suffices. |
| `NEXT_PUBLIC_RPC_HTTP_URL` | optional | `https://api.infra.testnet.somnia.network` | For wagmi `http()` transport fallback if needed. Not used by SDK WS but by wallet. |

No private keys, no `INDEXER_HEADERS`, no `TEST_WALLET_PRIVATE_KEY` here.

## 2. Local / test-wallet (never committed, never browser)
Used only by `scripts/validate/**` and local funded-trader harness.

| Var | Required | Format | Notes |
|-----|----------|--------|-------|
| `TEST_WALLET_PRIVATE_KEY` | for `validate:write` only | `0x` + 64 hex | Funded Shannon burner. Load via `client.createTrader({privateKey})`. Keep in `.env` (gitignored). |
| `TEST_WALLET_ADDRESS` | derived | `0x` addr | Optional convenience; derived from privateKey if not set. |

Funding prerequisites for write gate:
- STT balance >= 1 STT (covers several 0.6 STT envelopes)
- tUSDC balance > 0 (via `trader.faucet()` if empty)
- If missing, `validate:write` must report BLOCKED, not fake.

## 3. Server-only (never browser)
| Var | Required | Notes |
|-----|----------|-------|
| `INDEXER_HEADERS` | no | JSON string `{"x-hasura-admin-secret":"…"}` only if indexer needs Hasura role for `_aggregate` reads. Do NOT set for public `dev.smk...` endpoint. Never prefix `NEXT_PUBLIC_`. |
| `INDEXER_HEADERS_JSON` | alias | Alternative name if you prefer. |

## 4. Optional
| Var | Required | Notes |
|-----|----------|-------|
| `PRICE_FEED_URL` | no | Only if enabling EMA feed: `https://price-feed.dev.oracle.somnia.host/v1/graphql` (`SOMNIA_TESTNET_PRICE_FEED.url`). MVP does not need. |
| `PRICE_FEED_QUOTE` | no | Default `USDC` if price feed enabled. |

## Anti-patterns (BLOCKED)
- `NEXT_PUBLIC_PRIVATE_KEY`, `NEXT_PUBLIC_TEST_WALLET_PRIVATE_KEY`, `NEXT_PUBLIC_SECRET*` — rejected in code review.
- Hardcoded addresses from past `research/` — use `SOMNIA_TESTNET_ADDRESSES` import.
- Committing `.env` — must be in `.gitignore`.

## `.env.example` mapping
See `.env.example` — documents above with placeholder values, never real secrets.
