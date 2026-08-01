import type {
  EnglishInput,
  EnglishSentence,
  GlossParser,
  GlossSequence,
  SignSequence,
} from "@teto/contracts";
import { assertEnglishSentence, assertGlossSequence } from "@teto/contracts";
import { englishToGloss } from "./english-to-gloss.js";
import { signsToEnglish } from "./signs-to-english.js";

/**
 * Rule-based GlossParser: lexicon + phrase templates + fingerspell fallback.
 * Validates outputs against contract assert helpers.
 */
export class RuleBasedGlossParser implements GlossParser {
  async signsToEnglish(sequence: SignSequence): Promise<EnglishSentence> {
    const sentence = signsToEnglish(sequence);
    assertEnglishSentence(sentence);
    return sentence;
  }

  async englishToGloss(input: EnglishInput): Promise<GlossSequence> {
    const gloss = englishToGloss(input);
    assertGlossSequence(gloss);
    return gloss;
  }
}

export function createRuleBasedGlossParser(): GlossParser {
  return new RuleBasedGlossParser();
}
