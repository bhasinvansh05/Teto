import type { EnglishSentence } from "@teto/contracts";

export interface TranscriptPanelProps {
  english?: EnglishSentence;
  emptyHint?: string;
}

/** English transcript surface for Sign→English (and review in reverse). */
export function renderTranscriptPanel(props: TranscriptPanelProps): string {
  const text = props.english?.text?.trim() ?? "";
  const hasText = text.length > 0;
  const confidence =
    typeof props.english?.confidence === "number"
      ? Math.round(props.english.confidence * 100)
      : null;
  const hint = props.emptyHint ?? "English will appear here";

  return [
    `<section`,
    `  class="teto-transcript"`,
    `  aria-live="polite"`,
    `  data-has-text="${hasText}"`,
    `  ${props.english ? `data-sentence-id="${escapeAttr(props.english.sentenceId)}"` : ""}`,
    `>`,
    `  <h2 class="teto-transcript__label">English</h2>`,
    hasText
      ? `<p class="teto-transcript__text">${escapeHtml(text)}</p>`
      : `<p class="teto-transcript__empty">${escapeHtml(hint)}</p>`,
    confidence !== null
      ? `<p class="teto-transcript__meta">Confidence ${confidence}%</p>`
      : "",
    `</section>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
