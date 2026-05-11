# ROADMAP

## Purpose

This file is the project progress source of truth for phased work.

Use it to track:

- the current phase
- what must be accepted before moving on
- what is intentionally deferred
- the next recommended step

`README.md` stays focused on project overview and setup. `AGENTS.md` files should read this file before proposing major direction changes.

## Roadmap Workflow

Use the checklist states consistently:

- `[x]` means implemented, verified enough for current scope, or explicitly accepted
- `[ ]` means not implemented yet, still being evaluated, or not accepted yet

Keep three layers separate:

- phase acceptance checklists for what must be true before a phase is considered done
- phase candidate tasks for likely implementation work inside that phase
- backlog ideas for things that are interesting but not yet committed or fully scoped

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

Status: `Accepted`

Goals:

- define a clear phased roadmap
- define backend acceptance for the current Shardborne scope
- split agent instructions into root, frontend, and backend scopes
- establish one place to track current phase and next step

Acceptance checklist:

- [x] `ROADMAP.md` exists and is kept current
- [x] root `AGENTS.md` points agents to this roadmap
- [x] `frontend/AGENTS.md` and `backend/AGENTS.md` define scoped rules

## Phase 1 - Backend Acceptance

Status: `Accepted`

Goal:

Make the backend robust and predictable for the current gameplay scope before investing in broader UI work or Phaser-heavy implementation.

Acceptance checklist:

- [x] register, login, and JWT validation work reliably
- [x] character creation, load, and save work reliably
- [x] saved progression includes inventory, equipment, spells, supports, spell progression, map progression, currencies, and life flask state
- [x] save shape is explicit through DTOs and mapping, not a dumping ground for arbitrary nested JSON
- [x] Flyway migrations work from a fresh local database
- [x] backend tests cover important stat calculation and persistence flows
- [x] there are no known progression-corruption risks in the current gameplay loop

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
- opt-in real database integration coverage now verifies register, character creation, and current-character load against an isolated temporary PostgreSQL database
- backend persistence contracts are more explicit in the highest-risk JSONB sections and no known progression-corruption issue is currently open

Post-acceptance fixes:

- `JwtAuthenticationFilter` was annotated with `@Component`, causing Spring Boot to register it globally for all requests including `/api/auth/**`. It now only runs in `applicationSecurityFilterChain`. Expired or invalid JWT tokens no longer crash the filter — `JwtException` is caught and authentication is skipped cleanly. Regression tests verify that registration succeeds even when a stale token is present in the header, and that expired tokens on protected endpoints return 403 rather than a server error.

## Phase 2 - Balance Infrastructure

Status: `Current`

Goal:

Build tooling that makes balancing faster, more repeatable, and less subjective.

Acceptance checklist:

- [x] a headless simulation path can run many map attempts without Phaser
- [x] a script can simulate at least `100` map runs and summarize outcomes
- [x] output includes clear rate, deaths, average map time, gold, shards, map sustain, and loot distribution
- [x] balance overrides can be applied without editing core config values directly
- [x] at least one stable baseline profile or preset set exists for repeatable comparisons
- [x] at least one meaningful override-driven comparison workflow exists and is used in practice
- [x] the simulator is the default balance loop for repeated `tier3` through `tier9` tuning decisions
- [x] the current phase has a documented balance pass that clearly informed map, loot, and economy decisions

Current progress:

- a reusable headless simulator now runs map attempts without Phaser rendering
- the simulation CLI can load either a local profile or the current backend character
- a reusable local baseline profile already exists under `frontend/sim-profiles`, and backend characters can be snapshotted into reusable profiles
- reports now include:
  - completion, death, and timeout rates
  - average run time, gold, map shards, and map sustain
  - map drop run rate and expected zero-map streak pressure
  - boss keys and imbuing orb output
  - rare monsters encountered and killed
  - rare item drops
  - exceptional rare drops
  - total unique drops plus `T1`, `T2`, and `T3` unique breakdown
  - spell drops
  - total loot breakdown by item, currency, spell, and map
