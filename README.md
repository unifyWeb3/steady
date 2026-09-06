# Steady — Know the downside before you enter.

Discipline-first terminal for **DreamDEX Event Contracts** on **Somnia Shannon testnet (50312)**.

Steady is a consumer execution shell for live BTC/ETH Up/Down windows that makes your maximum loss explicit *before* you sign, enforces policy at the execution boundary (including a 2-loss cooldown), and reconciles every fill against its quote. No mocks — every hash below is mined on Shannon.

## Live proof (all independently verifiable)

| What | Evidence |
|------|----------|
| IOC BUY_YES | [`0xed05c90f…72464c`](https://shannon-explorer.somnia.network/tx/0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c) — success, block 477265538 — quoted 0.049 → **fill 0.021** |
| IOC BUY_YES (walletClient) | [`0x6f6beb80…54252c`](https://shannon-explorer.somnia.network/tx/0x6f6beb8008866bd2777c711e644ecf59f39609264120c6684073fb0e9d54252c) — success, fill 722000 |
| IOC BUY_NO (walletClient) | [`0x88285864…29f6fc5`](https://shannon-explorer.somnia.network/tx/0x8828586432c01cbdf672592094b783e9f8130476e78909b42c423d40629f6fc5) — success, fill 701000 |
| Redemption (winning YES) | [`0x3aa5ec79…77444`](https://shannon-explorer.somnia.network/tx/0x3aa5ec79dc9542633545645b540ec9d45c5a470ea86d8c8eb33054cbc1e77444) — success, balance 1000→0 |
| Faucet (10k tUSDC) | `0xb0bd7bb1…908e46` |

Wallet: `0x0d6FAee78dFF4380E77D0e412F5Cddd942673719` (test burner).

## Live demo

**Production:** [https://somnia-snowy.vercel.app](https://somnia-snowy.vercel.app) (static, Shannon testnet, no backend, no secrets).

Demo video: *(recording after human wallet E2E — see `demo.md` for the shot plan)*.

## Run it

```bash
npm install
npm test            # 13 unit tests (ticket, scoring, discipline)
npm run validate    # live read gates: markets → onchain → book → params (Shannon testnet)
npm run dev         # http://localhost:5173 — homepage + terminal
npm run build       # static dist/ (deployable as-is)
```

Needs nothing but a browser. For trading, connect Rabby/MetaMask on Shannon 50312 with STT (gas) + tUSDC (faucet via Telegram dev group or in-app path).

## How it works

**DECIDE → CHECK → EXECUTE → VERIFY**

1. **Decide** — Honest ticket: enter max loss → quantity/pay/payout computed with tick/lot snapping. UP = YES outcome, DOWN = NO outcome.
2. **Check** — Policy gate at the execution boundary: market Trading (status 1), headroom ≥60s, liquidity, spread <0.15, balance, 2-loss cooldown. Denials carry exact codes (`SPREAD_TOO_WIDE`, `COOLDOWN`, `ImmediateOrCancelNoFill`).
3. **Execute** — Immediate-or-Cancel (orderType 2), expiry now+120s capped at marketExpiry−10s (nanoseconds), 60 gwei / 10M gas (SDK defaults).
4. **Verify** — Receipt distinguishes **quoted vs actual** fill price; positions reconcile via `getUserFills`; settlement via Finalized scan + ERC-6909; redemption one click with explorer evidence.

## What Steady is not

No AI forecaster, no leaderboard, no vault/pooling, no token, no custom contracts, no backend/database. A pure SDK consumer: browser → `@somnia-chain/markets-sdk@0.29.0` → indexer + WS → chain.

## Docs

- `research/` — full audit trail (rules, protocol, scoring, control plane, brand, readiness).
- `AGENTS.md` — contributor rules (testnet-only, no mocks, no secrets).
- `memory.md` — operational continuation state.

## Known limitations (honest)

- Browser-popup signing is implemented (`createTrader({walletClient})`, same call proven via Node both directions) but the final human click-through is pending — see handoff.
- Brier/Edge need ≥5 settled fills; below that the UI says so instead of inventing a score.
- Cooldown needs 2 trailing real losses to fire; unit-tested, not yet observed live.
- Indexer outages degrade to explicit error + Retry (never stale-as-live); market rows need a reachable indexer.
- Mobile 375px verified (0 overflow); 390/768/1280 inspected in code, captures pending.

Testnet only. Not financial advice.
