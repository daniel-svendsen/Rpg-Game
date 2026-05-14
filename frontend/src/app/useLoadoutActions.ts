import type { Dispatch, SetStateAction } from "react";
import { supportSpellConfig } from "../game/config/spellConfig";
import { equipItem } from "../game/domain/player/equipment";
import { getSpellName } from "../game/domain/spells/spellDrops";
import { getSpellLevel, upgradeSpell } from "../game/domain/spells/spellProgression";
import type { CharacterRecord, EquipmentSlot } from "../shared/types/saveTypes";
import type { OverlayPanel } from "./appTypes";

interface UseLoadoutActionsParams {
  character: CharacterRecord | null;
  selectedSupportSlot: 0 | 1;
  commitCharacter: (nextCharacter: CharacterRecord | null) => void;
  setOverlayPanel: Dispatch<SetStateAction<OverlayPanel>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
}

export const useLoadoutActions = ({
  character,
  selectedSupportSlot,
  commitCharacter,
  setOverlayPanel,
  setStatusMessage,
  setErrorMessage
}: UseLoadoutActionsParams) => {
  const handleEquipItem = (itemId: string, targetSlotOverride?: EquipmentSlot): void => {
    if (!character) {
      return;
    }

    commitCharacter(equipItem(character, itemId, targetSlotOverride));
    setOverlayPanel(null);
    setStatusMessage("Equipment updated.");
  };

  const handleSelectMainSpell = (spellId: string): void => {
    if (!character) {
      return;
    }

    const currentLoadout = character.spellLoadout[0];
    commitCharacter({
      ...character,
      spellLoadout: [
        {
          ...currentLoadout,
          mainSpellId: spellId
        }
      ]
    });
    setStatusMessage(`${getSpellName(spellId)} is now your active spell.`);
  };

  const handleSelectSupportSpell = (supportSpellId: string): void => {
    if (!character) {
      return;
    }
    if (!character.unlockedSupportSpellIds.includes(supportSpellId)) {
      setErrorMessage("Support not unlocked yet.");
      return;
    }

    const currentLoadout = character.spellLoadout[0];
    const nextSupportSpellIds = [...currentLoadout.supportSpellIds];
    const duplicateIndex = nextSupportSpellIds.findIndex(
      (id, index) => id === supportSpellId && index !== selectedSupportSlot
    );

    if (duplicateIndex >= 0) {
      nextSupportSpellIds.splice(duplicateIndex, 1);
    }

    if (nextSupportSpellIds[selectedSupportSlot] === supportSpellId) {
      nextSupportSpellIds.splice(selectedSupportSlot, 1);
    } else {
      nextSupportSpellIds[selectedSupportSlot] = supportSpellId;
    }

    commitCharacter({
      ...character,
      spellLoadout: [
        {
          ...currentLoadout,
          supportSpellIds: nextSupportSpellIds
        }
      ]
    });
    setOverlayPanel(null);
    setStatusMessage(
      `${supportSpellConfig[supportSpellId]?.name ?? supportSpellId} updated in support slot ${selectedSupportSlot + 1}.`
    );
  };

  const handleUpgradeSpell = (spellId: string): void => {
    if (!character) {
      return;
    }

    const nextCharacter = upgradeSpell(character, spellId);

    if (nextCharacter === character) {
      setErrorMessage("You do not meet the upgrade requirements for that spell.");
      return;
    }

    commitCharacter(nextCharacter);
    setStatusMessage(`${getSpellName(spellId)} upgraded to level ${getSpellLevel(nextCharacter, spellId)}.`);
    setErrorMessage(null);
  };

  return {
    handleEquipItem,
    handleSelectMainSpell,
    handleSelectSupportSpell,
    handleUpgradeSpell
  };
};
