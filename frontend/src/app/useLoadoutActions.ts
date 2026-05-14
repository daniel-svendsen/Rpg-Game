import type { Dispatch, SetStateAction } from "react";
import { supportSpellConfig } from "../game/config/spellConfig";
import { equipItem } from "../game/domain/player/equipment";
import { getSpellName } from "../game/domain/spells/spellDrops";
import { getSpellLevel, upgradeSpell } from "../game/domain/spells/spellProgression";
import { getSupportLevel, upgradeSupport } from "../game/domain/spells/supportProgression";
import type { CharacterRecord, EquipmentSlot } from "../shared/types/saveTypes";
import type { OverlayPanel } from "./appTypes";

interface UseLoadoutActionsParams {
  character: CharacterRecord | null;
  selectedSupportSlot: 0 | 1;
  selectedPassiveSlot: 0 | 1 | 2;
  commitCharacter: (nextCharacter: CharacterRecord | null) => void;
  setOverlayPanel: Dispatch<SetStateAction<OverlayPanel>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
}

export const useLoadoutActions = ({
  character,
  selectedSupportSlot,
  selectedPassiveSlot,
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
    if (supportSpellConfig[supportSpellId]?.passiveOnly) {
      setErrorMessage("Passive auras cannot be linked to active spells.");
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

  const handleSelectPassiveSupport = (supportSpellId: string): void => {
    if (!character) return;
    if (!character.unlockedSupportSpellIds.includes(supportSpellId)) {
      setErrorMessage("Support not unlocked yet.");
      return;
    }
    if (!supportSpellConfig[supportSpellId]?.passiveOnly) {
      setErrorMessage("Only passive auras can be equipped in passive slots.");
      return;
    }
    const currentPassive = [...(character.passiveSupportIds ?? [])];
    if (currentPassive[selectedPassiveSlot] === supportSpellId) {
      currentPassive.splice(selectedPassiveSlot, 1);
    } else {
      currentPassive[selectedPassiveSlot] = supportSpellId;
    }
    commitCharacter({
      ...character,
      passiveSupportIds: currentPassive.slice(0, 3)
    });
    setOverlayPanel(null);
    setStatusMessage(`${supportSpellConfig[supportSpellId]?.name ?? supportSpellId} equipped in passive slot ${selectedPassiveSlot + 1}.`);
  };

  const handleUpgradeSupport = (supportSpellId: string): void => {
    if (!character) {
      return;
    }

    const nextCharacter = upgradeSupport(character, supportSpellId);

    if (nextCharacter === character) {
      setErrorMessage("You need a Gemcutter's Prism to upgrade that support.");
      return;
    }

    commitCharacter(nextCharacter);
    setStatusMessage(
      `${supportSpellConfig[supportSpellId]?.name ?? supportSpellId} upgraded to level ${getSupportLevel(nextCharacter, supportSpellId)}.`
    );
    setErrorMessage(null);
  };

  return {
    handleEquipItem,
    handleSelectMainSpell,
    handleSelectSupportSpell,
    handleSelectPassiveSupport,
    handleUpgradeSpell,
    handleUpgradeSupport
  };
};
