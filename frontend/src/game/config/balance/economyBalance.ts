export const economyBalance = {
  economy: {
    shopRefreshGoldCost: 90,
    shopBasePrice: 120,
    shopPowerPriceMultiplier: 3.2,
    shopTierPriceMultiplier: 0.16,
    exceptionalRareShopPriceMultiplier: 2.9,
    shopRarityPriceMultiplier: {
      Normal: 1.15,
      Magic: 1.75,
      Rare: 3.1,
      Unique: 6.5
    },
    itemSellPriceMultiplier: 0.22,
    itemSellPriceFloor: 3,
    guaranteedRareStartTier: 6
  },
  mapCrafting: {
    combineShardsCost: 5,
    shardCraftCostPerTier: 5,
    maxEnhancementsPerMap: 3,
    enhancementShardCosts: [3, 5, 7] as const
  }
} as const;
