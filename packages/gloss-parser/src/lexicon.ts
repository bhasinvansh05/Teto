/**
 * Starter ASL gloss ↔ English lemma lexicon for the rule-based parser.
 * Gloss labels match SignSequence / GlossToken conventions (uppercase, hyphens).
 */

export type LexiconCategory =
  | "greeting"
  | "pronoun"
  | "wh"
  | "verb"
  | "noun"
  | "adjective"
  | "adverb"
  | "particle"
  | "response";

export interface LexiconEntry {
  /** ASL gloss label, e.g. HELLO, THANK-YOU, IX-1 */
  gloss: string;
  /** Preferred English surface form when rendering gloss → English */
  english: string;
  /** Normalized English lemmas / phrases that map to this gloss */
  lemmas: string[];
  category: LexiconCategory;
}

/** Canonical starter set (≥25 entries). */
export const LEXICON: readonly LexiconEntry[] = [
  {
    gloss: "HELLO",
    english: "hello",
    lemmas: ["hello", "hi", "hey"],
    category: "greeting",
  },
  {
    gloss: "HOW",
    english: "how",
    lemmas: ["how"],
    category: "wh",
  },
  {
    gloss: "YOU",
    english: "you",
    lemmas: ["you", "your", "yours"],
    category: "pronoun",
  },
  {
    gloss: "ME",
    english: "me",
    lemmas: ["me", "i", "my", "mine"],
    category: "pronoun",
  },
  {
    gloss: "THANKS",
    english: "thanks",
    lemmas: ["thanks", "thank"],
    category: "greeting",
  },
  {
    gloss: "THANK-YOU",
    english: "thank you",
    lemmas: ["thank you", "thank-you"],
    category: "greeting",
  },
  {
    gloss: "YES",
    english: "yes",
    lemmas: ["yes", "yeah", "yep"],
    category: "response",
  },
  {
    gloss: "NO",
    english: "no",
    lemmas: ["no", "nope", "nah"],
    category: "response",
  },
  {
    gloss: "GOOD",
    english: "good",
    lemmas: ["good", "well", "fine"],
    category: "adjective",
  },
  {
    gloss: "PLEASE",
    english: "please",
    lemmas: ["please"],
    category: "particle",
  },
  {
    gloss: "NAME",
    english: "name",
    lemmas: ["name"],
    category: "noun",
  },
  {
    gloss: "WHAT",
    english: "what",
    lemmas: ["what"],
    category: "wh",
  },
  {
    gloss: "WHERE",
    english: "where",
    lemmas: ["where"],
    category: "wh",
  },
  {
    gloss: "WANT",
    english: "want",
    lemmas: ["want", "wanna", "need"],
    category: "verb",
  },
  {
    gloss: "GO",
    english: "go",
    lemmas: ["go", "going", "goes", "went"],
    category: "verb",
  },
  {
    gloss: "SCHOOL",
    english: "school",
    lemmas: ["school"],
    category: "noun",
  },
  {
    gloss: "WHO",
    english: "who",
    lemmas: ["who"],
    category: "wh",
  },
  {
    gloss: "WHEN",
    english: "when",
    lemmas: ["when"],
    category: "wh",
  },
  {
    gloss: "WHY",
    english: "why",
    lemmas: ["why"],
    category: "wh",
  },
  {
    gloss: "FRIEND",
    english: "friend",
    lemmas: ["friend", "friends"],
    category: "noun",
  },
  {
    gloss: "HELP",
    english: "help",
    lemmas: ["help", "helping"],
    category: "verb",
  },
  {
    gloss: "LOVE",
    english: "love",
    lemmas: ["love", "loves", "loved"],
    category: "verb",
  },
  {
    gloss: "SORRY",
    english: "sorry",
    lemmas: ["sorry", "apologize"],
    category: "greeting",
  },
  {
    gloss: "UNDERSTAND",
    english: "understand",
    lemmas: ["understand", "understood"],
    category: "verb",
  },
  {
    gloss: "LEARN",
    english: "learn",
    lemmas: ["learn", "learning", "learned"],
    category: "verb",
  },
  {
    gloss: "WORK",
    english: "work",
    lemmas: ["work", "working", "job"],
    category: "noun",
  },
  {
    gloss: "HOME",
    english: "home",
    lemmas: ["home", "house"],
    category: "noun",
  },
  {
    gloss: "TODAY",
    english: "today",
    lemmas: ["today"],
    category: "adverb",
  },
  {
    gloss: "TOMORROW",
    english: "tomorrow",
    lemmas: ["tomorrow"],
    category: "adverb",
  },
  {
    gloss: "NICE",
    english: "nice",
    lemmas: ["nice"],
    category: "adjective",
  },
  {
    gloss: "MEET",
    english: "meet",
    lemmas: ["meet", "meeting", "met"],
    category: "verb",
  },
] as const;

const byGloss = new Map<string, LexiconEntry>();
const byLemma = new Map<string, LexiconEntry>();

for (const entry of LEXICON) {
  byGloss.set(entry.gloss, entry);
  for (const lemma of entry.lemmas) {
    byLemma.set(lemma.toLowerCase(), entry);
  }
}

export function lookupByGloss(gloss: string): LexiconEntry | undefined {
  return byGloss.get(gloss.toUpperCase());
}

export function lookupByLemma(lemma: string): LexiconEntry | undefined {
  return byLemma.get(lemma.toLowerCase().trim());
}

/** Multi-word phrases longest-first for English → gloss matching. */
export const MULTIWORD_PHRASES: readonly string[] = [
  ...new Set(
    LEXICON.flatMap((e) => e.lemmas.filter((l) => l.includes(" "))),
  ),
].sort((a, b) => b.length - a.length);

export function isWhGloss(gloss: string): boolean {
  return lookupByGloss(gloss)?.category === "wh";
}

export function isPronounGloss(gloss: string): boolean {
  return lookupByGloss(gloss)?.category === "pronoun";
}
