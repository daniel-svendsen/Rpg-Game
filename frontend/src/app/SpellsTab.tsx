import type { ReactNode } from "react";
import { getSpellDescription, getSpellName } from "../game/domain/spells/spellDrops";
import { supportSpellConfig } from "../game/config/spellConfig";
import type { CharacterRecord } from "../shared/types/saveTypes";

interface SpellsTabProps {
  topBar: ReactNode;
  character: CharacterRecord | null;
  getSpellAccentClassName: (spellId: string) => string;
  getSupportAccentClassName: (supportSpellId: string) => string;
  getSpellDetailLines: (spellId: string, supportSpellIds: string[]) => string[];
  renderSpellUpgradeActions: (spellId: string) => ReactNode;
  onSelectMainSpell: (spellId: string) => void;
  onOpenMainSpellPicker: () => void;
  onOpenSupportPicker: (slotIndex: 0 | 1) => void;
}

export const SpellsTab = ({
  topBar,
  character,
  getSpellAccentClassName,
  getSupportAccentClassName,
  getSpellDetailLines,
  renderSpellUpgradeActions,
  onSelectMainSpell,
  onOpenMainSpellPicker,
  onOpenSupportPicker
}: SpellsTabProps) => {
  const activeMainSpellId = character?.spellLoadout[0]?.mainSpellId ?? "";
  const supportSlots = character?.spellLoadout[0]?.supportSpellIds ?? [];

  return (
    <div className="content stack mobile-content">
      {topBar}
      <section className="panel stack">
        <h4>Linked Spell</h4>
        <div className="materia-strip">
          <button
            className={`materia-orb main-materia ${getSpellAccentClassName(activeMainSpellId)}`}
            onClick={onOpenMainSpellPicker}
            type="button"
          >
            <span className="sr-only">{getSpellName(activeMainSpellId)}</span>
          </button>
          <div className="materia-link" />
          {[0, 1].map((slotIndex) => {
            const supportId = supportSlots[slotIndex];

            return (
              <button
                key={slotIndex}
                className={`materia-orb support-materia ${
                  supportId ? getSupportAccentClassName(supportId) : "empty-materia"
                }`}
                onClick={() => onOpenSupportPicker(slotIndex as 0 | 1)}
                type="button"
              >
                <span className="sr-only">
                  {supportId ? supportSpellConfig[supportId]?.name ?? supportId : `Empty support slot ${slotIndex + 1}`}
                </span>
              </button>
            );
          })}
        </div>
        <div className="materia-caption">
          <strong>{getSpellName(activeMainSpellId)}</strong>
          <span className="status-text">
            {(supportSlots.filter(Boolean) as string[]).length > 0
              ? (supportSlots.filter(Boolean) as string[])
                  .map((id) => supportSpellConfig[id]?.name ?? id)
                  .join(" | ")
              : "Tap a slot to link supports"}
          </span>
        </div>
      </section>
      <section className="panel stack">
        <h4>Main Spell</h4>
        {(character?.unlockedSpellIds ?? []).map((spellId) => (
          <div key={spellId} className="loot-entry">
            <div className="inventory-row">
              <span>{getSpellName(spellId)}</span>
              <button className="secondary-button" onClick={() => onSelectMainSpell(spellId)}>
                {activeMainSpellId === spellId ? "Active" : "Equip"}
              </button>
            </div>
            <div className="status-text">{getSpellDescription(spellId)}</div>
            <div className="fact-grid">
              {getSpellDetailLines(
                spellId,
                activeMainSpellId === spellId ? (supportSlots.filter(Boolean) as string[]) : []
              ).map((line) => (
                <span key={`${spellId}-${line}`} className="fact-chip">
                  {line}
                </span>
              ))}
            </div>
            {renderSpellUpgradeActions(spellId)}
          </div>
        ))}
      </section>
      <section className="panel stack">
        <h4>Supports</h4>
        {[0, 1].map((slotIndex) => (
          <div key={slotIndex} className="inventory-row">
            <span>Support slot {slotIndex + 1}</span>
            <button className="secondary-button" onClick={() => onOpenSupportPicker(slotIndex as 0 | 1)}>
              {supportSlots[slotIndex]
                ? supportSpellConfig[supportSlots[slotIndex]]?.name ?? supportSlots[slotIndex]
                : "Choose"}
            </button>
          </div>
        ))}
        <p className="status-text">Tap a support slot to open the materia-style picker.</p>
      </section>
    </div>
  );
};
