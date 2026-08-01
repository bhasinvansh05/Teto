/**
 * @teto/vision-capture — Agent 1 (feature/camera-capture)
 *
 * Owns: camera access, MediaPipe landmark extraction, frame buffering.
 * Output: LandmarkFrame stream per @teto/contracts.
 */

export {
  requestCameraAccess,
  isCameraApiAvailable,
  type CameraAccessOptions,
  type CameraConstraints,
  type CameraStreamHandle,
} from "./camera-access.js";

export {
  FrameBuffer,
  DEFAULT_FRAME_BUFFER_SIZE,
} from "./frame-buffer.js";

export {
  SyntheticLandmarkExtractor,
  BrowserMediaPipeExtractor,
  type LandmarkExtractor,
  type RawVideoFrame,
  type MediaPipeBackend,
  type SyntheticLandmarkExtractorOptions,
  type BrowserMediaPipeExtractorOptions,
} from "./landmark-extractor.js";

export {
  CameraLandmarkSource,
  createCameraLandmarkSource,
  type CameraLandmarkSourceOptions,
  type LandmarkFrameListener,
} from "./camera-landmark-source.js";

export { createMockLandmarkFrameSource } from "./mock-source.js";
