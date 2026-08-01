import type { AnimationClipCommand, AnimationCommand } from "@teto/contracts";
import { assertAnimationCommand } from "@teto/contracts";

export type PlaybackState = "idle" | "playing" | "stopped";

export interface PlaybackEngineSnapshot {
  state: PlaybackState;
  currentTimeMs: number;
  playbackRate: number;
  commandId: string | null;
  activeClip: AnimationClipCommand | null;
  /** Clips whose [start, start+duration) window contains currentTimeMs. */
  overlappingClips: AnimationClipCommand[];
}

/**
 * Headless animation playback scheduler.
 * Advances time via `tick(deltaMs)` — no WebGL / rAF required for tests.
 */
export class AnimationPlaybackEngine {
  private command: AnimationCommand | null = null;
  private state: PlaybackState = "idle";
  private currentTimeMs = 0;
  private playbackRate = 1;
  private endMs = 0;

  play(command: AnimationCommand): void {
    assertAnimationCommand(command);
    this.command = command;
    this.playbackRate = command.playbackRate;
    this.currentTimeMs = 0;
    this.endMs = computeEndMs(command);
    this.state = "playing";
  }

  stop(): void {
    this.state = "stopped";
    this.currentTimeMs = 0;
  }

  setPlaybackRate(rate: number): void {
    if (!(rate > 0) || !Number.isFinite(rate)) {
      throw new RangeError(`playbackRate must be a positive finite number, got ${rate}`);
    }
    this.playbackRate = rate;
    if (this.command) {
      this.command = { ...this.command, playbackRate: rate };
    }
  }

  /**
   * Advance the playhead by `deltaMs` wall-clock milliseconds,
   * scaled by playbackRate. No-op when not playing.
   */
  tick(deltaMs: number): void {
    if (this.state !== "playing" || !this.command) return;
    if (!(deltaMs >= 0) || !Number.isFinite(deltaMs)) return;

    this.currentTimeMs += deltaMs * this.playbackRate;
    if (this.currentTimeMs >= this.endMs) {
      this.currentTimeMs = this.endMs;
      this.state = "stopped";
    }
  }

  /** Jump playhead (clamped to [0, endMs]). Does not change playing state. */
  seek(timeMs: number): void {
    const clamped = Math.max(0, Math.min(timeMs, this.endMs));
    this.currentTimeMs = clamped;
  }

  getCurrentTimeMs(): number {
    return this.currentTimeMs;
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }

  isPlaying(): boolean {
    return this.state === "playing";
  }

  getState(): PlaybackState {
    return this.state;
  }

  getCommand(): AnimationCommand | null {
    return this.command;
  }

  /** Primary (latest-started) clip under the playhead, if any. */
  getActiveClip(): AnimationClipCommand | null {
    const overlapping = this.getOverlappingClips();
    if (overlapping.length === 0) return null;
    return overlapping[overlapping.length - 1] ?? null;
  }

  getOverlappingClips(): AnimationClipCommand[] {
    if (!this.command) return [];
    const t = this.currentTimeMs;
    return this.command.clips.filter(
      (clip) => t >= clip.startMs && t < clip.startMs + clip.durationMs,
    );
  }

  getSnapshot(): PlaybackEngineSnapshot {
    return {
      state: this.state,
      currentTimeMs: this.currentTimeMs,
      playbackRate: this.playbackRate,
      commandId: this.command?.commandId ?? null,
      activeClip: this.getActiveClip(),
      overlappingClips: this.getOverlappingClips(),
    };
  }
}

function computeEndMs(command: AnimationCommand): number {
  let end = 0;
  for (const clip of command.clips) {
    end = Math.max(end, clip.startMs + clip.durationMs);
  }
  return end;
}
