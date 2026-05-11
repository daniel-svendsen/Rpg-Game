import type { CharacterRecord, InventoryItem } from "../../../shared/types/saveTypes";

export interface EquippedUniqueModifiers {
  castSpeedMultiplierForSpells: number;
  castSpeedMultiplierForFireSpells: number;
  castSpeedMultiplierForColdSpells: number;
  castSpeedMultiplierForLightningSpells: number;
  bonusChainsForChainSpells: number;
  bonusChainRangeForChainSpells: number;
  bonusChainsForLightningSpells: number;
  bonusChainRangeForLightningSpells: number;
  bonusAreaRadiusForAreaSpells: number;
  bonusAreaRadiusForFireSpells: number;
  bonusAreaRadiusForColdSpells: number;
  moreDamageForAreaAndFireSpells: number;
  moreDamageForSpells: number;
  bonusCritChanceForSpells: number;
  bonusProjectilesForProjectileSpells: number;
  bonusProjectilesForLightningSpells: number;
  lessDamageForProjectileSpells: number;
  resistancePenetrationForFireSpells: number;
  spellDropChanceMultiplier: number;
  uniqueDropWeightMultiplier: number;
  mapShardDropMultiplier: number;
  extraLifeFlaskChargesOnKill: number;
  enemyContactDamageTakenMultiplier: number;
  maxHealthMultiplier: number;
  bonusCritMultiplierForSpells: number;
  resistancePenetrationForAllSpells: number;
}

const defaultUniqueModifiers: EquippedUniqueModifiers = {
  castSpeedMultiplierForSpells: 1,
  castSpeedMultiplierForFireSpells: 1,
  castSpeedMultiplierForColdSpells: 1,
  castSpeedMultiplierForLightningSpells: 1,
  bonusChainsForChainSpells: 0,
  bonusChainRangeForChainSpells: 0,
  bonusChainsForLightningSpells: 0,
  bonusChainRangeForLightningSpells: 0,
  bonusAreaRadiusForAreaSpells: 0,
  bonusAreaRadiusForFireSpells: 0,
  bonusAreaRadiusForColdSpells: 0,
  moreDamageForAreaAndFireSpells: 0,
  moreDamageForSpells: 0,
  bonusCritChanceForSpells: 0,
  bonusProjectilesForProjectileSpells: 0,
  bonusProjectilesForLightningSpells: 0,
  lessDamageForProjectileSpells: 0,
  resistancePenetrationForFireSpells: 0,
  spellDropChanceMultiplier: 1,
  uniqueDropWeightMultiplier: 1
  ,
  mapShardDropMultiplier: 1,
  extraLifeFlaskChargesOnKill: 0,
  enemyContactDamageTakenMultiplier: 1,
  maxHealthMultiplier: 1,
  bonusCritMultiplierForSpells: 0,
  resistancePenetrationForAllSpells: 0
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
    case "crownOfAscension":
      return {
        ...modifiers,
        castSpeedMultiplierForSpells: modifiers.castSpeedMultiplierForSpells * 1.15,
        bonusProjectilesForProjectileSpells: modifiers.bonusProjectilesForProjectileSpells + 1
      };
    case "pyrelordCrown":
      return {
        ...modifiers,
        castSpeedMultiplierForFireSpells: modifiers.castSpeedMultiplierForFireSpells * 1.18,
        bonusAreaRadiusForFireSpells: modifiers.bonusAreaRadiusForFireSpells + 26
      };
    case "winterwakeDiadem":
      return {
        ...modifiers,
        castSpeedMultiplierForColdSpells: modifiers.castSpeedMultiplierForColdSpells * 1.18,
        bonusAreaRadiusForColdSpells: modifiers.bonusAreaRadiusForColdSpells + 30
      };
    case "stormfangRing":
      return {
        ...modifiers,
        bonusChainsForLightningSpells: modifiers.bonusChainsForLightningSpells + 1,
        bonusChainRangeForLightningSpells: modifiers.bonusChainRangeForLightningSpells + 60
      };
    case "tempestHelm":
      return {
        ...modifiers,
        castSpeedMultiplierForLightningSpells: modifiers.castSpeedMultiplierForLightningSpells * 1.15,
        bonusProjectilesForLightningSpells: modifiers.bonusProjectilesForLightningSpells + 1
      };
    case "titansCommand":
      return {
        ...modifiers,
        bonusCritMultiplierForSpells: modifiers.bonusCritMultiplierForSpells + 0.5
      };
    case "voidmantleHood":
      return {
        ...modifiers,
        resistancePenetrationForAllSpells: modifiers.resistancePenetrationForAllSpells + 0.15
      };
    case "kingsfallCrown":
      return {
        ...modifiers,
        bonusChainsForChainSpells: modifiers.bonusChainsForChainSpells + 2,
        bonusAreaRadiusForAreaSpells: modifiers.bonusAreaRadiusForAreaSpells + 20,
        bonusProjectilesForProjectileSpells: modifiers.bonusProjectilesForProjectileSpells + 1
      };
    case "cataclysmHelm":
      return {
        ...modifiers,
        moreDamageForSpells: modifiers.moreDamageForSpells + 0.25,
        bonusAreaRadiusForAreaSpells: modifiers.bonusAreaRadiusForAreaSpells + 25
      };
    case "eternityCrown":
      return {
        ...modifiers,
        moreDamageForSpells: modifiers.moreDamageForSpells + 0.30,
        bonusCritChanceForSpells: modifiers.bonusCritChanceForSpells + 0.15,
        resistancePenetrationForAllSpells: modifiers.resistancePenetrationForAllSpells + 0.20
      };
    default:
      return modifiers;
  }
};

export const getEquippedUniqueModifiers = (character: CharacterRecord): EquippedUniqueModifiers =>
  Object.values(character.equippedItems)
    .filter((item): item is InventoryItem => Boolean(item))
    .reduce(applyUniqueEffect, defaultUniqueModifiers);
