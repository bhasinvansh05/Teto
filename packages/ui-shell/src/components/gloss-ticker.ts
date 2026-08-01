import type { GlossSequence, GlossToken } from "@teto/contracts";

export interface GlossTickerProps {
  gloss?: GlossSequence;
  emptyHint?: string;
}

/** Horizontal gloss token ticker from GlossSequence. */
export function renderGlossTicker(props: GlossTickerProps): string {
  const tokens = props.gloss?.tokens ?? [];
  const hint = props.emptyHint ?? "Gloss tokens will stream here";

  const tokenMarkup =
    tokens.length > 0
      ? tokens.map((token, index) => renderToken(token, index)).join("\n")
      : `<span class="teto-gloss-ticker__empty">${escapeHtml(hint)}</span>`;

  return [
    `<section`,
    `  class="teto-gloss-ticker"`,
    `  aria-label="ASL gloss sequence"`,
    `  data-token-count="${tokens.length}"`,
    `  ${props.gloss ? `data-gloss-id="${escapeAttr(props.gloss.glossId)}"` : ""}`,
    `>`,
    `  <h2 class="teto-gloss-ticker__label">Gloss</h2>`,
    `  <div class="teto-gloss-ticker__rail" role="list">`,
    tokenMarkup,
    `  </div>`,
    `</section>`,
  ].join("\n");
}

function renderToken(token: GlossToken, index: number): string {
  const delayMs = index * 70;
  return [
    `<span`,
    `  class="teto-gloss-token teto-gloss-token--${escapeAttr(token.role)} teto-gloss-token--${escapeAttr(token.emphasis)}"`,
    `  role="listitem"`,
    `  data-token-id="${escapeAttr(token.id)}"`,
    `  data-fingerspell="${token.fingerspell}"`,
    `  style="--token-delay: ${delayMs}ms"`,
    `>${escapeHtml(token.gloss)}</span>`,
  ].join("\n");
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
