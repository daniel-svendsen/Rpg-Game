# AGENTS.md

## Purpose

- Repo-level guidance for AI coding agents in this project.
- Keep this file focused on rules that apply across the whole repository.
- Put deeper setup and workflow details in `README.md` and `docs/`.
- Use `ROADMAP.md` as the source of truth for phased progress, current focus, and phase completion criteria.
- Scope: the full repository unless a deeper `AGENTS.md` overrides it.
- Priority:
  - direct system, developer, and user instructions
  - deeper nested `AGENTS.md`
  - this file

## Read First

- Read `ROADMAP.md` before proposing major new work or changing phase direction.
- Read `docs/PROJECT_VISION.md` when product direction or gameplay intent matters.
- Read `docs/COMMANDS.md` for local workflow commands.
- Read `docs/SIMULATION.md` for simulator usage and balance iteration flow.

## Core Rules

- Always write code, comments, documentation, UI text, config names, and commit messages in English.
- Change only what the task requires unless a closely related fix is necessary for correctness.
- Prefer small, focused edits over broad refactors.
- State important assumptions explicitly when they affect implementation or verification.
- If requirements are ambiguous and the choice is risky, surface the tradeoff instead of deciding silently.
- If something is unclear, stop and ask — do not silently pick an interpretation.
- Prefer the simplest solution that satisfies the request; avoid speculative abstractions, configurability, or single-use indirection.
- Do not improve, reformat, or refactor adjacent code that the task did not touch.
- If you notice unrelated dead code or issues while working, mention them — do not delete or fix them unless asked.
- Remove imports, variables, and functions that your own changes made unused. Do not remove pre-existing dead code unless explicitly asked.
- Keep systems modular and easy to extend.
- Prefer reusable systems over one-off logic.
- Prefer centralized configuration over duplicated constants.
- Reuse established naming, architecture, and file patterns before introducing new ones.
- If a dependency, library, or pattern would clearly simplify the codebase or reduce maintenance cost, say so explicitly.
- Do not silently add new dependencies or architectural patterns without explaining why.

## Architecture Boundaries

- `frontend/src/game/domain` is the source of truth for gameplay rules.
- `frontend/src/game/phaser` is a rendering adapter and scene integration layer only.
- `frontend/src/game/config` owns balance, spells, maps, monsters, items, and economy configuration.
- `frontend/src/app` should stay focused on screen composition, persistence orchestration, and mobile UI flow.
- Keep gameplay rules, progression rules, and balance decisions out of rendering code when practical.
- Treat saved progression as a first-class system across frontend, backend, and persistence changes.
- Prefer explicit and versionable persistence contracts.

## Planning And Roadmap

- Treat `ROADMAP.md` as the progress tracker instead of inferring status loosely from the repo.
- If the current phase appears close to complete, say so explicitly and reference the roadmap acceptance criteria.
- Do not silently jump to later-phase work when current-phase acceptance is still unresolved, unless the work is a small enabling step.
- For larger tasks, start with a short brainstorming / impact check before implementation when it helps reduce avoidable mistakes.
- Keep that brainstorming lightweight and practical:
  - what the task is trying to achieve
  - which systems or files are likely affected
  - key risks or side effects
  - what should be tested
  - whether the work should be split into smaller steps
- For multi-step tasks, define verifiable success criteria before starting: "add validation" → "write tests for invalid inputs, then make them pass". Weak criteria require constant clarification; strong criteria let you verify independently.
- If completed work changes roadmap status, update the relevant `ROADMAP.md` checklist item(s) in the same pass when practical.
- Do not mark roadmap checklist items complete unless the implementation is actually done and verified enough for the current scope.

## Cross-System Risk Checks

- When a change touches one system, check whether it also affects:
  - frontend
  - backend
  - persistence
  - balance
  - mobile UX
  - saved progression
- If a change affects spells, drops, equipment, inventory, maps, progression, or persistence, assume extra verification is needed.
- If new saved fields are added on the frontend, verify whether backend DTOs, entity mapping, and migrations must change too.

## Verification

- After making changes, run relevant checks when practical and make a best effort to verify they pass.
- After adding a feature, add or update relevant automated tests when practical.
- After fixing a bug, prefer adding a regression test when practical.
- Turn bug fixes and validation changes into concrete verification steps or tests when practical.
- If tests are not added or updated when they would normally be expected, explain why.
- Common checks for this repo:
  - frontend build
  - frontend domain and app guardrail tests
  - backend tests
  - backend startup or migration awareness
  - save/load and autosave awareness when persistence changes

## Git And Secrets

- Before staging, committing, or pushing, check that sensitive and local-only files are excluded.
- Commit focused work at sensible checkpoints when the change is coherent and verified.
- Push only after checking that the branch, staged files, and secrets situation look correct.
- Never push secrets, passwords, local tokens, local database credentials, or private environment values.
- Treat these as non-pushable unless the user explicitly says otherwise:
  - `dev.local.properties`
  - local `.env` files
  - `.run/`
  - `.m2/`
  - generated local build artifacts

## Important Project Files

- `ROADMAP.md` tracks the current phase, acceptance criteria, planned workstreams, and next recommended step.
- `docs/PROJECT_VISION.md` captures higher-level game direction and product intent.
- `docs/COMMANDS.md` documents the main local workflow, demo, build, and verification commands.
- `docs/SIMULATION.md` documents the simulator workflow and report interpretation.
- `docs/SYSTEM_FLOWCHARTS.md` documents current technical flows for combat, loot, login, boss progression, save/load/autosave, and map progression.
- `docs/VISUALS.md` documents how to add monster sprites, player sprites, and spell visual effects.
- `frontend/AGENTS.md` contains frontend, domain, UI, and balance guardrails specific to `frontend/`.
- `backend/AGENTS.md` contains backend, persistence, API, and save-contract guardrails specific to `backend/`.
