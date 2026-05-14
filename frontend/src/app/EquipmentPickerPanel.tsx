import { getEquipmentSlotLabel } from "../game/config/itemConfig";
import { OverlayItemCard } from "./OverlayItemCard";
import { OverlayShell } from "./OverlayShell";
import { summarizeComparison } from "./itemComparison";
import type { CharacterRecord, EquipmentSlot } from "../shared/types/saveTypes";

interface EquipmentPickerPanelProps {
  character: CharacterRecord;
  selectedEquipmentSlot: EquipmentSlot;
  onClose: () => void;
  onEquipItem: (itemId: string, selectedEquipmentSlot: EquipmentSlot) => void;
}

export const EquipmentPickerPanel = ({
  character,
  selectedEquipmentSlot,
  onClose,
  onEquipItem
}: EquipmentPickerPanelProps) => {
  const currentlyEquippedItem = character.equippedItems[selectedEquipmentSlot];
  const selectedSlotItems = character.inventory
    .filter((item) =>
      selectedEquipmentSlot === "Ring1" || selectedEquipmentSlot === "Ring2"
        ? item.slot === "Ring"
        : item.slot === selectedEquipmentSlot
    )
    .sort((left, right) => {
      const leftSummary = summarizeComparison(character, left, currentlyEquippedItem ?? null);
      const rightSummary = summarizeComparison(character, right, currentlyEquippedItem ?? null);
      const leftScore = (leftSummary?.damagePercentDelta ?? 0) + (leftSummary?.survivalPercentDelta ?? 0);
      const rightScore = (rightSummary?.damagePercentDelta ?? 0) + (rightSummary?.survivalPercentDelta ?? 0);
      return rightScore - leftScore;
    });

  return (
    <OverlayShell title={getEquipmentSlotLabel(selectedEquipmentSlot)} onClose={onClose}>
      {currentlyEquippedItem ? (
        <>
          <div className="status-text">Currently equipped</div>
          <OverlayItemCard
            character={character}
            item={currentlyEquippedItem}
            badge="This is the item currently in the slot."
            showDeltas={false}
            showSummary={false}
          />
        </>
      ) : (
        <p className="status-text">Nothing is equipped in this slot yet.</p>
      )}
      {selectedSlotItems.length > 0 ? <div className="status-text">Available replacements</div> : null}
      {selectedSlotItems.length === 0 ? <p className="status-text">No items for this slot yet.</p> : null}
      {selectedSlotItems.map((item) => (
        <OverlayItemCard
          key={item.id}
          character={character}
          item={item}
          actionLabel="Equip"
          onAction={() => onEquipItem(item.id, selectedEquipmentSlot)}
          equippedComparisonItem={currentlyEquippedItem ?? null}
          includeMissingComparedStats
        />
      ))}
    </OverlayShell>
  );
};
