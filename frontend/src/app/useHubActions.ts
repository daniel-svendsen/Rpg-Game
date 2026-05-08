import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { balanceConfig } from "../game/config/balanceConfig";
import { supportSpellConfig } from "../game/config/spellConfig";
import { equipItem } from "../game/domain/player/equipment";
import { useLifeFlask } from "../game/domain/player/lifeFlask";
import { spendLevelStatPoint } from "../game/domain/player/playerTypes";
import { getSpellName } from "../game/domain/spells/spellDrops";
import { getSpellLevel, upgradeSpell } from "../game/domain/spells/spellProgression";
import type { ArenaRuntimeState } from "../game/domain/combat/arenaSimulation";
import type { ArenaSnapshot, CharacterRecord, CharacterStats, EquipmentSlot, InventoryItem } from "../shared/types/saveTypes";

type ShopItemState = InventoryItem & { price: number };

interface UseHubActionsParams {
  character: CharacterRecord | null;
  selectedSupportSlot: 0 | 1;
  screenMode: "auth" | "character" | "hub" | "arena";
  arenaRuntimeRef: MutableRefObject<ArenaRuntimeState | null>;
  latestCharacterRef: MutableRefObject<CharacterRecord | null>;
  commitCharacter: (nextCharacter: CharacterRecord | null) => void;
  setOverlayPanel: Dispatch<SetStateAction<"equipmentPicker" | "mainSpellPicker" | "supportPicker" | null>>;
  shopItems: ShopItemState[];
  setShopItems: Dispatch<SetStateAction<ShopItemState[]>>;
  setArenaSnapshot: Dispatch<SetStateAction<ArenaSnapshot | null>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  createShopStock: (tier: number) => InventoryItem[];
  toShopItemState: (item: InventoryItem) => ShopItemState;
  getItemSellPrice: (item: InventoryItem) => number;
}

export const useHubActions = ({
  character,
  selectedSupportSlot,
  screenMode,
  arenaRuntimeRef,
  latestCharacterRef,
  commitCharacter,
  setOverlayPanel,
  shopItems,
  setShopItems,
  setArenaSnapshot,
  setStatusMessage,
  setErrorMessage,
  createShopStock,
  toShopItemState,
  getItemSellPrice
}: UseHubActionsParams) => {
  const handleEquipItem = (itemId: string, targetSlotOverride?: EquipmentSlot): void => {
    if (!character) {
      return;
    }

    commitCharacter(equipItem(character, itemId, targetSlotOverride));
    setOverlayPanel(null);
    setStatusMessage("Equipment updated.");
  };

  const handleSelectMainSpell = (spellId: string): void => {
    if (!character) {
      return;
    }

    const currentLoadout = character.spellLoadout[0];
    commitCharacter({
      ...character,
      spellLoadout: [
        {
          ...currentLoadout,
          mainSpellId: spellId
        }
      ]
    });
    setStatusMessage(`${getSpellName(spellId)} is now your active spell.`);
  };

  const handleSelectSupportSpell = (supportSpellId: string): void => {
    if (!character) {
      return;
    }

    const currentLoadout = character.spellLoadout[0];
    const nextSupportSpellIds = [...currentLoadout.supportSpellIds];

    if (nextSupportSpellIds[selectedSupportSlot] === supportSpellId) {
      nextSupportSpellIds.splice(selectedSupportSlot, 1);
    } else {
      nextSupportSpellIds[selectedSupportSlot] = supportSpellId;
    }

    commitCharacter({
      ...character,
      spellLoadout: [
        {
          ...currentLoadout,
          supportSpellIds: nextSupportSpellIds
        }
      ]
    });
    setOverlayPanel(null);
    setStatusMessage(
      `${supportSpellConfig[supportSpellId]?.name ?? supportSpellId} updated in support slot ${selectedSupportSlot + 1}.`
    );
  };

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
    setShopItems(createShopStock(Math.max(1, character.mapProgress.highestUnlockedTier + 1)).map(toShopItemState));
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

  const handleSpendStatPoint = (statKey: keyof CharacterStats): void => {
    if (!character) {
      return;
    }

    commitCharacter(spendLevelStatPoint(character, statKey));
  };

  const handleUpgradeSpell = (spellId: string): void => {
    if (!character) {
      return;
    }

    const nextCharacter = upgradeSpell(character, spellId);

    if (nextCharacter === character) {
      setErrorMessage("You do not meet the upgrade requirements for that spell.");
      return;
    }

    commitCharacter(nextCharacter);
    setStatusMessage(`${getSpellName(spellId)} upgraded to level ${getSpellLevel(nextCharacter, spellId)}.`);
    setErrorMessage(null);
  };

  const handleUseLifeFlask = (): void => {
    if (!character) {
      return;
    }

    const nextCharacter = useLifeFlask(character);

    if (nextCharacter === character) {
      setErrorMessage("Your life flask cannot be used right now.");
      return;
    }

    commitCharacter(nextCharacter);
    latestCharacterRef.current = nextCharacter;

    if (screenMode === "arena" && arenaRuntimeRef.current) {
      const nextRuntime = {
        ...arenaRuntimeRef.current,
        player: nextCharacter,
        snapshot: {
          ...arenaRuntimeRef.current.snapshot,
          player: nextCharacter
        }
      };
      arenaRuntimeRef.current = nextRuntime;
      setArenaSnapshot(nextRuntime.snapshot);
    }

    setStatusMessage("Life flask used.");
    setErrorMessage(null);
  };

  return {
    handleEquipItem,
    handleSelectMainSpell,
    handleSelectSupportSpell,
    handleBuyShopItem,
    handleRefreshShop,
    handleSellItem,
    handleSellAllItems,
    handleSpendStatPoint,
    handleUpgradeSpell,
    handleUseLifeFlask
  };
};
