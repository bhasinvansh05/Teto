import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mockAnimationCommand,
  mockEnglishInput,
  mockEnglishSentence,
  mockGlossSequence,
  mockLandmarkFrame,
  mockSignSequence,
} from "./mocks.js";
import {
  assertAnimationCommand,
  assertEnglishInput,
  assertEnglishSentence,
  assertGlossSequence,
  assertLandmarkFrame,
  assertSignSequence,
} from "./validate.js";

describe("@teto/contracts mocks", () => {
  it("validates LandmarkFrame mock", () => {
    assertLandmarkFrame(mockLandmarkFrame);
    assert.equal(mockLandmarkFrame.hands.right.landmarks.length, 21);
  });

  it("validates SignSequence mock", () => {
    assertSignSequence(mockSignSequence);
    assert.equal(mockSignSequence.signs.length, 3);
  });

  it("validates GlossSequence mock", () => {
    assertGlossSequence(mockGlossSequence);
    assert.equal(mockGlossSequence.tokens[0]?.gloss, "HELLO");
  });

  it("validates EnglishSentence mock", () => {
    assertEnglishSentence(mockEnglishSentence);
  });

  it("validates EnglishInput mock", () => {
    assertEnglishInput(mockEnglishInput);
  });

  it("validates AnimationCommand mock", () => {
    assertAnimationCommand(mockAnimationCommand);
    assert.equal(mockAnimationCommand.clips.length, 3);
  });

  it("rejects invalid sign label casing", () => {
    assert.throws(() =>
      assertSignSequence({
        ...mockSignSequence,
        signs: [{ ...mockSignSequence.signs[0], label: "hello" }],
      }),
    );
  });
});
