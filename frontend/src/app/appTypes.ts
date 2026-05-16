import type { LootEntry } from "../shared/types/saveTypes";

export type ScreenMode = "auth" | "characterSelect" | "character" | "hub" | "arena" | "runSummary";
export type HubTab = "maps" | "boss" | "equipment" | "spells" | "craft" | "shop" | "character" | "account";
export type OverlayPanel = "equipmentPicker" | "mainSpellPicker" | "supportPicker" | "passiveSupportPicker" | null;
export type SelectedMapTarget = "trainingGrounds" | string;

export interface RunBatchState {
  totalMaps: number;
  completedMaps: number;
  loot: LootEntry[];
}

export interface RunSummaryData {
  mapName: string;
  wasDefeated: boolean;
  loot: LootEntry[];
  completedMaps: number;
  completionNotes: string[];
}
