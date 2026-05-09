import type { ReactNode } from "react";
import { getEquipmentSlotLabel } from "../game/config/itemConfig";
import { ItemSlotIcon } from "./ItemSlotIcon";
import { supportSpellConfig } from "../game/config/spellConfig";
import { getItemPowerScore, getPowerChangeForCharacterItem } from "../game/domain/items/itemPower";
import { getItemStatEntries } from "../game/domain/items/itemStats";
import { getSpellDescription, getSpellName } from "../game/domain/spells/spellDrops";
import type { CharacterRecord, EquipmentSlot } from "../shared/types/saveTypes";
import type { OverlayPanel } from "./appTypes";

interface HubOverlayPanelProps {
  character: CharacterRecord | null;
  overlayPanel: OverlayPanel;
  selectedEquipmentSlot: EquipmentSlot;
  selectedSupportSlot: 0 | 1;
  getSpellAccentClassName: (spellId: string) => string;
  getSupportAccentClassName: (supportSpellId: string) => string;
  formatPowerChange: (powerChange: number | null) => string;
  getSpellDetailLines: (spellId: string, supportSpellIds: string[]) => string[];
  renderSpellUpgradeActions: (spellId: string) => ReactNode;
  onClose: () => void;
  onEquipItem: (itemId: string, selectedEquipmentSlot: EquipmentSlot) => void;
  onSelectMainSpell: (spellId: string) => void;
  onSelectSupportSpell: (supportSpellId: string) => void;
}

export const HubOverlayPanel = ({
  character,
  overlayPanel,
  selectedEquipmentSlot,
  selectedSupportSlot,
  getSpellAccentClassName,
  getSupportAccentClassName,
  formatPowerChange,
  getSpellDetailLines,
  renderSpellUpgradeActions,
  onClose,
  onEquipItem,
  onSelectMainSpell,
  onSelectSupportSpell
}: HubOverlayPanelProps) => {
  if (!character || !overlayPanel) {
    return null;
  }

  if (overlayPanel === "equipmentPicker") {
    const selectedSlotItems = character.inventory
      .filter((item) =>
        selectedEquipmentSlot === "Ring1" || selectedEquipmentSlot === "Ring2"
          ? item.slot === "Ring"
          : item.slot === selectedEquipmentSlot
      )
      .sort((left, right) => getItemPowerScore(right) - getItemPowerScore(left));

    return (
      <div className="mobile-overlay" onClick={onClose}>
        <div className="mobile-panel" onClick={(event) => event.stopPropagation()}>
          <div className="inventory-row">
            <h3>{getEquipmentSlotLabel(selectedEquipmentSlot)}</h3>
            <button className="secondary-button" onClick={onClose}>
              Close
            </button>
          </div>
          {selectedSlotItems.length === 0 ? <p className="status-text">No items for this slot yet.</p> : null}
          {selectedSlotItems.map((item) => (
            <div key={item.id} className={`loot-entry rarity-card rarity-${item.rarity.toLowerCase()}`}>
              <div className="inventory-row">
                <div className="item-name-row">
                  {item.slot ? <ItemSlotIcon slot={item.slot} /> : null}
                  <strong>{item.name}</strong>
                </div>
                <span>Power {getItemPowerScore(item).toFixed(0)}</span>
              </div>
              <div className="status-text">
                {formatPowerChange(character && item.slot ? getPowerChangeForCharacterItem(character, item) : null)}
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
              <button className="primary-button" onClick={() => onEquipItem(item.id, selectedEquipmentSlot)}>
                Equip
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (overlayPanel === "mainSpellPicker") {
    const activeMainSpellId = character.spellLoadout[0]?.mainSpellId ?? "";

    return (
      <div className="mobile-overlay" onClick={onClose}>
        <div className="mobile-panel" onClick={(event) => event.stopPropagation()}>
          <div className="inventory-row">
            <h3>Main Spell</h3>
            <button className="secondary-button" onClick={onClose}>
              Close
            </button>
          </div>
          {(character.unlockedSpellIds ?? []).map((spellId) => (
            <div key={spellId} className="loot-entry">
              <div className="inventory-row">
                <div className="materia-picker-row">
                  <span className={`materia-orb support-materia ${getSpellAccentClassName(spellId)}`} />
                  <div className="stack compact-stack">
                    <strong>{getSpellName(spellId)}</strong>
                    <div className="status-text">{getSpellDescription(spellId)}</div>
                  </div>
                </div>
                <button
                  className="primary-button"
                  onClick={() => {
                    onSelectMainSpell(spellId);
                    onClose();
                  }}
                >
                  {activeMainSpellId === spellId ? "Active" : "Equip"}
                </button>
              </div>
              <div className="fact-grid">
                {getSpellDetailLines(spellId, []).map((line) => (
                  <span key={`${spellId}-picker-${line}`} className="fact-chip">
                    {line}
                  </span>
                ))}
              </div>
              {renderSpellUpgradeActions(spellId)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-overlay" onClick={onClose}>
      <div className="mobile-panel" onClick={(event) => event.stopPropagation()}>
        <div className="inventory-row">
          <h3>Support Slot {selectedSupportSlot + 1}</h3>
          <button className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
        {(character.unlockedSupportSpellIds ?? []).map((supportSpellId) => {
          const supportSpell = supportSpellConfig[supportSpellId];

          if (!supportSpell) {
            return null;
          }

          return (
            <div key={supportSpell.id} className="loot-entry">
              <div className="inventory-row">
                <div className="materia-picker-row">
                  <span className={`materia-orb support-materia ${getSupportAccentClassName(supportSpell.id)}`} />
                  <div className="stack compact-stack">
                    <strong>{supportSpell.name}</strong>
                    <div className="status-text">{supportSpell.tags.join(", ")}</div>
                  </div>
                </div>
                <button className="primary-button" onClick={() => onSelectSupportSpell(supportSpell.id)}>
                  Select
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
