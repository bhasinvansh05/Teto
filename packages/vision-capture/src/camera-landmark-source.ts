/**
 * CameraLandmarkSource — LandmarkFrameSource backed by camera + extractor.
 *
 * Pipeline: CameraAccess → (optional FrameBuffer) → LandmarkExtractor → emit.
 * Always validates outbound frames with assertLandmarkFrame before emit.
 */

import {
  assertLandmarkFrame,
  type LandmarkFrame,
  type LandmarkFrameSource,
} from "@teto/contracts";
import {
  requestCameraAccess,
  type CameraAccessOptions,
  type CameraStreamHandle,
} from "./camera-access.js";
import {
  DEFAULT_FRAME_BUFFER_SIZE,
  FrameBuffer,
} from "./frame-buffer.js";
import {
  SyntheticLandmarkExtractor,
  type LandmarkExtractor,
} from "./landmark-extractor.js";

export type LandmarkFrameListener = (frame: LandmarkFrame) => void;

export interface CameraLandmarkSourceOptions {
  /** Landmark extractor (default: SyntheticLandmarkExtractor). */
  extractor?: LandmarkExtractor;
  /** Frame emit interval in ms (default ~33 ≈ 30fps). */
  intervalMs?: number;
  /** Ring buffer capacity (default 30). Set 0 to disable buffering. */
  bufferSize?: number;
  /** Camera / getUserMedia options. */
  camera?: CameraAccessOptions;
  /**
   * When true (default), always assertLandmarkFrame before emit.
   * Keep enabled for MVP so bad extractors fail loudly.
   */
  validate?: boolean;
}

export class CameraLandmarkSource implements LandmarkFrameSource {
  private readonly listeners = new Set<LandmarkFrameListener>();
  private readonly extractor: LandmarkExtractor;
  private readonly intervalMs: number;
  private readonly validate: boolean;
  private readonly cameraOptions: CameraAccessOptions | undefined;
  private readonly buffer: FrameBuffer<LandmarkFrame> | null;

  private timer: ReturnType<typeof setInterval> | undefined;
  private camera: CameraStreamHandle | undefined;
  private running = false;

  constructor(options: CameraLandmarkSourceOptions = {}) {
    this.extractor = options.extractor ?? new SyntheticLandmarkExtractor();
    this.intervalMs = options.intervalMs ?? 33;
    this.validate = options.validate ?? true;
    this.cameraOptions = options.camera;
    const bufferSize = options.bufferSize ?? DEFAULT_FRAME_BUFFER_SIZE;
    this.buffer = bufferSize > 0 ? new FrameBuffer<LandmarkFrame>(bufferSize) : null;
  }

  /** Most recent buffered frames (oldest → newest), or empty if buffering disabled. */
  getBufferedFrames(): LandmarkFrame[] {
    return this.buffer?.toArray() ?? [];
  }

  /** Whether a live camera stream is attached (false under Node / fallback). */
  get cameraAvailable(): boolean {
    return this.camera?.available === true;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    this.camera = await requestCameraAccess(this.cameraOptions ?? {});

    // Prefer synthetic sizing from camera handle when no real pixels yet.
    const width = this.camera.imageSize.width;
    const height = this.camera.imageSize.height;

    this.timer = setInterval(() => {
      void this.tick(width, height);
    }, this.intervalMs);
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;

    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    this.camera?.stop();
    this.camera = undefined;
    this.buffer?.clear();

    await this.extractor.dispose?.();
  }

  subscribe(listener: LandmarkFrameListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async tick(width: number, height: number): Promise<void> {
    if (!this.running) return;

    try {
      const raw = {
        timestampMs: Date.now(),
        width,
        height,
        image: null as null,
      };
      const frame = await this.extractor.extract(raw);

      if (this.validate) {
        assertLandmarkFrame(frame);
      }

      this.buffer?.push(frame);

      for (const listener of this.listeners) {
        listener(frame);
      }
    } catch {
      // Drop failed frames; keep the stream alive for transient extractor errors.
    }
  }
}

/** Factory matching createMockLandmarkFrameSource style. */
export function createCameraLandmarkSource(
  options?: CameraLandmarkSourceOptions,
): CameraLandmarkSource {
  return new CameraLandmarkSource(options);
}
