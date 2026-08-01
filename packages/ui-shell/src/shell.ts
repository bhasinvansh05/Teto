import { renderAvatarStage } from "./components/avatar-stage.js";
import { renderCameraStage } from "./components/camera-stage.js";
import { renderGlossTicker } from "./components/gloss-ticker.js";
import { renderModeToggle } from "./components/mode-toggle.js";
import { renderThemeToggle } from "./components/theme-toggle.js";
import { renderTranscriptPanel } from "./components/transcript-panel.js";
import type { ShellViewModel } from "./view-model.js";
import { createShellViewModel, glossText } from "./view-model.js";

export type { ShellViewModel } from "./view-model.js";
export {
  animationDurationMs,
  createShellViewModel,
  glossText,
  signLabels,
} from "./view-model.js";
export type { CreateShellViewModelOptions } from "./view-model.js";
export { THEME_BOOTSTRAP_SCRIPT } from "./theme-script.js";

/**
 * SSR-friendly shell markup — Apple HIG / Liquid Glass composition.
 * First viewport: brand, headline, supporting line, CTA, dominant stage.
 */
export function renderShellMarkup(vm: ShellViewModel): string {
  const { state, presentation, theme } = vm;
  const cameraActive = presentation.stageRole === "camera";
  const avatarActive = presentation.stageRole === "avatar";
  const english = vm.english?.text ?? "";
  const gloss = glossText(vm.gloss);

  return [
    `<main`,
    `  class="teto-shell"`,
    `  data-theme="${theme}"`,
    `  data-color-scheme="${theme}"`,
    `  data-mode="${state.mode}"`,
    `  data-stage-role="${presentation.stageRole}"`,
    `  data-using-mocks="${vm.usingMocks}"`,
    `>`,
    `  <div class="teto-shell__atmosphere" aria-hidden="true"></div>`,
    `  <div class="teto-shell__content">`,
    `    <div class="teto-shell__toolbar">`,
    renderThemeToggle({ theme }),
    `    </div>`,
    `    <header class="teto-hero">`,
    `      <p class="teto-brand">Teto</p>`,
    `      <h1 class="teto-hero__headline teto-mode-crossfade">${escapeHtml(presentation.headline)}</h1>`,
    `      <p class="teto-hero__supporting teto-mode-crossfade">${escapeHtml(presentation.supporting)}</p>`,
    `      <div class="teto-hero__cta">`,
    renderModeToggle({ mode: state.mode }),
    `        <button type="button" class="teto-cta-primary" data-action="primary">`,
    escapeHtml(presentation.ctaPrimary),
    `        </button>`,
    `      </div>`,
    `      <p class="teto-status" role="status">${escapeHtml(state.statusText)}</p>`,
    `    </header>`,
    `    <div class="teto-visual-plane" aria-live="polite">`,
    renderCameraStage({
      signSequence: vm.signSequence,
      active: cameraActive,
    }),
    renderAvatarStage({
      animation: vm.animation,
      active: avatarActive,
    }),
    `    </div>`,
    `    <div class="teto-readout teto-glass">`,
    `      <div class="teto-glass__highlight" aria-hidden="true"></div>`,
    renderTranscriptPanel({ english: vm.english }),
    renderGlossTicker({ gloss: vm.gloss }),
    `    </div>`,
    `    <!-- Legacy hooks for existing fixture assertions -->`,
    `    <section class="teto-english visually-hidden">${escapeHtml(english)}</section>`,
    `    <section class="teto-gloss visually-hidden">${escapeHtml(gloss)}</section>`,
    `    <p class="teto-mode visually-hidden">${escapeHtml(presentation.label)}</p>`,
    `  </div>`,
    `</main>`,
  ].join("\n");
}

/** Convenience: build markup from mocked contracts in one call. */
export function renderMockedShell(
  mode = createShellViewModel().state.mode,
  theme = createShellViewModel().theme,
): string {
  return renderShellMarkup(createShellViewModel({ mode, theme }));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
