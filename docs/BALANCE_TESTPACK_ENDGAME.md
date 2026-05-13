# Endgame Balance Testpack (T8-T10)

Purpose: run the same repeatable suite when tuning late-tier maps and bosses.

## Profiles

- `benchmark-tier8`
- `benchmark-tier9`
- `benchmark-tier10`
- `benchmark-endgame-high`

`benchmark-endgame-high` is currently copied from the real character snapshot:
`frontend/sim-profiles/svendsen110-current.json`

## Baseline Commands (No Overrides)

Run from `frontend/`:

```bash
npm run sim -- --profile benchmark-tier8 --map tier8Map --runs 200
npm run sim -- --profile benchmark-tier9 --map tier9Map --runs 200
npm run sim -- --profile benchmark-tier10 --map tier10Map --runs 200

npm run sim -- --profile benchmark-tier8 --map bossTier8 --runs 200
npm run sim -- --profile benchmark-tier9 --map bossTier9 --runs 200
npm run sim -- --profile benchmark-tier10 --map bossTier10 --runs 200

npm run sim -- --profile benchmark-endgame-high --map tier8Map --runs 200
npm run sim -- --profile benchmark-endgame-high --map tier9Map --runs 200
npm run sim -- --profile benchmark-endgame-high --map tier10Map --runs 200

npm run sim -- --profile benchmark-endgame-high --map bossTier8 --runs 200
npm run sim -- --profile benchmark-endgame-high --map bossTier9 --runs 200
npm run sim -- --profile benchmark-endgame-high --map bossTier10 --runs 200
```

## Target Intent (Current Direction)

- Tier 8: stable for strong builds.
- Tier 9: clear pressure increase.
- Tier 10: aspirational and not trivial, especially with future support power creep.
- Boss Tier 10: should require an extremely strong build (not a speed-clear default).

## Note

Per-tier and per-map override support is now available in the simulator. Use:

- `mapEnemyHealthMultiplierByTier` / `mapEnemyDamageMultiplierByTier`
- `mapEnemyHealthMultiplierByMap` / `mapEnemyDamageMultiplierByMap`
- `rareMonsterChanceMultiplierByTier`
- `enemySpeedMultiplierByTier`
- `enemyAggroRadiusMultiplier`
- `enemyContactRangeMultiplier`
- `enemyContactDamageIntervalMultiplier`
