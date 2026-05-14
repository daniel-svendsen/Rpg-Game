import { EquipmentPickerPanel } from "./EquipmentPickerPanel";
import { MainSpellPickerPanel } from "./MainSpellPickerPanel";
import { PassiveSupportPickerPanel } from "./PassiveSupportPickerPanel";
import { SupportSpellPickerPanel } from "./SupportSpellPickerPanel";
import type { CharacterRecord, EquipmentSlot } from "../shared/types/saveTypes";
import type { OverlayPanel } from "./appTypes";

interface HubOverlayPanelProps {
  character: CharacterRecord | null;
  overlayPanel: OverlayPanel;
  selectedEquipmentSlot: EquipmentSlot;
  selectedSupportSlot: 0 | 1;
  selectedPassiveSlot: 0 | 1 | 2;
  getSpellDetailLines: (spellId: string, supportSpellIds: string[]) => string[];
  onClose: () => void;
  onEquipItem: (itemId: string, selectedEquipmentSlot: EquipmentSlot) => void;
  onSelectMainSpell: (spellId: string) => void;
  onSelectSupportSpell: (supportSpellId: string) => void;
  onSelectPassiveSupport: (id: string) => void;
  onUpgradeSpell: (spellId: string) => void;
}

export const HubOverlayPanel = ({
  character,
  overlayPanel,
  selectedEquipmentSlot,
  selectedSupportSlot,
  selectedPassiveSlot,
  getSpellDetailLines,
  onClose,
  onEquipItem,
  onSelectMainSpell,
  onSelectSupportSpell,
  onSelectPassiveSupport,
  onUpgradeSpell
}: HubOverlayPanelProps) => {
  if (!character || !overlayPanel) {
    return null;
  }

  if (overlayPanel === "equipmentPicker") {
    return (
      <EquipmentPickerPanel
        character={character}
        selectedEquipmentSlot={selectedEquipmentSlot}
        onClose={onClose}
        onEquipItem={onEquipItem}
      />
    );
  }

  if (overlayPanel === "mainSpellPicker") {
    return (
      <MainSpellPickerPanel
        character={character}
        getSpellDetailLines={getSpellDetailLines}
        onClose={onClose}
        onSelectMainSpell={onSelectMainSpell}
        onUpgradeSpell={onUpgradeSpell}
      />
    );
  }

  if (overlayPanel === "passiveSupportPicker") {
    return (
      <PassiveSupportPickerPanel
        character={character}
        selectedPassiveSlot={selectedPassiveSlot}
        onClose={onClose}
        onSelectPassiveSupport={onSelectPassiveSupport}
      />
    );
  }

  return (
    <SupportSpellPickerPanel
      character={character}
      selectedSupportSlot={selectedSupportSlot}
      onClose={onClose}
      onSelectSupportSpell={onSelectSupportSpell}
    />
  );
};
