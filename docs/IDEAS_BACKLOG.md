# Ideas Backlog (Notes)

This file is a living backlog of thoughts, cleanup ideas, and future directions.

It is intentionally **not** an implementation order.

Some items here have since been promoted into `ROADMAP.md` workstreams or completed in implementation.
Keep this file focused on still-useful notes, follow-ups, and early ideas that are not yet clear enough
to become concrete roadmap tasks.

## Documentation and info files

Status:

- Core docs split is now in place through `README.md`, `ROADMAP.md`, `docs/PROJECT_VISION.md`, `docs/SIMULATION.md`, and `docs/COMMANDS.md`.
- Remaining value here is mostly about future cleanup and keeping those docs aligned as workflows change.

Goals:

- Make repo documentation easier to navigate for:
  - future me
  - other developers
  - portfolio / recruiter readers

Ideas:

- Consider splitting the repo root docs into clearer roles:
  - `README.md` for GitHub introduction + setup + quick overview
  - `ROADMAP.md` for phases, acceptance criteria, and next step
  - a short “game vision” doc (themes, target audience, core loop)
  - a simulator doc (how to run it, how to interpret reports)
  - a commands reference doc (dev/demo/start/stop/build/test)
- Decide whether command docs should live in `README.md` or a dedicated file.

## Maps and map length

Status:

- First pass shipped May 8, 2026: increased monster counts per tier, increased pack count (tier-scaled), added an enemy aggro radius (enemies only chase when close), and added a short post-clear completion delay so final loot pickup can happen.
- Remaining work should be driven via simulator output and tracked under the `ROADMAP.md` workstream "Map pacing and sustain".

Problem:

- Maps feel too short right now.

Directions to explore:

- More enemies, larger space, or more packs
- More travel time between packs (paired with movement speed / auto-move tuning)
- Better “start → progress → goal” feeling per run
- More loot-on-ground + pickup moments (if it improves pacing and readability)

Success criteria:

- Runs feel like “real maps” instead of very short arenas.

## Error handling and user feedback (auth)

Status:

- Core login/register feedback is now improved in the current build.
- Remaining follow-ups should focus on polish, edge cases, and keeping backend/frontend auth feedback aligned.

Problem:

- Login/register errors are not clear enough.

Examples that should be explicit in the UI:

- wrong password
- password too short at registration
- invalid email
- account already exists
- missing fields
- backend/API errors

Success criteria:

- UI feedback is specific and actionable (not generic).

## Map drops (map sustain)

Problem:

- Maps drop too rarely.

Ideas:

- Review map drop rate and overall sustain pressure.
- Ensure the simulator report highlights when sustain is too low.

Success criteria:

- Progression does not stall too often due to lack of maps.

## “Sell all” UX

Status:

- Implemented May 8, 2026: the button shows total gold and prompts before selling.

Idea:

- The “Sell all” button should show the total gold gained before confirming.

Examples:

- button text: `Sell all (+1234g)`
- or adjacent text showing total value

Success criteria:

- Less uncertainty before selling; clearer expected outcome.

## Item rarity colors on equipped gear

Problem:

- Rarity colors should be visible on equipped gear, not only inventory/loot.

Ideas:

- Centralize rarity colors so inventory, gear slots, loot, and item cards always match.

Success criteria:

- Consistent item visuals across the whole UI.

## Active spell and map state sections during a map run

Observation:

- “Active spell” / “Map state” UI sections likely do not add enough value during runs.

Ideas:

- Hide them during map runs, move them, or replace them with more relevant combat/run info.

Success criteria:

- Cleaner map-run UI and better use of screen space (mobile-first).

Note:

- As of May 8, 2026, the hub now includes a dedicated Boss tab and the inventory view is treated as part of the Gear flow to reduce tab count.

## Roadmap phases, sub-tasks, and checklists

Idea:

- Consider breaking phases into smaller checklists that can be checked off.
- When something is completed, update docs so repo status stays in sync with implementation.

Potential agent guidance:

- Add an instruction that agents should update the relevant checklist item(s) when finishing work.
- Add short notes when a change affects roadmap status or acceptance.

## “Brainstorm first” workflow for bigger tasks

Idea:

- For larger tasks, start with a short brainstorming step before coding:
  - goal of the task
  - which areas/files are impacted
  - risks and test plan
  - simpler vs more durable options
  - how to split into smaller steps

Success criteria:

- Fewer “oops” refactors; more intentional changes with clearer verification.

## Rare spawns, boss keys, and boss drops

Status:

- Implemented (first pass) May 8, 2026: boss keys drop from rares, boss challenges unlock tiers, and boss-only drops exist.

High-level concept:

- Rare monster variants can sometimes spawn in maps.
- Rare spawns can drop “boss keys”.
- Boss keys unlock boss fights with a separate, higher-value drop pool.

Questions to answer before implementation:

- How rare are keys?
- Are keys tier-gated, boss-specific, or craftable from fragments?
- Should there be trade-offs (sell vs save vs use)?
- What makes boss fights distinct (mechanics, resistances, arenas)?
- What is the intended “chase” structure for boss uniques?

Simulator expectations (later):

- How often rare key-monsters spawn
- How often keys drop
- Boss run frequency and expected value
- Boss-unique drop chance and distribution

Goal:

- Add long-term chase goals and “spike excitement” moments.

## Visual variety: map backgrounds

Idea:

- Allow maps to use different backgrounds.

Potential approaches:

- Background per tier (strong tier identity)
- Random background selection within a tier (more variety)
- Special/boss maps with unique backgrounds

Notes:

- If background is purely visual, the simulator likely does not need to care.
- Prefer making the choice config-driven so it is easy to add more later.
