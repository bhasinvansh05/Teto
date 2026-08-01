import type {
  EnglishInput,
  GlossEmphasis,
  GlossSequence,
  GlossToken,
  NonManualMarkers,
} from "@teto/contracts";
import { SCHEMA_VERSION } from "@teto/contracts";
import {
  isWhGloss,
  lookupByLemma,
  MULTIWORD_PHRASES,
} from "./lexicon.js";

const DEFAULT_DURATION_MS = 500;
const FINGERSPELL_LETTER_MS = 180;
const SKIP_WORDS = new Set([
  "a",
  "an",
  "the",
  "to",
  "is",
  "are",
  "am",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "of",
  "and",
  "or",
  "but",
]);

const NEUTRAL_NMM: NonManualMarkers = {
  brow: "neutral",
  head: "neutral",
  eyeGaze: "forward",
};

const WH_NMM: NonManualMarkers = {
  brow: "raised",
  head: "tilt-forward",
  eyeGaze: "forward",
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenize English into lexical units, preferring multi-word lexicon phrases.
 */
export function tokenizeEnglish(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const words = normalized.split(" ");
  const tokens: string[] = [];
  let i = 0;

  while (i < words.length) {
    let matched = false;
    for (const phrase of MULTIWORD_PHRASES) {
      const phraseWords = phrase.split(" ");
      if (i + phraseWords.length > words.length) continue;
      const slice = words.slice(i, i + phraseWords.length).join(" ");
      if (slice === phrase) {
        tokens.push(phrase);
        i += phraseWords.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push(words[i]!);
      i += 1;
    }
  }

  return tokens;
}

function makeId(index: number): string {
  return `t${index}`;
}

function fingerspellToken(word: string, index: number): GlossToken {
  const letters = word
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const gloss = letters.length > 0 ? letters.split("").join("-") : word.toUpperCase();
  return {
    id: makeId(index),
    gloss,
    role: "fingerspell",
    fingerspell: true,
    durationMs: Math.max(
      DEFAULT_DURATION_MS,
      (letters.length || 1) * FINGERSPELL_LETTER_MS,
    ),
    emphasis: "normal",
    nmm: { ...NEUTRAL_NMM },
  };
}

function signToken(
  gloss: string,
  index: number,
  options?: { emphasis?: GlossEmphasis; durationMs?: number },
): GlossToken {
  const wh = isWhGloss(gloss);
  return {
    id: makeId(index),
    gloss,
    role: "sign",
    fingerspell: false,
    durationMs: options?.durationMs ?? DEFAULT_DURATION_MS,
    emphasis: options?.emphasis ?? "normal",
    nmm: wh ? { ...WH_NMM } : { ...NEUTRAL_NMM },
  };
}

/**
 * Map English text to an ASL gloss sequence.
 * Known lemmas become sign tokens; unknown content is fingerspelled.
 */
export function englishToGloss(input: EnglishInput): GlossSequence {
  const units = tokenizeEnglish(input.text);
  const tokens: GlossToken[] = [];
  let tokenIndex = 0;

  // Prefer THANK-YOU for the phrase "thank you"
  const joined = units.join(" ");
  if (joined === "thank you" || joined === "thanks") {
    const gloss = joined === "thank you" ? "THANK-YOU" : "THANKS";
    tokens.push(signToken(gloss, tokenIndex++));
    return {
      schemaVersion: SCHEMA_VERSION,
      glossId: `g-${input.inputId}`,
      direction: "en_to_asl",
      sourceText: input.text,
      tokens,
    };
  }

  for (const unit of units) {
    if (SKIP_WORDS.has(unit)) continue;

    // "thank" alone still maps via lexicon; "thank you" already handled as phrase
    const entry = lookupByLemma(unit);
    if (entry) {
      tokens.push(signToken(entry.gloss, tokenIndex++));
      continue;
    }

    // Strip possessive / plural-ish endings for a second lookup
    const stem = unit.replace(/'s$/, "").replace(/s$/, "");
    const stemmed = stem !== unit ? lookupByLemma(stem) : undefined;
    if (stemmed) {
      tokens.push(signToken(stemmed.gloss, tokenIndex++));
      continue;
    }

    tokens.push(fingerspellToken(unit, tokenIndex++));
  }

  // Special case: "Hello, how are you?" → HELLO HOW YOU (skip copula via SKIP_WORDS)
  // Already handled by per-token mapping.

  return {
    schemaVersion: SCHEMA_VERSION,
    glossId: `g-${input.inputId}`,
    direction: "en_to_asl",
    sourceText: input.text,
    tokens,
  };
}
