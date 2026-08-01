import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertAnimationCommand,
  assertEnglishSentence,
  assertGlossSequence,
  assertSignSequence,
} from "@teto/contracts";
import {
  runIntegratedPipeline,
  runMockSignToEnglishPipeline,
} from "./pipeline.js";

describe("@teto/web mock pipeline", () => {
  it("runs Vision → Classifier → Gloss → Avatar against contracts", async () => {
    const result = await runMockSignToEnglishPipeline();
    assertEnglishSentence(result.english);
    assertGlossSequence(result.gloss);
    assertAnimationCommand(result.animation);
    assert.ok(result.english.text.length > 0);
  });
});

describe("@teto/web CP5 integrated pipeline", () => {
  it("wires real Agent packages end-to-end", async () => {
    const result = await runIntegratedPipeline();
    assert.ok(result.sequence);
    assertSignSequence(result.sequence);
    assert.ok(result.sequence.signs.some((s) => s.stable));
    assertEnglishSentence(result.english);
    assertGlossSequence(result.gloss);
    assertAnimationCommand(result.animation);
    assert.ok(result.shellHtml?.includes("Teto"));
    assert.ok(result.animation.clips.length > 0);
  });
});
