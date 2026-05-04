import type { CharacterRecord, CharacterStats } from "../../../shared/types/saveTypes";
import { starterSpellIds, starterSupportSpellIds, supportSpellConfig } from "../../config/spellConfig";
import { createInitialMapProgress, normalizeMapProgress } from "../maps/mapProgress";
import { getExperienceRequiredForLevel } from "../progression/progression";
import { createInitialLifeFlask, normalizeLifeFlask } from "./lifeFlask";
import { normalizeSpellId } from "../spells/spellDrops";
import { createInitialSpellProgress, normalizeSpellProgress } from "../spells/spellProgression";
import { applyEquipmentState } from "./equipment";
import { deriveStats } from "./statCalculation";

export const createNewCharacter = (name: string, baseStats: CharacterStats): CharacterRecord => {
  const derivedStats = deriveStats(baseStats);

  return {
    name,
    level: 1,
    experience: 0,
    experienceToNextLevel: getExperienceRequiredForLevel(1),
    unspentStatPoints: 0,
    baseStats,
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
  const normalizedUnlockedSupportSpellIds = [
    ...new Set(validSupportIds.length > 0 ? validSupportIds : [...starterSupportSpellIds])
  ];

  return applyEquipmentState({
    ...character,
    unlockedSpellIds: normalizedUnlockedSpellIds,
    spellLoadout: character.spellLoadout.map((link) => ({
      ...link,
      mainSpellId: normalizeSpellId(link.mainSpellId)
    })),
    unlockedSupportSpellIds: normalizedUnlockedSupportSpellIds,
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

  const nextBaseStats = {
    ...character.baseStats,
    [statKey]: character.baseStats[statKey] + 1
  };
  return applyEquipmentState({
    ...character,
    baseStats: nextBaseStats,
    unspentStatPoints: character.unspentStatPoints - 1,
    currentHealth: character.currentHealth
  });
};
