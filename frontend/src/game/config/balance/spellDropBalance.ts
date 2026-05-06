import type { MonsterRarity } from "../../../shared/types/saveTypes";

const percent = (value: number): number => value / 100;

export interface DroppableSpellEntry {
  spellId: string;
  minTier: number;
  weight: number;
  dropCategory: "common" | "chase";
}

export const spellDropBalance = {
  baseDropChanceByTier: {
    0: percent(0.6),
    1: percent(0.7),
    2: percent(0.8),
    3: percent(0.9),
    4: percent(1),
    5: percent(0.45),
    6: percent(0.5),
    7: percent(0.55),
    8: percent(0.6),
    9: percent(0.65),
    10: percent(0.7)
  } as const,
  rareMonsterDropChanceMultiplier: 1.05,
  pool: [
    { spellId: "glacierNova", minTier: 1, weight: 55, dropCategory: "common" },
    { spellId: "arcLance", minTier: 3, weight: 18, dropCategory: "common" },
    { spellId: "ashenOrbit", minTier: 5, weight: 4, dropCategory: "chase" },
    { spellId: "tempestBloom", minTier: 7, weight: 1, dropCategory: "chase" }
  ] satisfies DroppableSpellEntry[]
} as const;

export const getSpellDropChanceForTier = (tier: number, rarity: MonsterRarity): number => {
  const baseChance =
    spellDropBalance.baseDropChanceByTier[
      Math.max(0, Math.min(10, tier)) as keyof typeof spellDropBalance.baseDropChanceByTier
    ] ?? spellDropBalance.baseDropChanceByTier[10];

  return rarity === "Rare" ? baseChance * spellDropBalance.rareMonsterDropChanceMultiplier : baseChance;
};
