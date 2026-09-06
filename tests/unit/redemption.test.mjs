import { describe, it } from "node:test";
import assert from "node:assert/strict";
// Mirrors the pure shapers in lib/dreamdex/redemption.ts (repo convention:
// tests inline the pure logic; live redeem path is proven by the harness,
// never mocked here).
function buildRedeemEntry(marketId, outcomeIdx, amount) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(marketId)) throw new Error(`Invalid marketId ${marketId}`);
  if (outcomeIdx !== 0 && outcomeIdx !== 1) throw new Error(`outcomeIdx must be 0|1, got ${outcomeIdx}`);
  if (typeof amount !== "bigint" || amount <= 0n) throw new Error(`amount must be positive bigint, got ${String(amount)}`);
  return { marketId, outcomeIdx, amount };
}
function entriesFromClaimable(rows) {
  return rows
    .filter((r) => r && BigInt(r.amount) > 0n && (r.outcomeIdx === 0 || r.outcomeIdx === 1))
    .map((r) => buildRedeemEntry(r.marketId, r.outcomeIdx, BigInt(r.amount)));
}
const MID = "0x" + "ab".repeat(32);
describe("redemption shapers", ()=>{
  it("builds a valid entry", ()=>{
    assert.deepEqual(buildRedeemEntry(MID, 0, 1000n), { marketId: MID, outcomeIdx: 0, amount: 1000n });
    assert.deepEqual(buildRedeemEntry(MID, 1, 1n), { marketId: MID, outcomeIdx: 1, amount: 1n });
  });
  it("rejects bad marketId", ()=>{
    assert.throws(()=>buildRedeemEntry("0x1234", 0, 1000n));
    assert.throws(()=>buildRedeemEntry("", 0, 1000n));
  });
  it("rejects bad outcomeIdx", ()=>{
    assert.throws(()=>buildRedeemEntry(MID, 2, 1000n));
    assert.throws(()=>buildRedeemEntry(MID, -1, 1000n));
  });
  it("rejects non-positive or non-bigint amounts (never silently redeem zero)", ()=>{
    assert.throws(()=>buildRedeemEntry(MID, 0, 0n));
    assert.throws(()=>buildRedeemEntry(MID, 0, -5n));
    assert.throws(()=>buildRedeemEntry(MID, 0, 1000));
    assert.throws(()=>buildRedeemEntry(MID, 0, "1000"));
  });
  it("entriesFromClaimable drops dust and bad rows, maps the rest", ()=>{
    const rows = [
      { marketId: MID, outcomeIdx: 0, amount: 1000n },
      { marketId: MID, outcomeIdx: 1, amount: 0n },
      { marketId: MID, outcomeIdx: 5, amount: 100n },
      null,
    ];
    const entries = entriesFromClaimable(rows);
    assert.equal(entries.length, 1);
    assert.deepEqual(entries[0], { marketId: MID, outcomeIdx: 0, amount: 1000n });
  });
  it("empty scan yields empty entries (redeemMany must no-op, not throw)", ()=>{
    assert.deepEqual(entriesFromClaimable([]), []);
  });
});
