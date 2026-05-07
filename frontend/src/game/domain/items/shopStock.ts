import { balanceConfig } from "../../config/balanceConfig";
import { generateItemDrop } from "./itemGenerator";
import { getItemPowerScore, isExceptionalRare } from "./itemPower";
import type { InventoryItem } from "../../../shared/types/saveTypes";

export const createShopStock = (tier: number, size = 3): InventoryItem[] =>
  Array.from({ length: Math.max(1, size) }, (_, index) =>
    generateItemDrop(
      Math.max(1, tier),
      tier >= balanceConfig.economy.guaranteedRareStartTier && index === size - 1
    )
  );

export const getShopItemPrice = (item: InventoryItem): number => {
  const powerPrice =
    balanceConfig.economy.shopBasePrice +
    getItemPowerScore(item) * balanceConfig.economy.shopPowerPriceMultiplier;
  const rarityPrice = powerPrice * balanceConfig.economy.shopRarityPriceMultiplier[item.rarity];
  const tierPrice =
    rarityPrice * (1 + Math.max(0, item.tier - 1) * balanceConfig.economy.shopTierPriceMultiplier);
  const exceptionalPrice = isExceptionalRare(item)
    ? tierPrice * balanceConfig.economy.exceptionalRareShopPriceMultiplier
    : tierPrice;

  return Math.round(exceptionalPrice);
};

