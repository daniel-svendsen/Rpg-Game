import { itemBalance, mapBalance, monsterBalance, spellDropBalance } from "../config/balance";
import type { SimulationBalanceOverrides } from "./simulationTypes";

type MutableMonsterBalance = {
  baseHealth: number;
  baseDamage: number;
};

type MutableMapTierFields = {
  itemDropRate: number;
  mapShardDropRate: number;
  mapDropRate: number;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  rareMonsterChance: number;
};

type MutableSpellDropBalance = {
  rareMonsterDropChanceMultiplier: number;
  baseDropChanceByTier: Record<number, number>;
};

const clampChance = (value: number): number => Math.max(0, Math.min(0.95, value));

const scaleMapFields = (
  target: MutableMapTierFields,
  overrides: SimulationBalanceOverrides
): void => {
  if (overrides.itemDropRateMultiplier !== undefined) {
    target.itemDropRate = clampChance(target.itemDropRate * overrides.itemDropRateMultiplier);
  }

  if (overrides.mapShardDropRateMultiplier !== undefined) {
    target.mapShardDropRate = clampChance(target.mapShardDropRate * overrides.mapShardDropRateMultiplier);
  }

  if (overrides.mapDropRateMultiplier !== undefined) {
    target.mapDropRate = clampChance(target.mapDropRate * overrides.mapDropRateMultiplier);
  }

  if (overrides.mapEnemyHealthMultiplier !== undefined) {
    target.enemyHealthMultiplier = Math.max(0.05, target.enemyHealthMultiplier * overrides.mapEnemyHealthMultiplier);
  }

  if (overrides.mapEnemyDamageMultiplier !== undefined) {
    target.enemyDamageMultiplier = Math.max(0.05, target.enemyDamageMultiplier * overrides.mapEnemyDamageMultiplier);
  }

  if (overrides.rareMonsterChanceMultiplier !== undefined) {
    target.rareMonsterChance = clampChance(target.rareMonsterChance * overrides.rareMonsterChanceMultiplier);
  }
};

export const applySimulationBalanceOverrides = (
  overrides?: SimulationBalanceOverrides
): (() => void) => {
  if (!overrides) {
    return () => undefined;
  }

  const mutableMonsterBalance = monsterBalance as unknown as MutableMonsterBalance;
  const mutableTrainingGrounds = mapBalance.trainingGrounds as unknown as MutableMapTierFields;
  const mutableMapTiers = Object.values(mapBalance.tiers) as unknown as MutableMapTierFields[];
  const mutableSpellDropBalance = spellDropBalance as unknown as MutableSpellDropBalance;
  const previousMonsterBaseHealth = mutableMonsterBalance.baseHealth;
  const previousMonsterBaseDamage = mutableMonsterBalance.baseDamage;
  const previousTrainingGrounds = {
    ...mutableTrainingGrounds
  };
  const previousTierValues = mutableMapTiers.map((tier) => ({ ...tier }));
  const previousSpellDropBaseChanceByTier = {
    ...mutableSpellDropBalance.baseDropChanceByTier
  };
  const previousRareMonsterSpellDropMultiplier = mutableSpellDropBalance.rareMonsterDropChanceMultiplier;
  const previousRareMonsterMapShardDropMultiplier = itemBalance.rareMonsterMapShardDropMultiplier;

  if (overrides.enemyBaseHealthMultiplier !== undefined) {
    mutableMonsterBalance.baseHealth = Math.max(1, Math.round(mutableMonsterBalance.baseHealth * overrides.enemyBaseHealthMultiplier));
  }

  if (overrides.enemyBaseDamageMultiplier !== undefined) {
    mutableMonsterBalance.baseDamage = Math.max(1, Math.round(mutableMonsterBalance.baseDamage * overrides.enemyBaseDamageMultiplier));
  }

  scaleMapFields(mutableTrainingGrounds, overrides);
  mutableMapTiers.forEach((tier) => scaleMapFields(tier, overrides));

  if (overrides.spellDropChanceMultiplier !== undefined) {
    Object.entries(mutableSpellDropBalance.baseDropChanceByTier).forEach(([tier, chance]) => {
      mutableSpellDropBalance.baseDropChanceByTier[Number(tier)] = clampChance(
        chance * overrides.spellDropChanceMultiplier!
      );
    });
    mutableSpellDropBalance.rareMonsterDropChanceMultiplier = Math.max(
      0,
      mutableSpellDropBalance.rareMonsterDropChanceMultiplier * overrides.spellDropChanceMultiplier
    );
  }

  if (overrides.mapShardDropRateMultiplier !== undefined) {
    (itemBalance as { rareMonsterMapShardDropMultiplier: number }).rareMonsterMapShardDropMultiplier =
      Math.max(0, itemBalance.rareMonsterMapShardDropMultiplier * overrides.mapShardDropRateMultiplier);
  }

  return () => {
    mutableMonsterBalance.baseHealth = previousMonsterBaseHealth;
    mutableMonsterBalance.baseDamage = previousMonsterBaseDamage;

    Object.assign(mutableTrainingGrounds, previousTrainingGrounds);
    mutableMapTiers.forEach((tier, index) => {
      Object.assign(tier, previousTierValues[index]);
    });

    mutableSpellDropBalance.baseDropChanceByTier = previousSpellDropBaseChanceByTier;
    mutableSpellDropBalance.rareMonsterDropChanceMultiplier = previousRareMonsterSpellDropMultiplier;
    (itemBalance as { rareMonsterMapShardDropMultiplier: number }).rareMonsterMapShardDropMultiplier =
      previousRareMonsterMapShardDropMultiplier;
  };
};
