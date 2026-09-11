// Steady app.js — real SDK, no mocks, discipline-first
// Shell boots WITHOUT waiting for SDK: SDK lazy-loads via dynamic import with
// timeout, so esm.sh slowness (~10s) or indexer outage never blanks the app.
// See research/32-control-plane.md (decoupled shell → data services → real data or explicit error).
import {
  buildTradeIntent,
  buildSideIntents,
  intentDisplay,
  buildIocOrder,
  summarizeOrderFills,
  classifyPlaceOrderResult,
  classifyIndexedFillEvidence,
  classifyClaimScan,
  formatPolicyProof,
} from "../lib/steady/trade-intent.js";
import { getBrowserConfig } from "../lib/config/browser.js";
import { computeScore, settledCallFromFill, brierLabel } from "../lib/steady/scoring.js";
import { resolvePositionState } from "../lib/steady/position-state.js";
import { escapeHtml, safeExplorerTx, isHexHash } from "../lib/steady/dom.js";
import {
  beginRedemption,
  redemptionButtonDisabled,
  countMatchingClaims,
  redemptionStateAfterReceipt,
  redemptionStateAfterReconcile,
  redemptionStateAfterSubmissionError,
  canRetryReconciliation,
} from "../lib/steady/redemption-state.js";
import { createRequestGeneration } from "../lib/steady/request-generation.js";

