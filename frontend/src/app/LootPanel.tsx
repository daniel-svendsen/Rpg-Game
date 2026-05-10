import { ItemSlotIcon } from "./ItemSlotIcon";
import type { LootEntry } from "../shared/types/saveTypes";

interface LootPanelProps {
  recentLoot: LootEntry[];
}

export const LootPanel = ({ recentLoot }: LootPanelProps) => (
  <section className="panel stack loot-recent">
    <h4>Recent Loot</h4>
    {recentLoot.length === 0 ? <p className="status-text">No loot recorded yet.</p> : null}
    {recentLoot.map((loot) => {
      const rarityClass = loot.rarity ? ` rarity-card rarity-${loot.rarity.toLowerCase()}` : "";
      return (
        <div key={loot.id} className={`loot-entry${rarityClass}`}>
          <div className="inventory-row">
            <div className="item-name-row">
              {loot.slot ? <ItemSlotIcon slot={loot.slot} size={16} /> : null}
              <strong>{loot.name}</strong>
            </div>
            <span>{loot.kind}</span>
          </div>
          {loot.details.length > 0 ? <div className="item-divider" /> : null}
          {loot.details.map((detail) => (
            <div key={`${loot.id}-${detail}`} className="status-text">
              {detail}
            </div>
          ))}
          {loot.isUpgrade ? <div className="upgrade-text">Possible upgrade</div> : null}
        </div>
      );
    })}
  </section>
);
