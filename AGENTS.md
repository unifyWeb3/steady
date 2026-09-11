# AGENTS.md - Steady Operating Constitution

This file is the permanent operating contract for work in this repository.
Read it before making changes. Then read `research/28-handoff-state.md`, which
records the current implementation and verification state.

## Project Mission

Steady is a discipline-first terminal for BTC/ETH binary event contracts on
DreamDEX and Somnia Shannon testnet (chain `50312`). Its promise is narrow:

- show the user's downside before entry;
- enforce explicit market, liquidity, balance, headroom, spread, and discipline checks;
- execute only the values shown in the ticket; and
- show transaction, fill, settlement, and claim states only when supported by SDK or chain evidence.

Optimize for financial correctness and trustworthy proof before visual polish or
feature breadth. The product is not an AI forecaster, leaderboard, vault,
custom-token system, custody layer, or custom-contract project.

## Architecture Rules

- Preferred flow: browser -> Somnia Markets SDK -> indexer GraphQL and Shannon RPC/WS -> chain.
- Keep the architecture browser-first and as small as possible. Do not add a backend, database, queue, custody service, or custom contract unless research proves it is required.
- Use `@somnia-chain/markets-sdk` `0.29.0` and the repository's verified SDK patterns. Confirm signatures in `node_modules/@somnia-chain/markets-sdk/dist/*.d.ts` before changing protocol code.
- Use `SOMNIA_TESTNET_ADDRESSES` from the SDK. Never hardcode venue, pool, market, module, or collateral addresses.
- Keep protocol calls real. A test double may exercise UI error handling only when it is clearly labeled as a test; it must never be presented as a DreamDEX fill, receipt, balance, or market.
- Keep domain calculations pure and reusable. The displayed ticket, policy decision, order parameters, and proof surface must derive from the same canonical intent.

## Coding Rules

- Read surrounding code and local research before introducing abstractions or dependencies.
- Prefer existing project helpers and SDK APIs over new infrastructure.
- Use `apply_patch` for manual edits. Do not write files with shell redirection or ad hoc scripts when a patch is sufficient.
- Default to ASCII for new text unless the file already uses another character set.
- Keep comments short and explain only non-obvious invariants or protocol gotchas.
- Preserve BigInt precision for raw token, price, quantity, and timestamp values. Convert to human units only at presentation boundaries.
- Validate external values before using them in protocol calls or markup. Never silently clamp an invalid price, quantity, status, or expiry into an apparently valid value.
- Keep failure paths explicit and recoverable. A timeout or missing read is not a success.

## Testing Rules

Before handoff, run the checks relevant to the changed surface:

```bash
npm test
npm run build
node --check app/app.js
git diff --check
```

For protocol or integration changes, also run:

```bash
npm run validate
```

Run `npm run validate:write` only for an explicitly authorized, funded
testnet transaction. Never use it to manufacture evidence. Run the available
Playwright suite for browser behavior and responsive/error-state changes.

Tests must cover the risk, not just the happy path. Include regression cases
for side-specific economics, stale reads, unavailable status, zero-fill
receipts, incomplete scans, timeouts, and duplicate actions when those paths are
affected.

Record exact results and provenance. A historical live transaction remains
historical; a failed current run must not be rewritten as a pass.

## Security Rules

- Testnet only by default: Somnia Shannon, chain `50312`.
- Never commit `.env`, private keys, seed phrases, signing payloads, or secrets.
- `TEST_WALLET_PRIVATE_KEY` is local/test-only, must remain server/local-only,
  and must never appear in `NEXT_PUBLIC_*`, browser bundles, logs, screenshots,
  or documentation.
- Use SDK-provided addresses and validated chain IDs. Reject an unexpected
  chain before signing.
- Never fabricate transaction hashes, fills, balances, market rows, settlement
  outcomes, or redemption results.
- Do not run destructive Git or filesystem commands unless the user explicitly
  authorizes the exact operation. Preserve unrelated worktree changes.
- Treat indexer and wallet data as untrusted input. Escape or validate values
  before inserting them into HTML or constructing explorer links.

## UX Rules

- The first screen should be the usable terminal, not a marketing page.
- Make the risk-first workflow clear: discover -> decide -> control -> prove.
- Show UP as YES and DOWN as NO. Display side probability, spend, quantity,
  payout, profit, and expiry from the same canonical intent used for signing.
- Only a verified on-chain status of `1` authorizes Trading. Unknown,
  unavailable, stale, or locked states must remain visibly non-executable.
- Distinguish `TRANSACTION CONFIRMED`, `ORDER ACCEPTED`, `FILL VERIFIED`,
  `NO FILL`, `FILL UNKNOWN`, `SETTLING`, and incomplete claim scans. Never use
  optimistic wording such as "Trade completed" for a zero-fill IOC.
