import type { LootEntry } from "../shared/types/saveTypes";
import type { RunBatchState, RunSummaryData } from "./appTypes";

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

export const buildRunSummaryData = (
  mapName: string,
  wasDefeated: boolean,
  loot: LootEntry[],
  batch: RunBatchState | null
): RunSummaryData => {
  const completedBatch = advanceRunBatch(batch, loot);

  return {
    mapName,
    wasDefeated,
    loot: completedBatch?.loot ?? loot,
    completedMaps: completedBatch?.completedMaps ?? 1
  };
};
