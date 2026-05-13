import type { ReactNode } from "react";
import { getItemSlotLabel } from "../game/config/itemConfig";
import { ItemSlotIcon } from "./ItemSlotIcon";
import { ItemStatBlock } from "./ItemStatBlock";
import { useItemComparison } from "./useItemComparison";
import { summarizeComparison } from "./itemComparison";
import { toChipModel } from "./comparisonChipUi";
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
}: InventoryTabProps) => {
  const getComparison = useItemComparison(character);

  return (
    <div className="content stack mobile-content">
    {topBar}
    <section className="panel stack">
      <div className="inventory-row">
        <h4>Inventory</h4>
      </div>
      {(character?.inventory ?? []).map((item) => (
        (() => {
          const summary = summarizeComparison(character, item);
          const chipModel = toChipModel(summary);
          return (
        <div key={item.id} className={`loot-entry rarity-card rarity-${item.rarity.toLowerCase()}`}>
          <div className="inventory-row">
            <div className="item-name-row">
              {item.slot ? <ItemSlotIcon slot={item.slot} /> : null}
              <strong>{item.name}</strong>
            </div>
            <span>{item.slot ? getItemSlotLabel(item.slot) : "Stored"}</span>
          </div>
          <div className="status-text">Sell price {getItemSellPrice(item)} gold</div>
          {chipModel ? (
            <div className="delta-chip-row">
              <span className={`delta-chip ${chipModel.damageClass}`}>
                Damage {chipModel.damageText}
              </span>
              <span className={`delta-chip ${chipModel.survivalClass}`}>
                Survival {chipModel.survivalText}
              </span>
            </div>
          ) : null}
          <ItemStatBlock item={item} comparison={getComparison(item)} />
          {item.uniqueEffectDescription ? (
            <div className="unique-effect-line">{item.uniqueEffectDescription}</div>
          ) : null}
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
          {summary && (summary.damagePercentDelta > 0 || summary.survivalPercentDelta > 0) ? (
            <div className="upgrade-text">Possible upgrade</div>
          ) : null}
        </div>
          );
        })()
      ))}
    </section>
    <LootPanel recentLoot={recentLoot} />
    </div>
  );
};
