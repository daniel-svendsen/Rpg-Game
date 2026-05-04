import type { ReactNode } from "react";
import { getEquipmentSlotLabel } from "../game/config/itemConfig";
import type { CharacterRecord, EquipmentSlot } from "../shared/types/saveTypes";

interface EquipmentTabProps {
  topBar: ReactNode;
  character: CharacterRecord | null;
  equipmentSlots: EquipmentSlot[];
  onSelectEquipmentSlot: (slot: EquipmentSlot) => void;
  onOpenEquipmentPicker: () => void;
}

export const EquipmentTab = ({
  topBar,
  character,
  equipmentSlots,
  onSelectEquipmentSlot,
  onOpenEquipmentPicker
}: EquipmentTabProps) => (
  <div className="content stack mobile-content">
    {topBar}
    <section className="panel stack">
      <h4>Equipment</h4>
      {equipmentSlots.map((slot) => (
        <div key={slot} className="inventory-row">
          <span>{getEquipmentSlotLabel(slot)}</span>
          <button
            className="secondary-button"
            onClick={() => {
              onSelectEquipmentSlot(slot);
              onOpenEquipmentPicker();
            }}
          >
            {character?.equippedItems[slot]?.name ?? "Choose"}
          </button>
        </div>
      ))}
    </section>
  </div>
);
