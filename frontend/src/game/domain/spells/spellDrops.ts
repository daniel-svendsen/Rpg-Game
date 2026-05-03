import { droppableSpellIds, spellConfig } from "../../config/spellConfig";

const legacySpellIdMap: Record<string, string> = {
  arcBolt: "stormChain",
  emberPulse: "emberBurst",
  frostNova: "glacierNova"
};

export const normalizeSpellId = (spellId: string): string => legacySpellIdMap[spellId] ?? spellId;

export const getNextDroppableSpellId = (ownedSpellIds: string[]): string | null => {
  const normalizedOwnedSpellIds = ownedSpellIds.map(normalizeSpellId);
  const missingSpellId = droppableSpellIds.find((spellId) => !normalizedOwnedSpellIds.includes(spellId));
  return missingSpellId ?? null;
};

export const getSpellName = (spellId: string): string => spellConfig[normalizeSpellId(spellId)]?.name ?? spellId;

export const getSpellDescription = (spellId: string): string => {
  const normalizedSpellId = normalizeSpellId(spellId);
  return spellConfig[normalizedSpellId]?.description ?? "Spell description unavailable.";
};
