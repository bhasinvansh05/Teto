import type { EnglishSentence, GlossSequence } from "@teto/contracts";
import type { ShellState } from "./mode.js";

export interface ShellViewModel {
  state: ShellState;
  english?: EnglishSentence;
  gloss?: GlossSequence;
}

/** SSR-friendly markup stub. Agent 5 replaces with full React/HIG UI. */
export function renderShellMarkup(vm: ShellViewModel): string {
  const modeLabel =
    vm.state.mode === "sign_to_english" ? "Sign → English" : "English → Sign";
  const english = vm.english?.text ?? "";
  const gloss = vm.gloss?.tokens.map((t) => t.gloss).join(" ") ?? "";

  return [
    `<main class="teto-shell" data-mode="${vm.state.mode}">`,
    `  <header class="teto-brand"><h1>Teto</h1></header>`,
    `  <p class="teto-mode">${modeLabel}</p>`,
    `  <p class="teto-status">${vm.state.statusText}</p>`,
    `  <section class="teto-english">${english}</section>`,
    `  <section class="teto-gloss">${gloss}</section>`,
    `</main>`,
  ].join("\n");
}