- optional shop stock sampling can now report generated item rolls and price ranges alongside map-run output
- balance overrides can be applied from JSON without editing core config values directly
- the simulator is already being used to tune:
  - early and mid-tier map difficulty
  - map sustain
  - spell drop rarity
  - exceptional rare frequency
  - unique tier distribution
  - shop pricing pressure
  - boss reward guarantees and boss-vs-map difficulty tuning

Recommended tooling:

- a simulator script for repeated map runs
- a simple override mechanism for tuning values such as:
  - enemy health
  - enemy damage
  - loot rate
  - shard drops
  - rare monster chance

Recommended next steps inside this phase:

1. Push spell drops closer to the intended rare-drop identity while keeping chase spells possible.
2. Tighten map sustain and reward pressure where farm loops still look too generous.
3. Keep broader readability and presentation work for `Phase 3` unless it directly improves balance iteration.

Phase exit notes:

- Broad player-facing UI polish still stays out of this phase unless it directly improves balance iteration.
- Remaining work is now more about repeatable usage and documented tuning outcomes than about missing core simulator capability.

### Phase 2 Scope Extensions (Planned, Simulator-First)

These are explicitly intended to stay within the `Phase 2` mindset because they materially affect
clear speed, danger, and loot economy, and therefore must be modeled by the simulator.

#### Movement + Auto-Movement (Maps)

Goal:

- make movement speed and movement behavior first-class simulation inputs

Acceptance targets:

- runtime state supports dynamic `playerX/playerY` (no fixed center player)
- movement uses character-derived movement speed (items can change it)
- movement is clamped within map/arena bounds
- simulator supports both manual-move mode (for testing) and auto-move mode (default)
- auto-move selects a target pack (or nearest relevant target) and moves in a straight line initially
- auto-move can stop when within spell/combat range
- auto-move continues to next pack when a pack is dead
- auto-move can optionally prioritize nearby ground loot pickup after a pack is cleared
- Phaser remains an adapter (visualizes movement + input intent); domain remains source of truth

Simulator reporting (minimum):

- time spent moving vs fighting
- distance moved
- average clear time impact from movement speed and auto-move behavior

#### Monster Packs + Aggro

Goal:

- replace single-spawn behavior with pack-based spawning and behavior that the simulator can model

Acceptance targets:

- monsters spawn in packs with a stable pack id + pack center
- pack size and spacing are balance/config driven
- enemies have an explicit state: `idle`, `chasing`, `attacking`
- enemies aggro only within an aggro radius, then chase, then attack within attack range
- auto-move naturally triggers aggro as the player approaches packs

Simulator reporting (minimum):

- packs spawned / packs cleared
- monsters aggroed
- time-to-first-contact per pack (proxy for danger spikes)

#### Ground Loot + Pickup

Goal:

- move from "loot directly into inventory" to ground loot with world position, validated by domain rules

Acceptance targets:

- ground loot has a real payload (item/currency/spell/map) and a world position
- pickup occurs by proximity/overlap, but is validated and applied by domain logic
- simulator models drop positions and pickup movement so loot outcomes match runtime

Simulator reporting (minimum):

- ground loot dropped / picked up
- time spent picking up loot (if auto-loot is enabled)
- loot breakdown by type and by tier/rarity

#### Item Stat Rolls (PoE-Inspired, Data-Driven)

Goal:

- make item generation produce a smaller number of meaningful rolled stats from slot-based pools
- make the simulator able to sample rolls and report distributions

Acceptance targets:

- item stats are generated from slot-based stat pools (boots/weapon/armor/etc)
- not all stats exist on all items; items roll a limited set based on rarity
- some item bases influence what can roll (e.g. armor base can roll armor OR evasion focus)
- weapons can roll cast/attack speed in a range (example: `1.0`-`1.5` multiplier)
- rarity influences number of stats and roll quality
- unique items keep fixed stats/effects

Tiering + roll ranges:

- each stat tier has an explicit numeric range, and a roll is sampled inside that range
- ranges should have meaningful separation (example: Tier 1 = `1`-`10`, Tier 2 = `11`-`15`, etc)
- tier ranges and weights are config-driven and overrideable

