/**
 * LandmarkExtractor — pluggable hand/pose landmark extraction.
 *
 * MVP ships:
 * - `LandmarkExtractor` interface
 * - `SyntheticLandmarkExtractor` — realistic moving landmarks for tests / Node
 * - `BrowserMediaPipeExtractor` — stub documenting the real MediaPipe path
 */

import {
  SCHEMA_VERSION,
  type Landmark,
  type LandmarkFrame,
} from "@teto/contracts";

/** Raw video frame input for extractors (browser ImageBitmap / canvas / etc.). */
export interface RawVideoFrame {
  timestampMs: number;
  width: number;
  height: number;
  /** Optional pixel source when a real MediaPipe backend is wired. */
  image?: CanvasImageSource | ImageData | null;
}

export interface LandmarkExtractor {
  readonly name: string;
  /**
   * Extract a normalized LandmarkFrame from a raw video frame.
   * Implementations must produce contract-shaped hands (21 pts when present)
   * and pose (≤33 pts when present).
   */
  extract(raw: RawVideoFrame): LandmarkFrame | Promise<LandmarkFrame>;
  /** Optional teardown (WASM, workers). */
  dispose?(): void | Promise<void>;
}

const HAND_LANDMARK_COUNT = 21;
const POSE_LANDMARK_COUNT = 33;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function landmark(x: number, y: number, z = 0, visibility = 1): Landmark {
  return {
    x: clamp01(x),
    y: clamp01(y),
    z,
    visibility: clamp01(visibility),
  };
}

/** MediaPipe Hands topology: wrist → fingers with slight motion over time. */
function synthesizeHand(
  baseX: number,
  baseY: number,
  phase: number,
  present: boolean,
): { present: boolean; landmarks: Landmark[] } {
  if (!present) return { present: false, landmarks: [] };

  const wobble = Math.sin(phase) * 0.015;
  const landmarks = Array.from({ length: HAND_LANDMARK_COUNT }, (_, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    return landmark(
      baseX + col * 0.02 + wobble * (col * 0.2),
      baseY + row * 0.025 + Math.cos(phase + i * 0.1) * 0.01,
      (i - 10) * 0.002,
      0.92 + (i % 5) * 0.01,
    );
  });
  return { present: true, landmarks };
}

function synthesizePose(phase: number, present: boolean): {
  present: boolean;
  landmarks: Landmark[];
} {
  if (!present) return { present: false, landmarks: [] };

  const sway = Math.sin(phase * 0.5) * 0.02;
  const landmarks = Array.from({ length: POSE_LANDMARK_COUNT }, (_, i) => {
    // Rough MediaPipe Pose layout: head → torso → limbs
    const y = 0.08 + (i / (POSE_LANDMARK_COUNT - 1)) * 0.85;
    const x = 0.5 + sway + ((i % 2 === 0 ? -1 : 1) * (i < 11 ? 0.02 : 0.08));
    return landmark(x, y, Math.sin(phase + i * 0.05) * 0.01, 0.9);
  });
  return { present: true, landmarks };
}

export interface SyntheticLandmarkExtractorOptions {
  /** Image size stamped on frames (default 1280×720). */
  imageSize?: { width: number; height: number };
  /** Include left hand (default false — matches canonical mock). */
  leftHand?: boolean;
  /** Include right hand (default true). */
  rightHand?: boolean;
  /** Include pose (default true). */
  pose?: boolean;
  /** Phase speed multiplier for motion (default 1). */
  motionSpeed?: number;
  /** Optional frame id prefix (default "f"). */
  frameIdPrefix?: string;
}

/**
 * Generates schema-valid, temporally coherent LandmarkFrames without MediaPipe.
 * Suitable for Node tests and CameraLandmarkSource when no camera/WASM is present.
 */
export class SyntheticLandmarkExtractor implements LandmarkExtractor {
  readonly name = "synthetic";
  private tick = 0;
  private frameCounter = 0;
  private readonly imageSize: { width: number; height: number };
  private readonly leftHand: boolean;
  private readonly rightHand: boolean;
  private readonly pose: boolean;
  private readonly motionSpeed: number;
  private readonly frameIdPrefix: string;

  constructor(options: SyntheticLandmarkExtractorOptions = {}) {
    this.imageSize = options.imageSize ?? { width: 1280, height: 720 };
    this.leftHand = options.leftHand ?? false;
    this.rightHand = options.rightHand ?? true;
    this.pose = options.pose ?? true;
    this.motionSpeed = options.motionSpeed ?? 1;
    this.frameIdPrefix = options.frameIdPrefix ?? "f";
  }

  extract(raw: RawVideoFrame): LandmarkFrame {
    this.tick += 1;
    this.frameCounter += 1;
    const phase = this.tick * 0.12 * this.motionSpeed;

    return {
      schemaVersion: SCHEMA_VERSION,
      timestampMs: raw.timestampMs,
      frameId: `${this.frameIdPrefix}-${String(this.frameCounter).padStart(6, "0")}`,
      imageSize: {
        width: raw.width || this.imageSize.width,
        height: raw.height || this.imageSize.height,
      },
      hands: {
        left: synthesizeHand(0.25, 0.42, phase, this.leftHand),
        right: synthesizeHand(0.55, 0.4, phase + 1.2, this.rightHand),
      },
      pose: synthesizePose(phase, this.pose),
    };
  }
}

/**
 * Injected MediaPipe-style backend for BrowserMediaPipeExtractor.
 * Wire `@mediapipe/hands` + `@mediapipe/pose` (or Holistic) here in the browser.
 */
export interface MediaPipeBackend {
  estimate(
    raw: RawVideoFrame,
  ): LandmarkFrame | Promise<LandmarkFrame>;
  dispose?(): void | Promise<void>;
}

export interface BrowserMediaPipeExtractorOptions {
  backend?: MediaPipeBackend;
}

/**
 * Placeholder for real MediaPipe Hands + Pose integration.
 *
 * Integration path (browser):
 * 1. Load MediaPipe Hands / Pose (or Holistic) WASM via CDN or bundler.
 * 2. Implement `MediaPipeBackend.estimate` that maps raw results to LandmarkFrame:
 *    - Hands: 21 landmarks per present hand, x/y normalized to [0,1]
 *    - Pose: up to 33 landmarks when present
 * 3. Inject the backend: `new BrowserMediaPipeExtractor({ backend })`
 *
 * Without an injected backend this throws so CI never accidentally "succeeds"
 * with empty MediaPipe output.
 */
export class BrowserMediaPipeExtractor implements LandmarkExtractor {
  readonly name = "browser-mediapipe";
  private readonly backend: MediaPipeBackend | undefined;

  constructor(options: BrowserMediaPipeExtractorOptions = {}) {
    this.backend = options.backend;
  }

  async extract(raw: RawVideoFrame): Promise<LandmarkFrame> {
    if (!this.backend) {
      throw new Error(
        "BrowserMediaPipeExtractor: MediaPipe backend not available in this environment. " +
          "Inject a MediaPipeBackend (Hands + Pose → LandmarkFrame) or use SyntheticLandmarkExtractor.",
      );
    }
    return this.backend.estimate(raw);
  }

  async dispose(): Promise<void> {
    await this.backend?.dispose?.();
  }
}