const BROWSER_CONFIG = getBrowserConfig();
const CHAIN_ID = BROWSER_CONFIG.chainId;
const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}`;
// The SDK's getBinaryOrderBook returns up to the requested number of price
// levels and exposes no pagination/completeness bit. Use a materially wider
// snapshot for execution so aggregate depth is not reduced to the best level.
const EXECUTION_BOOK_DEPTH = 100;

let _sdk = null; // { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES, somniaShannon, viem }
let _sdkError = null;
function debugLog(...args) {
  if (localStorage.getItem("steady:debug")) console.log(...args);
}
function debugError(...args) {
  if (localStorage.getItem("steady:debug")) console.error(...args);
}
function loadSdk(timeoutMs = 30000){
  debugLog("loadSdk started");
  if(_sdk) return Promise.resolve(_sdk);
  // No permanent error cache: esm.sh/indexer blips must not brick Retry until reload.
  const p = (async()=>{
    debugLog("importing @somnia-chain/markets-sdk");
    const [sdk, chains, viem] = await Promise.all([
      import("@somnia-chain/markets-sdk"),
      import("@somnia-chain/markets-sdk/chains"),
      import("viem"),
    ]);
    debugLog("imports done");
    _sdk = { SomniaMarkets: sdk.SomniaMarkets, SOMNIA_TESTNET_ADDRESSES: sdk.SOMNIA_TESTNET_ADDRESSES, somniaShannon: chains.somniaShannon, viem };
    return _sdk;
  })();
  const t = new Promise((_,rej)=>setTimeout(()=>rej(new Error(`SDK import timeout after ${timeoutMs}ms — esm.sh slow/blocked, Retry`)), timeoutMs));
  return Promise.race([p, t]).catch(e=>{ _sdkError = e; setTimeout(()=>{ if(_sdkError === e) _sdkError = null; }, 15000); throw e; });
}

const els = {
  statusBar: document.getElementById("statusBar"),
  marketTbody: document.getElementById("marketTbody"),
  marketCount: document.getElementById("marketCount"),
  marketHealth: document.getElementById("marketHealth"),
  marketEmpty: document.getElementById("marketEmpty"),
  ticketMarket: document.getElementById("ticketMarket"),
  maxLoss: document.getElementById("maxLoss"),
  buyYes: document.getElementById("buyYes"),
  buyNo: document.getElementById("buyNo"),
  previewPay: document.getElementById("previewPay"),
  previewWin: document.getElementById("previewWin"),
  previewExpiry: document.getElementById("previewExpiry"),
  previewBook: document.getElementById("previewBook"),
  previewCapped: document.getElementById("previewCapped"),
  confirmBox: document.getElementById("confirmBox"),
  tiltGuard: document.getElementById("tiltGuard"),
  tiltMsg: document.getElementById("tiltMsg"),
  tiltCountdown: document.getElementById("tiltCountdown"),
  execStatus: document.getElementById("execStatus"),
  connectBtn: document.getElementById("connectBtn"),
  walletAddr: document.getElementById("walletAddr"),
  refreshBtn: document.getElementById("refreshBtn"),
  posTbody: document.getElementById("posTbody"),
  brierVal: document.getElementById("brierVal"),
  edgeVal: document.getElementById("edgeVal"),
  brierFill: document.getElementById("brierFill"),
  edgeFill: document.getElementById("edgeFill"),
  brierLabel: document.getElementById("brierLabel"),
  scoreN: document.getElementById("scoreN"),
  last5: document.getElementById("last5"),
  // scoreDetail: document.getElementById("scoreDetail"),
  redeemAll: document.getElementById("redeemAll"),
  faucetBtn: document.getElementById("faucetBtn"),
  faucetStatus: document.getElementById("faucetStatus"),
  settlementList: document.getElementById("settlementList"),
  riskNum: document.getElementById("riskNum"),
  riskSub: document.getElementById("riskSub"),
  previewCappedRow: document.getElementById("previewCappedRow"),
  ticketRows: document.getElementById("ticketRows"),
  ticketCta: document.getElementById("ticketCta"),
};

let exchange = null;
let selected = null; // SteadyMarket
let book = null;
let bookParams = null;
let walletClient = null;
let walletAddress = null;
let walletChainVerified = false;
let fillsCache = []; // settled + open
let cooldownUntil = null;
let marketsCache = [];
const discoveryRequests = createRequestGeneration();
const selectionRequests = createRequestGeneration();
const fillsRequests = createRequestGeneration();
const scoreRequests = createRequestGeneration();
const redemptionRequests = createRequestGeneration();
let redemptionState = "READY";
let redemptionHash = "";
let redemptionEntries = [];
let selectionError = "";
let unresolvedTransactionHash = "";

// Outage cache: bigint-safe persist so returning wallets keep working when the
// indexer is down (chain RPC reads still resolve states fully on-chain).
const _bj = {
  stringify: (o)=> JSON.stringify(o, (k,v)=> (typeof v === "bigint" ? { __bigint: v.toString() } : v)),
  parse: (s)=> JSON.parse(s, (k,v)=> (v && typeof v === "object" && typeof v.__bigint === "string") ? BigInt(v.__bigint) : v),
};
function persistCache(){
  try{
    localStorage.setItem("steady:marketsCache", _bj.stringify({ at: Date.now(), rows: marketsCache.slice(0,12) }));
    localStorage.setItem("steady:fillsCache", _bj.stringify({ at: Date.now(), rows: fillsCache.slice(0,50) }));
  }catch{}
}
function restoreCache(){
  try{
    const m = _bj.parse(localStorage.getItem("steady:marketsCache") || "null");
    const f = _bj.parse(localStorage.getItem("steady:fillsCache") || "null");
    if(m && Array.isArray(m.rows) && !marketsCache.length) marketsCache = m.rows;
    if(f && Array.isArray(f.rows) && !fillsCache.length) fillsCache = f.rows;
    return { markets: !!(m && m.rows && m.rows.length), fills: !!(f && f.rows && f.rows.length) };
  }catch{ return { markets:false, fills:false }; }
}
function isIndexerError(e){
  const m = ((e && e.message) ? e.message : String(e)) || "";
  return /504|502|503|indexer|timeout|Timeout|UND_ERR|ConnectTimeout|fetch failed|Failed to fetch|NetworkError/i.test(m);
}

// Init SDK (reads, no key) — async: waits for lazy SDK load
async function getExchange() {
  if (exchange) return exchange;
  const sdk = await loadSdk();
  exchange = new sdk.SomniaMarkets({
    indexerUrl: BROWSER_CONFIG.indexerUrl,
    chain: sdk.somniaShannon,
    wsRpcUrl: BROWSER_CONFIG.wsRpcUrl,
    addresses: sdk.SOMNIA_TESTNET_ADDRESSES,
  });
  return exchange;
}
function getSdkAddrs(){ return _sdk ? _sdk.SOMNIA_TESTNET_ADDRESSES : null; }

function fmtCountdown(expirySec) {
  const now = Math.floor(Date.now()/1000);
  const left = expirySec - now;
  if (left <= 0) return { text: "locked", cls: "countdown-low" };
  const m = Math.floor(left/60), s = left%60;
  const text = `${m}m ${String(s).padStart(2,"0")}s`;
  if (left < 60) return { text: `locks in ${s}s`, cls: "countdown-low" };
  if (left < 120) return { text, cls: "countdown-warn" };
  return { text, cls: "" };
}
function fmtExpiry(expirySec) { return fmtCountdown(expirySec).text; }
function stateBadge(state){
  const map = { LIVE:"badge badge-live", SETTLING:"badge", CLAIMABLE:"badge badge-solid", WON:"badge badge-up", LOST:"badge badge-down", VOID:"badge badge-void", REDEEMED:"badge badge-quiet", LOCKED:"badge", PENDING:"badge badge-unknown", UNKNOWN:"badge badge-unknown", STALE:"badge badge-stale" };
  return map[state] || "badge";
}
function shortHash(h){ return h && h.length>12 ? h.slice(0,8)+"…"+h.slice(-4) : (h||"—"); }
function h(value){ return escapeHtml(value); }
function txMarkup(hash, label = shortHash(hash)) {
  const text = h(label || "—");
  return isHexHash(hash)
    ? `<a class="hashlink" href="${safeExplorerTx(hash)}" target="_blank" rel="noopener">${text} ↗</a>`
    : text;
}
function receiptPricePresentation(side, quotedYes, actualYes = null) {
  const quote = Number(quotedYes);
  const actual = actualYes === null || actualYes === undefined ? null : Number(actualYes);
  if (!Number.isFinite(quote) || quote <= 0 || quote >= 1) throw new Error("Invalid YES-term quote");
  if (actual !== null && (!Number.isFinite(actual) || actual <= 0 || actual >= 1)) throw new Error("Invalid YES-term fill");
  if (side === "BUY_NO") {
    const quotedNo = (1 - quote).toFixed(3);
    const actualNo = actual === null ? null : (1 - actual).toFixed(3);
    return {
      rowsHtml: `<div class="prow receipt-primary-price"><span class="k">Quoted NO</span><span class="v">${quotedNo}</span></div>` +
        `<div class="prow receipt-primary-price"><span class="k">Actual NO</span><span class="v">${actualNo ?? "NO FILL — nothing paid"}</span></div>` +
        `<div class="prow"><span class="k">YES-equivalent</span><span class="v">${quote.toFixed(3)} → ${actual === null ? "NO FILL" : actual.toFixed(3)}</span></div>`,
      copyText: `quoted NO ${quotedNo}${actualNo === null ? " → NO FILL" : ` → actual NO ${actualNo} (YES-equivalent ${quote.toFixed(3)} → ${actual.toFixed(3)})`}`,
    };
  }
  if (side !== "BUY_YES") throw new Error("Invalid order side");
  return {
    rowsHtml: `<div class="prow receipt-primary-price"><span class="k">Quoted UP</span><span class="v">${quote.toFixed(3)}</span></div>` +
      `<div class="prow receipt-primary-price"><span class="k">Actual UP</span><span class="v">${actual === null ? "NO FILL — nothing paid" : actual.toFixed(3)}</span></div>`,
    copyText: `quoted UP ${quote.toFixed(3)}${actual === null ? " → NO FILL" : ` → actual UP ${actual.toFixed(3)}`}`,
  };
}
// Market IDs are sequential (0x0000…0136e3) — first chars identical, last 6 disambiguate
function mktShort(id){ return id && id.length>10 ? "…"+id.slice(-6) : (id||"—"); }
// Indexer calls hang (not just fail fast) during outages — every indexer-backed
// read races a timeout so the UI degrades instead of dangling mid-sentence.
function withTimeout(promise, ms, label){
  return Promise.race([
    promise,
    new Promise((_, rej)=> setTimeout(()=> rej(new Error(`${label || "Indexer read"} timed out after ${Math.round(ms/1000)}s — retry`)), ms)),
  ]);
}

let walletStatusText = "";

function setStatus(msg, kind=""){
  let full = msg;
  if (walletStatusText) {
    full = `${walletStatusText} · ${msg}`;
  }
  els.statusBar.textContent = full;
  els.statusBar.classList.toggle("is-error", kind === "risk");
  if (kind) {
    els.statusBar.style.color = kind === "risk" ? "var(--risk)" : kind === "success" ? "var(--up)" : "inherit";
  } else {
    els.statusBar.style.color = "inherit";
  }
}

function setMarketHealth(state, count = 0){
  if (!els.marketHealth) return;
  els.marketHealth.classList.toggle("is-unavailable", state === "unavailable");
  els.marketHealth.classList.toggle("badge-live", state === "live");
  els.marketHealth.classList.toggle("badge-unknown", state !== "live");
  if (state === "live") {
    els.marketHealth.innerHTML = `<span class="dot"></span><span id="marketCount">${count}</span> live windows`;
  } else if (state === "checking") {
    els.marketHealth.innerHTML = `<span class="badge-mark">…</span><span id="marketCount">${count ? `${count} windows · status checks pending` : "status check in progress"}</span>`;
  } else {
    els.marketHealth.innerHTML = `<span class="badge-mark">!</span><span id="marketCount">status unavailable</span>`;
  }
  els.marketCount = document.getElementById("marketCount");
}

// Discovery — >60s headroom, with timeout and decoupled shell (app shell renders even if indexer hangs)
async function loadMarkets(){
  const generation = discoveryRequests.start();
  const current = () => discoveryRequests.isCurrent(generation);
  // Discovery owns which market is executable; invalidate any older book
  // request so a late selection cannot repopulate a cleared ticket.
  selectionRequests.invalidate();
  els.marketTbody.innerHTML = `<tr><td colspan="6" class="empty">Loading live markets…</td></tr>`;
  setStatus("Loading SDK…", "");
  setMarketHealth("checking");
  let stillLoading = true;
  const fallback = setTimeout(()=>{
    if(stillLoading && current()){
      els.marketTbody.innerHTML = `<tr><td colspan="6" class="empty">
        <div style="padding:16px;display:grid;gap:12px;justify-items:center">
          <div class="caption">Market data unavailable</div>
          <div style="font-size:13px;color:var(--ink-2)">Indexer timed out after 12s — check network, then retry</div>
          <button class="btn btn-secondary" data-retry="1" onclick="window.loadMarkets&&window.loadMarkets()" style="height:32px">Retry</button>
          <div class="caption">App shell remains usable — wallet, ticket, and positions work without live markets</div>
        </div>
      </td></tr>`;
      setMarketHealth("unavailable");
      setStatus("Market data timeout — retry available", "risk");
    }
  }, 13000);
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), 12000);
  try{
    let ex;
    try{ ex = await getExchange(); }
    catch(sdkErr){ throw new Error(`SDK load failed: ${(sdkErr&&sdkErr.message)||sdkErr} — esm.sh slow/blocked, Retry`); }
    if (!current()) return;
    setStatus("Loading live markets…", "");
    const livePromise = ex.client.listLiveBinaryMarkets({ limit: 50 });
    const live = await Promise.race([
      livePromise,
      new Promise((_,rej)=> setTimeout(()=>rej(new Error("Indexer timeout after 12s — retry")), 12000))
    ]);
    if (!current()) return;
    clearTimeout(timeout);
    clearTimeout(fallback);
    stillLoading = false;
    const now = Math.floor(Date.now()/1000);
    const eligible = [];
    for(const m of live){
      const asset = (m.asset||"").toUpperCase();
      const intervalSec = Number(m.intervalSec||0);
      const expirySec = Number(m.expiry||0);
      if (!["BTC","ETH"].includes(asset)) continue;
      if (![60,300,900,3600,14400,86400].includes(intervalSec)) continue;
      if (expirySec - now <= 60) continue;
      const pool = m.pool || m.poolAddress;
      if (!m.marketId || !pool) continue;
      eligible.push({ marketId: m.marketId, asset, intervalSec, expirySec, pool, raw:m });
    }
    eligible.sort((a,b)=>a.expirySec-b.expirySec);
    setMarketHealth("checking", eligible.length);
    if (eligible.length===0){
      selected = null;
      book = null;
      bookParams = null;
      updatePreview();
      els.marketTbody.innerHTML = "";
      els.marketEmpty.style.display="block";
      setStatus("No live windows with headroom — retrying in 15s","risk");
      return;
    }
    els.marketEmpty.style.display="none";
    // Gate on Trading status 1 for first 8. A failed status read is not
    // authorization to display a market as live.
    const withStatus = [];
    let statusFailures = 0;
    for(const m of eligible.slice(0,8)){
      if (!current()) return;
      try{
        const oc = await ex.client.getMarketOnchain(m.marketId);
        if (oc.status===1) withStatus.push({...m, status: oc.status});
        else statusFailures++;
      }catch{ statusFailures++; }
    }
    const display = withStatus;
    if (!current()) return;
    if (!display.length) {
      selected = null;
      book = null;
      bookParams = null;
      updatePreview();
      els.marketTbody.innerHTML = `<tr><td colspan="6" class="empty">
        <div style="padding:16px;display:grid;gap:12px;justify-items:center">
          <div class="caption">Market status unavailable</div>
          <div style="font-size:13px;color:var(--ink-2)">Trading status could not be verified for the discovered windows. No rows are authorized.</div>
          <button class="btn btn-secondary" data-retry="1" onclick="window.loadMarkets&&window.loadMarkets()" style="height:32px">Retry</button>
        </div>
      </td></tr>`;
      setMarketHealth("unavailable");
      setStatus("Market status unavailable — retry required", "risk");
      return;
    }
    // A refresh that can no longer prove the selected market must not leave a
    // stale executable ticket on screen.
    if (selected && !display.some((m) => m.marketId === selected.marketId)) {
      selected = null;
      book = null;
      bookParams = null;
      updatePreview();
    } else if (selected) {
      selected = display.find((m) => m.marketId === selected.marketId) || selected;
    }
    // Persist only rows whose on-chain Trading status was actually verified.
    marketsCache = display;
    try{ persistCache(); }catch{}
    setMarketHealth("live", display.length);
    els.marketTbody.innerHTML = "";
    for(const m of display){
      if (!current()) return;
      // fetch book for spread preview (best effort)
      let spreadTxt="—", bidTxt="—", askTxt="—";
      try{
        const b = await ex.client.getBinaryOrderBook(m.pool, { depth: 3 });
        if (!current()) return;
        const bestBid = b.yesBids?.[0]?.price, bestAsk = b.yesAsks?.[0]?.price;
        if (bestBid) bidTxt = (Number(bestBid)/1e6).toFixed(3);
        if (bestAsk) askTxt = (Number(bestAsk)/1e6).toFixed(3);
        if (b.yesBids?.length && b.yesAsks?.length) spreadTxt = ((Number(bestAsk)-Number(bestBid))/1e6).toFixed(3);
      }catch{}
      const cd = fmtCountdown(m.expirySec);
      const label = m.intervalSec===60?"1m":m.intervalSec===300?"5m":m.intervalSec===900?"15m":m.intervalSec===3600?"1h":m.intervalSec===14400?"4h":m.intervalSec===86400?"1d":`${m.intervalSec}s`;
      const tr = document.createElement("tr");
      tr.className="row";
      tr.dataset.marketId = m.marketId;
      tr.style.cursor="pointer";
      tr.innerHTML = `
        <td data-l="Market"><span class="mono rowmain">${h(m.asset)}</span> <span class="caption">${h(label)}</span><br><span class="caption mono">${h(mktShort(m.marketId))}</span></td>
        <td data-l="Expiry" class="mono">${new Date(m.expirySec*1000).toISOString().slice(11,16)} UTC</td>
        <td data-l="Time left" class="mono ${h(cd.cls)}">${h(cd.text)}</td>
        <td data-l="Best bid / ask" class="mono num">${h(bidTxt)} / ${h(askTxt)}</td>
        <td data-l="Spread" class="mono num">${h(spreadTxt)}</td>
        <td data-l="Select"><button class="btn btn-secondary btn-sm">Select</button></td>`;
      tr.querySelector("button").onclick = (e) => { e.stopPropagation(); selectMarket(m); };
      tr.onclick = () => selectMarket(m);
      els.marketTbody.appendChild(tr);
    }
    // Never leave the ticket in its dead CTA state when live windows exist:
    // preselect the soonest-expiring window (read-only book fetch, no order path).
    if (!selected && display.length) selectMarket(display[0]);
    setStatus(`Live: ${display.length} Trading windows with >60s headroom (BTC/ETH 1m/5m/15m/1h/4h/1d)${statusFailures ? ` · ${statusFailures} status checks unavailable` : ""}`, "success");
  }catch(e){
    if (!current()) return;
    clearTimeout(timeout);
    const msg = e.message||String(e);
    const isTimeout = msg.includes("timeout") || msg.includes("Timeout") || e.name==="AbortError";
    els.marketTbody.innerHTML = `<tr><td colspan="6" class="empty">
      <div style="padding:16px;display:grid;gap:12px;justify-items:center">
        <div class="caption">Market data unavailable</div>
        <div style="font-size:13px;color:var(--ink-2)">${isTimeout ? "Indexer timed out after 12s" : `Indexer error: ${h(msg.slice(0,120))}`}</div>
        <button class="btn btn-secondary" data-retry="1" onclick="window.loadMarkets&&window.loadMarkets()" style="height:32px">Retry</button>
        <div class="caption">App shell remains usable — wallet, ticket, and positions work without live markets</div>
      </div>
    </td></tr>`;
    // A failed refresh cannot prove the previously selected market is still
    // Trading. Clear the executable ticket instead of authorizing from stale
    // discovery/book state.
    selected = null;
    book = null;
    bookParams = null;
    updatePreview();
    setMarketHealth("unavailable");
    setStatus(isTimeout ? "Market data timeout — retry available" : `Market data error — ${msg.slice(0,80)}`, "risk");
    // schedule retry in 15s, but don't block shell
    setTimeout(()=>{ if(document.visibilityState==="visible" && current()) loadMarkets(); }, 15000);
  }
}

async function selectMarket(m){
  const generation = selectionRequests.start();
  const current = () => selectionRequests.isCurrent(generation);
  selected = m;
  // A new label is never allowed to inherit the previous market's economics.
  book = null;
  bookParams = null;
  selectionError = "";
  els.ticketMarket.textContent = `${m.asset} ${m.intervalSec===60?"1m":m.intervalSec===300?"5m":m.intervalSec===900?"15m":m.intervalSec===3600?"1h":m.intervalSec===14400?"4h":m.intervalSec===86400?"1d":`${m.intervalSec}s`} · expiry ${new Date(m.expirySec*1000).toISOString().slice(11,16)} UTC · ${mktShort(m.marketId)} · pool ${m.pool.slice(0,10)}…`;
  els.ticketMarket.title = m.marketId;
  document.querySelectorAll("#marketTbody tr.row").forEach(tr=>{
    tr.classList.toggle("selected", tr.dataset.marketId === m.marketId);
  });
  updatePreview();
  // fetch book + params
  try{
    const ex = await getExchange();
    const nextBook = await ex.client.getBinaryOrderBook(m.pool, { depth: EXECUTION_BOOK_DEPTH });
    const nextBookParams = await ex.client.getBinaryBookParams(m.pool);
    if (!current()) return;
    book = nextBook;
    bookParams = nextBookParams;
    selectionError = "";
    updatePreview();
  }catch(e){
    if (!current()) return;
    book = null;
    bookParams = null;
    selectionError = `Book unavailable: ${(e.message || String(e)).slice(0,100)}`;
    updatePreview();
  }
  // countdown ticker
  if (window._ticker) clearInterval(window._ticker);
  window._ticker = setInterval(()=>{ if(selected) els.previewExpiry.textContent = `Expiry ${fmtExpiry(selected.expirySec)} · Spread ${book?.yesBids?.[0] && book?.yesAsks?.[0] ? ((Number(book.yesAsks[0].price)-Number(book.yesBids[0].price))/1e6).toFixed(3) : "—"}`; },1000);
}

function computeTicket(maxLossHuman, side){
  if(!selected) return { error:"Select market first" };
  if(!book || !bookParams) return { error: selectionError || "Fresh orderbook is loading" };
  const availableRaw = window.__tUSDCBalance !== undefined ? window.__tUSDCBalance : undefined;
  const intent = buildTradeIntent({
    side,
    maxLossHuman,
    book,
    params: bookParams,
    marketStatus: selected.status,
    expirySec: selected.expirySec,
    availableBalanceRaw: availableRaw,
  });
  if (!intent.ok) return { error: intent.reason, intent };
  const display = intentDisplay(intent);
  return { ...intent, intent, qtyRaw: intent.quantityRaw, priceRaw: intent.yesPriceRaw, priceProb: Number(intent.sidePriceRaw)/1e6, spread: Number(intent.spreadRaw)/1e6, bookDepth: intent.bookDepthRaw, display };
}

function updateExecutionControls(){
  const maxLoss = Number(els.maxLoss.value);
  const globalReasons = [];
  if (!walletAddress || !walletClient || !walletChainVerified) globalReasons.push("connect wallet on Shannon 50312");
  if (!selected) globalReasons.push("select a verified Trading window");
  else if (selected.status !== 1) globalReasons.push("market status is not verified Trading");
  if (!book || !bookParams) globalReasons.push(selectionError || "fresh orderbook is loading");
  if (!(maxLoss > 0)) globalReasons.push("enter a max loss");
  if (!els.confirmBox.checked) globalReasons.push("acknowledge the IOC max-loss terms");
  if (cooldownUntil && cooldownUntil > Date.now()) globalReasons.push("cooldown is active");
  if (window.__submitting) globalReasons.push("another transaction is submitting");
  if (unresolvedTransactionHash) globalReasons.push("previous transaction is unresolved");
  if (walletAddress && window.__tUSDCBalance === undefined) globalReasons.push("collateral balance is unavailable");
  const globalBlocked = globalReasons.length > 0;
  const sideReasons = {};
  for (const side of ["BUY_YES", "BUY_NO"]) {
    const ticket = !globalBlocked && selected && book && bookParams && maxLoss > 0 ? computeTicket(maxLoss, side) : null;
    if (ticket?.error) sideReasons[side] = ticket.intent?.reason || ticket.error;
  }
  const setButton = (button, side, label) => {
    const reason = globalReasons[0] || sideReasons[side] || "execution is not authorized";
    const blocked = globalBlocked || Boolean(sideReasons[side]);
    button.disabled = blocked;
    button.setAttribute("aria-disabled", String(blocked));
    button.title = blocked ? `Blocked: ${reason}` : "Ready to submit the displayed IOC";
    if (blocked && !window.__submitting) button.dataset.blockReason = reason;
    else delete button.dataset.blockReason;
    if (blocked && globalReasons.length) button.textContent = label;
  };
  setButton(els.buyYes, "BUY_YES", "Buy UP");
  setButton(els.buyNo, "BUY_NO", "Buy DOWN");
  const gateBadge = document.getElementById("policyGateBadge");
  if (gateBadge && (els.buyYes.disabled && els.buyNo.disabled)) {
    gateBadge.textContent = "Blocked";
    gateBadge.className = "badge badge-down";
  }
  if (els.previewCappedRow && (globalBlocked || sideReasons.BUY_YES || sideReasons.BUY_NO)) {
    const sideText = [sideReasons.BUY_YES && `UP ${sideReasons.BUY_YES}`, sideReasons.BUY_NO && `DOWN ${sideReasons.BUY_NO}`].filter(Boolean).join("; ");
    els.previewCapped.textContent = `Trade policy: BLOCKED — ${globalReasons[0] || sideText || "execution is not authorized"}.`;
    els.previewCappedRow.style.display = "flex";
  }
}

function updatePreview(){
  const v = Number(els.maxLoss.value);
  const ready = v > 0 && !!selected;
  // Never show the 4-dash dead matrix: CTA until a window is picked AND max loss entered.
  if (els.ticketRows) els.ticketRows.hidden = !ready;
  if (els.ticketCta) {
    els.ticketCta.style.display = ready ? "none" : "grid";
    const sub = els.ticketCta.querySelector(".ticket-cta-sub");
    if (sub) sub.textContent = !selected
      ? "Live bid/ask, spread and expiry appear here — no invented numbers."
      : "Enter a max loss above to price pay, profit and contracts.";
  }
  if (!ready) {
    if(els.riskNum) els.riskNum.textContent="—";
    if(els.riskSub) els.riskSub.textContent = !selected
      ? (v > 0 ? "Pick a live window" : "Enter max loss + pick a window")
      : "Enter max loss";
    els.buyYes.textContent="Buy UP"; els.buyNo.textContent="Buy DOWN";
    if (!selected) {
      els.previewPay.textContent="—"; els.previewWin.textContent="—";
      els.previewExpiry.textContent="—"; els.previewBook.textContent="—";
    }
    try{ renderPolicyGate(); }catch{}
    updateExecutionControls();
    return;
  }
  // show both sides preview for current maxLoss; labels map UP=YES outcome, DOWN=NO outcome
  const yes = computeTicket(v, "BUY_YES");
  const no = computeTicket(v, "BUY_NO");
  if (yes.error && no.error) {
    els.previewPay.textContent=`Unavailable: ${yes.error}`;
    els.previewWin.textContent=`Unavailable: ${no.error}`;
    if(els.riskNum) els.riskNum.textContent=`${v.toFixed(2)} tUSDC`;
    if(els.riskSub) els.riskSub.textContent="No executable side on the current book";
    els.buyYes.textContent="Buy UP";
    els.buyNo.textContent="Buy DOWN";
    els.previewExpiry.textContent = selected ? `${fmtExpiry(selected.expirySec)} · unavailable` : "—";
    els.previewBook.textContent = selectionError || "Fresh orderbook is loading…";
    els.previewCapped.textContent = `Trade policy: DENIED — UP ${yes.intent?.code || "UNAVAILABLE"}; DOWN ${no.intent?.code || "UNAVAILABLE"}.`;
    if (els.previewCappedRow) els.previewCappedRow.style.display = "flex";
    try{ renderPolicyGate(); }catch{}
    updateExecutionControls();
    return;
  }
  const yesDisplay = intentDisplay(yes.intent);
  const noDisplay = intentDisplay(no.intent);
  if(els.riskNum) els.riskNum.textContent = `${v.toFixed(2)} tUSDC`;
  if(els.riskSub) els.riskSub.textContent = "Maximum spend per direction · IOC";
  els.previewPay.textContent = yes.error ? `Unavailable: ${yes.error}` : `${yesDisplay.pay} → ${yesDisplay.payout} · +${yesDisplay.profit} · ${yesDisplay.quantity} @ ${yesDisplay.probability}`;
  els.previewWin.textContent = no.error ? `Unavailable: ${no.error}` : `${noDisplay.pay} → ${noDisplay.payout} · +${noDisplay.profit} · ${noDisplay.quantity} @ ${noDisplay.probability}`;
  const spread = yes.spread ?? no.spread;
  els.previewExpiry.textContent = `${fmtExpiry(selected.expirySec)} · ${spread!==undefined&&spread!==null?spread.toFixed(3):"—"}`;
  els.previewBook.textContent = `${book?.yesBids?.[0]? (Number(book.yesBids[0].price)/1e6).toFixed(3):"—"} / ${book?.yesAsks?.[0]? (Number(book.yesAsks[0].price)/1e6).toFixed(3):"—"} · t${bookParams?.tickSize} l${bookParams?.lotSize}`;
  els.buyYes.textContent = yes.error ? "Buy UP" : `Buy UP — ${yesDisplay.pay}`;
  els.buyNo.textContent = no.error ? "Buy DOWN" : `Buy DOWN — ${noDisplay.pay}`;
  // Policy consistency: current account state vs this execution's policy result must never contradict
  if (cooldownUntil && cooldownUntil > Date.now()){
    const secs = Math.ceil((cooldownUntil-Date.now())/1000);
    els.previewCapped.textContent = `Trade policy: DENIED — cooldown active (${secs}s remaining). Current account state: COOLDOWN.`;
    if (els.previewCappedRow) els.previewCappedRow.style.display = "flex";
  } else {
    const sideState = `UP ${yes.error ? yes.intent?.code || "DENIED" : "PASS"} · DOWN ${no.error ? no.intent?.code || "DENIED" : "PASS"}`;
    els.previewCapped.textContent = `Trade policy preview: ${sideState}. Fresh state is checked again at execution.`;
    if (els.previewCappedRow) els.previewCappedRow.style.display = "flex";
  }
  try{ renderPolicyGate(); }catch{}
  updateExecutionControls();
}

// Policy gate — live per-check states (the gate reports, never decorates).
// ✓ pass · ✗ fail + reason in title · ○ unknown (not enough data yet — honest, not green).
function renderPolicyGate(){
  const set = (id, pass, reason)=>{
    const el = document.getElementById(id);
    if(!el) return;
    const box = el.querySelector(".check");
    if(box) box.textContent = pass === true ? "✓" : pass === false ? "✗" : "○";
    el.classList.toggle("policy-fail", pass === false);
    el.title = reason || "";
  };
  const now = Math.floor(Date.now()/1000);
  set("pg-market", selected ? selected.status === 1 : null, selected
    ? selected.status === 1
      ? `Selected ${selected.asset} ${String(selected.marketId).slice(0,10)}… (Trading re-verified at execution)`
      : "Trading status is not verified"
    : "Pick a live window");
  const head = selected ? (selected.expirySec - now) : null;
  set("pg-headroom", head === null ? null : head >= 60, head === null ? "Pick a live window" : head >= 60 ? `${Math.floor(head/60)}m ${head%60}s to lock` : `Locks in ${head}s — pick the next window`);
  const hasBook = !!(book && ((book.yesAsks && book.yesAsks.length) || (book.yesBids && book.yesBids.length)));
  set("pg-liquidity", !book ? null : hasBook, !book ? "Book loading…" : hasBook ? "Live book present" : "Empty book — try the next window");
  let spread = null;
  if (book?.yesBids?.[0]?.price !== undefined && book?.yesAsks?.[0]?.price !== undefined) {
    try{ spread = (Number(book.yesAsks[0].price) - Number(book.yesBids[0].price)) / 1e6; }catch{}
  }
  set("pg-spread", spread === null ? null : spread <= 0.15, spread === null ? "Book loading…" : `Spread ${spread.toFixed(3)}${spread > 0.15 ? " — execution will refuse (SPREAD_TOO_WIDE)" : ""}`);
  const settled = (window.__lastSettledCalls || []).filter(c=>!c.void);
  let streak = 0;
  for(let i=settled.length-1;i>=0;i--){ if(!settled[i].won) streak++; else break; }
  const cooling = !!(cooldownUntil && cooldownUntil > Date.now());
  set("pg-discipline", cooling ? false : true, cooling ? `${streak} consecutive losses — cooldown active` : streak ? `${streak} straight loss${streak>1?"es":""} (2 in a row blocks)` : "No loss streak");
  const bal = window.__tUSDCBalance;
  set("pg-balance", !walletAddress ? null : (bal === undefined ? null : bal > 0n), !walletAddress ? "Connect wallet" : bal === undefined ? "Reading balance…" : bal > 0n ? `${(Number(bal)/1e6).toFixed(2)} tUSDC` : "Empty — use the faucet button");
  const badge = document.getElementById("policyGateBadge");
  if(badge){
    const mark = (id)=>document.getElementById(id)?.querySelector(".check")?.textContent;
    const ids = ["pg-market","pg-headroom","pg-liquidity","pg-spread","pg-discipline","pg-balance"];
    if(cooling || ids.some(id=>mark(id)==="✗")){ badge.textContent = "Blocked"; badge.className = "badge badge-down"; }
    else if(ids.some(id=>mark(id)==="○")){ badge.textContent = "Check"; badge.className = "badge"; }
    else { badge.textContent = "Authorized"; badge.className = "badge"; badge.classList.add("badge-up"); }
  }
}

// Wallet — Rabby/MetaMask compatible, handles providers array
function getInjectedProvider(){
  const eth = window.ethereum;
  if(!eth) return null;
  // Rabby may inject providers array
  if(eth.providers && Array.isArray(eth.providers)){
    // prefer Rabby if present, else first
    const rabby = eth.providers.find(p=>p.isRabby);
    return rabby || eth.providers[0] || eth;
  }
  return eth;
}
async function connect(){
  const provider = getInjectedProvider();
  if (!provider) { alert("No injected wallet — install Rabby or MetaMask"); return; }
  els.connectBtn.disabled = true;
  setStatus("Connecting wallet…", "");
  walletChainVerified = false;
  updateExecutionControls();
  // Atomic connect: the UI only ever shows "Connected" AFTER a usable walletClient
  // exists. A half-connected address label with a dead trader cost us a real
  // debugging session — never again.
  let _addr = null, _wc = null;
  try{
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    if(!accounts || !accounts[0]) throw new Error("Wallet returned no accounts");
    _addr = accounts[0];
    // check chain
    const chainIdHex = await provider.request({ method: "eth_chainId" });
    const chainId = parseInt(chainIdHex,16);
    if (chainId!==CHAIN_ID){
      try{ await provider.request({ method:"wallet_switchEthereumChain", params:[{ chainId:CHAIN_ID_HEX }] }); }catch{
        await provider.request({ method:"wallet_addEthereumChain", params:[{ chainId:CHAIN_ID_HEX, chainName:"Somnia Testnet", rpcUrls:[BROWSER_CONFIG.rpcHttpUrl], blockExplorerUrls:["https://shannon-explorer.somnia.network"], nativeCurrency:{ name:"STT", symbol:"STT", decimals:18 } }] });
      }
    }
    // Wallet switch/add success is only a request acknowledgement. Read the
    // provider again before constructing a signer so a sticky/wrong-chain
    // wallet can never reach the signing boundary.
    const verifiedChainHex = await provider.request({ method: "eth_chainId" });
    const verifiedChain = parseInt(verifiedChainHex, 16);
    if (verifiedChain !== CHAIN_ID) throw new Error(`Wrong chain after wallet switch (expected ${CHAIN_ID}, got ${verifiedChainHex})`);
    const sdk0 = await loadSdk();
    _wc = sdk0.viem.createWalletClient({ chain: sdk0.somniaShannon, transport: sdk0.viem.custom(provider), account: _addr });
    if(!_wc) throw new Error("Could not build wallet client for this provider");
    // Commit: only now is the wallet actually usable.
    walletAddress = _addr;
    walletClient = _wc;
    walletChainVerified = true;
    els.walletAddr.textContent = walletAddress.slice(0,6)+"…"+walletAddress.slice(-4);
    els.walletAddr.title = walletAddress;
    els.connectBtn.textContent = "Connected";
    // fetch tUSDC for honest ticket capping
    try{
      const ex2 = await getExchange();
      const bal = await ex2.client.getErc20Balance(sdk0.SOMNIA_TESTNET_ADDRESSES.collateral, walletAddress);
      window.__tUSDCBalance = bal;
      walletStatusText = `Connected ${walletAddress.slice(0,6)}… on ${CHAIN_ID}`;
      setStatus(`tUSDC ${(Number(bal)/1e6).toFixed(2)} — fetching fills…`, "success");
    }catch(e){
      window.__tUSDCBalance = undefined; // unknown — never invent a balance; policy shows ○
      walletStatusText = `Connected ${walletAddress.slice(0,6)}… on ${CHAIN_ID}`;
      setStatus(`fetching fills…`, "success");
    }
    await refreshFills();
  }catch(e){
    walletAddress = null;
    walletClient = null;
    walletChainVerified = false;
    els.walletAddr.textContent = "Disconnected";
    els.walletAddr.title = "Not connected";
    els.connectBtn.textContent = "Connect";
    walletStatusText = "";
    setStatus(`Connect failed: ${(e.message || String(e)).slice(0,140)}`, "risk");
    updateExecutionControls();
  }
  finally{ els.connectBtn.disabled = false; updateExecutionControls(); }
}

// Fills + scoring + discipline
async function refreshFills(){
  if(!walletAddress) return;
  const generation = fillsRequests.start();
  const current = () => fillsRequests.isCurrent(generation);
  // Scores are derived from this fills snapshot. A failed/slow refresh must
  // still prevent an older score request from writing over newer state.
  scoreRequests.invalidate();
  let ex;
  try{ ex = await getExchange(); }
  catch(e){ debugError("refreshFills SDK unavailable:", e.message); return; }
  if (!current()) return;
  try{
    const fills = await withTimeout(ex.client.getUserFills(walletAddress, { since: 0, limit: 50 }), 15000, "Fills read");
    if (!current()) return;
    fillsCache = fills;
    try{ persistCache(); }catch{}
    await resolveFillStates(ex, generation); // onchain status + ERC-6909 balances, bounded + best-effort
    if (!current()) return;
    renderPositions();
    renderScore();
    renderDiscipline();
  }catch(e){
    debugError(e);
    // Indexer down but chain alive: serve cached fills with LIVE on-chain states.
    if(isIndexerError(e)){
      const had = restoreCache();
      if(had.fills){
        try{ await resolveFillStates(ex, generation); }catch{}
        if (!current()) return;
        renderPositions();
        renderDiscipline();
        setStatus("Indexer down — cached fills with live on-chain states", "risk");
        return;
      }
    }
  }
}

// Bounded enrichment: unique markets only (≤8), every read guarded — one revert
// never breaks the ledger; unresolved rows keep UNKNOWN state.
async function resolveFillStates(ex, generation){
  const now = Math.floor(Date.now()/1000);
  const ids = [...new Set(fillsCache.map(f=>f.market).filter(Boolean))].slice(0,8);
  const ocByMarket = {};
  await Promise.all(ids.map(async (id)=>{
    if (!fillsRequests.isCurrent(generation)) return;
    try{
      const oc = await ex.client.getMarketOnchain(id);
      let yes = 0n, no = 0n;
      try{
        const ot = oc.outcomeToken;
        if (ot && oc.yesId !== undefined && oc.yesId !== null) yes = BigInt(await ex.client.getOutcomeBalance({ outcomeToken: ot, account: walletAddress, id: BigInt(oc.yesId) }));
        if (ot && oc.noId !== undefined && oc.noId !== null) no = BigInt(await ex.client.getOutcomeBalance({ outcomeToken: ot, account: walletAddress, id: BigInt(oc.noId) }));
      }catch{}
      ocByMarket[id] = { ...oc, _yes: yes, _no: no };
    }catch{}
  }));
  if (!fillsRequests.isCurrent(generation)) return;
  const redeemed = window.__redeemedKeys || new Set();
  fillsCache = fillsCache.map(f=>{
    const oc = ocByMarket[f.market] || {};
    const m = marketsCache.find(x=>x.marketId===f.market);
    const expiry = m?.expirySec || (oc.expiry ? Number(oc.expiry) : 0);
    const status = (oc.status === undefined || oc.status === null) ? null : Number(oc.status);
    const win = (oc.winningOutcome === 0 || oc.winningOutcome === 1) ? oc.winningOutcome : ((Number(oc.winningOutcome) === 0 || Number(oc.winningOutcome) === 1) ? Number(oc.winningOutcome) : null);
    const state = resolvePositionState({
      takerSide: f.takerSide, side: f.side, status,
      isResolved: oc.isResolved === true, isVoided: oc.isVoided === true,
      winningOutcome: win,
      yesBalanceRaw: oc._yes ?? 0n, noBalanceRaw: oc._no ?? 0n,
      expirySec: expiry, nowSec: now,
      redeemed: redeemed.has(`${f.market}:${f.takerSide || f.side || ""}`),
    });
    return { ...f, _state: state, _expiry: expiry };
  });
}

function renderPositions(){
  const tbody = els.posTbody;
  const tab = document.querySelector(".tab.active")?.dataset.tab || "ALL";
  // Rows arrive state-enriched from resolveFillStates (onchain + ERC-6909 truth).
  // Guard keeps manually-rendered rows honest if enrichment hasn't run yet.
  let rows = fillsCache.map(f=>{
    if (f._state) return f;
    const expiry = f._expiry || 0;
    return { ...f, _state: "UNKNOWN", _expiry: expiry };
  });
  if (tab!=="ALL") rows = rows.filter(r=>r._state===tab);
  if (rows.length===0){
    tbody.innerHTML = `<tr><td colspan="7" class="empty">No positions${walletAddress?"": " — connect wallet"}. Your fills will appear here.</td></tr>`;
    return;
  }
  tbody.innerHTML="";
  // Group fills by market: one strong group header per market instead of
  // repeating the same truncated marketId + pool + tx on every row.
  const groups = new Map();
  for (const f of rows.slice(0,20)) {
    const key = f.market || "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }
  const intervalLabel = (s)=> s===60?"1m":s===300?"5m":s===900?"15m":s===3600?"1h":s===14400?"4h":s===86400?"1d":(s?`${s}s`:"");
  for (const [marketId, fills] of groups) {
    const m = marketsCache.find(x=>x.marketId===marketId);
    const gLabel = m
      ? `${m.asset} ${intervalLabel(m.intervalSec)} · expires ${new Date(m.expirySec*1000).toISOString().slice(11,16)} UTC · ${fills.length} fill${fills.length>1?"s":""}`
      : `${mktShort(marketId)} · ${fills.length} fill${fills.length>1?"s":""}`;
    const gh = document.createElement("tr");
    gh.className = "pos-group";
    gh.innerHTML = `<td colspan="7" data-l="Market"><span class="mono">${h(gLabel)}</span> <span class="ticket-hint">${h(mktShort(marketId))}${fills[0]?.pool ? " · pool " + h(String(fills[0].pool).slice(0,10)) + "…" : ""}</span></td>`;
    tbody.appendChild(gh);
    for(const f of fills){
      const tr=document.createElement("tr");
      const side = String(f.takerSide||f.side||"—");
      const sideCls = side.includes("YES") ? "badge badge-up" : side.includes("NO") ? "badge badge-down" : "badge badge-quiet";
      const tx = f.txHash || "";
      // Quantity is 6-decimal raw (same base as ticket: 1000 raw = 1 lot = 0.001 contracts).
      const qtyTxt = (f.quantity !== undefined && f.quantity !== null) ? (Number(f.quantity)/1e6).toFixed(3) : "—";
      tr.innerHTML=`
        <td data-l="Market" class="mono ticket-hint">${h(mktShort(f.market))}</td>
        <td data-l="Side"><span class="${sideCls}">${h(side.replace("BUY_",""))}</span></td>
        <td data-l="Fill price" class="mono num">${f.fillPrice? (Number(f.fillPrice)/1e6).toFixed(3): "—"}</td>
        <td data-l="Contracts" class="mono num">${qtyTxt}</td>
        <td data-l="State"><span class="${stateBadge(f._state)}">${h(f._state==="LIVE"?"● LIVE":f._state)}</span></td>
        <td data-l="Tx" class="mono" style="max-width:140px;overflow:hidden;text-overflow:ellipsis">${tx?txMarkup(tx):"—"}</td>
        <td data-l="Expiry" class="mono num ticket-hint">${f._expiry? fmtExpiry(f._expiry): "—"}</td>`;
      tbody.appendChild(tr);
    }
  }
}

function renderScore(){
  const generation = scoreRequests.start();
  const current = () => scoreRequests.isCurrent(generation);
  const fills = fillsCache.slice(0, 20);
  els.brierVal.textContent = "— need oracle outcomes (fetching…)";
  els.edgeVal.textContent = "—";
  els.scoreN.textContent = `n ${fills.length}`;
  els.brierFill.style.width = "0%";
  els.edgeFill.style.width = "0%";
  els.last5.innerHTML = "";
  if (fills.length < 5) {
    els.brierVal.textContent = "— Need 5 settled";
    return;
  }
  (async()=>{
    let ex;
    try{ ex = await getExchange(); } catch { if (current()) els.brierVal.textContent = "— SDK unavailable"; return; }
    const calls=[];
    for(const f of fills){
      if (!current()) return;
      try{
        const res = await ex.client.getMarketOnchain(f.market);
        const status = Number(res.status);
        const winIdx = res.winningOutcome ?? res.winner ?? null;
        const side = f.takerSide || f.side;
        if (status === 5) {
          calls.push(settledCallFromFill({ fillPriceRaw: f.fillPrice, side, won: false, voided: true }));
        } else if (status === 4 && (winIdx === 0 || winIdx === 1)) {
          const sideIsYes = /YES/.test(String(side || ""));
          calls.push(settledCallFromFill({ fillPriceRaw: f.fillPrice, side, won: (winIdx === 0) === sideIsYes }));
        }
      }catch{}
    }
    if (!current()) return;
    const score = computeScore(calls);
    window.__lastSettledCalls = calls.filter((call) => !call.void);
    els.scoreN.textContent = `n ${score.n}`;
    els.brierVal.textContent = score.brier === null ? "— Need 5 settled" : score.brier.toFixed(3);
    els.edgeVal.textContent = score.edge === null ? "—" : `${score.edge >= 0 ? "+" : ""}${score.edge.toFixed(3)}`;
    els.brierLabel && (els.brierLabel.textContent = brierLabel(score.brier));
    els.brierFill.style.width = score.brier === null ? "0%" : `${Math.min(100, (score.brier / 0.5) * 100)}%`;
    els.edgeFill.style.width = score.edge === null ? "0%" : `${Math.max(0, Math.min(100, 50 + score.edge * 100))}%`;
    els.last5.innerHTML = score.last5.map((won) => `<span class="wl-dot ${won ? "wl-w" : "wl-l"}" title="${won ? "Won" : "Lost"}">${won ? "W" : "L"}</span>`).join("");
    renderDiscipline(window.__lastSettledCalls);
  })();
}

function renderDiscipline(calls){
  // calls: array of {won, void} from real settlement — if not provided, derive from last rendered score
  // If no calls provided, try to use last computed settled calls from renderScore (stored globally)
  const settled = calls || window.__lastSettledCalls || [];
  let streak=0;
  for(let i=settled.length-1;i>=0;i--){
    if(settled[i].void) continue;
    if(!settled[i].won) streak++; else break;
  }
  if (streak>=2 && (!cooldownUntil || cooldownUntil <= Date.now())){
    cooldownUntil = Date.now() + 3*60*1000;
    try{ localStorage.setItem("steady:cooldownUntil", String(cooldownUntil)); }catch{}
  }
  window.__cooldownStreak = streak;
  // Restore cooldown from storage on load
  if(!cooldownUntil){
    try{
      const v = localStorage.getItem("steady:cooldownUntil");
      if(v) { const ts=Number(v); if(ts>Date.now()) cooldownUntil=ts; else localStorage.removeItem("steady:cooldownUntil"); }
    }catch{}
  }
  if (cooldownUntil && cooldownUntil > Date.now()){
    els.tiltGuard.style.display="grid";
    const sec = Math.ceil((cooldownUntil - Date.now())/1000);
    els.tiltCountdown.textContent = `${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`;
    els.tiltMsg.textContent = `${streak} consecutive losses. Trading resumes in ${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}.`;
    els.buyYes.disabled = true;
    els.buyNo.disabled = true;
    els.buyYes.title = `Blocked: ${streak} losses — wait ${sec}s`;
    els.buyNo.title = `Blocked: ${streak} losses — wait ${sec}s`;
    const gateBadge = document.getElementById("policyGateBadge");
    if(gateBadge){ gateBadge.textContent = "Blocked"; gateBadge.className = "badge badge-down"; }
  } else {
    if(cooldownUntil && cooldownUntil <= Date.now()){
      cooldownUntil=null;
      try{ localStorage.removeItem("steady:cooldownUntil"); }catch{}
    }
    els.tiltGuard.style.display="none";
    const gateBadge = document.getElementById("policyGateBadge");
    if(gateBadge){ gateBadge.textContent = "Authorized"; gateBadge.className = "badge badge-up"; }
    updateExecutionControls();
  }
  try{ renderPolicyGate(); }catch{}
  updateExecutionControls();
  return streak;
}
window.__lastSettledCalls = [];


// Execution — real IOC via walletClient. Single authoritative write boundary:
// every trader.placeOrder call in this app goes through here, after policy evaluation.
async function execute(side){
  if(window.__submitting){ els.execStatus.style.display='block'; els.execStatus.textContent="Already submitting — wait for receipt (no duplicate)"; els.execStatus.className="alert"; return; }
  if(!selected){ alert("Select a market first"); return; }
  if(!walletAddress || !walletClient || !walletChainVerified){ alert("Connect wallet on verified Shannon chain first"); return; }
  if(!els.confirmBox.checked){ alert("Confirm max loss understanding"); return; }
  const maxLoss = Number(els.maxLoss.value);
  if(!maxLoss || maxLoss<=0){ alert("Enter max loss"); return; }
  const market = { ...selected };
  const tradeAttemptId = 'steady-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);
  debugLog(`[${tradeAttemptId}] intent`, { side, maxLoss, marketId: market.marketId });
  window.__submitting = true;
  els.buyYes.disabled=true; els.buyNo.disabled=true; els.execStatus.style.display='block';
  updateExecutionControls();
  // cooldown check — real discipline state, not placeholder
  if (cooldownUntil && cooldownUntil > Date.now()){
    const secs = Math.ceil((cooldownUntil-Date.now())/1000);
    els.execStatus.textContent=`Policy blocked: COOLDOWN — ${secs}s remaining (2 consecutive losses)`;
    els.execStatus.className="alert alert-risk";
    window.__submitting=false; updateExecutionControls();
    return;
  }
  let ex;
  try{ ex = await getExchange(); }
  catch(sdkErr){ els.execStatus.textContent=`SDK unavailable: ${(sdkErr&&sdkErr.message)||sdkErr}`; els.execStatus.className="alert alert-risk"; window.__submitting=false; updateExecutionControls(); return; }
  els.execStatus.style.display="block";
  els.execStatus.textContent = "Checking market status…";
  els.execStatus.className="alert";
  const _resetSubmit = ()=>{ window.__submitting=false; updateExecutionControls(); };
  try{
    let expirySec = Number(market.expirySec);
    let currentPool = market.pool;
    let oc;
    try {
      oc = await withTimeout(ex.client.getMarketOnchain(market.marketId), 15000, "Market status read");
    } catch (statusErr) {
      els.execStatus.textContent = `Policy blocked: STATUS_UNAVAILABLE — ${(statusErr.message || String(statusErr)).slice(0,120)}`;
      els.execStatus.className = "alert alert-risk";
      _resetSubmit();
      return;
    }
    if (typeof oc?.pool === "string" && oc.pool) currentPool = oc.pool;
    if (oc?.status !== 1) {
      els.execStatus.textContent = `Policy blocked: MARKET_NOT_TRADING — current status ${String(oc?.status)}`;
      els.execStatus.className = "alert alert-risk";
      _resetSubmit();
      return;
    }
    let bookNow;
    try {
      bookNow = await withTimeout(ex.client.getBinaryOrderBook(currentPool, { depth: EXECUTION_BOOK_DEPTH }), 15000, "Fresh orderbook read");
    } catch (bookErr) {
      els.execStatus.textContent = `Policy blocked: BOOK_UNAVAILABLE — ${(bookErr.message || String(bookErr)).slice(0,120)}`;
      els.execStatus.className = "alert alert-risk";
      _resetSubmit();
      return;
    }
    // The status read that authorized the initial snapshot may have changed
    // while the book/params were loading. Re-read immediately before policy.
    try {
      oc = await withTimeout(ex.client.getMarketOnchain(market.marketId), 15000, "Market status recheck");
    } catch (statusErr) {
      els.execStatus.textContent = `Policy blocked: STATUS_UNAVAILABLE — ${(statusErr.message || String(statusErr)).slice(0,120)}`;
      els.execStatus.className = "alert alert-risk";
      _resetSubmit();
      return;
    }
    if (typeof oc?.pool === "string" && oc.pool.toLowerCase() !== currentPool.toLowerCase()) {
      els.execStatus.textContent = "Policy blocked: MARKET_BINDING_CHANGED — pool changed during execution checks";
      els.execStatus.className = "alert alert-risk";
      _resetSubmit();
      return;
    }
    if (oc?.status !== 1) {
      els.execStatus.textContent = `Policy blocked: MARKET_NOT_TRADING — current status ${String(oc?.status)}`;
      els.execStatus.className = "alert alert-risk";
      _resetSubmit();
      return;
    }
    expirySec = Number(oc.expiry ?? market.expirySec);
    let params;
    try {
      params = await withTimeout(ex.client.getBinaryBookParams(currentPool), 15000, "Book parameters read");
    } catch (paramsErr) {
      els.execStatus.textContent = `Policy blocked: BOOK_PARAMS_UNAVAILABLE — ${(paramsErr.message || String(paramsErr)).slice(0,120)}`;
      els.execStatus.className = "alert alert-risk";
      _resetSubmit();
      return;
    }
    const intent = buildTradeIntent({
      side,
      maxLossHuman: maxLoss,
      book: bookNow,
      params,
      marketStatus: oc?.status,
      expirySec,
    });
    if (!intent.ok) {
      els.execStatus.textContent = `Policy blocked: ${intent.code} — ${intent.reason}`;
      els.execStatus.className = "alert alert-risk";
      _resetSubmit();
      if (intent.code === "MARKET_NOT_TRADING") await loadMarkets();
      return;
    }
    // Discipline evaluation at the boundary — real settled outcomes only, never random
    const _settled = (window.__lastSettledCalls || []).filter(c=>!c.void);
    let _streak = 0;
    for(let i=_settled.length-1;i>=0;i--){ if(!_settled[i].won) _streak++; else break; }
    if(_streak>=2){
      const msg = `COOLDOWN — ${_streak} consecutive losses (Brier over last ${_settled.length})`;
      debugLog(`[${tradeAttemptId}] policy DENY`, msg);
      els.execStatus.textContent=`Policy blocked: ${msg} — wait for cooldown`;
      els.execStatus.className="alert alert-risk";
      _resetSubmit(); renderDiscipline(window.__lastSettledCalls || []);
      return;
    }
    // Balance gate AT the boundary (the ticket's "Balance Sufficient" row is otherwise
    // refuse before any signature with exact have/need numbers. A balance read
    // failure is unknown authorization, so it fails closed.
    const _addrs = getSdkAddrs();
    if(!_addrs || !_addrs.collateral) {
      els.execStatus.textContent = "Policy blocked: BALANCE_UNAVAILABLE — collateral address is unavailable";
      els.execStatus.className = "alert alert-risk";
      _resetSubmit();
      return;
    }
    let _bal;
    try {
      _bal = await withTimeout(ex.client.getErc20Balance(_addrs.collateral, walletAddress), 15000, "Collateral balance read");
    } catch (balanceErr) {
      els.execStatus.textContent = `Policy blocked: BALANCE_UNAVAILABLE — ${(balanceErr.message || String(balanceErr)).slice(0,120)}`;
      els.execStatus.className = "alert alert-risk";
      _resetSubmit();
      return;
    }
    window.__tUSDCBalance = _bal;
    const freshIntents = buildSideIntents({
      maxLossHuman: maxLoss,
      book: bookNow,
      params,
      marketStatus: oc?.status,
      expirySec,
      availableBalanceRaw: _bal,
      requireBalance: true,
    });
    const executableIntent = freshIntents[side];
    if (!executableIntent.ok) {
      els.execStatus.textContent = `Policy blocked: ${executableIntent.code} — ${executableIntent.reason}`;
      els.execStatus.className = "alert alert-risk";
      _resetSubmit();
      return;
    }
    // The receipt proof must be the exact check array from the fresh, balance-
    // bound intent that is about to be signed, plus the boundary discipline check.
    const policyChecks = executableIntent.checks.map((check)=>({ ...check, rule: check.rule === "spread" ? "maxSpread 0.15" : check.rule }));
    policyChecks.push({ rule:"cooldown(2-loss)", pass:true, code:"OK" });
    const failed = policyChecks.find(c=>c.pass === false);
    if(failed){
      debugLog(`[${tradeAttemptId}] policy DENY`, failed);
      els.execStatus.textContent=`Policy blocked: ${failed.code} — ${failed.reason || "check failed"}`;
      els.execStatus.className="alert alert-risk";
      _resetSubmit();
      return;
    }
    debugLog(`[${tradeAttemptId}] policy PASS`, policyChecks);
    // Re-render both directions from the exact fresh snapshot used for this
    // attempt. The clicked side and the alternate side cannot retain preview
    // values from an older book while the wallet is about to sign.
    const renderFreshSide = (freshSide, target, button) => {
      const intent = freshIntents[freshSide];
      const display = intentDisplay(intent);
      target.textContent = intent?.ok
        ? `${display.pay} → ${display.payout} · +${display.profit} · ${display.quantity} @ ${display.probability}`
        : `Unavailable: ${intent?.reason || "not executable"}`;
      button.textContent = intent?.ok
        ? `${freshSide === "BUY_YES" ? "Buy UP" : "Buy DOWN"} — ${display.pay}`
        : (freshSide === "BUY_YES" ? "Buy UP" : "Buy DOWN");
    };
    renderFreshSide("BUY_YES", els.previewPay, els.buyYes);
    renderFreshSide("BUY_NO", els.previewWin, els.buyNo);
    els.previewBook.textContent = `${bookNow?.yesBids?.[0] ? (Number(bookNow.yesBids[0].price) / 1e6).toFixed(3) : "—"} / ${bookNow?.yesAsks?.[0] ? (Number(bookNow.yesAsks[0].price) / 1e6).toFixed(3) : "—"} · t${params.tickSize} l${params.lotSize}`;
    const { yesPriceRaw, quantityRaw: qtyRaw } = executableIntent;
    const expireNs = BigInt(Math.floor(Date.now()/1000 + 120)*1e9);
    const marketExpiryNs = BigInt(expirySec)*1_000_000_000n;
    const finalExpiry = expireNs < marketExpiryNs - 10_000_000_000n ? expireNs : marketExpiryNs - 10_000_000_000n;

    els.previewExpiry.textContent = `${fmtExpiry(expirySec)} · ${(Number(executableIntent.spreadRaw)/1e6).toFixed(3)}`;
    els.execStatus.textContent = `Signing IOC ${side} price ${(Number(yesPriceRaw)/1e6).toFixed(3)} qty ${(Number(qtyRaw)/1e6).toFixed(3)}… (first trade may ask a one-time token approval first)`;
    // Need trader via walletClient — SDK expects client.createTrader({ walletClient })
    // Import dynamically to avoid circular
    const trader = ex.client.createTrader({ walletClient });
    // Note: SDK placeOrder expects pool, side, price, quantity, orderType, expireTimestampNs
    const order = buildIocOrder(executableIntent, currentPool, finalExpiry);
    const res = await trader.placeOrder(order);
    const receipt = res.receipt || res;
    const hash = receipt.transactionHash || res.transactionHash || res.hash || "unknown";
    const status = receipt.status ?? res.status;
    const fillsKnown = Array.isArray(res.fills) || Array.isArray(receipt.fills);
    const resultFills = Array.isArray(res.fills) ? res.fills : (Array.isArray(receipt.fills) ? receipt.fills : []);
    const orderResult = classifyPlaceOrderResult({
      receipt,
      status,
      fills: resultFills,
      orderId: res.orderId,
      events: res.events,
      side,
      requestedQuantityRaw: qtyRaw,
    });
    if (orderResult.state === "FAILED"){
      els.execStatus.textContent=`Reverted: ${hash} — ${receipt.error || "unknown"}`;
      els.execStatus.className="alert alert-risk";
      _resetSubmit();
      return;
    }
    if (orderResult.state === "UNKNOWN") {
      if (isHexHash(hash)) unresolvedTransactionHash = hash;
      els.execStatus.textContent = `UNKNOWN — transaction confirmation status unavailable for ${hash}`;
      els.execStatus.className = "alert";
      _resetSubmit();
      return;
    }
    const fillSummary = summarizeOrderFills(side, resultFills, qtyRaw, fillsKnown);
    const fillStateLabel = orderResult.state === "FILL_UNKNOWN"
      ? "FILL UNKNOWN"
      : orderResult.state === "PARTIAL_FILL"
      ? "PARTIAL FILL"
      : orderResult.state === "FILLED" ? "FULL FILL" : "NO FILL";
    const evidenceLabel = orderResult.state === "FILL_UNKNOWN"
      ? "TRANSACTION CONFIRMED · FILL UNKNOWN"
      : orderResult.state === "NO_FILL"
      ? "TRANSACTION CONFIRMED · NO FILL"
      : `TRANSACTION CONFIRMED · FILL VERIFIED · ${fillStateLabel}`;
    const acceptanceLabel = orderResult.orderAccepted ? " · ORDER ACCEPTED" : "";
    els.execStatus.innerHTML = `<span class="code">${h(evidenceLabel)}${h(acceptanceLabel)} · ${h(status)}</span> ${orderResult.state === "FILL_UNKNOWN" ? "Fill evidence unavailable — retry verification" : orderResult.state === "PARTIAL_FILL" ? "Partially filled — remainder cancelled" : orderResult.state === "FILLED" ? "Filled" : "Confirmed with zero fills — nothing paid"} — ${txMarkup(hash)}`;
    els.execStatus.className=(orderResult.state === "FILLED" || orderResult.state === "PARTIAL_FILL") ? "alert alert-success" : "alert";
    // refresh
    unresolvedTransactionHash = "";
    window.__lastAttemptHash = receipt.transactionHash || res.transactionHash || res.hash || "";
    // Actual fill is known IMMEDIATELY: IOC fills ride in the placeOrder result
    // (PlaceOrderResult.fills[].fillPrice, YES terms) — no 3s faith gap.
    // getUserFills refresh below stays as independent reconciliation.
    let _actualYes = null;
    try{
      if(fillSummary.filled){
        _actualYes = Number(fillSummary.averageYesPriceRaw) / 1e6;
        window.__lastFillPrice = _actualYes.toFixed(3);
      } else { window.__lastFillPrice = undefined; }
    }catch{ window.__lastFillPrice = undefined; }
    debugLog(`[${tradeAttemptId}] CONFIRMED hash ${window.__lastAttemptHash} quoted ${(Number(yesPriceRaw)/1e6).toFixed(3)} vs actual will be verified via fill`);
    // Trade receipt — progressive disclosure: a mined zero-fill IOC is not a trade.
    try{
      const recEl=document.getElementById("tradeReceipt");
      if(recEl){
        recEl.style.display="block";
        const maxLossDisplay = (Number(executableIntent.payRaw) / 1e6).toFixed(2);
        const expiryDisplay = new Date(Number(finalExpiry/1000000000n)*1000).toISOString().slice(11,19);
        const orderIdDisplay = (res && res.orderId) || (receipt && receipt.orderId) || "—";
        const quotedYes = Number(yesPriceRaw) / 1e6;
        const pricePresentation = receiptPricePresentation(side, quotedYes, _actualYes);
        const requestedDisplay = (Number(qtyRaw) / 1e6).toFixed(3);
        const filledDisplay = orderResult.state === "FILL_UNKNOWN" ? "UNKNOWN" : (Number(fillSummary.filledQuantityRaw ?? fillSummary.quantityRaw ?? 0n) / 1e6).toFixed(3);
        const remainingDisplay = orderResult.state === "FILL_UNKNOWN" ? "UNKNOWN" : (Number(fillSummary.remainingQuantityRaw ?? qtyRaw) / 1e6).toFixed(3);
        const receiptFillStatus = orderResult.state === "FILL_UNKNOWN" ? "FILL UNKNOWN" : orderResult.state === "PARTIAL_FILL" ? "PARTIAL FILL" : orderResult.state === "FILLED" ? "FULL FILL" : "NO FILL";
        recEl.innerHTML =
           `<div class="receipt-head"><span class="receipt-title"><span class="panel-kicker">05 / Fill proof</span><span class="caption">${evidenceLabel}${acceptanceLabel} — ${tradeAttemptId}</span></span><span style="display:flex;gap:8px;align-items:center"><span class="badge ${orderResult.state === "FILLED" || orderResult.state === "PARTIAL_FILL" ? "badge-up" : orderResult.state === "FILL_UNKNOWN" ? "badge-unknown" : "badge-quiet"}">${orderResult.state === "FILL_UNKNOWN" ? "Fill unknown" : orderResult.state === "PARTIAL_FILL" ? "Partial fill" : orderResult.state === "FILLED" ? "Full fill" : "No fill"}</span><button class="btn btn-secondary btn-sm" id="copyProofBtn" type="button">Copy proof</button></span></div>` +
          `<div style="padding:10px 12px;font-size:13px">${h(side.replace("BUY_",""))} ${requestedDisplay} requested · ${filledDisplay} filled · ${remainingDisplay} remaining · max loss ${maxLossDisplay} tUSDC · ${txMarkup(window.__lastAttemptHash)}</div>` +
          `<details><summary>View proof <span class="caption">side terms · SDK evidence · policy</span></summary><div class="proof">` +
          `<div class="prow"><span class="k">Market / pool</span><span class="v">${h(mktShort(market.marketId))} / ${h(currentPool.slice(0,10))}…</span></div>` +
          `<div class="prow"><span class="k">Requested</span><span class="v">${requestedDisplay} contracts</span></div>` +
          `<div class="prow"><span class="k">Filled</span><span class="v">${filledDisplay} contracts</span></div>` +
          `<div class="prow"><span class="k">Remaining</span><span class="v">${remainingDisplay} contracts</span></div>` +
          `<div class="prow"><span class="k">Status</span><span class="v">${receiptFillStatus}</span></div>` +
          pricePresentation.rowsHtml +
          `<div class="prow"><span class="k">Fill evidence</span><span class="v">${resultFills.length} fill leg${resultFills.length === 1 ? "" : "s"} · ${filledDisplay} contracts</span></div>` +
          `<div class="prow"><span class="k">Max loss / expiry</span><span class="v">${maxLossDisplay} · ${expiryDisplay} UTC</span></div>` +
          `<div class="prow"><span class="k">Policy at execution</span><span class="v">${h(formatPolicyProof(policyChecks))}</span></div>` +
          `<div class="prow"><span class="k">Wallet</span><span class="v">${h(walletAddress.slice(0,10))}…</span></div>` +
          `<div class="prow"><span class="k">Tx</span><span class="v">${txMarkup(window.__lastAttemptHash)}</span></div>` +
          `<div class="prow"><span class="k">Order</span><span class="v">${h(String(orderIdDisplay).slice(0,18))}</span></div>` +
           `</div></details>`;
        // Shareable proof: text+link (no gamification) — the receipt travels.
        try{
          const cp = document.getElementById("copyProofBtn");
          if(cp) cp.onclick = async()=>{
            const txt = `Steady receipt: ${side.replace("BUY_","")} requested ${requestedDisplay}, filled ${filledDisplay}, remaining ${remainingDisplay} (${receiptFillStatus}) · ${pricePresentation.copyText} · max loss ${maxLossDisplay} tUSDC · tx https://shannon-explorer.somnia.network/tx/${window.__lastAttemptHash}`;
            try{ await navigator.clipboard.writeText(txt); cp.textContent = "Copied ✓"; }
            catch{ cp.textContent = "Copy blocked"; }
            setTimeout(()=>{ cp.textContent = "Copy proof"; }, 2500);
          };
        }catch{}
      }
    }catch(e){}
    setTimeout(()=>{ refreshFills(); window.__submitting=false; updateExecutionControls(); }, 3000);
  }catch(e){
    const msg = e.message||String(e);
    // UNKNOWN vs FAILED — never convert timeout to failed without receipt check
    const isTimeout = msg.includes("timeout") || msg.includes("Timeout") || msg.includes("UND_ERR") || msg.includes("ConnectTimeout");
    const maybeHash = (e.data && e.data.transactionHash) || (e.cause && e.cause.transactionHash) || window.__lastAttemptHash || "";
    if(isTimeout && maybeHash){
      unresolvedTransactionHash = maybeHash;
      els.execStatus.textContent=`UNKNOWN — submitted ${maybeHash.slice(0,10)}… but RPC timed out. Reconciling…`;
      els.execStatus.className="alert";
      debugLog(`[${tradeAttemptId}] UNKNOWN timeout, hash ${maybeHash}, will reconcile via getTransactionReceipt`);
      // Reconcile: poll receipt
      (async()=>{
        try{
          const ex2=await getExchange();
          for(let i=0;i<6;i++){
            await new Promise(r=>setTimeout(r,3000));
            try{
              const rc=await ex2.client.getViemClient().getTransactionReceipt({ hash: maybeHash });
              if(rc.status==="success"){
                unresolvedTransactionHash = "";
                // A late receipt proves the transaction, not the financial effect.
                // Reconcile the exact market/tx against indexed fills when possible;
                // indexer lag stays explicitly unknown instead of becoming success.
                let fillState = "FILL UNKNOWN";
                try {
                  const indexed = await withTimeout(
                    ex2.client.getUserFills(walletAddress, { since: 0, limit: 50, market: market.marketId }),
                    15000,
                    "Fill reconciliation",
                  );
                  const evidence = classifyIndexedFillEvidence(indexed, maybeHash);
                  if (evidence.state === "FILL_VERIFIED") fillState = "FILL VERIFIED";
                  else if (Array.isArray(indexed)) fillState = "FILL UNKNOWN (no indexed fill yet)";
                } catch {}
                els.execStatus.innerHTML=`<span class="code">RECONCILED · TRANSACTION CONFIRMED · ${h(fillState)}</span> Reconciled — ${txMarkup(maybeHash)} (was UNKNOWN)`;
                els.execStatus.className=fillState === "FILL VERIFIED" ? "alert alert-success" : "alert";
                refreshFills();
                break;
              }
              else if(rc.status==="reverted"){ unresolvedTransactionHash = ""; els.execStatus.textContent=`Reverted after UNKNOWN — ${maybeHash.slice(0,10)}…`; els.execStatus.className="alert alert-risk"; break; }
            }catch{}
          }
        }catch{}
        window.__submitting=false; updateExecutionControls();
      })();
      return;
    }
    let hint="";
    if(msg.includes("FillOrKillNotFillable")||msg.includes("0xc04ad919")) hint=" — FOK not fillable, try next window";
    if(msg.includes("InvalidPrice")) hint=" — price off tick grid";
    if(msg.includes("0xfb8f41b2")) hint=" — approval qty not escrow";
    if(msg.includes("0xd48c4403")) hint=" — ImmediateOrCancelNoFill: empty book (honest, not fake liquidity)";
    els.execStatus.textContent=`Failed: ${msg.slice(0,300)}${hint}`;
    els.execStatus.className="alert alert-risk";
    debugError(e);
    window.__submitting=false; updateExecutionControls();
  } finally {
    // No blind re-enable here: success path clears after 3s refresh, error paths already reset.
    // UNKNOWN path keeps SUBMITTING until reconciliation finishes. This prevents duplicate submission.
    if(window.__submitting && !els.execStatus.textContent.includes("UNKNOWN") && !els.execStatus.textContent.includes("Signing") && !els.execStatus.textContent.includes("Checking")){
      // Safety net only: if we somehow left flag set without UNKNOWN/Signing state, log it
      debugLog(`[${tradeAttemptId}] finally: still submitting, state=${els.execStatus.textContent.slice(0,60)}`);
    }
  }
}

