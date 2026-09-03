#!/usr/bin/env node
// Real integration harness — no mocks, no fake hashes.
// Phase A (reads): SDK create → listLiveBinaryMarkets → getMarketOnchain → getBinaryOrderBook → getBinaryBookParams
// Phase B (write, gated): one real IOC if --write + TEST_WALLET_PRIVATE_KEY funded

import { config as dotenvConfig } from "dotenv";
import { existsSync } from "fs";
import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { privateKeyToAccount } from "viem/accounts";

// Load .env if present
if (existsSync("/home/unify/somnia/.env")) dotenvConfig({ path: "/home/unify/somnia/.env" });
else if (existsSync(".env")) dotenvConfig();
else dotenvConfig();

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || process.env.INDEXER_URL || "https://dev.smk.somnia.host/v1/graphql";
const WS_RPC_URL = process.env.NEXT_PUBLIC_WS_RPC_URL || process.env.WS_RPC_URL || undefined;
const WANT_WRITE = process.argv.includes("--write");
const PRIVATE_KEY = (process.env.TEST_WALLET_PRIVATE_KEY || "").trim();

function logGate(name, ok, detail = "") {
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
  return ok;
}
function fmtExpiry(expiry) {
  const now = Math.floor(Date.now() / 1000);
  const secs = Number(expiry) - now;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s left (${new Date(Number(expiry) * 1000).toISOString()})`;
}

async function main() {
  console.log("=== Steady validate — DreamDEX Event Contracts ===");
  console.log(`SDK 0.29.0 | chain 50312 Shannon | indexer ${INDEXER_URL}`);
  if (WS_RPC_URL) console.log(`WS override: ${WS_RPC_URL}`);
  else console.log(`WS: using somniaShannon default (wss://api.infra.testnet.somnia.network/ws)`);

  // 1. SDK client creation via SomniaMarkets
  let exchange;
  try {
    exchange = new SomniaMarkets({
      indexerUrl: INDEXER_URL,
      chain: somniaShannon,
      ...(WS_RPC_URL ? { wsRpcUrl: WS_RPC_URL } : {}),
      addresses: SOMNIA_TESTNET_ADDRESSES,
      ...(PRIVATE_KEY && PRIVATE_KEY.startsWith("0x") && PRIVATE_KEY.length===66 ? { privateKey: PRIVATE_KEY } : {}),
    });
    logGate("Gate 1 — SDK client creation", true, `addresses binaryModule=${SOMNIA_TESTNET_ADDRESSES.binaryModule}`);
    // also verify client exists
    if (!exchange.client || !exchange.client.listLiveBinaryMarkets) throw new Error("client missing listLiveBinaryMarkets");
  } catch (e) {
    logGate("Gate 1 — SDK client creation", false, e?.message || String(e));
    console.error(e);
    process.exit(1);
  }

  // 2. listLiveBinaryMarkets
  let live = [];
  try {
    live = await exchange.client.listLiveBinaryMarkets({ limit: 20 });
    logGate("Gate 2 — listLiveBinaryMarkets", Array.isArray(live), `${live.length} markets`);
    for (const m of live.slice(0, 8)) {
      const asset = m.asset ?? "?";
      const interval = m.intervalSec ?? "?";
      const expiry = m.expiry ?? "?";
      const pid = (m.marketId ?? "?").toString().slice(0, 10) + "...";
      const pool = (m.pool ?? m.poolAddress ?? m.poolAddress ?? "?").toString().slice(0, 10) + "...";
      console.log(`  • ${pid} ${asset} ${interval}s expiry=${expiry} pool=${pool} — ${expiry !== "?" ? fmtExpiry(expiry) : "?"}`);
    }
    const now = Math.floor(Date.now()/1000);
    const steady = live.filter(m => {
      const asset = (m.asset || "").toUpperCase();
      const intervalSec = Number(m.intervalSec || 0);
      const expiry = Number(m.expiry || 0);
      return (asset==="BTC" || asset==="ETH") && (intervalSec===900 || intervalSec===3600) && expiry - now > 300;
    });
    console.log(`  → Steady-filtered (BTC/ETH 900/3600 >300s): ${steady.length} markets`);
    if (steady.length===0) console.log("  ⚠️  No headroom markets — not a failure, but widen filter or wait for next window");
    if (live.length===0) {
      console.log("BLOCKED: indexer returned 0 live markets — cannot validate onchain/book gates. Check indexer URL / network.");
      process.exit(1);
    }
  } catch (e) {
    logGate("Gate 2 — listLiveBinaryMarkets", false, e?.message || String(e));
    console.error(e);
    process.exit(1);
  }

  const now = Math.floor(Date.now()/1000);
  const steady = live.filter(m => {
    const asset = (m.asset || "").toUpperCase();
    const intervalSec = Number(m.intervalSec || 0);
    const expiry = Number(m.expiry || 0);
    return (asset==="BTC" || asset==="ETH") && (intervalSec===900 || intervalSec===3600) && expiry - now > 300;
  });
  let candidate = steady[0] || live[0];
  let marketId = candidate.marketId;
  let pool = candidate.pool || candidate.poolAddress;
  if (!marketId || !pool) {
    console.log(`BLOCKED: candidate missing marketId/pool: ${JSON.stringify(candidate).slice(0, 800)}`);
    process.exit(1);
  }
  console.log(`\nCandidate for gates 3-4: marketId ${marketId} pool ${pool}`);

  // 3. getMarketOnchain
  let onchain = null;
  let writeMarketId = marketId;
  let writePool = pool;
  try {
    onchain = await exchange.client.getMarketOnchain(marketId);
    const status = onchain?.status;
    const isTrading = status === 1;
    logGate("Gate 3 — getMarketOnchain", true, `status=${status}${isTrading ? " (Trading)" : " (not Trading — will search)"} pool=${onchain?.pool ?? "?"} market=${onchain?.marketAddress ?? "?"}`);
    if (!isTrading) {
      console.log("  Searching for a Trading (1) market among live...");
      let found = false;
      for (const m of live.slice(0, 10)) {
        const id = m.marketId;
        try {
          const oc = await exchange.client.getMarketOnchain(id);
          console.log(`    ${id.slice(0,10)}... status=${oc.status} ${oc.status===1?"← Trading":""}`);
          if (oc.status===1 && !found) {
            onchain = oc;
            writeMarketId = id;
            writePool = m.pool || m.poolAddress;
            candidate = m;
            found = true;
          }
        } catch (err) {
          console.log(`    ${id.slice(0,10)}... getMarketOnchain error: ${err?.message?.slice(0,120)}`);
        }
      }
      if (found) console.log(`  Found Trading market: ${writeMarketId} pool ${writePool}`);
      else console.log("  ⚠️  No Trading markets among first 10 — read gates still pass, write gate will be blocked");
    } else {
      writeMarketId = marketId;
      writePool = pool;
    }
  } catch (e) {
    logGate("Gate 3 — getMarketOnchain", false, e?.message || String(e));
    console.error(e);
    process.exit(1);
  }

  // 4a. getBinaryOrderBook
  try {
    const poolForBook = writePool || pool;
    const book = await exchange.client.getBinaryOrderBook(poolForBook, { depth: 5 });
    const keys = Object.keys(book || {});
    const yesBids = book.yesBids ?? book.bids ?? [];
    const yesAsks = book.yesAsks ?? book.asks ?? [];
    logGate("Gate 4a — getBinaryOrderBook", true, `keys=${keys.join(",")} yesBids=${yesBids.length} yesAsks=${yesAsks.length}`);
    if (yesBids.length) console.log(`  best yesBid: ${JSON.stringify(yesBids[0], (_, v) => typeof v === 'bigint' ? v.toString()+'n' : v)}`);
    if (yesAsks.length) console.log(`  best yesAsk: ${JSON.stringify(yesAsks[0], (_, v) => typeof v === 'bigint' ? v.toString()+'n' : v)}`);
    if (yesBids.length===0 && yesAsks.length===0) console.log("  ⚠️  Empty book — Steady must show 'no liquidity → next window' (ImmediateOrCancelNoFill)");
  } catch (e) {
    logGate("Gate 4a — getBinaryOrderBook", false, e?.message || String(e));
    console.error(e);
    process.exit(1);
  }

  // 4b. getBinaryBookParams
  try {
    const poolForParams = writePool || pool;
    const params = await exchange.client.getBinaryBookParams(poolForParams);
    logGate("Gate 4b — getBinaryBookParams", true, `tickSize=${params.tickSize} lotSize=${params.lotSize} minQuantity=${params.minQuantity}`);
  } catch (e) {
    logGate("Gate 4b — getBinaryBookParams", false, e?.message || String(e));
    console.error(e);
    process.exit(1);
  }

  console.log("\n=== Read gates 1-4 PASSED ===");

  if (!WANT_WRITE) {
    console.log("\nWrite gate 5 SKIPPED — run with `npm run validate:write` and TEST_WALLET_PRIVATE_KEY to test real IOC");
    if (!PRIVATE_KEY) console.log("  (no TEST_WALLET_PRIVATE_KEY in env)");
    process.exit(0);
  }

  console.log("\n=== Write gate 5 — real IOC (requires funded wallet) ===");
  if (!PRIVATE_KEY) {
    console.log("BLOCKED: TEST_WALLET_PRIVATE_KEY not set — cannot run write gate. Set in .env (never NEXT_PUBLIC_*) and fund with STT + tUSDC.");
    process.exit(1);
  }
  if (!PRIVATE_KEY.startsWith("0x") || PRIVATE_KEY.length !== 66) {
    console.log("BLOCKED: TEST_WALLET_PRIVATE_KEY must be 0x + 64 hex (66 chars)");
    process.exit(1);
  }

  let account;
  try {
    account = privateKeyToAccount(PRIVATE_KEY);
    console.log(`Trader address: ${account.address}`);
  } catch (e) {
    console.log(`BLOCKED: invalid private key: ${e.message}`);
    process.exit(1);
  }

  const viemClient = exchange.client.getViemClient();
  let sttBal = 0n;
  try {
    sttBal = await viemClient.getBalance({ address: account.address });
    console.log(`STT balance: ${sttBal} wei (${Number(sttBal)/1e18} STT)`);
    if (sttBal < 600_000_000_000_000_000n) {
      console.log("BLOCKED: STT <0.6 — fund via Telegram faucet topic https://t.me/+XHq0F0JXMyhmMzM0, then retry");
      process.exit(1);
    }
  } catch (e) {
    console.log(`WARN: could not read STT balance: ${e.message} — continuing`);
  }

  try {
    const collateral = SOMNIA_TESTNET_ADDRESSES.collateral;
    const tusdcBal = await exchange.client.getErc20Balance(collateral, account.address);
    console.log(`tUSDC balance: ${tusdcBal} (6 decimals = ${Number(tusdcBal)/1e6})`);
    if (tusdcBal === 0n) {
      console.log("  → tUSDC 0 — attempting faucet() for 10k tUSDC...");
      const traderForFaucet = exchange.client.createTrader({ privateKey: PRIVATE_KEY });
      try {
        const fr = await traderForFaucet.faucet();
        console.log(`  faucet tx: ${fr.receipt?.transactionHash ?? fr.hash ?? JSON.stringify(fr).slice(0,300)}`);
        const tusdcBal2 = await exchange.client.getErc20Balance(collateral, account.address);
        console.log(`  tUSDC after faucet: ${tusdcBal2}`);
      } catch (fe) {
        console.log(`  faucet failed: ${fe.message?.slice(0,300) ?? String(fe).slice(0,300)}`);
      }
    }
  } catch (e) {
    console.log(`WARN: tUSDC balance check failed: ${e.message}`);
  }

  // Ensure Trading market for write
  let writeOnchain = onchain;
  if (writeOnchain?.status !== 1) {
    for (const m of live.slice(0, 10)) {
      try {
        const oc = await exchange.client.getMarketOnchain(m.marketId);
        if (oc.status===1) { writeMarketId = m.marketId; writePool = m.pool || m.poolAddress; writeOnchain = oc; candidate = m; break; }
      } catch {}
    }
  }
  if (writeOnchain?.status !== 1) {
    console.log("BLOCKED: no Trading market found for write — wait for next window (markets roll every 15m)");
    process.exit(1);
  }
  const expirySec = Number(candidate.expiry || 0);
  const nowSec = Math.floor(Date.now()/1000);
  if (expirySec && expirySec - nowSec < 60) {
    console.log(`BLOCKED: write market expires in ${expirySec-nowSec}s (<60s) — pick next window to avoid Locked revert`);
    process.exit(1);
  }

  console.log(`\nPlacing 1-lot IOC on ${writeMarketId} pool ${writePool} status ${writeOnchain.status}`);
  // Recreate exchange with privateKey to ensure trader path uses correct signer, or just use client.createTrader
  const trader = exchange.client.createTrader({ privateKey: PRIVATE_KEY });
  const book = await exchange.client.getBinaryOrderBook(writePool, { depth: 5 });
  const params = await exchange.client.getBinaryBookParams(writePool);
  console.log(`  book: yesAsks=${JSON.stringify((book.yesAsks||book.asks||[]).slice(0,2), (_, v) => typeof v === 'bigint' ? v.toString()+'n' : v)} tick=${params.tickSize} lot=${params.lotSize}`);

  const ONE = 1_000_000n;
  const tick = BigInt(params.tickSize);
  const lot = BigInt(params.lotSize);
  const quantity = lot;
  const asks = book.yesAsks || book.asks || [];
  let price = 500_000n;
  if (asks.length) {
    // asks are human-ish? Actually from harness best ask was "819000n" as bigint string — but YES book price is human *1e6? We treat as raw already
    // Convert ask price string/bigint to raw: book gives {price:"819000n"} => 819000
    let bestAskRaw = 0n;
    try {
      const raw = asks[0]?.price;
      bestAskRaw = typeof raw === 'bigint' ? raw : BigInt(String(raw).replace('n',''));
      // bestAskRaw is already raw 6-dec units (819000 = 0.819)
      price = bestAskRaw + 20000n; // cross by 0.02
      if (price >= ONE) price = bestAskRaw; // cap
      console.log(`  crossing ask ${bestAskRaw} with +0.02 => price ${price}`);
    } catch(e) {
      price = 550_000n;
      console.log(`  ask parse failed, fallback 0.55: ${e.message}`);
    }
  } else {
    price = 500_000n;
    console.log(`  empty book, using 0.50`);
  }
  const priceSnapped = (price / tick) * tick;
  if (priceSnapped === 0n || priceSnapped >= ONE) {
    console.log(`BLOCKED: snapped price ${priceSnapped} out of (0,1) range`);
    process.exit(1);
  }
  const expireTimestampNs = BigInt(Math.floor(Date.now()/1000 + 120) * 1_000_000_000);
  const marketExpiryNs = expirySec ? BigInt(expirySec) * 1_000_000_000n : expireTimestampNs + 100_000_000_000n;
  const finalExpiry = expireTimestampNs < marketExpiryNs ? expireTimestampNs : marketExpiryNs - 10_000_000_000n;
  console.log(`  price raw=${priceSnapped} qty raw=${quantity} expiryNs=${finalExpiry} (now+120s capped at marketExpiry-10s)`);

  try {
    const res = await trader.placeOrder({
      pool: writePool,
      side: "BUY_YES",
      price: priceSnapped,
      quantity,
      orderType: 2, // MARKET/IOC (2), not FILL_OR_KILL (1)
      expireTimestampNs: finalExpiry,
    });
    const receipt = res.receipt || res.info?.receipt || res;
    const hash = receipt.transactionHash || receipt.hash || res.transactionHash || "unknown";
    const status = receipt.status || res.status || "?";
    console.log(`✅ Gate 5 — placeOrder SENT — hash ${hash} status ${status}`);
    console.log(`  receipt: ${JSON.stringify(receipt, (_, v) => typeof v === 'bigint' ? v.toString()+'n' : v).slice(0, 800)}`);
    if (status === "reverted" || status === 0 || status === "0x0") {
      console.log("❌ Gate 5 — transaction reverted on-chain (check decoded error above) — not counted as fake success");
      process.exit(1);
    }
  } catch (e) {
    const msg = e?.message || String(e);
    const name = e?.name || "";
    console.log(`❌ Gate 5 — placeOrder threw: [${name}] ${msg.slice(0, 600)}`);
    if (msg.includes("0xd48c4403") || msg.includes("ImmediateOrCancelNoFill")) console.log("  → empty book ImmediateOrCancelNoFill — not a bug, try next window or seed liquidity");
    if (msg.includes("0xfb8f41b2") || msg.includes("ERC20InsufficientAllowance")) console.log("  → approval qty not escrow — need exact quantity approval");
    if (msg.includes("InvalidPrice")) console.log("  → price off tick grid — check tick snap");
    console.error(e);
    process.exit(1);
  }

  console.log("\n=== All gates PASSED (reads + write) ===");
}

main().catch(e => {
  console.error("Unhandled harness error:", e);
  process.exit(1);
});
