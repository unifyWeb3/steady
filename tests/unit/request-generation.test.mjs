import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequestGeneration } from "../../lib/steady/request-generation.js";

describe("request generations", () => {
  it("invalidates an older async completion when a newer request starts", () => {
    const requests = createRequestGeneration();
    const first = requests.start();
    assert.equal(requests.isCurrent(first), true);
    const second = requests.start();
    assert.equal(requests.isCurrent(first), false);
    assert.equal(requests.isCurrent(second), true);
    requests.invalidate();
    assert.equal(requests.isCurrent(second), false);
  });
});
