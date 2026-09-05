# Research Log

## 2026-09-01 — Stage 1: Rule Lock
- Q: What are official hackathon dates/prize/rules?
- Source: SRC-001, SRC-020, SRC-010
- Finding: Registrations Aug 18, submissions Aug 25–Sep 8 18:00 UTC, $5,000 USDso, 291–292 hackers, BUIDL count inconsistent (0 vs 9–13 due to DoraHacks caching/filtering). Requirements: testnet prototype + GitHub + 2–3 min video, optional deck + SDK feedback.
- Confidence: VERIFIED (SRC-001 primary)
- Implication: Deadline in 7 days, must freeze MVP by Sep 5 to allow video + submission hardening.

## 2026-09-01 — Stage 2: Protocol Deep Dive
- Q: What do Event Contracts represent today?
- Source: SRC-002, SRC-003, SRC-004, SRC-005, SRC-006
- Finding: Binary Up/Down on BTC and ETH only, 15m/1h windows (docs: "15m/1h · more soon"), fixed payout, zero fees, on-chain CLOB shared with spot. Lifecycle via BinaryMarketsModule, pool recycling, ERC6909 singleton, oracle Hub with reactivity. Must gate on-chain status 1=Trading, use SDK >=0.28.0, IOC for taker, redemption via listBinaryMarkets status Finalized.
- Confidence: VERIFIED
- Implication: No arbitrary market creation; product must consume existing BTC/ETH windows. Settlement/reactivity is load-bearing.

## 2026-09-01 — SDK Investigation
- Q: What does markets-sdk 0.29.0 support?
- Source: SRC-007, SRC-021, local node_modules inspection
- Finding: 0.29.0 latest, browser+node, no HTTP for EC, exports SomniaMarkets, createClient, hooks, realtime via realtime_sendRawTransaction. Below 0.23 fails to read (longOpenInterest), below 0.28 price off tick grid (0.05 -> 0.050000... reverts). Addresses identical testnet/mainnet.
- Confidence: VERIFIED (local package.json + config.js)
- Implication: Pin to >=0.28.1, handle price quantize via SDK, handle worker expiry nanoseconds, lot grid.

## 2026-09-01 — Bot Kit
- Q: What's commoditized vs differentiated?
- Source: SRC-008
- Finding: 5 spot strategies (starter/maker/grid/momentum/mean-reversion/twap/ensemble) + 6 ec-* (ec-starter/maker/passive/laddering/oracle-follow/settlement). Shared core handles auth, WS, order lifecycle, nonce. Edge analytics, Railway deploy, session keys.
- Confidence: STRONGLY SUPPORTED
- Implication: Generic bots (grid/momentum) are commodity (A). Custom policy + settlement + session keys = moderately differentiated (B).

## 2026-09-01 — Somnia Ecosystem
- Q: How does Somnia position reactivity?
- Source: SRC-009
- Finding: Shannon testnet 50312, mainnet 5031, RPC dream-rpc.somnia.network, explorer shannon-explorer, sub-second finality, "Agentic Chain". DreamDEX is zero-fee CLOB liquidity layer, not consumer app — wants to be infra for third-party apps + agent venue.
- Confidence: VERIFIED
- Implication: DreamDEX not solving consumer UX, discovery, risk — that's the wedge.

## 2026-09-01 — Hackathon Competition Scan
- Q: What are active teams building?
- Source: SRC-011 through SRC-017, websearch github
- Finding: 7 public projects found outside DoraHacks BUIDL list: Telegram bot (Groq AI), PredictArena (social league Brier), Sluice (downside-capped sizing), Branch (conditional paths), Keel (redeem+roll), Vault (ERC4626), Template (starter). DoraHacks BUIDL page shows 0 due to filter bug — treated as moving target.
- Confidence: STRONGLY SUPPORTED (all repos cloned/inspected)
- Implication: AI trading + copy + analytics + gamified are saturating. Underexplored = discipline/risk, onboarding, settlement trust.

