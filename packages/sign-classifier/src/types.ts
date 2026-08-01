import type { LandmarkFrame } from "@teto/contracts";

/** Per-frame sign prediction from a model. */
export interface SignPrediction {
  label: string;
  confidence: number;
}

/**
 * Landmark → gloss label model.
 * Returns null when no sign is detected in the frame.
 */
export interface SignModel {
  predict(frame: LandmarkFrame): SignPrediction | null;
}

/** Options for temporal debounce / smoothing. */
export interface TemporalSmootherOptions {
  /** Consecutive agreeing frames required before a sign is stable. Default 5. */
  consecutiveFrames?: number;
  /** Minimum confidence to count toward the streak. Default 0.55. */
  minConfidence?: number;
}

/** Options for the real SignSequenceSource pipeline. */
export interface SignClassifierSourceOptions {
  model?: SignModel;
  consecutiveFrames?: number;
  minConfidence?: number;
}
