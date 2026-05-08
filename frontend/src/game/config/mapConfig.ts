import { getMapTierBalance, mapBalance } from "./balance";

export interface MapDefinition {
  id: string;
  name: string;
  tier: number;
  monsterCount: number;
  monsterLevel: number;
  dropRateMultiplier: number;
  experienceMultiplier: number;
  goldMultiplier: number;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
}

const createTierMapDefinition = (tier: number): MapDefinition => {
  const tierBalance = getMapTierBalance(tier);

  return {
    id: `tier${tier}Map`,
    name: `Tier ${tier} Map`,
    tier,
    monsterCount: tierBalance.monsterCount,
    monsterLevel: tierBalance.monsterLevel,
    dropRateMultiplier: 1,
    experienceMultiplier: tierBalance.experienceGainMultiplier,
    goldMultiplier: tierBalance.goldGainMultiplier,
    enemyHealthMultiplier: tierBalance.enemyHealthMultiplier,
    enemyDamageMultiplier: tierBalance.enemyDamageMultiplier
  };
};

const createBossMapDefinition = (tier: number): MapDefinition => {
  const tierBalance = getMapTierBalance(tier);
  const bossHealthMultiplierByTier: Record<number, number> = {
    1: 2.1,
    2: 2.1,
    3: 2.1,
    4: 2.18,
    5: 2.55,
    6: 3.2,
    7: 2.2,
    8: 2.25,
    9: 2.3,
    10: 2.35
  };
  const bossDamageMultiplierByTier: Record<number, number> = {
    1: 1.45,
    2: 1.45,
    3: 1.45,
    4: 1.57,
    5: 1.72,
    6: 2.05,
    7: 1.56,
    8: 1.6,
    9: 1.64,
    10: 1.68
  };
  const bossHealthMultiplier = bossHealthMultiplierByTier[tier] ?? 2.35;
  const bossDamageMultiplier = bossDamageMultiplierByTier[tier] ?? 1.68;

  return {
    id: `bossTier${tier}`,
    name: `Boss Lair (Tier ${tier})`,
    tier,
    monsterCount: 1,
    monsterLevel: tierBalance.monsterLevel + 1,
    dropRateMultiplier: 2.4,
    experienceMultiplier: tierBalance.experienceGainMultiplier * 1.2,
    goldMultiplier: tierBalance.goldGainMultiplier * 1.25,
    enemyHealthMultiplier: tierBalance.enemyHealthMultiplier * bossHealthMultiplier,
    enemyDamageMultiplier: tierBalance.enemyDamageMultiplier * bossDamageMultiplier
  };
};

export const mapConfig: Record<string, MapDefinition> = {
  trainingGrounds: {
    id: "trainingGrounds",
    name: "Training Grounds",
    tier: 0,
    monsterCount: mapBalance.trainingGrounds.monsterCount,
    monsterLevel: mapBalance.trainingGrounds.monsterLevel,
    dropRateMultiplier: 1,
    experienceMultiplier: mapBalance.trainingGrounds.experienceGainMultiplier,
    goldMultiplier: mapBalance.trainingGrounds.goldGainMultiplier,
    enemyHealthMultiplier: mapBalance.trainingGrounds.enemyHealthMultiplier,
    enemyDamageMultiplier: mapBalance.trainingGrounds.enemyDamageMultiplier
  },
  ...Object.fromEntries(
    Array.from({ length: mapBalance.maxTier }, (_, index) => {
      const tier = index + 1;
      const map = createTierMapDefinition(tier);
      return [map.id, map];
    })
  ),
  ...Object.fromEntries(
    Array.from({ length: mapBalance.maxTier }, (_, index) => {
      const tier = index + 1;
      const map = createBossMapDefinition(tier);
      return [map.id, map];
    })
  )
};
