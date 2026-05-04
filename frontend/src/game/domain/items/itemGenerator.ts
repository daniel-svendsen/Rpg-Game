import { getMapBalanceByTier, itemBalance } from "../../config/balance";
import { itemBases, uniqueItemDefinitions } from "../../config/itemConfig";
import type { CharacterRecord, InventoryItem, ItemRarity } from "../../../shared/types/saveTypes";
import { createClientId } from "../../../shared/utils/id";
import { getEquippedUniqueModifiers } from "../items/uniqueEffects";
import { pickWeighted } from "../loot/weightedTables";

const randomInRange = ([min, max]: readonly [number, number]): number =>
  Number((Math.random() * (max - min) + min).toFixed(2));

const generateRarity = (tier: number, isRareMonster: boolean): ItemRarity => {
  const tierBalance = getMapBalanceByTier(tier);
  const rarityMultiplier = itemBalance.rareMonsterRarityWeightMultiplier;

  return (
    pickWeighted<ItemRarity>([
    {
      key: "Normal",
      weight:
        tierBalance.normalItemDropRate * (isRareMonster ? rarityMultiplier.normal : 1)
    },
    {
      key: "Magic",
      weight:
        tierBalance.magicItemDropRate * (isRareMonster ? rarityMultiplier.magic : 1)
    },
    {
      key: "Rare",
      weight:
        tierBalance.rareItemDropRate * (isRareMonster ? rarityMultiplier.rare : 1)
    },
    {
      key: "Unique",
      weight:
        tierBalance.uniqueItemDropRate * (isRareMonster ? rarityMultiplier.unique : 1)
    }
    ]) ?? "Normal"
  );
};

const generateUniqueItemDrop = (tier: number, uniqueDropWeightMultiplier = 1): InventoryItem | null => {
  const uniqueDefinition =
    pickWeighted(
      uniqueItemDefinitions
        .filter((item) => item.minTier <= tier)
        .map((item) => ({ key: item, weight: item.dropWeight * uniqueDropWeightMultiplier }))
    );

  if (!uniqueDefinition) {
    return null;
  }

  return {
    id: `${uniqueDefinition.id}-${createClientId()}`,
    name: uniqueDefinition.name,
    slot: uniqueDefinition.slot,
    rarity: "Unique",
    tier,
    tags: uniqueDefinition.tags,
    uniqueEffectId: uniqueDefinition.uniqueEffectId,
    uniqueEffectDescription: uniqueDefinition.uniqueEffectDescription,
    statBonuses: uniqueDefinition.statBonuses
  };
};

export const generateItemDrop = (tier: number, isRareMonster: boolean): InventoryItem => {
  const base = itemBases[Math.floor(Math.random() * itemBases.length)];
  const tierBalance = getMapBalanceByTier(tier);
  const ranges = tierBalance.itemStatRanges;
  const rarity = generateRarity(tier, isRareMonster);

  if (rarity === "Unique") {
    const uniqueItem = generateUniqueItemDrop(tier);

    if (uniqueItem) {
      return uniqueItem;
    }
  }

  return {
    id: `${base.id}-${createClientId()}`,
    name: `${rarity} ${base.name}`,
    slot: base.slot,
    rarity,
    tier,
    tags: rarity === "Unique" ? [...base.tags, "Unique"] : base.tags,
    statBonuses: {
      strength: Math.round(randomInRange(ranges.strength)),
      agility: Math.round(randomInRange(ranges.agility)),
      vitality: Math.round(randomInRange(ranges.vitality)),
      dexterity: Math.round(randomInRange(ranges.dexterity)),
      maxHealth: Math.round(randomInRange(ranges.maxHealth)),
      critChance: randomInRange(ranges.critChance),
      spellPowerMultiplier: randomInRange(ranges.spellPowerMultiplier)
    }
  };
};

export const generateItemDropForCharacter = (
  character: CharacterRecord,
  tier: number,
  isRareMonster: boolean
): InventoryItem => {
  const uniqueModifiers = getEquippedUniqueModifiers(character);
  const tierBalance = getMapBalanceByTier(tier);
  const rarity = generateRarity(tier, isRareMonster);

  if (rarity === "Unique") {
    const uniqueItem = generateUniqueItemDrop(tier, uniqueModifiers.uniqueDropWeightMultiplier);

    if (uniqueItem) {
      return uniqueItem;
    }
  }

  const base = itemBases[Math.floor(Math.random() * itemBases.length)];
  const ranges = tierBalance.itemStatRanges;

  return {
    id: `${base.id}-${createClientId()}`,
    name: `${rarity} ${base.name}`,
    slot: base.slot,
    rarity,
    tier,
    tags: rarity === "Unique" ? [...base.tags, "Unique"] : base.tags,
    statBonuses: {
      strength: Math.round(randomInRange(ranges.strength)),
      agility: Math.round(randomInRange(ranges.agility)),
      vitality: Math.round(randomInRange(ranges.vitality)),
      dexterity: Math.round(randomInRange(ranges.dexterity)),
      maxHealth: Math.round(randomInRange(ranges.maxHealth)),
      critChance: randomInRange(ranges.critChance),
      spellPowerMultiplier: randomInRange(ranges.spellPowerMultiplier)
    }
  };
};
