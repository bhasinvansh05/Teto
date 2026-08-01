# @teto/vision-capture

Agent 1 package: camera access, frame buffering, and landmark extraction that
emits validated `LandmarkFrame` streams (`LandmarkFrameSource`).

## Public API

| Export | Role |
| --- | --- |
| `requestCameraAccess` / `isCameraApiAvailable` | Browser `getUserMedia` wrapper with Node fallback |
| `FrameBuffer` | Ring buffer of recent frames (default capacity 30) |
| `LandmarkExtractor` | Interface for hand (21) + pose landmark extraction |
| `SyntheticLandmarkExtractor` | Realistic moving landmarks for tests / Node |
| `BrowserMediaPipeExtractor` | Stub; inject a `MediaPipeBackend` for real WASM |
| `CameraLandmarkSource` / `createCameraLandmarkSource` | `LandmarkFrameSource` implementation |
| `createMockLandmarkFrameSource` | Compatibility mock that emits canonical fixtures |

## MediaPipe integration path

1. Load MediaPipe Hands + Pose (or Holistic) in the browser.
2. Implement `MediaPipeBackend.estimate(raw) → LandmarkFrame` (normalize x/y to `[0,1]`, 21 pts per present hand).
3. `new BrowserMediaPipeExtractor({ backend })` and pass as `extractor` to `CameraLandmarkSource`.

Without a backend, `BrowserMediaPipeExtractor` throws so CI never silently skips MediaPipe.
