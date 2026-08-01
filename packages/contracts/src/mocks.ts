import type {
  AnimationCommand,
  EnglishInput,
  EnglishSentence,
  GlossSequence,
  Landmark,
  LandmarkFrame,
  SignSequence,
} from "./types.js";
import { SCHEMA_VERSION } from "./types.js";

function landmark(x: number, y: number, z = 0, visibility = 1): Landmark {
  return { x, y, z, visibility };
}

function handLandmarks(offsetX: number): Landmark[] {
  return Array.from({ length: 21 }, (_, i) =>
    landmark(
      Math.min(0.99, offsetX + (i % 5) * 0.02),
      Math.min(0.99, 0.4 + Math.floor(i / 5) * 0.03),
      i * 0.001,
      0.95,
    ),
  );
}

/** Canonical mock landmark frame — Agent 1 output / Agent 2 input. */
export const mockLandmarkFrame: LandmarkFrame = {
  schemaVersion: SCHEMA_VERSION,
  timestampMs: 1_710_000_000_123,
  frameId: "f-000001",
  imageSize: { width: 1280, height: 720 },
  hands: {
    left: { present: false, landmarks: [] },
    right: { present: true, landmarks: handLandmarks(0.55) },
  },
  pose: {
    present: true,
    landmarks: Array.from({ length: 33 }, (_, i) =>
      landmark(0.5, Math.min(0.99, 0.1 + i * 0.02), 0, 0.9),
    ),
  },
};

/** Canonical mock sign sequence — Agent 2 output / Agent 3 input. */
export const mockSignSequence: SignSequence = {
  schemaVersion: SCHEMA_VERSION,
  sequenceId: "seq-000042",
  startedAtMs: 1_710_000_000_000,
  endedAtMs: 1_710_000_002_400,
  signs: [
    {
      label: "HELLO",
      confidence: 0.91,
      startedAtMs: 1_710_000_000_000,
      endedAtMs: 1_710_000_000_800,
      stable: true,
    },
    {
      label: "HOW",
      confidence: 0.84,
      startedAtMs: 1_710_000_001_000,
      endedAtMs: 1_710_000_001_600,
      stable: true,
    },
    {
      label: "YOU",
      confidence: 0.86,
      startedAtMs: 1_710_000_001_800,
      endedAtMs: 1_710_000_002_400,
      stable: true,
    },
  ],
};

/** Canonical mock English sentence — Agent 3 ASL→EN output. */
export const mockEnglishSentence: EnglishSentence = {
  schemaVersion: SCHEMA_VERSION,
  sentenceId: "s-000003",
  text: "Hello, how are you?",
  confidence: 0.88,
  sourceSequenceId: "seq-000042",
};

/** Canonical mock English input — UI → Agent 3. */
export const mockEnglishInput: EnglishInput = {
  schemaVersion: SCHEMA_VERSION,
  inputId: "in-000011",
  text: "Hello, how are you?",
  locale: "en-US",
  origin: "typed",
};

/** Canonical mock gloss sequence — Agent 3 EN→ASL output / Agent 4 input. */
export const mockGlossSequence: GlossSequence = {
  schemaVersion: SCHEMA_VERSION,
  glossId: "g-000007",
  direction: "en_to_asl",
  sourceText: "Hello, how are you?",
  tokens: [
    {
      id: "t0",
      gloss: "HELLO",
      role: "sign",
      fingerspell: false,
      durationMs: 600,
      emphasis: "normal",
      nmm: { brow: "neutral", head: "neutral", eyeGaze: "forward" },
    },
    {
      id: "t1",
      gloss: "HOW",
      role: "sign",
      fingerspell: false,
      durationMs: 500,
      emphasis: "normal",
      nmm: { brow: "raised", head: "tilt-forward", eyeGaze: "forward" },
    },
    {
      id: "t2",
      gloss: "YOU",
      role: "sign",
      fingerspell: false,
      durationMs: 450,
      emphasis: "normal",
      nmm: { brow: "neutral", head: "neutral", eyeGaze: "forward" },
    },
  ],
};

/** Canonical mock animation command — Agent 4 output / UI playback. */
export const mockAnimationCommand: AnimationCommand = {
  schemaVersion: SCHEMA_VERSION,
  commandId: "anim-000019",
  glossId: "g-000007",
  playbackRate: 1,
  clips: [
    {
      tokenId: "t0",
      clipId: "clip.HELLO",
      startMs: 0,
      durationMs: 600,
      blendInMs: 80,
      blendOutMs: 80,
      poseOverrides: {},
      nmm: { brow: "neutral", head: "neutral", eyeGaze: "forward" },
    },
    {
      tokenId: "t1",
      clipId: "clip.HOW",
      startMs: 520,
      durationMs: 500,
      blendInMs: 80,
      blendOutMs: 80,
      poseOverrides: {},
      nmm: { brow: "raised", head: "tilt-forward", eyeGaze: "forward" },
    },
    {
      tokenId: "t2",
      clipId: "clip.YOU",
      startMs: 940,
      durationMs: 450,
      blendInMs: 80,
      blendOutMs: 80,
      poseOverrides: {},
      nmm: { brow: "neutral", head: "neutral", eyeGaze: "forward" },
    },
  ],
};

export const mocks = {
  landmarkFrame: mockLandmarkFrame,
  signSequence: mockSignSequence,
  englishSentence: mockEnglishSentence,
  englishInput: mockEnglishInput,
  glossSequence: mockGlossSequence,
  animationCommand: mockAnimationCommand,
} as const;
