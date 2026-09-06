# 59 — Five-Judge Red Team

## A. Protocol engineer
- Impressed: tick/lot/nanos correctness, Finalized-scan redemption, ERC-6909 param fix, failure taxonomy from live reverts, forensics table.
- Confused: why polling 90s not WS tail. Answer: WS unused deliberately for critical path; book re-read pre-sign beats stale-tail risk. Documented in 56.
- Fake? Nothing — hashes verify on-chain just now.
- Risk: custom `execute()` math duplicates lib/steady/ticket.ts. Accepted: browser bundle can't import TS lib without bundler; logic mirrored + unit-tested; post-hackathon: bundle lib.
- Score threat: agent's custom contract. Counter: venue-native > venue-adjacent.

## B. Product designer
- Impressed: risk typographically loudest, policy codes, warm-paper system, mobile 0-overflow.
- Confused: preview shows UP price while DOWN exists — fixed: both sides labeled UP=YES/DOWN=NO with side-aware math.
- Copied? Cairn/VibeCurb principles transferred, fingerprints original (verified in 38/GEMINI audits).
- Missing: 390px capture, onboarding hint. Cheap fixes, queued P1.

## C. Web3 investor
- Impressed: retention thesis + redeem recovery + policy-API future.
- Confused: how does friction make money? Answer: LTV over impulse; makers earn every IOC cross.
- Risky: no users yet. Honest: testnet, 3 days old. Score on thesis clarity.

## D. Hackathon organizer
- Impressed: SDK feedback report material, docs-grade error mapping, reproducible harness.
- Confused: is browser E2E really done? Answer: no — clearly marked CODE-EXISTS-BUT-UNVERIFIED with manual boundary; Node same-call proven.
- Missing: video, public repo flip. Both scheduled pre-deadline.

## E. Skeptical user
- Impressed: max loss up front, explorer links everywhere.
- Fake? "Need 5 settled" instead of a fake score — trust-building.
- Confused: lots vs contracts. Fixed: caption now 1000 raw = 0.001 contracts.
- Missing: one-click faucet in terminal (exists in Tock). P1 if low-risk: link existing faucet path visibly.

## Fixes taken (all P0/P1-safe)
Ticket side-aware math, UP/DOWN labels, lot caption, debug-log gating, preview relabel, vercel.json. No scope added.
