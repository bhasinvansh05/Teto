import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertLandmarkFrame, type LandmarkFrame } from "@teto/contracts";
import {
  CameraLandmarkSource,
  createCameraLandmarkSource,
} from "./camera-landmark-source.js";
import { SyntheticLandmarkExtractor } from "./landmark-extractor.js";
import { isCameraApiAvailable, requestCameraAccess } from "./camera-access.js";

describe("CameraAccess", () => {
  it("falls back gracefully when getUserMedia is unavailable", async () => {
    assert.equal(isCameraApiAvailable(), false);
    const handle = await requestCameraAccess();
    assert.equal(handle.available, false);
    assert.ok(handle.reason);
    assert.equal(handle.imageSize.width, 1280);
    handle.stop();
  });

  it("uses injected getUserMedia when provided", async () => {
    const fakeStream = {
      getVideoTracks: () => [
        {
          getSettings: () => ({ width: 640, height: 480 }),
          stop: () => {},
        },
      ],
      getTracks: () => [{ stop: () => {} }],
    } as unknown as MediaStream;

    const handle = await requestCameraAccess({
      getUserMedia: async () => fakeStream,
      constraints: { width: 640, height: 480 },
    });
    assert.equal(handle.available, true);
    assert.equal(handle.imageSize.width, 640);
    assert.equal(handle.stream, fakeStream);
    handle.stop();
  });
});

describe("CameraLandmarkSource", () => {
  it("subscribe / start / stop emits validated frames", async () => {
    const source = createCameraLandmarkSource({
      intervalMs: 10,
      extractor: new SyntheticLandmarkExtractor({ rightHand: true, pose: true }),
      bufferSize: 5,
    });

    const frames: LandmarkFrame[] = [];
    const unsub = source.subscribe((frame) => {
      frames.push(frame);
    });

    await source.start();
    assert.equal(source.cameraAvailable, false);

    await new Promise<void>((resolve, reject) => {
      const deadline = setTimeout(
        () => reject(new Error("timed out waiting for frames")),
        2000,
      );
      const check = setInterval(() => {
        if (frames.length >= 2) {
          clearInterval(check);
          clearTimeout(deadline);
          resolve();
        }
      }, 5);
    });

    for (const frame of frames) {
      assertLandmarkFrame(frame);
      if (frame.hands.right.present) {
        assert.equal(frame.hands.right.landmarks.length, 21);
      }
    }

    const buffered = source.getBufferedFrames();
    assert.ok(buffered.length >= 1);
    assert.ok(buffered.length <= 5);

    unsub();
    await source.stop();

    const countAfterStop = frames.length;
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(frames.length, countAfterStop, "no emits after stop");
    assert.deepEqual(source.getBufferedFrames(), []);
  });

  it("does not emit after unsubscribe", async () => {
    const source = new CameraLandmarkSource({
      intervalMs: 10,
      extractor: new SyntheticLandmarkExtractor(),
    });
    let count = 0;
    const unsub = source.subscribe(() => {
      count += 1;
    });
    await source.start();
    await new Promise((r) => setTimeout(r, 35));
    assert.ok(count >= 1);
    const atUnsub = count;
    unsub();
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(count, atUnsub);
    await source.stop();
  });

  it("start is idempotent", async () => {
    const source = createCameraLandmarkSource({ intervalMs: 50 });
    await source.start();
    await source.start();
    await source.stop();
  });
});
