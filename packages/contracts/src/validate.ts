import type {
  AnimationCommand,
  EnglishInput,
  EnglishSentence,
  GlossSequence,
  LandmarkFrame,
  SignSequence,
} from "./types.js";
import { SCHEMA_VERSION } from "./types.js";

export class ContractValidationError extends Error {
  constructor(
    message: string,
    readonly path: string = "",
  ) {
    super(path ? `${path}: ${message}` : message);
    this.name = "ContractValidationError";
  }
}

function assert(
  condition: unknown,
  message: string,
  path = "",
): asserts condition {
  if (!condition) {
    throw new ContractValidationError(message, path);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertSchemaVersion(value: unknown, path: string): void {
  assert(value === SCHEMA_VERSION, `expected schemaVersion ${SCHEMA_VERSION}`, path);
}

function assertLandmark(value: unknown, path: string): void {
  assert(isObject(value), "expected landmark object", path);
  assert(typeof value.x === "number" && value.x >= 0 && value.x <= 1, "x in [0,1]", `${path}.x`);
  assert(typeof value.y === "number" && value.y >= 0 && value.y <= 1, "y in [0,1]", `${path}.y`);
  assert(typeof value.z === "number", "z number", `${path}.z`);
  assert(
    typeof value.visibility === "number" &&
      value.visibility >= 0 &&
      value.visibility <= 1,
    "visibility in [0,1]",
    `${path}.visibility`,
  );
}

function assertHand(value: unknown, path: string): void {
  assert(isObject(value), "expected hand observation", path);
  assert(typeof value.present === "boolean", "present boolean", `${path}.present`);
  assert(Array.isArray(value.landmarks), "landmarks array", `${path}.landmarks`);
  assert(value.landmarks.length <= 21, "max 21 hand landmarks", `${path}.landmarks`);
  if (value.present) {
    assert(
      value.landmarks.length === 21,
      "present hand must have 21 landmarks",
      `${path}.landmarks`,
    );
  }
  value.landmarks.forEach((lm, i) => assertLandmark(lm, `${path}.landmarks[${i}]`));
}

export function assertLandmarkFrame(value: unknown): asserts value is LandmarkFrame {
  assert(isObject(value), "expected LandmarkFrame object");
  assertSchemaVersion(value.schemaVersion, "schemaVersion");
  assert(typeof value.timestampMs === "number", "timestampMs number", "timestampMs");
  assert(typeof value.frameId === "string" && value.frameId.length > 0, "frameId", "frameId");
  assert(isObject(value.imageSize), "imageSize object", "imageSize");
  assert(
    typeof value.imageSize.width === "number" && value.imageSize.width > 0,
    "width > 0",
    "imageSize.width",
  );
  assert(
    typeof value.imageSize.height === "number" && value.imageSize.height > 0,
    "height > 0",
    "imageSize.height",
  );
  assert(isObject(value.hands), "hands object", "hands");
  assertHand(value.hands.left, "hands.left");
  assertHand(value.hands.right, "hands.right");
  assert(isObject(value.pose), "pose object", "pose");
  assert(typeof value.pose.present === "boolean", "present boolean", "pose.present");
  assert(Array.isArray(value.pose.landmarks), "landmarks array", "pose.landmarks");
  assert(value.pose.landmarks.length <= 33, "max 33 pose landmarks", "pose.landmarks");
  value.pose.landmarks.forEach((lm, i) =>
    assertLandmark(lm, `pose.landmarks[${i}]`),
  );
}

export function assertSignSequence(value: unknown): asserts value is SignSequence {
  assert(isObject(value), "expected SignSequence object");
  assertSchemaVersion(value.schemaVersion, "schemaVersion");
  assert(typeof value.sequenceId === "string" && value.sequenceId.length > 0, "sequenceId");
  assert(typeof value.startedAtMs === "number", "startedAtMs");
  assert(typeof value.endedAtMs === "number", "endedAtMs");
  assert(Array.isArray(value.signs), "signs array");
  for (const [i, sign] of value.signs.entries()) {
    const path = `signs[${i}]`;
    assert(isObject(sign), "sign object", path);
    assert(
      typeof sign.label === "string" && /^[A-Z0-9][A-Z0-9-]*$/.test(sign.label),
      "label uppercase gloss token",
      `${path}.label`,
    );
    assert(
      typeof sign.confidence === "number" &&
        sign.confidence >= 0 &&
        sign.confidence <= 1,
      "confidence [0,1]",
      `${path}.confidence`,
    );
    assert(typeof sign.startedAtMs === "number", "startedAtMs", `${path}.startedAtMs`);
    assert(typeof sign.endedAtMs === "number", "endedAtMs", `${path}.endedAtMs`);
    assert(typeof sign.stable === "boolean", "stable", `${path}.stable`);
  }
}

export function assertGlossSequence(value: unknown): asserts value is GlossSequence {
  assert(isObject(value), "expected GlossSequence object");
  assertSchemaVersion(value.schemaVersion, "schemaVersion");
  assert(typeof value.glossId === "string" && value.glossId.length > 0, "glossId");
  assert(
    value.direction === "en_to_asl" || value.direction === "asl_to_en",
    "direction",
    "direction",
  );
  assert(typeof value.sourceText === "string", "sourceText");
  assert(Array.isArray(value.tokens), "tokens array");
  for (const [i, token] of value.tokens.entries()) {
    const path = `tokens[${i}]`;
    assert(isObject(token), "token object", path);
    assert(typeof token.id === "string", "id", `${path}.id`);
    assert(typeof token.gloss === "string", "gloss", `${path}.gloss`);
    assert(
      ["sign", "fingerspell", "classifier", "pause", "hold"].includes(
        token.role as string,
      ),
      "role",
      `${path}.role`,
    );
    assert(typeof token.fingerspell === "boolean", "fingerspell", `${path}.fingerspell`);
    assert(typeof token.durationMs === "number", "durationMs", `${path}.durationMs`);
    assert(
      ["reduced", "normal", "stressed"].includes(token.emphasis as string),
      "emphasis",
      `${path}.emphasis`,
    );
  }
}

export function assertEnglishSentence(
  value: unknown,
): asserts value is EnglishSentence {
  assert(isObject(value), "expected EnglishSentence object");
  assertSchemaVersion(value.schemaVersion, "schemaVersion");
  assert(typeof value.sentenceId === "string", "sentenceId");
  assert(typeof value.text === "string" && value.text.length > 0, "text");
  assert(
    typeof value.confidence === "number" &&
      value.confidence >= 0 &&
      value.confidence <= 1,
    "confidence",
  );
}

export function assertEnglishInput(value: unknown): asserts value is EnglishInput {
  assert(isObject(value), "expected EnglishInput object");
  assertSchemaVersion(value.schemaVersion, "schemaVersion");
  assert(typeof value.inputId === "string", "inputId");
  assert(typeof value.text === "string" && value.text.length > 0, "text");
  assert(typeof value.locale === "string", "locale");
  assert(
    value.origin === "typed" || value.origin === "speech" || value.origin === "system",
    "origin",
  );
}

export function assertAnimationCommand(
  value: unknown,
): asserts value is AnimationCommand {
  assert(isObject(value), "expected AnimationCommand object");
  assertSchemaVersion(value.schemaVersion, "schemaVersion");
  assert(typeof value.commandId === "string", "commandId");
  assert(typeof value.glossId === "string", "glossId");
  assert(typeof value.playbackRate === "number" && value.playbackRate > 0, "playbackRate");
  assert(Array.isArray(value.clips), "clips array");
  for (const [i, clip] of value.clips.entries()) {
    const path = `clips[${i}]`;
    assert(isObject(clip), "clip object", path);
    assert(typeof clip.tokenId === "string", "tokenId", `${path}.tokenId`);
    assert(typeof clip.clipId === "string", "clipId", `${path}.clipId`);
    assert(typeof clip.startMs === "number", "startMs", `${path}.startMs`);
    assert(typeof clip.durationMs === "number", "durationMs", `${path}.durationMs`);
    assert(typeof clip.blendInMs === "number", "blendInMs", `${path}.blendInMs`);
    assert(typeof clip.blendOutMs === "number", "blendOutMs", `${path}.blendOutMs`);
  }
}
