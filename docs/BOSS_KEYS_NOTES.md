# Boss keys and boss drops (brainstorm notes)

Status: implemented (first pass) on May 8, 2026.

## High-level concept

- Rare monster variants can sometimes spawn in maps.
- Map runs can drop consumable boss keys (`bossTierN`) that start a boss lair run.
- Defeating a boss lair unlocks the corresponding map tier.
- Boss lairs have a separate, higher-value drop pool.

## Current implementation (first pass)

- Boss keys are stored as consumable maps with `mapId` like `bossTier2`.
- Boss key drops are rolled on the first rare kill per run in non-boss maps:
  - If the next tier is still locked: attempt next-tier key at 10%, otherwise attempt current-tier key at 5%.
  - If the next tier is already unlocked: attempt current-tier key at 5% (boss farming).
- Boss lairs spawn a single guaranteed rare boss.
- Boss lairs drop:
  - 1 boss-only unique per run (5% chance the chase unique)
  - `Imbuing Orb` currency (60% chance)
- Boss lairs can be farmed indefinitely as long as you have keys. The first kill of `bossTierN` is what unlocks Tier `N` maps.

## Questions to answer before implementation

- How rare are keys supposed to be (per map, per rare pack, or per rare kill)?
- Are keys tier-gated?
- Are keys boss-specific, generic, or tier-scoped?
- Should keys be craftable (e.g. fragments), or only drop as a full key?
- What are the trade-offs: sell vs save vs use (and what is the intended gold value)?
- What makes boss fights distinct (mechanics, resistances, arenas, time pressure)?
- What is the intended chase structure for boss uniques and how does that interact with map sustain?

## Simulator expectations (later)

- Rare key-monster spawn rate
- Key drop rate
- Boss run frequency over time
- Expected value from boss runs vs normal mapping
- Progression impact: do keys accelerate or destabilize map sustain and shop pressure?
