import type { CharacterRecord, LootEntry, ItemSlot, InventoryItem } from "../../shared/types/saveTypes";

export interface SimulationBalanceOverrides {
  enemyBaseHealthMultiplier?: number;
  enemyBaseDamageMultiplier?: number;
  mapEnemyHealthMultiplier?: number;
  mapEnemyDamageMultiplier?: number;
  itemDropRateMultiplier?: number;
  mapShardDropRateMultiplier?: number;
  mapDropRateMultiplier?: number;
  spellDropChanceMultiplier?: number;
  rareMonsterChanceMultiplier?: number;
}

export interface SingleRunSimulationMetrics {
  runNumber: number;
  mapId: string;
  mapName: string;
  completed: boolean;
  died: boolean;
  timedOut: boolean;
  durationMs: number;
  goldGained: number;
  mapShardsGained: number;
  mapsGained: number;
  rareItemsDropped: number;
  exceptionalRareItemsDropped: number;
  uniqueItemsDropped: number;
  uniqueTier1ItemsDropped: number;
  uniqueTier2ItemsDropped: number;
  uniqueTier3ItemsDropped: number;
  spellDrops: number;
  lootByKind: Record<LootEntry["kind"], number>;
  rareMonstersSpawned: number;
  rareMonstersKilled: number;
  itemRolls: {
    itemsDropped: number;
    bySlot: Partial<Record<ItemSlot, number>>;
    byRarity: Partial<Record<InventoryItem["rarity"], number>>;
    byStatKey: Partial<Record<keyof InventoryItem["statBonuses"], number>>;
    byStatTier: Partial<Record<keyof InventoryItem["statBonuses"], Partial<Record<1 | 2 | 3 | 4 | 5, number>>>>;
  };
}

export interface SimulationRunOptions {
  profileName: string;
  character: CharacterRecord;
  mapId: string;
  runs: number;
  stepMs?: number;
  maxRunDurationMs?: number;
  autoUseLifeFlaskThreshold?: number;
  overrides?: SimulationBalanceOverrides;
}

export interface SimulationSummary {
  profileName: string;
  mapId: string;
  mapName: string;
  runs: number;
  stepMs: number;
  maxRunDurationMs: number;
  autoUseLifeFlaskThreshold: number | null;
  overrides: SimulationBalanceOverrides | null;
  totals: {
    completedRuns: number;
    deaths: number;
    timedOutRuns: number;
    goldGained: number;
    mapShardsGained: number;
    mapsGained: number;
    rareItemsDropped: number;
    exceptionalRareItemsDropped: number;
    uniqueItemsDropped: number;
    uniqueTier1ItemsDropped: number;
    uniqueTier2ItemsDropped: number;
    uniqueTier3ItemsDropped: number;
    spellDrops: number;
    rareMonstersSpawned: number;
    rareMonstersKilled: number;
    lootByKind: Record<LootEntry["kind"], number>;
  };
  itemRolls: {
    itemsDropped: number;
    bySlot: Partial<Record<ItemSlot, number>>;
    byRarity: Partial<Record<InventoryItem["rarity"], number>>;
    byStatKey: Partial<Record<keyof InventoryItem["statBonuses"], number>>;
    byStatTier: Partial<Record<keyof InventoryItem["statBonuses"], Partial<Record<1 | 2 | 3 | 4 | 5, number>>>>;
  };
  averages: {
    completionRate: number;
    deathRate: number;
    timeoutRate: number;
    durationSeconds: number;
    goldGained: number;
    mapShardsGained: number;
    mapsGained: number;
    rareItemsDropped: number;
    exceptionalRareItemsDropped: number;
    uniqueItemsDropped: number;
    uniqueTier1ItemsDropped: number;
    uniqueTier2ItemsDropped: number;
    uniqueTier3ItemsDropped: number;
    spellDrops: number;
    rareMonstersSpawned: number;
    rareMonstersKilled: number;
  };
  runsByOutcome: SingleRunSimulationMetrics[];
}
