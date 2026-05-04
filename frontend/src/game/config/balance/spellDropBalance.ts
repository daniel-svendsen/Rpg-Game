import type { MonsterRarity } from "../../../shared/types/saveTypes";

const percent = (value: number): number => value / 100;

export interface DroppableSpellEntry {
  spellId: string;
  minTier: number;
  weight: number;
}

export const spellDropBalance = {
  baseDropChanceByTier: {
    0: percent(5),
    1: percent(5.2),
    2: percent(5.4),
    3: percent(5.6),
    4: percent(5.8),
    5: percent(6),
    6: percent(6.2),
    7: percent(6.4),
    8: percent(6.6),
    9: percent(6.8),
    10: percent(7)
  } as const,
  rareMonsterDropChanceMultiplier: 1.2,
  pool: [
    { spellId: "glacierNova", minTier: 1, weight: 45 },
    { spellId: "arcLance", minTier: 3, weight: 20 },
    { spellId: "ashenOrbit", minTier: 5, weight: 8 },
    { spellId: "tempestBloom", minTier: 7, weight: 3 }
  ] satisfies DroppableSpellEntry[]
} as const;

export const getSpellDropChanceForTier = (tier: number, rarity: MonsterRarity): number => {
  const baseChance =
    spellDropBalance.baseDropChanceByTier[
      Math.max(0, Math.min(10, tier)) as keyof typeof spellDropBalance.baseDropChanceByTier
    ] ?? spellDropBalance.baseDropChanceByTier[10];

  return rarity === "Rare" ? baseChance * spellDropBalance.rareMonsterDropChanceMultiplier : baseChance;
};
