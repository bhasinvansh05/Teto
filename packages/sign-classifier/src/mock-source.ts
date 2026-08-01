import {
  type LandmarkFrame,
  type SignSequence,
  type SignSequenceSource,
  mockSignSequence,
} from "@teto/contracts";

/** Emits the canonical mock sequence after ingesting any frame. Replace with model. */
export function createMockSignSequenceSource(): SignSequenceSource {
  const listeners = new Set<(sequence: SignSequence) => void>();
  let last: SignSequence | null = null;
  let seq = 1;

  return {
    ingest(_frame: LandmarkFrame) {
      last = {
        ...mockSignSequence,
        sequenceId: `seq-${String(seq++).padStart(6, "0")}`,
        startedAtMs: Date.now() - 2400,
        endedAtMs: Date.now(),
      };
      for (const listener of listeners) listener(last);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    flush() {
      return last;
    },
  };
}
