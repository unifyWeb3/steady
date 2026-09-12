import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  attributeFillSide,
  normalizeFillsChronologically,
} from "../../lib/steady/fill-attribution.js";

const wallet = "0xAbCd";

describe("fill attribution", () => {
  it("uses the taker order side when the wallet is the taker", () => {
    const result = attributeFillSide({
      taker: wallet,
      takerSide: null,
      takerOrder: { owner: wallet, side: "BUY_NO" },
      maker: "0xmaker",
      makerSide: "SELL_NO",
    }, wallet);
    assert.deepEqual(result, { role: "TAKER", side: "BUY_NO", resolved: true });
  });

  it("uses makerSide when the wallet is the maker", () => {
    const result = attributeFillSide({
      maker: wallet,
      makerSide: "SELL_YES",
      taker: "0xtaker",
      takerSide: "BUY_YES",
      takerOrder: { owner: "0xtaker", side: "BUY_YES" },
    }, wallet);
    assert.deepEqual(result, { role: "MAKER", side: "SELL_YES", resolved: true });
  });

  it("keeps a taker side UNKNOWN while both taker-side sources are unresolved", () => {
    const result = attributeFillSide({
      taker: wallet,
      takerSide: null,
      takerOrder: { owner: wallet, side: null },
      maker: "0xmaker",
      makerSide: null,
    }, wallet);
    assert.deepEqual(result, { role: "TAKER", side: "UNKNOWN", resolved: false });
  });

  it("falls back to a bridged takerSide only when the taker order side is absent", () => {
    const result = attributeFillSide({
      taker: wallet,
      takerSide: "BUY_YES",
      takerOrder: { owner: wallet, side: null },
      maker: "0xmaker",
    }, wallet);
    assert.equal(result.side, "BUY_YES");
  });

  it("normalizes SDK newest-first fills to chronological order", () => {
    const newestFirst = [
      { id: "new", timestamp: "200" },
      { id: "old", timestamp: "100" },
      { id: "middle", timestamp: "150" },
    ];
    assert.deepEqual(normalizeFillsChronologically(newestFirst).map((fill) => fill.id), ["old", "middle", "new"]);
  });

  it("keeps SDK newest-first semantics when optional ordering metadata is absent", () => {
    assert.deepEqual(
      normalizeFillsChronologically([{ id: "new" }, { id: "old" }]).map((fill) => fill.id),
      ["old", "new"],
    );
  });
});
