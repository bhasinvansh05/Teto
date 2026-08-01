export type AppMode = "sign_to_english" | "english_to_sign";

export interface ShellState {
  mode: AppMode;
  statusText: string;
}

export interface ModePresentation {
  mode: AppMode;
  label: string;
  shortLabel: string;
  headline: string;
  supporting: string;
  ctaPrimary: string;
  stageRole: "camera" | "avatar";
}

const MODE_PRESENTATION: Record<AppMode, Omit<ModePresentation, "mode">> = {
  sign_to_english: {
    label: "Sign → English",
    shortLabel: "Sign to English",
    headline: "Speak with your hands.",
    supporting: "Hold a sign to the camera. Teto turns it into clear English.",
    ctaPrimary: "Start signing",
    stageRole: "camera",
  },
  english_to_sign: {
    label: "English → Sign",
    shortLabel: "English to Sign",
    headline: "Watch language take shape.",
    supporting: "Type or speak. Teto signs it back with quiet precision.",
    ctaPrimary: "Start typing",
    stageRole: "avatar",
  },
};

export function createShellState(mode: AppMode = "sign_to_english"): ShellState {
  return {
    mode,
    statusText:
      mode === "sign_to_english"
        ? "Show a sign to the camera"
        : "Type or speak English to sign",
  };
}

export function toggleMode(state: ShellState): ShellState {
  const mode: AppMode =
    state.mode === "sign_to_english" ? "english_to_sign" : "sign_to_english";
  return createShellState(mode);
}

export function setMode(state: ShellState, mode: AppMode): ShellState {
  if (state.mode === mode) return state;
  return createShellState(mode);
}

export function modeLabel(mode: AppMode): string {
  return MODE_PRESENTATION[mode].label;
}

export function getModePresentation(mode: AppMode): ModePresentation {
  return { mode, ...MODE_PRESENTATION[mode] };
}

export function isSignToEnglish(mode: AppMode): boolean {
  return mode === "sign_to_english";
}

export function isEnglishToSign(mode: AppMode): boolean {
  return mode === "english_to_sign";
}
