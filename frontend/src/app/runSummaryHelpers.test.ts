import { describe, expect, it } from "vitest";
import type { LootEntry } from "../shared/types/saveTypes";
import { advanceRunBatch, buildBossRunCompletionNotes, buildRunSummaryData } from "./runSummaryHelpers";

const createLootEntry = (id: string, rarity: "Magic" | "Rare"): LootEntry => ({
  id,
  kind: "Item",
  name: `${rarity} Item`,
  details: [],
  isUpgrade: false,
  rarity
});

describe("runSummaryHelpers", () => {
  it("accumulates loot across queued maps", () => {
    const firstLoot = [createLootEntry("magic-1", "Magic")];
    const secondLoot = [createLootEntry("rare-1", "Rare"), createLootEntry("magic-2", "Magic")];
    const batchAfterFirst = advanceRunBatch(
      {
        totalMaps: 5,
        completedMaps: 0,
        loot: []
      },
      firstLoot
    );

    const summary = buildRunSummaryData("Tier 3 Map", false, secondLoot, batchAfterFirst);

    expect(summary.completedMaps).toBe(2);
    expect(summary.loot.map((entry) => entry.id)).toEqual(["magic-1", "rare-1", "magic-2"]);
  });

  it("keeps single-map summaries scoped to one run", () => {
    const loot = [createLootEntry("rare-1", "Rare")];

    const summary = buildRunSummaryData("Tier 2 Map", false, loot, null);

    expect(summary.completedMaps).toBe(1);
    expect(summary.loot).toEqual(loot);
    expect(summary.completionNotes).toEqual([]);
  });

  it("reports first-time boss unlock rewards in the run summary", () => {
    const notes = buildBossRunCompletionNotes({
      mapId: "bossTier1",
      wasDefeated: false,
      previousHighestUnlockedTier: 1,
      nextHighestUnlockedTier: 2,
      previousClearedBossTiers: [],
      nextClearedBossTiers: [1]
    });

    expect(notes).toEqual([
      "Tier 1 boss defeated for the first time.",
      "Tier 2 maps unlocked.",
      "Awarded 3 Tier 2 maps."
    ]);
  });
});
