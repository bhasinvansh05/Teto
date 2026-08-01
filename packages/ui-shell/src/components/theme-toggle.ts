import type { AppTheme } from "../theme.js";
import { themeLabel } from "../theme.js";

export interface ThemeToggleProps {
  theme: AppTheme;
  idPrefix?: string;
}

/** Segmented Light / Dark appearance control. */
export function renderThemeToggle(props: ThemeToggleProps): string {
  const prefix = props.idPrefix ?? "teto";
  const themes: AppTheme[] = ["light", "dark"];

  const buttons = themes
    .map((theme) => {
      const selected = theme === props.theme;
      return [
        `<button`,
        `  type="button"`,
        `  class="teto-theme-toggle__btn${selected ? " is-selected" : ""}"`,
        `  role="radio"`,
        `  aria-checked="${selected}"`,
        `  data-theme="${theme}"`,
        `  data-action="set-theme"`,
        `  id="${prefix}-theme-${theme}"`,
        `>${escapeHtml(themeLabel(theme))}</button>`,
      ].join("\n");
    })
    .join("\n");

  return [
    `<div`,
    `  class="teto-theme-toggle"`,
    `  role="radiogroup"`,
    `  aria-label="Appearance"`,
    `  data-active-theme="${props.theme}"`,
    `>`,
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
