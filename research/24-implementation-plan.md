# 24 — Implementation Plan (Steady)

**Date:** 2026-09-01
**Deadline:** 2026-09-08 18:00 (7 days)
**Build time budget:** 5.5d build + 1d polish/video

## Stack (pinned)
- Next.js 15 App Router + React 19 + Tailwind 4
- wagmi 2 + viem 2 + @somnia-chain/markets-sdk 0.29.0
- No DB, no AI, no custom contracts, no Supabase
- Wallet: injected (MetaMask/Rabby), wagmi `useConnect` + `useAccount`
- Chain: Shannon testnet `50312` only; mainnet toggle hidden

## Time budget
| Phase | Days | Risk |
|-------|------|------|
| Scaffold + config | 0.3 | low |
| SDK client + live discovery (filtered >300s, venue, on-chain gate) | 0.8 | high (first live test) |
| Honest ticket + book + tick/lot + IOC execution | 1.0 | high |
| Positions + redeem + oracle audit | 0.8 | medium |
| Brier/Edge + tilt guard | 0.6 | medium |
| Polish/mobile/demo seeding | 1.0 | low |
| Video + README + deploy | 1.0 | low |
| Buffer | 0.5 |  |

Core value demoable by end of day 3 (discovery+ticket+IOC+redeem mock) before full scoring.

## Architecture
```
app/
  layout.tsx (wagmi provider, theme)
  page.tsx (Live + Ticket + Score)
  positions/page.tsx (Live/Settling/Claimable/History)
  api/ (optional proxy for indexer if CORS)
lib/
  somnia.ts (chain def, addresses SOMNIA_TESTNET_ADDRESSES)
  dreamdex.ts (createClient wrapper, market discovery, book, quote, place, redeem)
  scoring.ts (pure Brier/Edge from fills+resolutions)
  tilt.ts (consecutive losses → cooldown)
hooks/
  useLiveMarkets.ts
  useBook.ts
  usePositions.ts
  useScore.ts
components/
  Header, MarketList, HonestTicket, ScoreStrip, TiltGuard, PositionsInbox, OracleLink
```

## Critical path first
1. Validate SDK live: `listLiveBinaryMarkets` returns BTC/ETH 15m/1h with expiry
2. Verify `getMarketOnchain` gating, `getBinaryOrderBook` + `getBinaryBookParams`
3. Test single IOC with burn wallet (faucet tUSDC 10k, STT from Telegram) — capture tx hash before UI polish

## Gotcha handling checklist (must be visible in code)
- [ ] Gate on-chain status 1
- [ ] Tick snap (>=0.28) — use SDK unified or `priceToPrecision`
- [ ] Lot snap — check >0
- [ ] expireTimestampNs nanoseconds capped at market expiry
- [ ] Approval qty not escrow
- [ ] Venue scoping
- [ ] Headroom >300s filter
- [ ] listPastBinaryMarkets Finalized for redeem (not loadMarkets)
- [ ] Void handling (both outcomes 0.5)
- [ ] Pool recycling key by marketId
- [ ] Revert decode (throw vs receipt.status)
- [ ] Wallet balance check before sign

## Demo pre-seed
- One burner with 3W/2L history for Brier populated (else video shows "— need 5 settled")
- One Claimable position for redeem click
- One empty-book window to show honest empty state

## Deployment
- Vercel (`vercel --prod`), env `NEXT_PUBLIC_CHAIN_ID=50312`, indexer `https://dev.smk.somnia.host/v1/graphql`, WS `wss://api.infra.testnet.somnia.network/ws`
- Fallback: same-origin RPC proxy with allowlist (Branch pattern) if CORS blocks
