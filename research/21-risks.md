# 21 — Risk Register

| Risk | Prob 1-5 | Impact 1-5 | Mitigation | Fallback |
|------|----------|------------|------------|----------|
| RPC/indexer down during demo | 3 | 5 | On-chain re-read + stale badge + cached list | Pre-recorded video segment with real tx hashes |
| Empty order book (no liquidity) | 3 | 4 | Detect 0xd48c4403, show next window + depth | Pre-seed liquidity via mintSet or show empty honestly |
| Market locks mid-send (Locked revert) | 4 | 4 | Gate on-chain status 1 before every write + headroom >300s | Auto-select next window, retry IOC |
| Price off tick grid revert InvalidPrice | 2 | 5 | Use SDK >=0.29 tick snap; never send raw float | Show price quantize in ticket |
| Quantity below lot floors to 0 | 2 | 4 | Check lot snap >0 else warn "increase max loss" | Disable place button |
| Approval wrong (escrow not quantity) 0xfb8f41b2 | 2 | 4 | Build exact approval for quantity | Show needs-approval CTA with correct amount |
| Indexer lag shows sold market as live | 3 | 4 | Re-read on-chain status, badge "verifying…" | Don't enable trade until verified |
| Wallet on wrong chain (5031 vs 50312) | 3 | 3 | wagmi chain guard + switch button | Hard error + network switch |
| Insufficient STT gas → tx not admitted | 2 | 4 | Check gas before sign, link faucet | Faucet CTA + reduce gas override |
| Brier needs 5 settled but user has 0 | 4 | 3 | Show "— need 5 settlements" + seed demo history | Use pre-seeded burner history for video |
| Cooldown perceived as annoying | 3 | 3 | Make toggleable "Steady mode" (default on) | Explain LTV argument in deck |
| Pool recycled confusion (key by marketId not pool) | 2 | 5 | Key state by marketId/symbol, store nonce | Show pool+nonce in debug |
| Browser wallet signing fails | 2 | 4 | Support both injected + privateKey trader | Fallback to env burner for demo |
| Vercel deploy CORS for indexer | 2 | 3 | Same-origin proxy allowlist | Direct indexer fetch if CORS ok |

Any demo-killing risk has a fallback that keeps video credible (no fake fills).
