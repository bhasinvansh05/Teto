# Multi-Agent Development Guide

This repository is built by specialized agents coordinated by an Orchestrator.

## Roles

| Role | Branch | Package |
| --- | --- | --- |
| Orchestrator | `main` | `packages/contracts`, `ARCHITECTURE.md`, `apps/teto-web` integration |
| Agent 1 — Vision/Capture | `feature/camera-capture` | `packages/vision-capture` |
| Agent 2 — Sign Classification | `feature/sign-classifier` | `packages/sign-classifier` |
| Agent 3 — Language/Gloss | `feature/gloss-parser` | `packages/gloss-parser` |
| Agent 4 — Avatar/Rendering | `feature/avatar-renderer` | `packages/avatar-renderer` |
| Agent 5 — UI/Design | `feature/ui-shell` | `packages/ui-shell` |

## Rules

1. **Contracts first.** Read `ARCHITECTURE.md` and `@teto/contracts` before coding.
2. **Stay in your package.** Do not modify another agent’s package or branch.
3. **Cross-cutting changes** (schema edits, shared types) are Orchestrator-only.
4. **Mock unfinished deps** using `@teto/contracts` mocks — do not invent alternate shapes.
5. **Flag blockers** (missing fields, ambiguous semantics) instead of guessing.
6. **PR checklist:** contracts in/out, mocked vs real, tests, domain scope.

## Integration Checkpoints (Orchestrator)

1. Vision → Classifier  
2. Classifier → Gloss  
3. Gloss → Avatar  
4. UI ↔ real pipelines  
5. Full bidirectional E2E on `main`

After every merge to `main`, run:

```bash
npm test
```
