interface HubTopBarProps {
  characterName: string | undefined;
  level: number | undefined;
  gold: number | undefined;
  onSave: () => void;
}

export const HubTopBar = ({ characterName, level, gold, onSave }: HubTopBarProps) => (
  <section className="panel mobile-header">
    <div>
      <h3>{characterName}</h3>
      <p className="status-text">
        Level {level} | Gold {gold}
      </p>
    </div>
    <button className="secondary-button" onClick={onSave}>
      Save
    </button>
  </section>
);