## 2026-09-01 — Market Landscape
- Q: What do Kalshi/Polymarket users complain about?
- Source: websearch alphascope, milehigh
- Finding: Praise regulation/fast withdraw/clean UX, complaints low liquidity on niche markets, fee opacity, no live chat, thin order books. Prediction market exploit risk if low liquidity.
- Confidence: STRONGLY SUPPORTED (multiple review aggregations)
- Implication: Liquidity depth, execution quality, and transparent fees are real pains.

## 2026-09-01 — User Problems
- Q: What sucks for short-window binary?
- Finding: (see 11-user-problems.md) Top pains: chasing losses/tilt, odds misinterpretation, dying window expiry, sizing, redemption forgetting, trust in settlement.
- Confidence: INFERENCE from protocol gotchas + competitor gaps + review data
- Next: Map opportunities, score, adversarial.

## 2026-09-01 20:16 — Integration foundation handoff prep
- Q: Does live testnet match docs (15m/1h only)?
- Source: `npm run validate` live (14 markets, gates 1-4 PASS)
- Finding: Live returns 60s, 300s, 900s (1m/5m/15m). Candidate BTC 900s 14m headroom, Trading status 1, book 0.623/0.652 tick 1000. No 1h (3600) in this snapshot — may roll. SDK entry is `new SomniaMarkets` not `createClient` (not exported).
- Confidence: VERIFIED (live chain/indexer)
- Implication: Update research/04 to include 1m/5m, avoid hardcoding 900/3600 only. Harness corrected, 4 gates pass. Write gate remains BLOCKED (no funded key) — correct, not mocked.
- Q: GenLayer contamination?
- Source: `grep -R genlayer|bradbury|rpc-bradbury /home/unify/somnia` → 0 project matches (only 4221 in deps trusted-setups hex blobs, not GenLayer)
- Finding: No contamination inside somnia workspace. /tmp ignored per instruction.
- Confidence: VERIFIED

## 2026-09-01 20:51 — Gate 5 first attempt FAIL
- Q: Real IOC on live market 0x...1074a / 0x3bf5a438... with tUSDC 0→10k via faucet
- Source: `npm run validate:write` live Shannon, STT 50, tUSDC 0 then 10k after faucet 0xb0bd7bb1...908e46
- Finding: placeOrder threw ContractRevertError FillOrKillNotFillable() with data 0xc04ad919, address 0x3bf5a438..., function placeBinaryOrder. Used orderType 1 (FILL_OR_KILL) + price 550000 (0.55) vs ask 819000 (0.819) — non-crossing FOK cannot fill. Not a protocol or liquidity failure.
- Confidence: VERIFIED (receipt + decoded errorName)
- Classification: IOC liquidity / order construction (harness bug)
- Implication: Fix to ORDER_TYPE.MARKET=2 (IOC) + price = bestAsk+20000 tick-snapped, retry.

## 2026-09-01 21:29 — Indexer intermittency
- Q: Is dev.smk.somnia.host stable?
- Source: `npm run validate` retries, curl POST __typename
- Finding: ConnectTimeoutError / UND_ERR_SOCKET at 21:29 (timeout 10s, socket closed) on dev.smk.somnia.host:443, but curl after 15s returned {"data":{"__typename":"query_root"}}. Transient, not persistent.
- Confidence: VERIFIED
- Implication: Harness must retry, not fail fast. Not a blocker for Gate 5 (retry passed at 21:54).

