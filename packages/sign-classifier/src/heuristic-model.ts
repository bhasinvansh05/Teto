import type { HandObservation, LandmarkFrame } from "@teto/contracts";
import { extractHandFeatures, type HandFeatures } from "./hand-geometry.js";
import type { SignModel, SignPrediction } from "./types.js";

/** MVP vocabulary — uppercase gloss tokens matching contract label pattern. */
export const SIGN_VOCAB = [
  "HELLO",
  "YOU",
  "ME",
  "THANKS",
  "YES",
  "NO",
  "HOW",
  "GOOD",
  "PLEASE",
  "ILY",
] as const;

export type SignLabel = (typeof SIGN_VOCAB)[number];

interface ScoredLabel {
  label: SignLabel;
  score: number;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Score a handshape against the small vocab using fingertip distances,
 * openness, and coarse position cues. Stand-in for a pretrained model.
 */
function scoreHand(
  f: HandFeatures,
  bothHands: boolean,
): ScoredLabel[] {
  const scores: ScoredLabel[] = [];

  const fingersUp = [f.indexUp, f.middleUp, f.ringUp, f.pinkyUp].filter(
    Boolean,
  ).length;
  const openPalm = f.openness > 1.35 && fingersUp >= 3;
  const fist = f.openness < 1.15 && fingersUp <= 1 && !f.indexUp;
  const pointing =
    f.indexUp && !f.middleUp && !f.ringUp && !f.pinkyUp && f.indexExt > 1.2;
  const twoFingers =
    f.indexUp && f.middleUp && !f.ringUp && !f.pinkyUp;
  const thumbsUp =
    f.thumbUp &&
    !f.indexUp &&
    !f.middleUp &&
    !f.ringUp &&
    !f.pinkyUp &&
    f.thumbExt > 1.15;
  const ily =
    f.thumbUp &&
    f.indexUp &&
    !f.middleUp &&
    !f.ringUp &&
    f.pinkyUp;

  // HELLO — open palm raised (upper third of frame)
  scores.push({
    label: "HELLO",
    score: openPalm && f.wristY < 0.45 ? 0.75 + (0.45 - f.wristY) * 0.4 : 0.05,
  });

  // YOU — index pointing (toward camera / forward)
  scores.push({
    label: "YOU",
    score: pointing && f.wristY > 0.35 && f.wristY < 0.75 ? 0.82 : 0.04,
  });

  // ME — index pointing near center / lower-mid (toward self)
  scores.push({
    label: "ME",
    score:
      pointing && f.wristX > 0.35 && f.wristX < 0.65 && f.wristY > 0.45
        ? 0.78
        : 0.04,
  });

  // THANKS — open palm mid-height, tips relatively high vs wrist
  scores.push({
    label: "THANKS",
    score:
      openPalm && f.wristY >= 0.35 && f.wristY <= 0.6 && f.tipY < f.wristY
        ? 0.8
        : 0.05,
  });

  // YES — closed fist
  scores.push({
    label: "YES",
    score: fist ? 0.85 : 0.04,
  });

  // NO — index + middle extended
  scores.push({
    label: "NO",
    score: twoFingers ? 0.84 : 0.04,
  });

  // HOW — both hands open / cupped
  scores.push({
    label: "HOW",
    score: bothHands && openPalm ? 0.88 : bothHands ? 0.35 : 0.03,
  });

  // GOOD — thumbs up
  scores.push({
    label: "GOOD",
    score: thumbsUp ? 0.9 : 0.04,
  });

  // PLEASE — open palm on chest (center, mid height)
  scores.push({
    label: "PLEASE",
    score:
      openPalm &&
      f.wristX > 0.3 &&
      f.wristX < 0.7 &&
      f.wristY > 0.4 &&
      f.wristY < 0.7 &&
      !bothHands
        ? 0.8
        : 0.05,
  });

  // ILY — thumb + index + pinky
  scores.push({
    label: "ILY",
    score: ily ? 0.92 : 0.03,
  });

  // Soft fallbacks so unstructured grids (e.g. mockLandmarkFrame) still map
  if (f.openness >= 1.0) {
    const opennessBoost = clamp01((f.openness - 1.0) * 0.5);
    const hello = scores.find((s) => s.label === "HELLO")!;
    hello.score = Math.max(hello.score, 0.4 + opennessBoost * 0.3);
  }

  return scores;
}

function pickBest(scores: ScoredLabel[]): SignPrediction | null {
  let best: ScoredLabel | null = null;
  for (const s of scores) {
    if (!best || s.score > best.score) best = s;
  }
  if (!best || best.score < 0.35) return null;
  return {
    label: best.label,
    confidence: clamp01(best.score),
  };
}

function primaryHand(frame: LandmarkFrame): HandObservation | null {
  const { left, right } = frame.hands;
  if (right.present && right.landmarks.length === 21) return right;
  if (left.present && left.landmarks.length === 21) return left;
  return null;
}

/**
 * Rule / feature-based classifier — pretrained-model stand-in for MVP.
 * Maps hand landmark geometry to a small uppercase gloss vocabulary.
 */
export class HeuristicSignModel implements SignModel {
  predict(frame: LandmarkFrame): SignPrediction | null {
    const hand = primaryHand(frame);
    if (!hand) return null;

    const bothHands =
      frame.hands.left.present &&
      frame.hands.left.landmarks.length === 21 &&
      frame.hands.right.present &&
      frame.hands.right.landmarks.length === 21;

    const features = extractHandFeatures(hand.landmarks);
    return pickBest(scoreHand(features, bothHands));
  }
}

export function createHeuristicSignModel(): SignModel {
  return new HeuristicSignModel();
}
