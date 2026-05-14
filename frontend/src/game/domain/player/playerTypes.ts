import type { CharacterRecord, CharacterStats } from "../../../shared/types/saveTypes";
import { starterSpellIds, starterSupportSpellIds, supportSpellConfig } from "../../config/spellConfig";
import { createInitialMapProgress, normalizeMapProgress } from "../maps/mapProgress";
import { getExperienceRequiredForLevel } from "../progression/progression";
import { createInitialLifeFlask, normalizeLifeFlask } from "./lifeFlask";
import { normalizeSpellId } from "../spells/spellDrops";
import { createInitialSpellProgress, normalizeSpellProgress } from "../spells/spellProgression";
import { applyEquipmentState } from "./equipment";
import { deriveStats } from "./statCalculation";

const normalizeBaseStats = (baseStats: CharacterStats): CharacterStats => ({
  strength: baseStats.strength ?? 0,
  agility: baseStats.agility ?? 0,
  vitality: baseStats.vitality ?? 0,
  dexterity: baseStats.dexterity ?? 0,
  intelligence: baseStats.intelligence ?? 0
});

export const createNewCharacter = (name: string, baseStats: CharacterStats): CharacterRecord => {
  const normalizedBaseStats = normalizeBaseStats(baseStats);
  const derivedStats = deriveStats(normalizedBaseStats);

  return {
    name,
    level: 1,
    experience: 0,
    experienceToNextLevel: getExperienceRequiredForLevel(1),
    unspentStatPoints: 0,
    baseStats: normalizedBaseStats,
    derivedStats,
    currentHealth: derivedStats.maxHealth,
    gold: 0,
    lifeFlask: createInitialLifeFlask(),
    inventory: [],
    equippedItems: {},
    unlockedSpellIds: [...starterSpellIds],
    unlockedSupportSpellIds: [...starterSupportSpellIds],
    spellProgress: createInitialSpellProgress(starterSpellIds),
    spellLoadout: [
      {
        mainSpellId: starterSpellIds[0],
        supportSpellIds: []
      }
    ],
    currencies: [],
    mapProgress: createInitialMapProgress()
  };
};

export const normalizeCharacterRecord = (character: CharacterRecord): CharacterRecord => {
  const normalizedUnlockedSpellIds = [...new Set(character.unlockedSpellIds.map(normalizeSpellId))];
  const savedSupportIds = character.unlockedSupportSpellIds?.length
    ? character.unlockedSupportSpellIds
    : [...starterSupportSpellIds];
  const validSupportIds = savedSupportIds.filter((supportSpellId) => supportSpellConfig[supportSpellId]);
  const normalizedUnlockedSupportSpellIds = [...new Set([
    ...(validSupportIds.length > 0 ? validSupportIds : []),
    ...starterSupportSpellIds
  ])];
  const normalizedSpellLoadout = character.spellLoadout.map((link) => {
    const uniqueSupportSpellIds = [...new Set(link.supportSpellIds.filter(Boolean))].slice(0, 2);

    return {
      ...link,
      mainSpellId: normalizeSpellId(link.mainSpellId),
      supportSpellIds: uniqueSupportSpellIds
    };
  });

  const normalizedPassiveSupportIds = (character.passiveSupportIds ?? [])
    .filter((id) => {
      const def = supportSpellConfig[id];
      return def !== undefined && def.passiveOnly === true;
    })
    .slice(0, 3);

  return applyEquipmentState({
    ...character,
    baseStats: normalizeBaseStats(character.baseStats),
    unlockedSpellIds: normalizedUnlockedSpellIds,
    spellLoadout: normalizedSpellLoadout,
    unlockedSupportSpellIds: normalizedUnlockedSupportSpellIds,
    passiveSupportIds: normalizedPassiveSupportIds,
    lifeFlask: normalizeLifeFlask(character.lifeFlask?.currentCharges),
    spellProgress: normalizeSpellProgress(character.spellProgress, normalizedUnlockedSpellIds),
    mapProgress: normalizeMapProgress(character.mapProgress)
  });
};

export const spendLevelStatPoint = (
  character: CharacterRecord,
  statKey: keyof CharacterStats
): CharacterRecord => {
  if (character.unspentStatPoints <= 0) {
    return character;
  }

  const normalizedBaseStats = normalizeBaseStats(character.baseStats);
  const nextBaseStats = {
    ...normalizedBaseStats,
    [statKey]: normalizedBaseStats[statKey] + 1
  };
  return applyEquipmentState({
    ...character,
    baseStats: nextBaseStats,
    unspentStatPoints: character.unspentStatPoints - 1,
    currentHealth: character.currentHealth
  });
};