## 2026-09-01 21:54 — Gate 5 PASS with real mined IOC
- Q: Real IOC after faucet + correct crossing?
- Source: `npm run validate:write` live, wallet 0x0d6FAe...3719, STT 49.991, tUSDC 9999.999078, market 0x...107fc BTC 3600s pool 0x246a..., book yesAsk 29000 (0.029), price 49000 (0.049, +0.02), qty 1000, orderType 2 MARKET/IOC, expiry nanos 1788299726000000000
- Finding: tx 0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c status success block 477265538 gas 828682 logs 8. Post-verify: receipt success, getUserFills count 2 latest fillPrice 21000 (0.021) qty 1000 Direct_YES taker BUY_YES vs maker SELL_YES 0x8a5093c7..., book after shows asks 20000/28000/35000. Taker paid fill not quoted (gotcha #7). Faucet + STT sufficient.
- Confidence: VERIFIED (explorer + receipt + fills)
- Implication: Integration foundation PASSED. All 5 gates live-proved. No mocks. Update IMPLEMENTATION-STATUS.md + 27 + 28, stop before frontend per task.

## 2026-09-04 — Frontend reliability + browser QA pass
- Root causes found: (1) duplicate `connect()` shadowed Rabby provider handling (provider var undefined in dead branch) — fixed to single Rabby-compatible version; (2) static top-level esm.sh imports (~10s each) blocked module execution → domcontentloaded timeout on terminal.html — fixed via lazy dynamic SDK import with 30s timeout, shell boots instantly; (3) `onclick="loadMarkets()"` unreachable from module scope — fixed via window.loadMarkets; (4) execute() logged maxLoss before defined + left __submitting stuck on early returns — fixed with _resetSubmit on all paths.
- Browser evidence (Playwright chromium 1234, real render): homepage PASS (bg 252,250,247, no purple); terminal shell PASS ("Loading live markets…" → 13s "Market data unavailable / Indexer timed out / Retry", no pageerror); mock-Rabby connect PASS (addr shown, Connected status, 26s due to esm.sh). Indexer timing out from this env (curl 15s + browser 12s) — graceful path exercised honestly; node harness passed same day when reachable.
- Status: walletClient popup signing remains CODE-EXISTS-BUT-UNVERIFIED (mock throws honestly on eth_sendTransaction). No mocks presented as real.

## 2026-09-04 — Frontend hardening merge (two sessions reconciled)
- Reliability session: fixed duplicate connect() shadowing Rabby handling, lazy SDK import (shell boots instantly), window.loadMarkets for Retry, _resetSubmit on all early returns, tradeAttemptId + SUBMITTING guard, UNKNOWN reconciliation, receipt quoted-vs-actual.
- Reconstruction session (merged): design.md authoritative system, research/38 frontend research (Vigil/Cairn/SWORN distilled, Direction C Ledger Instrument selected), terminal nav tabs, dark ink rail, receipt-head with Mined badge, homepage narrative.
- Ticket correctness: preview now uses live bestAsk+0.02 (same as execution), side-aware qty/pay, UP=YES/DOWN=NO labels, lot caption 1000 raw = 0.001 contracts.
- Policy consistency: preview shows DENIED during cooldown; receipt labeled policy-at-execution; cooldown enforced at boundary.
- Browser (chromium 1234): 5/5 Playwright PASS on merged tree; mobile 375px 0 overflow + screenshot; indexer timeout path exercised honestly (transient from this env, node harness passes when reachable).
- Real-popup signing still CODE-EXISTS-BUT-UNVERIFIED (mock throws honestly on eth_sendTransaction). No mocks as real. dist/ rebuilt 84K.

## 2026-09-05 — Penultimate audit (3 days to deadline)
- Rules re-verified live (DoraHacks): Sep 8 18:00, $5k USDso, testnet+GitHub+video, no tracks, 16 BUIDLs/314 hackers. Gaps found: NO README, NO LICENSE → both written from verified evidence only.
- Forensics re-PASS: all 4 headline txs success on-chain just now (0xed05c b477265538, 0x3aa5ec b478925556, 0x6f6beb b478978327, 0x882858 b478978375).
- Secrets scan PASS: no 64-hex keys in source/dist/history; .env never committed.
- Competitors: Tock (arcade+streaks), volatility Agent (custom router — weaker DreamDEX-dependence), Pryzm swarm, sigma odds layer. Rivo unverified rumor. No one in discipline wedge. Adopted one idea: shareable receipt card (text+link, no gamification).
- Honest score: 73/100 (80 with video + manual E2E). Research/43-50 written.
- Hygiene: debug logs gated behind localStorage steady:debug; homepage preview relabeled illustrative.
