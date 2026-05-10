# Boss keys and boss drops (brainstorm notes)

Status: implemented and updated through May 10, 2026.

## High-level concept

- Rare monster variants can sometimes spawn in maps.
- A map tier is gated by defeating the boss for the previous tier.
- Finding your first key for a tier permanently unlocks boss retries for that tier until the first successful kill.
- Boss lairs have a separate, higher-value drop pool with tier-specific uniques.

## Current implementation

- Boss keys are stored as consumable maps with `mapId` like `bossTier2`.
- Boss key drops come from a designated `key guardian` rare in non-boss maps:
  - `10%` guardian spawn chance while that tier boss is still uncleared
  - `5%` guardian spawn chance after that tier boss has been cleared
  - if the guardian dies, it always drops the key for that same tier boss
- Boss lairs spawn a single guaranteed rare boss.
- Once the first key for a tier is found, the player can challenge that boss repeatedly without finding another key first.
- The first kill of a tier boss unlocks the next map tier.
- The first kill of a tier boss also grants `3` starter maps of the next tier.
- Boss lairs drop:
  - at least `1` guaranteed boss reward on a successful boss kill
  - the guaranteed reward is currently a boss-only unique drawn from that tier boss pool (`2` regular uniques + `1` chase unique)
  - an additional `Imbuing Orb` currency drop still has a `60%` chance
- Boss lairs can be farmed indefinitely after discovery, but first-clear progression still gates next-tier map access.
- Normal maps now target roughly `1.0` same-tier map and only unlock next-tier map drops after the relevant boss clear. Boss lairs do not participate in that normal map-sustain model.

## Notes and remaining follow-up

- Keys are tier-scoped and progression-gated, but still use internal `bossTierN` map ids for the lair runs.
- Boss reward identity now exists per tier, but crafting-material depth beyond `Imbuing Orb` is still open.
- Boss fight mechanics are still mostly stat-and-pressure driven rather than bespoke encounter mechanics.

## Simulator expectations

- Rare key-monster spawn rate
- Key drop rate
- Boss run frequency over time
- Expected value from boss runs vs normal mapping
- Progression impact: do keys accelerate or destabilize map sustain and shop pressure?