// Events
els.refreshBtn.onclick = loadMarkets;
els.buyYes.onclick = ()=>execute("BUY_YES");
els.buyNo.onclick = ()=>execute("BUY_NO");
els.connectBtn.onclick = connect;
els.maxLoss.oninput = updatePreview;
els.confirmBox.onchange = updateExecutionControls;
document.querySelectorAll(".tab").forEach(t=>t.onclick=(e)=>{
  document.querySelectorAll(".tab").forEach(x=>{
    x.classList.remove("active");
    x.setAttribute("aria-selected", "false");
  });
  e.currentTarget.classList.add("active");
  e.currentTarget.setAttribute("aria-selected", "true");
  renderPositions();
});
if(els.faucetBtn) els.faucetBtn.onclick = async()=>{
  if(!walletAddress || !walletClient){ alert("Connect wallet first"); return; }
  els.faucetBtn.disabled = true;
  if(els.faucetStatus) els.faucetStatus.textContent = "Requesting 10k test tUSDC…";
  try{
    const ex = await getExchange();
    const trader = ex.client.createTrader({ walletClient });
    const res = await trader.faucet();
    const receipt = res.receipt || res;
    const hash = receipt.transactionHash || res.transactionHash || res.hash || "unknown";
    if(els.faucetStatus) els.faucetStatus.innerHTML = `Sent — ${txMarkup(hash, hash ? `${String(hash).slice(0,10)}…` : "—")}`;
    try{
      const sdk0 = await loadSdk();
      const bal = await ex.client.getErc20Balance(sdk0.SOMNIA_TESTNET_ADDRESSES.collateral, walletAddress);
      window.__tUSDCBalance = bal;
      if(els.faucetStatus) els.faucetStatus.textContent = `Balance ${(Number(bal)/1e6).toFixed(2)} tUSDC — ready to trade`;
      updatePreview();
    }catch{}
  }catch(e){
    if(els.faucetStatus) els.faucetStatus.textContent = `Faucet failed: ${(e.message||String(e)).slice(0,120)}`;
  }finally{ els.faucetBtn.disabled = false; }
};
// Audit strip: renders a claimable scan (SDK ClaimablePosition rows) or the honest empty.
function renderSettlementScan(rows){
  if(!rows || !rows.length){
    els.settlementList.innerHTML = `<div class="empty empty-slim"><div class="title">No claimable winnings</div><div class="body">Settled winners appear here with one-click redeem — void pays 0.5 per side.</div></div>`;
    return;
  }
  els.settlementList.innerHTML = rows.slice(0,8).map(c=>{
    let amt = "—", est = "—";
    try{ amt = (Number(BigInt(c.amount))/1e6).toFixed(3); }catch{}
    try{ est = (Number(BigInt(c.estPayout ?? c.amount))/1e6).toFixed(3); }catch{}
    return `<div class="settle-row"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span class="mono rowmain">${h(mktShort(c.marketId))} · ${c.outcomeIdx===0?"YES":"NO"} · ${h(amt)}</span><span class="badge badge-solid">${h(c.status || "Settled")}</span></div><div class="caption">est payout ~${h(est)} tUSDC · pool ${h(String(c.pool||"").slice(0,10))}…</div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="hashlink" href="https://shannon-explorer.somnia.network/" target="_blank" rel="noopener">Explorer ↗</a></div></div>`;
  }).join("");
}

