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

export const isUpgradeForCharacter = (character: CharacterRecord, item: InventoryItem): boolean => {
  if (!item.slot) {
    return false;
  }

  const equippedItem = character.equippedItems[item.slot];

  if (!equippedItem) {
    return true;
  }

  return getItemPowerScore(item) > getItemPowerScore(equippedItem);
};
