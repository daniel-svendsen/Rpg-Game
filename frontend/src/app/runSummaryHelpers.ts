import type { LootEntry } from "../shared/types/saveTypes";
import type { RunBatchState, RunSummaryData } from "./appTypes";
import { mapBalance } from "../game/config/balance";

interface BossRunSummaryInput {
  mapId: string;
  wasDefeated: boolean;
  previousHighestUnlockedTier: number;
  nextHighestUnlockedTier: number;
  previousClearedBossTiers: number[];
  nextClearedBossTiers: number[];
}

export interface RunSummaryLootCounts {
  unique: number;
  rare: number;
  magic: number;
  bossKeys: number;
}

export const buildBossRunCompletionNotes = ({
  mapId,
  wasDefeated,
  previousHighestUnlockedTier,
  nextHighestUnlockedTier,
  previousClearedBossTiers,
  nextClearedBossTiers
}: BossRunSummaryInput): string[] => {
  if (wasDefeated || !mapId.startsWith("bossTier")) {
    return [];
  }

  const clearedTier = Number(mapId.replace("bossTier", ""));

  if (!Number.isInteger(clearedTier) || clearedTier <= 0) {
    return [];
  }

  const wasAlreadyCleared = previousClearedBossTiers.includes(clearedTier);
  const isNowCleared = nextClearedBossTiers.includes(clearedTier);

  if (wasAlreadyCleared || !isNowCleared) {
    return [];
  }

  const notes = [`Tier ${clearedTier} boss defeated for the first time.`];

  if (nextHighestUnlockedTier > previousHighestUnlockedTier) {
    notes.push(`Tier ${nextHighestUnlockedTier} maps unlocked.`);

    if (clearedTier < mapBalance.maxTier) {
      notes.push(`Awarded 3 Tier ${clearedTier + 1} maps.`);
    }
  }

  return notes;
};

export const advanceRunBatch = (batch: RunBatchState | null, loot: LootEntry[]): RunBatchState | null => {
  if (!batch) {
    return null;
  }

  return {
    ...batch,
    completedMaps: batch.completedMaps + 1,
    loot: [...batch.loot, ...loot]
  };
};

export const countRunSummaryLoot = (loot: LootEntry[]): RunSummaryLootCounts =>
  loot.reduce<RunSummaryLootCounts>(
    (counts, entry) => ({
      unique: counts.unique + (entry.rarity?.toLowerCase() === "unique" ? 1 : 0),
      rare: counts.rare + (entry.rarity?.toLowerCase() === "rare" ? 1 : 0),
      magic: counts.magic + (entry.rarity?.toLowerCase() === "magic" ? 1 : 0),
      bossKeys: counts.bossKeys + (entry.kind === "Map" && entry.name.startsWith("Boss Key") ? 1 : 0)
    }),
    {
      unique: 0,
      rare: 0,
      magic: 0,
      bossKeys: 0
    }
  );

export const buildRunSummaryData = (
  mapName: string,
  wasDefeated: boolean,
  loot: LootEntry[],
  batch: RunBatchState | null,
  completionNotes: string[] = []
): RunSummaryData => {
  const completedBatch = advanceRunBatch(batch, loot);

  return {
    mapName,
    wasDefeated,
    loot: completedBatch?.loot ?? loot,
    completedMaps: completedBatch?.completedMaps ?? 1,
    completionNotes
  };
};
