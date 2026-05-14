import { useMemo, useState, type ReactNode } from "react";
import { getEquipmentSlotLabel, getItemSlotLabel } from "../game/config/itemConfig";
import { ItemSlotIcon } from "./ItemSlotIcon";
import type { CharacterRecord, EquipmentSlot, InventoryItem } from "../shared/types/saveTypes";
import { ItemStatBlock } from "./ItemStatBlock";
import { useItemComparison } from "./useItemComparison";
import { summarizeComparison } from "./itemComparison";
import { toChipModel } from "./comparisonChipUi";
import { equippedRarityClassName, rarityCardClassName } from "./appUiHelpers";

// ── Weapon sprite mapping ─────────────────────────────────────────────────────

const WEAPON_SPRITE_BASE = "/assets/0x72_DungeonTilesetII_v1.7/frames";

const getWeaponSprite = (itemName: string): string => {
  const n = itemName.toLowerCase();
  if (n.includes("wand") || n.includes("staff") || n.includes("rod") || n.includes("orb") || n.includes("scepter")) {
    return n.includes("red") || n.includes("fire") || n.includes("ruby")
      ? `${WEAPON_SPRITE_BASE}/weapon_red_magic_staff.png`
      : `${WEAPON_SPRITE_BASE}/weapon_green_magic_staff.png`;
  }
  if (n.includes("axe")) return `${WEAPON_SPRITE_BASE}/weapon_axe.png`;
  if (n.includes("hammer") || n.includes("mace") || n.includes("baton")) return `${WEAPON_SPRITE_BASE}/weapon_hammer.png`;
  if (n.includes("spear") || n.includes("lance")) return `${WEAPON_SPRITE_BASE}/weapon_spear.png`;
  if (n.includes("dagger") || n.includes("knife")) return `${WEAPON_SPRITE_BASE}/weapon_knife.png`;
  if (n.includes("katana")) return `${WEAPON_SPRITE_BASE}/weapon_katana.png`;
  if (n.includes("rusty")) return `${WEAPON_SPRITE_BASE}/weapon_rusty_sword.png`;
  return `${WEAPON_SPRITE_BASE}/weapon_regular_sword.png`;
};

// ── Equipment doll layout ─────────────────────────────────────────────────────
// 3 columns. null = empty placeholder cell.

const DOLL_ROWS: (EquipmentSlot | null)[][] = [
  [null,     "Helmet",    null   ],
  ["Amulet", "BodyArmor", "Weapon"],
  ["Ring1",  "Belt",      "Ring2"],
  ["Gloves", null,        "Boots"],
];

interface SlotCellProps {
  slot: EquipmentSlot;
  equippedItem: InventoryItem | undefined;
  onClick: () => void;
}

const SlotCell = ({ slot, equippedItem, onClick }: SlotCellProps) => {
  const rarity = equippedItem?.rarity.toLowerCase() ?? null;
  const rarityClass = rarity ? ` doll-slot--${rarity}` : "";

  return (
    <button
      className={`doll-slot${equippedItem ? " doll-slot--filled" : ""}${rarityClass}`}
      onClick={onClick}
      title={equippedItem?.name ?? getEquipmentSlotLabel(slot)}
      type="button"
    >
      <div className="doll-slot-icon">
        {slot === "Weapon" && equippedItem ? (
          <img
            src={getWeaponSprite(equippedItem.name)}
            alt={equippedItem.name}
            className="doll-weapon-sprite"
          />
        ) : (
          <ItemSlotIcon slot={slot} size={28} />
        )}
      </div>
      <div className="doll-slot-label">{getEquipmentSlotLabel(slot)}</div>
      {equippedItem ? (
        <div className="doll-slot-name">{equippedItem.name}</div>
      ) : (
        <div className="doll-slot-empty">Empty</div>
      )}
    </button>
  );
};

// ── GearTab ───────────────────────────────────────────────────────────────────

