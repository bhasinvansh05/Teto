import type { DetectedSign } from "@teto/contracts";
import type { SignPrediction, TemporalSmootherOptions } from "./types.js";

const DEFAULT_CONSECUTIVE = 5;
const DEFAULT_MIN_CONFIDENCE = 0.55;

/**
 * Debounces per-frame predictions: requires N consecutive agreeing frames
 * (with min confidence) before emitting a stable sign. Collapses duplicates
 * so the same label is not re-emitted until a different stable sign appears.
 */
export class TemporalSmoother {
  readonly consecutiveFrames: number;
  readonly minConfidence: number;

  private streakLabel: string | null = null;
  private streakCount = 0;
  private streakConfidenceSum = 0;
  private streakStartedAtMs: number | null = null;
  private lastEmittedLabel: string | null = null;
  private emittedForCurrentStreak = false;

  constructor(options: TemporalSmootherOptions = {}) {
    this.consecutiveFrames = options.consecutiveFrames ?? DEFAULT_CONSECUTIVE;
    this.minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  }

  /**
   * Push one frame prediction. Returns a stable DetectedSign when the
   * debounce threshold is first crossed for a new label; otherwise null.
   */
  push(
    prediction: SignPrediction | null,
    timestampMs: number,
  ): DetectedSign | null {
    if (
      !prediction ||
      prediction.confidence < this.minConfidence ||
      !prediction.label
    ) {
      this.resetStreak();
      return null;
    }

    if (prediction.label !== this.streakLabel) {
      this.streakLabel = prediction.label;
      this.streakCount = 1;
      this.streakConfidenceSum = prediction.confidence;
      this.streakStartedAtMs = timestampMs;
      this.emittedForCurrentStreak = false;
      return null;
    }

    this.streakCount += 1;
    this.streakConfidenceSum += prediction.confidence;

    if (
      this.streakCount < this.consecutiveFrames ||
      this.emittedForCurrentStreak
    ) {
      return null;
    }

    // Collapse duplicates: skip if same label already emitted last
    if (this.streakLabel === this.lastEmittedLabel) {
      this.emittedForCurrentStreak = true;
      return null;
    }

    const avgConfidence = this.streakConfidenceSum / this.streakCount;
    const sign: DetectedSign = {
      label: this.streakLabel,
      confidence: Math.min(1, Math.max(0, avgConfidence)),
      startedAtMs: this.streakStartedAtMs ?? timestampMs,
      endedAtMs: timestampMs,
      stable: true,
    };

    this.lastEmittedLabel = this.streakLabel;
    this.emittedForCurrentStreak = true;
    return sign;
  }

  /** Clear streak state (keeps last-emitted for duplicate collapse across resets if desired). */
  reset(): void {
    this.resetStreak();
    this.lastEmittedLabel = null;
  }

  private resetStreak(): void {
    this.streakLabel = null;
    this.streakCount = 0;
    this.streakConfidenceSum = 0;
    this.streakStartedAtMs = null;
    this.emittedForCurrentStreak = false;
  }
}

/** Alias matching the MVP naming. */
export { TemporalSmoother as Debouncer };
