import { balanceConfig } from "../game/config/balanceConfig";
import type { CharacterRecord } from "../shared/types/saveTypes";

interface HealthHudProps {
  character: CharacterRecord | null;
  canUseLifeFlask: boolean;
  onUseLifeFlask: () => void;
}

export const HealthHud = ({ character, canUseLifeFlask, onUseLifeFlask }: HealthHudProps) => {
  const currentHealth = character?.currentHealth ?? 0;
  const maxHealth = character?.derivedStats.maxHealth ?? 1;
  const healthPercentage = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
  const currentFlaskCharges = character?.lifeFlask.currentCharges ?? 0;

  return (
    <div className="panel">
      <h4>Health</h4>
      <div className="health-bar">
        <div className="health-fill" style={{ width: `${healthPercentage}%` }} />
      </div>
      <p className="status-text">
        {currentHealth} / {maxHealth}
      </p>
      {character ? (
        <div className="stack compact-stack">
          <div className="status-text">
            {`Life Flask: ${currentFlaskCharges}/${balanceConfig.healing.lifeFlask.maxCharges} charges`}
          </div>
          <button
            className="secondary-button"
            disabled={!canUseLifeFlask}
            onClick={onUseLifeFlask}
            type="button"
          >
            {`Use Flask (${balanceConfig.healing.lifeFlask.chargesPerUse} charges)`}
          </button>
        </div>
      ) : null}
    </div>
  );
};
