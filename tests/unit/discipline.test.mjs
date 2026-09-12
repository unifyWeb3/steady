import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COOLDOWN_MS,
  deriveDiscipline,
  normalizeCallsChronologically,
} from "../../lib/steady/discipline.js";

describe("discipline", () => {
  it("blocks after two trailing losses even before five settled calls", () => {
    const d = deriveDiscipline([
      { id: "win", won: true },
      { id: "loss-1", won: false },
      { id: "loss-2", won: false },
    ], 1_000_000);
    assert.equal(d.blocked, true);
    assert.equal(d.consecutiveLosses, 2);
    assert.equal(d.cooldownUntilMs, 1_000_000 + COOLDOWN_MS);
  });

  it("normalizes newest-first outcomes before deriving the trailing streak", () => {
    const newestFirst = [
      { id: "loss-2", timestamp: "30", won: false },
      { id: "loss-1", timestamp: "20", won: false },
      { id: "win", timestamp: "10", won: true },
    ];
    assert.deepEqual(normalizeCallsChronologically(newestFirst).map((call) => call.id), ["win", "loss-1", "loss-2"]);
    assert.equal(deriveDiscipline(newestFirst, 1_000_000).consecutiveLosses, 2);
  });

  it("does not block after a trailing win", () => {
    const d = deriveDiscipline([
      { id: "loss-1", won: false },
      { id: "loss-2", won: false },
      { id: "win", won: true },
    ], 1_000_000);
    assert.equal(d.blocked, false);
    assert.equal(d.consecutiveLosses, 0);
  });

  it("ignores void outcomes without breaking the loss streak", () => {
    const d = deriveDiscipline([
      { id: "win", won: true },
      { id: "loss-1", won: false },
      { id: "void", won: false, void: true },
      { id: "loss-2", won: false },
    ], 1_000_000);
    assert.equal(d.blocked, true);
    assert.equal(d.consecutiveLosses, 2);
  });

  it("keeps the same active cooldown and its streak key", () => {
    const d = deriveDiscipline([
      { id: "loss-1", won: false },
      { id: "loss-2", won: false },
    ], 1_000_000, 1_100_000, "id:loss-1");
    assert.equal(d.blocked, true);
    assert.equal(d.cooldownUntilMs, 1_100_000);
    assert.equal(d.cooldownKey, "id:loss-1");
  });

  it("does not re-block an unchanged streak after its cooldown expires", () => {
    const calls = [
      { id: "loss-1", won: false },
      { id: "loss-2", won: false },
    ];
    const first = deriveDiscipline(calls, 1_000_000);
    const afterExpiry = deriveDiscipline(calls, first.cooldownUntilMs + 1, first.cooldownUntilMs, first.cooldownKey);
    assert.equal(first.blocked, true);
    assert.equal(afterExpiry.blocked, false);
    assert.equal(afterExpiry.cooldownUntilMs, null);
    assert.equal(afterExpiry.cooldownKey, first.cooldownKey);
  });

  it("starts one new cooldown only after a new loss streak", () => {
    const oldCalls = [
      { id: "old-loss-1", won: false },
      { id: "old-loss-2", won: false },
    ];
    const first = deriveDiscipline(oldCalls, 1_000_000);
    const newCalls = [
      ...oldCalls,
      { id: "reset-win", won: true },
      { id: "new-loss-1", won: false },
      { id: "new-loss-2", won: false },
    ];
    const second = deriveDiscipline(newCalls, first.cooldownUntilMs + 1, first.cooldownUntilMs, first.cooldownKey);
    assert.equal(second.blocked, true);
    assert.equal(second.cooldownKey, "id:new-loss-1");
    assert.equal(second.cooldownUntilMs, first.cooldownUntilMs + 1 + COOLDOWN_MS);
  });
});
