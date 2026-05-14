# Simulation Guide

## Purpose

This document explains how to run the Shardborne headless simulator, what its reports mean, and how it supports `Phase 2 - Balance Infrastructure`.

## Why It Exists

The simulator exists to make balancing faster, more repeatable, and less subjective.

It is used to:

- compare map difficulty without Phaser rendering
- evaluate map sustain
- tune loot, spell rarity, and support unlock pacing
- compare drop and shop reward pressure
- validate balance changes with profiles and overrides
- tune boss key farming rates and boss material pressure
- compare normal-map sustain targets against boss reward output

## Main Command

Run from `frontend/`:

```powershell
npm run sim -- --profile starter-caster --map trainingGrounds --runs 100
```

Generate rough benchmark profiles for tiered boss and map checks:

```powershell
npm run sim:bench
```

Use the current backend character instead of a saved local profile:

```powershell
npm run sim -- --email you@example.com --password your-password --map tier3Map --runs 100
```

## Character Sources

The simulator supports two character sources:

- local profile JSON via `--profile`
- current backend character via `--email` + `--password`

Useful profile workflow:

```powershell
npm run sim -- --email you@example.com --password your-password --map tier3Map --runs 100 --save-profile sim-profiles/daniel-current-build.json
```

That lets you snapshot a real character and reuse it for repeatable comparisons later.

Benchmark shortcuts:

- `npm run sim:bench` writes `frontend/sim-profiles/benchmark-tier1.json` through `benchmark-tier9.json`
- `npm run sim -- --benchmark-tier 4 --map tier4Map --runs 200` runs an in-memory tier benchmark without creating a file first
- `npm run sim -- --benchmark-tier 4 --map bossTier4 --runs 200` is the fastest way to sanity-check whether a rough tier-4 build can beat the tier-4 boss

## Useful Options

- `--map trainingGrounds|tier1Map|tier2Map|...`
- `--runs 100|500|1000`
- `--benchmark-tier 1|2|3|...`
- `--write-tier-benchmarks 9`
- `--shop-samples 500`
- `--shop-tier 6`
- `--output reports/tier3.json`
- `--save-profile sim-profiles/name.json`
- `--overrides sim-overrides/example-balancedrops.json`
- `--flask-threshold 0.45`
- `--flask-threshold none`

## Example Workflows

Quick baseline run:

```powershell
npm run sim -- --profile starter-caster --map trainingGrounds --runs 100
```

Quick key-farming baseline:

```powershell
npm run sim:keys
```

Boss progression check with a rough tier benchmark:

```powershell
npm run sim -- --benchmark-tier 3 --map bossTier3 --runs 200
```

Generate reusable tier benchmarks, then run a same-tier farm check:

```powershell
npm run sim:bench
npm run sim -- --profile benchmark-tier5 --map tier5Map --runs 250
```

Repeatable comparison with overrides:

```powershell
npm run sim -- --profile starter-caster --map tier3Map --runs 250 --overrides sim-overrides/example-balancedrops.json
```

Shop pressure sampling:

```powershell
npm run sim -- --profile starter-caster --map trainingGrounds --runs 25 --shop-samples 500
```

## How To Read The Report

The report is primarily useful for trends and comparisons, not single-run intuition.

### Character snapshot

Printed at the top of every report — shows the benchmark character's actual derived stats (HP, armor, evasion, resistances, crit, speeds). Use this to confirm the profile you intended is actually running, and to compare two runs where only the character differs.

### Economy and progression

- `Completion rate` / `Death rate` / `Timeout rate`
- `Avg health on completion` — how much HP remained on successful clears (proxy for safety margin)
- `Average run time`
- `Economy` section — gold, shards, orbs, map sustain, boss keys, map drop rate
- `Balance tweaks` section — active global and tier-specific combat, density, and sustain multipliers for the simulated map tier

### Kills and packs

- `Total kills` / `Rares killed` — monsters per run
- `Packs cleared` — packs cleared vs spawned (should be equal on completed runs)
- `Guardian spawn rate / killed` — key guardian mechanic pressure

### Time

- `Moving` vs `Fighting` seconds per run — use to evaluate movement speed changes or pack density tuning

### Offense

- `Spells cast` / `Damage dealt` / `Avg/spell` — raw throughput
- `Crits` — count and crit rate (spells that critted / total casts)

### Defense

- `Hits taken` / `Evades` / `Evade rate` — formula: `min(0.25, evasion / (evasion + 400))`
- `Damage dealt to player` — raw damage after evasion
- `Prevented by resistance` — elemental mitigation
- `Prevented by armor` — physical mitigation via `min(0.50, armor / (armor + rawDmg × 5))`

### Item distribution

- `Total items/run` with rarity % breakdown: Normal / Magic / Rare / Exceptional / Unique
- `Spells` — spell drops per run (target ≈ 0.05–0.12 for normal maps)
- `Supports` — support spell drops per run
- `Support categories` — common vs chase support drops, useful when tuning support unlock pacing separately from main spell drops
- `Maps` / `Currency pickups` — ground loot volume per run

### Item rolls

- `By rarity` and `By slot` — cumulative totals across all runs
- `Top stats` — most commonly rolled affixes (useful for spotting oversupply)
- `Stat tier distribution` — per-stat breakdown of T1–T5 rolls (use to verify tier weights and roll ranges)
- Optional `Shop samples` — price range and roll distribution if `--shop-samples N` is passed

Current sustain model notes:

- Normal maps target about `1.0` same-tier map per full clear.
- Boss lairs are measured by completion rate, guaranteed boss reward output, and imbuing orb drops — not map sustain.

## How To Use It Well

Good simulator usage usually looks like this:

1. Pick one baseline profile.
2. Pick one map tier or progression slice.
3. Run enough samples to reduce noise.
4. Change one meaningful variable at a time.
5. Compare output, not just intuition.

Recommended comparison habits:

- keep the same profile between runs unless testing build progression
- keep the same run count when comparing variants
- save JSON reports when a comparison matters
- use overrides before editing core config values directly

## Current Interpretation Notes

The simulator is especially useful for:

- early and mid-tier map difficulty
- map sustain pressure
- spell drop rarity
- support unlock and chase-support pacing
- unique tier pacing
- shop pricing pressure

It is less useful for:

- final feel or moment-to-moment presentation
- visual clarity
- anything that depends mainly on future Phaser readability

## Limits

The simulator is a balance tool, not a replacement for all playtesting.

It should not be treated as proof that:

- combat feels good
- UI is readable
- rewards feel emotionally satisfying
- pacing is visually or emotionally correct

It helps answer balance questions faster. It does not replace runtime play judgment.
