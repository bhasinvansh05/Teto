/**
 * @teto/gloss-parser — Agent 3 (feature/gloss-parser)
 *
 * Owns both directions:
 *   SignSequence → EnglishSentence
 *   EnglishInput → GlossSequence
 */

export { createMockGlossParser } from "./mock-parser.js";
export {
  RuleBasedGlossParser,
  createRuleBasedGlossParser,
} from "./rule-based-parser.js";
export { signsToEnglish } from "./signs-to-english.js";
export { englishToGloss, tokenizeEnglish } from "./english-to-gloss.js";
export {
  LEXICON,
  lookupByGloss,
  lookupByLemma,
  type LexiconEntry,
  type LexiconCategory,
} from "./lexicon.js";
