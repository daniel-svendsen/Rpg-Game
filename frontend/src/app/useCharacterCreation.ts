import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { createCharacter } from "../api/gameApi";
import { balanceConfig } from "../game/config/balanceConfig";
import { createNewCharacter, normalizeCharacterRecord } from "../game/domain/player/playerTypes";
import type { CharacterRecord, CharacterStats } from "../shared/types/saveTypes";
import type { ScreenMode } from "./appTypes";

const initialStats: CharacterStats = {
  strength: 0,
  agility: 0,
  vitality: 0,
  dexterity: 0,
  intelligence: 0
};

interface UseCharacterCreationParams {
  token: string | null;
  hydrateCharacter: (character: CharacterRecord) => void;
  setScreenMode: Dispatch<SetStateAction<ScreenMode>>;
  resetShopForTier: (tier: number) => void;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
}

export const useCharacterCreation = ({
  token,
  hydrateCharacter,
  setScreenMode,
  resetShopForTier,
  setStatusMessage,
  setErrorMessage
}: UseCharacterCreationParams) => {
  const [characterName, setCharacterName] = useState("Warden");
  const [characterStats, setCharacterStats] = useState<CharacterStats>(initialStats);

  const remainingStatPoints = useMemo(
    () =>
      balanceConfig.progression.startingStatPoints -
      Object.values(characterStats).reduce((total, value) => total + value, 0),
    [characterStats]
  );

  const updateStat = (key: keyof CharacterStats, delta: number) => {
    setCharacterStats((current) => {
      const nextValue = current[key] + delta;

      if (nextValue < 0) {
        return current;
      }

      const nextStats = {
        ...current,
        [key]: nextValue
      };
      const spentPoints = Object.values(nextStats).reduce((total, value) => total + value, 0);

      if (spentPoints > balanceConfig.progression.startingStatPoints) {
        return current;
      }

      return nextStats;
    });
  };

  const handleCharacterCreation = async (): Promise<void> => {
    if (!token) {
      return;
    }

    if (remainingStatPoints !== 0) {
      setErrorMessage("Spend all starting stat points before creating the character.");
      return;
    }

    setErrorMessage(null);

    try {
      const fallbackCharacter = createNewCharacter(characterName, characterStats);
      const createdCharacter = await createCharacter(
        {
          name: fallbackCharacter.name,
          baseStats: fallbackCharacter.baseStats
        },
        token
      );

      const normalizedCharacter = normalizeCharacterRecord(createdCharacter);
      hydrateCharacter(normalizedCharacter);
      setScreenMode("hub");
      resetShopForTier(1);
      setStatusMessage("Character created. Mobile-first tabs are ready.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Character creation failed.");
    }
  };

  return {
    characterName,
    setCharacterName,
    characterStats,
    updateStat,
    remainingStatPoints,
    handleCharacterCreation
  };
};
