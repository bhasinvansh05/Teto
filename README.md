# Teto

Bidirectional ASL ↔ English communication: camera-based sign understanding one way, gloss-driven avatar signing the other.

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for pipeline design and interface contracts.  
Agent coordination rules live in [`AGENTS.md`](./AGENTS.md).

## Monorepo

```
packages/contracts         Shared schemas, types, validators, mocks (Orchestrator)
packages/vision-capture    Camera + MediaPipe landmarks (Agent 1)
packages/sign-classifier   Landmark → sign labels (Agent 2)
packages/gloss-parser      Sign ↔ English / ASL gloss (Agent 3)
packages/avatar-renderer   Gloss → avatar animation (Agent 4)
packages/ui-shell          App chrome & HIG UI (Agent 5)
apps/teto-web              Integration app shell
```

## Quick start

```bash
npm install
npm test
npm run demo -w @teto/web
```

## Branches

| Branch | Owner |
| --- | --- |
| `main` | Orchestrator |
| `feature/camera-capture` | Vision/Capture |
| `feature/sign-classifier` | Sign Classification |
| `feature/gloss-parser` | Language/Gloss |
| `feature/avatar-renderer` | Avatar/Rendering |
| `feature/ui-shell` | UI/Design |
