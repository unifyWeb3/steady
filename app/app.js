// Steady app.js — real SDK, no mocks, discipline-first
// Shell boots WITHOUT waiting for SDK: SDK lazy-loads via dynamic import with
// timeout, so esm.sh slowness (~10s) or indexer outage never blanks the app.
// See research/32-control-plane.md (decoupled shell → data services → real data or explicit error).
const INDEXER_URL = "https://dev.smk.somnia.host/v1/graphql";
const WS_URL = "wss://api.infra.testnet.somnia.network/ws";
const ONE_6 = 1_000_000n;

let _sdk = null; // { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES, somniaShannon, viem }
let _sdkError = null;
function loadSdk(timeoutMs = 30000){
  if(localStorage.getItem("steady:debug")) console.log("loadSdk started");
  if(_sdk) return Promise.resolve(_sdk);
  // No permanent error cache: esm.sh/indexer blips must not brick Retry until reload.
  const p = (async()=>{
    if(localStorage.getItem("steady:debug")) console.log("importing @somnia-chain/markets-sdk");
    const [sdk, chains, viem] = await Promise.all([
      import("@somnia-chain/markets-sdk"),
      import("@somnia-chain/markets-sdk/chains"),
      import("viem"),
    ]);
    if(localStorage.getItem("steady:debug")) console.log("imports done");
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
let fillsCache = []; // settled + open
let cooldownUntil = null;
let marketsCache = [];

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
    indexerUrl: INDEXER_URL,
    chain: sdk.somniaShannon,
    wsRpcUrl: WS_URL,
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
// Market IDs are sequential (0x0000…0136e3) — first chars identical, last 6 disambiguate
function mktShort(id){ return id && id.length>10 ? "…"+id.slice(-6) : (id||"—"); }
function toProb(raw) { return Number(raw)/Number(ONE_6); }
function tickSnap(priceRaw, tick){ return (priceRaw / tick) * tick; }
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
  if (kind) {
    els.statusBar.style.color = kind === "risk" ? "var(--risk)" : kind === "success" ? "var(--up)" : "inherit";
  } else {
    els.statusBar.style.color = "inherit";
  }
}

// Discovery — >60s headroom, with timeout and decoupled shell (app shell renders even if indexer hangs)
async function loadMarkets(){
  els.marketTbody.innerHTML = `<tr><td colspan="6" class="empty">Loading live markets…</td></tr>`;
  setStatus("Loading SDK…", "");
  els.marketCount.textContent = "loading";
  let stillLoading = true;
  const fallback = setTimeout(()=>{
    if(stillLoading){
      els.marketTbody.innerHTML = `<tr><td colspan="6" class="empty">
        <div style="padding:16px;display:grid;gap:12px;justify-items:center">
          <div class="caption">Market data unavailable</div>
          <div style="font-size:13px;color:var(--ink-2)">Indexer timed out after 12s — check network, then retry</div>
          <button class="btn btn-secondary" data-retry="1" onclick="window.loadMarkets&&window.loadMarkets()" style="height:32px">Retry</button>
          <div class="caption">App shell remains usable — wallet, ticket, and positions work without live markets</div>
        </div>
      </td></tr>`;
      els.marketCount.textContent = "error";
      setStatus("Market data timeout — retry available", "risk");
    }
  }, 13000);
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), 12000);
  try{
    let ex;
    try{ ex = await getExchange(); }
    catch(sdkErr){ throw new Error(`SDK load failed: ${(sdkErr&&sdkErr.message)||sdkErr} — esm.sh slow/blocked, Retry`); }
    setStatus("Loading live markets…", "");
    const livePromise = ex.client.listLiveBinaryMarkets({ limit: 50 });
    const live = await Promise.race([
      livePromise,
      new Promise((_,rej)=> setTimeout(()=>rej(new Error("Indexer timeout after 12s — retry")), 12000))
    ]);
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
    marketsCache = eligible;
    try{ persistCache(); }catch{}
    els.marketCount.textContent = `${eligible.length} live`;
    if (eligible.length===0){
      els.marketTbody.innerHTML = "";
      els.marketEmpty.style.display="block";
      setStatus("No live windows with headroom — retrying in 15s","risk");
      return;
    }
    els.marketEmpty.style.display="none";
    // Gate on Trading status 1 for first 8
    const withStatus = [];
    for(const m of eligible.slice(0,8)){
      try{
        const oc = await ex.client.getMarketOnchain(m.marketId);
        if (oc.status===1) withStatus.push({...m, status: oc.status});
      }catch{}
    }
    const display = withStatus.length? withStatus : eligible.slice(0,8);
    els.marketTbody.innerHTML = "";
    for(const m of display){
      // fetch book for spread preview (best effort)
      let spreadTxt="—", bidTxt="—", askTxt="—";
      try{
        const b = await ex.client.getBinaryOrderBook(m.pool, { depth: 3 });
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
        <td data-l="Market"><span class="mono rowmain">${m.asset}</span> <span class="caption">${label}</span><br><span class="caption mono">${mktShort(m.marketId)}</span></td>
        <td data-l="Expiry" class="mono">${new Date(m.expirySec*1000).toISOString().slice(11,16)} UTC</td>
        <td data-l="Time left" class="mono ${cd.cls}">${cd.text}</td>
        <td data-l="Best bid / ask" class="mono num">${bidTxt} / ${askTxt}</td>
        <td data-l="Spread" class="mono num">${spreadTxt}</td>
        <td data-l="Select"><button class="btn btn-secondary btn-sm">Select</button></td>`;
      tr.querySelector("button").onclick = (e) => { e.stopPropagation(); selectMarket(m); };
      tr.onclick = () => selectMarket(m);
      els.marketTbody.appendChild(tr);
    }
    // Never leave the ticket in its dead CTA state when live windows exist:
    // preselect the soonest-expiring window (read-only book fetch, no order path).
    if (!selected && display.length) selectMarket(display[0]);
    setStatus(`Live: ${display.length} Trading windows with >60s headroom (BTC/ETH 1m/5m/15m/1h/4h/1d)`, "success");
  }catch(e){
    clearTimeout(timeout);
    const msg = e.message||String(e);
    const isTimeout = msg.includes("timeout") || msg.includes("Timeout") || e.name==="AbortError";
    els.marketTbody.innerHTML = `<tr><td colspan="6" class="empty">
      <div style="padding:16px;display:grid;gap:12px;justify-items:center">
        <div class="caption">Market data unavailable</div>
        <div style="font-size:13px;color:var(--ink-2)">${isTimeout ? "Indexer timed out after 12s" : `Indexer error: ${msg.slice(0,120)}`}</div>
        <button class="btn btn-secondary" data-retry="1" onclick="window.loadMarkets&&window.loadMarkets()" style="height:32px">Retry</button>
        <div class="caption">App shell remains usable — wallet, ticket, and positions work without live markets</div>
      </div>
    </td></tr>`;
    els.marketCount.textContent = "error";
    setStatus(isTimeout ? "Market data timeout — retry available" : `Market data error — ${msg.slice(0,80)}`, "risk");
    // schedule retry in 15s, but don't block shell
    setTimeout(()=>{ if(document.visibilityState==="visible") loadMarkets(); }, 15000);
  }
}

async function selectMarket(m){
  selected = m;
  els.ticketMarket.textContent = `${m.asset} ${m.intervalSec===60?"1m":m.intervalSec===300?"5m":m.intervalSec===900?"15m":m.intervalSec===3600?"1h":m.intervalSec===14400?"4h":m.intervalSec===86400?"1d":`${m.intervalSec}s`} · expiry ${new Date(m.expirySec*1000).toISOString().slice(11,16)} UTC · ${mktShort(m.marketId)} · pool ${m.pool.slice(0,10)}…`;
  els.ticketMarket.title = m.marketId;
  document.querySelectorAll("#marketTbody tr.row").forEach(tr=>{
    tr.classList.toggle("selected", tr.dataset.marketId === m.marketId);
  });
  // fetch book + params
  try{
    const ex = await getExchange();
    book = await ex.client.getBinaryOrderBook(m.pool, { depth: 5 });
    bookParams = await ex.client.getBinaryBookParams(m.pool);
    updatePreview();
  }catch(e){
    els.previewBook.textContent = `Book error: ${e.message?.slice(0,100)}`;
  }
  // countdown ticker
  if (window._ticker) clearInterval(window._ticker);
  window._ticker = setInterval(()=>{ if(selected) els.previewExpiry.textContent = `Expiry ${fmtExpiry(selected.expirySec)} · Spread ${book?.yesBids?.[0] && book?.yesAsks?.[0] ? ((Number(book.yesAsks[0].price)-Number(book.yesBids[0].price))/1e6).toFixed(3) : "—"}`; },1000);
}

function computeTicket(maxLossHuman, side){
  if(!selected || !bookParams) return { error:"Select market first" };
  const tick = BigInt(bookParams.tickSize);
  const lot = BigInt(bookParams.lotSize);
  const minQty = BigInt(bookParams.minQuantity);
  // Preview uses the SAME executable price as execute(): cross the side-relevant
  // book by 0.02 in YES-limit terms (SDK escrow: BUY_NO pays 1−price per NO).
  // DOWN probability reads off the NO book — never 1−YESask as before.
  const _bestAskRaw = (book?.yesAsks?.[0]?.price !== undefined && book?.yesAsks?.[0]?.price !== null) ? BigInt(book.yesAsks[0].price) : 500_000n;
  const _bestNoAskRaw = (book?.noAsks?.[0]?.price !== undefined && book?.noAsks?.[0]?.price !== null) ? BigInt(book.noAsks[0].price) : null;
  let _yesPrice = (side === "BUY_YES") ? (_bestAskRaw + 20000n)
    : (_bestNoAskRaw !== null ? (1_000_000n - (_bestNoAskRaw + 20000n)) : (_bestAskRaw + 20000n));
  if (_yesPrice >= 1_000_000n || _yesPrice <= 0n) return { error: `No executable ${side === "BUY_YES" ? "UP" : "DOWN"} price on this book — try the next window` };
  const snapped = (_yesPrice / tick) * tick;
  if (snapped <= 0n || snapped >= 1_000_000n) return { error: `Price off tick grid — try the next window` };
  const sidePrice = (side==="BUY_YES") ? snapped : (1_000_000n - snapped);
  // real available balance if connected, else fallback 10k for preview
  const availableRaw = (window.__tUSDCBalance !== undefined ? window.__tUSDCBalance : 10_000_000n * 1000n);
  const maxLossRaw = BigInt(Math.round(maxLossHuman*1e6));
  let qtyFromLoss = (maxLossRaw * ONE_6) / sidePrice;
  let qtyRaw = (qtyFromLoss / lot) * lot;
  if (qtyRaw < minQty) return { error: `Quantity ${(Number(qtyRaw)/1e6).toFixed(3)} below min ${(Number(minQty)/1e6).toFixed(3)} — increase max loss` };
  if (qtyRaw===0n) return { error:"Quantity 0 after lot snap — increase max loss" };
  const payRaw = (qtyRaw * sidePrice) / ONE_6;
  const payoutRaw = qtyRaw;
  const profitRaw = payoutRaw - payRaw;
  // spread
  const bestBid = book?.yesBids?.[0]?.price ? Number(book.yesBids[0].price)/1e6 : null;
  const bestAsk = book?.yesAsks?.[0]?.price ? Number(book.yesAsks[0].price)/1e6 : null;
  const spread = bestBid!==null && bestAsk!==null ? bestAsk-bestBid : null;
  // priceProb is the SIDE probability the user buys (UP=YES, DOWN=1-YES); priceRaw stays YES terms for SDK
  const sideProb = Number(sidePrice)/1e6;
  return { payRaw, payoutRaw, profitRaw, qtyRaw, priceRaw: snapped, priceProb: sideProb, sidePrice, spread, bookDepth: book?.yesAsks?.[0]?.quantity ? BigInt(book.yesAsks[0].quantity) : undefined };
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
    return;
  }
  // show both sides preview for current maxLoss; labels map UP=YES outcome, DOWN=NO outcome
  const yes = computeTicket(v, "BUY_YES");
  const no = computeTicket(v, "BUY_NO");
  if (yes.error) {
    els.previewPay.textContent=yes.error;
    if(els.riskNum) els.riskNum.textContent="—";
    if(els.riskSub) els.riskSub.textContent=yes.error;
    return;
  }
  const payH = (Number(yes.payRaw)/1e6).toFixed(2);
  const winH = (Number(yes.payoutRaw)/1e6).toFixed(2);
  const profitH = (Number(yes.profitRaw)/1e6).toFixed(2);
  const qtyH = (Number(yes.qtyRaw)/1e6).toFixed(3);
  if(els.riskNum) els.riskNum.textContent = `${payH} tUSDC`;
  if(els.riskSub) els.riskSub.textContent = `Capped downside · ${qtyH} contracts · IOC`;
  els.previewPay.textContent = `${payH} → ${winH} if UP @ ${(yes.priceProb).toFixed(3)}`;
  els.previewWin.textContent = `+${profitH} · ${qtyH} contracts`;
  els.previewExpiry.textContent = `${fmtExpiry(selected.expirySec)} · ${yes.spread!==null?yes.spread.toFixed(3):"—"}`;
  els.previewBook.textContent = `${book?.yesBids?.[0]? (Number(book.yesBids[0].price)/1e6).toFixed(3):"—"} / ${book?.yesAsks?.[0]? (Number(book.yesAsks[0].price)/1e6).toFixed(3):"—"} · t${bookParams?.tickSize} l${bookParams?.lotSize}`;
  els.buyYes.textContent = `Buy UP — ${payH}`;
  els.buyNo.textContent = `Buy DOWN — ${payH}`;
  // Policy consistency: current account state vs this execution's policy result must never contradict
  if (cooldownUntil && cooldownUntil > Date.now()){
    const secs = Math.ceil((cooldownUntil-Date.now())/1000);
    els.previewCapped.textContent = `Trade policy: DENIED — cooldown active (${secs}s remaining). Current account state: COOLDOWN.`;
    if (els.previewCappedRow) els.previewCappedRow.style.display = "flex";
  } else {
    els.previewCapped.textContent = "Trade policy for this ticket: PASS (market Trading, headroom, spread, size checked at execution).";
    if (els.previewCappedRow) els.previewCappedRow.style.display = "flex";
  }
  try{ renderPolicyGate(); }catch{}
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
  set("pg-market", selected ? true : null, selected ? `Selected ${selected.asset} ${String(selected.marketId).slice(0,10)}… (Trading re-verified at execution)` : "Pick a live window");
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
    if (chainId!==50312){
      try{ await provider.request({ method:"wallet_switchEthereumChain", params:[{ chainId:"0xc488" }] }); }catch{
        await provider.request({ method:"wallet_addEthereumChain", params:[{ chainId:"0xc488", chainName:"Somnia Testnet", rpcUrls:["https://api.infra.testnet.somnia.network"], blockExplorerUrls:["https://shannon-explorer.somnia.network"], nativeCurrency:{ name:"STT", symbol:"STT", decimals:18 } }] });
      }
    }
    const sdk0 = await loadSdk();
    _wc = sdk0.viem.createWalletClient({ chain: sdk0.somniaShannon, transport: sdk0.viem.custom(provider), account: _addr });
    if(!_wc) throw new Error("Could not build wallet client for this provider");
    // Commit: only now is the wallet actually usable.
    walletAddress = _addr;
    walletClient = _wc;
    els.walletAddr.textContent = walletAddress.slice(0,6)+"…"+walletAddress.slice(-4);
    els.walletAddr.title = walletAddress;
    els.connectBtn.textContent = "Connected";
    // fetch tUSDC for honest ticket capping
    try{
      const ex2 = await getExchange();
      const bal = await ex2.client.getErc20Balance(sdk0.SOMNIA_TESTNET_ADDRESSES.collateral, walletAddress);
      window.__tUSDCBalance = bal;
      walletStatusText = `Connected ${walletAddress.slice(0,6)}… on 50312`;
      setStatus(`tUSDC ${(Number(bal)/1e6).toFixed(2)} — fetching fills…`, "success");
    }catch(e){
      window.__tUSDCBalance = undefined; // unknown — never invent a balance; policy shows ○
      walletStatusText = `Connected ${walletAddress.slice(0,6)}… on 50312`;
      setStatus(`fetching fills…`, "success");
    }
    await refreshFills();
  }catch(e){
    walletAddress = null;
    walletClient = null;
    els.walletAddr.textContent = "—";
    els.walletAddr.title = "Not connected";
    els.connectBtn.textContent = "Connect";
    walletStatusText = "";
    setStatus(`Connect failed: ${(e.message || String(e)).slice(0,140)}`, "risk");
  }
  finally{ els.connectBtn.disabled = false; }
}

// Fills + scoring + discipline
// Position state — vanilla port of lib/steady/positionState.ts (pure, no SDK).
// Emits ONLY tab-compatible states: LIVE|SETTLING|CLAIMABLE|WON|LOST|VOID.
function resolvePositionState(p){
  const yesBal = p.yesBalanceRaw ?? 0n;
  const noBal = p.noBalanceRaw ?? 0n;
  const isYes = /YES/.test(`${p.takerSide ?? ""}${p.side ?? ""}`);
  const held = isYes ? yesBal : noBal;
  const voided = p.isVoided === true || p.status === 5;
  const settledResolved = p.isResolved === true || p.status === 4;
  const outcomeKnown = p.winningOutcome === 0 || p.winningOutcome === 1;
  let state;
  if (voided) state = (yesBal > 0n || noBal > 0n) ? "CLAIMABLE" : "VOID";
  else if (settledResolved && !outcomeKnown) state = "SETTLING"; // resolved but snapshot unread — never guess
  else if (settledResolved) state = ((p.winningOutcome === 0) === isYes) ? (held > 0n ? "CLAIMABLE" : "WON") : "LOST";
  else if (p.status === 2 || p.status === 3) state = "SETTLING";
  else if (p.status === 0 || p.status === 1) state = "LIVE";
  else if (p.expirySec && p.nowSec && p.nowSec > p.expirySec) state = "SETTLING";
  else state = "LIVE";
  if (p.redeemed === true && state === "CLAIMABLE") state = voided ? "VOID" : "WON";
  return state;
}

async function refreshFills(){
  if(!walletAddress) return;
  let ex;
  try{ ex = await getExchange(); }
  catch(e){ console.error("refreshFills SDK unavailable:", e.message); return; }
  try{
    const fills = await withTimeout(ex.client.getUserFills(walletAddress, { since: 0, limit: 50 }), 15000, "Fills read");
    fillsCache = fills;
    try{ persistCache(); }catch{}
    await resolveFillStates(ex); // onchain status + ERC-6909 balances, bounded + best-effort
    renderPositions();
    renderScore();
    renderDiscipline();
  }catch(e){
    console.error(e);
    // Indexer down but chain alive: serve cached fills with LIVE on-chain states.
    if(isIndexerError(e)){
      const had = restoreCache();
      if(had.fills){
        try{ await resolveFillStates(ex); }catch{}
        renderPositions();
        renderDiscipline();
        setStatus("Indexer down — cached fills with live on-chain states", "risk");
        return;
      }
    }
  }
}

// Bounded enrichment: unique markets only (≤8), every read guarded — one revert
// never breaks the ledger; unresolved rows keep the honest expiry fallback.
async function resolveFillStates(ex){
  const now = Math.floor(Date.now()/1000);
  const ids = [...new Set(fillsCache.map(f=>f.market).filter(Boolean))].slice(0,8);
  const ocByMarket = {};
  await Promise.all(ids.map(async (id)=>{
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
  const now = Math.floor(Date.now()/1000);
  let rows = fillsCache.map(f=>{
    if (f._state) return f;
    const expiry = f._expiry || 0;
    return { ...f, _state: (expiry && now > expiry) ? "SETTLING" : "LIVE", _expiry: expiry };
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
    gh.innerHTML = `<td colspan="7" data-l="Market"><span class="mono">${gLabel}</span> <span class="ticket-hint">${mktShort(marketId)}${fills[0]?.pool ? " · pool " + String(fills[0].pool).slice(0,10) + "…" : ""}</span></td>`;
    tbody.appendChild(gh);
    for(const f of fills){
      const tr=document.createElement("tr");
      const side = f.takerSide||f.side||"—";
      const sideCls = side.includes("YES") ? "badge badge-up" : side.includes("NO") ? "badge badge-down" : "badge badge-quiet";
      const tx = f.txHash || "";
      // Quantity is 6-decimal raw (same base as ticket: 1000 raw = 1 lot = 0.001 contracts).
      const qtyTxt = (f.quantity !== undefined && f.quantity !== null) ? (Number(f.quantity)/1e6).toFixed(3) : "—";
      tr.innerHTML=`
        <td data-l="Market" class="mono ticket-hint">${mktShort(f.market)}</td>
        <td data-l="Side"><span class="${sideCls}">${side.replace("BUY_","")}</span></td>
        <td data-l="Fill price" class="mono num">${f.fillPrice? (Number(f.fillPrice)/1e6).toFixed(3): "—"}</td>
        <td data-l="Contracts" class="mono num">${qtyTxt}</td>
        <td data-l="State"><span class="${stateBadge(f._state)}">${f._state==="LIVE"?"● LIVE":f._state}</span></td>
        <td data-l="Tx" class="mono" style="max-width:140px;overflow:hidden;text-overflow:ellipsis">${tx?`<a class="hashlink" href="https://shannon-explorer.somnia.network/tx/${tx}" target="_blank" rel="noopener">${shortHash(tx)} ↗</a>`:"—"}</td>
        <td data-l="Expiry" class="mono num ticket-hint">${f._expiry? fmtExpiry(f._expiry): "—"}</td>`;
      tbody.appendChild(tr);
    }
  }
}

function renderScore(){
  // need settled calls: for MVP, derive from fills that are past expiry and have known outcome?
  // We lack outcome without getMarketResolution — so show insufficient honestly if <5
  // Try to fetch resolution for last 5 fills
  const settledCalls = []; // placeholder: we will compute when we have outcomes
  // For now, if fills length >=5, we cannot compute without oracle — show honestly
  if (fillsCache.length <5){
    els.brierVal.textContent = "— Need 5 settled";
    els.edgeVal.textContent = "—";
    // els.brierLabel.textContent = `You have ${fillsCache.length} fills — need 5 settled to calibrate`;
    els.scoreN.textContent = `n ${fillsCache.length}`;
    els.brierFill.style.width="0%";
    els.last5.innerHTML = "";
    return;
  }
  // If we had priceProb + won, compute — but we need real outcomes; keep honest
  els.brierVal.textContent = `— need oracle outcomes (fetching…)`;
  // els.scoreDetail.textContent = `Fills found: ${fillsCache.length}. Resolving outcomes via market settlement…`;
  // Attempt to fetch quickly for last 5
  (async()=>{
    let ex;
    try{ ex = await getExchange(); }
    catch(e){ els.brierVal.textContent="— SDK unavailable"; return; }
    const calls=[];
    for(const f of fillsCache.slice(0,5)){
      try{
        const res = await ex.client.getMarketOnchain(f.market);
        // res.status 4 RESOLVED, 5 VOIDED; need winningOutcome — probe fields
        const status = res.status;
        const winIdx = res.winningOutcome ?? res.winner ?? null;
        const voided = status===5;
        if(voided){ calls.push({ priceProb: Number(f.fillPrice)/1e6, won:false, void:true }); continue; }
        if(status===4 && winIdx!==null){
          const sideIsYes = (f.takerSide||"").includes("YES");
          const won = (winIdx===0 && sideIsYes) || (winIdx===1 && !sideIsYes);
          calls.push({ priceProb: Number(f.fillPrice)/1e6, won });
        }
      }catch{}
    }
    if(calls.filter(c=>!c.void).length>=5){
      // compute Brier/Edge pure
      const settled = calls.filter(c=>!c.void);
      let brier=0, priceSum=0, wins=0;
      for(const c of settled){ brier += (c.priceProb - (c.won?1:0))**2; priceSum+=c.priceProb; if(c.won) wins++; }
      brier/=settled.length; const avg=priceSum/settled.length, winRate=wins/settled.length, edge=winRate-avg;
      els.brierVal.textContent = brier.toFixed(3);
      els.edgeVal.textContent = (edge>=0?"+":"")+edge.toFixed(3);
      els.brierFill.style.width = `${Math.min(100, (brier/0.5)*100)}%`;
      els.brierLabel && (els.brierLabel.textContent = brier<0.25?"Steady": brier<0.33?"Drifting":"Tilting");
      els.scoreN.textContent = `n ${settled.length}`;
      els.edgeFill.style.width = `${50+edge*100}%`;
      els.last5.innerHTML = settled.slice(-5).map(c=>`<span class="wl-dot ${c.won?"wl-w":"wl-l"}" title="${c.won?"Won":"Lost"}">${c.won?"W":"L"}</span>`).join("");
      window.__lastSettledCalls = settled;
      renderDiscipline(settled);
    } else if(calls.length>0){
      window.__lastSettledCalls = calls.filter(c=>!c.void);
      renderDiscipline(window.__lastSettledCalls);
    }
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
    // Only re-enable if not in SUBMITTING
    if(!window.__submitting){
      els.buyYes.disabled = false;
      els.buyNo.disabled = false;
      els.buyYes.title=""; els.buyNo.title="";
    }
  }
  try{ renderPolicyGate(); }catch{}
  return streak;
}
window.__lastSettledCalls = [];


// Execution — real IOC via walletClient. Single authoritative write boundary:
// every trader.placeOrder call in this app goes through here, after policy evaluation.
async function execute(side){
  if(window.__submitting){ els.execStatus.style.display='block'; els.execStatus.textContent="Already submitting — wait for receipt (no duplicate)"; els.execStatus.className="alert"; return; }
  if(!selected){ alert("Select a market first"); return; }
  if(!walletAddress || !walletClient){ alert("Connect wallet first"); return; }
  if(!els.confirmBox.checked){ alert("Confirm max loss understanding"); return; }
  const maxLoss = Number(els.maxLoss.value);
  if(!maxLoss || maxLoss<=0){ alert("Enter max loss"); return; }
  const tradeAttemptId = 'steady-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);
  console.log(`[${tradeAttemptId}] intent`, { side, maxLoss, marketId: selected.marketId });
  window.__submitting = true;
  els.buyYes.disabled=true; els.buyNo.disabled=true; els.execStatus.style.display='block';
  // cooldown check — real discipline state, not placeholder
  if (cooldownUntil && cooldownUntil > Date.now()){
    const secs = Math.ceil((cooldownUntil-Date.now())/1000);
    els.execStatus.textContent=`Policy blocked: COOLDOWN — ${secs}s remaining (2 consecutive losses)`;
    els.execStatus.className="alert alert-risk";
    window.__submitting=false; els.buyYes.disabled=false; els.buyNo.disabled=false;
    return;
  }
  let ex;
  try{ ex = await getExchange(); }
  catch(sdkErr){ els.execStatus.textContent=`SDK unavailable: ${(sdkErr&&sdkErr.message)||sdkErr}`; els.execStatus.className="alert alert-risk"; window.__submitting=false; els.buyYes.disabled=false; els.buyNo.disabled=false; return; }
  els.execStatus.style.display="block";
  els.execStatus.textContent = "Checking market status…";
  els.execStatus.className="alert";
  const _resetSubmit = ()=>{ window.__submitting=false; els.buyYes.disabled=false; els.buyNo.disabled=false; };
  try{
    const oc = await ex.client.getMarketOnchain(selected.marketId);
    if (oc.status!==1){ els.execStatus.textContent=`Market not Trading (status ${oc.status}) — picking next window`; els.execStatus.className="alert alert-risk"; await loadMarkets(); _resetSubmit(); return; }
    const expirySec = Number(selected.expirySec);
    if (expirySec - Math.floor(Date.now()/1000) < 60){ els.execStatus.textContent="Market locks in <60s — choose next window"; els.execStatus.className="alert alert-risk"; _resetSubmit(); return; }
    const params = await ex.client.getBinaryBookParams(selected.pool);
    const tick = BigInt(params.tickSize), lot = BigInt(params.lotSize), minQty = BigInt(params.minQuantity);
    const bookNow = await ex.client.getBinaryOrderBook(selected.pool, { depth: 5 });
    if (!bookNow.yesAsks?.length && !bookNow.yesBids?.length){ els.execStatus.textContent="Empty book — no liquidity on either side (honest, not fake). Try next window."; els.execStatus.className="alert alert-risk"; _resetSubmit(); return; }
    const bestAskRaw = bookNow.yesAsks?.[0]?.price !== undefined && bookNow.yesAsks?.[0]?.price !== null ? BigInt(bookNow.yesAsks[0].price) : 500_000n;
    const bestNoAskRaw = bookNow.noAsks?.[0]?.price !== undefined && bookNow.noAsks?.[0]?.price !== null ? BigInt(bookNow.noAsks[0].price) : null;
    // Refuse honestly when YOUR side has no resting liquidity — a sent IOC would
    // burn gas to fill nothing (ImmediateOrCancelNoFill by another name).
    if (side === "BUY_YES" && !(bookNow.yesAsks && bookNow.yesAsks.length)) { els.execStatus.textContent = "No UP (YES) liquidity on this window — try the next window or Buy DOWN."; els.execStatus.className = "alert alert-risk"; _resetSubmit(); return; }
    if (side === "BUY_NO" && !(bookNow.noAsks && bookNow.noAsks.length)) { els.execStatus.textContent = "No DOWN (NO) liquidity on this window — try the next window or Buy UP."; els.execStatus.className = "alert alert-risk"; _resetSubmit(); return; }
    // YES-limit semantics (SDK escrow: BUY_YES pays price, BUY_NO pays 1−price per
    // token). Cross the SIDE-relevant book by 0.02: YES asks for UP, NO asks for DOWN.
    // (writer.js escrow: BUY_NO amount = qty×(1−price); toBinaryBook: noAsks = 1−yesBids.)
    let yesPriceRaw;
    if (side === "BUY_YES") yesPriceRaw = (bestAskRaw + 20000n);
    else if (bestNoAskRaw !== null) yesPriceRaw = 1_000_000n - (bestNoAskRaw + 20000n);
    else yesPriceRaw = (bestAskRaw + 20000n); // NO side unquoted: same YES cross (fills vs implied NO)
    yesPriceRaw = (yesPriceRaw / tick) * tick;
    if (yesPriceRaw<=0n || yesPriceRaw>=ONE_6){ els.execStatus.textContent=`Invalid price ${yesPriceRaw} after tick snap`; els.execStatus.className="alert alert-risk"; _resetSubmit(); return; }
    // qty from maxLoss: qty = maxLoss / (side price)
    // Policy gate — at execution boundary, not just UI warning
    const policyChecks = [];
    // market eligibility already checked (Trading + headroom)
    // liquidity/spread check
    const spreadRaw = book?.yesBids?.[0]?.price && book?.yesAsks?.[0]?.price ? (BigInt(book.yesAsks[0].price) - BigInt(book.yesBids[0].price)) : 0n;
    if (spreadRaw > 150000n) policyChecks.push({ rule:"maxSpread 0.15", pass:false, code:"SPREAD_TOO_WIDE", reason:`Spread ${(Number(spreadRaw)/1e6).toFixed(3)} >0.15` });
    else policyChecks.push({ rule:"maxSpread", pass:true, code:"OK" });
    // Discipline evaluation at the boundary — real settled outcomes only, never random
    const _settled = (window.__lastSettledCalls || []).filter(c=>!c.void);
    let _streak = 0;
    for(let i=_settled.length-1;i>=0;i--){ if(!_settled[i].won) _streak++; else break; }
    if(_streak>=2){
      const msg = `COOLDOWN — ${_streak} consecutive losses (Brier over last ${_settled.length})`;
      console.log(`[${tradeAttemptId}] policy DENY`, msg);
      els.execStatus.textContent=`Policy blocked: ${msg} — wait for cooldown`;
      els.execStatus.className="alert alert-risk";
      _resetSubmit(); renderDiscipline(window.__lastSettledCalls || []);
      return;
    }
    policyChecks.push({ rule:"cooldown(2-loss)", pass:true, code:"OK" });
    const failed = policyChecks.find(c=>!c.pass);
    if(failed){
      console.log(`[${tradeAttemptId}] policy DENY`, failed);
      els.execStatus.textContent=`Policy blocked: ${failed.code} — ${failed.reason}`;
      els.execStatus.className="alert alert-risk";
      _resetSubmit();
      return;
    }
    console.log(`[${tradeAttemptId}] policy PASS`, policyChecks);
    const sidePrice = side==="BUY_YES" ? yesPriceRaw : 1_000_000n - yesPriceRaw;
    const maxLossRaw = BigInt(Math.round(maxLoss*1e6));
    let qtyRaw = (maxLossRaw * ONE_6) / sidePrice;
    qtyRaw = (qtyRaw / lot) * lot;
    if (qtyRaw < minQty){ els.execStatus.textContent=`Quantity ${Number(qtyRaw)/1e6} below min — increase max loss`; els.execStatus.className="alert alert-risk"; _resetSubmit(); return; }
    // Balance gate AT the boundary (the ticket's "Balance Sufficient" row is otherwise
    // decorative): refuse before any signature with exact have/need numbers.
    try{
      const _addrs = getSdkAddrs();
      if(_addrs && _addrs.collateral){
        const _bal = await ex.client.getErc20Balance(_addrs.collateral, walletAddress);
        window.__tUSDCBalance = _bal;
        const _payRaw = (qtyRaw * sidePrice) / ONE_6;
        if(_bal < _payRaw){
          els.execStatus.textContent = `Insufficient tUSDC: need ~${(Number(_payRaw)/1e6).toFixed(2)} but have ${(Number(_bal)/1e6).toFixed(2)} — use the faucet button, then retry`;
          els.execStatus.className = "alert alert-risk";
          _resetSubmit(); try{ renderPolicyGate(); }catch{}
          return;
        }
      }
    }catch(_balErr){ /* RPC blip: proceed — the pool reverts InsufficientBalance honestly on-chain rather than us guessing */ }
    const expireNs = BigInt(Math.floor(Date.now()/1000 + 120)*1e9);
    const marketExpiryNs = BigInt(expirySec)*1_000_000_000n;
    const finalExpiry = expireNs < marketExpiryNs - 10_000_000_000n ? expireNs : marketExpiryNs - 10_000_000_000n;

    els.execStatus.textContent = `Signing IOC ${side} price ${(Number(yesPriceRaw)/1e6).toFixed(3)} qty ${(Number(qtyRaw)/1e6).toFixed(3)}… (first trade may ask a one-time token approval first)`;
    // Need trader via walletClient — SDK expects client.createTrader({ walletClient })
    // Import dynamically to avoid circular
    const trader = ex.client.createTrader({ walletClient });
    // Note: SDK placeOrder expects pool, side, price, quantity, orderType, expireTimestampNs
    const res = await trader.placeOrder({
      pool: selected.pool,
      side,
      price: yesPriceRaw,
      quantity: qtyRaw,
      orderType: 2, // MARKET/IOC
      expireTimestampNs: finalExpiry,
    });
    const receipt = res.receipt || res;
    const hash = receipt.transactionHash || res.transactionHash || res.hash || "unknown";
    const status = receipt.status || res.status;
    if (status==="reverted" || status===0 || status==="0x0"){
      els.execStatus.textContent=`Reverted: ${hash} — ${receipt.error || "unknown"}`;
      els.execStatus.className="alert alert-risk";
      _resetSubmit();
      return;
    }
    els.execStatus.innerHTML = `<span class="code">CONFIRMED · ${status}</span> Sent — <a class="hashlink" href="https://shannon-explorer.somnia.network/tx/${hash}" target="_blank" rel="noopener">${shortHash(hash)} ↗</a>`;
    els.execStatus.className="alert alert-success";
    // refresh
    window.__lastAttemptHash = receipt.transactionHash || res.transactionHash || res.hash || "";
    // Actual fill is known IMMEDIATELY: IOC fills ride in the placeOrder result
    // (PlaceOrderResult.fills[].fillPrice, YES terms) — no 3s faith gap.
    // getUserFills refresh below stays as independent reconciliation.
    const _bign = (v)=>{ try{ return BigInt(v); }catch{ try{ return BigInt(String(v).replace(/n$/, "")); }catch{ return 0n; } } };
    let _actualTxt = "no fill — fully cancelled, nothing paid";
    try{
      const _fills = Array.isArray(res.fills) ? res.fills : [];
      let _q = 0n, _not = 0n;
      for(const _f of _fills){ const _qq = _bign(_f.quantityFilled ?? 0); _q += _qq; _not += _qq * _bign(_f.fillPrice ?? 0); }
      if(_q > 0n){
        const _avgYes = Number(_not / _q) / 1e6;
        _actualTxt = side === "BUY_NO"
          ? `${_avgYes.toFixed(3)} YES-equiv (${(1 - _avgYes).toFixed(3)} NO)`
          : _avgYes.toFixed(3);
        window.__lastFillPrice = _avgYes.toFixed(3);
      } else { window.__lastFillPrice = undefined; }
    }catch{ window.__lastFillPrice = undefined; }
    console.log(`[${tradeAttemptId}] CONFIRMED hash ${window.__lastAttemptHash} quoted ${(Number(yesPriceRaw)/1e6).toFixed(3)} vs actual will be verified via fill`);
    // Trade receipt — progressive disclosure: default completed, View proof expands
    try{
      const recEl=document.getElementById("tradeReceipt");
      if(recEl){
        recEl.style.display="block";
        const maxLossDisplay = (Number(qtyRaw)/1e6 * (side==="BUY_YES" ? Number(yesPriceRaw)/1e6 : 1 - Number(yesPriceRaw)/1e6)).toFixed(2);
        const expiryDisplay = new Date(Number(finalExpiry/1000000000n)*1000).toISOString().slice(11,19);
        const orderIdDisplay = (res && res.orderId) || (receipt && receipt.orderId) || "—";
        recEl.innerHTML =
           `<div class="receipt-head"><span class="caption">Trade completed — ${tradeAttemptId}</span><span style="display:flex;gap:8px;align-items:center"><span class="badge badge-up">Mined</span><button class="btn btn-secondary btn-sm" id="copyProofBtn" type="button">Copy proof</button></span></div>` +
          `<div style="padding:10px 12px;font-size:13px">${side.replace("BUY_","")} ${(Number(qtyRaw)/1e6).toFixed(3)} contracts · max loss ${maxLossDisplay} tUSDC · <a class="hashlink" href="https://shannon-explorer.somnia.network/tx/${window.__lastAttemptHash}" target="_blank" rel="noopener">${shortHash(window.__lastAttemptHash)} ↗</a></div>` +
          `<details><summary>View proof <span class="caption">quoted · actual · policy · fill</span></summary><div class="proof">` +
          `<div class="prow"><span class="k">Market / pool</span><span class="v">${mktShort(selected.marketId)} / ${selected.pool.slice(0,10)}…</span></div>` +
          `<div class="prow"><span class="k">Side / qty</span><span class="v">${side} · ${(Number(qtyRaw)/1e6).toFixed(3)}</span></div>` +
          `<div class="prow"><span class="k">Quoted</span><span class="v">${(Number(yesPriceRaw)/1e6).toFixed(3)}</span></div>` +
           `<div class="prow"><span class="k">Actual fill</span><span class="v">${_actualTxt} · ${Array.isArray(res.fills) ? res.fills.length : 0} fill leg${Array.isArray(res.fills) && res.fills.length === 1 ? "" : "s"} in-tx</span></div>` +
          `<div class="prow"><span class="k">Max loss / expiry</span><span class="v">${maxLossDisplay} · ${expiryDisplay} UTC</span></div>` +
          `<div class="prow"><span class="k">Policy at execution</span><span class="v">${policyChecks.map(function(c){return c.code}).join(" · ")}</span></div>` +
          `<div class="prow"><span class="k">Wallet</span><span class="v">${walletAddress.slice(0,10)}…</span></div>` +
          `<div class="prow"><span class="k">Tx</span><span class="v"><a class="hashlink" href="https://shannon-explorer.somnia.network/tx/${window.__lastAttemptHash}" target="_blank" rel="noopener">${shortHash(window.__lastAttemptHash)} ↗</a></span></div>` +
          `<div class="prow"><span class="k">Order</span><span class="v">${String(orderIdDisplay).slice(0,18)}</span></div>` +
           `</div></details>`;
        // Shareable proof: text+link (no gamification) — the receipt travels.
        try{
          const cp = document.getElementById("copyProofBtn");
          if(cp) cp.onclick = async()=>{
            const actualRow = (window.__lastFillPrice !== undefined) ? ` → fill ${window.__lastFillPrice}` : " → fill pending (~3s)";
            const txt = `Steady receipt: ${side.replace("BUY_","")} ${(Number(qtyRaw)/1e6).toFixed(3)} contracts · quoted ${(Number(yesPriceRaw)/1e6).toFixed(3)}${actualRow} · max loss ${maxLossDisplay} tUSDC · tx https://shannon-explorer.somnia.network/tx/${window.__lastAttemptHash}`;
            try{ await navigator.clipboard.writeText(txt); cp.textContent = "Copied ✓"; }
            catch{ cp.textContent = "Copy blocked"; }
            setTimeout(()=>{ cp.textContent = "Copy proof"; }, 2500);
          };
        }catch{}
      }
    }catch(e){}
    setTimeout(()=>{ refreshFills(); window.__submitting=false; els.buyYes.disabled=false; els.buyNo.disabled=false; }, 3000);
  }catch(e){
    const msg = e.message||String(e);
    // UNKNOWN vs FAILED — never convert timeout to failed without receipt check
    const isTimeout = msg.includes("timeout") || msg.includes("Timeout") || msg.includes("UND_ERR") || msg.includes("ConnectTimeout");
    const maybeHash = (e.data && e.data.transactionHash) || (e.cause && e.cause.transactionHash) || window.__lastAttemptHash || "";
    if(isTimeout && maybeHash){
      els.execStatus.textContent=`UNKNOWN — submitted ${maybeHash.slice(0,10)}… but RPC timed out. Reconciling…`;
      els.execStatus.className="alert";
      console.log(`[${tradeAttemptId}] UNKNOWN timeout, hash ${maybeHash}, will reconcile via getTransactionReceipt`);
      // Reconcile: poll receipt
      (async()=>{
        try{
          const ex2=await getExchange();
          for(let i=0;i<6;i++){
            await new Promise(r=>setTimeout(r,3000));
            try{
              const rc=await ex2.client.getViemClient().getTransactionReceipt({ hash: maybeHash });
              if(rc.status==="success"){ els.execStatus.innerHTML=`<span class="code">RECONCILED · SUCCESS</span> Reconciled — <a class="hashlink" href="https://shannon-explorer.somnia.network/tx/${maybeHash}" target="_blank" rel="noopener">${shortHash(maybeHash)} ↗</a> (was UNKNOWN)`; els.execStatus.className="alert alert-success"; refreshFills(); break; }
              else if(rc.status==="reverted"){ els.execStatus.textContent=`Reverted after UNKNOWN — ${maybeHash.slice(0,10)}…`; els.execStatus.className="alert alert-risk"; break; }
            }catch{}
          }
        }catch{}
        window.__submitting=false; els.buyYes.disabled=false; els.buyNo.disabled=false;
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
    console.error(e);
    window.__submitting=false; els.buyYes.disabled=false; els.buyNo.disabled=false;
  } finally {
    // No blind re-enable here: success path clears after 3s refresh, error paths already reset.
    // UNKNOWN path keeps SUBMITTING until reconciliation finishes. This prevents duplicate submission.
    if(window.__submitting && !els.execStatus.textContent.includes("UNKNOWN") && !els.execStatus.textContent.includes("Signing") && !els.execStatus.textContent.includes("Checking")){
      // Safety net only: if we somehow left flag set without UNKNOWN/Signing state, log it
      console.log(`[${tradeAttemptId}] finally: still submitting, state=${els.execStatus.textContent.slice(0,60)}`);
    }
  }
}

// Events
els.refreshBtn.onclick = loadMarkets;
els.buyYes.onclick = ()=>execute("BUY_YES");
els.buyNo.onclick = ()=>execute("BUY_NO");
els.connectBtn.onclick = connect;
els.maxLoss.oninput = updatePreview;
document.querySelectorAll(".tab").forEach(t=>t.onclick=(e)=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  e.currentTarget.classList.add("active");
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
    if(els.faucetStatus) els.faucetStatus.innerHTML = `Sent — <a class="hashlink" href="https://shannon-explorer.somnia.network/tx/${hash}" target="_blank" rel="noopener">${hash.slice(0,10)}… ↗</a>`;
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
    return `<div class="settle-row"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span class="mono rowmain">${mktShort(c.marketId)} · ${c.outcomeIdx===0?"YES":"NO"} · ${amt}</span><span class="badge badge-solid">${c.status || "Settled"}</span></div><div class="caption">est payout ~${est} tUSDC · pool ${String(c.pool||"").slice(0,10)}…</div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="hashlink" href="https://shannon-explorer.somnia.network/" target="_blank" rel="noopener">Explorer ↗</a></div></div>`;
  }).join("");
}

