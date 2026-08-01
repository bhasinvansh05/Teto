import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertAnimationCommand,
  mockGlossSequence,
} from "@teto/contracts";
import { glossToAnimationCommand } from "./gloss-to-command.js";
import { createHeadlessAvatarRenderer } from "./headless-renderer.js";
import { AnimationPlaybackEngine } from "./playback-engine.js";

describe("AnimationPlaybackEngine", () => {
  it("plays, advances time, and stops", () => {
    const engine = new AnimationPlaybackEngine();
    const command = glossToAnimationCommand(mockGlossSequence);
    assertAnimationCommand(command);

    engine.play(command);
    assert.equal(engine.isPlaying(), true);
    assert.equal(engine.getCurrentTimeMs(), 0);
    assert.equal(engine.getActiveClip()?.clipId, "clip.HELLO");

    engine.tick(100);
    assert.equal(engine.getCurrentTimeMs(), 100);
    assert.equal(engine.isPlaying(), true);

    engine.stop();
    assert.equal(engine.isPlaying(), false);
    assert.equal(engine.getCurrentTimeMs(), 0);
  });

  it("respects playback rate when ticking", () => {
    const engine = new AnimationPlaybackEngine();
    const command = glossToAnimationCommand(mockGlossSequence);
    engine.play(command);
    engine.setPlaybackRate(2);
    engine.tick(50);
    assert.equal(engine.getCurrentTimeMs(), 100);
    assert.equal(engine.getPlaybackRate(), 2);
  });

  it("rejects non-positive playback rates", () => {
    const engine = new AnimationPlaybackEngine();
    assert.throws(() => engine.setPlaybackRate(0));
    assert.throws(() => engine.setPlaybackRate(-1));
  });

  it("auto-stops when timeline ends", () => {
    const engine = new AnimationPlaybackEngine();
    const command = glossToAnimationCommand(mockGlossSequence);
    engine.play(command);
    // Total end ≈ 940 + 450 = 1390
    engine.tick(2000);
    assert.equal(engine.isPlaying(), false);
    assert.ok(engine.getCurrentTimeMs() >= 1390);
  });

  it("reports overlapping clips during blend windows", () => {
    const engine = new AnimationPlaybackEngine();
    const command = glossToAnimationCommand(mockGlossSequence);
    engine.play(command);
    // At t=550: HELLO [0,600) and HOW [520,1020) overlap
    engine.seek(550);
    const overlapping = engine.getOverlappingClips();
    assert.equal(overlapping.length, 2);
    assert.equal(overlapping[0]?.clipId, "clip.HELLO");
    assert.equal(overlapping[1]?.clipId, "clip.HOW");
  });
});

describe("HeadlessAvatarRenderer", () => {
  it("implements AvatarRenderer play/stop/rate + pose snapshot", async () => {
    const renderer = createHeadlessAvatarRenderer();
    await renderer.load();
    const command = glossToAnimationCommand(mockGlossSequence);
    await renderer.play(command);
    assert.equal(renderer.isPlaying(), true);
    assert.equal(renderer.getLastCommand()?.glossId, mockGlossSequence.glossId);

    renderer.tick(50);
    const pose = renderer.getPoseSnapshot();
    assert.equal(pose.clipId, "clip.HELLO");
    assert.ok(pose.joints.wristFlex !== undefined);
    assert.equal(pose.nmm?.eyeGaze, "forward");

    renderer.setPlaybackRate(1.5);
    assert.equal(renderer.getEngine().getPlaybackRate(), 1.5);

    renderer.stop();
    assert.equal(renderer.isPlaying(), false);
  });

  it("validates commands on play", async () => {
    const renderer = createHeadlessAvatarRenderer();
    await renderer.load();
    await assert.rejects(
      () =>
        renderer.play({
          schemaVersion: "1.0.0",
          commandId: "bad",
          glossId: "g",
          playbackRate: 0,
          clips: [],
        } as never),
    );
  });
});
