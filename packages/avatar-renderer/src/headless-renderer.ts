import type { AnimationCommand, AvatarRenderer } from "@teto/contracts";
import { assertAnimationCommand } from "@teto/contracts";
import { AnimationPlaybackEngine } from "./playback-engine.js";
import { derivePoseSnapshot, type PoseSnapshot } from "./pose.js";

export interface HeadlessAvatarRenderer
  extends AvatarRenderer {
  /** Advance playhead (ms of wall clock). For tests / headless loops. */
  tick(deltaMs: number): void;
  getCurrentTimeMs(): number;
  isPlaying(): boolean;
  getLastCommand(): AnimationCommand | null;
  getPoseSnapshot(): PoseSnapshot;
  getEngine(): AnimationPlaybackEngine;
}

export interface HeadlessAvatarRendererOptions {
  /** Optional initial playback rate applied after load. */
  playbackRate?: number;
}

/**
 * Contract-compliant AvatarRenderer that drives a headless playback engine.
 * Suitable for tests and UI debug without WebGL.
 */
export function createHeadlessAvatarRenderer(
  options: HeadlessAvatarRendererOptions = {},
): HeadlessAvatarRenderer {
  const engine = new AnimationPlaybackEngine();
  let loaded = false;
  let lastCommand: AnimationCommand | null = null;

  if (options.playbackRate !== undefined) {
    engine.setPlaybackRate(options.playbackRate);
  }

  return {
    async load() {
      loaded = true;
    },

    async play(command: AnimationCommand) {
      if (!loaded) {
        throw new Error("HeadlessAvatarRenderer.load() must be called before play()");
      }
      assertAnimationCommand(command);
      // Apply the renderer's current rate (mirrors mock renderer behavior).
      const withRate: AnimationCommand = {
        ...command,
        playbackRate: engine.getPlaybackRate(),
      };
      assertAnimationCommand(withRate);
      lastCommand = withRate;
      engine.play(withRate);
    },

    stop() {
      engine.stop();
    },

    setPlaybackRate(rate: number) {
      engine.setPlaybackRate(rate);
      if (lastCommand) {
        lastCommand = { ...lastCommand, playbackRate: rate };
      }
    },

    tick(deltaMs: number) {
      engine.tick(deltaMs);
    },

    getCurrentTimeMs() {
      return engine.getCurrentTimeMs();
    },

    isPlaying() {
      return engine.isPlaying();
    },

    getLastCommand() {
      return lastCommand;
    },

    getPoseSnapshot() {
      return derivePoseSnapshot(
        engine.getCurrentTimeMs(),
        engine.getActiveClip(),
      );
    },

    getEngine() {
      return engine;
    },
  };
}

/** Alias matching the architecture naming for a future rigged-hand path. */
export const createRiggedHandAvatarRenderer = createHeadlessAvatarRenderer;
