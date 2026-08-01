/**
 * @teto/ui-shell — Agent 5 (feature/ui-shell)
 *
 * Owns: mode toggle, layout, Apple HIG-aligned styling, responsive shell.
 * Builds against mocked contract data until integration checkpoints.
 *
 * Stub owned by Orchestrator. Implement on feature/ui-shell.
 */

export type { AppMode, ShellState } from "./mode.js";
export { createShellState, toggleMode } from "./mode.js";
export { renderShellMarkup } from "./shell.js";
