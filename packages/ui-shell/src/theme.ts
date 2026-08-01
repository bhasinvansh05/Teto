export type AppTheme = "light" | "dark";

export function toggleTheme(theme: AppTheme): AppTheme {
  return theme === "light" ? "dark" : "light";
}

export function themeLabel(theme: AppTheme): string {
  return theme === "light" ? "Light" : "Dark";
}

export function isLightTheme(theme: AppTheme): boolean {
  return theme === "light";
}

export function isDarkTheme(theme: AppTheme): boolean {
  return theme === "dark";
}

/** Prefer stored theme, else system preference, else light. */
export function resolvePreferredTheme(input?: {
  stored?: string | null;
  prefersDark?: boolean;
}): AppTheme {
  if (input?.stored === "light" || input?.stored === "dark") {
    return input.stored;
  }
  if (input?.prefersDark) return "dark";
  return "light";
}
