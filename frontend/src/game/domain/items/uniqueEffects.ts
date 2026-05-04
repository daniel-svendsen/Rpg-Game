import type { CharacterRecord, InventoryItem } from "../../../shared/types/saveTypes";

export interface EquippedUniqueModifiers {
  bonusChainsForChainSpells: number;
  bonusChainRangeForChainSpells: number;
  bonusAreaRadiusForAreaSpells: number;
  moreDamageForAreaAndFireSpells: number;
  bonusCritChanceForSpells: number;
  spellDropChanceMultiplier: number;
  uniqueDropWeightMultiplier: number;
}

const defaultUniqueModifiers: EquippedUniqueModifiers = {
  bonusChainsForChainSpells: 0,
  bonusChainRangeForChainSpells: 0,
  bonusAreaRadiusForAreaSpells: 0,
  moreDamageForAreaAndFireSpells: 0,
  bonusCritChanceForSpells: 0,
  spellDropChanceMultiplier: 1,
  uniqueDropWeightMultiplier: 1
};

const applyUniqueEffect = (
  modifiers: EquippedUniqueModifiers,
  item: InventoryItem
): EquippedUniqueModifiers => {
  switch (item.uniqueEffectId) {
    case "stormcallerFocus":
      return {
        ...modifiers,
        bonusChainsForChainSpells: modifiers.bonusChainsForChainSpells + 2,
        bonusChainRangeForChainSpells: modifiers.bonusChainRangeForChainSpells + 60
      };
    case "embersoulBoots":
      return {
        ...modifiers,
        bonusAreaRadiusForAreaSpells: modifiers.bonusAreaRadiusForAreaSpells + 22,
        moreDamageForAreaAndFireSpells: modifiers.moreDamageForAreaAndFireSpells + 0.18
      };
    case "glacialHeart":
      return {
        ...modifiers,
        bonusCritChanceForSpells: modifiers.bonusCritChanceForSpells + 0.08,
        spellDropChanceMultiplier: modifiers.spellDropChanceMultiplier * 1.35,
        uniqueDropWeightMultiplier: modifiers.uniqueDropWeightMultiplier * 1.6
      };
    default:
      return modifiers;
  }
};

export const getEquippedUniqueModifiers = (character: CharacterRecord): EquippedUniqueModifiers =>
  Object.values(character.equippedItems)
    .filter((item): item is InventoryItem => Boolean(item))
    .reduce(applyUniqueEffect, defaultUniqueModifiers);
