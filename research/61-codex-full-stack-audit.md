# 61 — Codex Full-Stack Audit

**Audit date:** 2026-09-08  
**Scope:** current `main` (`dd9ee96`), source, tests, SDK 0.29.0, Shannon RPC, production headers, and available browser checks.  
**Rule:** audit only; no application code was changed.

## Executive Verdict

Steady is a real static frontend over the real DreamDEX/Somnia SDK. The protocol integration is credible and historical Shannon receipts prove an IOC and a redemption. It is not currently safe to call end-to-end release-ready: the live indexer is unavailable, browser popup signing has not been proven in this audit environment, and the UI has financial truth gaps in the DOWN preview, spread policy, scoring, and claimable fallback.

## 1. Repository Health

- Working tree is `main`; tracked application code is present under `app/`, `lib/`, `scripts/`, and `tests/`.
- Existing untracked research/visual files are user work and were preserved.
- `npm test`: **34/34 pass**.
- `npm run build`: **pass**, static `dist/` copied from `app/`.
- Production origin `https://somnia-snowy.vercel.app/` returns HTTP 200 and the deployed `app.js` hash matches local `app/app.js`; production `terminal.html` redirects rather than serving the local static path directly, so the previous smoke claim is not independently reproducible from this sandbox.
- `npm run validate`: Gate 1 passes; Gate 2 currently fails with DNS `EAI_AGAIN dev.smk.somnia.host`. This is an external outage, not proof that the integration is broken, but it means current live discovery is unverified.
- `npx playwright test`: could not complete in this environment. The default run hit `listen EPERM :5173`; elevated Chromium run started but produced no test completion/output. Browser evidence in old status files is historical, not a current release proof.

## 2. Architecture Health

The intended architecture is coherent: browser → `SomniaMarkets` → indexer/RPC → Shannon, with no DB or backend. `lib/dreamdex/*` and `lib/steady/*` contain real SDK and pure-domain code. However, the browser bundle duplicates domain math and policy instead of importing the tested TypeScript modules. This creates two implementations that can drift. `lib/dreamdex/execution.ts` is not the actual browser write boundary; `app/app.js:763` is.

The app uses a hard-coded indexer/RPC configuration in `app/app.js`, while the documented environment contract is implemented only in the unused TypeScript config layer. This is a deployment/configuration mismatch, not a secret leak.

## 3. Frontend/Backend Contract Health

**Partial / failing for financial truth.** The critical path exists, but several displayed values and policy checks do not represent the same inputs used by the write:

- `app/app.js:367-386`: both buttons display the YES ticket (`yes`) and the same payment, while `BUY_NO` executes a separately computed NO price/quantity. DOWN can therefore be signed with parameters different from the displayed amount, contracts, profit, and price.
- `app/app.js:820`: execution computes spread from stale `book`, not the freshly read `bookNow` at lines 798-799. A wide current spread can bypass the boundary check if the previous preview book was narrow or absent.
- `app/app.js:653-695`: Brier/Edge uses `fillPrice` directly for every fill. SDK documentation says binary fill prices are YES terms and `binaryFillsFor` re-expresses NO fills as `1 - yesPrice`; DOWN calibration is therefore wrong.
- `app/app.js:233`: if all on-chain status reads fail or return no Trading rows, `display` falls back to indexer-eligible rows and labels them live. This contradicts the stated “status 1 only” contract.
- `app/app.js:323`: `availableRaw` is calculated but unused; preview does not cap by balance or depth. The boundary later refuses insufficient funds, so the ticket can promise a quantity that cannot execute.

## 4. Protocol Health

SDK declarations match the core calls: `createTrader({walletClient})`, `placeOrder({pool, side, price, quantity, orderType: 2, expireTimestampNs})`, `getBinaryOrderBook`, `getBinaryBookParams`, `getUserFills`, `getClaimable`, and `getOutcomeBalance({outcomeToken, account, id})`. Historical RPC checks independently confirmed:

- `0xed05c9…72464c`: `success`, block `477265538`, from the funded wallet, to the binary pool, 8 logs.
- `0x3aa5ec…77444`: `success`, block `478925556`, from the funded wallet, to the binary module, 5 logs.

These prove real transactions existed, not that today’s indexer/discovery/browser path is healthy. Current Gate 2 is blocked by indexer DNS/HTTP failure. The app’s 90-second discovery and 15-second retries can overlap; status/book reads do not consistently have independent timeouts.

## 5. State-Machine Health

The pure `positionState.ts` resolver is well covered and agrees with the documented tab states for known inputs. The implemented UI does not fully implement the documented control-plane machine:

