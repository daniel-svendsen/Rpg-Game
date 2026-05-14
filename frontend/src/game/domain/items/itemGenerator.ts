import { gameTweaks, getMapBalanceByTier, itemBalance } from "../../config/balance";
import { itemBases, uniqueItemDefinitions, type ItemBaseDefinition } from "../../config/itemConfig";
import type { CharacterRecord, InventoryItem, ItemRarity } from "../../../shared/types/saveTypes";
import { createClientId } from "../../../shared/utils/id";
import { getEquippedUniqueModifiers } from "../items/uniqueEffects";
import { exceptionalRareNamePrefix } from "./itemPower";
import { pickWeighted } from "../loot/weightedTables";
import type { Tag } from "../../../shared/types/saveTypes";
import {
  getAffixCountByRarity,
  getAffixTierRangesForStat,
  itemAffixPoolsBySlot,
  itemAffixTierWeights,
  type AffixTier,
  type ItemStatKey
} from "../../config/itemAffixConfig";

const randomInRange = ([min, max]: readonly [number, number]): number =>
  Number((Math.random() * (max - min) + min).toFixed(4));

const pickRandom = <T,>(values: readonly T[]): T => values[Math.floor(Math.random() * values.length)];

const scaleStatBonus = (value: number | undefined, multiplier: number): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return value < 1 ? Number((value * multiplier).toFixed(3)) : Math.round(value * multiplier);
};

const getExceptionalRareChanceForTier = (tier: number, isRareMonster: boolean): number => {
  if (tier < itemBalance.exceptionalRare.minTier) {
    return 0;
  }

  const normalizedTier = Math.max(
    itemBalance.exceptionalRare.minTier,
    Math.min(10, tier)
  ) as keyof typeof itemBalance.exceptionalRare.chanceByTier;
  const baseChance = itemBalance.exceptionalRare.chanceByTier[normalizedTier] ?? 0;

  const tierBase = gameTweaks.exceptionalItemDropRate ?? baseChance;
  return isRareMonster ? tierBase * itemBalance.exceptionalRare.rareMonsterChanceMultiplier : tierBase;
};

const maybeCreateExceptionalRare = (
  item: InventoryItem,
  tier: number,
  isRareMonster: boolean
): InventoryItem => {
  if (item.rarity !== "Rare" || Math.random() >= getExceptionalRareChanceForTier(tier, isRareMonster)) {
    return item;
  }

  return {
    ...item,
    name: `${exceptionalRareNamePrefix} ${item.name}`,
    statBonuses: {
      strength: scaleStatBonus(item.statBonuses.strength, itemBalance.exceptionalRare.statMultiplier),
      agility: scaleStatBonus(item.statBonuses.agility, itemBalance.exceptionalRare.statMultiplier),
      vitality: scaleStatBonus(item.statBonuses.vitality, itemBalance.exceptionalRare.statMultiplier),
      dexterity: scaleStatBonus(item.statBonuses.dexterity, itemBalance.exceptionalRare.statMultiplier),
      intelligence: scaleStatBonus(item.statBonuses.intelligence, itemBalance.exceptionalRare.statMultiplier),
      maxHealth: scaleStatBonus(item.statBonuses.maxHealth, itemBalance.exceptionalRare.statMultiplier),
      movementSpeedBonus: scaleStatBonus(
        item.statBonuses.movementSpeedBonus,
        itemBalance.exceptionalRare.statMultiplier
      ),
      fireResistance: scaleStatBonus(item.statBonuses.fireResistance, itemBalance.exceptionalRare.statMultiplier),
      coldResistance: scaleStatBonus(item.statBonuses.coldResistance, itemBalance.exceptionalRare.statMultiplier),
      lightningResistance: scaleStatBonus(item.statBonuses.lightningResistance, itemBalance.exceptionalRare.statMultiplier),
      critChance: scaleStatBonus(item.statBonuses.critChance, itemBalance.exceptionalRare.statMultiplier),
      spellPowerMultiplier: scaleStatBonus(
        item.statBonuses.spellPowerMultiplier,
        itemBalance.exceptionalRare.statMultiplier
      )
    }
  };
};

