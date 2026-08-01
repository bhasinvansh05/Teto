import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertAnimationCommand,
  mockAnimationCommand,
  mockGlossSequence,
  SCHEMA_VERSION,
  type GlossSequence,
} from "@teto/contracts";
import { FALLBACK_CLIPS } from "./clip-library.js";
import { glossToAnimationCommand } from "./gloss-to-command.js";

describe("glossToAnimationCommand", () => {
  it("produces a valid AnimationCommand from mock GlossSequence", () => {
    const command = glossToAnimationCommand(mockGlossSequence);
    assertAnimationCommand(command);
    assert.equal(command.schemaVersion, SCHEMA_VERSION);
    assert.equal(command.glossId, mockGlossSequence.glossId);
    assert.equal(command.clips.length, mockGlossSequence.tokens.length);
    assert.equal(command.clips[0]?.clipId, "clip.HELLO");
  });

  it("keeps startMs monotonic (non-decreasing)", () => {
    const command = glossToAnimationCommand(mockGlossSequence);
    let prev = -1;
    for (const clip of command.clips) {
      assert.ok(clip.startMs >= prev, `startMs ${clip.startMs} >= ${prev}`);
      prev = clip.startMs;
    }
  });

  it("matches canonical mock timeline for HELLO/HOW/YOU", () => {
    const command = glossToAnimationCommand(mockGlossSequence);
    assert.deepEqual(
      command.clips.map((c) => ({
        clipId: c.clipId,
        startMs: c.startMs,
        durationMs: c.durationMs,
        blendInMs: c.blendInMs,
        blendOutMs: c.blendOutMs,
      })),
      mockAnimationCommand.clips.map((c) => ({
        clipId: c.clipId,
        startMs: c.startMs,
        durationMs: c.durationMs,
        blendInMs: c.blendInMs,
        blendOutMs: c.blendOutMs,
      })),
    );
  });

  it("respects token durations and passthrough NMM", () => {
    const command = glossToAnimationCommand(mockGlossSequence);
    for (let i = 0; i < mockGlossSequence.tokens.length; i++) {
      const token = mockGlossSequence.tokens[i]!;
      const clip = command.clips[i]!;
      assert.equal(clip.durationMs, token.durationMs);
      assert.equal(clip.tokenId, token.id);
      assert.deepEqual(clip.nmm, token.nmm);
    }
  });

  it("uses fallback clips for unknown / fingerspell / hold", () => {
    const gloss: GlossSequence = {
      schemaVersion: SCHEMA_VERSION,
      glossId: "g-fallback",
      direction: "en_to_asl",
      sourceText: "test",
      tokens: [
        {
          id: "a",
          gloss: "ZZZ",
          role: "sign",
          fingerspell: false,
          durationMs: 400,
          emphasis: "normal",
        },
        {
          id: "b",
          gloss: "JOE",
          role: "fingerspell",
          fingerspell: true,
          durationMs: 400,
          emphasis: "normal",
        },
        {
          id: "c",
          gloss: "HOLD",
          role: "hold",
          fingerspell: false,
          durationMs: 200,
          emphasis: "normal",
        },
      ],
    };
    const command = glossToAnimationCommand(gloss);
    assertAnimationCommand(command);
    assert.equal(command.clips[0]?.clipId, FALLBACK_CLIPS.UNKNOWN);
    assert.equal(command.clips[1]?.clipId, FALLBACK_CLIPS.FINGERSPELL);
    assert.equal(command.clips[2]?.clipId, FALLBACK_CLIPS.HOLD);
  });

  it("clamps blend on short tokens so ordering stays valid", () => {
    const gloss: GlossSequence = {
      schemaVersion: SCHEMA_VERSION,
      glossId: "g-short",
      direction: "en_to_asl",
      sourceText: "x",
      tokens: [
        {
          id: "s0",
          gloss: "HELLO",
          role: "sign",
          fingerspell: false,
          durationMs: 100,
          emphasis: "normal",
        },
        {
          id: "s1",
          gloss: "YOU",
          role: "sign",
          fingerspell: false,
          durationMs: 100,
          emphasis: "normal",
        },
      ],
    };
    const command = glossToAnimationCommand(gloss);
    assertAnimationCommand(command);
    assert.ok(command.clips[0]!.blendOutMs <= 50);
    assert.ok(command.clips[1]!.startMs >= command.clips[0]!.startMs);
    assert.equal(command.clips[1]!.startMs, 50); // 100 - 50
  });
});
