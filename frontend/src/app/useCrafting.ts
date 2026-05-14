import type { Dispatch, SetStateAction } from "react";
import { applyOrb } from "../game/domain/crafting/craftingDomain";
import { craftingRecipes, type CraftingCurrencyCode } from "../game/config/craftingConfig";
import type { CharacterRecord } from "../shared/types/saveTypes";
import { getCurrencyAmount, updateCurrency } from "./mapFlow";

interface UseCraftingParams {
  character: CharacterRecord | null;
  commitCharacter: (next: CharacterRecord | null) => void;
  persistCharacterNow: (next: CharacterRecord, failureMessage: string) => Promise<void>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
}

const updateItemInCharacter = (character: CharacterRecord, itemId: string, updater: (item: import("../shared/types/saveTypes").InventoryItem) => import("../shared/types/saveTypes").InventoryItem): CharacterRecord | null => {
  const inInventory = character.inventory.find((i) => i.id === itemId);
  if (inInventory) {
    return {
      ...character,
      inventory: character.inventory.map((i) => (i.id === itemId ? updater(i) : i))
    };
  }

  const equippedSlot = (Object.keys(character.equippedItems) as (keyof typeof character.equippedItems)[]).find(
    (slot) => character.equippedItems[slot]?.id === itemId
  );

  if (equippedSlot) {
    const current = character.equippedItems[equippedSlot];
    if (!current) return null;
    return {
      ...character,
      equippedItems: { ...character.equippedItems, [equippedSlot]: updater(current) }
    };
  }

  return null;
};

export const useCrafting = ({
  character,
  commitCharacter,
  persistCharacterNow,
  setStatusMessage,
  setErrorMessage
}: UseCraftingParams) => {
  const handleApplyCraftingOrb = (itemId: string, orbCode: string): void => {
    if (!character) return;

    const orbId = orbCode as Parameters<typeof applyOrb>[1];
    const orbAmount = getCurrencyAmount(character, orbCode);

    if (orbAmount <= 0) {
      setErrorMessage(`You don't have any ${orbCode}.`);
      return;
    }

    const allItems = [
      ...character.inventory,
      ...Object.values(character.equippedItems).filter(
        (item): item is import("../shared/types/saveTypes").InventoryItem => item !== undefined
      )
    ];
    const item = allItems.find((i) => i.id === itemId);

    if (!item) {
      setErrorMessage("Item not found.");
      return;
    }

    const result = applyOrb(item, orbId);

    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    const afterItem = updateItemInCharacter(character, itemId, () => result.item);
    if (!afterItem) {
      setErrorMessage("Could not update item.");
      return;
    }

    const afterCurrency = updateCurrency(afterItem, orbCode, -1);
    commitCharacter(afterCurrency);
    void persistCharacterNow(afterCurrency, "Crafting save failed. Try saving manually.");
    setStatusMessage(`Applied ${orbCode} to ${item.name}.`);
  };

  const handleCombineOrbs = (outputCode: string): void => {
    if (!character) return;

    const recipe = craftingRecipes.find((r) => r.outputCode === outputCode);
    if (!recipe) {
      setErrorMessage("Unknown recipe.");
      return;
    }

    for (const input of recipe.inputs) {
      if (getCurrencyAmount(character, input.code) < input.amount) {
        setErrorMessage(`Not enough ${input.code}.`);
        return;
      }
    }

    let next = character;
    for (const input of recipe.inputs) {
      next = updateCurrency(next, input.code as CraftingCurrencyCode, -input.amount);
    }
    next = updateCurrency(next, outputCode as CraftingCurrencyCode, recipe.outputAmount);

    commitCharacter(next);
    void persistCharacterNow(next, "Crafting save failed. Try saving manually.");
    setStatusMessage(`Crafted 1× ${outputCode}.`);
  };

  return { handleApplyCraftingOrb, handleCombineOrbs };
};
