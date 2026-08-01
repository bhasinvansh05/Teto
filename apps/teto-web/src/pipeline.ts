import { glossToAnimationCommand, createMockAvatarRenderer } from "@teto/avatar-renderer";
import type { AnimationCommand, EnglishSentence, GlossSequence } from "@teto/contracts";
import { createMockGlossParser } from "@teto/gloss-parser";
import { createMockSignSequenceSource } from "@teto/sign-classifier";
import { createMockLandmarkFrameSource } from "@teto/vision-capture";

export interface PipelineResult {
  english: EnglishSentence;
  gloss: GlossSequence;
  animation: AnimationCommand;
}

/**
 * End-to-end mock pipeline used until real agent packages are wired at
 * integration checkpoints. Orchestrator-owned.
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

  return { english, gloss, animation };
}
