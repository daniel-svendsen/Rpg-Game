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
    2: percent(0.08),
    3: percent(0.12),
    4: percent(0.16),
    5: percent(0.20),
    6: percent(0.25),
    7: percent(0.30),
    8: percent(0.35),
    9: percent(0.40),
    10: percent(0.45)
  } as const,
  rareMonsterDropChanceMultiplier: 4,
  pool: [
    { supportSpellId: "chainSupport", minTier: 2, weight: 8, dropCategory: "common" },
    { supportSpellId: "scattershotProjectiles", minTier: 3, weight: 3, dropCategory: "chase" },
    { supportSpellId: "impactCascade", minTier: 5, weight: 2, dropCategory: "chase" },
    { supportSpellId: "areaSupport", minTier: 1, weight: 7, dropCategory: "common" },
    { supportSpellId: "concentratedEffect", minTier: 2, weight: 5, dropCategory: "common" },
    { supportSpellId: "swiftnessAura", minTier: 1, weight: 5, dropCategory: "common" },
    { supportSpellId: "wardingAura", minTier: 3, weight: 4, dropCategory: "common" },
    { supportSpellId: "ironSkinAura", minTier: 4, weight: 3, dropCategory: "common" },
    { supportSpellId: "arcaneResonance", minTier: 5, weight: 3, dropCategory: "chase" }
  ] satisfies DroppableSupportSpellEntry[]
} as const;

export const getSupportSpellDropChanceForTier = (tier: number, rarity: MonsterRarity): number => {
  const baseChance =
    supportSpellDropBalance.baseDropChanceByTier[
      Math.max(0, Math.min(10, tier)) as keyof typeof supportSpellDropBalance.baseDropChanceByTier
    ] ?? supportSpellDropBalance.baseDropChanceByTier[10];

  return rarity === "Rare" ? baseChance * supportSpellDropBalance.rareMonsterDropChanceMultiplier : baseChance;
};
