# Simulation Guide

## Purpose

This document explains how to run the Shardborne headless simulator, what its reports mean, and how it supports `Phase 2 - Balance Infrastructure`.

## Why It Exists

The simulator exists to make balancing faster, more repeatable, and less subjective.

It is used to:

- compare map difficulty without Phaser rendering
- evaluate map sustain
- tune loot and spell rarity
- compare drop and shop reward pressure
- validate balance changes with profiles and overrides

## Main Command

Run from `frontend/`:

```powershell
npm run sim -- --profile starter-caster --map trainingGrounds --runs 100
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

## Useful Options

- `--map trainingGrounds|tier1Map|tier2Map|...`
- `--runs 100|500|1000`
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

Key metrics:

- completion rate
- death rate
- timeout rate
- average run time
- average gold
- average map shards
- map sustain
- rare monsters encountered and killed
- item / spell / currency / map loot totals
- unique tier breakdown
- item roll summaries
- optional shop sample price and roll summaries

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

