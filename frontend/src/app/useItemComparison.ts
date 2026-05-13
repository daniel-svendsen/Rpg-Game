import { useMemo } from "react";
import { buildItemComparison, type ItemComparison } from "./itemComparison";
import type { CharacterRecord, InventoryItem } from "../shared/types/saveTypes";

export const useItemComparison = (character: CharacterRecord | null) =>
  useMemo(
    () =>
      (candidateItem: InventoryItem, equippedOverride?: InventoryItem | null): ItemComparison | null => {
        if (!character) {
          return null;
        }

        return buildItemComparison(candidateItem, character, equippedOverride);
      },
    [character]
  );
