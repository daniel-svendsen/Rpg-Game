import type { Dispatch, SetStateAction } from "react";
import { balanceConfig } from "../game/config/balanceConfig";
import type { AutoSellRarity, CharacterRecord, InventoryItem } from "../shared/types/saveTypes";
import type { ShopItemState } from "./appUiHelpers";

interface UseShopActionsParams {
  character: CharacterRecord | null;
  commitCharacter: (nextCharacter: CharacterRecord | null) => void;
  shopItems: ShopItemState[];
  setShopItems: Dispatch<SetStateAction<ShopItemState[]>>;
  resetShopForTier: (tier: number) => void;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  getItemSellPrice: (item: InventoryItem) => number;
}

export const useShopActions = ({
  character,
  commitCharacter,
  shopItems,
  setShopItems,
  resetShopForTier,
  setStatusMessage,
  setErrorMessage,
  getItemSellPrice
}: UseShopActionsParams) => {
  const handleBuyShopItem = (itemId: string): void => {
    if (!character) {
      return;
    }

    const item = shopItems.find((entry) => entry.id === itemId);

    if (!item) {
      return;
    }

    if (character.gold < item.price) {
      setErrorMessage("Not enough gold.");
      return;
    }

    commitCharacter({
      ...character,
      gold: character.gold - item.price,
      inventory: [...character.inventory, item]
    });
    setShopItems((current) => current.filter((entry) => entry.id !== itemId));
    setStatusMessage(`Bought ${item.name}.`);
  };

  const handleRefreshShop = (): void => {
    if (!character || character.gold < balanceConfig.economy.shopRefreshGoldCost) {
      setErrorMessage(`You need ${balanceConfig.economy.shopRefreshGoldCost} gold to refresh the shop.`);
      return;
    }

    commitCharacter({
      ...character,
      gold: character.gold - balanceConfig.economy.shopRefreshGoldCost
    });
    resetShopForTier(character.mapProgress.highestUnlockedTier + 1);
  };

  const handleSellItem = (itemId: string): void => {
    if (!character) {
      return;
    }

    const item = character.inventory.find((entry) => entry.id === itemId);

    if (!item) {
      return;
    }

    const sellPrice = getItemSellPrice(item);
    commitCharacter({
      ...character,
      gold: character.gold + sellPrice,
      inventory: character.inventory.filter((entry) => entry.id !== itemId)
    });
    setStatusMessage(`Sold ${item.name} for ${sellPrice} gold.`);
  };

  const handleSellAllItems = (): void => {
    if (!character || character.inventory.length === 0) {
      return;
    }

    const totalGold = character.inventory.reduce((total, item) => total + getItemSellPrice(item), 0);
    const isConfirmed = window.confirm(`Sell all items for ${totalGold} gold?`);

    if (!isConfirmed) {
      return;
    }

    commitCharacter({
      ...character,
      gold: character.gold + totalGold,
      inventory: []
    });
    setStatusMessage(`Sold all inventory items for ${totalGold} gold.`);
  };

  const handleSellItemsByRarity = (rarity: AutoSellRarity): void => {
    if (!character) {
      return;
    }

    const itemsToSell = character.inventory.filter((item) => item.rarity === rarity);

    if (itemsToSell.length === 0) {
      setErrorMessage(`No ${rarity.toLowerCase()} items to sell.`);
      return;
    }

    const totalGold = itemsToSell.reduce((total, item) => total + getItemSellPrice(item), 0);
    const isConfirmed = window.confirm(
      `Sell all ${rarity.toLowerCase()} items (${itemsToSell.length}) for ${totalGold} gold?`
    );

    if (!isConfirmed) {
      return;
    }

    const soldIds = new Set(itemsToSell.map((item) => item.id));
    commitCharacter({
      ...character,
      gold: character.gold + totalGold,
      inventory: character.inventory.filter((item) => !soldIds.has(item.id))
    });
    setStatusMessage(`Sold ${itemsToSell.length} ${rarity.toLowerCase()} item${itemsToSell.length === 1 ? "" : "s"} for ${totalGold} gold.`);
    setErrorMessage(null);
  };

  return {
    handleBuyShopItem,
    handleRefreshShop,
    handleSellItem,
    handleSellAllItems,
    handleSellItemsByRarity
  };
};
