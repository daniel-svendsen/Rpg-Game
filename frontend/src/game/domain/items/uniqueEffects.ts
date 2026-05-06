import type { CharacterRecord, InventoryItem } from "../../../shared/types/saveTypes";

export interface EquippedUniqueModifiers {
  bonusChainsForChainSpells: number;
  bonusChainRangeForChainSpells: number;
  bonusAreaRadiusForAreaSpells: number;
  moreDamageForAreaAndFireSpells: number;
  moreDamageForSpells: number;
  bonusCritChanceForSpells: number;
  bonusProjectilesForProjectileSpells: number;
  lessDamageForProjectileSpells: number;
  resistancePenetrationForFireSpells: number;
  spellDropChanceMultiplier: number;
  uniqueDropWeightMultiplier: number;
  mapShardDropMultiplier: number;
  extraLifeFlaskChargesOnKill: number;
  enemyContactDamageTakenMultiplier: number;
  maxHealthMultiplier: number;
}

const defaultUniqueModifiers: EquippedUniqueModifiers = {
  bonusChainsForChainSpells: 0,
  bonusChainRangeForChainSpells: 0,
  bonusAreaRadiusForAreaSpells: 0,
  moreDamageForAreaAndFireSpells: 0,
  moreDamageForSpells: 0,
  bonusCritChanceForSpells: 0,
  bonusProjectilesForProjectileSpells: 0,
  lessDamageForProjectileSpells: 0,
  resistancePenetrationForFireSpells: 0,
  spellDropChanceMultiplier: 1,
  uniqueDropWeightMultiplier: 1
  ,
  mapShardDropMultiplier: 1,
  extraLifeFlaskChargesOnKill: 0,
  enemyContactDamageTakenMultiplier: 1,
  maxHealthMultiplier: 1
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
    case "titanCarapace":
      return {
        ...modifiers,
        enemyContactDamageTakenMultiplier: modifiers.enemyContactDamageTakenMultiplier * 0.86,
        maxHealthMultiplier: modifiers.maxHealthMultiplier * 1.18
      };
    case "wayfarerSash":
      return {
        ...modifiers,
        mapShardDropMultiplier: modifiers.mapShardDropMultiplier * 1.4,
        extraLifeFlaskChargesOnKill: modifiers.extraLifeFlaskChargesOnKill + 1
      };
    case "twinstarLoop":
      return {
        ...modifiers,
        bonusProjectilesForProjectileSpells: modifiers.bonusProjectilesForProjectileSpells + 2,
        lessDamageForProjectileSpells: modifiers.lessDamageForProjectileSpells + 0.1
      };
    case "cinderSignet":
      return {
        ...modifiers,
        moreDamageForAreaAndFireSpells: modifiers.moreDamageForAreaAndFireSpells + 0.16,
        resistancePenetrationForFireSpells: modifiers.resistancePenetrationForFireSpells + 0.12
      };
    case "astralDominion":
      return {
        ...modifiers,
        moreDamageForSpells: modifiers.moreDamageForSpells + 0.18,
        bonusCritChanceForSpells: modifiers.bonusCritChanceForSpells + 0.06
      };
    default:
      return modifiers;
  }
};

export const getEquippedUniqueModifiers = (character: CharacterRecord): EquippedUniqueModifiers =>
  Object.values(character.equippedItems)
    .filter((item): item is InventoryItem => Boolean(item))
    .reduce(applyUniqueEffect, defaultUniqueModifiers);
