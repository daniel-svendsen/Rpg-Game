import type { ReactNode } from "react";
import { getEquipmentSlotLabel, getItemSlotLabel } from "../game/config/itemConfig";
import { ItemSlotIcon } from "./ItemSlotIcon";
import { getItemPowerScore, getPowerChangeForCharacterItem } from "../game/domain/items/itemPower";
import { getItemStatEntries } from "../game/domain/items/itemStats";
import type { CharacterRecord, EquipmentSlot } from "../shared/types/saveTypes";
import { LootPanel } from "./LootPanel";

interface GearTabProps {
  topBar: ReactNode;
  character: CharacterRecord | null;
  equipmentSlots: EquipmentSlot[];
  recentLoot: Parameters<typeof LootPanel>[0]["recentLoot"];
  getItemSellPrice: (item: CharacterRecord["inventory"][number]) => number;
  onSellItem: (itemId: string) => void;
  onEquipItem: (itemId: string, targetSlotOverride?: EquipmentSlot) => void;
  onSelectEquipmentSlot: (slot: EquipmentSlot) => void;
  onOpenEquipmentPicker: () => void;
}

export const GearTab = ({
  topBar,
  character,
  equipmentSlots,
  recentLoot,
  getItemSellPrice,
  onSellItem,
  onEquipItem,
  onSelectEquipmentSlot,
  onOpenEquipmentPicker
}: GearTabProps) => (
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
            {character?.equippedItems[slot]?.name ?? "Empty"}
          </button>
        </div>
      ))}
    </section>
    <section className="panel stack">
      <div className="inventory-row">
        <h4>Inventory</h4>
      </div>
      {(character?.inventory ?? []).map((item) => (
        <div key={item.id} className={`loot-entry rarity-card rarity-${item.rarity.toLowerCase()}`}>
          <div className="inventory-row">
            <div className="item-name-row">
              {item.slot ? <ItemSlotIcon slot={item.slot} /> : null}
              <strong>{item.name}</strong>
            </div>
            <span>{item.slot ? getItemSlotLabel(item.slot) : "Stored"}</span>
          </div>
          <div className="inventory-row">
            <div className="status-text">Power {getItemPowerScore(item).toFixed(0)}</div>
            <div className="status-text">Sell price {getItemSellPrice(item)} gold</div>
          </div>
          {getItemStatEntries(item).filter((e) => e.isBase).map((entry) => (
            <div key={`${item.id}-${entry.label}`} className="stat-line">
              <span className="stat-label">{entry.label}</span>
              <span className="stat-value">{entry.formattedValue}</span>
            </div>
          ))}
          <div className="item-divider" />
          {getItemStatEntries(item).filter((e) => !e.isBase).map((entry) => (
            <div
              key={`${item.id}-${entry.label}`}
              className={`stat-line${entry.tier !== null ? ` stat-tier-${entry.tier}` : ""}`}
            >
              {entry.tier !== null && <span className="stat-tier-dot" />}
              <span className="stat-label">{entry.label}</span>
              <span className="stat-value">{entry.formattedValue}</span>
            </div>
          ))}
          <div className="actions">
            {item.slot ? (
              <button
                className="secondary-button"
                onClick={() => {
                  onSelectEquipmentSlot(item.slot as EquipmentSlot);
                  onEquipItem(item.id, item.slot as EquipmentSlot);
                }}
              >
                Equip
              </button>
            ) : null}
            <button className="secondary-button" onClick={() => onSellItem(item.id)}>
              Sell for {getItemSellPrice(item)} gold
            </button>
          </div>
          {(() => {
            const pc = character ? getPowerChangeForCharacterItem(character, item) : null;
            return pc !== null && pc > 0 ? <div className="upgrade-text">Possible upgrade</div> : null;
          })()}
        </div>
      ))}
    </section>
    <LootPanel recentLoot={recentLoot} />
  </div>
);
