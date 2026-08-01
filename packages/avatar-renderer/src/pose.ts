import type { AnimationClipCommand, NonManualMarkers } from "@teto/contracts";

/** Named pose parameters / joint angles for UI debugging. */
export interface PoseSnapshot {
  timeMs: number;
  clipId: string | null;
  tokenId: string | null;
  /** Blend weight of the active clip in [0, 1] (accounts for blendIn/Out). */
  clipWeight: number;
  /** Simple named channels — angles in approximate degrees or unit weights. */
  joints: Record<string, number>;
  nmm: NonManualMarkers | null;
}

const NEUTRAL_JOINTS: Readonly<Record<string, number>> = {
  wristFlex: 0,
  wristDeviation: 0,
  elbowFlex: 40,
  shoulderFlex: 20,
  shoulderAbduct: 15,
  headYaw: 0,
  headPitch: 0,
  browRaise: 0,
};

/**
 * Derive a lightweight pose snapshot from the active clip and playhead.
 * Not a full IK solve — enough for UI debug overlays.
 */
export function derivePoseSnapshot(
  timeMs: number,
  clip: AnimationClipCommand | null,
): PoseSnapshot {
  if (!clip) {
    return {
      timeMs,
      clipId: null,
      tokenId: null,
      clipWeight: 0,
      joints: { ...NEUTRAL_JOINTS },
      nmm: null,
    };
  }

  const localT = timeMs - clip.startMs;
  const weight = clipBlendWeight(localT, clip);
  const joints: Record<string, number> = { ...NEUTRAL_JOINTS };

  // Deterministic pseudo-pose from clip id so different signs look distinct in debug.
  const seed = hashString(clip.clipId);
  joints.wristFlex = lerp(0, -20 + (seed % 40), weight);
  joints.wristDeviation = lerp(0, -10 + ((seed >> 3) % 20), weight);
  joints.elbowFlex = lerp(40, 50 + ((seed >> 5) % 30), weight);
  joints.shoulderFlex = lerp(20, 25 + ((seed >> 7) % 35), weight);
  joints.shoulderAbduct = lerp(15, 10 + ((seed >> 9) % 40), weight);

  if (clip.nmm) {
    joints.headYaw = headYawFromNmm(clip.nmm) * weight;
    joints.headPitch = headPitchFromNmm(clip.nmm) * weight;
    joints.browRaise = browFromNmm(clip.nmm) * weight;
  }

  if (clip.poseOverrides) {
    for (const [key, value] of Object.entries(clip.poseOverrides)) {
      joints[key] = value * weight;
    }
  }

  return {
    timeMs,
    clipId: clip.clipId,
    tokenId: clip.tokenId,
    clipWeight: weight,
    joints,
    nmm: clip.nmm ? { ...clip.nmm } : null,
  };
}

function clipBlendWeight(localT: number, clip: AnimationClipCommand): number {
  if (clip.durationMs <= 0) return 0;
  if (localT < 0 || localT >= clip.durationMs) return 0;

  let w = 1;
  if (clip.blendInMs > 0 && localT < clip.blendInMs) {
    w = Math.min(w, localT / clip.blendInMs);
  }
  const outStart = clip.durationMs - clip.blendOutMs;
  if (clip.blendOutMs > 0 && localT > outStart) {
    w = Math.min(w, (clip.durationMs - localT) / clip.blendOutMs);
  }
  return Math.max(0, Math.min(1, w));
}

function headYawFromNmm(nmm: NonManualMarkers): number {
  switch (nmm.head) {
    case "tilt-left":
      return -15;
    case "tilt-right":
      return 15;
    case "shake":
      return 8;
    default:
      return 0;
  }
}

function headPitchFromNmm(nmm: NonManualMarkers): number {
  switch (nmm.head) {
    case "nod":
      return 12;
    case "tilt-forward":
      return 10;
    default:
      return 0;
  }
}

function browFromNmm(nmm: NonManualMarkers): number {
  switch (nmm.brow) {
    case "raised":
      return 1;
    case "furrowed":
      return -1;
    default:
      return 0;
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}
