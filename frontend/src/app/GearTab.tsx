import type { ReactNode } from "react";
import { getEquipmentSlotLabel, getItemSlotLabel } from "../game/config/itemConfig";
import { ItemSlotIcon } from "./ItemSlotIcon";
import { getItemPowerScore, getPowerChangeForCharacterItem } from "../game/domain/items/itemPower";
import { getItemStatEntries } from "../game/domain/items/itemStats";
import type { CharacterRecord, EquipmentSlot, InventoryItem } from "../shared/types/saveTypes";
import { LootPanel } from "./LootPanel";

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
      {/* Fallback list for any slots not in the doll layout */}
      {equipmentSlots
        .filter((s) => !DOLL_ROWS.flat().includes(s))
        .map((slot) => {
          const equippedItem = character?.equippedItems[slot];
          const rarityClass = equippedItem ? ` equipped-rarity-${equippedItem.rarity.toLowerCase()}` : "";
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
