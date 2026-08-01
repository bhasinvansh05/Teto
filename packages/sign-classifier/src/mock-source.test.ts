import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertSignSequence, mockLandmarkFrame } from "@teto/contracts";
import { createMockSignSequenceSource } from "./mock-source.js";

describe("@teto/sign-classifier mock source", () => {
  it("emits contract-valid SignSequence on ingest", () => {
    const source = createMockSignSequenceSource();
    let received: unknown;
    source.subscribe((seq) => {
      received = seq;
    });
    source.ingest(mockLandmarkFrame);
    assertSignSequence(received);
    assert.ok(source.flush());
  });
});