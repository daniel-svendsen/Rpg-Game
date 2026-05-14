import { useState } from "react";

interface HubTopBarProps {
  level: number | undefined;
  gold: number | undefined;
  mapShards: number | undefined;
  gemcuttersPrisms: number | undefined;
  bossKeys: number | undefined;
  onSave: () => void;
}

export const HubTopBar = ({ level, gold, mapShards, gemcuttersPrisms, bossKeys, onSave }: HubTopBarProps) => {
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <section className="hub-summary-bar">
      <div className="hub-summary-chips">
        <span className="summary-chip">Lv {level}</span>
        <span className="summary-chip summary-chip--gold">{gold}g</span>
        {typeof mapShards === "number" ? (
          <span className="summary-chip summary-chip--shards">{mapShards} Shards</span>
        ) : null}
        {typeof gemcuttersPrisms === "number" ? (
          <span className="summary-chip summary-chip--shards">{gemcuttersPrisms} GCP</span>
        ) : null}
        {typeof bossKeys === "number" && bossKeys > 0 ? (
          <span className="summary-chip summary-chip--keys">{bossKeys} Keys</span>
        ) : null}
      </div>
      <button className={justSaved ? "secondary-button save-btn--saved" : "secondary-button"} onClick={handleSave}>
        {justSaved ? "Saved ✓" : "Save"}
      </button>
    </section>
  );
};