// On-chain claimable scan (indexer-down fallback): winner-with-balance or
// voided-with-balance per known market. Same entry shape as getClaimable
// ({marketId, pool, outcomeIdx, amount, estPayout, status}).
async function scanClaimableOnchain(ex, marketIds){
  const out = [];
  await Promise.all((marketIds || []).map(async (id)=>{
    try{
      const oc = await ex.client.getMarketOnchain(id);
      const ot = oc.outcomeToken;
      if(!ot || oc.yesId === undefined || oc.noId === undefined) return;
      const y = await ex.client.getOutcomeBalance({ outcomeToken: ot, account: walletAddress, id: BigInt(oc.yesId) }).catch(()=>0n);
      const n = await ex.client.getOutcomeBalance({ outcomeToken: ot, account: walletAddress, id: BigInt(oc.noId) }).catch(()=>0n);
      if(oc.isVoided || Number(oc.status) === 5){
        if(y > 0n) out.push({ marketId: id, pool: oc.pool, outcomeIdx: 0, amount: y, estPayout: y / 2n, status: "Voided" });
        if(n > 0n) out.push({ marketId: id, pool: oc.pool, outcomeIdx: 1, amount: n, estPayout: n / 2n, status: "Voided" });
      } else if(oc.isResolved && (oc.winningOutcome === 0 || oc.winningOutcome === 1)){
        const held = oc.winningOutcome === 0 ? y : n;
        if(held > 0n) out.push({ marketId: id, pool: oc.pool, outcomeIdx: oc.winningOutcome, amount: held, estPayout: held, status: "Resolved" });
      }
    }catch{}
  }));
  return out;
}

