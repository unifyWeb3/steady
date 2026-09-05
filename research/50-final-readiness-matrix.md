# 50 — Final Readiness Matrix (2026-09-05, 3 days to deadline)

| AREA | STATUS | EVIDENCE | RISK | FIX | PRI |
|------|--------|----------|------|-----|-----|
| Rules compliance | LIVE-PROVEN | DoraHacks fetch: testnet+GitHub+video, $5k, Sep 8 18:00, no tracks | Repo private (must flip) | README, LICENSE, public flip at submit | P0 |
| Real IOC both directions | LIVE-PROVEN | 0x6f6beb…/0x882858… success + fills 722000/701000 | — | — | — |
| Real redemption | LIVE-PROVEN | 0x3aa5ec…77444, bal 1000→0 | — | — | — |
| Browser popup signing | CODE-EXISTS-BUT-UNVERIFIED | Same SDK call proven via Node; mock connect proven in chromium | Judge asks "did a human click?" | Manual MetaMask pass, capture 5th hash | P0 |
| Tilt from real outcomes | TEST-PROVEN + PARTIAL LIVE | Unit 4/4; live record only 1W/1L (no 2-loss yet) | Cooldown never fires live pre-submit | Honest; note in demo | P1 |
| UNKNOWN reconciliation | TEST-PROVEN (code) + harness evidence | Timeout taxonomy live (ConnectTimeout exercised) | Receipt-poll path not yet fired live | Honest; code reviewed | P1 |
| No duplicate submit | CODE-EXISTS (reviewed) | `__submitting` + disabled + no auto-retry | Double-click during 3s window | Manual double-click test | P1 |
| Mobile 375px | LIVE-PROVEN | 0 overflow + screenshot | 390/768 not captured | Capture 390px | P1 |
| Desktop visual | LIVE-PROVEN | Screenshots + paper rgb verified | Polish nits | 39-review items (done per log) | P2 |
| Dead code (previewCapped, scoreDetail, debug logs) | CODE-EXISTS | 49-gimmick audit | Looks unfinished to judge reading source | Remove/gate (30 min) | P1 |
| Homepage preview numbers | STATIC (labeled?) | Currently "Preview uses real tick/lot math" | Static 22.40 looks invented | Relabel illustrative + link real tx | P1 |
| README | MISSING | No README in repo | Submission requires GitHub repo to be credible | Write from memory.md + forensics | P0 |
| LICENSE | MISSING | No LICENSE | Low risk but unprofessional | MIT | P0 |
| SDK feedback report | MISSING (optional) | Real gotchas documented (FOK, tick, Finalized, ERC6909 params) | Missed ecosystem signal | 1-page from research | P1 |
| Demo video | MISSING | Script exists (research/20) | 15% unearned | Record after manual E2E | P0 |
| Deploy + prod smoke | NOT VERIFIED | vercel.json ready, no auth in env | Judge clicks dead URL | Human vercel --prod + smoke | P0 |
| Secrets | PASS | Scan: no 64-hex keys, .env never in history, dist clean | — | — | — |

## Top 5 fixes (in order)
1. Manual MetaMask Buy UP (+DOWN if time) → 5th tx hash → receipt/fill/position screenshots.
2. README + LICENSE + repo public flip readiness.
3. Dead-code hygiene (49 list) + homepage preview relabel.
4. `vercel --prod` + prod smoke test.
5. Demo video on script + SDK feedback report.
## Safely ignore
Tablet 768 capture, seasons/divisions, copy-trading, MCP, paper mode, analytics charts — all post-hackathon.
