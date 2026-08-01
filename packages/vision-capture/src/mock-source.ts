import {
  type LandmarkFrame,
  type LandmarkFrameSource,
  mockLandmarkFrame,
} from "@teto/contracts";

/** Temporary source that emits the canonical mock frame. Replace with real capture. */
export function createMockLandmarkFrameSource(
  intervalMs = 33,
): LandmarkFrameSource {
  let timer: ReturnType<typeof setInterval> | undefined;
  const listeners = new Set<(frame: LandmarkFrame) => void>();
  let frameCounter = 1;

  return {
    async start() {
      if (timer) return;
      timer = setInterval(() => {
        const frame: LandmarkFrame = {
          ...mockLandmarkFrame,
          frameId: `f-${String(frameCounter++).padStart(6, "0")}`,
          timestampMs: Date.now(),
        };
        for (const listener of listeners) listener(frame);
      }, intervalMs);
    },
    async stop() {
      if (timer) clearInterval(timer);
      timer = undefined;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
