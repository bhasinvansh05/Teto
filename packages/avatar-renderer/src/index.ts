/**
 * @teto/avatar-renderer — Agent 4 (feature/avatar-renderer)
 *
 * Owns: 3D/rigged avatar, animation playback, gloss → clip mapping.
 * Consumes: GlossSequence. Outputs: AnimationCommand + playback.
 */

export {
  createClipLibrary,
  defaultClipLibrary,
  FALLBACK_CLIPS,
  type ClipLibrary,
  type ClipLibraryOptions,
  type FallbackClipId,
} from "./clip-library.js";

export {
  glossToAnimationCommand,
  type GlossToCommandOptions,
} from "./gloss-to-command.js";

export {
  AnimationPlaybackEngine,
  type PlaybackEngineSnapshot,
  type PlaybackState,
} from "./playback-engine.js";

export {
  createHeadlessAvatarRenderer,
  createRiggedHandAvatarRenderer,
  type HeadlessAvatarRenderer,
  type HeadlessAvatarRendererOptions,
} from "./headless-renderer.js";

export {
  derivePoseSnapshot,
  type PoseSnapshot,
} from "./pose.js";

export {
  createMockAvatarRenderer,
} from "./mock-renderer.js";
