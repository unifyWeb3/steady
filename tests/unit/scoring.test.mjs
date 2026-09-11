import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeScore, outcomeProbabilityFromYesPrice, settledCallFromFill } from "../../lib/steady/scoring.js";
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
  it("orients BUY_NO from YES-term fill prices", ()=>{
    assert.equal(outcomeProbabilityFromYesPrice(250000n, "BUY_YES"), 0.25);
    assert.equal(outcomeProbabilityFromYesPrice(250000n, "BUY_NO"), 0.75);
  });

  it("computes explicit UP Brier and Edge from the traded outcome probability", () => {
    const calls = [
      settledCallFromFill({ fillPriceRaw: 800000n, side: "BUY_YES", won: true }),
      settledCallFromFill({ fillPriceRaw: 700000n, side: "BUY_YES", won: true }),
      settledCallFromFill({ fillPriceRaw: 600000n, side: "BUY_YES", won: false }),
      settledCallFromFill({ fillPriceRaw: 400000n, side: "BUY_YES", won: false }),
      settledCallFromFill({ fillPriceRaw: 900000n, side: "BUY_YES", won: true }),
    ];
    const score = computeScore(calls);
    assert.equal(score.brier.toFixed(3), "0.132");
    assert.equal(score.edge.toFixed(3), "-0.080");
  });

  it("computes explicit DOWN Brier and Edge after inverting YES-term fills", () => {
    const calls = [
      settledCallFromFill({ fillPriceRaw: 200000n, side: "BUY_NO", won: true }),
      settledCallFromFill({ fillPriceRaw: 300000n, side: "BUY_NO", won: true }),
      settledCallFromFill({ fillPriceRaw: 400000n, side: "BUY_NO", won: false }),
      settledCallFromFill({ fillPriceRaw: 600000n, side: "BUY_NO", won: false }),
      settledCallFromFill({ fillPriceRaw: 100000n, side: "BUY_NO", won: true }),
    ];
    const score = computeScore(calls);
    assert.equal(calls[0].priceProb, 0.8);
    assert.equal(score.brier.toFixed(3), "0.132");
    assert.equal(score.edge.toFixed(3), "-0.080");
  });
});
