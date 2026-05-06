import type { ReactNode } from "react";
import { getItemPowerScore, isUpgradeForCharacter } from "../game/domain/items/itemPower";
import { getItemStatLines } from "../game/domain/items/itemStats";
import { getItemSlotLabel } from "../game/config/itemConfig";
import type { CharacterRecord, EquipmentSlot } from "../shared/types/saveTypes";
import { LootPanel } from "./LootPanel";

interface InventoryTabProps {
  topBar: ReactNode;
  character: CharacterRecord | null;
  recentLoot: Parameters<typeof LootPanel>[0]["recentLoot"];
  getItemSellPrice: (item: CharacterRecord["inventory"][number]) => number;
  onSellItem: (itemId: string) => void;
  onEquipItem: (itemId: string, targetSlotOverride?: EquipmentSlot) => void;
  onSelectEquipmentSlot: (slot: EquipmentSlot) => void;
}

export const InventoryTab = ({
  topBar,
  character,
  recentLoot,
  getItemSellPrice,
  onSellItem,
  onEquipItem,
  onSelectEquipmentSlot
}: InventoryTabProps) => (
  <div className="content stack mobile-content">
    {topBar}
    <section className="panel stack">
      <div className="inventory-row">
        <h4>Inventory</h4>
      </div>
      {(character?.inventory ?? []).map((item) => (
        <div key={item.id} className={`loot-entry rarity-card rarity-${item.rarity.toLowerCase()}`}>
          <div className="inventory-row">
            <strong>{item.name}</strong>
            <span>{item.slot ? getItemSlotLabel(item.slot) : "Stored"}</span>
          </div>
          <div className="inventory-row">
            <div className="status-text">Power {getItemPowerScore(item).toFixed(0)}</div>
            <div className="status-text">Sell price {getItemSellPrice(item)} gold</div>
          </div>
          {getItemStatLines(item).map((line) => (
            <div key={`${item.id}-${line}`} className="status-text">
              {line}
            </div>
          ))}
          <div className="actions">
            {item.slot ? (
              <button
                className="secondary-button"
                onClick={() => {
                  if (!character) {
                    return;
                  }

                  if (item.slot === "Ring") {
                    onEquipItem(
                      item.id,
                      character.equippedItems.Ring1 && !character.equippedItems.Ring2 ? "Ring2" : "Ring1"
                    );
                    return;
                  }

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
          {character && isUpgradeForCharacter(character, item) ? (
            <div className="upgrade-text">Possible upgrade</div>
          ) : null}
        </div>
      ))}
    </section>
    <LootPanel recentLoot={recentLoot} />
  </div>
);
