import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertEnglishSentence,
  assertGlossSequence,
  SCHEMA_VERSION,
  type EnglishInput,
  type SignSequence,
} from "@teto/contracts";
import { englishToGloss } from "./english-to-gloss.js";
import { LEXICON } from "./lexicon.js";
import { createRuleBasedGlossParser } from "./rule-based-parser.js";
import { signsToEnglish } from "./signs-to-english.js";

function signSequence(
  labels: Array<{ label: string; confidence?: number; stable?: boolean }>,
  sequenceId = "seq-test",
): SignSequence {
  const base = 1_710_000_000_000;
  return {
    schemaVersion: SCHEMA_VERSION,
    sequenceId,
    startedAtMs: base,
    endedAtMs: base + labels.length * 800,
    signs: labels.map((s, i) => ({
      label: s.label,
      confidence: s.confidence ?? 0.9,
      startedAtMs: base + i * 800,
      endedAtMs: base + i * 800 + 700,
      stable: s.stable ?? true,
    })),
  };
}

function englishInput(text: string, inputId = "in-test"): EnglishInput {
  return {
    schemaVersion: SCHEMA_VERSION,
    inputId,
    text,
    locale: "en-US",
    origin: "typed",
  };
}

describe("@teto/gloss-parser lexicon", () => {
  it("includes at least 25 starter entries", () => {
    assert.ok(LEXICON.length >= 25);
  });

  it("covers required starter glosses", () => {
    const glosses = new Set(LEXICON.map((e) => e.gloss));
    for (const required of [
      "HELLO",
      "HOW",
      "YOU",
      "ME",
      "THANKS",
      "YES",
      "NO",
      "GOOD",
      "PLEASE",
      "NAME",
      "WHAT",
      "WHERE",
      "WANT",
      "GO",
      "SCHOOL",
    ]) {
      assert.ok(glosses.has(required), `missing ${required}`);
    }
  });
});

describe("@teto/gloss-parser signsToEnglish", () => {
  it('maps HELLO HOW YOU → "Hello, how are you?"', () => {
    const sentence = signsToEnglish(
      signSequence([{ label: "HELLO" }, { label: "HOW" }, { label: "YOU" }]),
    );
    assertEnglishSentence(sentence);
    assert.equal(sentence.text, "Hello, how are you?");
    assert.ok(sentence.confidence > 0);
    assert.equal(sentence.sourceSequenceId, "seq-test");
  });

  it("handles empty sign list", () => {
    const sentence = signsToEnglish(signSequence([]));
    assertEnglishSentence(sentence);
    assert.equal(sentence.text, "(no signs detected)");
    assert.equal(sentence.confidence, 0);
  });

  it("ignores unstable signs", () => {
    const sentence = signsToEnglish(
      signSequence([
        { label: "HELLO", stable: true },
        { label: "HOW", stable: false, confidence: 0.2 },
        { label: "YOU", stable: true },
      ]),
    );
    assertEnglishSentence(sentence);
    assert.match(sentence.text, /hello/i);
    assert.doesNotMatch(sentence.text, /how/i);
  });

  it("renders WH-questions with question mark", () => {
    const sentence = signsToEnglish(
      signSequence([{ label: "WHERE" }, { label: "YOU" }, { label: "GO" }]),
    );
    assertEnglishSentence(sentence);
    assert.equal(sentence.text, "Where are you going?");
  });

  it("aggregates confidence from stable signs", () => {
    const sentence = signsToEnglish(
      signSequence([
        { label: "YES", confidence: 0.8 },
        { label: "GOOD", confidence: 1.0 },
      ]),
    );
    assertEnglishSentence(sentence);
    assert.ok(sentence.confidence > 0.7);
    assert.ok(sentence.confidence <= 1);
  });
});

describe("@teto/gloss-parser englishToGloss", () => {
  it('maps "Thank you" → THANK-YOU / THANKS gloss', () => {
    const gloss = englishToGloss(englishInput("Thank you"));
    assertGlossSequence(gloss);
    assert.equal(gloss.direction, "en_to_asl");
    assert.equal(gloss.tokens.length, 1);
    assert.ok(
      gloss.tokens[0]!.gloss === "THANK-YOU" || gloss.tokens[0]!.gloss === "THANKS",
    );
    assert.equal(gloss.tokens[0]!.role, "sign");
    assert.equal(gloss.tokens[0]!.fingerspell, false);
  });

  it('maps "Hello, how are you?" → HELLO HOW YOU', () => {
    const gloss = englishToGloss(englishInput("Hello, how are you?"));
    assertGlossSequence(gloss);
    assert.deepEqual(
      gloss.tokens.map((t) => t.gloss),
      ["HELLO", "HOW", "YOU"],
    );
    const how = gloss.tokens.find((t) => t.gloss === "HOW");
    assert.ok(how?.nmm);
    assert.equal(how!.nmm!.brow, "raised");
  });

  it("fingerspells unknown words", () => {
    const gloss = englishToGloss(englishInput("xyzzy"));
    assertGlossSequence(gloss);
    assert.equal(gloss.tokens.length, 1);
    const token = gloss.tokens[0]!;
    assert.equal(token.role, "fingerspell");
    assert.equal(token.fingerspell, true);
    assert.equal(token.gloss, "X-Y-Z-Z-Y");
  });

  it("mixes known signs with fingerspell fallback", () => {
    const gloss = englishToGloss(englishInput("I want pizza"));
    assertGlossSequence(gloss);
    const labels = gloss.tokens.map((t) => t.gloss);
    assert.ok(labels.includes("ME") || labels.includes("WANT"));
    const fs = gloss.tokens.find((t) => t.role === "fingerspell");
    assert.ok(fs);
    assert.equal(fs!.gloss, "P-I-Z-Z-A");
  });
});

describe("@teto/gloss-parser RuleBasedGlossParser", () => {
  it("implements GlossParser and validates outputs", async () => {
    const parser = createRuleBasedGlossParser();
    const sentence = await parser.signsToEnglish(
      signSequence([{ label: "HELLO" }, { label: "HOW" }, { label: "YOU" }], "seq-000042"),
    );
    assertEnglishSentence(sentence);
    assert.equal(sentence.text, "Hello, how are you?");

    const gloss = await parser.englishToGloss(
      englishInput("Thank you", "in-000011"),
    );
    assertGlossSequence(gloss);
    assert.equal(gloss.sourceText, "Thank you");
  });
});
