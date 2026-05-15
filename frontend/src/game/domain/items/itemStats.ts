import { getMapBalanceByTier } from "../../config/balance";
import { getAffixTierRangesForStat, type AffixTier } from "../../config/itemAffixConfig";
import type { InventoryItem } from "../../../shared/types/saveTypes";

const orderedStatKeys = [
  "strength",
  "agility",
  "vitality",
  "dexterity",
  "intelligence",
  "maxHealth",
  "movementSpeedBonus",
  "fireResistance",
  "coldResistance",
  "lightningResistance",
  "critChance",
  "spellPowerMultiplier"
] as const;

type ItemStatKey = (typeof orderedStatKeys)[number];

const statKeyLabels: Record<ItemStatKey, string> = {
  strength: "Strength",
  agility: "Agility",
  vitality: "Vitality",
  dexterity: "Dexterity",
  intelligence: "Intelligence",
  maxHealth: "Max Health",
  movementSpeedBonus: "Movement Speed",
  fireResistance: "Fire Resistance",
  coldResistance: "Cold Resistance",
  lightningResistance: "Lightning Resistance",
  critChance: "Crit Chance",
  spellPowerMultiplier: "Spell Power"
};

export type StatEntry = { label: string; formattedValue: string; tier: number | null; isBase: boolean };

const extraStatLabels: Record<string, string> = {
  attackSpeedMultiplier: "Attack Speed",
  castSpeedMultiplier: "Cast Speed"
};

export const getStatLabel = (statKey: string): string =>
  statKeyLabels[statKey as ItemStatKey] ?? extraStatLabels[statKey] ?? statKey;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const getStatTier = (statKey: ItemStatKey, value: number, itemTier: number): number => {
  if (statKey === "movementSpeedBonus") {
    const ranges = getAffixTierRangesForStat(itemTier, statKey);
    const resolved = Object.entries(ranges).find(([, [min, max]]) => value >= min && value <= max);
    return resolved ? (Number(resolved[0]) as AffixTier) : 5;
  }

  const tierRanges = getMapBalanceByTier(itemTier).itemStatRanges as Partial<
    Record<ItemStatKey, readonly [number, number]>
  >;
  const range = tierRanges[statKey];

  if (!range) {
    return 5;
  }

  const [minValue, maxValue] = range;
  const normalized = maxValue === minValue ? 1 : (value - minValue) / (maxValue - minValue);
  const bucket = Math.floor(clamp(normalized, 0, 0.9999) * 5) + 1;
  return clamp(bucket, 1, 5);
};

export const getItemStatEntries = (item: InventoryItem): StatEntry[] => [
  ...(item.statBonuses.armor !== undefined
    ? [{ label: "Armor", formattedValue: `${item.statBonuses.armor}`, tier: null, isBase: true }]
    : []),
  ...(item.statBonuses.evasion !== undefined
    ? [{ label: "Evasion", formattedValue: `${item.statBonuses.evasion}`, tier: null, isBase: true }]
    : []),
  ...(item.statBonuses.attackSpeedMultiplier !== undefined
    ? (() => {
        const val = Number(item.statBonuses.attackSpeedMultiplier);
        const isBase = val >= 1.0;
        const ranges = getAffixTierRangesForStat(item.tier, "attackSpeedMultiplier");
        const tier = isBase
          ? null
          : (Number(Object.entries(ranges).find(([, [mn, mx]]) => val >= mn && val <= mx)?.[0]) || 5) as AffixTier | null;
        return [{ label: "Attack Speed", formattedValue: `+${Math.round((isBase ? val - 1 : val) * 100)}%`, tier, isBase }];
      })()
    : []),
  ...(item.statBonuses.castSpeedMultiplier !== undefined
    ? (() => {
        const val = Number(item.statBonuses.castSpeedMultiplier);
        const isBase = val >= 1.0;
        const ranges = getAffixTierRangesForStat(item.tier, "castSpeedMultiplier");
        const tier = isBase
          ? null
          : (Number(Object.entries(ranges).find(([, [mn, mx]]) => val >= mn && val <= mx)?.[0]) || 5) as AffixTier | null;
        return [{ label: "Cast Speed", formattedValue: `+${Math.round((isBase ? val - 1 : val) * 100)}%`, tier, isBase }];
      })()
    : []),
  ...orderedStatKeys.flatMap((statKey): StatEntry[] => {
    const value = item.statBonuses[statKey];
    if (value === undefined) return [];

    const formattedValue = (() => {
      if (statKey === "movementSpeedBonus") return `+${Math.round(Number(value) * 100)}%`;
      if (statKey === "fireResistance" || statKey === "coldResistance" || statKey === "lightningResistance")
        return `+${Math.round(Number(value) * 100)}%`;
      if (statKey === "critChance") return `+${Math.round(Number(value) * 100)}%`;
      if (statKey === "spellPowerMultiplier") return `+${Math.round(Number(value) * 100)}%`;
      return `+${value}`;
    })();

    return [{ label: statKeyLabels[statKey], formattedValue, tier: getStatTier(statKey, Number(value), item.tier), isBase: false }];
  })
];

export const getItemStatLines = (item: InventoryItem): string[] =>
  getItemStatEntries(item).map((e) =>
    e.tier !== null ? `${e.label} ${e.formattedValue} (Tier ${e.tier})` : `${e.label} ${e.formattedValue}`
  );
