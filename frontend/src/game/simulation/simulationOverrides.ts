import { itemBalance, mapBalance, monsterBalance, spellDropBalance } from "../config/balance";
import { balanceConfig } from "../config/balanceConfig";
import { mapConfig } from "../config/mapConfig";
import type { SimulationBalanceOverrides } from "./simulationTypes";

type MutableMonsterBalance = {
  baseHealth: number;
  baseDamage: number;
};

type MutableMapTierFields = {
  normalMonsterSpeed: number;
  rareMonsterSpeed: number;
  itemDropRate: number;
  mapShardDropRate: number;
  sameTierMapDropsPerRunTarget: number;
  nextTierMapDropsPerRunTarget: number;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
};

type MutableCombatFields = {
  enemyAggroRadius: number;
  enemyContactRange: number;
  enemyContactDamageIntervalMs: number;
};

type MutableSpellDropBalance = {
  rareMonsterDropChanceMultiplier: number;
  baseDropChanceByTier: Record<number, number>;
};

type MutableMapConfigFields = {
  id: string;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
};

const clampChance = (value: number): number => Math.max(0, Math.min(0.95, value));

const parseTierFromMapId = (mapId: string): number | null => {
  if (mapId === "trainingGrounds") {
    return 0;
  }

  const tierMapMatch = mapId.match(/^tier(\d+)Map$/);
  if (tierMapMatch) {
    return Number(tierMapMatch[1]);
  }

  const bossMapMatch = mapId.match(/^bossTier(\d+)$/);
  if (bossMapMatch) {
    return Number(bossMapMatch[1]);
  }

  return null;
};

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
    target.sameTierMapDropsPerRunTarget = Math.max(
      0,
      target.sameTierMapDropsPerRunTarget * overrides.mapDropRateMultiplier
    );
    target.nextTierMapDropsPerRunTarget = Math.max(
      0,
      target.nextTierMapDropsPerRunTarget * overrides.mapDropRateMultiplier
    );
  }

  if (overrides.mapEnemyHealthMultiplier !== undefined) {
    target.enemyHealthMultiplier = Math.max(0.05, target.enemyHealthMultiplier * overrides.mapEnemyHealthMultiplier);
  }

  if (overrides.mapEnemyDamageMultiplier !== undefined) {
    target.enemyDamageMultiplier = Math.max(0.05, target.enemyDamageMultiplier * overrides.mapEnemyDamageMultiplier);
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
  const mutableMapConfigEntries = Object.values(mapConfig) as unknown as MutableMapConfigFields[];
  const mutableSpellDropBalance = spellDropBalance as unknown as MutableSpellDropBalance;
  const mutableCombat = balanceConfig.combat as unknown as MutableCombatFields;
  const previousMonsterBaseHealth = mutableMonsterBalance.baseHealth;
  const previousMonsterBaseDamage = mutableMonsterBalance.baseDamage;
  const previousTrainingGrounds = {
    ...mutableTrainingGrounds
  };
  const previousTierValues = mutableMapTiers.map((tier) => ({ ...tier }));
  const previousMapConfigValues = mutableMapConfigEntries.map((entry) => ({
    id: entry.id,
    enemyHealthMultiplier: entry.enemyHealthMultiplier,
    enemyDamageMultiplier: entry.enemyDamageMultiplier
  }));
  const previousSpellDropBaseChanceByTier = {
    ...mutableSpellDropBalance.baseDropChanceByTier
  };
  const previousCombat = {
    enemyAggroRadius: mutableCombat.enemyAggroRadius,
    enemyContactRange: mutableCombat.enemyContactRange,
    enemyContactDamageIntervalMs: mutableCombat.enemyContactDamageIntervalMs
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
  mutableMapConfigEntries.forEach((entry) => {
    if (overrides.mapEnemyHealthMultiplier !== undefined) {
      entry.enemyHealthMultiplier = Math.max(0.05, entry.enemyHealthMultiplier * overrides.mapEnemyHealthMultiplier);
    }

    if (overrides.mapEnemyDamageMultiplier !== undefined) {
      entry.enemyDamageMultiplier = Math.max(0.05, entry.enemyDamageMultiplier * overrides.mapEnemyDamageMultiplier);
    }
  });

  if (overrides.mapEnemyHealthMultiplierByTier !== undefined) {
    for (const [tierKey, multiplier] of Object.entries(overrides.mapEnemyHealthMultiplierByTier)) {
      const tier = Number(tierKey);
      if (!Number.isFinite(tier)) {
        continue;
      }

      mutableMapConfigEntries
        .filter((entry) => parseTierFromMapId(entry.id) === tier)
        .forEach((entry) => {
          entry.enemyHealthMultiplier = Math.max(0.05, entry.enemyHealthMultiplier * multiplier);
        });
    }
  }

  if (overrides.mapEnemyDamageMultiplierByTier !== undefined) {
    for (const [tierKey, multiplier] of Object.entries(overrides.mapEnemyDamageMultiplierByTier)) {
      const tier = Number(tierKey);
      if (!Number.isFinite(tier)) {
        continue;
      }

      mutableMapConfigEntries
        .filter((entry) => parseTierFromMapId(entry.id) === tier)
        .forEach((entry) => {
          entry.enemyDamageMultiplier = Math.max(0.05, entry.enemyDamageMultiplier * multiplier);
        });
    }
  }

  if (overrides.mapEnemyHealthMultiplierByMap !== undefined) {
    for (const [mapId, multiplier] of Object.entries(overrides.mapEnemyHealthMultiplierByMap)) {
      const target = mutableMapConfigEntries.find((entry) => entry.id === mapId);
      if (!target) {
        continue;
      }
      target.enemyHealthMultiplier = Math.max(0.05, target.enemyHealthMultiplier * multiplier);
    }
  }

  if (overrides.mapEnemyDamageMultiplierByMap !== undefined) {
    for (const [mapId, multiplier] of Object.entries(overrides.mapEnemyDamageMultiplierByMap)) {
      const target = mutableMapConfigEntries.find((entry) => entry.id === mapId);
      if (!target) {
        continue;
      }
      target.enemyDamageMultiplier = Math.max(0.05, target.enemyDamageMultiplier * multiplier);
    }
  }

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

  if (overrides.enemySpeedMultiplierByTier !== undefined) {
    for (const [tierKey, multiplier] of Object.entries(overrides.enemySpeedMultiplierByTier)) {
      const tier = Number(tierKey);
      if (!Number.isFinite(tier) || tier <= 0) {
        continue;
      }
      const targetTier = (mapBalance.tiers as unknown as Record<number, MutableMapTierFields>)[tier];
      if (!targetTier) {
        continue;
      }
      targetTier.normalMonsterSpeed = Math.max(1, targetTier.normalMonsterSpeed * multiplier);
      targetTier.rareMonsterSpeed = Math.max(1, targetTier.rareMonsterSpeed * multiplier);
    }
  }

  if (overrides.enemyAggroRadiusMultiplier !== undefined) {
    mutableCombat.enemyAggroRadius = Math.max(1, mutableCombat.enemyAggroRadius * overrides.enemyAggroRadiusMultiplier);
  }

  if (overrides.enemyContactRangeMultiplier !== undefined) {
    mutableCombat.enemyContactRange = Math.max(1, mutableCombat.enemyContactRange * overrides.enemyContactRangeMultiplier);
  }

  if (overrides.enemyContactDamageIntervalMultiplier !== undefined) {
    mutableCombat.enemyContactDamageIntervalMs = Math.max(
      50,
      Math.round(mutableCombat.enemyContactDamageIntervalMs * overrides.enemyContactDamageIntervalMultiplier)
    );
  }

  return () => {
    mutableMonsterBalance.baseHealth = previousMonsterBaseHealth;
    mutableMonsterBalance.baseDamage = previousMonsterBaseDamage;

    Object.assign(mutableTrainingGrounds, previousTrainingGrounds);
    mutableMapTiers.forEach((tier, index) => {
      Object.assign(tier, previousTierValues[index]);
    });
    previousMapConfigValues.forEach((previous) => {
      const target = mutableMapConfigEntries.find((entry) => entry.id === previous.id);
      if (!target) {
        return;
      }
      target.enemyHealthMultiplier = previous.enemyHealthMultiplier;
      target.enemyDamageMultiplier = previous.enemyDamageMultiplier;
    });

    mutableSpellDropBalance.baseDropChanceByTier = previousSpellDropBaseChanceByTier;
    mutableSpellDropBalance.rareMonsterDropChanceMultiplier = previousRareMonsterSpellDropMultiplier;
    (itemBalance as { rareMonsterMapShardDropMultiplier: number }).rareMonsterMapShardDropMultiplier =
      previousRareMonsterMapShardDropMultiplier;
    mutableCombat.enemyAggroRadius = previousCombat.enemyAggroRadius;
    mutableCombat.enemyContactRange = previousCombat.enemyContactRange;
    mutableCombat.enemyContactDamageIntervalMs = previousCombat.enemyContactDamageIntervalMs;
  };
};
