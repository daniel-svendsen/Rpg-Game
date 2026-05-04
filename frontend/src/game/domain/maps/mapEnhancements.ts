import { createClientId } from "../../../shared/utils/id";
import { getMapEnhancementDefinition, mapEnhancementBalance } from "../../config/balance/mapEnhancementBalance";
import { pickWeighted } from "../loot/weightedTables";
import type { MapEnhancementId, MapEnhancementInstance, OwnedMapStack } from "../../../shared/types/saveTypes";
import type { MapDefinition } from "../../config/mapConfig";

export interface ResolvedMapEnhancementEffects {
  itemDropRateMultiplier: number;
  mapShardDropRateMultiplier: number;
  experienceGainMultiplier: number;
  goldGainMultiplier: number;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  enemySpeedMultiplier: number;
  enemyResistanceBonus: number;
  monsterCountBonus: number;
  rareMonsterChanceBonus: number;
}

export interface ResolvedMapInstance extends MapDefinition {
  enhancementCount: number;
  enhancements: MapEnhancementInstance[];
  enhancementEffects: ResolvedMapEnhancementEffects;
}

const defaultEffects = (): ResolvedMapEnhancementEffects => ({
  itemDropRateMultiplier: 1,
  mapShardDropRateMultiplier: 1,
  experienceGainMultiplier: 1,
  goldGainMultiplier: 1,
  enemyHealthMultiplier: 1,
  enemyDamageMultiplier: 1,
  enemySpeedMultiplier: 1,
  enemyResistanceBonus: 0,
  monsterCountBonus: 0,
  rareMonsterChanceBonus: 0
});

export const normalizeMapEnhancements = (
  enhancements: Partial<MapEnhancementInstance>[] | undefined
): MapEnhancementInstance[] =>
  (enhancements ?? [])
    .map((enhancement) => enhancement?.id)
    .filter((enhancementId): enhancementId is MapEnhancementId =>
      mapEnhancementBalance.pool.some((entry) => entry.id === enhancementId)
    )
    .slice(0, mapEnhancementBalance.maxEnhancementsPerMap)
    .map((enhancementId) => ({ id: enhancementId }));

export const getMapStackSignature = (entry: Pick<OwnedMapStack, "mapId" | "tier" | "enhancements">): string =>
  `${entry.mapId}:${entry.tier}:${entry.enhancements.map((enhancement) => enhancement.id).join("|")}`;

export const createOwnedMapStackId = (): string => `map-stack-${createClientId()}`;

export const getMapEnhancementLines = (enhancements: MapEnhancementInstance[]): string[] =>
  enhancements.flatMap((enhancement) => {
    const definition = getMapEnhancementDefinition(enhancement.id);
    return [definition.rewardText, definition.dangerText];
  });

export const getMapEnhancementSummary = (enhancements: MapEnhancementInstance[]): string[] =>
  enhancements.map((enhancement) => {
    const definition = getMapEnhancementDefinition(enhancement.id);
    return `${definition.name}: ${definition.rewardText} | ${definition.dangerText}`;
  });

export const combineMapEnhancementEffects = (
  enhancements: MapEnhancementInstance[]
): ResolvedMapEnhancementEffects =>
  enhancements.reduce<ResolvedMapEnhancementEffects>((combinedEffects, enhancement) => {
    const effects = getMapEnhancementDefinition(enhancement.id).effects;

    return {
      itemDropRateMultiplier:
        combinedEffects.itemDropRateMultiplier * (effects.itemDropRateMultiplier ?? 1),
      mapShardDropRateMultiplier:
        combinedEffects.mapShardDropRateMultiplier * (effects.mapShardDropRateMultiplier ?? 1),
      experienceGainMultiplier:
        combinedEffects.experienceGainMultiplier * (effects.experienceGainMultiplier ?? 1),
      goldGainMultiplier: combinedEffects.goldGainMultiplier * (effects.goldGainMultiplier ?? 1),
      enemyHealthMultiplier:
        combinedEffects.enemyHealthMultiplier * (effects.enemyHealthMultiplier ?? 1),
      enemyDamageMultiplier:
        combinedEffects.enemyDamageMultiplier * (effects.enemyDamageMultiplier ?? 1),
      enemySpeedMultiplier:
        combinedEffects.enemySpeedMultiplier * (effects.enemySpeedMultiplier ?? 1),
      enemyResistanceBonus:
        combinedEffects.enemyResistanceBonus + (effects.enemyResistanceBonus ?? 0),
      monsterCountBonus: combinedEffects.monsterCountBonus + (effects.monsterCountBonus ?? 0),
      rareMonsterChanceBonus:
        combinedEffects.rareMonsterChanceBonus + (effects.rareMonsterChanceBonus ?? 0)
    };
  }, defaultEffects());

export const resolveMapInstance = (
  baseMap: MapDefinition,
  enhancements: MapEnhancementInstance[]
): ResolvedMapInstance => {
  const enhancementEffects = combineMapEnhancementEffects(enhancements);

  return {
    ...baseMap,
    monsterCount: Math.max(1, baseMap.monsterCount + enhancementEffects.monsterCountBonus),
    experienceMultiplier: baseMap.experienceMultiplier * enhancementEffects.experienceGainMultiplier,
    goldMultiplier: baseMap.goldMultiplier * enhancementEffects.goldGainMultiplier,
    enemyHealthMultiplier: baseMap.enemyHealthMultiplier * enhancementEffects.enemyHealthMultiplier,
    enemyDamageMultiplier: baseMap.enemyDamageMultiplier * enhancementEffects.enemyDamageMultiplier,
    enhancementCount: enhancements.length,
    enhancements,
    enhancementEffects
  };
};

export const rollMapEnhancement = (existingEnhancements: MapEnhancementInstance[]): MapEnhancementInstance | null => {
  const existingIds = new Set(existingEnhancements.map((enhancement) => enhancement.id));
  const remainingPool = mapEnhancementBalance.pool.filter((entry) => !existingIds.has(entry.id));

  if (remainingPool.length === 0) {
    return null;
  }

  const rolledId =
    pickWeighted(remainingPool.map((entry) => ({ key: entry.id, weight: entry.weight }))) ?? null;

  return rolledId ? { id: rolledId } : null;
};
