import { getMapBalanceByTier } from "../../config/balance";
import type { InventoryItem } from "../../../shared/types/saveTypes";

const orderedStatKeys = [
  "strength",
  "agility",
  "vitality",
  "dexterity",
  "maxHealth",
  "critChance",
  "spellPowerMultiplier"
] as const;

type ItemStatKey = (typeof orderedStatKeys)[number];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const getStatTier = (statKey: ItemStatKey, value: number, itemTier: number): number => {
  const tierRanges = getMapBalanceByTier(itemTier).itemStatRanges as Partial<
    Record<ItemStatKey, readonly [number, number]>
  >;
  const range = tierRanges[statKey];

  if (!range) {
    return 5;
  }

  const [minValue, maxValue] = range;
  const normalized = maxValue === minValue ? 1 : (value - minValue) / (maxValue - minValue);
  const bucket = 5 - Math.floor(clamp(normalized, 0, 0.9999) * 5);
  return clamp(bucket, 1, 5);
};

export const getItemStatLines = (item: InventoryItem): string[] =>
  [
    ...orderedStatKeys.flatMap((statKey) => {
      const value = item.statBonuses[statKey];

      if (value === undefined) {
        return [];
      }

      const formattedValue =
        statKey === "critChance" || statKey === "spellPowerMultiplier"
          ? `+${Number(value).toFixed(2)}`
          : `+${value}`;

      return [`${statKey} ${formattedValue} (Tier ${getStatTier(statKey, Number(value), item.tier)})`];
    }),
    ...(item.uniqueEffectDescription ? [`Unique: ${item.uniqueEffectDescription}`] : [])
  ];
