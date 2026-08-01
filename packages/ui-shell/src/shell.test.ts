import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mockEnglishSentence, mockGlossSequence } from "@teto/contracts";
import { createShellState, toggleMode } from "./mode.js";
import { renderShellMarkup } from "./shell.js";

describe("@teto/ui-shell", () => {
  it("toggles modes", () => {
    const next = toggleMode(createShellState("sign_to_english"));
    assert.equal(next.mode, "english_to_sign");
  });

  it("renders shell with mocked contract data", () => {
    const html = renderShellMarkup({
      state: createShellState(),
      english: mockEnglishSentence,
      gloss: mockGlossSequence,
    });
    assert.match(html, /Teto/);
    assert.match(html, /Hello, how are you\?/);
    assert.match(html, /HELLO HOW YOU/);
  });
});
