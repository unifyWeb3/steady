import { describe, it } from "node:test";
import assert from "node:assert/strict";
// Mirrors lib/steady/positionState.ts (repo convention: tests inline the pure
// logic since lib is TS and `npm test` runs without tsc — keep in sync).
function sideIsYes(p) { return /YES/.test(`${p.takerSide ?? ""}${p.side ?? ""}`); }
function heldBalanceRaw(p) { return sideIsYes(p) ? (p.yesBalanceRaw ?? 0n) : (p.noBalanceRaw ?? 0n); }
function resolvePositionState(p) {
  const yesBal = p.yesBalanceRaw ?? 0n;
  const noBal = p.noBalanceRaw ?? 0n;
  const held = heldBalanceRaw(p);
  const voided = p.isVoided === true || p.status === 5;
  const settledResolved = p.isResolved === true || p.status === 4;
  const outcomeKnown = p.winningOutcome === 0 || p.winningOutcome === 1;
  let state;
  if (voided) {
    state = yesBal > 0n || noBal > 0n ? "CLAIMABLE" : "VOID";
  } else if (settledResolved && !outcomeKnown) {
    state = "SETTLING";
  } else if (settledResolved) {
    const won = (p.winningOutcome === 0) === sideIsYes(p);
    if (won) state = held > 0n ? "CLAIMABLE" : "WON";
    else state = "LOST";
  } else if (p.status === 2 || p.status === 3) {
    state = "SETTLING";
  } else if (p.status === 0 || p.status === 1) {
    state = "LIVE";
  } else if (p.expirySec !== undefined && p.nowSec !== undefined && p.nowSec > p.expirySec) {
    state = "SETTLING";
  } else {
    state = "LIVE";
  }
  if (p.redeemed === true && state === "CLAIMABLE") state = voided ? "VOID" : "WON";
  return state;
}
describe("positionState", ()=>{
  it("LIVE while Trading or Listed", ()=>{
    assert.equal(resolvePositionState({ side:"BUY_YES", status:1 }), "LIVE");
    assert.equal(resolvePositionState({ side:"BUY_NO", status:0 }), "LIVE");
  });
  it("SETTLING when Locked or Settling", ()=>{
    assert.equal(resolvePositionState({ side:"BUY_YES", status:2 }), "SETTLING");
    assert.equal(resolvePositionState({ side:"BUY_YES", status:3 }), "SETTLING");
  });
  it("expiry fallback: past expiry SETTLING, future LIVE", ()=>{
    assert.equal(resolvePositionState({ side:"BUY_YES", status:null, expirySec:100, nowSec:200 }), "SETTLING");
    assert.equal(resolvePositionState({ side:"BUY_YES", status:null, expirySec:300, nowSec:200 }), "LIVE");
  });
  it("ignores default winningOutcome 0 on unresolved markets", ()=>{
    assert.equal(resolvePositionState({ side:"BUY_NO", status:1, winningOutcome:0, isResolved:false }), "LIVE");
  });
  it("CLAIMABLE winner with balance, WON when closed", ()=>{
    assert.equal(resolvePositionState({ side:"BUY_YES", status:4, isResolved:true, winningOutcome:0, yesBalanceRaw:1000n }), "CLAIMABLE");
    assert.equal(resolvePositionState({ side:"BUY_YES", status:4, isResolved:true, winningOutcome:0, yesBalanceRaw:0n }), "WON");
    assert.equal(resolvePositionState({ side:"BUY_NO", status:4, isResolved:true, winningOutcome:1, noBalanceRaw:1000n }), "CLAIMABLE");
  });
  it("LOST for loser side regardless of dust", ()=>{
    assert.equal(resolvePositionState({ side:"BUY_YES", status:4, isResolved:true, winningOutcome:1, yesBalanceRaw:1000n }), "LOST");
    assert.equal(resolvePositionState({ side:"BUY_NO", status:4, isResolved:true, winningOutcome:0, noBalanceRaw:0n }), "LOST");
  });
  it("resolved without outcome snapshot stays SETTLING", ()=>{
    assert.equal(resolvePositionState({ side:"BUY_YES", status:4, isResolved:false, winningOutcome:null }), "SETTLING");
  });
  it("voided: CLAIMABLE with balance, VOID when closed", ()=>{
    assert.equal(resolvePositionState({ side:"BUY_YES", status:5, isVoided:true, yesBalanceRaw:500n }), "CLAIMABLE");
    assert.equal(resolvePositionState({ side:"BUY_NO", status:5, isVoided:true, yesBalanceRaw:0n, noBalanceRaw:0n }), "VOID");
  });
  it("redeemed demotes CLAIMABLE to WON (or VOID when voided)", ()=>{
    assert.equal(resolvePositionState({ side:"BUY_YES", status:4, isResolved:true, winningOutcome:0, yesBalanceRaw:1000n, redeemed:true }), "WON");
    assert.equal(resolvePositionState({ side:"BUY_YES", status:5, isVoided:true, yesBalanceRaw:500n, redeemed:true }), "VOID");
  });
  it("only emits tab-compatible states", ()=>{
    const allowed = new Set(["LIVE","SETTLING","CLAIMABLE","WON","LOST","VOID"]);
    const cases = [
      { side:"BUY_YES", status:1 }, { side:"BUY_YES", status:2 },
      { side:"BUY_YES", status:4, isResolved:true, winningOutcome:0, yesBalanceRaw:1n },
      { side:"BUY_YES", status:4, isResolved:true, winningOutcome:1 },
      { side:"BUY_YES", status:5, isVoided:true },
    ];
    for (const c of cases) assert.ok(allowed.has(resolvePositionState(c)), `state not tab-compatible for status=${c.status}`);
  });
});
