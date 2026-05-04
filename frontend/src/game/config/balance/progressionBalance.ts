export const progressionBalance = {
  progression: {
    startingStatPoints: 10,
    statPointsPerLevel: 2,
    healthPerLevel: 10,
    baseExperienceToLevel: 120,
    experienceGrowthFactor: 1.24
  },
  statScaling: {
    baseHealth: 100,
    vitalityHealthMultiplier: 14,
    agilityCastSpeedMultiplier: 0.015,
    dexterityCritChanceMultiplier: 0.004,
    strengthSpellPowerMultiplier: 0.025
  },
  rewards: {
    normalExperienceBase: 10,
    rareExperienceBase: 22,
    normalGoldBase: 9,
    rareGoldBase: 24
  },
  spellProgression: {
    maxLevel: 10,
    baseUpgradeGoldCost: 30,
    upgradeGoldGrowthFactor: 1.45,
    shardUpgradeStartLevel: 4,
    shardUpgradeInterval: 3
  }
} as const;
