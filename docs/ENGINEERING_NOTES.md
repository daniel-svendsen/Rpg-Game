# Engineering Notes

## Purpose

This file captures short, reusable engineering lessons from the project.

Use it for:

- implementation lessons that are likely to matter again
- recurring pitfalls
- decisions that improve future changes

Do not use it for:

- roadmap status
- full design vision
- one-off temporary observations
- long postmortems

## Architecture Lessons

- Keep gameplay rules in `frontend/src/game/domain`, not in React components or Phaser scenes.
- Treat `frontend/src/game/phaser` as a rendering adapter, not a gameplay authority.
- Keep balance values and content rules centralized under `frontend/src/game/config`.
- Save-shape changes are almost never frontend-only; check frontend types, backend DTOs, entity mapping, and migration impact together.

## Balance And Simulation Lessons

- The simulator is strong for balance pressure questions such as map sustain, loot pressure, spell rarity, and shop pricing.
- The simulator is weaker for feel, readability, and visual pacing; do not treat it as a substitute for runtime judgment.
- Prefer baseline profiles plus override files for comparisons instead of editing core balance config directly.
- When comparing balance variants, keep profile, map, and run count stable so the output stays meaningful.

## UI And UX Lessons

- Keep `README.md` as a short hub; move deep workflows into focused docs.
- Mobile-first readability matters early because oversized UI sections become expensive to untangle later.
- If a UI panel does not add strong value during a run, question whether it belongs on the screen at all.
- Item readability should stay consistent across inventory, gear, loot, shop, and item cards.

## Persistence And Backend Lessons

- Saved progression should be treated as a first-class system, not an afterthought.
- Explicit validation and clearer API failures are valuable because they let the frontend show better auth and save error feedback.
- Prefer partial, intention-revealing persistence changes over large opaque payload updates when practical.

## Workflow Lessons

- Short brainstorming / impact checks before larger tasks usually improve change quality and reduce avoidable follow-up work.
- Roadmap checklists are most useful when they reflect real implementation status, not hopeful intent.
- Scoped `AGENTS.md` files improve clarity: keep root rules global, and keep frontend/backend specifics close to their code.

## Update Rule

Add a note here only when it is likely to improve future work on the project.

