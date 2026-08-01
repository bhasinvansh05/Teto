import type { AppMode } from "../mode.js";
import { modeLabel } from "../mode.js";

export interface ModeToggleProps {
  mode: AppMode;
  /** Optional id prefix for SSR/DOM uniqueness. */
  idPrefix?: string;
}

/** Segmented control: Sign→English vs English→Sign. */
export function renderModeToggle(props: ModeToggleProps): string {
  const prefix = props.idPrefix ?? "teto";
  const modes: AppMode[] = ["sign_to_english", "english_to_sign"];

  const buttons = modes
    .map((mode) => {
      const selected = mode === props.mode;
      return [
        `<button`,
        `  type="button"`,
        `  class="teto-mode-toggle__btn${selected ? " is-selected" : ""}"`,
        `  role="radio"`,
        `  aria-checked="${selected}"`,
        `  data-mode="${mode}"`,
        `  id="${prefix}-mode-${mode}"`,
        `>${escapeHtml(modeLabel(mode))}</button>`,
      ].join("\n");
    })
    .join("\n");

  return [
    `<div`,
    `  class="teto-mode-toggle"`,
    `  role="radiogroup"`,
    `  aria-label="Translation direction"`,
    `  data-active-mode="${props.mode}"`,
    `>`,
    `  <div class="teto-mode-toggle__track" aria-hidden="true">`,
    `    <span class="teto-mode-toggle__glow"></span>`,
    `  </div>`,
    buttons,
    `</div>`,
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
