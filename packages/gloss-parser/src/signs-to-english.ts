import type { DetectedSign, EnglishSentence, SignSequence } from "@teto/contracts";
import { SCHEMA_VERSION } from "@teto/contracts";
import { isPronounGloss, isWhGloss, lookupByGloss } from "./lexicon.js";

const FUNCTION_WORDS = new Set(["are", "is", "am", "a", "an", "the", "to", "do", "does"]);

function glossToEnglishWord(label: string): string {
  const entry = lookupByGloss(label);
  if (entry) return entry.english;
  // IX-1 style pronouns / unknown glosses: humanize hyphens
  return label
    .toLowerCase()
    .split("-")
    .map((part) => part)
    .join(" ");
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function averageConfidence(signs: DetectedSign[]): number {
  if (signs.length === 0) return 0;
  const sum = signs.reduce((acc, s) => acc + s.confidence, 0);
  return Math.min(1, Math.max(0, sum / signs.length));
}

/**
 * Known ASL → English phrase templates (gloss label sequences).
 * Matched left-to-right; first match wins for a span.
 */
const PHRASE_TEMPLATES: ReadonlyArray<{ pattern: string[]; english: string }> = [
  { pattern: ["HELLO", "HOW", "YOU"], english: "Hello, how are you" },
  { pattern: ["HOW", "YOU"], english: "How are you" },
  { pattern: ["WHAT", "YOU", "NAME"], english: "What is your name" },
  { pattern: ["YOU", "NAME", "WHAT"], english: "What is your name" },
  { pattern: ["NICE", "MEET", "YOU"], english: "Nice to meet you" },
  { pattern: ["THANK-YOU"], english: "Thank you" },
  { pattern: ["THANKS", "YOU"], english: "Thank you" },
  { pattern: ["WHERE", "YOU", "GO"], english: "Where are you going" },
  { pattern: ["YOU", "WANT", "GO", "SCHOOL"], english: "Do you want to go to school" },
  { pattern: ["ME", "WANT", "GO", "SCHOOL"], english: "I want to go to school" },
  { pattern: ["ME", "WANT"], english: "I want" },
  { pattern: ["YOU", "WANT"], english: "You want" },
];

function matchTemplate(
  labels: string[],
  start: number,
): { english: string; length: number } | null {
  for (const template of PHRASE_TEMPLATES) {
    const { pattern, english } = template;
    if (start + pattern.length > labels.length) continue;
    let ok = true;
    for (let i = 0; i < pattern.length; i++) {
      if (labels[start + i] !== pattern[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return { english, length: pattern.length };
  }
  return null;
}

/**
 * Build a grammatical English sentence from stable sign labels using
 * phrase templates plus simple pronoun / WH-question rules.
 */
export function signsToEnglish(sequence: SignSequence): EnglishSentence {
  const stable = sequence.signs.filter((s) => s.stable);
  const labels = stable.map((s) => s.label.toUpperCase());

  if (labels.length === 0) {
    return {
      schemaVersion: SCHEMA_VERSION,
      sentenceId: `s-${sequence.sequenceId}`,
      text: "(no signs detected)",
      confidence: 0,
      sourceSequenceId: sequence.sequenceId,
    };
  }

  const parts: string[] = [];
  let i = 0;
  let hasWh = false;

  while (i < labels.length) {
    const template = matchTemplate(labels, i);
    if (template) {
      parts.push(template.english);
      if (template.english.toLowerCase().includes("how") ||
          template.english.toLowerCase().includes("what") ||
          template.english.toLowerCase().includes("where") ||
          template.english.toLowerCase().includes("who") ||
          template.english.toLowerCase().includes("when") ||
          template.english.toLowerCase().includes("why") ||
          template.english.trimStart().toLowerCase().startsWith("do ")) {
        hasWh = true;
      }
      i += template.length;
      continue;
    }

    const label = labels[i]!;
    if (isWhGloss(label)) hasWh = true;

    // Pronoun subject preference: ME → I at clause start / after greeting
    let word = glossToEnglishWord(label);
    if (label === "ME" && (parts.length === 0 || endsWithClauseBoundary(parts))) {
      word = "I";
    } else if (label === "YOU" && looksLikePossessiveContext(labels, i)) {
      word = "your";
    }

    // Skip inserting bare function words the lexicon might not have;
    // insert light copula for WH + pronoun patterns not covered by templates
    if (
      isWhGloss(label) &&
      i + 1 < labels.length &&
      isPronounGloss(labels[i + 1]!) &&
      !matchTemplate(labels, i)
    ) {
      const next = labels[i + 1]!;
      const nextWord =
        next === "YOU" && labels[i + 2] === "NAME"
          ? "your"
          : glossToEnglishWord(next);
      if (labels[i + 2] === "NAME") {
        parts.push(`${capitalize(word)} is ${nextWord} name`);
        hasWh = true;
        i += 3;
        continue;
      }
      parts.push(`${capitalize(word)} are ${nextWord}`);
      hasWh = true;
      i += 2;
      continue;
    }

    parts.push(word);
    i += 1;
  }

  let text = joinEnglishParts(parts);
  text = capitalize(text);

  const question =
    hasWh ||
    labels.some((l) => isWhGloss(l)) ||
    /^(how|what|where|who|when|why|do )\b/i.test(text);

  if (question && !/[?!.]$/.test(text)) {
    text = `${text}?`;
  } else if (!/[?!.]$/.test(text)) {
    text = `${text}.`;
  }

  // Confidence: mean of stable signs; slight boost when all mapped in lexicon
  const mappedRatio =
    labels.filter((l) => lookupByGloss(l) !== undefined).length / labels.length;
  const confidence = Math.min(
    1,
    averageConfidence(stable) * (0.85 + 0.15 * mappedRatio),
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    sentenceId: `s-${sequence.sequenceId}`,
    text,
    confidence,
    sourceSequenceId: sequence.sequenceId,
  };
}

function endsWithClauseBoundary(parts: string[]): boolean {
  if (parts.length === 0) return true;
  const last = parts[parts.length - 1]!;
  return /[,;.!?]$/.test(last) || /^(hello|hi|hey)$/i.test(last);
}

function looksLikePossessiveContext(labels: string[], index: number): boolean {
  const next = labels[index + 1];
  return next === "NAME" || next === "FRIEND" || next === "HOME" || next === "SCHOOL";
}

function joinEnglishParts(parts: string[]): string {
  if (parts.length === 0) return "";
  // Parts from templates may already be full phrases; join with spaces and
  // collapse duplicate whitespace / stray "are are"
  let text = parts.join(" ").replace(/\s+/g, " ").trim();

  // Drop accidental repeated function words
  const tokens = text.split(" ");
  const cleaned: string[] = [];
  for (const tok of tokens) {
    const prev = cleaned[cleaned.length - 1];
    if (
      prev &&
      FUNCTION_WORDS.has(prev.toLowerCase()) &&
      FUNCTION_WORDS.has(tok.toLowerCase()) &&
      prev.toLowerCase() === tok.toLowerCase()
    ) {
      continue;
    }
    cleaned.push(tok);
  }
  return cleaned.join(" ");
}
