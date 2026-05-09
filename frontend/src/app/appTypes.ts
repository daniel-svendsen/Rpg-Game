import type { LootEntry } from "../shared/types/saveTypes";

export type ScreenMode = "auth" | "character" | "hub" | "arena" | "runSummary";
export type HubTab = "maps" | "boss" | "equipment" | "spells" | "shop" | "character";
export type OverlayPanel = "equipmentPicker" | "mainSpellPicker" | "supportPicker" | null;
export type SelectedMapTarget = "trainingGrounds" | string;

export interface RunSummaryData {
  mapName: string;
  wasDefeated: boolean;
  loot: LootEntry[];
}
