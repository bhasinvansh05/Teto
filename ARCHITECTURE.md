# Teto Architecture

Teto is a bidirectional ASL ↔ English communication app:

1. **Sign → English**: camera landmarks → sign labels → grammatical English
2. **English → Sign**: text/speech → ASL gloss → avatar animation

This document is owned by the **Orchestrator**. All shared interface contracts are defined here and in `packages/contracts`. Agents must build against these contracts; cross-cutting changes go through the Orchestrator.

---

## Agent Ownership

| Agent | Branch | Owns | Does not touch |
| --- | --- | --- | --- |
| Orchestrator | `main` | `ARCHITECTURE.md`, `packages/contracts`, integration, CI | Feature implementations |
| Vision/Capture | `feature/camera-capture` | Camera, MediaPipe, frame buffer | Classifier, gloss, avatar, UI chrome |
| Sign Classification | `feature/sign-classifier` | Landmark → label model, confidence, temporal smoothing | Capture, gloss, avatar, UI chrome |
| Language/Gloss | `feature/gloss-parser` | Sign labels ↔ English / ASL gloss (both directions) | Capture, classifier, avatar, UI chrome |
| Avatar/Rendering | `feature/avatar-renderer` | 3D/rigged avatar, animation engine, gloss→clip mapping | Capture, classifier, gloss logic, UI chrome |
| UI/Design | `feature/ui-shell` | Mode toggle, layout, HIG styling, responsive shell | Pipeline internals (uses mocks) |

**Rule:** No agent modifies another agent's branch. Flag blocking contract gaps to the Orchestrator instead of guessing.

---

## Pipeline Data Flow

```
[Camera] → LandmarkFrameStream → [Classifier] → SignSequence
                                                      ↓
                                              [Gloss Parser]
                                           ↙               ↘
                              EnglishSentence          GlossSequence
                                                           ↓
                                                  [Avatar Renderer]
                                                           ↓
                                                   AnimationCommand
                                                           ↓
                                                      [UI Shell]
```

Reverse path:

```
[UI: text/speech] → EnglishInput → [Gloss Parser] → GlossSequence → [Avatar] → AnimationCommand
```

---

## Interface Contracts

Canonical JSON Schema files live in `packages/contracts/schemas/`.
TypeScript types are generated/hand-maintained in `packages/contracts/src/`.

### 1. Landmark Frame Stream (Agent 1 → Agent 2)

**Schema:** `schemas/landmark-frame.schema.json`  
**Type:** `LandmarkFrame`

Normalized hand/pose landmarks for a single video frame.

```json
{
  "schemaVersion": "1.0.0",
  "timestampMs": 1710000000123,
  "frameId": "f-000001",
  "imageSize": { "width": 1280, "height": 720 },
  "hands": {
    "left": {
      "present": true,
      "landmarks": [{ "x": 0.12, "y": 0.44, "z": -0.02, "visibility": 0.98 }]
    },
    "right": {
      "present": false,
      "landmarks": []
    }
  },
  "pose": {
    "present": true,
    "landmarks": [{ "x": 0.5, "y": 0.2, "z": 0.0, "visibility": 0.99 }]
  }
}
```

**Norms:**
- `x`, `y` in `[0, 1]` relative to frame width/height
- `z` is MediaPipe-relative depth (not meters)
- Always 21 landmarks per present hand (MediaPipe Hands)
- Pose uses MediaPipe Pose subset documented in contracts README (33 points when present)
- Missing hand/pose → `present: false`, empty `landmarks`

**Stream API (logical):**
```ts
interface LandmarkFrameSource {
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: (frame: LandmarkFrame) => void): () => void;
}
```

---

### 2. Detected Sign Sequence (Agent 2 → Agent 3)

**Schema:** `schemas/sign-sequence.schema.json`  
**Type:** `SignSequence`

Temporally smoothed sign labels with confidence.

```json
{
  "schemaVersion": "1.0.0",
  "sequenceId": "seq-000042",
  "startedAtMs": 1710000000000,
  "endedAtMs": 1710000002400,
  "signs": [
    {
      "label": "HELLO",
      "confidence": 0.91,
      "startedAtMs": 1710000000000,
      "endedAtMs": 1710000000800,
      "stable": true
    },
    {
      "label": "YOU",
      "confidence": 0.86,
      "startedAtMs": 1710000001200,
      "endedAtMs": 1710000002000,
      "stable": true
    }
  ]
}
```

**Norms:**
- Labels are uppercase ASL gloss-style tokens (`HELLO`, `THANK-YOU`, `IX-1`)
- `confidence` in `[0, 1]`
- Only emit `stable: true` signs downstream after debounce/smoothing
- Empty `signs` means no detection in the window

**Stream API (logical):**
```ts
interface SignSequenceSource {
  ingest(frame: LandmarkFrame): void;
  subscribe(listener: (sequence: SignSequence) => void): () => void;
  flush(): SignSequence | null;
}
```

