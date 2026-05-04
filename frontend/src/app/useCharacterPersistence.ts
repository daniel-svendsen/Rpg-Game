import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { saveCharacter } from "../api/gameApi";
import type { CharacterRecord } from "../shared/types/saveTypes";

interface UseCharacterPersistenceOptions {
  token: string | null;
  isAutosaveEnabled: boolean;
  onAutosaveError: (message: string) => void;
}

interface CharacterPersistenceApi {
  character: CharacterRecord | null;
  latestCharacterRef: MutableRefObject<CharacterRecord | null>;
  commitCharacter: (nextCharacter: CharacterRecord | null) => void;
  persistCharacterNow: (nextCharacter: CharacterRecord, failureMessage: string) => Promise<void>;
  saveCharacterManually: (nextCharacter: CharacterRecord) => Promise<void>;
}

export const useCharacterPersistence = ({
  token,
  isAutosaveEnabled,
  onAutosaveError
}: UseCharacterPersistenceOptions): CharacterPersistenceApi => {
  const [character, setCharacter] = useState<CharacterRecord | null>(null);
  const latestCharacterRef = useRef<CharacterRecord | null>(null);

  const commitCharacter = (nextCharacter: CharacterRecord | null): void => {
    latestCharacterRef.current = nextCharacter;
    setCharacter(nextCharacter);
  };

  const persistCharacterNow = async (nextCharacter: CharacterRecord, failureMessage: string): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      await saveCharacter(nextCharacter, token);
      latestCharacterRef.current = nextCharacter;
    } catch {
      onAutosaveError(failureMessage);
    }
  };

  const saveCharacterManually = async (nextCharacter: CharacterRecord): Promise<void> => {
    if (!token) {
      return;
    }

    await saveCharacter(nextCharacter, token);
    latestCharacterRef.current = nextCharacter;
  };

  useEffect(() => {
    if (!token || !character || !isAutosaveEnabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const latestCharacter = latestCharacterRef.current;

      if (!latestCharacter) {
        return;
      }

      void saveCharacter(latestCharacter, token)
        .then(() => {
          latestCharacterRef.current = latestCharacter;
        })
        .catch(() => {
          onAutosaveError("Autosave failed. Check that the backend is running.");
        });
    }, 10_000);

    return () => window.clearInterval(intervalId);
  }, [character, isAutosaveEnabled, onAutosaveError, token]);

  return {
    character,
    latestCharacterRef,
    commitCharacter,
    persistCharacterNow,
    saveCharacterManually
  };
};
