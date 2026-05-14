import { supportSpellConfig } from "../game/config/spellConfig";
import { OverlayShell } from "./OverlayShell";
import { getSupportAccentClassName } from "./appUiHelpers";
import { getSupportPassiveDetails } from "./supportSpellPresentation";
import type { CharacterRecord } from "../shared/types/saveTypes";

interface PassiveSupportPickerPanelProps {
  character: CharacterRecord;
  selectedPassiveSlot: 0 | 1 | 2;
  onClose: () => void;
  onSelectPassiveSupport: (supportSpellId: string) => void;
}

export const PassiveSupportPickerPanel = ({
  character,
  selectedPassiveSlot,
  onClose,
  onSelectPassiveSupport
}: PassiveSupportPickerPanelProps) => {
  const passiveSupports = Object.values(supportSpellConfig).filter((s) => s.passiveOnly);

  return (
    <OverlayShell title={`Passive Slot ${selectedPassiveSlot + 1}`} onClose={onClose}>
      {passiveSupports
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((support) => {
          const isUnlocked = (character.unlockedSupportSpellIds ?? []).includes(support.id);
          const details = getSupportPassiveDetails(support.id).join(", ") || "No passive effect";

          return (
            <div key={support.id} className="loot-entry">
              <div className="inventory-row">
                <div className="materia-picker-row">
                  <span
                    className={`materia-orb support-materia ${getSupportAccentClassName(support.id)} ${
                      isUnlocked ? "" : "locked-materia"
                    }`}
                  />
                  <div className="stack compact-stack">
                    <strong>{support.name}</strong>
                    <div className="status-text">{support.tags.join(", ")} {isUnlocked ? "" : "| Not owned yet"}</div>
                    <div className="status-text">{details}</div>
                  </div>
                </div>
                <button
                  className="primary-button"
                  disabled={!isUnlocked}
                  onClick={() => onSelectPassiveSupport(support.id)}
                >
                  Select
                </button>
              </div>
            </div>
          );
        })}
    </OverlayShell>
  );
};
