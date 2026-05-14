import { EquipmentPickerPanel } from "./EquipmentPickerPanel";
import { MainSpellPickerPanel } from "./MainSpellPickerPanel";
import { SupportSpellPickerPanel } from "./SupportSpellPickerPanel";
import type { CharacterRecord, EquipmentSlot } from "../shared/types/saveTypes";
import type { OverlayPanel } from "./appTypes";

interface HubOverlayPanelProps {
  character: CharacterRecord | null;
  overlayPanel: OverlayPanel;
  selectedEquipmentSlot: EquipmentSlot;
  selectedSupportSlot: 0 | 1;
  getSpellDetailLines: (spellId: string, supportSpellIds: string[]) => string[];
  onClose: () => void;
  onEquipItem: (itemId: string, selectedEquipmentSlot: EquipmentSlot) => void;
  onSelectMainSpell: (spellId: string) => void;
  onSelectSupportSpell: (supportSpellId: string) => void;
  onUpgradeSpell: (spellId: string) => void;
}

export const HubOverlayPanel = ({
  character,
  overlayPanel,
  selectedEquipmentSlot,
  selectedSupportSlot,
  getSpellDetailLines,
  onClose,
  onEquipItem,
  onSelectMainSpell,
  onSelectSupportSpell,
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

  return (
    <SupportSpellPickerPanel
      character={character}
      selectedSupportSlot={selectedSupportSlot}
      onClose={onClose}
      onSelectSupportSpell={onSelectSupportSpell}
    />
  );
};
