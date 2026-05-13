# Balance Session Log (2026-05-13)

## Goal

Increase late-tier pressure so progression to top tiers requires real build power,
while preserving room for future support-power creep.

## Character Baseline Used

- `frontend/sim-profiles/benchmark-endgame-high.json`
- Based on real character snapshot (`svendsen110-current`)

## What Was Added Technically

- New simulator override knobs:
  - `mapEnemyHealthMultiplierByTier`
  - `mapEnemyDamageMultiplierByTier`
  - `mapEnemyHealthMultiplierByMap`
  - `mapEnemyDamageMultiplierByMap`
  - `rareMonsterChanceMultiplierByTier`
  - `enemySpeedMultiplierByTier`
  - `enemyAggroRadiusMultiplier`
  - `enemyContactRangeMultiplier`
  - `enemyContactDamageIntervalMultiplier`

These are implemented in:

- `frontend/src/game/simulation/simulationTypes.ts`
- `frontend/src/game/simulation/simulationOverrides.ts`

## Key Findings

1. Global HP/damage multipliers alone were not enough to shape late-tier behavior precisely.
2. Per-tier/per-map controls worked and were required for useful tuning.
3. Raising only enemy damage had weak effect on remaining HP because hit frequency remained low.
4. Increasing contact pressure (speed, aggro, contact range, contact interval) had much larger impact.
5. Lowering flask threshold from `0.45` to `0.30` helped a little, but was not the primary lever.

## Candidate Overrides Tested

- `frontend/sim-overrides/late-tier-pressure-v1.json`
- `frontend/sim-overrides/late-tier-pressure-v2.json`
- `frontend/sim-overrides/late-tier-pressure-v2_5.json`
- `frontend/sim-overrides/late-tier-pressure-v2_6.json`
- `frontend/sim-overrides/late-tier-pressure-v2_7-map-damage.json`
- `frontend/sim-overrides/late-tier-pressure-v2_8-caster-pressure.json`
- `frontend/sim-overrides/late-tier-pressure-v2_9-life40.json`
- `frontend/sim-overrides/late-tier-pressure-v3.json`
- `frontend/sim-overrides/late-tier-pressure-v3_0-contact-pressure.json`
- `frontend/sim-overrides/late-tier-pressure-v3_1-life40-extreme.json`
- `frontend/sim-overrides/late-tier-pressure-v3_2-life40-target.json`
- `frontend/sim-overrides/late-tier-pressure-v3_3-life40-target.json`

## Working Snapshot (Most Useful Midpoint)

- `late-tier-pressure-v2_6.json` gave a strong late-tier shape without immediate collapse:
  - `bossTier10` ~`43.5%` clear on `benchmark-endgame-high` (200 runs)
  - late maps stayed consistently clearable

Use `v2_6` as the default restart point for future late-tier tuning.

## Current Working Baselines

- Endgame (T8-T10 tuning): `frontend/sim-overrides/late-tier-pressure-v2_6.json`
- Early/Mid progression sweep (T1-T7 + bosses): `frontend/sim-overrides/full-tier-balance-pass-v4_3.json`

## Latest Full-Tier Calibration (v4_3)

- Override: `frontend/sim-overrides/full-tier-balance-pass-v4_3.json`
- Character: `sim-profiles/svendsen110-current.json`
- Runs: `200` per scenario

Key results:

- `tier2Map` (benchmark-tier2): `73.0%` clear, `27.0%` death, `63.5%` avg HP on completion
- `tier4Map` (benchmark-tier4): `81.0%` clear, `19.0%` death, `65.8%` avg HP on completion
- `tier6Map` (benchmark-tier6): `98.5%` clear, `1.5%` death, `63.3%` avg HP on completion
- `bossTier5` (benchmark-tier5): `90.0%` clear, `10.0%` death, `61.3%` avg HP on completion
- `bossTier7` (benchmark-tier7): `76.5%` clear, `23.5%` death, `36.9%` avg HP on completion

Interpretation:

- `v4_2` over-corrected (`bossTier7` down to `8%` clear), so `v4_3` reduced global pressure and boss7-specific multipliers.
- `v4_3` is the current best compromise for non-endgame tiers while preserving the harder endgame curve in `v2_6`.

## Tier6 Follow-up (v4_4)

Requested follow-up:

1. Make `tier6Map` slightly harder
2. Re-verify `tier6Map`, `bossTier5`, `bossTier7`

Override created:

- `frontend/sim-overrides/full-tier-balance-pass-v4_4.json`

Delta from `v4_3`:

- `mapEnemyHealthMultiplierByTier[6]`: `1.10 -> 1.16`
- `mapEnemyDamageMultiplierByTier[6]`: `1.10 -> 1.16`
- `rareMonsterChanceMultiplierByTier[6]`: `1.05 -> 1.10`

Verification (200 runs, `sim-profiles/svendsen110-current.json`):

- `tier6Map` (benchmark-tier6): `96.0%` clear, `4.0%` death, `65.3%` avg HP on completion
- `bossTier5` (benchmark-tier5): `91.5%` clear, `8.5%` death, `63.4%` avg HP on completion
- `bossTier7` (benchmark-tier7): `79.0%` clear, `21.0%` death, `36.5%` avg HP on completion

Conclusion:

- Tier 6 became slightly harder vs `v4_3` while keeping boss5/boss7 in a stable range.

## If We Want Lower HP Remaining On Maps

Do this in order:

1. Increase contact pressure (`enemySpeedMultiplierByTier`, `enemyAggroRadiusMultiplier`, `enemyContactRangeMultiplier`, lower `enemyContactDamageIntervalMultiplier`)
2. Increase rare/caster pressure (`rareMonsterChanceMultiplierByTier`)
3. Increase raw damage only after (1) and (2)

This order produced stronger, more reliable HP-pressure changes than raw damage-only tuning.
