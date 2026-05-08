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

  return {
    id: `bossTier${tier}`,
    name: `Boss Lair (Tier ${tier})`,
    tier,
    monsterCount: 1,
    monsterLevel: tierBalance.monsterLevel + 1,
    dropRateMultiplier: 2.4,
    experienceMultiplier: tierBalance.experienceGainMultiplier * 1.2,
    goldMultiplier: tierBalance.goldGainMultiplier * 1.25,
    enemyHealthMultiplier: tierBalance.enemyHealthMultiplier * 3.8,
    enemyDamageMultiplier: tierBalance.enemyDamageMultiplier * 2.5
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
