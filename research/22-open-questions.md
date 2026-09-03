# 22 — Open Questions

| # | Question | Importance | Plan to resolve |
|---|----------|------------|-----------------|
| 1 | Prize split (one winner vs multiple) | Low | Assume panel; build for top 1 regardless |
| 2 | Exact indexer endpoint for client (dev vs prd) | High | Confirm via docs: dev.smk.somnia.host for testnet, already in Keel — test live fetch before code |
| 3 | Venue IDs for testnet (don't hardcode) | High | Call listBinaryVenueIds at startup |
| 4 | Testnet liquidity at demo time (5m vs 15m) | High | Test live discovery Sep 2; if 1m not available, stick to 15m/1h |
| 5 | Will judges penalize friction? | Medium | User test with 2 devs Sep 5, add toggle |
| 6 | Brier distribution on Shannon (is Edge ~0?) | Medium | Fetch PredictArena's 197 ranked via chain if possible, or our own 20 trades |
| 7 | tUSDC faucet rate limit during hackathon rush | Medium | Faucet 10k in advance, keep two burners |
| 8 | Need Deck? Optional but helps presentation 15% | Low | Build 6-slide deck after MVP (see PredictArena deck.html) |

All except 5 are resolvable by live test before coding hardens.
