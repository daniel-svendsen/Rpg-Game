# AGENTS.md

## Purpose

- Frontend-specific instructions for `frontend/`.
- Inherit repo-wide rules from the root `AGENTS.md`.
- Read `ROADMAP.md` before proposing major frontend work.

## Frontend Priorities

- Keep the frontend web-first and mobile-first.
- Preferred frontend stack: `TypeScript + React + Vite + Phaser 4`.
- Keep `frontend/src/app` focused on screen composition, orchestration, and interaction flow.
- Keep `frontend/src/game/domain` as the source of truth for gameplay behavior.
- Keep `frontend/src/game/phaser` as a rendering adapter, not a gameplay authority.
- Do not introduce major frontend stack drift unless there is a clear product or maintainability reason.

## Current Phase Awareness

- If `ROADMAP.md` says the project is still in backend acceptance, avoid broad new frontend feature work unless it directly supports that phase or is a small enabling improvement.
- Small frontend work that improves save clarity, debugging, or testability is acceptable during backend acceptance.
- If proposing a move into Phaser-heavy work, first check whether the roadmap says Phaser preparation is active.

## Architecture Guardrails

- Prefer splitting large UI flows into focused hooks and components.
- Avoid growing `App.tsx` into a catch-all coordinator for unrelated logic.
- Prefer explicit helper modules over repeated inline calculations.
- Keep persistence normalization and save-related orchestration readable and testable.
- Do not move gameplay rules into React components or Phaser scenes.

## Gameplay And Visual Readiness

- Keep spell behavior data-driven and centralized in config and domain.
- When adding spell, support, or unique-item behavior, consider whether it will later need a visual signal.
- Prefer semantic visual hooks over renderer-specific implementation details.

Examples of good early hooks:

- `castPattern`
- `projectileVisualFamily`
- `impactVisualFamily`
- `chainVisualFamily`
- `areaVisualFamily`
- `colorTheme`
- `auraVisual`
- `onHitVisual`

Avoid:

- baking Phaser-only implementation details into domain logic
- introducing visual metadata that is so specific it limits future iteration

## Balance And Simulation

- Keep balance values centralized under `frontend/src/game/config`.
- Favor data-driven overrides and tooling over manual tuning scattered through code.
- If balance work is requested, prefer reusable simulation or reporting tools over one-off guesswork.

## Dependency And Pattern Guidance

- Question current frontend approaches when a dependency or established pattern would clearly reduce complexity.
- Prefer built-in React, TypeScript, browser, and existing repo patterns before adding new libraries.
- Do not add state-management, rendering, or data-flow dependencies casually.
- If suggesting or adding a frontend dependency, explain:
  - the concrete problem it solves
  - why the current approach is insufficient
  - the cost in complexity, learning, or maintenance

## Verification

- Run relevant frontend tests when practical.
- After adding a frontend feature, add or update relevant tests when practical.
- After fixing a frontend bug, prefer adding a regression test when practical.
- If tests are not updated where they would normally be expected, explain why.
- Prefer validating domain-heavy changes with automated tests before relying on visual behavior.
- If a change affects spells, loot, maps, inventory, progression, or save normalization, assume extra verification is needed.
