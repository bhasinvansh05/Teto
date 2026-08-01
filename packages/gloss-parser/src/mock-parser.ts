import {
  type EnglishInput,
  type EnglishSentence,
  type GlossParser,
  type GlossSequence,
  type SignSequence,
  mockEnglishSentence,
  mockGlossSequence,
  SCHEMA_VERSION,
} from "@teto/contracts";

/** Rule-light mock parser returning canonical fixtures. Replace with real linguistics. */
export function createMockGlossParser(): GlossParser {
  return {
    async signsToEnglish(sequence: SignSequence): Promise<EnglishSentence> {
      const labels = sequence.signs
        .filter((s) => s.stable)
        .map((s) => s.label)
        .join(" ");
      return {
        ...mockEnglishSentence,
        sentenceId: `s-${sequence.sequenceId}`,
        text: labels ? mockEnglishSentence.text : "(no signs detected)",
        sourceSequenceId: sequence.sequenceId,
        confidence:
          sequence.signs.reduce((acc, s) => acc + s.confidence, 0) /
            Math.max(sequence.signs.length, 1) || 0,
      };
    },
    async englishToGloss(input: EnglishInput): Promise<GlossSequence> {
      return {
        ...mockGlossSequence,
        schemaVersion: SCHEMA_VERSION,
        glossId: `g-${input.inputId}`,
        direction: "en_to_asl",
        sourceText: input.text,
      };
    },
  };
}
