import type { CharacterRecord } from "../../../shared/types/saveTypes";
import { balanceConfig } from "../../config/balanceConfig";
import { deriveStats } from "../player/playerTypes";

export const getExperienceRequiredForLevel = (level: number): number =>
  Math.round(
    balanceConfig.progression.baseExperienceToLevel *
      balanceConfig.progression.experienceGrowthFactor ** (level - 1)
  );

export const applyExperience = (character: CharacterRecord, gainedExperience: number): CharacterRecord => {
  let nextCharacter = {
    ...character,
    experience: character.experience + gainedExperience
  };

  while (nextCharacter.experience >= nextCharacter.experienceToNextLevel) {
    nextCharacter = levelUp(nextCharacter);
  }

  return nextCharacter;
};

export const levelUp = (character: CharacterRecord): CharacterRecord => {
  const nextLevel = character.level + 1;
  const derivedStats = deriveStats(character.baseStats);
  const nextMaxHealth = derivedStats.maxHealth + balanceConfig.progression.healthPerLevel * (nextLevel - 1);

  return {
    ...character,
    level: nextLevel,
    experience: character.experience - character.experienceToNextLevel,
    experienceToNextLevel: getExperienceRequiredForLevel(nextLevel),
    unspentStatPoints: character.unspentStatPoints + balanceConfig.progression.statPointsPerLevel,
    derivedStats: {
      ...derivedStats,
      maxHealth: nextMaxHealth
    },
    currentHealth: nextMaxHealth
  };
};

