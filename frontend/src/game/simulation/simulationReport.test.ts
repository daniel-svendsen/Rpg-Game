import { describe, expect, it } from "vitest";
import { buildSimulationSummary } from "./simulationReport";
import type { SingleRunSimulationMetrics } from "./simulationTypes";

describe("simulationReport", () => {
  it("aggregates run metrics into totals and averages", () => {
    const runs: SingleRunSimulationMetrics[] = [
      {
        runNumber: 1,
        mapId: "trainingGrounds",
        mapName: "Training Grounds",
        completed: true,
        died: false,
        timedOut: false,
        durationMs: 40_000,
        goldGained: 120,
        mapShardsGained: 1,
        mapsGained: 0,
        rareItemsDropped: 1,
        uniqueItemsDropped: 0,
        spellDrops: 1,
        lootByKind: { Item: 2, Spell: 1, Currency: 1, Map: 0 },
        rareMonstersSpawned: 4,
        rareMonstersKilled: 4
      },
      {
        runNumber: 2,
        mapId: "trainingGrounds",
        mapName: "Training Grounds",
        completed: false,
        died: true,
        timedOut: false,
        durationMs: 20_000,
        goldGained: 60,
        mapShardsGained: 0,
        mapsGained: 1,
        rareItemsDropped: 0,
        uniqueItemsDropped: 1,
        spellDrops: 0,
        lootByKind: { Item: 1, Spell: 0, Currency: 0, Map: 1 },
        rareMonstersSpawned: 2,
        rareMonstersKilled: 1
      }
    ];

    const summary = buildSimulationSummary(
      "test-profile",
      "trainingGrounds",
      runs,
      50,
      240_000,
      0.45,
      null
    );

    expect(summary.totals.completedRuns).toBe(1);
    expect(summary.totals.deaths).toBe(1);
    expect(summary.totals.goldGained).toBe(180);
    expect(summary.totals.rareItemsDropped).toBe(1);
    expect(summary.totals.uniqueItemsDropped).toBe(1);
    expect(summary.totals.spellDrops).toBe(1);
    expect(summary.totals.lootByKind.Map).toBe(1);
    expect(summary.averages.completionRate).toBe(0.5);
    expect(summary.averages.durationSeconds).toBe(30);
    expect(summary.averages.rareMonstersKilled).toBe(2.5);
  });
});
