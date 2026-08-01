import type { Landmark, LandmarkFrame } from "@teto/contracts";
import { SCHEMA_VERSION } from "@teto/contracts";
import {
  INDEX_MCP,
  INDEX_PIP,
  INDEX_TIP,
  MIDDLE_MCP,
  MIDDLE_PIP,
  MIDDLE_TIP,
  PINKY_MCP,
  PINKY_PIP,
  PINKY_TIP,
  RING_MCP,
  RING_PIP,
  RING_TIP,
  THUMB_CMC,
  THUMB_IP,
  THUMB_MCP,
  THUMB_TIP,
  WRIST,
} from "./hand-geometry.js";

function lm(x: number, y: number, z = 0): Landmark {
  return {
    x: Math.min(0.99, Math.max(0.01, x)),
    y: Math.min(0.99, Math.max(0.01, y)),
    z,
    visibility: 1,
  };
}

/** Build a 21-point right hand with given tip offsets from a neutral palm. */
export function buildHandLandmarks(opts: {
  wristX?: number;
  wristY?: number;
  /** Which fingers are extended (tips farther from wrist). */
  extended?: {
    thumb?: boolean;
    index?: boolean;
    middle?: boolean;
    ring?: boolean;
    pinky?: boolean;
  };
}): Landmark[] {
  const wx = opts.wristX ?? 0.55;
  const wy = opts.wristY ?? 0.5;
  const ext = opts.extended ?? {};

  const landmarks: Landmark[] = Array.from({ length: 21 }, () =>
    lm(wx, wy),
  );

  landmarks[WRIST] = lm(wx, wy);

  // Thumb chain (sideways)
  landmarks[THUMB_CMC] = lm(wx - 0.02, wy - 0.01);
  landmarks[THUMB_MCP] = lm(wx - 0.04, wy - 0.02);
  landmarks[THUMB_IP] = lm(wx - 0.05, wy - 0.03);
  landmarks[THUMB_TIP] = ext.thumb
    ? lm(wx - 0.09, wy - 0.06)
    : lm(wx - 0.03, wy - 0.01);

  // Index (curled tips stay near MCP so extension ratio < 1)
  landmarks[INDEX_MCP] = lm(wx - 0.01, wy - 0.04);
  landmarks[INDEX_PIP] = lm(wx - 0.01, wy - 0.07);
  landmarks[INDEX_TIP] = ext.index
    ? lm(wx - 0.01, wy - 0.16)
    : lm(wx - 0.01, wy - 0.03);

  // Middle
  landmarks[MIDDLE_MCP] = lm(wx + 0.01, wy - 0.04);
  landmarks[MIDDLE_PIP] = lm(wx + 0.01, wy - 0.07);
  landmarks[MIDDLE_TIP] = ext.middle
    ? lm(wx + 0.01, wy - 0.17)
    : lm(wx + 0.01, wy - 0.03);

  // Ring
  landmarks[RING_MCP] = lm(wx + 0.03, wy - 0.04);
  landmarks[RING_PIP] = lm(wx + 0.03, wy - 0.065);
  landmarks[RING_TIP] = ext.ring
    ? lm(wx + 0.03, wy - 0.15)
    : lm(wx + 0.03, wy - 0.03);

  // Pinky
  landmarks[PINKY_MCP] = lm(wx + 0.05, wy - 0.03);
  landmarks[PINKY_PIP] = lm(wx + 0.05, wy - 0.055);
  landmarks[PINKY_TIP] = ext.pinky
    ? lm(wx + 0.05, wy - 0.13)
    : lm(wx + 0.05, wy - 0.025);

  return landmarks;
}

export function makeFrame(
  landmarks: Landmark[],
  overrides: Partial<LandmarkFrame> & { timestampMs?: number } = {},
): LandmarkFrame {
  return {
    schemaVersion: SCHEMA_VERSION,
    timestampMs: overrides.timestampMs ?? 1_710_000_000_000,
    frameId: overrides.frameId ?? "f-test",
    imageSize: overrides.imageSize ?? { width: 1280, height: 720 },
    hands: {
      left: overrides.hands?.left ?? { present: false, landmarks: [] },
      right: overrides.hands?.right ?? {
        present: true,
        landmarks,
      },
    },
    pose: overrides.pose ?? { present: false, landmarks: [] },
  };
}

/** Synthetic poses tuned for HeuristicSignModel. */
export const syntheticPoses = {
  hello: () =>
    buildHandLandmarks({
      wristX: 0.6,
      wristY: 0.3,
      extended: {
        thumb: true,
        index: true,
        middle: true,
        ring: true,
        pinky: true,
      },
    }),
  you: () =>
    buildHandLandmarks({
      wristX: 0.55,
      wristY: 0.5,
      extended: { index: true },
    }),
  yes: () =>
    buildHandLandmarks({
      wristX: 0.55,
      wristY: 0.5,
      extended: {},
    }),
  no: () =>
    buildHandLandmarks({
      wristX: 0.55,
      wristY: 0.5,
      extended: { index: true, middle: true },
    }),
  good: () =>
    buildHandLandmarks({
      wristX: 0.55,
      wristY: 0.5,
      extended: { thumb: true },
    }),
  ily: () =>
    buildHandLandmarks({
      wristX: 0.55,
      wristY: 0.45,
      extended: { thumb: true, index: true, pinky: true },
    }),
  thanks: () =>
    buildHandLandmarks({
      wristX: 0.5,
      wristY: 0.45,
      extended: {
        thumb: true,
        index: true,
        middle: true,
        ring: true,
        pinky: true,
      },
    }),
  please: () =>
    buildHandLandmarks({
      wristX: 0.5,
      wristY: 0.55,
      extended: {
        thumb: true,
        index: true,
        middle: true,
        ring: true,
        pinky: true,
      },
    }),
};
