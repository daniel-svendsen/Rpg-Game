import type { CharacterRecord, CharacterStats, DerivedStats } from "../../../shared/types/saveTypes";
import { starterSpellIds } from "../../config/spellConfig";
import { balanceConfig } from "../../config/balanceConfig";
import { createInitialMapProgress, normalizeMapProgress } from "../maps/mapProgress";
import { getExperienceRequiredForLevel } from "../progression/progression";
import { createInitialLifeFlask, normalizeLifeFlask } from "./lifeFlask";
import { normalizeSpellId } from "../spells/spellDrops";
import { createInitialSpellProgress, normalizeSpellProgress } from "../spells/spellProgression";

export const deriveStats = (baseStats: CharacterStats): DerivedStats => ({
  maxHealth:
    balanceConfig.statScaling.baseHealth +
    baseStats.vitality * balanceConfig.statScaling.vitalityHealthMultiplier,
  castSpeedMultiplier: 1 + baseStats.agility * balanceConfig.statScaling.agilityCastSpeedMultiplier,
  critChance: baseStats.dexterity * balanceConfig.statScaling.dexterityCritChanceMultiplier,
  spellPowerMultiplier: 1 + baseStats.strength * balanceConfig.statScaling.strengthSpellPowerMultiplier
});

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
    unlockedSupportSpellIds: ["increasedCriticalChance", "fasterCasting", "moreDamage"],
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

export const normalizeCharacterRecord = (character: CharacterRecord): CharacterRecord => ({
  ...character,
  unlockedSpellIds: [...new Set(character.unlockedSpellIds.map(normalizeSpellId))],
  spellLoadout: character.spellLoadout.map((link) => ({
    ...link,
    mainSpellId: normalizeSpellId(link.mainSpellId)
  })),
  unlockedSupportSpellIds:
    character.unlockedSupportSpellIds ?? ["increasedCriticalChance", "fasterCasting", "moreDamage"],
  lifeFlask: normalizeLifeFlask(character.lifeFlask?.currentCharges),
  spellProgress: normalizeSpellProgress(
    character.spellProgress,
    [...new Set(character.unlockedSpellIds.map(normalizeSpellId))]
  ),
  mapProgress: normalizeMapProgress(character.mapProgress)
});

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
  const nextDerivedStats = deriveStats(nextBaseStats);
  const healthRatio =
    character.derivedStats.maxHealth > 0 ? character.currentHealth / character.derivedStats.maxHealth : 1;

  return {
    ...character,
    baseStats: nextBaseStats,
    derivedStats: nextDerivedStats,
    unspentStatPoints: character.unspentStatPoints - 1,
    currentHealth: Math.max(1, Math.round(nextDerivedStats.maxHealth * healthRatio))
  };
};
