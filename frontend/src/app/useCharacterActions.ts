import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useLifeFlask } from "../game/domain/player/lifeFlask";
import { spendLevelStatPoint } from "../game/domain/player/playerTypes";
import type { ArenaRuntimeState } from "../game/domain/combat/arenaSimulation";
import type { ArenaSnapshot, CharacterRecord, CharacterStats } from "../shared/types/saveTypes";
import type { ScreenMode } from "./appTypes";

interface UseCharacterActionsParams {
  character: CharacterRecord | null;
  screenMode: ScreenMode;
  arenaRuntimeRef: MutableRefObject<ArenaRuntimeState | null>;
  latestCharacterRef: MutableRefObject<CharacterRecord | null>;
  commitCharacter: (nextCharacter: CharacterRecord | null) => void;
  setArenaSnapshot: Dispatch<SetStateAction<ArenaSnapshot | null>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
}

export const useCharacterActions = ({
  character,
  screenMode,
  arenaRuntimeRef,
  latestCharacterRef,
  commitCharacter,
  setArenaSnapshot,
  setStatusMessage,
  setErrorMessage
}: UseCharacterActionsParams) => {
  const handleSpendStatPoint = (statKey: keyof CharacterStats): void => {
    if (!character) {
      return;
    }

    commitCharacter(spendLevelStatPoint(character, statKey));
  };

  const handleUseLifeFlask = (): void => {
    if (!character) {
      return;
    }

    const nextCharacter = useLifeFlask(character);

    if (nextCharacter === character) {
      setErrorMessage("Your life flask cannot be used right now.");
      return;
    }

    commitCharacter(nextCharacter);
    latestCharacterRef.current = nextCharacter;

    if (screenMode === "arena" && arenaRuntimeRef.current) {
      const nextRuntime = {
        ...arenaRuntimeRef.current,
        player: nextCharacter,
        snapshot: {
          ...arenaRuntimeRef.current.snapshot,
          player: nextCharacter
        }
      };
      arenaRuntimeRef.current = nextRuntime;
      setArenaSnapshot(nextRuntime.snapshot);
    }

    setStatusMessage("Life flask used.");
    setErrorMessage(null);
  };

  return {
    handleSpendStatPoint,
    handleUseLifeFlask
  };
};
