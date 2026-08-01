import type { GlossToken } from "@teto/contracts";

/** Well-known fallback clip ids used when a gloss has no dedicated asset. */
export const FALLBACK_CLIPS = {
  HOLD: "clip.HOLD",
  FINGERSPELL: "clip.FINGERSPELL",
  UNKNOWN: "clip.UNKNOWN",
} as const;

export type FallbackClipId =
  (typeof FALLBACK_CLIPS)[keyof typeof FALLBACK_CLIPS];

/** Default MVP vocabulary: gloss token → clip id. */
const DEFAULT_GLOSS_CLIPS: Readonly<Record<string, string>> = {
  HELLO: "clip.HELLO",
  HOW: "clip.HOW",
  YOU: "clip.YOU",
  ME: "clip.ME",
  THANK: "clip.THANK",
  "THANK-YOU": "clip.THANK-YOU",
  PLEASE: "clip.PLEASE",
  YES: "clip.YES",
  NO: "clip.NO",
  NAME: "clip.NAME",
  WHAT: "clip.WHAT",
  WHERE: "clip.WHERE",
  GOOD: "clip.GOOD",
  BYE: "clip.BYE",
  "IX-1": "clip.IX-1",
  "IX-2": "clip.IX-2",
  "IX-3": "clip.IX-3",
};

export interface ClipLibrary {
  /** Resolve a gloss string to a clip id, or undefined if unknown. */
  lookup(gloss: string): string | undefined;
  /** Resolve a full gloss token (role / fingerspell aware) to a clip id. */
  resolveToken(token: GlossToken): string;
  /** Whether the library has a dedicated clip for this gloss. */
  has(gloss: string): boolean;
  /** All registered gloss → clipId entries. */
  entries(): ReadonlyMap<string, string>;
}

export interface ClipLibraryOptions {
  /** Extra / override gloss → clipId mappings. */
  clips?: Readonly<Record<string, string>>;
}

/**
 * Map ASL gloss tokens to animation clip ids.
 * Falls back to HOLD / FINGERSPELL / UNKNOWN based on token role.
 */
export function createClipLibrary(
  options: ClipLibraryOptions = {},
): ClipLibrary {
  const map = new Map<string, string>(Object.entries(DEFAULT_GLOSS_CLIPS));
  if (options.clips) {
    for (const [gloss, clipId] of Object.entries(options.clips)) {
      map.set(normalizeGloss(gloss), clipId);
    }
  }

  return {
    lookup(gloss: string): string | undefined {
      return map.get(normalizeGloss(gloss));
    },

    has(gloss: string): boolean {
      return map.has(normalizeGloss(gloss));
    },

    entries(): ReadonlyMap<string, string> {
      return map;
    },

    resolveToken(token: GlossToken): string {
      if (token.role === "hold" || token.role === "pause") {
        return FALLBACK_CLIPS.HOLD;
      }
      if (token.role === "fingerspell" || token.fingerspell) {
        return FALLBACK_CLIPS.FINGERSPELL;
      }
      const known = map.get(normalizeGloss(token.gloss));
      if (known) return known;
      // Classifier without a dedicated clip still needs a safe fallback.
      if (token.role === "classifier") {
        return FALLBACK_CLIPS.UNKNOWN;
      }
      return FALLBACK_CLIPS.UNKNOWN;
    },
  };
}

/** Shared default library used by gloss→command mapping. */
export const defaultClipLibrary: ClipLibrary = createClipLibrary();

function normalizeGloss(gloss: string): string {
  return gloss.trim().toUpperCase();
}
