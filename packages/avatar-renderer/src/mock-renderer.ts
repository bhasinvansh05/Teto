import {
  type AnimationCommand,
  type AvatarRenderer,
  type GlossSequence,
  SCHEMA_VERSION,
} from "@teto/contracts";

export function glossToAnimationCommand(gloss: GlossSequence): AnimationCommand {
  let cursor = 0;
  const clips = gloss.tokens.map((token) => {
    const startMs = cursor;
    const blend = 80;
    cursor += Math.max(0, token.durationMs - blend);
    return {
      tokenId: token.id,
      clipId: `clip.${token.gloss}`,
      startMs,
      durationMs: token.durationMs,
      blendInMs: blend,
      blendOutMs: blend,
      poseOverrides: {},
      nmm: token.nmm,
    };
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    commandId: `anim-${gloss.glossId}`,
    glossId: gloss.glossId,
    playbackRate: 1,
    clips,
  };
}

/** Headless mock renderer that records play/stop state. Replace with 3D engine. */
export function createMockAvatarRenderer(): AvatarRenderer & {
  getLastCommand(): AnimationCommand | null;
  isPlaying(): boolean;
} {
  let last: AnimationCommand | null = null;
  let playing = false;
  let rate = 1;

  return {
    async load() {
      /* no-op for mock */
    },
    async play(command: AnimationCommand) {
      last = { ...command, playbackRate: rate };
      playing = true;
    },
    stop() {
      playing = false;
    },
    setPlaybackRate(next: number) {
      rate = next;
      if (last) last = { ...last, playbackRate: next };
    },
    getLastCommand() {
      return last;
    },
    isPlaying() {
      return playing;
    },
  };
}
