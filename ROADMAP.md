# ROADMAP

## Purpose

This file is the project progress source of truth for phased work.

Use it to track:

- the current phase
- what must be accepted before moving on
- what is intentionally deferred
- the next recommended step

`README.md` stays focused on project overview and setup. `AGENTS.md` files should read this file before proposing major direction changes.

## Current Phase

- Current phase: `Phase 2 - Balance Infrastructure`
- Status: `In progress`
- Exit rule: do not drift into broad UI or Phaser rollout work before the headless balance loop is actively informing repeatable tuning decisions with useful output and override-driven comparisons.

## Guiding Principles

- Keep gameplay rules in `frontend/src/game/domain`.
- Keep rendering concerns in `frontend/src/game/phaser`.
- Keep balance values centralized and easy to override.
- Keep save contracts explicit across frontend types, backend DTOs, and persistence mapping.
- Prepare spells, supports, and uniques so their mechanics can later be communicated clearly through Phaser visuals.
- Prefer stable phase exits over perpetual polishing.

## Phase 0 - Project Guardrails

Status: `Started`

Goals:

- define a clear phased roadmap
- define backend acceptance for the current Shardborne scope
- split agent instructions into root, frontend, and backend scopes
- establish one place to track current phase and next step

Done when:

- `ROADMAP.md` exists and is kept current
- root `AGENTS.md` points agents to this roadmap
- `frontend/AGENTS.md` and `backend/AGENTS.md` define scoped rules

## Phase 1 - Backend Acceptance

Status: `Accepted`

Goal:

Make the backend robust and predictable for the current gameplay scope before investing in broader UI work or Phaser-heavy implementation.

Acceptance checklist:

- register, login, and JWT validation work reliably
- character creation, load, and save work reliably
- saved progression includes inventory, equipment, spells, supports, spell progression, map progression, currencies, and life flask state
- save shape is explicit through DTOs and mapping, not a dumping ground for arbitrary nested JSON
- Flyway migrations work from a fresh local database
- backend tests cover important stat calculation and persistence flows
- there are no known progression-corruption risks in the current gameplay loop

Not required for phase completion:

- enterprise-scale architecture changes
- premature optimization unrelated to current bottlenecks
- speculative systems that are not yet needed by the current build

Recommended next steps inside this phase:

1. Review backend save and load flow against the current frontend save shape.
2. Identify any weak persistence spots or missing tests.
3. Declare the phase accepted once the checklist is green.

Accepted because:

- auth, login, and JWT-protected character access are covered by backend verification
- character create, save, and load flows are covered by backend verification
- saved progression coverage includes inventory, equipment, spells, supports, spell progression, map progression, currencies, and life flask state
- fresh local database migration startup is verified through the dedicated backend verification script
- backend persistence contracts are more explicit in the highest-risk JSONB sections and no known progression-corruption issue is currently open

## Phase 2 - Balance Infrastructure

Status: `Current`

Goal:

Build tooling that makes balancing faster, more repeatable, and less subjective.

Acceptance targets:

- a headless simulation path can run many map attempts without Phaser
- a script can simulate at least `100` map runs and summarize outcomes
- output includes clear rate, deaths, average map time, gold, shards, map sustain, and loot distribution
- balance overrides can be applied without editing core config values directly
- the simulation output is easy to read and compare, but broad player-facing UI polish stays out of this phase

Current progress:

- a reusable headless simulator now runs map attempts without Phaser rendering
- the simulation CLI can load either a local profile or the current backend character
- reports now include:
  - completion, death, and timeout rates
  - average run time, gold, map shards, and map sustain
  - rare monsters encountered and killed
  - rare item drops
  - exceptional rare drops
  - total unique drops plus `T1`, `T2`, and `T3` unique breakdown
  - spell drops
  - total loot breakdown by item, currency, spell, and map
- balance overrides can be applied from JSON without editing core config values directly
- the simulator is already being used to tune:
  - early and mid-tier map difficulty
  - map sustain
  - spell drop rarity
  - exceptional rare frequency
  - unique tier distribution
  - shop pricing pressure

Recommended tooling:

- a simulator script for repeated map runs
- a simple override mechanism for tuning values such as:
  - enemy health
  - enemy damage
  - loot rate
  - shard drops
  - rare monster chance

Recommended next steps inside this phase:

1. Continue tuning `tier3` through `tier9` using the simulator as the default balance loop.
2. Push spell drops closer to the intended rare-drop identity while keeping chase spells possible.
3. Tighten map sustain and reward pressure where farm loops still look too generous.
4. Keep broader readability and presentation work for `Phase 3` unless it directly improves balance iteration.

Phase completion will likely require:

- a stable baseline profile or small preset set for repeated comparisons
- at least one meaningful override-driven comparison workflow
- a balance pass where the simulator is clearly driving concrete map, loot, and economy decisions rather than just existing as tooling

## Phase 3 - UI Readability And Gameplay Clarity

Status: `Planned`

Goal:

Improve how current mechanics are communicated before broadening feature scope.

Focus areas:

- clearer spell and support information
- clearer loot and progression feedback
- clearer unique-item identity and impact
- mobile-first readability improvements

Note:

This phase is about better communication of existing systems, not feature sprawl.

## Phase 4 - Phaser Preparation

Status: `Planned`

Goal:

Prepare gameplay data so visual behavior can be implemented cleanly and consistently.

Acceptance targets:

- spells expose semantic visual hooks in config
- supports expose additive visual modifiers where appropriate
- uniques expose clear gameplay-to-visual hooks where appropriate
- Phaser can consume these hooks without becoming the source of gameplay truth

Examples of future-facing hooks:

- cast pattern
- projectile visual family
- chain visual family
- impact visual family
- area visual family
- color theme
- aura or on-hit effect signals

## Phase 5 - Phaser Rollout

Status: `Planned`

Goal:

Make important mechanics visibly readable in moment-to-moment gameplay.

Recommended rollout order:

1. single-target or projectile cast readability
2. chain readability
3. area-impact readability
4. loot and reward readability
5. selected unique-driven visual identity

Success criteria:

- a player can understand more of what a spell or unique is doing without reading all details from UI text alone

## Progress Tracking Rules

- Update this file when the current phase changes.
- Update this file when phase acceptance becomes clear.
- Prefer marking a phase complete only when the acceptance criteria are actually satisfied.
- If work from a later phase is proposed early, call it out explicitly as out-of-phase unless it is a small enabling change.
- When an agent believes the current phase is close to done, it should say so directly and reference the acceptance checklist.

## Next Recommended Step

- Use the current simulator to finish the first full balance pass on map difficulty, spell rarity, unique tier pacing, map sustain, and shop pressure before expanding into broader UI readability work.
