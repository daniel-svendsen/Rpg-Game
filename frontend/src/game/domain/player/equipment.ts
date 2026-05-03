import type { CharacterRecord, CharacterStats, InventoryItem } from "../../../shared/types/saveTypes";
import { deriveStats } from "./playerTypes";

const applyEquipmentBonuses = (
  baseStats: CharacterStats,
  equippedItems: CharacterRecord["equippedItems"]
): CharacterStats => {
  const equippedList = Object.values(equippedItems).filter((item): item is InventoryItem => Boolean(item));

  return equippedList.reduce(
    (total, item) => ({
      strength: total.strength + (item.statBonuses.strength ?? 0),
      agility: total.agility + (item.statBonuses.agility ?? 0),
      vitality: total.vitality + (item.statBonuses.vitality ?? 0),
      dexterity: total.dexterity + (item.statBonuses.dexterity ?? 0)
    }),
    { ...baseStats }
  );
};

export const applyEquipmentState = (character: CharacterRecord): CharacterRecord => {
  const statAdjustedBase = applyEquipmentBonuses(character.baseStats, character.equippedItems);
  const derivedStats = deriveStats(statAdjustedBase);
  const healthRatio =
    character.derivedStats.maxHealth > 0 ? character.currentHealth / character.derivedStats.maxHealth : 1;
  const bonusHealth = Object.values(character.equippedItems).reduce(
    (total, item) => total + (item?.statBonuses.maxHealth ?? 0),
    0
  );
  const nextMaxHealth = derivedStats.maxHealth + bonusHealth;

  return {
    ...character,
    derivedStats: {
      ...derivedStats,
      maxHealth: nextMaxHealth,
      critChance:
        derivedStats.critChance +
        Object.values(character.equippedItems).reduce((total, item) => total + (item?.statBonuses.critChance ?? 0), 0),
      spellPowerMultiplier:
        derivedStats.spellPowerMultiplier +
        Object.values(character.equippedItems).reduce(
          (total, item) => total + (item?.statBonuses.spellPowerMultiplier ?? 0),
          0
        )
    },
    currentHealth: Math.max(1, Math.round(nextMaxHealth * healthRatio))
  };
};

export const equipItem = (character: CharacterRecord, itemId: string): CharacterRecord => {
  const item = character.inventory.find((entry) => entry.id === itemId);

  if (!item || !item.slot) {
    return character;
  }

  const previousEquipped = character.equippedItems[item.slot];
  const nextInventory = character.inventory.filter((entry) => entry.id !== itemId);

  if (previousEquipped) {
    nextInventory.push(previousEquipped);
  }

  return applyEquipmentState({
    ...character,
    inventory: nextInventory,
    equippedItems: {
      ...character.equippedItems,
      [item.slot]: item
    }
  });
};
