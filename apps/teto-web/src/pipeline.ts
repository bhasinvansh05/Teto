import {
  createHeadlessAvatarRenderer,
  glossToAnimationCommand,
  createMockAvatarRenderer,
} from "@teto/avatar-renderer";
import type {
  AnimationCommand,
  EnglishSentence,
  GlossSequence,
  LandmarkFrame,
  SignSequence,
} from "@teto/contracts";
import {
  createMockGlossParser,
  createRuleBasedGlossParser,
} from "@teto/gloss-parser";
import {
  createMockSignSequenceSource,
  createSignClassifierSource,
  makeFrame,
  syntheticPoses,
} from "@teto/sign-classifier";
import {
  createCameraLandmarkSource,
  createMockLandmarkFrameSource,
  SyntheticLandmarkExtractor,
} from "@teto/vision-capture";
import { createShellViewModel, renderShellMarkup } from "@teto/ui-shell";

export interface PipelineResult {
  english: EnglishSentence;
  gloss: GlossSequence;
  animation: AnimationCommand;
  sequence?: SignSequence;
  shellHtml?: string;
}

/**
 * Legacy mock pipeline (pre-integration). Kept for regression coverage.
 */
export async function runMockSignToEnglishPipeline(): Promise<PipelineResult> {
  const vision = createMockLandmarkFrameSource(5);
  const classifier = createMockSignSequenceSource();
  const glossParser = createMockGlossParser();
  const avatar = createMockAvatarRenderer();

  const sequence = await new Promise<ReturnType<typeof classifier.flush>>((resolve, reject) => {
    classifier.subscribe((seq) => {
      void vision.stop().then(() => resolve(seq));
    });
    vision.subscribe((frame) => classifier.ingest(frame));
    void vision.start().catch(reject);
  });

  if (!sequence) {
    throw new Error("classifier produced no sequence");
  }

  const english = await glossParser.signsToEnglish(sequence);
  const gloss = await glossParser.englishToGloss({
    schemaVersion: "1.0.0",
    inputId: `from-${sequence.sequenceId}`,
    text: english.text,
    locale: "en-US",
    origin: "system",
  });
  const animation = glossToAnimationCommand(gloss);
  await avatar.load();
  await avatar.play(animation);

  return { english, gloss, animation, sequence };
}

function ingestPose(
  classifier: ReturnType<typeof createSignClassifierSource>,
  landmarks: ReturnType<typeof syntheticPoses.hello>,
  frames: number,
  baseTs: number,
): void {
  for (let i = 0; i < frames; i++) {
    const frame: LandmarkFrame = makeFrame(landmarks, {
      timestampMs: baseTs + i * 33,
      frameId: `f-int-${baseTs}-${i}`,
    });
    classifier.ingest(frame);
  }
}

/**
 * CP5 integrated pipeline — real Agent 1–5 packages (synthetic camera / poses
 * for CI; MediaPipe backend still injectable via vision-capture).
 */
export async function runIntegratedPipeline(): Promise<PipelineResult> {
  const vision = createCameraLandmarkSource({
    intervalMs: 10,
    extractor: new SyntheticLandmarkExtractor({ motionSpeed: 1.2 }),
    bufferSize: 8,
  });
  let visionFrames = 0;
  const unsubVision = vision.subscribe(() => {
    visionFrames += 1;
  });
  await vision.start();
  await new Promise((r) => setTimeout(r, 35));
  await vision.stop();
  unsubVision();
  if (visionFrames < 1) {
    throw new Error("vision source emitted no frames");
  }

  const classifier = createSignClassifierSource({
    consecutiveFrames: 3,
    minConfidence: 0.5,
  });
  const glossParser = createRuleBasedGlossParser();
  const avatar = createHeadlessAvatarRenderer();

  // Deterministic ASL pose stream → stable SignSequence (Agent 2).
  ingestPose(classifier, syntheticPoses.hello(), 4, 1_000);
  ingestPose(classifier, syntheticPoses.you(), 4, 2_000);
  ingestPose(classifier, syntheticPoses.thanks(), 4, 3_000);
  const sequence = classifier.flush();
  if (!sequence || sequence.signs.length === 0) {
    throw new Error("integrated classifier produced no stable signs");
  }

  const english = await glossParser.signsToEnglish(sequence);
  const gloss = await glossParser.englishToGloss({
    schemaVersion: "1.0.0",
    inputId: `from-${sequence.sequenceId}`,
    text: english.text,
    locale: "en-US",
    origin: "system",
  });
  const animation = glossToAnimationCommand(gloss);
  await avatar.load();
  await avatar.play(animation);

  const shellHtml = renderShellMarkup(
    createShellViewModel({
      mode: "sign_to_english",
      english,
      gloss,
      animation,
      signSequence: sequence,
      useMocks: false,
    }),
  );

  return { english, gloss, animation, sequence, shellHtml };
}
