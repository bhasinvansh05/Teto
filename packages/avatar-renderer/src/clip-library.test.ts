import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GlossToken } from "@teto/contracts";
import {
  createClipLibrary,
  defaultClipLibrary,
  FALLBACK_CLIPS,
} from "./clip-library.js";

function token(partial: Partial<GlossToken> & Pick<GlossToken, "gloss">): GlossToken {
  return {
    id: partial.id ?? "t",
    gloss: partial.gloss,
    role: partial.role ?? "sign",
    fingerspell: partial.fingerspell ?? false,
    durationMs: partial.durationMs ?? 500,
    emphasis: partial.emphasis ?? "normal",
    nmm: partial.nmm,
  };
}

describe("ClipLibrary", () => {
  it("maps known gloss tokens to clipIds", () => {
    assert.equal(defaultClipLibrary.lookup("HELLO"), "clip.HELLO");
    assert.equal(defaultClipLibrary.lookup("hello"), "clip.HELLO");
    assert.equal(defaultClipLibrary.resolveToken(token({ gloss: "HOW" })), "clip.HOW");
    assert.equal(defaultClipLibrary.resolveToken(token({ gloss: "YOU" })), "clip.YOU");
  });

  it("falls back to clip.HOLD for hold/pause roles", () => {
    assert.equal(
      defaultClipLibrary.resolveToken(token({ gloss: "HELLO", role: "hold" })),
      FALLBACK_CLIPS.HOLD,
    );
    assert.equal(
      defaultClipLibrary.resolveToken(token({ gloss: "X", role: "pause" })),
      FALLBACK_CLIPS.HOLD,
    );
  });

  it("falls back to clip.FINGERSPELL for fingerspell tokens", () => {
    assert.equal(
      defaultClipLibrary.resolveToken(
        token({ gloss: "ABC", role: "fingerspell", fingerspell: true }),
      ),
      FALLBACK_CLIPS.FINGERSPELL,
    );
    assert.equal(
      defaultClipLibrary.resolveToken(
        token({ gloss: "HELLO", role: "sign", fingerspell: true }),
      ),
      FALLBACK_CLIPS.FINGERSPELL,
    );
  });

  it("falls back to clip.UNKNOWN for unmapped glosses", () => {
    assert.equal(
      defaultClipLibrary.resolveToken(token({ gloss: "NOT-A-REAL-SIGN" })),
      FALLBACK_CLIPS.UNKNOWN,
    );
    assert.equal(defaultClipLibrary.lookup("NOT-A-REAL-SIGN"), undefined);
  });

  it("accepts custom clip overrides", () => {
    const lib = createClipLibrary({ clips: { CUSTOM: "clip.CUSTOM" } });
    assert.equal(lib.resolveToken(token({ gloss: "CUSTOM" })), "clip.CUSTOM");
    assert.equal(lib.resolveToken(token({ gloss: "HELLO" })), "clip.HELLO");
  });
});