- Preserve honest loading, retry, empty, unavailable, and wallet states. Do not
  add decorative data to make an outage look healthy.
- Keep controls responsive and usable on narrow screens. Avoid dead buttons,
  duplicate rounded text controls, inaccessible status changes, and layouts
  that hide the decisive number.

## Research Rules

- Research is the protocol source of truth. Read `research/28-handoff-state.md`
  before work and consult the relevant numbered research file before changing
  an assumption.
- Verify SDK behavior against installed declarations and real harness output.
- If a protocol assumption changes, update the relevant research file,
  `research/RESEARCH-LOG.md`, `IMPLEMENTATION-STATUS.md`, and the handoff.
- Competitor repositories and design references are inputs for principles, not
  code to copy. Preserve Steady's DreamDEX-centered, discipline-first scope.
- Do not use rumors, screenshots, mocked APIs, or stale notes as current live
  protocol evidence.

## Git Rules

- Inspect `git status` before editing and preserve the user's dirty worktree.
- Do not revert, reset, clean, or overwrite changes you did not make.
- Keep changes scoped to the requested objective. Leave unrelated refactors and
  generated metadata alone unless they are required for correctness.
- Do not commit, push, deploy, or publish unless explicitly requested.
- Before handoff, report changed files, tests, known failures, and any evidence
  that is historical rather than current.

## Environment Rules

- Browser-safe configuration may include only:
  `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_INDEXER_URL`, `NEXT_PUBLIC_WS_RPC_URL`,
  and `NEXT_PUBLIC_RPC_HTTP_URL`.
- `INDEXER_HEADERS` is server-only when required. `PRICE_FEED_URL` is optional
  and is not required for the MVP.
- The verified SDK entry is `new SomniaMarkets({ indexerUrl, chain: somniaShannon,
  wsRpcUrl?, addresses })`; do not reintroduce the obsolete `createClient`
  assumption without verifying the installed SDK.
- Raw protocol conventions are load-bearing: `status === 1` means Trading,
  `ORDER_TYPE.MARKET === 2` is IOC, prices and quantities use SDK raw units,
  and `expireTimestampNs` is nanoseconds capped before market expiry.
- Network outages must degrade to retry/status-unavailable behavior. Never
  bypass an unavailable indexer with mock market data.

## Definition of Done

A change is done only when all applicable conditions are true:

1. The requested behavior is implemented at the correct ownership boundary.
2. Ticket values and submitted values cannot diverge for the affected flow.
3. Unknown, timeout, empty, rejected, and partial states are explicit and safe.
4. Focused regression tests cover the failure mode and pass.
5. Required unit, build, syntax, browser, and integration checks have run.
6. Live evidence is labeled with its date and provenance; no failed run is
   disguised as a pass.
7. `IMPLEMENTATION-STATUS.md` and `research/28-handoff-state.md` are updated;
   update `memory.md` and `research/RESEARCH-LOG.md` when the milestone or
   research record requires it.
8. No secret, mock protocol result, unrelated dependency, or unauthorized
   deployment was introduced.

## Known Anti-Patterns

- Fake fills, fake transaction hashes, simulated balances, or placeholder
  protocol adapters presented as real.
- Rendering a market as Trading after a failed status read.
- Signing from a stale preview book or from independently duplicated math.
- Treating `1 - YES` as a substitute for reading the executable NO side when
  the orderbook provides side-specific liquidity.
- Calling a successful receipt a filled trade without fill evidence.
- Reporting "Nothing claimable" after an incomplete finalized-market scan.
- Hardcoding protocol addresses, using a private key in browser code, or
  expanding `NEXT_PUBLIC_*` to include secrets.
- Adding AI, agents, social competition, tokens, vaults, custom contracts,
  databases, or heavy infrastructure to solve a problem not proven by research.
- Rewriting research or historical evidence to make a milestone look green.
- Stopping at a visually convincing UI while the integration gates are red.

## Session Handoff Protocol

At the start of a session:

1. Read this file and `research/28-handoff-state.md`.
2. Inspect `git status`, the relevant research, and current tests before making assumptions.
3. State the scoped objective and any external prerequisite or risk.

During the session:

- Give concise progress updates before edits and while long checks run.
- Keep the plan and evidence current. Do not silently widen scope.
- Preserve user changes and stop before P1 or deployment work when the current
  authorization does not include them.

At the end of the session:

1. Run the required checks for the changed surface.
2. Update `IMPLEMENTATION-STATUS.md`, `research/28-handoff-state.md`, and any
   required memory/research log entries.
3. Record current network state, read path, failures, safe fallback, and exact
   test results.
4. List remaining blockers and the safest next action.
5. Do not claim completion unless the evidence proves the full scoped objective.
