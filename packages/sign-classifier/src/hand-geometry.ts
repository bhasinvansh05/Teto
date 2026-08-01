import type { Landmark } from "@teto/contracts";

/** MediaPipe Hands landmark indices. */
export const WRIST = 0;
export const THUMB_CMC = 1;
export const THUMB_MCP = 2;
export const THUMB_IP = 3;
export const THUMB_TIP = 4;
export const INDEX_MCP = 5;
export const INDEX_PIP = 6;
export const INDEX_DIP = 7;
export const INDEX_TIP = 8;
export const MIDDLE_MCP = 9;
export const MIDDLE_PIP = 10;
export const MIDDLE_DIP = 11;
export const MIDDLE_TIP = 12;
export const RING_MCP = 13;
export const RING_PIP = 14;
export const RING_DIP = 15;
export const RING_TIP = 16;
export const PINKY_MCP = 17;
export const PINKY_PIP = 18;
export const PINKY_DIP = 19;
export const PINKY_TIP = 20;

export interface HandFeatures {
  /** Per-finger extension ratio (tip−wrist / mcp−wrist); higher = more extended. */
  thumbExt: number;
  indexExt: number;
  middleExt: number;
  ringExt: number;
  pinkyExt: number;
  /** Mean of index–pinky extension ratios. */
  openness: number;
  /** True when finger tip is farther from wrist than PIP (roughly extended). */
  thumbUp: boolean;
  indexUp: boolean;
  middleUp: boolean;
  ringUp: boolean;
  pinkyUp: boolean;
  wristX: number;
  wristY: number;
  /** Average fingertip y (lower value = higher in frame). */
  tipY: number;
  /** Spread of index–pinky tips relative to hand size. */
  tipSpread: number;
}

function dist(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.hypot(dx, dy, dz);
}

function extensionRatio(
  landmarks: Landmark[],
  tip: number,
  mcp: number,
): number {
  const wrist = landmarks[WRIST]!;
  const tipD = dist(landmarks[tip]!, wrist);
  const mcpD = dist(landmarks[mcp]!, wrist);
  if (mcpD < 1e-6) return 0;
  return tipD / mcpD;
}

function isExtended(
  landmarks: Landmark[],
  tip: number,
  pip: number,
): boolean {
  const wrist = landmarks[WRIST]!;
  return dist(landmarks[tip]!, wrist) > dist(landmarks[pip]!, wrist) * 1.05;
}

function isThumbExtended(landmarks: Landmark[]): boolean {
  const tip = landmarks[THUMB_TIP]!;
  const ip = landmarks[THUMB_IP]!;
  const mcp = landmarks[THUMB_MCP]!;
  // Thumb: tip farther from MCP than IP is from MCP, and tip away from palm.
  return dist(tip, mcp) > dist(ip, mcp) * 1.1;
}

/** Extract geometry features from a present 21-landmark hand. */
export function extractHandFeatures(landmarks: Landmark[]): HandFeatures {
  const thumbExt = extensionRatio(landmarks, THUMB_TIP, THUMB_MCP);
  const indexExt = extensionRatio(landmarks, INDEX_TIP, INDEX_MCP);
  const middleExt = extensionRatio(landmarks, MIDDLE_TIP, MIDDLE_MCP);
  const ringExt = extensionRatio(landmarks, RING_TIP, RING_MCP);
  const pinkyExt = extensionRatio(landmarks, PINKY_TIP, PINKY_MCP);

  const tips = [
    landmarks[INDEX_TIP]!,
    landmarks[MIDDLE_TIP]!,
    landmarks[RING_TIP]!,
    landmarks[PINKY_TIP]!,
  ];
  const tipY = tips.reduce((s, t) => s + t.y, 0) / tips.length;
  const tipXs = tips.map((t) => t.x);
  const tipSpread = Math.max(...tipXs) - Math.min(...tipXs);

  return {
    thumbExt,
    indexExt,
    middleExt,
    ringExt,
    pinkyExt,
    openness: (indexExt + middleExt + ringExt + pinkyExt) / 4,
    thumbUp: isThumbExtended(landmarks),
    indexUp: isExtended(landmarks, INDEX_TIP, INDEX_PIP),
    middleUp: isExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP),
    ringUp: isExtended(landmarks, RING_TIP, RING_PIP),
    pinkyUp: isExtended(landmarks, PINKY_TIP, PINKY_PIP),
    wristX: landmarks[WRIST]!.x,
    wristY: landmarks[WRIST]!.y,
    tipY,
    tipSpread,
  };
}
