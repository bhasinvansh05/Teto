/** Shared interface contracts for Teto. Schema version: 1.0.0 */

export const SCHEMA_VERSION = "1.0.0" as const;

export type SchemaVersion = typeof SCHEMA_VERSION;

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface HandObservation {
  present: boolean;
  /** Exactly 21 landmarks when present (MediaPipe Hands). */
  landmarks: Landmark[];
}

export interface PoseObservation {
  present: boolean;
  /** Up to 33 landmarks when present (MediaPipe Pose). */
  landmarks: Landmark[];
}

export interface LandmarkFrame {
  schemaVersion: SchemaVersion;
  timestampMs: number;
  frameId: string;
  imageSize: { width: number; height: number };
  hands: {
    left: HandObservation;
    right: HandObservation;
  };
  pose: PoseObservation;
}

export interface DetectedSign {
  label: string;
  confidence: number;
  startedAtMs: number;
  endedAtMs: number;
  stable: boolean;
}

export interface SignSequence {
  schemaVersion: SchemaVersion;
  sequenceId: string;
  startedAtMs: number;
  endedAtMs: number;
  signs: DetectedSign[];
}

export type GlossDirection = "en_to_asl" | "asl_to_en";
export type GlossRole = "sign" | "fingerspell" | "classifier" | "pause" | "hold";
export type GlossEmphasis = "reduced" | "normal" | "stressed";
export type BrowNmm = "neutral" | "raised" | "furrowed";
export type HeadNmm =
  | "neutral"
  | "nod"
  | "shake"
  | "tilt-left"
  | "tilt-right"
  | "tilt-forward";
export type EyeGazeNmm = "forward" | "left" | "right" | "up" | "down";

export interface NonManualMarkers {
  brow: BrowNmm;
  head: HeadNmm;
  eyeGaze: EyeGazeNmm;
}

export interface GlossToken {
  id: string;
  gloss: string;
  role: GlossRole;
  fingerspell: boolean;
  durationMs: number;
  emphasis: GlossEmphasis;
  nmm?: NonManualMarkers;
}

export interface GlossSequence {
  schemaVersion: SchemaVersion;
  glossId: string;
  direction: GlossDirection;
  sourceText: string;
  tokens: GlossToken[];
}

export interface EnglishSentence {
  schemaVersion: SchemaVersion;
  sentenceId: string;
  text: string;
  confidence: number;
  sourceSequenceId?: string;
}

export type EnglishInputOrigin = "typed" | "speech" | "system";

export interface EnglishInput {
  schemaVersion: SchemaVersion;
  inputId: string;
  text: string;
  locale: string;
  origin: EnglishInputOrigin;
}

export interface AnimationClipCommand {
  tokenId: string;
  clipId: string;
  startMs: number;
  durationMs: number;
  blendInMs: number;
  blendOutMs: number;
  poseOverrides?: Record<string, number>;
  nmm?: NonManualMarkers;
}

export interface AnimationCommand {
  schemaVersion: SchemaVersion;
  commandId: string;
  glossId: string;
  playbackRate: number;
  clips: AnimationClipCommand[];
}

/** Logical service interfaces — agents implement these. */

export interface LandmarkFrameSource {
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: (frame: LandmarkFrame) => void): () => void;
}

export interface SignSequenceSource {
  ingest(frame: LandmarkFrame): void;
  subscribe(listener: (sequence: SignSequence) => void): () => void;
  flush(): SignSequence | null;
}

export interface GlossParser {
  signsToEnglish(sequence: SignSequence): Promise<EnglishSentence>;
  englishToGloss(input: EnglishInput): Promise<GlossSequence>;
}

export interface AvatarRenderer {
  load(): Promise<void>;
  play(command: AnimationCommand): Promise<void>;
  stop(): void;
  setPlaybackRate(rate: number): void;
}