- `PENDING`, `SUBMITTED`, `UNKNOWN`, `CONFIRMED`, `FILLED`, and `FAILED` are not persisted as a durable trade record. The DOM shows a success receipt after a mined transaction even when `res.fills` is empty.
- Redemption has no idempotency/submission guard and maps timeout/rejection through a generic `REDEEM_FAILED`; it lacks the same UNKNOWN reconciliation promised by the model.
- When market enrichment fails, position rows fall back to `LIVE` unless expiry is known, rather than an explicit unknown/stale state.
- `lib/steady/lifecycle.ts` maps resolved/no-balance to `WON` without knowing the winning side, so it is unsafe as a general resolver even though the browser uses the newer resolver.

## 6. Security Health

No private key is tracked; `.env` is ignored and absent from history; `dist/` contains no private-key value. `NEXT_PUBLIC_*` values in `.env.example` are browser-safe. The injected wallet path keeps the key in the extension.

There is a real input-safety concern: untrusted indexer fields (`asset`, `side`, `txHash`, pool/market metadata) are interpolated into `innerHTML` in `app/app.js:251`, `627`, `636`, `892`, `922`, `1034`, and `1108`. Some fields are expected to be enum/hex values, but there is no validation or escaping before HTML/attribute insertion. This is a P1 hardening issue for a public app. External links use `rel="noopener"`; no iframe or eval path was found. `vercel.json` does not add CSP or security headers.

## 7. E2E Health

The real private-key harness history proves protocol-side IOC and redemption. The browser tests intentionally inject a mock provider that throws on `eth_sendTransaction`; that is useful for connection/error UI but cannot prove a real wallet trade. No current human MetaMask popup, browser transaction hash, browser fill, or browser redemption was available. The current indexer outage prevents a fresh discovery/position E2E run.

## 8. Strongest P0 Findings

1. **DOWN ticket is financially misleading.** The button displays the UP/YES payment, quantity, profit, and entry while executing a separately priced NO order. A user can sign parameters that do not match the visible ticket.
2. **Current release cannot be verified live.** Gate 2 fails against the configured indexer, and no current browser wallet→tx→fill→redeem proof exists. The product should not be represented as presently verified end-to-end.
3. **Claimable fallback can falsely report “Nothing claimable.”** When the indexer is down and the browser has no cached fills, the on-chain fallback scans an empty market set and the UI reports no claimables. Winnings can be stranded and the message is stronger than the evidence.

## 9. Strongest P1 Findings

1. Spread policy checks stale preview state (`book`) rather than `bookNow`.
2. Resolved DOWN fills corrupt Brier/Edge because YES-term fill prices are not inverted.
3. Failed on-chain status reads cause indexer rows to be displayed as live.
4. Preview ignores connected balance/depth despite calculating `availableRaw`; displayed size can be unexecutable.
5. Redemption has no concurrent-submit guard and no UNKNOWN receipt reconciliation.
6. Enrichment failures can make an unknown position appear `LIVE`.
7. Indexer data is interpolated into `innerHTML` without validation/escaping.
8. Browser depends on esm.sh and hard-coded endpoints; no local bundle/CDN fallback exists.

## 10. Exact Changes Recommended

**A — Must fix now:** use one side-aware ticket object for both preview and execution; calculate spread from `bookNow`; never fall back to “live” without a successful on-chain status-1 read; distinguish empty claimable scan from incomplete scan; perform a real MetaMask UP and DOWN trade plus redemption; rerun live gates and browser tests.

**B — Fix if low risk:** route scoring through the tested domain conversion; cap preview by balance/depth or label unknown; add redemption idempotency and UNKNOWN polling; validate/escape indexer fields; add independent read timeouts and a discovery concurrency guard.

**C — Defer:** receipt persistence, WS-tail optimization, deck, expanded analytics.

**D — Do not touch:** AI, social/gamification, token, custom contracts, DB/backend, SDK upgrade, visual redesign.

## 11. Files That Should Not Be Touched

Do not alter protocol assumptions or historical evidence in `research/27`, `research/28`, `research/56`, `IMPLEMENTATION-STATUS.md`, or the verified SDK dependency without a new live run. Do not modify `node_modules/@somnia-chain/markets-sdk`. Do not commit `.env`, keys, browser recordings, or generated `dist/` artifacts. Do not rewrite the architecture or add a database/backend to mask indexer availability.

## 12. Release Decision

**Not safe to release as an end-to-end truthful product today.** The protocol foundation is real, but P0 financial display and verification gaps remain. Release can be reconsidered after the A items are fixed and evidenced by fresh Shannon and browser runs.

