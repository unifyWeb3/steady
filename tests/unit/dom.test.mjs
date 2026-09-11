import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, safeExplorerTx } from "../../lib/steady/dom.js";

describe("safe DOM helpers", () => {
  it("escapes markup and attribute payloads", () => {
    const payload = `<script>alert(1)</script>\" onmouseover=alert(2)`;
    const escaped = escapeHtml(payload);
    assert.equal(escaped.includes("<script>"), false);
    assert.equal(escaped.includes("&quot;"), true);
    assert.equal(escaped.includes("onmouseover"), true);
  });

  it("only creates explorer transaction URLs for full hashes", () => {
    assert.match(safeExplorerTx("0x" + "ab".repeat(32)), /\/tx\/0x/);
    assert.equal(safeExplorerTx("javascript:alert(1)"), "https://shannon-explorer.somnia.network");
  });
});
