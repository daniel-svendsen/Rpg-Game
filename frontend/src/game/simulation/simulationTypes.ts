import type { CharacterRecord, LootEntry, ItemSlot, InventoryItem } from "../../shared/types/saveTypes";

export interface SimulationBalanceOverrides {
  enemyBaseHealthMultiplier?: number;
  enemyBaseDamageMultiplier?: number;
  mapEnemyHealthMultiplier?: number;
  mapEnemyDamageMultiplier?: number;
  mapEnemyHealthMultiplierByTier?: Record<number, number>;
  mapEnemyDamageMultiplierByTier?: Record<number, number>;
  mapEnemyHealthMultiplierByMap?: Record<string, number>;
  mapEnemyDamageMultiplierByMap?: Record<string, number>;
  itemDropRateMultiplier?: number;
  mapShardDropRateMultiplier?: number;
  mapDropRateMultiplier?: number;
  spellDropChanceMultiplier?: number;
  rareMonsterChanceMultiplier?: number;
  rareMonsterChanceMultiplierByTier?: Record<number, number>;
  enemySpeedMultiplierByTier?: Record<number, number>;
  enemyAggroRadiusMultiplier?: number;
  enemyContactRangeMultiplier?: number;
  enemyContactDamageIntervalMultiplier?: number;
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
  imbuingOrbsGained: number;
  mapsGained: number;
  bossKeysGained: number;
  normalItemsDropped: number;
  magicItemsDropped: number;
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
  totalMonstersKilled: number;
  packsSpawned: number;
  packsCleared: number;
  guardianSpawned: boolean;
  guardianKilled: boolean;
  hitsTaken: number;
  evades: number;
  damageDealtToPlayer: number;
  damagePreventedByResistance: number;
  damagePreventedByArmor: number;
  damageDealtByPlayer: number;
  critsLanded: number;
  spellsCast: number;
  finalHealthPercent: number;
  timeMovingMs: number;
  timeFightingMs: number;
  itemRolls: ItemRollMetrics;
}

export interface ItemRollMetrics {
  itemsDropped: number;
  bySlot: Partial<Record<ItemSlot, number>>;
  byRarity: Partial<Record<InventoryItem["rarity"], number>>;
  byStatKey: Partial<Record<keyof InventoryItem["statBonuses"], number>>;
  byStatTier: Partial<Record<keyof InventoryItem["statBonuses"], Partial<Record<1 | 2 | 3 | 4 | 5, number>>>>;
}

export interface SimulationRunOptions {
  profileName: string;
  character: CharacterRecord;
  mapId: string;
  runs: number;
  shopSamples?: number;
  shopTier?: number;
  stepMs?: number;
  maxRunDurationMs?: number;
  autoUseLifeFlaskThreshold?: number;
  overrides?: SimulationBalanceOverrides;
}

export interface ShopSampleSummary {
  samples: number;
  tier: number;
  itemsGenerated: number;
  prices: {
    min: number;
    max: number;
    average: number;
  };
  itemRolls: ItemRollMetrics;
}

export interface CharacterSnapshot {
  maxHealth: number;
  armor: number;
  evasion: number;
  fireResistance: number;
  coldResistance: number;
  lightningResistance: number;
  critChance: number;
  critMultiplier: number;
  movementSpeedMultiplier: number;
  castSpeedMultiplier: number;
  spellPowerMultiplier: number;
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
  characterSnapshot: CharacterSnapshot;
  shop: ShopSampleSummary | null;
  sustain: {
    zeroMapRuns: number;
    atLeastOneMapRuns: number;
    zeroMapRunRate: number;
    expectedZeroMapRunsBeforeDrop: number;
  };
  totals: {
    completedRuns: number;
    deaths: number;
    timedOutRuns: number;
    goldGained: number;
    mapShardsGained: number;
    imbuingOrbsGained: number;
    mapsGained: number;
    bossKeysGained: number;
    normalItemsDropped: number;
    magicItemsDropped: number;
    rareItemsDropped: number;
    exceptionalRareItemsDropped: number;
    uniqueItemsDropped: number;
    uniqueTier1ItemsDropped: number;
    uniqueTier2ItemsDropped: number;
    uniqueTier3ItemsDropped: number;
    spellDrops: number;
    rareMonstersSpawned: number;
    rareMonstersKilled: number;
    totalMonstersKilled: number;
    packsSpawned: number;
    packsCleared: number;
    guardianSpawns: number;
    guardianKills: number;
    hitsTaken: number;
    evades: number;
    damageDealtToPlayer: number;
    damagePreventedByResistance: number;
    damagePreventedByArmor: number;
    damageDealtByPlayer: number;
    critsLanded: number;
    spellsCast: number;
    timeMovingMs: number;
    timeFightingMs: number;
    lootByKind: Record<LootEntry["kind"], number>;
  };
  itemRolls: ItemRollMetrics;
  averages: {
    completionRate: number;
    deathRate: number;
    timeoutRate: number;
    durationSeconds: number;
    goldGained: number;
    mapShardsGained: number;
    imbuingOrbsGained: number;
    mapsGained: number;
    bossKeysGained: number;
    normalItemsDropped: number;
    magicItemsDropped: number;
    rareItemsDropped: number;
    exceptionalRareItemsDropped: number;
    uniqueItemsDropped: number;
    uniqueTier1ItemsDropped: number;
    uniqueTier2ItemsDropped: number;
    uniqueTier3ItemsDropped: number;
    spellDrops: number;
    rareMonstersSpawned: number;
    rareMonstersKilled: number;
    totalMonstersKilled: number;
    packsSpawned: number;
    packsCleared: number;
    guardianSpawnRate: number;
    guardianKillRate: number;
    hitsTaken: number;
    evades: number;
    evadeRate: number;
    damageDealtToPlayer: number;
    damagePreventedByResistance: number;
    damagePreventedByArmor: number;
    damageDealtByPlayer: number;
    critsLanded: number;
    spellsCast: number;
    critRate: number;
    avgDamagePerSpell: number;
    timeMovingSeconds: number;
    timeFightingSeconds: number;
    finalHealthPercent: number;
  };
  runsByOutcome: SingleRunSimulationMetrics[];
}
