import type { CharacterRecord, CharacterStats, InventoryItem } from "../../../shared/types/saveTypes";
import { balanceConfig } from "../../config/balanceConfig";
import { getItemPowerScore } from "../items/itemPower";
import { getEquippedUniqueModifiers } from "../items/uniqueEffects";
import { deriveStats } from "./statCalculation";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

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
  const uniqueModifiers = getEquippedUniqueModifiers(character);
  const healthRatio =
    character.derivedStats.maxHealth > 0
      ? Math.min(1, character.currentHealth / character.derivedStats.maxHealth)
      : 1;
  const bonusHealth = Object.values(character.equippedItems).reduce(
    (total, item) => total + (item?.statBonuses.maxHealth ?? 0),
    0
  );
  const levelHealthBonus = balanceConfig.progression.healthPerLevel * Math.max(0, character.level - 1);
  const nextMaxHealth = Math.round(
    (derivedStats.maxHealth + levelHealthBonus + bonusHealth) * uniqueModifiers.maxHealthMultiplier
  );
  const movementSpeedBonus = Object.values(character.equippedItems).reduce(
    (total, item) => total + (item?.statBonuses.movementSpeedBonus ?? 0),
    0
  );
  const armorBonus = Object.values(character.equippedItems).reduce(
    (total, item) => total + (item?.statBonuses.armor ?? 0),
    0
  );
  const evasionBonus = Object.values(character.equippedItems).reduce(
    (total, item) => total + (item?.statBonuses.evasion ?? 0),
    0
  );
  const fireResistanceBonus = Object.values(character.equippedItems).reduce(
    (total, item) => total + (item?.statBonuses.fireResistance ?? 0),
    0
  );
  const coldResistanceBonus = Object.values(character.equippedItems).reduce(
    (total, item) => total + (item?.statBonuses.coldResistance ?? 0),
    0
  );
  const lightningResistanceBonus = Object.values(character.equippedItems).reduce(
    (total, item) => total + (item?.statBonuses.lightningResistance ?? 0),
    0
  );
  const weaponCastSpeedMultiplier = character.equippedItems.Weapon?.statBonuses.castSpeedMultiplier ?? 1;
  const weaponAttackSpeedMultiplier = character.equippedItems.Weapon?.statBonuses.attackSpeedMultiplier ?? 1;
  const resistanceCap = balanceConfig.combat.resistances.playerCap;

  return {
    ...character,
    derivedStats: {
      ...derivedStats,
      maxHealth: nextMaxHealth,
      castSpeedMultiplier: derivedStats.castSpeedMultiplier * weaponCastSpeedMultiplier,
      attackSpeedMultiplier: derivedStats.attackSpeedMultiplier * weaponAttackSpeedMultiplier,
      movementSpeedMultiplier: derivedStats.movementSpeedMultiplier + movementSpeedBonus,
      armor: derivedStats.armor + armorBonus,
      evasion: derivedStats.evasion + evasionBonus,
      resistances: {
        Fire: clamp(derivedStats.resistances.Fire + fireResistanceBonus, -1, resistanceCap),
        Cold: clamp(derivedStats.resistances.Cold + coldResistanceBonus, -1, resistanceCap),
        Lightning: clamp(derivedStats.resistances.Lightning + lightningResistanceBonus, -1, resistanceCap)
      },
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

const getPreferredRingSlot = (character: CharacterRecord): "Ring1" | "Ring2" => {
  if (!character.equippedItems.Ring1) {
    return "Ring1";
  }

  if (!character.equippedItems.Ring2) {
    return "Ring2";
  }

  const leftRingPower = character.equippedItems.Ring1 ? getItemPowerScore(character.equippedItems.Ring1) : 0;
  const rightRingPower = character.equippedItems.Ring2 ? getItemPowerScore(character.equippedItems.Ring2) : 0;

  return leftRingPower <= rightRingPower ? "Ring1" : "Ring2";
};

export const equipItem = (
  character: CharacterRecord,
  itemId: string,
  targetSlotOverride?: keyof CharacterRecord["equippedItems"]
): CharacterRecord => {
  const item = character.inventory.find((entry) => entry.id === itemId);

  if (!item || !item.slot) {
    return character;
  }

  const resolvedSlot =
    item.slot === "Ring"
      ? (targetSlotOverride === "Ring1" || targetSlotOverride === "Ring2"
          ? targetSlotOverride
          : getPreferredRingSlot(character))
      : item.slot;
  const previousEquipped = character.equippedItems[resolvedSlot];
  const nextInventory = character.inventory.filter((entry) => entry.id !== itemId);

  if (previousEquipped) {
    nextInventory.push(previousEquipped);
  }

  return applyEquipmentState({
    ...character,
    inventory: nextInventory,
    equippedItems: {
      ...character.equippedItems,
      [resolvedSlot]: item
    }
  });
};