Simulator reporting (minimum):

- roll distribution per stat key (histograms or bucket summaries)
- tier distribution per slot and rarity
- item power score sensitivity to new stats (movement speed, resists, armor/evasion, cast speed, crit multi, penetration)

#### Combat Foundations: Resistances + Penetration + Armor + Evasion + Crit Multiplier

Goal:

- unify combat math in domain so runtime and simulator share identical rules

Acceptance targets:

- resistances are stored and computed as decimals (e.g. `0.25` for 25%)
- resistance cap is explicit (initial target: `0.75`)
- player penetration reduces enemy resistance for matching elemental types
- enemies have a damage type (`Physical`, `Fire`, `Cold`, `Lightning` at minimum)
- incoming damage uses player resistances for elemental types
- physical damage is influenced by armor/evasion (start simple; avoid PoE-complex formulas initially)
- crit multiplier becomes a derived stat (replaces hardcoded crit damage multiplier)
- cast speed affects spell cooldown consistently in domain

Simulator reporting (minimum):

- damage taken by type
- damage prevented by resistances
- damage prevented by armor
- evasion count / evade rate
- crit count and effective crit multiplier impact

## Phase 3 - UI Readability And Gameplay Clarity

Status: `Planned`

Goal:

Improve how current mechanics are communicated before broadening feature scope.

Focus areas:

- clearer spell and support information
- clearer loot and progression feedback
- clearer unique-item identity and impact
- mobile-first readability improvements

Candidate tasks:

- [x] Show item rarity color in the equipment/gear view (not only inventory/loot/shop).
- [x] Unify stat display format across all surfaces: whole-number percentages, no raw decimals on resistances, crit, or spell power; consistent between item cards, character sheet, and spell detail chips.
- [x] Equipment view redesigned as an RPG-style doll grid (Helmet / Amulet+Body+Weapon / Ring+Belt+Ring / Gloves+Boots) with weapon pixel art sprites and rarity-colored slot borders.
- [ ] Simplify item comparison UI: remove "Compared to X" and rely on power delta (+/-).
- [ ] Map pacing: maps currently feel short; brainstorm and tune levers (monster count, arena size, spawn cadence, movement speed, pack density).
- [ ] Fix mobile horizontal scrolling/overflow where content extends beyond the viewport.

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
- When an item is implemented, update the relevant checklist state instead of leaving roadmap status implicit.
- Keep future ideas in `Planned Workstreams` until they are concrete enough to become phase tasks or acceptance work.
- If a larger task needs a short design or risk pass first, add that as a checklist item before implementation.

## Next Recommended Step

- Shard tier upgrade implemented: selecting a Tier N map now shows a "Craft 1 Tier N map (N×5 shards)" button in Map Crafting. Next candidates: Phase 3 UI readability work (item comparison simplification, mobile overflow fixes) or declaring Phase 2 accepted and beginning Phase 3.

## Planned Workstreams

These workstreams are now part of the roadmap direction, but many of their individual tasks are still unstarted or need evaluation before implementation details are locked in.

### Documentation and workflow

- [x] Restructure repo docs so `README.md` stays GitHub-friendly and deeper topics move into focused docs.
- [x] Add a dedicated project vision doc if the game direction starts stretching beyond what belongs in `README.md`.
- [x] Add a simulator-focused doc for how to run reports and interpret results.
- [x] Add a command reference doc for `dev`, `demo`, `start`, `stop`, `build`, and `test` workflows.
- [x] Add technical system flowcharts for current combat, loot, auth, boss, persistence, and map progression behavior (`docs/SYSTEM_FLOWCHARTS.md`).
- [x] Decide which command content should stay in `README.md` versus dedicated docs.
- [x] Break roadmap work into smaller phase checklists when that improves continuity and portfolio readability.
- [x] Keep roadmap/checklist status updated when implementation changes project status.
- [x] Start larger tasks with a short brainstorming / impact-check step before coding.
- [x] Add a visual system guide documenting how to add new monster sprites and spell effects (`docs/VISUALS.md`).

