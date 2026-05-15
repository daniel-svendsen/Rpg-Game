import type { ReactNode } from "react";
import { balanceConfig } from "../game/config/balanceConfig";
import type { CharacterStats } from "../shared/types/saveTypes";

interface CharacterCreationScreenProps {
  feedback: ReactNode;
  characterName: string;
  characterStats: CharacterStats;
  remainingStatPoints: number;
  canGoBack: boolean;
  onChangeCharacterName: (name: string) => void;
  onUpdateStat: (key: keyof CharacterStats, delta: number) => void;
  onCreateCharacter: () => void;
  onBack: () => void;
}

export const CharacterCreationScreen = ({
  feedback,
  characterName,
  characterStats,
  remainingStatPoints,
  canGoBack,
  onChangeCharacterName,
  onUpdateStat,
  onCreateCharacter,
  onBack
}: CharacterCreationScreenProps) => (
  <div className="content">
    {feedback}
    <section className="panel stack">
      <h3>Create character</h3>
      <input className="text-input" value={characterName} onChange={(event) => onChangeCharacterName(event.target.value)} />
      <p>Distribute exactly {balanceConfig.progression.startingStatPoints} starting stat points.</p>
      {Object.entries(characterStats).map(([key, value]) => (
        <div className="stat-row" key={key}>
          <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
          <div className="stat-controls">
            <button className="secondary-button" onClick={() => onUpdateStat(key as keyof CharacterStats, -1)}>
              -
            </button>
            <strong>{value}</strong>
            <button className="secondary-button" onClick={() => onUpdateStat(key as keyof CharacterStats, 1)}>
              +
            </button>
          </div>
        </div>
      ))}
      <p className="status-text">Remaining points: {remainingStatPoints}</p>
      <button className="primary-button" onClick={onCreateCharacter}>
        Create character
      </button>
      {canGoBack ? (
        <button className="secondary-button" onClick={onBack}>
          Back
        </button>
      ) : null}
    </section>
  </div>
);
