export const balanceConfig = {
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
  monsterScaling: {
    baseHealth: 28,
    baseDamage: 7,
    baseMovementSpeed: 38,
    healthPerTierMultiplier: 1.18,
    damagePerTierMultiplier: 1.12
  },
  mapTierScaling: {
    maxTier: 10,
    enemyCountBase: 18,
    enemyCountPerTier: 4,
    dropRateMultiplierPerTier: 0.12,
    experienceMultiplierPerTier: 0.1,
    goldMultiplierPerTier: 0.08,
    enemyHealthMultiplierPerTier: 0.16,
    enemyDamageMultiplierPerTier: 0.11
  },
  combatRewards: {
    normalExperienceBase: 10,
    rareExperienceBase: 22,
    normalGoldBase: 9,
    rareGoldBase: 24
  },
  currencyDrops: {
    shardDropChance: 0.18
  },
  itemDrops: {
    baseChance: 0.12,
    rareMonsterBonusChance: 0.08
  },
  mapDrops: {
    higherTierChance: 0.02
  },
  uniqueItemDrop: {
    baseChance: 0.002,
    rareMonsterBonusChance: 0.01
  },
  spellDropRates: {
    baseChance: 0.05,
    rareMonsterBonusChance: 0.08
  },
  rareMonsterDropRules: {
    rareMonsterChance: 0.15,
    rareItemDropsMin: 1,
    rareItemDropsMax: 1
  },
  itemTierStatRanges: {
    1: {
      strength: [1, 3],
      agility: [1, 3],
      vitality: [1, 4],
      dexterity: [1, 3],
      maxHealth: [6, 16],
      critChance: [0.01, 0.03],
      spellPowerMultiplier: [0.02, 0.05]
    }
  },
  combat: {
    autoPickupRadius: 9999,
    enemyContactDamageIntervalMs: 850
  },
  healing: {
    refillToFullOnMapStart: true,
    lifeFlask: {
      maxCharges: 18,
      chargesPerUse: 6,
      healPercentPerUse: 0.4,
      normalKillCharges: 1,
      rareKillCharges: 3
    }
  },
  economy: {
    shopRefreshGoldCost: 14,
    shopBasePrice: 10,
    shopPowerPriceMultiplier: 0.55,
    guaranteedRareStartTier: 4
  },
  mapCrafting: {
    enhanceShardCost: 3,
    combineShardsCost: 5
  },
  spellProgression: {
    maxLevel: 10,
    baseUpgradeGoldCost: 30,
    upgradeGoldGrowthFactor: 1.45,
    shardUpgradeStartLevel: 4,
    shardUpgradeInterval: 3
  },
  supportSpellModifiers: {
    increasedCriticalChance: 0.08,
    fasterCasting: 0.18,
    moreDamage: 0.22,
    chainSupport: 1,
    areaSupport: 12,
    projectileSupport: 1
  }
} as const;

export type BalanceConfig = typeof balanceConfig;
