import { balanceConfig } from "./balanceConfig";

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

const createTierMapDefinition = (tier: number): MapDefinition => ({
  id: `tier${tier}Map`,
  name: `Tier ${tier} Map`,
  tier,
  monsterCount:
    balanceConfig.mapTierScaling.enemyCountBase + tier * balanceConfig.mapTierScaling.enemyCountPerTier,
  monsterLevel: tier + 1,
  dropRateMultiplier: 1 + tier * balanceConfig.mapTierScaling.dropRateMultiplierPerTier,
  experienceMultiplier: 1 + tier * balanceConfig.mapTierScaling.experienceMultiplierPerTier,
  goldMultiplier: 1 + tier * balanceConfig.mapTierScaling.goldMultiplierPerTier,
  enemyHealthMultiplier: 1 + tier * balanceConfig.mapTierScaling.enemyHealthMultiplierPerTier,
  enemyDamageMultiplier: 1 + tier * balanceConfig.mapTierScaling.enemyDamageMultiplierPerTier
});

export const mapConfig: Record<string, MapDefinition> = {
  trainingGrounds: {
    id: "trainingGrounds",
    name: "Training Grounds",
    tier: 0,
    monsterCount: 20,
    monsterLevel: 1,
    dropRateMultiplier: 1,
    experienceMultiplier: 1,
    goldMultiplier: 1,
    enemyHealthMultiplier: 1,
    enemyDamageMultiplier: 1
  },
  ...Object.fromEntries(
    Array.from({ length: balanceConfig.mapTierScaling.maxTier }, (_, index) => {
      const tier = index + 1;
      const map = createTierMapDefinition(tier);
      return [map.id, map];
    })
  )
};
