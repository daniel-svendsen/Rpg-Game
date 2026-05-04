import type { CharacterRecord, InventoryItem } from "../../../shared/types/saveTypes";

export const getItemPowerScore = (item: InventoryItem): number => {
  const bonuses = item.statBonuses;

  return (
    (bonuses.strength ?? 0) * 1.2 +
    (bonuses.agility ?? 0) * 1.2 +
    (bonuses.vitality ?? 0) * 1.4 +
    (bonuses.dexterity ?? 0) * 1.2 +
    (bonuses.maxHealth ?? 0) * 0.2 +
    (bonuses.critChance ?? 0) * 120 +
    (bonuses.spellPowerMultiplier ?? 0) * 100 +
    item.tier * 6
  );
};

export const getComparisonEquippedItem = (
  character: CharacterRecord,
  item: InventoryItem
): InventoryItem | null => {
  if (!item.slot) {
    return null;
  }

  if (item.slot === "Ring") {
    const ringItems = [character.equippedItems.Ring1, character.equippedItems.Ring2].filter(Boolean) as InventoryItem[];

    if (ringItems.length === 0) {
      return null;
    }

    if (ringItems.length === 1) {
      return ringItems[0];
    }

    return [...ringItems].sort((left, right) => getItemPowerScore(left) - getItemPowerScore(right))[0];
  }

  return character.equippedItems[item.slot] ?? null;
};

export const getPowerChangeForCharacterItem = (
  character: CharacterRecord,
  item: InventoryItem
): number | null => {
  const equippedItem = getComparisonEquippedItem(character, item);

  if (!equippedItem) {
    return null;
  }

  return getItemPowerScore(item) - getItemPowerScore(equippedItem);
};

export const isUpgradeForCharacter = (character: CharacterRecord, item: InventoryItem): boolean => {
  if (!item.slot) {
    return false;
  }

  const powerChange = getPowerChangeForCharacterItem(character, item);

  if (powerChange === null) {
    return true;
  }

  return powerChange > 0;
};