function setRedemptionState(state, message) {
  redemptionState = state;
  if (els.redeemAll) {
    const retryable = canRetryReconciliation(state, isHexHash(redemptionHash));
    els.redeemAll.disabled = redemptionButtonDisabled(state) && !retryable;
    els.redeemAll.dataset.state = state;
    els.redeemAll.title = retryable ? "Retry receipt and claim verification only" : (state === "READY" || state === "FAILED") ? "" : ("Redemption " + state.toLowerCase());
  }
  if (message !== undefined) {
    els.execStatus.textContent = message;
    els.execStatus.className = state === "FAILED" ? "alert alert-risk" : state === "REDEEMED" ? "alert alert-success" : "alert";
  }
}

async function retryRedemptionVerification(){
  if (!walletAddress || !walletClient || !isHexHash(redemptionHash) || !redemptionEntries.length) return;
  const generation = redemptionRequests.start();
  const current = () => redemptionRequests.isCurrent(generation);
  setRedemptionState("SUBMITTING", "Retrying redemption receipt and claim verification only…");
  try {
    const ex = await getExchange();
    const receipt = await withTimeout(ex.client.getViemClient().getTransactionReceipt({ hash: redemptionHash }), 15000, "Redemption receipt verification");
    if (!current()) return;
    if (receipt.status === "reverted") {
      setRedemptionState("FAILED", "Redemption reverted — " + shortHash(redemptionHash));
      return;
    }
    if (receipt.status !== "success") {
      setRedemptionState("UNKNOWN", "UNKNOWN — receipt still unresolved; retry verification");
      return;
    }
    setRedemptionState("CONFIRMED", "Redemption transaction confirmed — " + shortHash(redemptionHash) + "; post-receipt scan required");
    await reconcileRedemptionClaims(ex, redemptionHash, generation, redemptionEntries);
  } catch (e) {
    if (current()) setRedemptionState("UNKNOWN", "UNKNOWN — verification unavailable; retry without submitting another redemption");
  }
}

