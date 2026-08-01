import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertLandmarkFrame } from "@teto/contracts";
import { createMockLandmarkFrameSource } from "./mock-source.js";

describe("@teto/vision-capture mock source", () => {
  it("emits contract-valid LandmarkFrame values", async () => {
    const source = createMockLandmarkFrameSource(10);
    const frame = await new Promise<unknown>((resolve, reject) => {
      const unsub = source.subscribe((f) => {
        unsub();
        void source.stop().then(() => resolve(f));
      });
      void source.start().catch(reject);
    });
    assertLandmarkFrame(frame);
    assert.ok(typeof (frame as { frameId: string }).frameId === "string");
  });
});
