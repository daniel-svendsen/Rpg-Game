import { balanceConfig } from "../game/config/balanceConfig";
import {
  canUpgradeSupport,
  getSupportEffectMultiplier,
  getSupportLevel,
  getSupportUpgradeGemcuttersPrismCost
} from "../game/domain/spells/supportProgression";
import type { CharacterRecord } from "../shared/types/saveTypes";

interface SupportUpgradeActionsProps {
  character: CharacterRecord | null;
  supportSpellId: string;
  onUpgradeSupport: (supportSpellId: string) => void;
}

export const SupportUpgradeActions = ({
  character,
  supportSpellId,
  onUpgradeSupport
}: SupportUpgradeActionsProps) => {
  if (!character) {
    return null;
  }

  const supportLevel = getSupportLevel(character, supportSpellId);
  const prismCost = getSupportUpgradeGemcuttersPrismCost(supportLevel);
  const isUpgradeable = canUpgradeSupport(character, supportSpellId);
  const isMaxLevel = supportLevel >= balanceConfig.supportProgression.maxLevel;
  const currentMultiplier = getSupportEffectMultiplier(supportLevel);
  const nextMultiplier = isMaxLevel ? null : getSupportEffectMultiplier(supportLevel + 1);

  return (
    <div className="stack compact-stack">
      <div className="status-text">
        Level {supportLevel} | Effect {currentMultiplier.toFixed(2)}x
        {nextMultiplier ? ` -> ${nextMultiplier.toFixed(2)}x` : ""}
      </div>
      <div className="status-text">
        {isMaxLevel
          ? "Max level reached"
          : `Upgrade cost: ${prismCost} Gemcutter's Prism`}
      </div>
      <div className="actions">
        <button
          className="secondary-button"
          disabled={!isUpgradeable}
          onClick={() => onUpgradeSupport(supportSpellId)}
          type="button"
        >
          {isMaxLevel ? "Maxed" : "Upgrade support"}
        </button>
      </div>
    </div>
  );
};
