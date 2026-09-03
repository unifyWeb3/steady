import { describe, it } from "node:test";
import assert from "node:assert/strict";
function computeScore(calls, minN=5){
  const settled = calls.filter(c=>!c.void);
  const n=settled.length, sufficient=n>=minN;
  if(!sufficient) return { n, sufficient:false, brier:null, edge:null };
  let brierSum=0, priceSum=0, wins=0;
  for(const c of settled){ brierSum+=(c.priceProb-(c.won?1:0))**2; priceSum+=c.priceProb; if(c.won) wins++; }
  const brier=brierSum/n, avg=priceSum/n, winRate=wins/n, edge=winRate-avg;
  return { n, brier, edge, winRate, avg, sufficient:true };
}
describe("scoring", ()=>{
  it("needs 5", ()=>{
    const s=computeScore([{priceProb:0.6,won:true},{priceProb:0.6,won:false}]);
    assert.equal(s.sufficient,false);
    assert.equal(s.brier,null);
  });
  it("brier 0 for perfect", ()=>{
    const calls=[{priceProb:1,won:true},{priceProb:0,won:false},{priceProb:1,won:true},{priceProb:0,won:false},{priceProb:1,won:true}];
    const s=computeScore(calls);
    assert.equal(s.brier,0);
  });
  it("brier 0.25 for guessing", ()=>{
    const calls=Array(5).fill({priceProb:0.5,won:true}); // won random, but if always 0.5 and win 50%? use 5 with 2 wins 3 losses avg? simpler: all 0.5, 2 wins 3 losses -> brier = (0.5-1)^2*2 + (0.5-0)^2*3 /5 = 0.25
    const c=[{priceProb:0.5,won:true},{priceProb:0.5,won:true},{priceProb:0.5,won:false},{priceProb:0.5,won:false},{priceProb:0.5,won:false}];
    const s=computeScore(c);
    assert.equal(s.brier,0.25);
  });
  it("edge positive when beating price", ()=>{
    const c=[{priceProb:0.6,won:true},{priceProb:0.6,won:true},{priceProb:0.6,won:true},{priceProb:0.6,won:true},{priceProb:0.6,won:false}]; // winRate 0.8 vs avg 0.6 => edge 0.2
    const s=computeScore(c);
    assert.equal(s.edge.toFixed(2),"0.20");
  });
});
