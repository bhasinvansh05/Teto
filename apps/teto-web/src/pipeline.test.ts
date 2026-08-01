import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertAnimationCommand,
  assertEnglishSentence,
  assertGlossSequence,
} from "@teto/contracts";
import { runMockSignToEnglishPipeline } from "./pipeline.js";

describe("@teto/web mock pipeline", () => {
  it("runs Vision → Classifier → Gloss → Avatar against contracts", async () => {
    const result = await runMockSignToEnglishPipeline();
    assertEnglishSentence(result.english);
    assertGlossSequence(result.gloss);
    assertAnimationCommand(result.animation);
    assert.ok(result.english.text.length > 0);
  });
});