interface GearTabProps {
  topBar: ReactNode;
  character: CharacterRecord | null;
  equipmentSlots: EquipmentSlot[];
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
  getItemSellPrice,
  onSellItem,
  onEquipItem,
  onSelectEquipmentSlot,
  onOpenEquipmentPicker
}: GearTabProps) => {
  const getComparison = useItemComparison(character);
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string | null>(null);
  const getComparisonScore = (item: InventoryItem): number => {
    const summary = summarizeComparison(character, item);
    if (!summary) {
      return 0;
    }
    return summary.damagePercentDelta + summary.survivalPercentDelta;
  };
  const sortedInventory = [...(character?.inventory ?? [])].sort((left, right) => {
    const scoreDelta = getComparisonScore(right) - getComparisonScore(left);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    const rarityRank = { Unique: 3, Rare: 2, Magic: 1, Normal: 0 } as const;
    const rarityDelta = rarityRank[right.rarity] - rarityRank[left.rarity];
    if (rarityDelta !== 0) {
      return rarityDelta;
    }

    return left.name.localeCompare(right.name);
  });
  const selectedInventoryItem = useMemo(
    () => sortedInventory.find((item) => item.id === selectedInventoryItemId) ?? null,
    [selectedInventoryItemId, sortedInventory]
  );
  const selectedComparison = selectedInventoryItem ? getComparison(selectedInventoryItem) : null;

  return (
    <div className="content stack mobile-content">
      {topBar}
      <section className="panel stack">
        <h4>Equipment</h4>
        <div className="equipment-doll">
          {DOLL_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="doll-row">
              {row.map((slot, colIdx) =>
                slot === null ? (
                  <div key={colIdx} className="doll-slot doll-slot--placeholder" />
                ) : (
                  <SlotCell
                    key={slot}
                    slot={slot}
                    equippedItem={character?.equippedItems[slot]}
                    onClick={() => {
                      onSelectEquipmentSlot(slot);
                      onOpenEquipmentPicker();
                    }}
                  />
                )
              )}
            </div>
          ))}
        </div>
        {equipmentSlots
          .filter((s) => !DOLL_ROWS.flat().includes(s))
          .map((slot) => {
            const equippedItem = character?.equippedItems[slot];
            const rarityClass = equippedItem ? ` ${equippedRarityClassName(equippedItem.rarity)}` : "";
            return (
              <div key={slot} className="inventory-row">
                <span className="slot-label">{getEquipmentSlotLabel(slot)}</span>
                <button
                  className={`secondary-button${rarityClass}`}
                  onClick={() => {
                    onSelectEquipmentSlot(slot);
                    onOpenEquipmentPicker();
                  }}
                >
                  {equippedItem?.name ?? "Empty"}
                </button>
              </div>
            );
          })}
        {selectedInventoryItem && selectedComparison?.equippedItem ? (
          <div className="panel stack compare-overlay-panel">
            <div className="inventory-row">
              <strong>Compare Overlay</strong>
              <span className="status-text">{selectedInventoryItem.name}</span>
            </div>
            <div className="status-text">Against equipped: {selectedComparison.equippedItem.name}</div>
            <ItemStatBlock item={selectedComparison.equippedItem} comparison={selectedComparison} />
          </div>
        ) : null}
      </section>
      <section className="panel stack">
        <div className="inventory-row">
          <h4>Inventory</h4>
        </div>
        {sortedInventory.length === 0 ? (
          <p className="status-text">Your inventory is empty. Run a map to collect loot.</p>
        ) : null}
        {sortedInventory.map((item) => {
          const summary = summarizeComparison(character, item);
          const chipModel = toChipModel(summary);
          return (
        <div
          key={item.id}
          className={`loot-entry ${rarityCardClassName(item.rarity)}${selectedInventoryItemId === item.id ? " selected-comparison-item" : ""}`}
          onClick={() => setSelectedInventoryItemId(item.id)}
        >
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
                    const targetSlot =
                      character.equippedItems.Ring1 && !character.equippedItems.Ring2 ? "Ring2" : "Ring1";
                    onSelectEquipmentSlot(targetSlot);
                    onEquipItem(item.id, targetSlot);
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
        </div>
          );
        })}
      </section>
    </div>
  );
};
