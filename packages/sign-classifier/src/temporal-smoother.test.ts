import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TemporalSmoother } from "./temporal-smoother.js";

describe("TemporalSmoother / Debouncer", () => {
  it("does not emit on unstable flicker below threshold", () => {
    const smoother = new TemporalSmoother({
      consecutiveFrames: 5,
      minConfidence: 0.55,
    });

    // Flicker between labels — never reaches 5 consecutive
    const labels = ["HELLO", "YOU", "HELLO", "YOU", "HELLO", "YOU"];
    for (let i = 0; i < labels.length; i++) {
      const out = smoother.push(
        { label: labels[i]!, confidence: 0.9 },
        1000 + i * 33,
      );
      assert.equal(out, null, `unexpected emit at frame ${i}`);
    }
  });

  it("does not emit low-confidence predictions", () => {
    const smoother = new TemporalSmoother({
      consecutiveFrames: 3,
      minConfidence: 0.55,
    });
    for (let i = 0; i < 5; i++) {
      assert.equal(
        smoother.push({ label: "YES", confidence: 0.4 }, 1000 + i),
        null,
      );
    }
  });

  it("emits stable after N consecutive agreeing frames", () => {
    const smoother = new TemporalSmoother({
      consecutiveFrames: 5,
      minConfidence: 0.55,
    });

    let emitted = null;
    for (let i = 0; i < 5; i++) {
      emitted = smoother.push(
        { label: "HELLO", confidence: 0.8 + i * 0.01 },
        2000 + i * 40,
      );
      if (i < 4) assert.equal(emitted, null);
    }

    assert.ok(emitted);
    assert.equal(emitted.label, "HELLO");
    assert.equal(emitted.stable, true);
    assert.ok(emitted.confidence >= 0.55 && emitted.confidence <= 1);
    assert.equal(emitted.startedAtMs, 2000);
    assert.equal(emitted.endedAtMs, 2000 + 4 * 40);
  });

  it("collapses duplicate emissions for the same ongoing label", () => {
    const smoother = new TemporalSmoother({
      consecutiveFrames: 3,
      minConfidence: 0.5,
    });

    const results = [];
    for (let i = 0; i < 8; i++) {
      results.push(
        smoother.push({ label: "THANKS", confidence: 0.9 }, 3000 + i * 30),
      );
    }

    const emitted = results.filter((r) => r !== null);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0]!.label, "THANKS");
    assert.equal(emitted[0]!.stable, true);
  });

  it("emits a new stable sign after label change", () => {
    const smoother = new TemporalSmoother({
      consecutiveFrames: 3,
      minConfidence: 0.5,
    });

    for (let i = 0; i < 3; i++) {
      smoother.push({ label: "HELLO", confidence: 0.9 }, 100 + i);
    }
    // Switch to YOU
    let second = null;
    for (let i = 0; i < 3; i++) {
      second = smoother.push({ label: "YOU", confidence: 0.85 }, 200 + i);
    }
    assert.ok(second);
    assert.equal(second.label, "YOU");
    assert.equal(second.stable, true);
  });

  it("null prediction resets the streak", () => {
    const smoother = new TemporalSmoother({ consecutiveFrames: 3 });
    smoother.push({ label: "NO", confidence: 0.9 }, 1);
    smoother.push({ label: "NO", confidence: 0.9 }, 2);
    smoother.push(null, 3);
    assert.equal(smoother.push({ label: "NO", confidence: 0.9 }, 4), null);
    assert.equal(smoother.push({ label: "NO", confidence: 0.9 }, 5), null);
    const out = smoother.push({ label: "NO", confidence: 0.9 }, 6);
    assert.ok(out);
    assert.equal(out.label, "NO");
  });
});
