import type { LootEntry } from "../shared/types/saveTypes";

interface LootPanelProps {
  recentLoot: LootEntry[];
}

export const LootPanel = ({ recentLoot }: LootPanelProps) => (
  <section className="panel stack">
    <h4>Recent Loot</h4>
    {recentLoot.length === 0 ? <p className="status-text">No loot recorded yet.</p> : null}
    {recentLoot.map((loot) => (
      <div key={loot.id} className="loot-entry">
        <div className="inventory-row">
          <strong>{loot.name}</strong>
          <span>{loot.kind}</span>
        </div>
        {loot.details.map((detail) => (
          <div key={`${loot.id}-${detail}`} className="status-text">
            {detail}
          </div>
        ))}
        {loot.isUpgrade ? <div className="upgrade-text">Possible upgrade</div> : null}
      </div>
    ))}
  </section>
);
