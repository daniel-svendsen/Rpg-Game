import type { ReactNode } from "react";
import { getEquipmentSlotLabel } from "../game/config/itemConfig";
import { ItemSlotIcon } from "./ItemSlotIcon";
import { supportSpellConfig } from "../game/config/spellConfig";
import { getSpellDescription, getSpellName } from "../game/domain/spells/spellDrops";
import type { CharacterRecord, EquipmentSlot } from "../shared/types/saveTypes";
import type { OverlayPanel } from "./appTypes";
import { ItemStatBlock } from "./ItemStatBlock";
import { useItemComparison } from "./useItemComparison";
import { summarizeComparison } from "./itemComparison";
import { toChipModel } from "./comparisonChipUi";

interface HubOverlayPanelProps {
  character: CharacterRecord | null;
  overlayPanel: OverlayPanel;
  selectedEquipmentSlot: EquipmentSlot;
  selectedSupportSlot: 0 | 1;
  getSpellAccentClassName: (spellId: string) => string;
  getSupportAccentClassName: (supportSpellId: string) => string;
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
  getSpellDetailLines,
  renderSpellUpgradeActions,
  onClose,
  onEquipItem,
  onSelectMainSpell,
  onSelectSupportSpell
}: HubOverlayPanelProps) => {
  const getComparison = useItemComparison(character);

  if (!character || !overlayPanel) {
    return null;
  }

  const renderItemCard = (
    item: CharacterRecord["inventory"][number],
    options?: {
      actionLabel?: string;
      onAction?: () => void;
      badge?: string;
      equippedComparisonItem?: CharacterRecord["inventory"][number] | null;
      showDeltas?: boolean;
      includeMissingComparedStats?: boolean;
      showSummary?: boolean;
    }
  ) => (
    (() => {
      const comparison = getComparison(item, options?.equippedComparisonItem);
      const summary = summarizeComparison(character, item, options?.equippedComparisonItem);
      const chipModel = toChipModel(summary);
      return (
    <div key={item.id} className={`loot-entry rarity-card rarity-${item.rarity.toLowerCase()}`}>
      <div className="inventory-row">
        <div className="item-name-row">
          {item.slot ? <ItemSlotIcon slot={item.slot} /> : null}
          <strong>{item.name}</strong>
        </div>
      </div>
      {options?.badge ? <div className="status-text">{options.badge}</div> : null}
      {(options?.showSummary ?? true) && chipModel ? (
        <div className="delta-chip-row">
          <span className={`delta-chip ${chipModel.damageClass}`}>
            Damage {chipModel.damageText}
          </span>
          <span className={`delta-chip ${chipModel.survivalClass}`}>
            Survival {chipModel.survivalText}
          </span>
        </div>
      ) : null}
      <ItemStatBlock
        item={item}
        comparison={comparison}
        showDeltas={options?.showDeltas ?? true}
        includeMissingComparedStats={options?.includeMissingComparedStats ?? false}
      />
      {item.uniqueEffectDescription ? (
        <div className="unique-effect-line">{item.uniqueEffectDescription}</div>
      ) : null}
      {options?.actionLabel && options.onAction ? (
        <button className="primary-button" onClick={options.onAction}>
          {options.actionLabel}
        </button>
      ) : null}
    </div>
      );
    })()
  );

  if (overlayPanel === "equipmentPicker") {
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
      <div className="mobile-overlay" onClick={onClose}>
        <div className="mobile-panel" onClick={(event) => event.stopPropagation()}>
          <div className="inventory-row">
            <h3>{getEquipmentSlotLabel(selectedEquipmentSlot)}</h3>
            <button className="secondary-button" onClick={onClose}>
              Close
            </button>
          </div>
          {currentlyEquippedItem ? (
            <>
              <div className="status-text">Currently equipped</div>
              {renderItemCard(currentlyEquippedItem, {
                badge: "This is the item currently in the slot.",
                showDeltas: false,
                showSummary: false
              })}
            </>
          ) : (
            <p className="status-text">Nothing is equipped in this slot yet.</p>
          )}
          {selectedSlotItems.length > 0 ? <div className="status-text">Available replacements</div> : null}
          {selectedSlotItems.length === 0 ? <p className="status-text">No items for this slot yet.</p> : null}
          {selectedSlotItems.map((item) =>
            renderItemCard(item, {
              actionLabel: "Equip",
              onAction: () => onEquipItem(item.id, selectedEquipmentSlot),
              equippedComparisonItem: currentlyEquippedItem ?? null,
              includeMissingComparedStats: true
            })
          )}
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
