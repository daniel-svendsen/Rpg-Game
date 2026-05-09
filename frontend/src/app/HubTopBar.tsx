import type { HubTab } from "./appTypes";

interface HubTopBarProps {
  activeTab: HubTab;
  level: number | undefined;
  gold: number | undefined;
  totalPower: number | undefined;
  onSave: () => void;
}

export const HubTopBar = ({ activeTab, level, gold, totalPower, onSave }: HubTopBarProps) => {
  const showPower = (activeTab === "equipment" || activeTab === "shop") && typeof totalPower === "number";

  return (
    <section className="hub-summary-bar">
      <div className="hub-summary-chips">
        <span className="summary-chip">Lv {level}</span>
        <span className="summary-chip summary-chip--gold">{gold}g</span>
        {showPower ? <span className="summary-chip">Power {totalPower}</span> : null}
      </div>
      <button className="secondary-button" onClick={onSave}>
        Save
      </button>
    </section>
  );
};
