import { getSpellDescription, getSpellName } from "../game/domain/spells/spellDrops";
import { OverlayShell } from "./OverlayShell";
import { SpellUpgradeActions } from "./SpellUpgradeActions";
import { getSpellAccentClassName } from "./appUiHelpers";
import type { CharacterRecord } from "../shared/types/saveTypes";

interface MainSpellPickerPanelProps {
  character: CharacterRecord;
  getSpellDetailLines: (spellId: string, supportSpellIds: string[]) => string[];
  onClose: () => void;
  onSelectMainSpell: (spellId: string) => void;
  onUpgradeSpell: (spellId: string) => void;
}

export const MainSpellPickerPanel = ({
  character,
  getSpellDetailLines,
  onClose,
  onSelectMainSpell,
  onUpgradeSpell
}: MainSpellPickerPanelProps) => {
  const activeMainSpellId = character.spellLoadout[0]?.mainSpellId ?? "";

  return (
    <OverlayShell title="Main Spell" onClose={onClose}>
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
          <SpellUpgradeActions character={character} spellId={spellId} onUpgradeSpell={onUpgradeSpell} />
        </div>
      ))}
    </OverlayShell>
  );
};
