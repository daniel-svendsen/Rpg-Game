import type { ItemRarity, ItemSlot, InventoryItem } from "../../shared/types/saveTypes";
import { getMapBalanceByTier } from "./balance";

export type ItemStatKey = keyof InventoryItem["statBonuses"];
export type AffixKind = "Prefix" | "Suffix";

export type AffixTier = 1 | 2 | 3 | 4 | 5;

export interface ItemAffixDefinition {
  id: string;
  kind: AffixKind;
  statKey: ItemStatKey;
  weight: number;
}

export type ItemAffixPool = {
  prefixes: readonly ItemAffixDefinition[];
  suffixes: readonly ItemAffixDefinition[];
};

export const itemAffixTierWeights: Record<AffixTier, number> = {
  1: 52,
  2: 26,
  3: 14,
  4: 6,
  5: 2
} as const;

export const getAffixCountByRarity = (
  rarity: Exclude<ItemRarity, "Unique">
): { min: number; max: number; maxPrefixes: number; maxSuffixes: number } => {
  switch (rarity) {
    case "Normal":
      return { min: 0, max: 1, maxPrefixes: 1, maxSuffixes: 1 };
    case "Magic":
      return { min: 1, max: 2, maxPrefixes: 1, maxSuffixes: 1 };
    case "Rare":
      return { min: 3, max: 6, maxPrefixes: 3, maxSuffixes: 3 };
  }
};

const prefix = (id: string, statKey: ItemStatKey, weight: number): ItemAffixDefinition => ({
  id,
  kind: "Prefix",
  statKey,
  weight
});

const suffix = (id: string, statKey: ItemStatKey, weight: number): ItemAffixDefinition => ({
  id,
  kind: "Suffix",
  statKey,
  weight
});

const statAffixes = {
  strength: prefix("brutal", "strength", 10),
  agility: prefix("nimble", "agility", 10),
  vitality: prefix("stout", "vitality", 10),
  dexterity: prefix("keen", "dexterity", 10)
} as const;

const defenseAffixes = {
  maxHealth: prefix("hearty", "maxHealth", 9)
} as const;

const spellAffixes = {
  spellPowerMultiplier: prefix("arcanist", "spellPowerMultiplier", 8),
  critChance: suffix("precision", "critChance", 8)
} as const;

const movementAffixes = {
  movementSpeedBonus: suffix("fleetfoot", "movementSpeedBonus", 6)
} as const;

export const itemAffixPoolsBySlot: Record<ItemSlot, ItemAffixPool> = {
  Weapon: {
    prefixes: [spellAffixes.spellPowerMultiplier, statAffixes.dexterity, statAffixes.agility],
    suffixes: [spellAffixes.critChance, statAffixes.strength]
  },
  Helmet: {
    prefixes: [
      defenseAffixes.maxHealth,
      statAffixes.vitality,
      statAffixes.strength
    ],
    suffixes: [spellAffixes.critChance, statAffixes.dexterity]
  },
  BodyArmor: {
    prefixes: [
      defenseAffixes.maxHealth,
      statAffixes.vitality,
      statAffixes.strength
    ],
    suffixes: [statAffixes.agility, statAffixes.dexterity]
  },
  Gloves: {
    prefixes: [statAffixes.agility, statAffixes.dexterity],
    suffixes: [spellAffixes.critChance, spellAffixes.spellPowerMultiplier]
  },
  Boots: {
    prefixes: [statAffixes.agility, statAffixes.vitality, defenseAffixes.maxHealth],
    suffixes: [movementAffixes.movementSpeedBonus, spellAffixes.critChance, statAffixes.dexterity]
  },
  Belt: {
    prefixes: [defenseAffixes.maxHealth, statAffixes.vitality],
    suffixes: [statAffixes.strength, statAffixes.agility]
  },
  Amulet: {
    prefixes: [spellAffixes.spellPowerMultiplier, defenseAffixes.maxHealth, statAffixes.vitality],
    suffixes: [spellAffixes.critChance, statAffixes.dexterity, statAffixes.agility]
  },
  Ring: {
    prefixes: [defenseAffixes.maxHealth, statAffixes.dexterity, statAffixes.agility],
    suffixes: [spellAffixes.critChance, statAffixes.strength, statAffixes.vitality]
  }
} as const;

const getTierRangeSplits = (
  minValue: number,
  maxValue: number,
  splits: readonly number[]
): Readonly<Record<AffixTier, readonly [number, number]>> => {
  const lerp = (t: number) => minValue + (maxValue - minValue) * t;
  const bounds = splits.map((value) => lerp(value));
  const toInt = Number.isInteger(minValue) && Number.isInteger(maxValue);
  const round = (value: number) => (toInt ? Math.round(value) : Number(value.toFixed(4)));
  const makeRange = (low: number, high: number): readonly [number, number] => {
    const resolvedLow = round(Math.min(low, high));
    const resolvedHigh = round(Math.max(low, high));
    return [resolvedLow, resolvedHigh] as const;
  };

  return {
    1: makeRange(bounds[0], bounds[1]),
    2: makeRange(bounds[1], bounds[2]),
    3: makeRange(bounds[2], bounds[3]),
    4: makeRange(bounds[3], bounds[4]),
    5: makeRange(bounds[4], bounds[5])
  } as const;
};

export const getAffixTierRangesForStat = (
  itemTier: number,
  statKey: ItemStatKey
): Readonly<Record<AffixTier, readonly [number, number]>> => {
  if (statKey === "movementSpeedBonus") {
    const tier = Math.max(1, Math.min(10, Math.round(itemTier)));
    const minValue = 0.03 + tier * 0.001;
    const maxValue = 0.075 + tier * 0.0025;
    return getTierRangeSplits(minValue, maxValue, [0, 0.55, 0.78, 0.9, 0.97, 1]);
  }

  const ranges = getMapBalanceByTier(itemTier).itemStatRanges as Record<string, readonly [number, number]>;
  const range = ranges[statKey];

  if (!range) {
    return getTierRangeSplits(0, 0, [0, 0.6, 0.8, 0.9, 0.97, 1]);
  }

  return getTierRangeSplits(range[0], range[1], [0, 0.55, 0.78, 0.9, 0.97, 1]);
};
