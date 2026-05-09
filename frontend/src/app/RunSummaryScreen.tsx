import { ItemSlotIcon } from "./ItemSlotIcon";
import type { RunSummaryData } from "./appTypes";

interface RunSummaryScreenProps {
  summaryData: RunSummaryData;
  onKeepFarming: () => void;
  onReturnToHub: () => void;
}

export const RunSummaryScreen = ({ summaryData, onKeepFarming, onReturnToHub }: RunSummaryScreenProps) => {
  const { mapName, wasDefeated, loot } = summaryData;

  const uniqueCount = loot.filter((l) => l.rarity?.toLowerCase() === "unique").length;
  const rareCount = loot.filter((l) => l.rarity?.toLowerCase() === "rare").length;
  const magicCount = loot.filter((l) => l.rarity?.toLowerCase() === "magic").length;

  return (
    <div className="content run-summary-screen">
      <div className="run-summary-outcome">
        <span className={`run-summary-badge ${wasDefeated ? "run-summary-badge--defeat" : "run-summary-badge--victory"}`}>
          {wasDefeated ? "Defeated" : "Map Complete"}
        </span>
        <h2 className="run-summary-map-name">{mapName}</h2>
      </div>

      <section className="panel stack">
        <h4>Loot Found</h4>
        {loot.length === 0 ? (
          <p className="status-text">No loot found this run.</p>
        ) : (
          <>
            {(uniqueCount > 0 || rareCount > 0 || magicCount > 0) && (
              <div className="run-summary-loot-counts">
                {uniqueCount > 0 && (
                  <span className="summary-loot-chip summary-loot-chip--unique">
                    {uniqueCount} Unique
                  </span>
                )}
                {rareCount > 0 && (
                  <span className="summary-loot-chip summary-loot-chip--rare">
                    {rareCount} Rare
                  </span>
                )}
                {magicCount > 0 && (
                  <span className="summary-loot-chip summary-loot-chip--magic">
                    {magicCount} Magic
                  </span>
                )}
              </div>
            )}
            <div className="stack loot-recent">
              {loot.map((entry) => {
                const rarityClass = entry.rarity ? ` rarity-card rarity-${entry.rarity.toLowerCase()}` : "";
                return (
                  <div key={entry.id} className={`loot-entry${rarityClass}`}>
                    <div className="inventory-row">
                      <div className="item-name-row">
                        {entry.slot ? <ItemSlotIcon slot={entry.slot} size={16} /> : null}
                        <strong>{entry.name}</strong>
                      </div>
                      <span className="status-text">{entry.kind}</span>
                    </div>
                    {entry.isUpgrade ? <div className="upgrade-text">Possible upgrade</div> : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <div className="run-summary-actions">
        <button className="primary-button" onClick={onKeepFarming} type="button">
          Keep Farming
        </button>
        <button className="secondary-button" onClick={onReturnToHub} type="button">
          Return to Hub
        </button>
      </div>
    </div>
  );
};
