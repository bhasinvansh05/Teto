import {
  type AnimationCommand,
  type AvatarRenderer,
} from "@teto/contracts";

export { glossToAnimationCommand } from "./gloss-to-command.js";

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
