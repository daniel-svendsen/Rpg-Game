import type { HubTab } from "./appTypes";

interface HubTopBarProps {
  activeTab: HubTab;
  level: number | undefined;
  gold: number | undefined;
  mapShards: number | undefined;
  bossKeys: number | undefined;
  totalPower: number | undefined;
  onSave: () => void;
}

export const HubTopBar = ({ activeTab, level, gold, mapShards, bossKeys, totalPower, onSave }: HubTopBarProps) => {
  const showPower = (activeTab === "equipment" || activeTab === "shop") && typeof totalPower === "number";

  return (
    <section className="hub-summary-bar">
      <div className="hub-summary-chips">
        <span className="summary-chip">Lv {level}</span>
        <span className="summary-chip summary-chip--gold">{gold}g</span>
        {typeof mapShards === "number" ? (
          <span className="summary-chip summary-chip--shards">{mapShards} Shards</span>
        ) : null}
        {typeof bossKeys === "number" && bossKeys > 0 ? (
          <span className="summary-chip summary-chip--keys">{bossKeys} Keys</span>
        ) : null}
        {showPower ? <span className="summary-chip">Power {totalPower}</span> : null}
      </div>
      <button className="secondary-button" onClick={onSave}>
        Save
      </button>
    </section>
  );
};
