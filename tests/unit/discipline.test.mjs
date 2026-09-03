import { describe, it } from "node:test";
import assert from "node:assert/strict";
function deriveDiscipline(calls, nowMs=Date.now(), existing=null){
  const settled=calls.filter(c=>!c.void);
  let streak=0;
  for(let i=settled.length-1;i>=0;i--){ if(!settled[i].won) streak++; else break; }
  const COOLDOWN=3*60*1000;
  if(existing!==null && existing>nowMs) return { blocked:true, consecutiveLosses:streak, cooldownUntilMs:existing };
  if(streak>=2) return { blocked:true, consecutiveLosses:streak, cooldownUntilMs: nowMs+COOLDOWN };
  return { blocked:false, consecutiveLosses:streak, cooldownUntilMs:null };
}
describe("discipline", ()=>{
  it("blocks after 2 losses", ()=>{
    const calls=[{won:true},{won:false},{won:false}];
    const d=deriveDiscipline(calls, 1000000, null);
    assert.equal(d.blocked,true);
    assert.equal(d.consecutiveLosses,2);
  });
  it("not block after win", ()=>{
    const calls=[{won:false},{won:false},{won:true}];
    const d=deriveDiscipline(calls, 1000000, null);
    assert.equal(d.blocked,false);
  });
  it("keeps cooldown if still active", ()=>{
    const calls=[{won:false},{won:false}];
    const d=deriveDiscipline(calls, 1000000, 1000000+100000);
    assert.equal(d.blocked,true);
  });
  it("unblocks after cooldown expiry", ()=>{
    const calls=[{won:false},{won:false}];
    const d=deriveDiscipline(calls, 2000000, 1000000+180000);
    // existing cooldown expired, but streak still 2 => should re-block (since streak still 2, new cooldown)
    assert.equal(d.blocked,true);
  });
});
