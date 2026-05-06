import { Fragment, type ReactNode } from "react";
import { getSpellName } from "../game/domain/spells/spellDrops";
import { supportSpellConfig } from "../game/config/spellConfig";
import type { CharacterRecord } from "../shared/types/saveTypes";

interface SpellsTabProps {
  topBar: ReactNode;
  character: CharacterRecord | null;
  getSpellAccentClassName: (spellId: string) => string;
  getSupportAccentClassName: (supportSpellId: string) => string;
  getSpellDetailLines: (spellId: string, supportSpellIds: string[]) => string[];
  renderSpellUpgradeActions: (spellId: string) => ReactNode;
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
  onOpenMainSpellPicker,
  onOpenSupportPicker
}: SpellsTabProps) => {
  const activeMainSpellId = character?.spellLoadout[0]?.mainSpellId ?? "";
  const supportSlots = character?.spellLoadout[0]?.supportSpellIds ?? [];
  const activeSupportSpellIds = supportSlots.filter(Boolean) as string[];
  const supportSlotLabels = ["Supp 1", "Supp 2"] as const;

  return (
    <div className="content stack mobile-content">
      {topBar}
      <section className="panel stack">
        <h4>Linked Spell</h4>
        <div className="materia-strip">
          <div className="materia-node">
            <button
              className={`materia-orb main-materia ${getSpellAccentClassName(activeMainSpellId)}`}
              onClick={onOpenMainSpellPicker}
              type="button"
            >
              <span className="materia-orb-label">Main Spell</span>
              <span className="sr-only">{getSpellName(activeMainSpellId)}</span>
            </button>
            <div className="materia-node-caption">{getSpellName(activeMainSpellId)}</div>
          </div>
          <div className="materia-link" />
          {[0, 1].map((slotIndex) => {
            const supportId = supportSlots[slotIndex];

            return (
              <Fragment key={slotIndex}>
                <div className="materia-node">
                  <button
                    className={`materia-orb support-materia ${
                      supportId ? getSupportAccentClassName(supportId) : "empty-materia"
                    }`}
                    onClick={() => onOpenSupportPicker(slotIndex as 0 | 1)}
                    type="button"
                  >
                    <span className="materia-orb-label">{supportSlotLabels[slotIndex]}</span>
                    <span className="sr-only">
                      {supportId
                        ? supportSpellConfig[supportId]?.name ?? supportId
                        : `Empty support slot ${slotIndex + 1}`}
                    </span>
                  </button>
                  <div className="materia-node-caption">
                    {supportId ? supportSpellConfig[supportId]?.name ?? supportId : "Tap to link"}
                  </div>
                </div>
                {slotIndex === 0 ? <div className="materia-link" /> : null}
              </Fragment>
            );
          })}
        </div>
        <p className="status-text">Tap any orb to choose your main spell or link supports.</p>
        <div className="fact-grid">
          {getSpellDetailLines(activeMainSpellId, activeSupportSpellIds).map((line) => (
            <span key={`${activeMainSpellId}-${line}`} className="fact-chip">
              {line}
            </span>
          ))}
        </div>
        {renderSpellUpgradeActions(activeMainSpellId)}
      </section>
    </div>
  );
};