### UX and feedback

- [x] Improve login/register error handling so the UI shows clear causes such as wrong password, invalid email, existing account, missing fields, short password, and backend/API failures.
- [x] Show total gold value before confirming `Sell all`.
- [x] Add rarity-specific inventory selling and pickup auto-sell controls (`Sell Normal/Magic/Rare`, `Auto-sell Normal/Magic/Rare`) while keeping uniques protected.
- [ ] Hide, move, or replace low-value `Active spell` and `Map state` panels during map runs.

### Map pacing and sustain

- [ ] Re-evaluate map pacing so runs feel longer and more meaningful than short arena bursts.
- [ ] Tune map sustain so map progression stalls less often due to low map drops.
- [x] Make simulator output clearly show whether map sustain is too low.
- Note: A first pass landed on May 8, 2026 (higher monster counts per tier, tier-scaled pack count, enemy aggro radius, and a short completion delay for loot pickup). Follow up with simulator-driven tuning.

### Item readability and visuals

- [x] Centralize item rarity colors so equipped gear, inventory, loot, shop, and item cards use the same visual rules.
- [x] Remove misleading unique flavor text from item cards when no gameplay effect exists; show concrete stats only.
- [x] Make `Normal` items roll zero affixes so rarity lines up with item complexity (`Magic` = 1–2, `Rare` = 3+).
- [ ] Add more varied map backgrounds driven by config, with room for tier-specific and random variants.

### Longer-term chase systems

- [x] Add a first-pass rare-spawn boss key loop for progression and farming (guardian mechanic: 10%/5% per-map spawn chance, always drops key on kill).
- [x] Add a first-pass boss key structure with tier-linked unlocks and reusable farming keys.
- [x] Add a first-pass boss reward structure with a separate boss drop pool and simulator-visible expected value.
- [x] Expand the first-pass boss reward structure into tier-specific unique pools (`2` regular uniques + `1` chase unique per tier boss).
- [ ] Add stronger crafting materials and a fuller long-term chase structure on top of the new tier-specific boss pools.

## Phase 2 Scope Extensions Status Snapshot

These scope extensions are still part of `Phase 2`, but many have moved from "planned" to "implemented (first pass)". The goal remains simulator-first correctness, not polish.

Implemented (first pass):

- Elemental enemies now exist: `Cinder Grub` (Fire, tier 2+), `Frost Sprite` (Cold, tier 3+), `Storm Hound` (Lightning, tier 4+), `Blaze Warden` (Rare, Fire, tier 3+). Monster selection randomizes across eligible types per tier and rarity so maps gradually introduce elemental variety.
- Boss difficulty tuned per tier so bosses function as a real progression gate (~50-55% completion for a well-geared benchmark character at T3-9). Normal map farming targets ~80-90% completion at T1-4 and T7-9.
- Benchmark profiles (`sim-profiles/benchmark-tier1` through `benchmark-tier9`) redesigned to reflect realistic player progression: 2 support spells per spell slot, a second spell loadout slot from tier 5, and tier-scaled equipment (weapon, boots, body armor, helmet, gloves, amulet, ring, belt) with meaningful resistance and HP growth. Benchmark profiles are gitignored and regenerated locally via `npm run sim:bench`.
- A full tier 1-9 balance pass (normal maps + bosses) was completed using the simulator as the primary decision tool, with documented outcomes informing boss multiplier and gear scaling decisions.
- Movement speed is a derived stat and affects runtime + simulation movement.
- Auto-move targets the nearest living pack, walks straight-line toward pack center, stops in combat range, and continues to the next pack.
- Packs spawn with a stable pack id + pack center, basic spacing from player and other packs, and an initial rare chance per pack.
- Map pacing first pass: increased monster counts per tier + tier-scaled pack count (more fights + more travel).
- Enemy aggro radius exists so enemies only chase when the player is nearby.
- Map completion has a short delay after the last kill to allow final loot pickup.
- Ground loot drops to the world with real payloads (item/currency/spell/map) and is picked up by proximity, validated/applied by domain logic.
- Item generation is PoE-inspired:
  - slot-scoped prefix/suffix pools
  - rarity controls affix count with `max 3 prefixes` + `max 3 suffixes`
  - base items provide inherent armor/evasion (defense bases) and inherent weapon speed multipliers (weapon bases), gated by map tier
