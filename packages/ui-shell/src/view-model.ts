import {
  mocks,
  type AnimationCommand,
  type EnglishInput,
  type EnglishSentence,
  type GlossSequence,
  type SignSequence,
} from "@teto/contracts";
import {
  createShellState,
  getModePresentation,
  type AppMode,
  type ModePresentation,
  type ShellState,
} from "./mode.js";
import type { AppTheme } from "./theme.js";

/** Presentation-ready shell data. Pipelines stay mocked until CP4. */
export interface ShellViewModel {
  state: ShellState;
  presentation: ModePresentation;
  theme: AppTheme;
  english?: EnglishSentence;
  gloss?: GlossSequence;
  animation?: AnimationCommand;
  englishInput?: EnglishInput;
  signSequence?: SignSequence;
  /** True when payloads come from `@teto/contracts` fixtures. */
  usingMocks: boolean;
}

export interface CreateShellViewModelOptions {
  mode?: AppMode;
  state?: ShellState;
  theme?: AppTheme;
  english?: EnglishSentence;
  gloss?: GlossSequence;
  animation?: AnimationCommand;
  englishInput?: EnglishInput;
  signSequence?: SignSequence;
  /** When true (default), fill missing fields from contract mocks. */
  useMocks?: boolean;
}

export function createShellViewModel(
  options: CreateShellViewModelOptions = {},
): ShellViewModel {
  const useMocks = options.useMocks !== false;
  const state =
    options.state ?? createShellState(options.mode ?? "sign_to_english");

  return {
    state,
    presentation: getModePresentation(state.mode),
    theme: options.theme ?? "light",
    english: options.english ?? (useMocks ? mocks.englishSentence : undefined),
    gloss: options.gloss ?? (useMocks ? mocks.glossSequence : undefined),
    animation:
      options.animation ?? (useMocks ? mocks.animationCommand : undefined),
    englishInput:
      options.englishInput ?? (useMocks ? mocks.englishInput : undefined),
    signSequence:
      options.signSequence ?? (useMocks ? mocks.signSequence : undefined),
    usingMocks: useMocks,
  };
}

/** Compact gloss string for tests and a11y summaries. */
export function glossText(gloss?: GlossSequence): string {
  return gloss?.tokens.map((t) => t.gloss).join(" ") ?? "";
}

/** Total playback duration from animation clip metadata. */
export function animationDurationMs(animation?: AnimationCommand): number {
  if (!animation?.clips.length) return 0;
  return animation.clips.reduce(
    (max, clip) => Math.max(max, clip.startMs + clip.durationMs),
    0,
  );
}

/** Stable sign labels for display-only SignSequence chrome. */
export function signLabels(sequence?: SignSequence): string[] {
  return (sequence?.signs ?? [])
    .filter((s) => s.stable)
    .map((s) => s.label);
}
