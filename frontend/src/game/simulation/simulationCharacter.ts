import type { CharacterRecord } from "../../shared/types/saveTypes";
import { normalizeCharacterRecord } from "../domain/player/playerTypes";
import { createInitialLifeFlask } from "../domain/player/lifeFlask";

export const createSimulationBaselineCharacter = (character: CharacterRecord): CharacterRecord => {
  const normalizedCharacter = normalizeCharacterRecord(character);

  return {
    ...normalizedCharacter,
    currentHealth: normalizedCharacter.derivedStats.maxHealth,
    lifeFlask: createInitialLifeFlask()
  };
};
