# CLAUDE.md

## Project
- Shardborne is a small ARPG prototype.
- Stack: React 19 + TypeScript + Vite + Phaser 4 (frontend), Spring Boot 3 + Java 17 + PostgreSQL + Flyway + JWT (backend).

## Claude Rules
- Keep changes small, focused, and directly tied to the task.
- Reuse existing components, hooks, utilities, DTOs, and patterns before adding new ones.
- Read only the minimum relevant files before editing.
- Write all code/comments/docs in English.
- For shared cross-agent policy (allowed/not-allowed actions, failure reporting), follow `AGENTS.md`.
- Do not read `.env` files or secrets.
- Use `.env.example` / `*.example` files and env-var names in docs.
- Do not create real secrets, tokens, passwords, keys, or private IDs.

## Behavioral Execution
- Think before coding: state assumptions, surface ambiguity, and ask when unclear.
- If multiple reasonable interpretations exist, present options instead of silently choosing one.
- Prefer the simplest implementation that satisfies the request; avoid speculative abstractions.
- Make surgical changes only: do not refactor or "improve" unrelated code.
- Remove only unused code introduced by your own changes; report unrelated dead code instead of deleting it.
- Convert tasks into verifiable goals and checks before implementing when work is multi-step or risky.
- For behavior changes, prefer tests that fail before and pass after.

## Ask Before Changing
- Database schema or migration behavior.
- Authentication or authorization logic.
- Production config.
- Public API contracts.
- Destructive scripts or file deletion.
- New dependencies.

## Commit Message Rules
- Follow `docs/COMMIT_GUIDELINES.md`.

## Architecture Guardrails
- `frontend/src/game/domain` is gameplay source of truth.
- `frontend/src/game/phaser` is rendering adapter only.
- Save/progression changes require cross-checking frontend types, backend DTOs, mappings, and migrations.

## Commands
- Frontend test: `cd frontend && npm test`
- Frontend build: `cd frontend && npm run build`
- Backend test: `cd backend && mvn test`
- Optional backend integration: `cd backend && mvn verify -Pdb-integration-tests`
- Local stack scripts: `.\start-dev.ps1`, `.\clean-start-dev.ps1`, `.\stop-dev.ps1`
- Fresh DB migration check: `.\verify-fresh-backend-db.ps1`

## Optional References
- `docs/AI_CONTEXT.md` for compact product/domain context.
- `docs/COMMANDS.md` for workflow commands.
- `docs/SIMULATION.md` when balance/simulator behavior is involved.
- `ROADMAP.md` when task scope or phase direction matters.
- `AGENTS.md` only when the task explicitly concerns shared cross-agent rules.
