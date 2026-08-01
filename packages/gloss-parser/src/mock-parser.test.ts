import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertEnglishSentence,
  assertGlossSequence,
  mockEnglishInput,
  mockSignSequence,
} from "@teto/contracts";
import { createMockGlossParser } from "./mock-parser.js";

describe("@teto/gloss-parser mock parser", () => {
  it("maps SignSequence → EnglishSentence", async () => {
    const parser = createMockGlossParser();
    const sentence = await parser.signsToEnglish(mockSignSequence);
    assertEnglishSentence(sentence);
    assert.equal(sentence.sourceSequenceId, mockSignSequence.sequenceId);
  });

  it("maps EnglishInput → GlossSequence", async () => {
    const parser = createMockGlossParser();
    const gloss = await parser.englishToGloss(mockEnglishInput);
    assertGlossSequence(gloss);
    assert.equal(gloss.sourceText, mockEnglishInput.text);
  });
});