// On-chain claimable scan (indexer-down fallback): winner-with-balance or
// voided-with-balance per known market. Same entry shape as getClaimable
// ({marketId, pool, outcomeIdx, amount, estPayout, status}).
async function scanClaimableOnchain(ex, marketIds){
  const out = [];
  const attempted = (marketIds || []).length;
  let completed = 0;
  let failed = 0;
  await Promise.all((marketIds || []).map(async (id)=>{
    try{
      const oc = await ex.client.getMarketOnchain(id);
      const ot = oc.outcomeToken;
      if(!ot || oc.yesId === undefined || oc.noId === undefined) throw new Error("Outcome-token metadata unavailable");
      const y = await ex.client.getOutcomeBalance({ outcomeToken: ot, account: walletAddress, id: BigInt(oc.yesId) });
      const n = await ex.client.getOutcomeBalance({ outcomeToken: ot, account: walletAddress, id: BigInt(oc.noId) });
      if(oc.isVoided || Number(oc.status) === 5){
        if(y > 0n) out.push({ marketId: id, pool: oc.pool, outcomeIdx: 0, amount: y, estPayout: y / 2n, status: "Voided" });
        if(n > 0n) out.push({ marketId: id, pool: oc.pool, outcomeIdx: 1, amount: n, estPayout: n / 2n, status: "Voided" });
      } else if(oc.isResolved && (oc.winningOutcome === 0 || oc.winningOutcome === 1)){
        const held = oc.winningOutcome === 0 ? y : n;
        if(held > 0n) out.push({ marketId: id, pool: oc.pool, outcomeIdx: oc.winningOutcome, amount: held, estPayout: held, status: "Resolved" });
      }
      completed += 1;
    }catch{ failed += 1; }
  }));
  return { rows: out, attempted, completed, failed };
}

