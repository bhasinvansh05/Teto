export type AppMode = "sign_to_english" | "english_to_sign";

export interface ShellState {
  mode: AppMode;
  statusText: string;
}

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
