/**
 * @teto/vision-capture — Agent 1 (feature/camera-capture)
 *
 * Owns: camera access, MediaPipe landmark extraction, frame buffering.
 * Output: LandmarkFrame stream per @teto/contracts.
 *
 * Stub owned by Orchestrator. Implement on feature/camera-capture.
 */

export { createMockLandmarkFrameSource } from "./mock-source.js";
