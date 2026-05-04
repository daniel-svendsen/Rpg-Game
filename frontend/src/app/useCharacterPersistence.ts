import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { saveCharacter } from "../api/gameApi";
import { normalizeCharacterRecord } from "../game/domain/player/playerTypes";
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

  const commitCharacter = useCallback((nextCharacter: CharacterRecord | null): void => {
    latestCharacterRef.current = nextCharacter;
    setCharacter(nextCharacter);
  }, []);

  const persistCharacterNow = useCallback(
    async (nextCharacter: CharacterRecord, failureMessage: string): Promise<void> => {
      if (!token) {
        return;
      }

      try {
        const savedCharacter = normalizeCharacterRecord(await saveCharacter(nextCharacter, token));
        latestCharacterRef.current = savedCharacter;
        setCharacter(savedCharacter);
      } catch {
        onAutosaveError(failureMessage);
      }
    },
    [onAutosaveError, token]
  );

  const saveCharacterManually = useCallback(async (nextCharacter: CharacterRecord): Promise<void> => {
    if (!token) {
      return;
    }

    const savedCharacter = normalizeCharacterRecord(await saveCharacter(nextCharacter, token));
    latestCharacterRef.current = savedCharacter;
    setCharacter(savedCharacter);
  }, [token]);

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
        .then((savedCharacter) => {
          const normalizedCharacter = normalizeCharacterRecord(savedCharacter);
          latestCharacterRef.current = normalizedCharacter;
          setCharacter(normalizedCharacter);
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
