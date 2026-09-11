# 68 — Indexer Incident (2026-09-09)

## Scope

This records the current read-path incident against the configured Shannon testnet indexer. It does not replace or re-date historical live transaction evidence.

## Evidence

| Check | Result | Provenance |
|---|---|---|
| Configured endpoint | `https://dev.smk.somnia.host/v1/graphql` | SDK 0.29.0 README and repository environment contract |
| DNS | `dig` resolved `dev.smk.somnia.host` to `8.233.178.19` | local resolver, 19:44 WAT on 2026-09-09 |
| HTTPS | `curl -sSIL --max-time 20` returned HTTP 500 from the endpoint | local curl, 19:44 WAT on 2026-09-09 |
| GraphQL transport | `{ __typename }` returned `query_root` | local shaped GraphQL probe, 19:44 WAT on 2026-09-09 |
| GraphQL schema probe | `Market { id }` returned one row (`0x…0073`) | local shaped GraphQL probe, 19:44 WAT on 2026-09-09 |
| Shannon RPC | `eth_chainId` returned `0xc488` (`50312`) | local JSON-RPC probe, 21:32 WAT on 2026-09-09 |
| SDK path | `npm run validate` created the SDK client (Gate 1) but Gate 2 failed with `getaddrinfo EAI_AGAIN dev.smk.somnia.host` | local SDK harness, 2026-09-09 |

## Assessment

The incident is intermittent at the transport/resolver boundary: direct HTTPS and shaped GraphQL requests have responded, while the SDK run has failed during DNS resolution. This is not sufficient evidence for a healthy current discovery path, so Gate 2 remains BLOCKED. The browser continues to render retry/status-unavailable states and does not authorize markets from an unverified response.

## Endpoint search

The installed SDK documents `prd.smk.somnia.host` for production and explicitly instructs testnet callers to use `dev.smk.somnia.host`, with Shannon chain and testnet addresses. No alternate official Shannon testnet indexer endpoint was found in the installed SDK or repository research. The production endpoint is not a valid replacement for Shannon testnet reads.

## Rejected workaround

The resolved raw IP is not used as an endpoint. TLS host validation, routing, and the SDK's documented hostname contract make a raw-IP workaround unsafe and unauthoritative. No DNS pinning or hidden proxy was added.

## Safe fallback

Retry the SDK read when the endpoint is reachable. During the incident, Steady keeps the shell usable, renders `Market data unavailable` or `Claims unavailable`, clears executable selection after an unverified refresh, and refuses signing or wallet-wide redemption without complete evidence. Historical IOC and redemption hashes remain historical only.

## Release-gate audit refresh — 2026-09-09 22:34-23:02 WAT

These are new observations from the release-gate audit. They do not upgrade Gate 2 or re-date any historical transaction evidence.

| Check | Result | Provenance |
|---|---|---|
| Official SDK harness (run 1) | Gate 1 PASS; Gate 2 failed with `fetch failed` caused by Node `getaddrinfo EAI_AGAIN dev.smk.somnia.host` | `npm run validate`, local Node harness, 2026-09-09 22:31 WAT |
| Official SDK harness (run 2) | Same Gate 1 PASS / Gate 2 `EAI_AGAIN` result | `npm run validate`, local Node harness, 2026-09-09 22:39 WAT |
| SDK request shape | POST to `/v1/graphql`, `query LiveBinaryMarkets`, full SDK `MarketFields`, variables `{ marketType: BINARY, expiry > now, order_by expiry asc, limit: 20, offset: 0 }`, no extra headers | Captured by wrapping Node `fetch` around `SomniaMarkets.client.listLiveBinaryMarkets`, local, 2026-09-09 |
| Exact SDK call retry | One direct `SomniaMarkets` call using the configured hostname succeeded with 16 rows; this was intermittent and is not treated as a healthy Gate 2 pass | Node 22, SDK 0.29.0, same SDK method/request, local, 2026-09-09 |
| Node DNS | Eight consecutive `dns.promises.lookup` calls resolved `8.233.178.19` (134-884 ms) | Node 22, local, 2026-09-09 |
| OS resolver | `dig +time=5 dev.smk.somnia.host` returned NOERROR and `8.233.178.19`; `getent hosts dev.smk.somnia.host` returned no row | local OS tools, 2026-09-09 22:34 WAT |
| Direct shaped GraphQL | `curl` POST `{ __typename }` and `Market(limit: 1) { id }` each returned HTTP 200 JSON; an exact browser-shaped live-market probe also returned HTTP 200 with one BTC Trading row | curl and Chromium browser fetch, configured hostname, local, 2026-09-09 |
| Shannon RPC | Existing direct probe remains `eth_chainId = 0xc488` (`50312`); no RPC substitution was used | Shannon RPC, local, 2026-09-09 |
| Browser read path | Chromium could POST directly to the configured GraphQL hostname and receive 200; the local app still exercised its explicit timeout/unavailable path when SDK/CDN loading or indexer access stalled | Playwright Chromium, local app, 2026-09-09 |

### Current assessment

The root cause remains unresolved intermittent name-resolution/transport behavior in this environment. `dns.promises.lookup`, `dig`, direct curl, browser fetch, and one exact SDK retry can succeed, while the official harness repeatedly fails at Node's resolver boundary with `EAI_AGAIN`. No raw IP, undocumented endpoint, mock market data, DNS pinning, or fail-open behavior was introduced. Gate 2 remains **BLOCKED** until the official harness passes consistently; Gates 3-6 remain not run for this audit.
