export const economyBalance = {
  economy: {
    shopRefreshGoldCost: 28,
    shopBasePrice: 24,
    shopPowerPriceMultiplier: 1.1,
    shopRarityPriceMultiplier: {
      Normal: 1,
      Magic: 1.35,
      Rare: 1.9,
      Unique: 3.2
    },
    itemSellPriceMultiplier: 0.22,
    itemSellPriceFloor: 3,
    guaranteedRareStartTier: 4
  },
  mapCrafting: {
    combineShardsCost: 5,
    maxEnhancementsPerMap: 3,
    enhancementShardCosts: [3, 5, 7] as const
  }
} as const;
