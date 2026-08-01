/**
 * @teto/ui-shell — Agent 5 (feature/ui-shell)
 *
 * Owns: mode toggle, theme toggle, layout, Apple HIG styling, responsive shell.
 * Builds against mocked contract data until integration checkpoint CP4.
 */

export type { AppMode, ModePresentation, ShellState } from "./mode.js";
export {
  createShellState,
  getModePresentation,
  isEnglishToSign,
  isSignToEnglish,
  modeLabel,
  setMode,
  toggleMode,
} from "./mode.js";

export type { AppTheme } from "./theme.js";
export {
  isDarkTheme,
  isLightTheme,
  resolvePreferredTheme,
  themeLabel,
  toggleTheme,
} from "./theme.js";

export type { CreateShellViewModelOptions, ShellViewModel } from "./view-model.js";
export {
  animationDurationMs,
  createShellViewModel,
  glossText,
  signLabels,
} from "./view-model.js";

export {
  renderMockedShell,
  renderShellMarkup,
  THEME_BOOTSTRAP_SCRIPT,
} from "./shell.js";

export {
  renderAvatarStage,
  renderCameraStage,
  renderGlossTicker,
  renderModeToggle,
  renderThemeToggle,
  renderTranscriptPanel,
} from "./components/index.js";

export type {
  AvatarStageProps,
  CameraStageProps,
  GlossTickerProps,
  ModeToggleProps,
  ThemeToggleProps,
  TranscriptPanelProps,
} from "./components/index.js";