const statNameParts = {
  strength: ["Titan", "Crushing", "Stonebound"],
  agility: ["Fleet", "Windstep", "Quickened"],
  vitality: ["Stalwart", "Ironheart", "Enduring"],
  dexterity: ["Deadeye", "Keen", "Surehand"],
  intelligence: ["Sage", "Mindwoven", "Arcanum"],
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
    ["intelligence", (statBonuses.intelligence ?? 0) * 1.2],
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
      weight: (gameTweaks.normalItemDropRate ?? tierBalance.normalItemDropRate) * (isRareMonster ? rarityMultiplier.normal : 1)
    },
    {
      key: "Magic",
      weight: (gameTweaks.magicItemDropRate ?? tierBalance.magicItemDropRate) * (isRareMonster ? rarityMultiplier.magic : 1)
    },
    {
      key: "Rare",
      weight: (gameTweaks.rareItemDropRate ?? tierBalance.rareItemDropRate) * (isRareMonster ? rarityMultiplier.rare : 1)
    },
    {
      key: "Unique",
      weight: (gameTweaks.uniqueItemDropRate ?? tierBalance.uniqueItemDropRate) * (isRareMonster ? rarityMultiplier.unique : 1)
    }
    ]) ?? "Normal"
  );
};

const isIntegerStatKey = (statKey: ItemStatKey): boolean =>
  statKey === "strength" ||
  statKey === "agility" ||
  statKey === "vitality" ||
  statKey === "dexterity" ||
  statKey === "intelligence" ||
  statKey === "maxHealth";

const rollAffixTier = (): AffixTier =>
  (pickWeighted(
    (Object.entries(itemAffixTierWeights) as Array<[`${AffixTier}`, number]>).map(([key, weight]) => ({
      key: Number(key) as AffixTier,
      weight
    }))
  ) ?? 1);

const rollStatBonusValue = (itemTier: number, statKey: ItemStatKey): number => {
  const tier = rollAffixTier();
  const tierRanges = getAffixTierRangesForStat(itemTier, statKey);
  const value = randomInRange(tierRanges[tier]);
  return isIntegerStatKey(statKey) ? Math.round(value) : Number(value.toFixed(4));
};

