import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mockLandmarkFrame } from "@teto/contracts";
import {
  HeuristicSignModel,
  SIGN_VOCAB,
  createHeuristicSignModel,
} from "./heuristic-model.js";
import { makeFrame, syntheticPoses } from "./test-fixtures.js";

const LABEL_PATTERN = /^[A-Z0-9][A-Z0-9-]*$/;

describe("HeuristicSignModel", () => {
  const model = createHeuristicSignModel();

  it("returns valid label and confidence on mockLandmarkFrame", () => {
    const pred = model.predict(mockLandmarkFrame);
    assert.ok(pred, "expected a prediction for mockLandmarkFrame");
    assert.ok(LABEL_PATTERN.test(pred.label), `invalid label: ${pred.label}`);
    assert.ok(
      (SIGN_VOCAB as readonly string[]).includes(pred.label),
      `label not in vocab: ${pred.label}`,
    );
    assert.ok(pred.confidence >= 0 && pred.confidence <= 1);
  });

  it("returns null when no hands present", () => {
    const frame = makeFrame([], {
      hands: {
        left: { present: false, landmarks: [] },
        right: { present: false, landmarks: [] },
      },
    });
    assert.equal(model.predict(frame), null);
  });

  it("classifies synthetic open-palm raised as HELLO", () => {
    const pred = model.predict(makeFrame(syntheticPoses.hello()));
    assert.ok(pred);
    assert.equal(pred.label, "HELLO");
    assert.ok(pred.confidence >= 0.5);
  });

  it("classifies synthetic pointing as YOU", () => {
    const pred = model.predict(makeFrame(syntheticPoses.you()));
    assert.ok(pred);
    assert.equal(pred.label, "YOU");
    assert.ok(pred.confidence >= 0.5);
  });

  it("classifies synthetic fist as YES", () => {
    const pred = model.predict(makeFrame(syntheticPoses.yes()));
    assert.ok(pred);
    assert.equal(pred.label, "YES");
    assert.ok(pred.confidence >= 0.5);
  });

  it("classifies synthetic two-fingers as NO", () => {
    const pred = model.predict(makeFrame(syntheticPoses.no()));
    assert.ok(pred);
    assert.equal(pred.label, "NO");
    assert.ok(pred.confidence >= 0.5);
  });

  it("classifies synthetic thumbs-up as GOOD", () => {
    const pred = model.predict(makeFrame(syntheticPoses.good()));
    assert.ok(pred);
    assert.equal(pred.label, "GOOD");
    assert.ok(pred.confidence >= 0.5);
  });

  it("classifies synthetic ILY handshape as ILY", () => {
    const pred = model.predict(makeFrame(syntheticPoses.ily()));
    assert.ok(pred);
    assert.equal(pred.label, "ILY");
    assert.ok(pred.confidence >= 0.5);
  });

  it("implements SignModel via HeuristicSignModel class", () => {
    const m = new HeuristicSignModel();
    const pred = m.predict(makeFrame(syntheticPoses.ily()));
    assert.ok(pred);
    assert.equal(pred.label, "ILY");
  });
});
