import type { MonsterRarity } from "../../../shared/types/saveTypes";

const percent = (value: number): number => value / 100;

export interface DroppableSpellEntry {
  spellId: string;
  minTier: number;
  weight: number;
}

export const spellDropBalance = {
  baseDropChanceByTier: {
    0: percent(2.2),
    1: percent(2.4),
    2: percent(2.6),
    3: percent(2.8),
    4: percent(3),
    5: percent(3.2),
    6: percent(3.5),
    7: percent(3.8),
    8: percent(4.1),
    9: percent(4.4),
    10: percent(4.7)
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
