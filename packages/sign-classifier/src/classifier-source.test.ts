import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertSignSequence } from "@teto/contracts";
import { createSignClassifierSource } from "./classifier-source.js";
import type { SignModel } from "./types.js";
import { makeFrame, syntheticPoses } from "./test-fixtures.js";

/** Deterministic model for pipeline tests. */
function fixedModel(label: string, confidence = 0.9): SignModel {
  return {
    predict() {
      return { label, confidence };
    },
  };
}

describe("SignClassifierSource", () => {
  it("end-to-end: ingest frames → stable SignSequence", () => {
    const source = createSignClassifierSource({
      model: fixedModel("HELLO", 0.91),
      consecutiveFrames: 5,
      minConfidence: 0.55,
    });

    const received: unknown[] = [];
    source.subscribe((seq) => received.push(seq));

    // Below threshold — no emit
    for (let i = 0; i < 4; i++) {
      source.ingest(
        makeFrame(syntheticPoses.hello(), {
          timestampMs: 1_000_000 + i * 33,
          frameId: `f-${i}`,
        }),
      );
    }
    assert.equal(received.length, 0);
    assert.equal(source.flush(), null);

    // Recreate source — flush cleared nothing useful; use fresh for clean e2e
    const source2 = createSignClassifierSource({
      model: fixedModel("HELLO", 0.91),
      consecutiveFrames: 5,
      minConfidence: 0.55,
    });
    const received2: unknown[] = [];
    source2.subscribe((seq) => received2.push(seq));

    for (let i = 0; i < 5; i++) {
      source2.ingest(
        makeFrame(syntheticPoses.hello(), {
          timestampMs: 2_000_000 + i * 33,
          frameId: `f2-${i}`,
        }),
      );
    }

    assert.equal(received2.length, 1);
    assertSignSequence(received2[0]);
    const seq = received2[0] as {
      signs: { label: string; stable: boolean; confidence: number }[];
    };
    assert.equal(seq.signs.length, 1);
    assert.equal(seq.signs[0]!.label, "HELLO");
    assert.equal(seq.signs[0]!.stable, true);

    const flushed = source2.flush();
    assert.ok(flushed);
    assertSignSequence(flushed);
    assert.equal(flushed.signs[0]!.label, "HELLO");
  });

  it("accumulates multiple stable signs then validates sequence", () => {
    let current = "HOW";
    const model: SignModel = {
      predict() {
        return { label: current, confidence: 0.88 };
      },
    };
    const source = createSignClassifierSource({
      model,
      consecutiveFrames: 3,
      minConfidence: 0.5,
    });

    const sequences: unknown[] = [];
    source.subscribe((s) => sequences.push(s));

    for (let i = 0; i < 3; i++) {
      source.ingest(
        makeFrame(syntheticPoses.hello(), { timestampMs: 100 + i }),
      );
    }
    current = "YOU";
    for (let i = 0; i < 3; i++) {
      source.ingest(
        makeFrame(syntheticPoses.you(), { timestampMs: 200 + i }),
      );
    }

    assert.equal(sequences.length, 2);
    const last = sequences[1]!;
    assertSignSequence(last);
    const signs = (last as { signs: { label: string }[] }).signs;
    assert.deepEqual(
      signs.map((s) => s.label),
      ["HOW", "YOU"],
    );
  });

  it("works with HeuristicSignModel on synthetic HELLO frames", () => {
    const source = createSignClassifierSource({
      consecutiveFrames: 3,
      minConfidence: 0.5,
    });
    let got: unknown;
    source.subscribe((s) => {
      got = s;
    });

    for (let i = 0; i < 3; i++) {
      source.ingest(
        makeFrame(syntheticPoses.hello(), {
          timestampMs: 5000 + i * 40,
          frameId: `h-${i}`,
        }),
      );
    }

    assert.ok(got, "expected sequence from heuristic pipeline");
    assertSignSequence(got);
    const seq = got as { signs: { label: string; stable: boolean }[] };
    assert.ok(seq.signs.length >= 1);
    assert.equal(seq.signs[0]!.stable, true);
    assert.equal(seq.signs[0]!.label, "HELLO");
  });
});
