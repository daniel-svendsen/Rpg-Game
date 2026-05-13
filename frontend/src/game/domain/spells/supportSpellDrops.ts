import { getSupportSpellDropChanceForTier, supportSpellDropBalance } from "../../config/balance";
import type { CharacterRecord, MonsterRarity } from "../../../shared/types/saveTypes";
import { pickWeighted } from "../loot/weightedTables";

export const getNextDroppableSupportSpellId = (
  ownedSupportSpellIds: string[],
  mapTier: number
): string | null => {
  const missingSupportPool = supportSpellDropBalance.pool.filter(
    (entry) =>
      entry.minTier <= Math.max(0, mapTier) &&
      !ownedSupportSpellIds.includes(entry.supportSpellId)
  );

  return (
    pickWeighted(
      missingSupportPool.map((entry) => ({
        key: entry.supportSpellId,
        weight: entry.weight
      }))
    ) ?? null
  );
};

export const rollSupportSpellDrop = (
  character: CharacterRecord,
  mapTier: number,
  rarity: MonsterRarity,
  dropChanceMultiplier = 1
): string | null => {
  const dropChance = getSupportSpellDropChanceForTier(mapTier, rarity) * dropChanceMultiplier;

  if (Math.random() >= dropChance) {
    return null;
  }

  return getNextDroppableSupportSpellId(character.unlockedSupportSpellIds, mapTier);
};
