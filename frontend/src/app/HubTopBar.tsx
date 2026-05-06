interface HubTopBarProps {
  characterName: string | undefined;
  level: number | undefined;
  gold: number | undefined;
  totalPower: number | undefined;
  onSave: () => void;
}

export const HubTopBar = ({ characterName, level, gold, totalPower, onSave }: HubTopBarProps) => (
  <section className="hub-summary-bar">
    <div className="hub-summary-meta">
      <strong>{characterName}</strong>
      <div className="hub-summary-chips">
        <span className="summary-chip">Level {level}</span>
        <span className="summary-chip">Gold {gold}</span>
        {typeof totalPower === "number" ? <span className="summary-chip">Power {totalPower}</span> : null}
      </div>
    </div>
    <button className="secondary-button" onClick={onSave}>
      Save
    </button>
  </section>
);
