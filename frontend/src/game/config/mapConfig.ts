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
  )
};
