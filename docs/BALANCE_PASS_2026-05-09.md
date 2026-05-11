# Balance Pass - 2026-05-09

## Summary

Full simulator sweep across T1-T9 normal maps and T1-T9 boss lairs.
Combat math follow-through: evasion and armor mitigation now active in
simulation. Crit multiplier moved from hardcoded `1.6x` to a derived stat.

---

## Simulator Report Fields Added

Each `npm run sim` run now emits:

- **Time breakdown** - moving vs fighting seconds per average run
- **Damage profile** - raw dealt, prevented by resistance, prevented by armor, evades
- **Item distribution** - Normal / Magic / Rare / Exceptional / Unique per run
- **Guardian data** - spawn rate and kill rate per run

---

## Normal Map Sweep (200 runs each, benchmark character)

| Tier | Compl% | Death% | Sustain | Keys/run | Guardian spawn | Evades | Dealt | PrevRes | PrevArm | Norm | Magic | Rare | Spells |
|------|--------|--------|---------|----------|----------------|--------|-------|---------|---------|------|-------|------|--------|
| T1 | 87% | 13% | 1.20 | 0.10 | 14% | - | 355 | 0 | 0 | 2.3 | 0.7 | 0.18 | 0.04 |
| T2 | 84% | 16% | 1.01 | 0.07 | 9% | - | 503 | 0 | 0 | 2.3 | 1.0 | 0.28 | 0.10 |
| T3 | 90% | 11% | 1.22 | 0.07 | 9% | - | 517 | 8 | 0 | 3.1 | 1.0 | 0.29 | 0.12 |
| T4 | 87% | 13% | 1.03 | 0.08 | 9% | - | 579 | 30 | 0 | 3.3 | 1.3 | 0.42 | 0.16 |
| T5 | 99% | 2% | 1.24 | 0.07 | 8% | - | 474 | 46 | 0 | 4.0 | 1.7 | 0.57 | 0.09 |
| T6 | 100% | 0% | 1.16 | 0.13 | 9% | 7.3 | 323 | 43 | 0 | 4.8 | 2.3 | 0.80 | 0.07 |
| T7 | 96% | 4% | 0.99 | 0.06 | 7% | 31.9 | 1397 | 519 | 0 | 4.3 | 2.3 | 0.91 | 0.07 |
| T8 | 90% | 10% | 0.91 | 0.06 | 10% | 57.6 | 2104 | 1328 | 0 | 4.3 | 2.3 | 0.81 | 0.12 |
| T9 | 89% | 12% | 0.91 | 0.07 | 13% | 86.6 | 2671 | 2662 | 0 | 4.4 | 2.5 | 0.95 | 0.07 |

*Evasion pre-implementation: T7=82%, T8=71%, T9=68%. Evasion reduced damage ~20% and pushed completion into the 89-96% range for a fully-geared benchmark.*

*Armor prevented: 0 - benchmark character has no armor-giving items (only evasion). Formula is implemented; items with `armor` stat will benefit.*

---

## Boss Sweep (200 runs each, benchmark character)

| Tier | Compl% | Death% | Dealt | PrevRes | Unique/run |
|------|--------|--------|-------|---------|-----------|
| B1 | 67% | 34% | 378 | 0 | 0.67 |
| B2 | 85% | 16% | 484 | 0 | 0.84 |
| B3 | 52% | 48% | 546 | 0 | 0.52 |
| B4 | 51% | 49% | 687 | 29 | 0.51 |
| B5 | 52% | 49% | 792 | 52 | 0.52 |
| B6 | 70% | 30% | 920 | 79 | 0.70 |
| B7 | 49% | 52% | 1319 | 242 | 0.48 |
| B8 | 52% | 48% | 1391 | 525 | 0.52 |
| B9 | 55% | 46% | 1426 | 874 | 0.55 |

B2 (85%) and B6 (70%) are somewhat easier than the others. May tighten in a future pass.

---

## Decisions

### Map sustain

- T1-T6: sustain 1.01-1.24, all healthy
- T7-T9: sustain 0.91-0.99, slight deficit. Acceptable for high-tier pressure; players expected to stockpile before pushing.

### Spell drops

- 0.04-0.16/run across tiers. Target was 0.05-0.12. T4 (0.16) is slightly high; within acceptable range.
- Rares account for ~47% of spell drops via 8x multiplier - rare-drop identity confirmed.

### Guardian mechanic

- Spawn rates 7-14% per run, consistent with the 10%/5% target.
- Guardian kill rate ~80% when spawned (killed in most runs it appears).
- Keys: 0.06-0.13/run. Reasonable progression pressure.

### Evasion (implemented)

- Formula: `min(0.25, evasion / (evasion + 400))`
- T6 benchmark (128 evasion): ~24% evade -> 20% damage reduction
- T9 benchmark (128 evasion): ~24% evade -> 10% damage reduction (fewer hits relative to resistance-prevented damage)
- Effect: meaningful survivability improvement without trivializing content.

### Armor (implemented, no benchmark items)

- Formula: `min(0.50, armor / (armor + rawDamage * 5))` - PoE-inspired diminishing returns
- Physical damage only.
- Benchmark character has no armor-giving items, so shown as 0 in all runs.
- Items that roll `armor` will see real mitigation when used.

### Crit multiplier

- Moved from hardcoded `1.6` to `derivedStats.critMultiplier` (default `1.6`).
- Ready for items and future support spells to extend it.

### Item distribution

- Normal: 2.3-4.4/run, Magic: 0.7-2.5/run, Rare: 0.2-0.95/run - good tier-based progression
- Uniques: 0-0.11/run from normal maps (mostly from bosses at 0.48-0.84/run)

---

## Open Observations

- T5 and T6 completion (99%/100%) suggest the benchmark character overshoots those tiers slightly. May just be accurate for a well-geared player. Not tuning now.
- B2 and B6 boss completion (~70-85%) are easier than the rest. Minor - no action for now.
- T8-T9 map sustain at 0.91 is slightly under 1.0. Can raise drop rates slightly if farming pressure is too high in playtesting.
- `timeFightingMs` at T7+ shows players in combat 31-41s per run vs 20-25s moving - pacing feels right.
