import { balanceConfig } from "../../config/balanceConfig";
import { itemBases } from "../../config/itemConfig";
import type { InventoryItem, ItemRarity } from "../../../shared/types/saveTypes";

const randomInRange = ([min, max]: readonly [number, number]): number =>
  Number((Math.random() * (max - min) + min).toFixed(2));

const generateRarity = (isRareMonster: boolean): ItemRarity => {
  const roll = Math.random();

  if (roll < balanceConfig.uniqueItemDrop.baseChance + (isRareMonster ? balanceConfig.uniqueItemDrop.rareMonsterBonusChance : 0)) {
    return "Unique";
  }

  if (isRareMonster && roll < 0.42) {
    return "Rare";
  }

  if (roll < 0.24) {
    return "Magic";
  }

  return "Normal";
};

export const generateItemDrop = (tier: number, isRareMonster: boolean): InventoryItem => {
  const base = itemBases[Math.floor(Math.random() * itemBases.length)];
  const ranges = balanceConfig.itemTierStatRanges[tier as keyof typeof balanceConfig.itemTierStatRanges] ?? balanceConfig.itemTierStatRanges[1];
  const rarity = generateRarity(isRareMonster);

  return {
    id: `${base.id}-${crypto.randomUUID()}`,
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
