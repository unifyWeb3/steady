import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolvePositionState } from "../../lib/steady/position-state.js";
describe("positionState", ()=>{
  it("LIVE while Trading or Listed", ()=>{
    assert.equal(resolvePositionState({ side:"BUY_YES", status:1 }), "LIVE");
    assert.equal(resolvePositionState({ side:"BUY_NO", status:0 }), "LIVE");
  });
  it("SETTLING when Locked or Settling", ()=>{
    assert.equal(resolvePositionState({ side:"BUY_YES", status:2 }), "SETTLING");
    assert.equal(resolvePositionState({ side:"BUY_YES", status:3 }), "SETTLING");
  });
  it("unknown status stays UNKNOWN even when expiry is known", ()=>{
    assert.equal(resolvePositionState({ side:"BUY_YES", status:null, expirySec:100, nowSec:200 }), "UNKNOWN");
    assert.equal(resolvePositionState({ side:"BUY_YES", status:null, expirySec:300, nowSec:200 }), "UNKNOWN");
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
  it("only emits documented position states", ()=>{
    const allowed = new Set(["LIVE","SETTLING","CLAIMABLE","WON","LOST","VOID","UNKNOWN"]);
    const cases = [
      { side:"BUY_YES", status:1 }, { side:"BUY_YES", status:2 },
      { side:"BUY_YES", status:4, isResolved:true, winningOutcome:0, yesBalanceRaw:1n },
      { side:"BUY_YES", status:4, isResolved:true, winningOutcome:1 },
      { side:"BUY_YES", status:5, isVoided:true },
    ];
    for (const c of cases) assert.ok(allowed.has(resolvePositionState(c)), `state not tab-compatible for status=${c.status}`);
  });
});
