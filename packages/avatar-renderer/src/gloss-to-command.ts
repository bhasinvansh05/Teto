import {
  type AnimationClipCommand,
  type AnimationCommand,
  type GlossSequence,
  type GlossToken,
  SCHEMA_VERSION,
  assertAnimationCommand,
} from "@teto/contracts";
import {
  type ClipLibrary,
  defaultClipLibrary,
} from "./clip-library.js";

const DEFAULT_BLEND_MS = 80;

export interface GlossToCommandOptions {
  clipLibrary?: ClipLibrary;
  /** Default crossfade window in ms (clamped per-token by duration). */
  defaultBlendMs?: number;
  playbackRate?: number;
}

/**
 * Map a GlossSequence to a validated AnimationCommand.
 *
 * Timeline rules:
 * - Each clip uses the token's durationMs.
 * - Adjacent clips overlap by blendOut of the previous / blendIn of the next
 *   so ordering stays monotonic (startMs non-decreasing) without breaking
 *   playback order.
 * - NMM is passed through from each token when present.
 */
export function glossToAnimationCommand(
  gloss: GlossSequence,
  options: GlossToCommandOptions = {},
): AnimationCommand {
  const library = options.clipLibrary ?? defaultClipLibrary;
  const defaultBlend = options.defaultBlendMs ?? DEFAULT_BLEND_MS;
  const playbackRate = options.playbackRate ?? 1;

  let cursor = 0;
  const clips: AnimationClipCommand[] = gloss.tokens.map((token) => {
    const durationMs = Math.max(0, token.durationMs);
    const blend = resolveBlendMs(token, durationMs, defaultBlend);
    const startMs = cursor;

    const clip: AnimationClipCommand = {
      tokenId: token.id,
      clipId: library.resolveToken(token),
      startMs,
      durationMs,
      blendInMs: blend,
      blendOutMs: blend,
      poseOverrides: {},
    };
    if (token.nmm) {
      clip.nmm = { ...token.nmm };
    }

    // Advance cursor so the next clip starts at previous end minus blendOut.
    // Guarantees startMs is monotonic and clips may crossfade but never reverse.
    cursor += Math.max(0, durationMs - blend);
    return clip;
  });

  const command: AnimationCommand = {
    schemaVersion: SCHEMA_VERSION,
    commandId: `anim-${gloss.glossId}`,
    glossId: gloss.glossId,
    playbackRate,
    clips,
  };

  assertAnimationCommand(command);
  return command;
}

/**
 * Blend must fit inside the clip so startMs stays ordered:
 * nextStart = start + duration - blendOut >= start  ⇒  blendOut <= duration.
 * Cap at half duration so both blendIn and blendOut remain meaningful.
 */
function resolveBlendMs(
  token: GlossToken,
  durationMs: number,
  defaultBlendMs: number,
): number {
  if (durationMs <= 0) return 0;
  let blend = defaultBlendMs;
  if (token.emphasis === "stressed") {
    blend = Math.round(defaultBlendMs * 1.25);
  } else if (token.emphasis === "reduced") {
    blend = Math.round(defaultBlendMs * 0.75);
  }
  // Holds / pauses: soft hold, smaller crossfade into the next sign.
  if (token.role === "hold" || token.role === "pause") {
    blend = Math.min(blend, Math.round(defaultBlendMs * 0.5));
  }
  const maxBlend = Math.floor(durationMs / 2);
  return Math.max(0, Math.min(blend, maxBlend));
}
