import { supportSpellConfig } from "../game/config/spellConfig";
import { resolveSpell } from "../game/domain/spells/spellEngine";
import { OverlayShell } from "./OverlayShell";
import { getSupportAccentClassName } from "./appUiHelpers";
import { getSupportEffectDetails, getSupportRoleTags } from "./supportSpellPresentation";
import { SupportUpgradeActions } from "./SupportUpgradeActions";
import type { CharacterRecord } from "../shared/types/saveTypes";

interface SupportSpellPickerPanelProps {
  character: CharacterRecord;
  selectedSupportSlot: 0 | 1;
  onClose: () => void;
  onSelectSupportSpell: (supportSpellId: string) => void;
  onUpgradeSupport: (supportSpellId: string) => void;
}

export const SupportSpellPickerPanel = ({
  character,
  selectedSupportSlot,
  onClose,
  onSelectSupportSpell,
  onUpgradeSupport
}: SupportSpellPickerPanelProps) => {
  const activeLoadout = character.spellLoadout[0];
  const activeMainSpellId = activeLoadout?.mainSpellId ?? "";
  const currentSupportSpellIds = [...(activeLoadout?.supportSpellIds ?? [])];
  const currentResolvedSpell = activeMainSpellId
    ? resolveSpell(character, activeMainSpellId, currentSupportSpellIds)
    : null;

  return (
    <OverlayShell title={`Support Slot ${selectedSupportSlot + 1}`} onClose={onClose}>
      {Object.values(supportSpellConfig)
        .filter((supportSpell) => supportSpell.passiveOnly !== true)
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((supportSpell) => {
          const isUnlocked = (character.unlockedSupportSpellIds ?? []).includes(supportSpell.id);

          const previewSupportSpellIds = [...currentSupportSpellIds];
          const duplicateIndex = previewSupportSpellIds.findIndex(
            (id, index) => id === supportSpell.id && index !== selectedSupportSlot
          );
          if (duplicateIndex >= 0) {
            previewSupportSpellIds.splice(duplicateIndex, 1);
          }
          if (previewSupportSpellIds[selectedSupportSlot] === supportSpell.id) {
            previewSupportSpellIds.splice(selectedSupportSlot, 1);
          } else {
            previewSupportSpellIds[selectedSupportSlot] = supportSpell.id;
          }

          const previewResolvedSpell = activeMainSpellId
            ? resolveSpell(character, activeMainSpellId, previewSupportSpellIds)
            : null;
          const damageDelta = currentResolvedSpell && previewResolvedSpell
            ? previewResolvedSpell.damage - currentResolvedSpell.damage
            : 0;
          const damageDeltaPercent = currentResolvedSpell && currentResolvedSpell.damage > 0
            ? Math.round((damageDelta / currentResolvedSpell.damage) * 100)
            : 0;
          const damageDeltaClass =
            damageDelta > 0 ? "delta-chip--positive" : damageDelta < 0 ? "delta-chip--negative" : "delta-chip--neutral";
          const damageDeltaPrefix = damageDelta > 0 ? "+" : "";
          const cooldownDeltaMs = currentResolvedSpell && previewResolvedSpell
            ? previewResolvedSpell.cooldownMs - currentResolvedSpell.cooldownMs
            : 0;
          const cooldownDeltaPercent = currentResolvedSpell && currentResolvedSpell.cooldownMs > 0
            ? Math.round((cooldownDeltaMs / currentResolvedSpell.cooldownMs) * 100)
            : 0;
          const cooldownDeltaClass =
            cooldownDeltaMs < 0 ? "delta-chip--positive" : cooldownDeltaMs > 0 ? "delta-chip--negative" : "delta-chip--neutral";
          const cooldownDeltaPrefix = cooldownDeltaMs > 0 ? "+" : "";

          return (
            <div key={supportSpell.id} className="loot-entry">
              <div className="inventory-row">
                <div className="materia-picker-row">
                  <span
                    className={`materia-orb support-materia ${getSupportAccentClassName(supportSpell.id)} ${
                      isUnlocked ? "" : "locked-materia"
                    }`}
                  />
                  <div className="stack compact-stack">
                    <strong>{supportSpell.name}</strong>
                    <div className="status-text">
                      {supportSpell.tags.join(", ")} {isUnlocked ? "" : "| Not owned yet"}
                    </div>
                    {getSupportRoleTags(supportSpell.id).length > 0 ? (
                      <div className="support-role-tag-row">
                        {getSupportRoleTags(supportSpell.id).map((tag) => (
                          <span
                            key={`${supportSpell.id}-picker-${tag}`}
                            className={`support-role-tag support-role-tag--${tag.toLowerCase()}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="status-text">
                      {getSupportEffectDetails(supportSpell.id).join(", ") || "No direct stat modifier"}
                    </div>
                    {currentResolvedSpell && previewResolvedSpell ? (
                      <div className="delta-chip-row">
                        <span className={`delta-chip ${damageDeltaClass}`}>
                          Damage {damageDeltaPrefix}{damageDeltaPercent}% ({damageDeltaPrefix}{damageDelta})
                        </span>
                        <span className={`delta-chip ${cooldownDeltaClass}`}>
                          Cooldown {cooldownDeltaPrefix}{cooldownDeltaPercent}% ({cooldownDeltaPrefix}{(cooldownDeltaMs / 1000).toFixed(2)}s)
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <button
                  className="primary-button"
                  disabled={!isUnlocked}
                  onClick={() => onSelectSupportSpell(supportSpell.id)}
                >
                  Select
                </button>
              </div>
              {isUnlocked ? (
                <SupportUpgradeActions
                  character={character}
                  supportSpellId={supportSpell.id}
                  onUpgradeSupport={onUpgradeSupport}
                />
              ) : null}
            </div>
          );
        })}
    </OverlayShell>
  );
};
