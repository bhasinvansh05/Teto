/**
 * CameraAccess — wraps browser `getUserMedia` with a graceful Node/test fallback.
 *
 * Browser path: requests a MediaStream (video only by default).
 * Non-browser / unavailable: returns a synthetic "unavailable" result so callers
 * (and CameraLandmarkSource) can continue with SyntheticLandmarkExtractor.
 */

export interface CameraConstraints {
  width?: number;
  height?: number;
  facingMode?: "user" | "environment";
  /** Request audio as well (default false). */
  audio?: boolean;
}

export interface CameraStreamHandle {
  /** True when a real MediaStream was obtained from getUserMedia. */
  available: boolean;
  /** Browser MediaStream when available; undefined in Node/fallback. */
  stream?: MediaStream;
  /** Human-readable reason when camera is unavailable. */
  reason?: string;
  /** Image size hint for landmark frames. */
  imageSize: { width: number; height: number };
  /** Release the underlying stream tracks (no-op in fallback). */
  stop(): void;
}

export interface CameraAccessOptions {
  constraints?: CameraConstraints;
  /**
   * Injected getUserMedia for tests. Defaults to
   * `navigator.mediaDevices.getUserMedia` when present.
   */
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
}

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

function resolveGetUserMedia(
  injected?: CameraAccessOptions["getUserMedia"],
): ((constraints: MediaStreamConstraints) => Promise<MediaStream>) | undefined {
  if (injected) return injected;
  if (
    typeof globalThis !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  ) {
    return (c) => navigator.mediaDevices.getUserMedia(c);
  }
  return undefined;
}

function toMediaConstraints(
  constraints: CameraConstraints = {},
): MediaStreamConstraints {
  const width = constraints.width ?? DEFAULT_WIDTH;
  const height = constraints.height ?? DEFAULT_HEIGHT;
  return {
    audio: constraints.audio ?? false,
    video: {
      width: { ideal: width },
      height: { ideal: height },
      facingMode: constraints.facingMode ?? "user",
    },
  };
}

function imageSizeFromConstraints(
  constraints: CameraConstraints = {},
): { width: number; height: number } {
  return {
    width: constraints.width ?? DEFAULT_WIDTH,
    height: constraints.height ?? DEFAULT_HEIGHT,
  };
}

/**
 * Request camera access. Never throws for missing APIs — returns
 * `{ available: false }` so Node and CI can run without a camera.
 */
export async function requestCameraAccess(
  options: CameraAccessOptions = {},
): Promise<CameraStreamHandle> {
  const imageSize = imageSizeFromConstraints(options.constraints);
  const gum = resolveGetUserMedia(options.getUserMedia);

  if (!gum) {
    return {
      available: false,
      reason: "getUserMedia unavailable in this environment",
      imageSize,
      stop() {},
    };
  }

  try {
    const stream = await gum(toMediaConstraints(options.constraints));
    const track = stream.getVideoTracks()[0];
    const settings = track?.getSettings?.() ?? {};
    const resolvedSize = {
      width: settings.width ?? imageSize.width,
      height: settings.height ?? imageSize.height,
    };

    return {
      available: true,
      stream,
      imageSize: resolvedSize,
      stop() {
        for (const t of stream.getTracks()) t.stop();
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      available: false,
      reason: `getUserMedia failed: ${message}`,
      imageSize,
      stop() {},
    };
  }
}

/** True when the current environment exposes getUserMedia. */
export function isCameraApiAvailable(): boolean {
  return resolveGetUserMedia() !== undefined;
}
