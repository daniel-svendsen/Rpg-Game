import { balanceConfig } from "../game/config/balanceConfig";
import { spellConfig, supportSpellConfig } from "../game/config/spellConfig";
import { generateItemDrop } from "../game/domain/items/itemGenerator";
import { getItemPowerScore } from "../game/domain/items/itemPower";
import type { EquipmentSlot, InventoryItem } from "../shared/types/saveTypes";

export type ShopItemState = InventoryItem & { price: number };

export const equipmentSlots: EquipmentSlot[] = [
  "Weapon",
  "Helmet",
  "Amulet",
  "BodyArmor",
  "Belt",
  "Gloves",
  "Boots",
  "Ring1",
  "Ring2"
];

export const accountEmailStorageKey = "arpg-account-email";

export const createShopStock = (tier: number): InventoryItem[] =>
  Array.from({ length: 3 }, (_, index) =>
    generateItemDrop(
      Math.max(1, tier),
      tier >= balanceConfig.economy.guaranteedRareStartTier && index === 2
    )
  );

export const toShopItemState = (item: InventoryItem): ShopItemState => ({
  ...item,
  price: Math.round(
    (balanceConfig.economy.shopBasePrice +
      getItemPowerScore(item) * balanceConfig.economy.shopPowerPriceMultiplier) *
      balanceConfig.economy.shopRarityPriceMultiplier[item.rarity]
  )
});

export const getSpellAccentClassName = (spellId: string): string => {
  const tags = spellConfig[spellId]?.tags ?? [];

  if (tags.includes("Lightning")) {
    return "spell-accent-lightning";
  }

  if (tags.includes("Fire")) {
    return "spell-accent-fire";
  }

  if (tags.includes("Cold")) {
    return "spell-accent-cold";
  }

  return "spell-accent-neutral";
};

export const getSupportAccentClassName = (supportSpellId: string): string => {
  const tags = supportSpellConfig[supportSpellId]?.tags ?? [];

  if (tags.includes("Critical")) {
    return "support-accent-critical";
  }

  if (tags.includes("CastSpeed")) {
    return "support-accent-speed";
  }

  if (tags.includes("Chain") || tags.includes("Projectile")) {
    return "support-accent-projectile";
  }

  if (tags.includes("Area")) {
    return "support-accent-area";
  }

  return "support-accent-damage";
};

export const getItemSellPrice = (item: InventoryItem): number =>
  Math.max(
    balanceConfig.economy.itemSellPriceFloor,
    Math.round(getItemPowerScore(item) * balanceConfig.economy.itemSellPriceMultiplier)
  );

export const formatPowerChange = (powerChange: number | null): string =>
  powerChange === null
    ? "Power change: New slot item"
    : `Power change: ${powerChange > 0 ? "+" : ""}${powerChange.toFixed(0)}`;
