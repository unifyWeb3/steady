import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getBrowserConfig } from "../../lib/config/browser.js";

describe("browser config", () => {
  it("exposes only validated Shannon endpoints", () => {
    const config = getBrowserConfig({
      chainId: 50312,
      indexerUrl: "https://example.test/graphql",
      wsRpcUrl: "wss://example.test/ws",
      rpcHttpUrl: "https://example.test",
    });
    assert.deepEqual(config, {
      chainId: 50312,
      indexerUrl: "https://example.test/graphql",
      wsRpcUrl: "wss://example.test/ws",
      rpcHttpUrl: "https://example.test",
    });
    assert.equal("privateKey" in config, false);
  });

  it("rejects an unexpected chain and unsafe protocols", () => {
    assert.throws(() => getBrowserConfig({ chainId: 1 }), /50312/);
    assert.throws(() => getBrowserConfig({ indexerUrl: "javascript:alert(1)" }), /Invalid browser config/);
  });
});
