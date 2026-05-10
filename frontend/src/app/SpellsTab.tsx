import { Fragment, type ReactNode } from "react";
import { getSpellDescription, getSpellName } from "../game/domain/spells/spellDrops";
import { spellConfig, supportSpellConfig } from "../game/config/spellConfig";

const getSpellElementSymbol = (spellId: string): string => {
  const tags = spellConfig[spellId]?.tags ?? [];
  if (tags.includes("Lightning")) return "⚡";
  if (tags.includes("Fire")) return "✦";
  if (tags.includes("Cold")) return "❄";
  return "◈";
};

const getSupportElementSymbol = (supportId: string): string => {
  const tags = supportSpellConfig[supportId]?.tags ?? [];
  if (tags.includes("CastSpeed")) return "⟳";
  if (tags.includes("Critical")) return "◆";
  if (tags.includes("Chain") || tags.includes("Projectile")) return "➤";
  if (tags.includes("Area")) return "◉";
  return "✦";
};
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


  return (
    <div className="content stack mobile-content">
      {topBar}
      <section className="panel stack">
        <div className="spell-panel-header">
          <h4>{getSpellName(activeMainSpellId) || "Linked Spell"}</h4>
          <p className="status-text">Link supports to your spell to enhance its effects. Tap an orb to change it.</p>
          {activeMainSpellId ? (
            <p className="status-text spell-description">{getSpellDescription(activeMainSpellId)}</p>
          ) : null}
        </div>
        <div className="materia-strip">
          <div className="materia-node">
            <button
              className={`materia-orb main-materia ${getSpellAccentClassName(activeMainSpellId)}`}
              onClick={onOpenMainSpellPicker}
              type="button"
              title={getSpellName(activeMainSpellId)}
            >
              <span className="materia-orb-icon">{getSpellElementSymbol(activeMainSpellId)}</span>
            </button>
            <div className="materia-node-caption">{getSpellName(activeMainSpellId) || "Choose spell"}</div>
          </div>
          <div className="materia-link" />
          {[0, 1].map((slotIndex) => {
            const supportId = supportSlots[slotIndex];
            const supportName = supportId ? (supportSpellConfig[supportId]?.name ?? supportId) : null;

            return (
              <Fragment key={slotIndex}>
                <div className="materia-node">
                  <button
                    className={`materia-orb support-materia ${
                      supportId ? getSupportAccentClassName(supportId) : "empty-materia"
                    }`}
                    onClick={() => onOpenSupportPicker(slotIndex as 0 | 1)}
                    type="button"
                    title={supportName ?? `Support slot ${slotIndex + 1}`}
                  >
                    <span className="materia-orb-icon">
                      {supportId ? getSupportElementSymbol(supportId) : "+"}
                    </span>
                  </button>
                  <div className="materia-node-caption">
                    {supportName ?? "Link support"}
                  </div>
                </div>
                {slotIndex === 0 ? <div className="materia-link" /> : null}
              </Fragment>
            );
          })}
        </div>
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
