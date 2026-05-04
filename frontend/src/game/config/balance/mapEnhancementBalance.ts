import type { MapEnhancementId } from "../../../shared/types/saveTypes";

const percent = (value: number): number => value / 100;

export interface MapEnhancementDefinition {
  id: MapEnhancementId;
  name: string;
  rewardText: string;
  dangerText: string;
  weight: number;
  effects: {
    itemDropRateMultiplier?: number;
    mapShardDropRateMultiplier?: number;
    experienceGainMultiplier?: number;
    goldGainMultiplier?: number;
    enemyHealthMultiplier?: number;
    enemyDamageMultiplier?: number;
    enemySpeedMultiplier?: number;
    enemyResistanceBonus?: number;
    monsterCountBonus?: number;
    rareMonsterChanceBonus?: number;
  };
}

export const mapEnhancementBalance = {
  maxEnhancementsPerMap: 3,
  shardCostsByEnhancementCount: [3, 5, 7] as const,
  pool: [
    {
      id: "overflowingSpoils",
      name: "Overflowing Spoils",
      rewardText: "+25% more item drops",
      dangerText: "+22% enemy health",
      weight: 100,
      effects: {
        itemDropRateMultiplier: 1.25,
        enemyHealthMultiplier: 1.22
      }
    },
    {
      id: "gildedHunt",
      name: "Gilded Hunt",
      rewardText: "+32% more gold",
      dangerText: "+16% enemy speed",
      weight: 90,
      effects: {
        goldGainMultiplier: 1.32,
        enemySpeedMultiplier: 1.16
      }
    },
    {
      id: "scholarMarch",
      name: "Scholar's March",
      rewardText: "+28% more experience",
      dangerText: "+10 monsters",
      weight: 88,
      effects: {
        experienceGainMultiplier: 1.28,
        monsterCountBonus: 10
      }
    },
    {
      id: "shardstorm",
      name: "Shardstorm",
      rewardText: "+30% more Map Shards",
      dangerText: "+18% enemy damage",
      weight: 86,
      effects: {
        mapShardDropRateMultiplier: 1.3,
        enemyDamageMultiplier: 1.18
      }
    },
    {
      id: "chargedBestiary",
      name: "Charged Bestiary",
      rewardText: "+4.0% rare monster chance",
      dangerText: "+18% enemy speed",
      weight: 80,
      effects: {
        rareMonsterChanceBonus: percent(4),
        enemySpeedMultiplier: 1.18
      }
    },
    {
      id: "heavyResistance",
      name: "Heavy Resistance",
      rewardText: "+18% more item drops",
      dangerText: "+15% enemy elemental resistance",
      weight: 76,
      effects: {
        itemDropRateMultiplier: 1.18,
        enemyResistanceBonus: percent(15)
      }
    }
  ] satisfies MapEnhancementDefinition[]
} as const;

export const getMapEnhancementDefinition = (
  enhancementId: MapEnhancementId
): MapEnhancementDefinition =>
  mapEnhancementBalance.pool.find((entry) => entry.id === enhancementId) ?? mapEnhancementBalance.pool[0];

export const getEnhancementShardCost = (currentEnhancementCount: number): number =>
  mapEnhancementBalance.shardCostsByEnhancementCount[
    Math.min(currentEnhancementCount, mapEnhancementBalance.shardCostsByEnhancementCount.length - 1)
  ];
