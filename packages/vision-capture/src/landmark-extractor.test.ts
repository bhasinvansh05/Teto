import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertLandmarkFrame } from "@teto/contracts";
import {
  BrowserMediaPipeExtractor,
  SyntheticLandmarkExtractor,
} from "./landmark-extractor.js";

describe("SyntheticLandmarkExtractor", () => {
  it("produces schema-valid frames with 21 hand landmarks when present", () => {
    const extractor = new SyntheticLandmarkExtractor({
      rightHand: true,
      leftHand: true,
      pose: true,
    });

    const frame = extractor.extract({
      timestampMs: 1_710_000_000_000,
      width: 1280,
      height: 720,
    });

    assertLandmarkFrame(frame);
    assert.equal(frame.hands.right.present, true);
    assert.equal(frame.hands.right.landmarks.length, 21);
    assert.equal(frame.hands.left.present, true);
    assert.equal(frame.hands.left.landmarks.length, 21);
    assert.equal(frame.pose.present, true);
    assert.equal(frame.pose.landmarks.length, 33);
    assert.equal(frame.schemaVersion, "1.0.0");
  });

  it("omits landmarks when hand/pose not present", () => {
    const extractor = new SyntheticLandmarkExtractor({
      leftHand: false,
      rightHand: false,
      pose: false,
    });
    const frame = extractor.extract({
      timestampMs: Date.now(),
      width: 640,
      height: 480,
    });
    assertLandmarkFrame(frame);
    assert.equal(frame.hands.left.present, false);
    assert.equal(frame.hands.left.landmarks.length, 0);
    assert.equal(frame.hands.right.present, false);
    assert.equal(frame.pose.present, false);
  });

  it("moves landmarks across ticks (temporal coherence)", () => {
    const extractor = new SyntheticLandmarkExtractor({ rightHand: true });
    const a = extractor.extract({ timestampMs: 1, width: 1280, height: 720 });
    const b = extractor.extract({ timestampMs: 2, width: 1280, height: 720 });
    assert.notEqual(a.frameId, b.frameId);
    // Wrist y and fingertip x both depend on phase
    assert.notEqual(
      a.hands.right.landmarks[0]!.y,
      b.hands.right.landmarks[0]!.y,
    );
    assert.notEqual(
      a.hands.right.landmarks[4]!.x,
      b.hands.right.landmarks[4]!.x,
    );
  });
});

describe("BrowserMediaPipeExtractor", () => {
  it("throws when no MediaPipe backend is injected", async () => {
    const extractor = new BrowserMediaPipeExtractor();
    await assert.rejects(
      () =>
        extractor.extract({
          timestampMs: Date.now(),
          width: 1280,
          height: 720,
        }),
      /not available in this environment/i,
    );
  });

  it("delegates to an injected backend", async () => {
    const synthetic = new SyntheticLandmarkExtractor();
    const extractor = new BrowserMediaPipeExtractor({
      backend: {
        estimate(raw) {
          return synthetic.extract(raw);
        },
      },
    });
    const frame = await extractor.extract({
      timestampMs: 42,
      width: 1280,
      height: 720,
    });
    assertLandmarkFrame(frame);
  });
});
