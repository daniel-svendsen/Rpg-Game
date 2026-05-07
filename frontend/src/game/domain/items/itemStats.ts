import { getMapBalanceByTier } from "../../config/balance";
import { getAffixTierRangesForStat, type AffixTier } from "../../config/itemAffixConfig";
import type { InventoryItem } from "../../../shared/types/saveTypes";

const orderedStatKeys = [
  "strength",
  "agility",
  "vitality",
  "dexterity",
  "maxHealth",
  "movementSpeedBonus",
  "armor",
  "evasion",
  "critChance",
  "spellPowerMultiplier"
] as const;

type ItemStatKey = (typeof orderedStatKeys)[number];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const getStatTier = (statKey: ItemStatKey, value: number, itemTier: number): number => {
  if (statKey === "movementSpeedBonus" || statKey === "armor" || statKey === "evasion") {
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

export const getItemStatLines = (item: InventoryItem): string[] =>
  [
    ...orderedStatKeys.flatMap((statKey) => {
      const value = item.statBonuses[statKey];

      if (value === undefined) {
        return [];
      }

      const formattedValue = (() => {
        if (statKey === "movementSpeedBonus") {
          return `+${(Number(value) * 100).toFixed(1)}%`;
        }

        if (statKey === "critChance" || statKey === "spellPowerMultiplier") {
          return `+${Number(value).toFixed(2)}`;
        }

        return `+${value}`;
      })();

      return [`${statKey} ${formattedValue} (Tier ${getStatTier(statKey, Number(value), item.tier)})`];
    }),
    ...(item.uniqueEffectDescription ? [`Unique: ${item.uniqueEffectDescription}`] : [])
  ];
