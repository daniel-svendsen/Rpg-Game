import { getMapBalanceByTier, itemBalance } from "../../config/balance";
import { itemBases, uniqueItemDefinitions } from "../../config/itemConfig";
import type { CharacterRecord, InventoryItem, ItemRarity } from "../../../shared/types/saveTypes";
import { createClientId } from "../../../shared/utils/id";
import { getEquippedUniqueModifiers } from "../items/uniqueEffects";
import { pickWeighted } from "../loot/weightedTables";
import type { Tag } from "../../../shared/types/saveTypes";

const randomInRange = ([min, max]: readonly [number, number]): number =>
  Number((Math.random() * (max - min) + min).toFixed(2));

const pickRandom = <T,>(values: readonly T[]): T => values[Math.floor(Math.random() * values.length)];

const statNameParts = {
  strength: ["Titan", "Crushing", "Stonebound"],
  agility: ["Fleet", "Windstep", "Quickened"],
  vitality: ["Stalwart", "Ironheart", "Enduring"],
  dexterity: ["Deadeye", "Keen", "Surehand"],
  maxHealth: ["Bulwark", "Lifewoven", "Stout"],
  critChance: ["Razor", "Nightglass", "Precise"],
  spellPowerMultiplier: ["Runebound", "Arcanist", "Spellforged"]
} as const;

const tagNameParts: Partial<Record<Tag, readonly string[]>> = {
  Fire: ["Ember", "Cinder", "Ashen"],
  Cold: ["Glacial", "Frost", "Winter"],
  Lightning: ["Storm", "Volt", "Thunder"],
  Critical: ["Assassin", "Executioner", "Keen"],
  CastSpeed: ["Swift", "Haste", "Quickening"],
  SpellDamage: ["Mystic", "Sorcerer", "Runic"],
  Physical: ["Iron", "Steel", "Warden"]
};

const rarityTitleParts = {
  Normal: ["Worn", "Simple", "Plain"],
  Magic: ["Enchanted", "Gleaming", "Charged"],
  Rare: ["Mythic", "Ancient", "Sovereign"]
} as const;

const getPrimaryStatKey = (statBonuses: InventoryItem["statBonuses"]): keyof typeof statNameParts => {
  const scoredStats: Array<[keyof typeof statNameParts, number]> = [
    ["strength", (statBonuses.strength ?? 0) * 1.2],
    ["agility", (statBonuses.agility ?? 0) * 1.2],
    ["vitality", (statBonuses.vitality ?? 0) * 1.4],
    ["dexterity", (statBonuses.dexterity ?? 0) * 1.2],
    ["maxHealth", (statBonuses.maxHealth ?? 0) * 0.2],
    ["critChance", (statBonuses.critChance ?? 0) * 120],
    ["spellPowerMultiplier", (statBonuses.spellPowerMultiplier ?? 0) * 100]
  ];

  return scoredStats.sort((left, right) => right[1] - left[1])[0]?.[0] ?? "strength";
};

const getFlavorPartFromTags = (tags: Tag[]): string | null => {
  const matchingParts = tags.flatMap((tag) => tagNameParts[tag] ?? []);
  return matchingParts.length > 0 ? pickRandom(matchingParts) : null;
};

const buildGeneratedItemName = (
  baseName: string,
  rarity: Exclude<ItemRarity, "Unique">,
  tags: Tag[],
  statBonuses: InventoryItem["statBonuses"]
): string => {
  const rarityPart = pickRandom(rarityTitleParts[rarity]);
  const statPart = pickRandom(statNameParts[getPrimaryStatKey(statBonuses)]);
  const tagPart = getFlavorPartFromTags(tags);

  if (rarity === "Normal") {
    return `${tagPart ?? rarityPart} ${baseName}`;
  }

  if (rarity === "Magic") {
    return `${tagPart ?? rarityPart} ${statPart} ${baseName}`;
  }

  return `${rarityPart} ${tagPart ?? statPart} ${baseName} of the ${statPart}`;
};

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

  const generatedRarity: Exclude<ItemRarity, "Unique"> = rarity === "Unique" ? "Rare" : rarity;

  const statBonuses = {
    strength: Math.round(randomInRange(ranges.strength)),
    agility: Math.round(randomInRange(ranges.agility)),
    vitality: Math.round(randomInRange(ranges.vitality)),
    dexterity: Math.round(randomInRange(ranges.dexterity)),
    maxHealth: Math.round(randomInRange(ranges.maxHealth)),
    critChance: randomInRange(ranges.critChance),
    spellPowerMultiplier: randomInRange(ranges.spellPowerMultiplier)
  };

  return {
    id: `${base.id}-${createClientId()}`,
    name: buildGeneratedItemName(base.name, generatedRarity, base.tags, statBonuses),
    slot: base.slot,
    rarity: generatedRarity,
    tier,
    tags: base.tags,
    statBonuses
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
  const generatedRarity: Exclude<ItemRarity, "Unique"> = rarity === "Unique" ? "Rare" : rarity;

  const statBonuses = {
    strength: Math.round(randomInRange(ranges.strength)),
    agility: Math.round(randomInRange(ranges.agility)),
    vitality: Math.round(randomInRange(ranges.vitality)),
    dexterity: Math.round(randomInRange(ranges.dexterity)),
    maxHealth: Math.round(randomInRange(ranges.maxHealth)),
    critChance: randomInRange(ranges.critChance),
    spellPowerMultiplier: randomInRange(ranges.spellPowerMultiplier)
  };

  return {
    id: `${base.id}-${createClientId()}`,
    name: buildGeneratedItemName(base.name, generatedRarity, base.tags, statBonuses),
    slot: base.slot,
    rarity: generatedRarity,
    tier,
    tags: base.tags,
    statBonuses
  };
};
