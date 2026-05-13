import type { MonsterRarity } from "../../../shared/types/saveTypes";

const percent = (value: number): number => value / 100;

export interface DroppableSupportSpellEntry {
  supportSpellId: string;
  minTier: number;
  weight: number;
  dropCategory: "common" | "chase";
}

export const supportSpellDropBalance = {
  baseDropChanceByTier: {
    0: percent(0.0),
    1: percent(0.0),
    2: percent(0.5),
    3: percent(0.7),
    4: percent(0.9),
    5: percent(1.1),
    6: percent(1.3),
    7: percent(1.5),
    8: percent(1.7),
    9: percent(1.9),
    10: percent(2.1)
  } as const,
  rareMonsterDropChanceMultiplier: 6,
  pool: [
    { supportSpellId: "chainSupport", minTier: 2, weight: 8, dropCategory: "common" },
    { supportSpellId: "scattershotProjectiles", minTier: 3, weight: 3, dropCategory: "chase" },
    { supportSpellId: "impactCascade", minTier: 5, weight: 2, dropCategory: "chase" }
  ] satisfies DroppableSupportSpellEntry[]
} as const;

export const getSupportSpellDropChanceForTier = (tier: number, rarity: MonsterRarity): number => {
  const baseChance =
    supportSpellDropBalance.baseDropChanceByTier[
      Math.max(0, Math.min(10, tier)) as keyof typeof supportSpellDropBalance.baseDropChanceByTier
    ] ?? supportSpellDropBalance.baseDropChanceByTier[10];

  return rarity === "Rare" ? baseChance * supportSpellDropBalance.rareMonsterDropChanceMultiplier : baseChance;
};
