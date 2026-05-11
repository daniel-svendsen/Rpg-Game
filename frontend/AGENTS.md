# AGENTS.md

## Purpose

- Frontend-specific instructions for `frontend/`.
- Inherit repo-wide rules from the root `AGENTS.md`.
- Read `ROADMAP.md` before proposing major frontend work.
- Read `docs/PROJECT_VISION.md` when product direction or gameplay intent matters.

## Frontend Priorities

- Keep the frontend web-first and mobile-first.
- Preferred frontend stack: `TypeScript + React + Vite + Phaser 4`.
- Keep `frontend/src/app` focused on screen composition, orchestration, and interaction flow.
- Keep `frontend/src/game/domain` as the source of truth for gameplay behavior.
- Keep `frontend/src/game/phaser` as a rendering adapter, not a gameplay authority.
- Do not introduce major frontend stack drift unless there is a clear product or maintainability reason.
- Prefer splitting large UI flows into focused hooks and components instead of growing one oversized screen file.

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
- When a React file starts carrying too many responsibilities, prefer extracting hooks, presentational components, and small utility modules.
- Prefer custom hooks for reusable stateful UI logic and side-effect orchestration.
- If a file or solution is becoming too large, too coupled, or hard to reason about, say so explicitly and propose a more modular direction.

## Gameplay And Visual Readiness

- Keep spell behavior data-driven and centralized in config and domain.
- When adding spell, support, or unique-item behavior, consider whether it will later need a visual signal.
- Prefer semantic visual hooks over renderer-specific implementation details.
- Keep balance values centralized.
- When adding a new monster type, add a matching entry to `frontend/src/game/phaser/spriteConfig.ts` so it gets a sprite. The fallback renders goblin if the entry is missing.
- When adding a new spell, its visual is driven by tags in `spellConfig.ts` — no ArenaScene changes are needed unless the spell requires a new visual style. See `docs/VISUALS.md`.
- `frontend/src/game/phaser/spriteConfig.ts` is the single file to change for visual assignments (sprite names, frame sizes, FX animation mappings). Do not scatter visual configuration elsewhere.
- Keep drop rates, map progression, item generation, spell behavior, and progression rules data-driven where practical.
- Keep spell behavior modular and not tightly coupled to rendering.
- Support spells should modify main spells through reusable rules, not custom per-spell hacks.
- Spell progression should use the shared reusable spell progression system.
- Healing rules should stay centralized and readable.
- Gold income, shop pricing, shop item power, and item drop rates should be balanced together.

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

## Unique Item Behavior

- When adding or reworking unique items, prefer effects that are directly visible or clearly felt in combat.
- Unique items should not rely only on tooltip text, stat-sheet value, or hidden background math to feel meaningful.
- If a unique grants extra chains, extra projectiles, larger area, movement changes, reactive defense, on-kill effects, or similar combat behavior, that effect should be implemented in shared domain logic so it is observable during gameplay.
- Keep unique descriptions, simulator behavior, and runtime combat behavior aligned.
- Prefer unique effects that change gameplay behavior over uniques that are only stronger rare-style stat bundles.
- Use hidden or economy-facing effects such as loot luck, drop weighting, or subtle conditional multipliers sparingly unless they also have clear player-facing feedback.

## Product Priorities

- `Training Grounds` is rerunnable forever.
- Consumable maps are part of saved progression.
- `Map Shards` are part of the early map-crafting loop.
- Items can be sold for gold.
- The shop should keep evolving as a dedicated mobile-friendly screen.
- Spell/support UX should keep moving toward a simplified FF7 materia-style flow.
- Equipment selection should use slot-first mobile pickers.
- Level-up stat spending should stay in a dedicated character/stats view.
- Spell UI should show real gameplay information when practical, including:
  - damage
  - cooldown
  - crit chance
  - chain count
  - chain radius
  - area radius
  - upgrade costs

## Balance And Simulation

- Keep balance values centralized under `frontend/src/game/config`.
- Favor data-driven overrides and tooling over manual tuning scattered through code.
- If balance work is requested, prefer reusable simulation or reporting tools over one-off guesswork.
- If map pacing, drop rate, sustain, loot pressure, or shop pressure are in question, prefer using the simulator before making purely intuitive changes.
- Keep broader readability and presentation work out of `Phase 2` unless it directly improves balance iteration.

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
- If a frontend change also affects saved progression shape or persistence flow, call out the backend/persistence risk explicitly.