els.redeemAll.onclick = async()=>{
  if(!walletAddress || !walletClient) return alert("Connect wallet first");
  let ex;
  try{ ex = await getExchange(); }
  catch(e){ els.execStatus.style.display="block"; els.execStatus.textContent=`SDK unavailable: ${e.message}`; els.execStatus.className="alert alert-risk"; return; }
  els.execStatus.style.display="block";
  els.execStatus.textContent="Scanning claimable positions (settled winners + voids)…";
  els.execStatus.className="alert";
  try{
    let scanned = null, viaFallback = false;
    try{
      scanned = await withTimeout(ex.client.getClaimable(walletAddress), 15000, "Claimable scan");
    }catch(scanErr){
      if(!isIndexerError(scanErr)) throw scanErr;
      // Indexer down: verify fully on-chain over known markets (fills + cache).
      els.execStatus.textContent = "Indexer down — verifying claimables fully on-chain…";
      restoreCache();
      const ids = [...new Set(fillsCache.map(f=>f.market).filter(Boolean))].slice(0,10);
      scanned = await scanClaimableOnchain(ex, ids);
      viaFallback = true;
    }
    const rows = (Array.isArray(scanned) ? scanned : []).filter(c=>{ try{ return BigInt(c.amount) > 0n && (c.outcomeIdx === 0 || c.outcomeIdx === 1); }catch{ return false; } });
    renderSettlementScan(rows);
    if(!rows.length){
      els.execStatus.textContent="Nothing claimable — no stranded winnings. Settle a win first, then redeem here.";
      els.execStatus.className="alert alert-success";
      return;
    }
    let totalEst = 0n;
    for(const c of rows){ try{ totalEst += BigInt(c.estPayout ?? c.amount); }catch{} }
    els.execStatus.textContent=`Claiming ${rows.length} position${rows.length>1?"s":""} (~${(Number(totalEst)/1e6).toFixed(3)} tUSDC) in ONE transaction — sign in wallet…${viaFallback ? " (verified fully on-chain — indexer down)" : ""}`;
    els.execStatus.className="alert";
    const entries = rows.map(c=>({ marketId: c.marketId, outcomeIdx: c.outcomeIdx, amount: BigInt(c.amount) }));
    const trader = ex.client.createTrader({ walletClient });
    const res = await trader.redeemMany({ entries });
    const receipt = res.receipt || res;
    const hash = receipt.transactionHash || res.transactionHash || res.hash || "unknown";
    // Demote redeemed CLAIMABLE rows to WON/VOID on next refresh (losers were never CLAIMABLE).
    try{
      window.__redeemedKeys = window.__redeemedKeys || new Set();
      for(const e of entries){ window.__redeemedKeys.add(`${e.marketId}:BUY_YES`); window.__redeemedKeys.add(`${e.marketId}:BUY_NO`); }
    }catch{}
    els.execStatus.innerHTML = `<span class="code">REDEEMED · ${receipt.status || "mined"}</span> <a class="hashlink" href="https://shannon-explorer.somnia.network/tx/${hash}" target="_blank" rel="noopener">${shortHash(hash)} ↗</a> — ledger refreshes in ~3s`;
    els.execStatus.className="alert alert-success";
    setTimeout(()=>{ refreshFills(); }, 3000);
  }catch(e){ els.execStatus.innerHTML=`<span class="code">REDEEM_FAILED</span> Redeem failed: ${(e.message||String(e)).slice(0,200)}`; els.execStatus.className="alert alert-risk"; }
};

// Auto-load — shell renders first, data services attach after (decoupled)
window.loadMarkets = loadMarkets;
window.__steady = window.__steady || {};
window.__steadyBootedAt = Date.now();
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
