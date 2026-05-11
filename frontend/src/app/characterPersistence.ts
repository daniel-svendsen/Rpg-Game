import type { CharacterRecord } from "../shared/types/saveTypes";

export interface AutosaveDecisionInput {
  token: string | null;
  isAutosaveEnabled: boolean;
  latestCharacter: CharacterRecord | null;
  lastPersistedSnapshot: string | null;
  isSaveInFlight: boolean;
}

export const serializeCharacterForPersistence = (character: CharacterRecord | null): string | null =>
  character ? JSON.stringify(character) : null;

interface SaveResponseHydrationInput {
  latestCharacter: CharacterRecord | null;
  requestedSnapshot: string | null;
}

export const shouldHydrateSaveResponse = ({
  latestCharacter,
  requestedSnapshot
}: SaveResponseHydrationInput): boolean => {
  if (!requestedSnapshot) {
    return false;
  }

  return serializeCharacterForPersistence(latestCharacter) === requestedSnapshot;
};

export const shouldAutosaveCharacter = ({
  token,
  isAutosaveEnabled,
  latestCharacter,
  lastPersistedSnapshot,
  isSaveInFlight
}: AutosaveDecisionInput): boolean => {
  if (!token || !isAutosaveEnabled || !latestCharacter || isSaveInFlight) {
    return false;
  }

  return serializeCharacterForPersistence(latestCharacter) !== lastPersistedSnapshot;
};