const rollAffixBonuses = (
  base: ItemBaseDefinition,
  itemTier: number,
  rarity: Exclude<ItemRarity, "Unique">
): InventoryItem["statBonuses"] => {
  const slot = base.slot;

  if (!slot) {
    return {};
  }

  const pool = itemAffixPoolsBySlot[slot];
  const filteredPool = (() => {
    if (!base.defenseProfile) {
      return pool;
    }

    if (base.defenseProfile === "Armor") {
      return {
        prefixes: pool.prefixes.filter((entry) => entry.statKey !== "evasion"),
        suffixes: pool.suffixes
      };
    }

    if (base.defenseProfile === "Evasion") {
      return {
        prefixes: pool.prefixes.filter((entry) => entry.statKey !== "armor"),
        suffixes: pool.suffixes
      };
    }

    return pool;
  })();
  const affixCount = getAffixCountByRarity(rarity);
  const totalAffixes =
    affixCount.min === affixCount.max
      ? affixCount.min
      : Math.floor(Math.random() * (affixCount.max - affixCount.min + 1)) + affixCount.min;

  const remainingPrefixes = [...filteredPool.prefixes];
  const remainingSuffixes = [...filteredPool.suffixes];
  let prefixesUsed = 0;
  let suffixesUsed = 0;

  const bonuses: InventoryItem["statBonuses"] = {};

  if (base.baseCastSpeedMultiplier !== undefined) {
    bonuses.castSpeedMultiplier = base.baseCastSpeedMultiplier;
  }

  if (base.baseAttackSpeedMultiplier !== undefined) {
    bonuses.attackSpeedMultiplier = base.baseAttackSpeedMultiplier;
  }

  if (base.baseArmor !== undefined) {
    bonuses.armor = base.baseArmor;
  }

  if (base.baseEvasion !== undefined) {
    bonuses.evasion = base.baseEvasion;
  }

  for (let index = 0; index < totalAffixes; index += 1) {
    const canUsePrefix = prefixesUsed < affixCount.maxPrefixes && remainingPrefixes.length > 0;
    const canUseSuffix = suffixesUsed < affixCount.maxSuffixes && remainingSuffixes.length > 0;

    if (!canUsePrefix && !canUseSuffix) {
      break;
    }

    const pickKind =
      canUsePrefix && canUseSuffix
        ? Math.random() < 0.5
          ? "Prefix"
          : "Suffix"
        : canUsePrefix
          ? "Prefix"
          : "Suffix";

    const selected =
      pickKind === "Prefix"
        ? (pickWeighted(remainingPrefixes.map((entry) => ({ key: entry, weight: entry.weight }))) ?? null)
        : (pickWeighted(remainingSuffixes.map((entry) => ({ key: entry, weight: entry.weight }))) ?? null);

    if (!selected) {
      continue;
    }

    const selectedStatKey = selected.statKey as ItemStatKey;
    (bonuses as Record<string, number>)[selectedStatKey] =
      ((bonuses as Record<string, number>)[selectedStatKey] ?? 0) + rollStatBonusValue(itemTier, selectedStatKey);

    const removeFrom = pickKind === "Prefix" ? remainingPrefixes : remainingSuffixes;
    const indexToRemove = removeFrom.findIndex((entry) => entry.id === selected.id);

    if (indexToRemove >= 0) {
      removeFrom.splice(indexToRemove, 1);
    }

    if (pickKind === "Prefix") {
      prefixesUsed += 1;
    } else {
      suffixesUsed += 1;
    }
  }

  return bonuses;
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
  const eligibleBases = itemBases.filter((entry) => {
    if (entry.minTier !== undefined && tier < entry.minTier) {
      return false;
    }

    if (entry.maxTier !== undefined && tier > entry.maxTier) {
      return false;
    }

    return true;
  });
  const availableBases = eligibleBases.length > 0 ? eligibleBases : itemBases;
  const base = availableBases[Math.floor(Math.random() * availableBases.length)];
  const rarity = generateRarity(tier, isRareMonster);

  if (rarity === "Unique") {
    const uniqueItem = generateUniqueItemDrop(tier);

    if (uniqueItem) {
      return uniqueItem;
    }
  }

  const generatedRarity: Exclude<ItemRarity, "Unique"> = rarity === "Unique" ? "Rare" : rarity;
  const statBonuses = rollAffixBonuses(base, tier, generatedRarity);

  return maybeCreateExceptionalRare({
    id: `${base.id}-${createClientId()}`,
    name: buildGeneratedItemName(base.name, generatedRarity, base.tags, statBonuses),
    slot: base.slot,
    rarity: generatedRarity,
    tier,
    tags: base.tags,
    statBonuses
  }, tier, isRareMonster);
};

export const generateItemDropForCharacter = (
  character: CharacterRecord,
  tier: number,
  isRareMonster: boolean
): InventoryItem => {
  const uniqueModifiers = getEquippedUniqueModifiers(character);
  const rarity = generateRarity(tier, isRareMonster);

  if (rarity === "Unique") {
    const uniqueItem = generateUniqueItemDrop(tier, uniqueModifiers.uniqueDropWeightMultiplier);

    if (uniqueItem) {
      return uniqueItem;
    }
  }

  const eligibleBases = itemBases.filter((entry) => {
    if (entry.minTier !== undefined && tier < entry.minTier) {
      return false;
    }

    if (entry.maxTier !== undefined && tier > entry.maxTier) {
      return false;
    }

    return true;
  });
  const availableBases = eligibleBases.length > 0 ? eligibleBases : itemBases;
  const base = availableBases[Math.floor(Math.random() * availableBases.length)];
  const generatedRarity: Exclude<ItemRarity, "Unique"> = rarity === "Unique" ? "Rare" : rarity;
  const statBonuses = rollAffixBonuses(base, tier, generatedRarity);

  return maybeCreateExceptionalRare({
    id: `${base.id}-${createClientId()}`,
    name: buildGeneratedItemName(base.name, generatedRarity, base.tags, statBonuses),
    slot: base.slot,
    rarity: generatedRarity,
    tier,
    tags: base.tags,
    statBonuses
  }, tier, isRareMonster);
};
