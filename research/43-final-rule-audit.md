# 43 — Final Rule Audit

**Date:** 2026-09-05 (3 days to deadline)
**Source:** live fetch `https://dorahacks.io/hackathon/event-contracts/detail` (primary, authoritative)

## Deadline
- **2026-09-08 18:00** — DoraHacks event timeline (Submission 2026/08/25 00:00 → Deadline 2026/09/08 18:00). Timezone not labeled on page; DoraHacks displays UTC by convention — treat as **18:00 UTC**, submit by 12:00 UTC Sep 8 for safety margin.
- Cross-check: hackathons.space lists "Sep 8, 2026"; Eventbrite lists "Sep 9 3PM–9AM UTC" (third-party mirror, less authoritative). **Trust DoraHacks: Sep 8 18:00.**

## Prize
- **$5,000 USDso** single pool (not per-track). Plus: social spotlight, Somnia community showcase, Discord showcase. No formal tracks/bounties found — single judging pool.

## Requirements (required vs optional)
| RULE | SOURCE | VERIFIED FACT | IMPLICATION | STEADY STATUS | RISK |
|------|--------|---------------|-------------|---------------|------|
| DreamDEX Event Contracts meaningfully used | What to Build | Core primitive required | Must be load-bearing, not wrapper | PASS — every flow is EC-specific (see §7) | Low |
| Working prototype on testnet | Submission Guidelines | Testnet only | Shannon 50312, no mainnet | PASS — gates 1-5 + redemption live on 50312 | Low |
| GitHub repository | Submission Requirements | Link required | Repo must be public at submit time | **ACTION** — repo currently PRIVATE; must flip to public before submitting BUIDL | **P0** |
| 2–3 min demo video | Submission Requirements | Video required | Must show real product working | NOT DONE — no video yet | **P0** |
| Meaningful SDK/API use | What to Build | SDK surface expected | Real reads + writes, not screenshots | PASS — markets-sdk 0.29.0 throughout | Low |
| Clear/intuitive UX | Judging 20% | UX scored | First-timer comprehensible | PARTIAL — desktop browser-proven, mobile partial | P1 |
| Adoption/trading/ecosystem potential | Judging 20% | Business scored | Retention + volume thesis needed | PARTIAL — thesis written, no distribution yet | P1 |
| Deck (optional) | Submission Guidelines | Optional | Helps presentation 15% | NOT DONE | P2 |
| SDK feedback report (optional) | Submission Guidelines | Optional | Goodwill + ecosystem signal | NOT DONE — we have real gotchas to report | P1 (cheap, high signal) |

## Explicitly NOT required (do not gold-plate)
- AI/agent: welcomed, not required. Steady correctly has none.
- Database/backend: not required. Steady correctly has none.
- Smart contract: not required. Steady correctly deploys none (pure SDK consumer).
- Formal tracks: none exist. Single pool.

## Judging (unchanged from research/02)
Innovation 20 / Technical 25 / UX 20 / Business 20 / Presentation 15. See `research/45-judge-score-audit.md`.

## Submission checklist (exact)
1. [ ] Flip `unifyWeb3/steady` to **public**
2. [ ] Write `README.md` (missing — P0)
3. [ ] Add `LICENSE` MIT (missing — P1)
4. [ ] Deploy to Vercel, smoke test (BLOCKED on human auth)
5. [ ] Record 2–3 min demo (after manual popup E2E)
6. [ ] Write SDK feedback report (optional, cheap)
7. [ ] Submit BUIDL with repo + video links before Sep 8 12:00 UTC
