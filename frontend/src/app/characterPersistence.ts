import type { CharacterRecord } from "../shared/types/saveTypes";
import type { ScreenMode } from "./appTypes";

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

interface ManualSaveCharacterInput {
  screenMode: ScreenMode;
  character: CharacterRecord | null;
  latestCharacter: CharacterRecord | null;
  arenaCharacter: CharacterRecord | null;
}

export const resolveManualSaveCharacter = ({
  screenMode,
  character,
  latestCharacter,
  arenaCharacter
}: ManualSaveCharacterInput): CharacterRecord | null => {
  if (screenMode === "arena") {
    return arenaCharacter ?? latestCharacter ?? character;
  }

  return latestCharacter ?? character;
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
