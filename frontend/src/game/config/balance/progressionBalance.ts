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
    vitalityHealthMultiplier: 8,
    strengthPhysicalDamageMultiplier: 0.015,
    strengthAttackSpeedMultiplier: 0.005,
    agilityAttackSpeedMultiplier: 0.01,
    dexterityCritChanceMultiplier: 0.0025,
    critChanceCap: 0.75,
    intelligenceSpellPowerMultiplier: 0.015,
    intelligenceCastSpeedMultiplier: 0.005
  },
  rewards: {
    normalExperienceBase: 10,
    rareExperienceBase: 22,
    normalGoldBase: 9,
    rareGoldBase: 24
  },
  spellProgression: {
    maxLevel: 20,
    baseUpgradeGoldCost: 50,
    upgradeGoldStep: 275,
    shardUpgradeStartLevel: 4,
    shardUpgradeInterval: 3
  },
  supportProgression: {
    maxLevel: 20,
    baseUpgradeGoldCost: 20,
    upgradeGoldGrowthFactor: 1.35,
    shardUpgradeStartLevel: 6,
    shardUpgradeInterval: 4,
    effectScalingPerLevel: 0.06
  }
} as const;