els.redeemAll.onclick = async()=>{
  if(!walletAddress || !walletClient) return alert("Connect wallet first");
  if (redemptionState === "UNKNOWN" && canRetryReconciliation(redemptionState, isHexHash(redemptionHash))) {
    await retryRedemptionVerification();
    return;
  }
  const start = beginRedemption(redemptionState);
  if (!start.started) return;
  redemptionHash = "";
  redemptionEntries = [];
  const generation = redemptionRequests.start();
  const current = () => redemptionRequests.isCurrent(generation);
  setRedemptionState("SUBMITTING", "Scanning claimable positions (settled winners + voids)…");
  let ex;
  try{ ex = await getExchange(); }
  catch(e){ if (current()) setRedemptionState("FAILED", "SDK unavailable: " + h(e.message || String(e))); return; }
  els.execStatus.style.display="block";
  els.execStatus.textContent="Scanning claimable positions (settled winners + voids)…";
  els.execStatus.className="alert";
  try{
    let scanned = null, viaFallback = false, knownMarketCount = 0;
    let fallbackScan = null;
    try{
      scanned = await withTimeout(ex.client.getClaimable(walletAddress), 15000, "Claimable scan");
    }catch(scanErr){
      if(!isIndexerError(scanErr)) throw scanErr;
      // Indexer down: make a bounded, explicitly partial on-chain scan over
      // known markets (fills + cache). It cannot prove the whole wallet empty.
      els.execStatus.textContent = "Indexer down — checking known markets on-chain…";
      restoreCache();
      const ids = [...new Set(fillsCache.map(f=>f.market).filter(Boolean))].slice(0,10);
      knownMarketCount = ids.length;
      fallbackScan = await scanClaimableOnchain(ex, ids);
      scanned = fallbackScan.rows;
      viaFallback = true;
    }
    if (!current()) return;
    const rows = (Array.isArray(scanned) ? scanned : []).filter(c=>{ try{ return BigInt(c.amount) > 0n && (c.outcomeIdx === 0 || c.outcomeIdx === 1); }catch{ return false; } });
    if (!current()) return;
    renderSettlementScan(rows);
    const scanResult = classifyClaimScan({
      indexerSucceeded: !viaFallback && Array.isArray(scanned),
      knownMarketCount,
      claimableCount: rows.length,
      attemptedCount: fallbackScan?.attempted || knownMarketCount,
      completedCount: fallbackScan?.completed || 0,
    });
    if (!scanResult.complete) {
      els.settlementList.innerHTML = `<div class="empty empty-slim"><div class="title">Claims unavailable</div><div class="body">The claim scan is incomplete, so Steady will not report an empty wallet. Retry when market data is reachable.</div></div>`;
      els.execStatus.textContent = `Claims unavailable — scan incomplete (${scanResult.completedCount}/${scanResult.attemptedCount} known markets checked). Retry when market data is reachable.`;
      els.execStatus.className = "alert alert-risk";
      setRedemptionState("FAILED", els.execStatus.textContent);
      return;
    }
    if(!rows.length){
      setRedemptionState("READY", "Nothing claimable — no stranded winnings. Settle a win first, then redeem here.");
      return;
    }
    let totalEst = 0n;
    for(const c of rows){ try{ totalEst += BigInt(c.estPayout ?? c.amount); }catch{} }
    els.execStatus.textContent=`Claiming ${rows.length} position${rows.length>1?"s":""} (~${(Number(totalEst)/1e6).toFixed(3)} tUSDC) in ONE transaction — sign in wallet…${viaFallback ? ` (partial fallback: ${fallbackScan?.completed || 0}/${fallbackScan?.attempted || 0} known markets checked)` : ""}`;
    els.execStatus.className="alert";
    const entries = rows.map(c=>({ marketId: c.marketId, outcomeIdx: c.outcomeIdx, amount: BigInt(c.amount) }));
    const trader = ex.client.createTrader({ walletClient });
    let res;
    try {
      res = await trader.redeemMany({ entries });
    } catch (e) {
      const msg = e.message || String(e);
      const maybeHash = e.data?.transactionHash || e.cause?.transactionHash || "";
      const timedOut = /timeout|Timeout|UND_ERR|ConnectTimeout/i.test(msg);
      const timeoutState = redemptionStateAfterSubmissionError({ timedOut, txHashKnown: isHexHash(maybeHash) });
      if (timeoutState === "UNKNOWN") {
        redemptionHash = maybeHash;
        redemptionEntries = entries;
        setRedemptionState("UNKNOWN", "UNKNOWN — redemption " + shortHash(maybeHash) + " submitted; checking receipt…");
        for (let i = 0; i < 6 && current(); i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          try {
            const rc = await ex.client.getViemClient().getTransactionReceipt({ hash: maybeHash });
            if (rc.status === "reverted") {
              redemptionHash = "";
              setRedemptionState("FAILED", "Redemption reverted — " + shortHash(maybeHash));
              return;
            }
            if (rc.status === "success") {
              redemptionHash = maybeHash;
              setRedemptionState("CONFIRMED", "Redemption transaction confirmed — " + shortHash(maybeHash) + "; post-receipt scan required");
              await reconcileRedemptionClaims(ex, maybeHash, generation, entries);
              return;
            }
          } catch {}
        }
        return;
      }
      throw e;
    }
    const receipt = res.receipt || res;
    const hash = receipt.transactionHash || res.transactionHash || res.hash || "unknown";
    redemptionHash = isHexHash(hash) ? hash : "";
    redemptionEntries = entries;
    // Redemption is only marked complete after the post-receipt scan.
    const receiptState = redemptionStateAfterReceipt(receipt.status ?? res.status);
    if (receiptState === "FAILED") { setRedemptionState("FAILED", "Redemption reverted — " + shortHash(hash)); return; }
    if (receiptState !== "CONFIRMED") { setRedemptionState("UNKNOWN", "Redemption status unavailable — " + shortHash(hash)); return; }
    setRedemptionState("CONFIRMED", "Redemption transaction confirmed — " + shortHash(hash) + "; post-receipt scan required");
    await reconcileRedemptionClaims(ex, hash, generation, entries);
  }catch(e){ if (current()) setRedemptionState("FAILED", "REDEEM_FAILED — " + h((e.message||String(e)).slice(0,200))); }
};

