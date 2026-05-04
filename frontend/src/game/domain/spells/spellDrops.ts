import { getSpellDropChanceForTier, spellDropBalance } from "../../config/balance";
import { spellConfig } from "../../config/spellConfig";
import type { CharacterRecord, MonsterRarity } from "../../../shared/types/saveTypes";
import { getEquippedUniqueModifiers } from "../items/uniqueEffects";
import { pickWeighted } from "../loot/weightedTables";

const legacySpellIdMap: Record<string, string> = {
  arcBolt: "stormChain",
  emberPulse: "emberBurst",
  frostNova: "glacierNova"
};

export const normalizeSpellId = (spellId: string): string => legacySpellIdMap[spellId] ?? spellId;

export const getNextDroppableSpellId = (ownedSpellIds: string[], mapTier: number): string | null => {
  const normalizedOwnedSpellIds = ownedSpellIds.map(normalizeSpellId);
  const missingSpellPool = spellDropBalance.pool.filter(
    (entry) =>
      entry.minTier <= Math.max(0, mapTier) &&
      !normalizedOwnedSpellIds.includes(entry.spellId)
  );

  return (
    pickWeighted(
      missingSpellPool.map((entry) => ({
        key: entry.spellId,
        weight: entry.weight
      }))
    ) ?? null
  );
};

export const rollSpellDrop = (
  character: CharacterRecord,
  mapTier: number,
  rarity: MonsterRarity
): string | null => {
  const equippedUniqueModifiers = getEquippedUniqueModifiers(character);
  const dropChance =
    getSpellDropChanceForTier(mapTier, rarity) * equippedUniqueModifiers.spellDropChanceMultiplier;

  if (Math.random() >= dropChance) {
    return null;
  }

  return getNextDroppableSpellId(character.unlockedSpellIds, mapTier);
};

export const getSpellName = (spellId: string): string => spellConfig[normalizeSpellId(spellId)]?.name ?? spellId;

export const getSpellDescription = (spellId: string): string => {
  const normalizedSpellId = normalizeSpellId(spellId);
  return spellConfig[normalizedSpellId]?.description ?? "Spell description unavailable.";
};
