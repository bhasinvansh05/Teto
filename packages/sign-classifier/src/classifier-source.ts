import {
  SCHEMA_VERSION,
  assertSignSequence,
  type DetectedSign,
  type LandmarkFrame,
  type SignSequence,
  type SignSequenceSource,
} from "@teto/contracts";
import { createHeuristicSignModel } from "./heuristic-model.js";
import { TemporalSmoother } from "./temporal-smoother.js";
import type { SignClassifierSourceOptions, SignModel } from "./types.js";

/**
 * Real SignSequenceSource: ingest LandmarkFrames → model predict →
 * temporal debounce → emit contract-valid SignSequence payloads.
 */
export function createSignClassifierSource(
  options: SignClassifierSourceOptions = {},
): SignSequenceSource {
  const model: SignModel = options.model ?? createHeuristicSignModel();
  const smoother = new TemporalSmoother({
    consecutiveFrames: options.consecutiveFrames,
    minConfidence: options.minConfidence,
  });

  const listeners = new Set<(sequence: SignSequence) => void>();
  const signs: DetectedSign[] = [];
  let sequenceId = 1;
  let startedAtMs: number | null = null;
  let lastSequence: SignSequence | null = null;

  function buildSequence(endedAtMs: number): SignSequence {
    const seq: SignSequence = {
      schemaVersion: SCHEMA_VERSION,
      sequenceId: `seq-${String(sequenceId).padStart(6, "0")}`,
      startedAtMs: startedAtMs ?? endedAtMs,
      endedAtMs,
      signs: [...signs],
    };
    assertSignSequence(seq);
    return seq;
  }

  function emit(seq: SignSequence): void {
    lastSequence = seq;
    for (const listener of listeners) listener(seq);
  }

  return {
    ingest(frame: LandmarkFrame) {
      const prediction = model.predict(frame);
      const stable = smoother.push(prediction, frame.timestampMs);
      if (!stable) return;

      if (startedAtMs === null) {
        startedAtMs = stable.startedAtMs;
      }
      signs.push(stable);
      emit(buildSequence(stable.endedAtMs));
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    flush() {
      if (signs.length === 0) {
        return lastSequence;
      }
      const endedAtMs =
        signs[signs.length - 1]?.endedAtMs ?? startedAtMs ?? Date.now();
      const seq = buildSequence(endedAtMs);
      lastSequence = seq;
      // Start a fresh sequence window after flush
      sequenceId += 1;
      signs.length = 0;
      startedAtMs = null;
      smoother.reset();
      return seq;
    },
  };
}