---

### 3. Gloss Token Format (Agent 3 ↔ Agent 4 / UI)

**Schema:** `schemas/gloss-sequence.schema.json`  
**Type:** `GlossSequence` / `GlossToken`

```json
{
  "schemaVersion": "1.0.0",
  "glossId": "g-000007",
  "direction": "en_to_asl",
  "sourceText": "Hello, how are you?",
  "tokens": [
    {
      "id": "t0",
      "gloss": "HELLO",
      "role": "sign",
      "fingerspell": false,
      "durationMs": 600,
      "emphasis": "normal",
      "nmm": { "brow": "neutral", "head": "neutral", "eyeGaze": "forward" }
    },
    {
      "id": "t1",
      "gloss": "HOW",
      "role": "sign",
      "fingerspell": false,
      "durationMs": 500,
      "emphasis": "normal",
      "nmm": { "brow": "raised", "head": "tilt-forward", "eyeGaze": "forward" }
    },
    {
      "id": "t2",
      "gloss": "YOU",
      "role": "sign",
      "fingerspell": false,
      "durationMs": 450,
      "emphasis": "normal",
      "nmm": { "brow": "neutral", "head": "neutral", "eyeGaze": "forward" }
    }
  ]
}
```

**Token roles:** `sign` | `fingerspell` | `classifier` | `pause` | `hold`  
**Emphasis:** `reduced` | `normal` | `stressed`  
**NMM** (non-manual markers) optional but preferred for avatar expressiveness.

**Bidirectional services:**
```ts
interface GlossParser {
  signsToEnglish(sequence: SignSequence): Promise<EnglishSentence>;
  englishToGloss(input: EnglishInput): Promise<GlossSequence>;
}
```

---

### 4. English Sentence / Input (Agent 3 ↔ UI)

**Schemas:** `schemas/english-sentence.schema.json`, `schemas/english-input.schema.json`

```json
{
  "schemaVersion": "1.0.0",
  "sentenceId": "s-000003",
  "text": "Hello, how are you?",
  "confidence": 0.88,
  "sourceSequenceId": "seq-000042"
}
```

```json
{
  "schemaVersion": "1.0.0",
  "inputId": "in-000011",
  "text": "Hello, how are you?",
  "locale": "en-US",
  "origin": "typed"
}
```

`origin`: `typed` | `speech` | `system`

---

### 5. Avatar Animation Command (Agent 4 → UI / playback)

**Schema:** `schemas/animation-command.schema.json`  
**Type:** `AnimationCommand`

```json
{
  "schemaVersion": "1.0.0",
  "commandId": "anim-000019",
  "glossId": "g-000007",
  "playbackRate": 1.0,
  "clips": [
    {
      "tokenId": "t0",
      "clipId": "clip.HELLO",
      "startMs": 0,
      "durationMs": 600,
      "blendInMs": 80,
      "blendOutMs": 80,
      "poseOverrides": {},
      "nmm": { "brow": "neutral", "head": "neutral", "eyeGaze": "forward" }
    }
  ]
}
```

**Renderer API (logical):**
```ts
interface AvatarRenderer {
  load(): Promise<void>;
  play(command: AnimationCommand): Promise<void>;
  stop(): void;
  setPlaybackRate(rate: number): void;
}
```

---

## Mock Data

Canonical fixtures for UI and offline tests live in `packages/contracts/mocks/`.

Agents building against unfinished dependencies **must** consume these mocks rather than inventing alternate shapes.

---

## Integration Checkpoints

Orchestrator wires pairs after each MVP — never a big-bang merge:

1. **CP1:** Vision → Classifier (`LandmarkFrame` live stream)
2. **CP2:** Classifier → Gloss (`SignSequence` → English)
3. **CP3:** Gloss → Avatar (`GlossSequence` → `AnimationCommand`)
4. **CP4:** UI shell ↔ real pipelines (replace mocks)
5. **CP5:** Full bidirectional E2E suite on `main`

After each merge into `main`, Orchestrator re-runs the full test suite.

---

## PR Requirements (per agent)

Each PR must state:

1. **Contracts implemented / consumed**
2. **Mocked vs real** dependencies
3. **Tests added** (unit + contract fixture tests)
4. **Domain scope** (files under that agent’s package only)

---

## Package Layout

```
packages/
  contracts/          # Orchestrator — schemas, types, mocks, validators
  vision-capture/     # Agent 1
  sign-classifier/    # Agent 2
  gloss-parser/       # Agent 3
  avatar-renderer/    # Agent 4
  ui-shell/           # Agent 5
apps/
  teto-web/           # App shell integrating packages (Orchestrator + UI)
```

Each package exposes a stable public API via its `src/index.ts`.

---

## Versioning

All payloads include `schemaVersion` (semver).  
Breaking contract changes require Orchestrator approval and a minor/major bump in `packages/contracts` plus an `ARCHITECTURE.md` update.
