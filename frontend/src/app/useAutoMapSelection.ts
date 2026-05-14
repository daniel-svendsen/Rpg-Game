import { useEffect, type Dispatch, type SetStateAction } from "react";
import { getOwnedMapStack } from "../game/domain/maps/mapProgress";
import type { CharacterRecord } from "../shared/types/saveTypes";
import type { SelectedMapTarget } from "./appTypes";
import { getPreferredMapSelection, getUnlockedTierSelection } from "./mapFlow";

interface UseAutoMapSelectionParams {
  character: CharacterRecord | null;
  selectedMapTarget: SelectedMapTarget;
  selectedMapId: string;
  setSelectedMapTarget: Dispatch<SetStateAction<SelectedMapTarget>>;
}

export const useAutoMapSelection = ({
  character,
  selectedMapTarget,
  selectedMapId,
  setSelectedMapTarget
}: UseAutoMapSelectionParams): void => {
  useEffect(() => {
    if (!character || selectedMapTarget === "trainingGrounds") {
      return;
    }

    const selectedTier = getUnlockedTierSelection(selectedMapTarget);

    if (selectedTier !== null) {
      if (selectedTier > character.mapProgress.highestUnlockedTier) {
        setSelectedMapTarget(getPreferredMapSelection(character, selectedMapTarget));
      }

      return;
    }

    if (!getOwnedMapStack(character.mapProgress, selectedMapTarget)) {
      setSelectedMapTarget(getPreferredMapSelection(character, selectedMapTarget, selectedMapId));
    }
  }, [character, selectedMapId, selectedMapTarget, setSelectedMapTarget]);
};
