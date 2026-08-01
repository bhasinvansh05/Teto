import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mockAnimationCommand,
  mockEnglishSentence,
  mockGlossSequence,
  mockSignSequence,
  mocks,
} from "@teto/contracts";
import {
  createShellState,
  getModePresentation,
  modeLabel,
  setMode,
  toggleMode,
} from "./mode.js";
import {
  renderAvatarStage,
  renderCameraStage,
  renderGlossTicker,
  renderModeToggle,
  renderTranscriptPanel,
} from "./components/index.js";
import {
  animationDurationMs,
  createShellViewModel,
  glossText,
  renderMockedShell,
  renderShellMarkup,
  signLabels,
} from "./shell.js";

describe("@teto/ui-shell mode", () => {
  it("toggles modes", () => {
    const next = toggleMode(createShellState("sign_to_english"));
    assert.equal(next.mode, "english_to_sign");
    assert.match(next.statusText, /Type or speak/i);
  });

  it("toggles back to sign_to_english", () => {
    const next = toggleMode(createShellState("english_to_sign"));
    assert.equal(next.mode, "sign_to_english");
    assert.match(next.statusText, /camera/i);
  });

  it("setMode is a no-op when unchanged", () => {
    const state = createShellState("sign_to_english");
    assert.equal(setMode(state, "sign_to_english"), state);
  });

  it("exposes presentation copy per mode", () => {
    const s2e = getModePresentation("sign_to_english");
    const e2s = getModePresentation("english_to_sign");
    assert.equal(s2e.stageRole, "camera");
    assert.equal(e2s.stageRole, "avatar");
    assert.equal(modeLabel("sign_to_english"), "Sign → English");
    assert.equal(modeLabel("english_to_sign"), "English → Sign");
  });
});

describe("@teto/ui-shell view-model", () => {
  it("hydrates from contract mocks by default", () => {
    const vm = createShellViewModel();
    assert.equal(vm.usingMocks, true);
    assert.equal(vm.english?.text, mocks.englishSentence.text);
    assert.equal(vm.gloss?.glossId, mocks.glossSequence.glossId);
    assert.equal(vm.animation?.commandId, mocks.animationCommand.commandId);
    assert.equal(vm.englishInput?.inputId, mocks.englishInput.inputId);
    assert.equal(vm.signSequence?.sequenceId, mocks.signSequence.sequenceId);
  });

  it("can omit mocks when useMocks is false", () => {
    const vm = createShellViewModel({ useMocks: false });
    assert.equal(vm.english, undefined);
    assert.equal(vm.gloss, undefined);
    assert.equal(vm.animation, undefined);
  });

  it("computes gloss text and animation duration helpers", () => {
    assert.equal(glossText(mockGlossSequence), "HELLO HOW YOU");
    assert.equal(glossText(undefined), "");
    assert.equal(animationDurationMs(mockAnimationCommand), 1390);
    assert.deepEqual(signLabels(mockSignSequence), ["HELLO", "HOW", "YOU"]);
  });
});

describe("@teto/ui-shell components", () => {
  it("ModeToggle marks the active mode", () => {
    const html = renderModeToggle({ mode: "english_to_sign" });
    assert.match(html, /data-active-mode="english_to_sign"/);
    assert.match(html, /aria-checked="true"/);
    assert.match(html, /data-mode="english_to_sign"/);
    assert.match(html, /English → Sign/);
  });

  it("TranscriptPanel renders EnglishSentence text", () => {
    const html = renderTranscriptPanel({ english: mockEnglishSentence });
    assert.match(html, /Hello, how are you\?/);
    assert.match(html, /data-sentence-id="s-000003"/);
    assert.match(html, /Confidence 88%/);
  });

  it("GlossTicker renders GlossSequence tokens", () => {
    const html = renderGlossTicker({ gloss: mockGlossSequence });
    assert.match(html, /data-gloss-id="g-000007"/);
    assert.match(html, /data-token-id="t0"/);
    assert.match(html, />HELLO</);
    assert.match(html, />HOW</);
    assert.match(html, />YOU</);
  });

  it("AvatarStage consumes AnimationCommand metadata", () => {
    const html = renderAvatarStage({ animation: mockAnimationCommand, active: true });
    assert.match(html, /data-command-id="anim-000019"/);
    assert.match(html, /data-clip-count="3"/);
    assert.match(html, /data-duration-ms="1390"/);
    assert.match(html, /clip\.HELLO/);
  });

  it("CameraStage shows stable SignSequence labels", () => {
    const html = renderCameraStage({ signSequence: mockSignSequence, active: true });
    assert.match(html, /data-sequence-id="seq-000042"/);
    assert.match(html, /HELLO · HOW · YOU/);
  });
});

describe("@teto/ui-shell markup", () => {
  it("renders shell with brand Teto and mocked english/gloss", () => {
    const html = renderShellMarkup({
      state: createShellState(),
      presentation: getModePresentation("sign_to_english"),
      english: mockEnglishSentence,
      gloss: mockGlossSequence,
      usingMocks: true,
    });
    assert.match(html, /Teto/);
    assert.match(html, /Hello, how are you\?/);
    assert.match(html, /HELLO HOW YOU/);
    assert.match(html, /data-mode="sign_to_english"/);
    assert.match(html, /teto-camera-stage is-active/);
  });

  it("switches dominant stage for english_to_sign", () => {
    const html = renderShellMarkup(
      createShellViewModel({ mode: "english_to_sign" }),
    );
    assert.match(html, /data-mode="english_to_sign"/);
    assert.match(html, /teto-avatar-stage is-active/);
    assert.match(html, /Watch language take shape/);
  });

  it("renderMockedShell wires contract mocks end-to-end", () => {
    const html = renderMockedShell("sign_to_english");
    assert.match(html, /class="teto-brand"/);
    assert.match(html, /Hello, how are you\?/);
    assert.match(html, /HELLO/);
    assert.match(html, /data-using-mocks="true"/);
  });
});
