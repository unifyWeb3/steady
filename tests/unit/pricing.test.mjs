import { describe, it } from "node:test";
import assert from "node:assert/strict";
// Mirrors crossingYesPriceForSide in lib/dreamdex/execution.ts (repo convention:
// tests inline the pure logic; SDK escrow semantics from writer.js — BUY_YES pays
// `price`, BUY_NO pays `1−price` per token — so DOWN must cross the NO book).
function crossingYesPriceForSide({ side, bestYesAskRaw, bestNoAskRaw }) {
  if (side === "BUY_YES") return bestYesAskRaw + 20000n;
  if (bestNoAskRaw !== null && bestNoAskRaw !== undefined) return 1000000n - (bestNoAskRaw + 20000n);
  return bestYesAskRaw + 20000n;
}
describe("pricing", ()=>{
  it("UP crosses YES asks by 0.02", ()=>{
    assert.equal(crossingYesPriceForSide({ side:"BUY_YES", bestYesAskRaw:537000n, bestNoAskRaw:492000n }), 557000n);
  });
  it("DOWN crosses NO asks by 0.02 in YES-limit terms", ()=>{
    // NO ask 0.492 → YES limit 0.488 → escrow 0.512/NO (matches the NO book, not 1−YESask)
    const yes = crossingYesPriceForSide({ side:"BUY_NO", bestYesAskRaw:537000n, bestNoAskRaw:492000n });
    assert.equal(yes, 488000n);
    assert.equal(1000000n - yes, 512000n); // what the trader actually pays per NO
  });
  it("DOWN no longer mirrors 1−YESask (the old misprice)", ()=>{
    const yes = crossingYesPriceForSide({ side:"BUY_NO", bestYesAskRaw:537000n, bestNoAskRaw:492000n });
    assert.notEqual(yes, 1000000n - (537000n + 20000n)); // old: 443000 (over-cross by 0.094)
  });
  it("DOWN falls back to YES cross when NO side unquoted", ()=>{
    assert.equal(crossingYesPriceForSide({ side:"BUY_NO", bestYesAskRaw:537000n, bestNoAskRaw:null }), 557000n);
  });
  it("absurd NO asks produce out-of-range YES limits (caller must refuse, never clamp)", ()=>{
    const yes = crossingYesPriceForSide({ side:"BUY_NO", bestYesAskRaw:10000n, bestNoAskRaw:990000n });
    assert.ok(yes <= 0n); // DOWN at 0.99+ NO is unbuyable — execute() refuses honestly
  });
});
