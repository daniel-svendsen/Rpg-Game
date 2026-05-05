import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { saveCharacter } from "../api/gameApi";
import { normalizeCharacterRecord } from "../game/domain/player/playerTypes";
import type { CharacterRecord } from "../shared/types/saveTypes";
import {
  serializeCharacterForPersistence,
  shouldAutosaveCharacter
} from "./characterPersistence";

interface UseCharacterPersistenceOptions {
  token: string | null;
  isAutosaveEnabled: boolean;
  onAutosaveError: (message: string) => void;
}

interface CharacterPersistenceApi {
  character: CharacterRecord | null;
  latestCharacterRef: MutableRefObject<CharacterRecord | null>;
  commitCharacter: (nextCharacter: CharacterRecord | null) => void;
  hydrateCharacter: (nextCharacter: CharacterRecord | null) => void;
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
  const lastPersistedSnapshotRef = useRef<string | null>(null);
  const isAutosaveInFlightRef = useRef(false);

  const commitCharacter = useCallback((nextCharacter: CharacterRecord | null): void => {
    latestCharacterRef.current = nextCharacter;
    setCharacter(nextCharacter);
  }, []);

  const syncSavedCharacter = useCallback((savedCharacter: CharacterRecord | null): void => {
    latestCharacterRef.current = savedCharacter;
    lastPersistedSnapshotRef.current = serializeCharacterForPersistence(savedCharacter);
    setCharacter(savedCharacter);
  }, []);

  const hydrateCharacter = useCallback(
    (nextCharacter: CharacterRecord | null): void => {
      syncSavedCharacter(nextCharacter);
    },
    [syncSavedCharacter]
  );

  const persistCharacterNow = useCallback(
    async (nextCharacter: CharacterRecord, failureMessage: string): Promise<void> => {
      if (!token) {
        return;
      }

      try {
        const savedCharacter = normalizeCharacterRecord(await saveCharacter(nextCharacter, token));
        syncSavedCharacter(savedCharacter);
      } catch {
        onAutosaveError(failureMessage);
      }
    },
    [onAutosaveError, syncSavedCharacter, token]
  );

  const saveCharacterManually = useCallback(async (nextCharacter: CharacterRecord): Promise<void> => {
    if (!token) {
      return;
    }

    const savedCharacter = normalizeCharacterRecord(await saveCharacter(nextCharacter, token));
    syncSavedCharacter(savedCharacter);
  }, [syncSavedCharacter, token]);

  useEffect(() => {
    if (token) {
      return;
    }

    latestCharacterRef.current = null;
    lastPersistedSnapshotRef.current = null;
    isAutosaveInFlightRef.current = false;
    setCharacter(null);
  }, [token]);

  useEffect(() => {
    if (!character || !isAutosaveEnabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const latestCharacter = latestCharacterRef.current;

      if (
        !token ||
        !latestCharacter ||
        !shouldAutosaveCharacter({
          token,
          isAutosaveEnabled,
          latestCharacter,
          lastPersistedSnapshot: lastPersistedSnapshotRef.current,
          isSaveInFlight: isAutosaveInFlightRef.current
        })
      ) {
        return;
      }

      isAutosaveInFlightRef.current = true;

      void saveCharacter(latestCharacter, token)
        .then((savedCharacter) => {
          const normalizedCharacter = normalizeCharacterRecord(savedCharacter);
          syncSavedCharacter(normalizedCharacter);
        })
        .catch(() => {
          onAutosaveError("Autosave failed. Check that the backend is running.");
        })
        .finally(() => {
          isAutosaveInFlightRef.current = false;
        });
    }, 10_000);

    return () => window.clearInterval(intervalId);
  }, [character, isAutosaveEnabled, onAutosaveError, syncSavedCharacter, token]);

  return {
    character,
    latestCharacterRef,
    commitCharacter,
    hydrateCharacter,
    persistCharacterNow,
    saveCharacterManually
  };
};