async function reconcileRedemptionClaims(ex, hash, generation, entries) {
  if (!redemptionRequests.isCurrent(generation)) return;
  for (let attempt = 0; attempt < 6 && redemptionRequests.isCurrent(generation); attempt += 1) {
    try {
      const remaining = await withTimeout(ex.client.getClaimable(walletAddress), 15000, "Post-redemption claim scan");
      if (!redemptionRequests.isCurrent(generation)) return;
      if (!Array.isArray(remaining)) throw new Error("Post-redemption claim scan returned no complete result");
      const claimsRemaining = countMatchingClaims(remaining, entries);
      const state = redemptionStateAfterReconcile({
        receiptStatus: "success",
        claimsRemaining,
        scanComplete: true,
      });
      if (state === "REDEEMED") {
        window.__redeemedKeys = window.__redeemedKeys || new Set();
        for (const entry of entries || []) {
          window.__redeemedKeys.add(`${entry.marketId}:BUY_${entry.outcomeIdx === 0 ? "YES" : "NO"}`);
        }
        setRedemptionState("REDEEMED", "REDEEMED — " + shortHash(hash) + "; complete claim scan found no submitted claims remaining");
        setTimeout(() => { if (redemptionRequests.isCurrent(generation)) refreshFills(); }, 3000);
        return;
      }
      if (attempt < 5) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }
      setRedemptionState("CONFIRMED", "CONFIRMED — " + shortHash(hash) + "; " + claimsRemaining + " submitted claim" + (claimsRemaining === 1 ? "" : "s") + " remain");
      return;
    } catch {
      if (attempt === 5) {
        setRedemptionState("UNKNOWN", "UNKNOWN — " + shortHash(hash) + "; post-receipt claim scan unavailable. Retry verification only.");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
}

// Auto-load — shell renders first, data services attach after (decoupled)
window.loadMarkets = loadMarkets;
window.__steady = window.__steady || {};
window.__steady.receiptPricePresentation = receiptPricePresentation;
window.__steady.updateExecutionControls = updateExecutionControls;
window.__steady.selectMarket = selectMarket;
window.__steady.selectionSnapshot = () => ({ marketId: selected?.marketId || null, hasBook: Boolean(book), hasBookParams: Boolean(bookParams), error: selectionError || "" });
window.__steadyBootedAt = Date.now();
updateExecutionControls();
loadMarkets().finally(()=>{ window.__steadyBooted = true; try{ renderPolicyGate(); }catch{} });
setInterval(()=>{ if(document.visibilityState==="visible") loadMarkets(); }, 90_000); // discovery 60-120s per 32, not 30s
setInterval(()=>{
  if(cooldownUntil && cooldownUntil > Date.now()){
    const sec=Math.ceil((cooldownUntil-Date.now())/1000);
    els.tiltCountdown.textContent=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`;
    const streak = window.__cooldownStreak ?? 2;
    els.tiltMsg.textContent = `${streak} consecutive losses. Trading resumes in ${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}.`;
  }
},1000);

// Wallet listeners
try{
  const _prov = (typeof getInjectedProvider === "function") ? getInjectedProvider() : null;
  _prov?.on?.("accountsChanged", ()=>location.reload());
  _prov?.on?.("chainChanged", ()=>location.reload());
}catch{}
