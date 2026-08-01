/**
 * @teto/sign-classifier — Agent 2 (feature/sign-classifier)
 *
 * Owns: landmark → sign label model, confidence, temporal smoothing.
 * Consumes: LandmarkFrame. Outputs: SignSequence.
 */

export type {
  SignClassifierSourceOptions,
  SignModel,
  SignPrediction,
  TemporalSmootherOptions,
} from "./types.js";

export {
  SIGN_VOCAB,
  HeuristicSignModel,
  createHeuristicSignModel,
  type SignLabel,
} from "./heuristic-model.js";

export { TemporalSmoother, Debouncer } from "./temporal-smoother.js";

export { createSignClassifierSource } from "./classifier-source.js";

export { createMockSignSequenceSource } from "./mock-source.js";

export {
  extractHandFeatures,
  WRIST,
  THUMB_TIP,
  INDEX_TIP,
  MIDDLE_TIP,
  RING_TIP,
  PINKY_TIP,
} from "./hand-geometry.js";
