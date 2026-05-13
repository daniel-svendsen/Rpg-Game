# AGENTS.md

## Project Overview
- Shardborne is a small ARPG prototype built for AI-assisted development with clear boundaries between gameplay domain, rendering, and persistence.
- Current product progress and phase priorities live in `ROADMAP.md`.

## Repo Layout
- `frontend/`: React + TypeScript + Vite + Phaser runtime adapter.
- `backend/`: Spring Boot + Java 17 + PostgreSQL + Flyway + JWT.
- `docs/`: deeper project context, commands, simulation workflow, and system references.

## Instruction Priority
1. System/developer/user task instructions.
2. Local `AGENTS.md` in touched folder.
3. Root `AGENTS.md`.
4. For Claude Code, use `CLAUDE.md` as the Claude-specific instruction source.
5. Other docs.

## Existing Knowledge
- Check existing README, docs, and instruction files before changing agent docs.
- Read deeper docs only when needed for the current task to stay token-efficient.
- Preserve valuable project context by moving it to the most relevant file.
- Condense duplicated or overly long instructions.
- Do not delete project-specific context unless obsolete, unsafe, or clearly redundant.
- If information seems outdated or contradictory, report it instead of guessing.

## Execution Style
- Think before coding: state assumptions and surface ambiguity early.
- If multiple interpretations are plausible, present tradeoffs instead of silently choosing.
- Prefer the simplest solution that satisfies the request.
- Keep edits surgical and directly traceable to the task.
- Avoid unrelated refactors; report unrelated issues instead of fixing them silently.
- For larger tasks, define short verifiable goals before implementation.

## Architecture Boundaries
- `frontend/src/game/domain` is gameplay source of truth.
- `frontend/src/game/phaser` is rendering/scene adapter only.
- `frontend/src/game/config` owns balance and content configuration.
- `frontend/src/app` owns UI flow and persistence orchestration.
- Save/progression changes must be checked across frontend types, backend DTOs, mapping, and migrations.

## Commands
- Install frontend deps: `cd frontend && npm ci`
- Frontend dev: `cd frontend && npm run dev`
- Frontend test: `cd frontend && npm test`
- Frontend build: `cd frontend && npm run build`
- Backend test: `cd backend && mvn test`
- Optional backend DB integration tests: `cd backend && mvn verify -Pdb-integration-tests`
- Full local stack scripts: `.\start-dev.ps1`, `.\clean-start-dev.ps1`, `.\stop-dev.ps1`
- Fresh migration verification: `.\verify-fresh-backend-db.ps1`

## Verification Expectations
- Run the minimum relevant checks for changed behavior.
- For behavior changes, add or update tests that lock the intended behavior when practical.
- For bug fixes, prefer a regression test that fails before and passes after the fix.
- Add or update tests for behavior changes when practical.
- Never hide failing checks; report failures clearly.
- If verification is not possible, say exactly what could not be verified.

## Allowed Actions
- Read relevant source and documentation files.
- Make focused code/documentation changes.
- Add or update tests for changed behavior.
- Run safe local checks.
- Update relevant existing docs/instruction files when changed behavior is documented there.

## Not Allowed Actions
- Do not read `.env` files.
- Do not create real secrets.
- Do not commit or push changes.
- Do not delete files unless explicitly asked.
- Do not change production config without approval.
- Do not casually modify authentication, authorization, database schema, or public API contracts.
- Do not disable tests, linting, validation, or security checks to make a task pass.
- Do not introduce new dependencies without explaining why.

## Security Rules
- Never commit secrets, tokens, passwords, API keys, or private keys.
- Use `.env.example` and `*.example` files for required variables.
- Use env-var names or placeholders in docs.
- Do not log secrets or personal data.
- Keep authorization checks server-side.
- Validate user input on the backend.

## Commit Message Rules
- Follow `docs/COMMIT_GUIDELINES.md`.

## On Failure
- Report errors clearly.
- Do not silently skip failed steps.
- Do not hide warnings or failing checks.
- Fix the cause when possible instead of bypassing checks.
- If something cannot be verified, state it in the final response.
- If expected tests or doc updates were skipped, explain why.

## Finish Response
- List changed files.
- Give a short summary.
- List tests/checks run.
- List failed checks (if any).
- Call out anything not verified.
- List assumptions made.
