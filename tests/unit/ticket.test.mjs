import { describe, it } from "node:test";
import assert from "node:assert/strict";
const ONE_6 = 1_000_000n;
function computeTicket({ maxLossHuman, entryPriceProb, tickRaw, lotRaw, minQtyRaw, availableBalanceRaw, bookDepthRaw }) {
  if (maxLossHuman <=0) return { error:"Enter max loss >0" };
  if (entryPriceProb<=0 || entryPriceProb>=1) return { error:"Price must be (0,1)" };
  const priceRaw = BigInt(Math.round(entryPriceProb*1e6));
  const snapped = (priceRaw / tickRaw) * tickRaw;
  if (snapped<=0n || snapped>=ONE_6) return { error:`Price ${snapped} out of range` };
  const maxLossRaw = BigInt(Math.round(maxLossHuman*1e6));
  let qtyFromLoss = (maxLossRaw * ONE_6) / snapped;
  let qtyRaw = (qtyFromLoss / lotRaw) * lotRaw;
  // cap by balance
  let qtyFromBalRaw = (availableBalanceRaw * ONE_6) / snapped;
  let qtyBalSnapped = (qtyFromBalRaw / lotRaw) * lotRaw;
  if (qtyBalSnapped < qtyRaw) qtyRaw = qtyBalSnapped;
  if (bookDepthRaw !== undefined) {
    let depthSnapped = (bookDepthRaw / lotRaw) * lotRaw;
    if (depthSnapped < qtyRaw) qtyRaw = depthSnapped;
  }
  if (qtyRaw < minQtyRaw) return { error:`Quantity ${Number(qtyRaw)/1e6} below min` };
  if (qtyRaw===0n) return { error:"Quantity 0" };
  const payRaw = (qtyRaw * snapped)/ONE_6;
  const payoutRaw = qtyRaw;
  return { payRaw, payoutRaw, qtyRaw, priceRaw: snapped };
}
describe("ticket", ()=>{
  it("computes max loss 25 at 0.55", ()=>{
    const r = computeTicket({ maxLossHuman:25, entryPriceProb:0.55, tickRaw:1000n, lotRaw:1000n, minQtyRaw:1000n, availableBalanceRaw:10000n*1000n });
    assert.equal(r.error, undefined);
    assert.equal(Number(r.payRaw)/1e6 < 25.01, true);
    assert.equal(Number(r.qtyRaw)/1e6 > 0, true);
  });
  it("caps at balance", ()=>{
    const r = computeTicket({ maxLossHuman:100, entryPriceProb:0.5, tickRaw:1000n, lotRaw:1000n, minQtyRaw:1000n, availableBalanceRaw:1000000n });
    assert.equal(Number(r.payRaw)/1e6 <=1.01, true);
    assert.equal(r.qtyRaw, 2000000n);
  });
  it("tick snap", ()=>{
    const r = computeTicket({ maxLossHuman:10, entryPriceProb:0.3333, tickRaw:1000n, lotRaw:1000n, minQtyRaw:1000n, availableBalanceRaw:10000000n });
    assert.equal(r.priceRaw % 1000n, 0n);
  });
  it("rejects invalid price", ()=>{
    const r = computeTicket({ maxLossHuman:10, entryPriceProb:0.0, tickRaw:1000n, lotRaw:1000n, minQtyRaw:1000n, availableBalanceRaw:10000000n });
    assert.ok(r.error);
  });
  it("caps at depth", ()=>{
    const r = computeTicket({ maxLossHuman:100, entryPriceProb:0.5, tickRaw:1000n, lotRaw:1000n, minQtyRaw:1000n, availableBalanceRaw:100000000n, bookDepthRaw: 500000n });
    assert.equal(r.qtyRaw, 500000n);
  });
});
