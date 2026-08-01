import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertAnimationCommand, mockGlossSequence } from "@teto/contracts";
import {
  createMockAvatarRenderer,
  glossToAnimationCommand,
} from "./mock-renderer.js";

describe("@teto/avatar-renderer mock renderer", () => {
  it("maps GlossSequence → AnimationCommand", () => {
    const command = glossToAnimationCommand(mockGlossSequence);
    assertAnimationCommand(command);
    assert.equal(command.clips.length, mockGlossSequence.tokens.length);
    assert.equal(command.clips[0]?.clipId, "clip.HELLO");
  });

  it("plays and stops commands", async () => {
    const renderer = createMockAvatarRenderer();
    await renderer.load();
    const command = glossToAnimationCommand(mockGlossSequence);
    await renderer.play(command);
    assert.equal(renderer.isPlaying(), true);
    assert.equal(renderer.getLastCommand()?.glossId, mockGlossSequence.glossId);
    renderer.stop();
    assert.equal(renderer.isPlaying(), false);
  });
});