- Boss key guardian mechanic: at map creation a single rare is designated the "key guardian" (10% chance before first clear of that tier boss, 5% afterward). When that specific enemy is killed it always drops a key — no roll. Replaces the old first-rare-kill 10%/5% roll model.
- Boss lairs now exist as challengeable tier bosses whose keys drop as real consumable map items, remain in inventory until a successful boss kill, gate next-tier progression on first clear, award three guaranteed next-tier starter maps on first clear, and use tier-specific boss unique pools.
- Simulator reporting includes item roll distributions (tier buckets), movement-speed affix visibility, boss key gain rate, imbuing orb output, and clearer map-sustain stall signals.

Implemented (continued):

- Combat foundation follow-through complete:
  - elemental resistances, enemy damage types, resistance penetration, and resistance caps in shared domain combat logic
  - equipment and affixes can grant armor, evasion, and elemental resistances
  - character UI exposes defense stats for visibility during tuning
  - armor mitigation: `min(0.50, armor / (armor + rawDamage × 5))` — PoE-inspired diminishing returns, physical damage only
  - evasion dodge: `min(0.25, evasion / (evasion + 400))` — caps at 25% per-hit dodge chance
  - crit multiplier is now a derived stat (default 1.6, ready for item and support bonuses)
- Richer simulator telemetry (full T1–T9 balance pass completed 2026-05-09):
  - time moving vs fighting per run
  - damage dealt, prevented by resistance, prevented by armor, evades per run
  - item distribution: Normal / Magic / Rare / Exceptional / Unique per run
  - guardian spawn rate and kill rate per run
  - full sweep documented in `docs/BALANCE_PASS_2026-05-09.md`
- All-in-one simulator report: a single run now outputs all balance-relevant data — character snapshot (HP/armor/evasion/resistances/crit/speeds), offense (spells cast, damage dealt, crits), defense (hits taken, evade rate, damage prevented by type), kills (total, rares, packs cleared), economy, and full item distribution with rarity % breakdown and stat-tier histogram
- Armor mitigation validated in benchmark: body armor uses `armor` stat (T4: 35 → T9: 235) so the `min(0.50, armor/(armor + rawDmg×5))` formula is exercised in every benchmark run; previously all benchmark defense was evasion-only

- Phaser visuals (first pass, out-of-phase early delivery):
  - All monsters now render with real 0x72 DungeonTileset II idle sprite animations, each mapped to a named spriteName in `frontend/src/game/phaser/spriteConfig.ts`.
  - Phaser now also supports custom horizontal spritesheets via `assetPath`, piloted with a cleaned `Scrap Crawler` sheet in `frontend/public/assets/monstersprites/`.
  - Player character renders as an animated wizard sprite (wizzard_m) with camera follow.
  - Spell effects use the Gizmo Effect pack spritesheet (32x32): fire, electric, and ice animations routed per spell tags.
  - Three visual animation types: `animateLightningChain` (jagged bolt hopping between enemies), `animateProjectileLance` (straight beam), `animateAreaExplosion` (ring + impact sprite at radius).
  - `SpellVisualEvent` added to `ArenaSnapshot`; domain emits one event per cast; Phaser processes each event exactly once via `processedSpellEventIds`.
  - Snapshot throttle in `useArenaSession` bypassed when spell events are present so no cast is silently dropped.
  - `docs/VISUALS.md` and `docs/PIXEL_ART_PROMPTS.md` now document both visual wiring and external sprite-prompt workflows.

Still planned (next major domain work):
- Item stat roll UI: expose roll distributions to players (min/max per stat, tier label on item card).
- Add stronger boss crafting/material rewards and a fuller long-term chase structure beyond the current tier-specific unique pools.
