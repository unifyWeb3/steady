import dotenv from "dotenv";
dotenv.config();
import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const indexerUrl = process.env.NEXT_PUBLIC_INDEXER_URL || "https://dev.smk.somnia.host/v1/graphql";
const wsRpcUrl = process.env.NEXT_PUBLIC_WS_RPC_URL;
const marketId = "0x00000000000000000000000000000000000000000000000000000000000107fc";
const pool = "0x246a65643ad8b6c6dbd0b017a259da07681242fd";
const traderAddr = "0x0d6FAee78dFF4380E77D0e412F5Cddd942673719";
const txHash = "0xed05c90f6426b096d63c6ee2edd3d8aa201e94080d7454bf2215add29c72464c";

const exchange = new SomniaMarkets({
  indexerUrl,
  chain: somniaShannon,
  ...(wsRpcUrl ? { wsRpcUrl } : {}),
  addresses: SOMNIA_TESTNET_ADDRESSES,
});

console.log("Verifying tx", txHash);
try {
  const receipt = await exchange.client.getViemClient().getTransactionReceipt({ hash: txHash });
  console.log("Receipt status:", receipt.status, "block", receipt.blockNumber.toString(), "gasUsed", receipt.gasUsed.toString());
  console.log("Logs", receipt.logs.length);
  for(const l of receipt.logs.slice(0,3)) console.log(JSON.stringify(l, (_,v)=> typeof v==="bigint"?v.toString()+"n":v).slice(0,500));
} catch(e){ console.log("getTransactionReceipt failed:", e.message); }

try {
  const oc = await exchange.client.getMarketOnchain(marketId);
  console.log("MarketOnchain after:", "status", oc.status, "pool", oc.pool, "yesId", oc.yesId?.toString().slice(0,30), "noId", oc.noId?.toString().slice(0,30), "outcomeToken", oc.outcomeToken);
  try {
    const balYes = await exchange.client.getOutcomeBalance({ outcomeToken: oc.outcomeToken, owner: traderAddr, id: oc.yesId });
    const balNo = await exchange.client.getOutcomeBalance({ outcomeToken: oc.outcomeToken, owner: traderAddr, id: oc.noId });
    console.log("Outcome balances YES:", balYes.toString(), "NO:", balNo.toString());
  } catch(e){ console.log("getOutcomeBalance failed", e.message); }
} catch(e){ console.log("getMarketOnchain failed", e.message); }

try {
  const fills = await exchange.client.getUserFills(traderAddr, { since: 0, limit: 5 });
  console.log("getUserFills count:", fills.length);
  for(const f of fills.slice(0,3)) console.log(JSON.stringify(f, (_,v)=> typeof v==="bigint"?v.toString()+"n":v).slice(0,1000));
} catch(e){ console.log("getUserFills failed", e.message); }

try {
  const book = await exchange.client.getBinaryOrderBook(pool, { depth: 3 });
  console.log("Book after:", JSON.stringify(book, (_,v)=> typeof v==="bigint"?v.toString()+"n":v).slice(0,600));
} catch(e){ console.log("book failed", e.message); }

process.exit(0);
