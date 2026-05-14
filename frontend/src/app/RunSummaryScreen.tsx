import { useState } from "react";
import { ItemSlotIcon } from "./ItemSlotIcon";
import { ItemStatBlock } from "./ItemStatBlock";
import type { RunSummaryData } from "./appTypes";
import { countRunSummaryLoot } from "./runSummaryHelpers";
import { rarityCardClassName } from "./appUiHelpers";

interface RunSummaryScreenProps {
  summaryData: RunSummaryData;
  onKeepFarming: () => void;
  onReturnToHub: () => void;
}

export const RunSummaryScreen = ({ summaryData, onKeepFarming, onReturnToHub }: RunSummaryScreenProps) => {
  const { mapName, wasDefeated, loot, completedMaps, completionNotes } = summaryData;
  const summaryTitle = completedMaps > 1 ? `${completedMaps} Maps Complete` : mapName;
  const { unique: uniqueCount, rare: rareCount, magic: magicCount, bossKeys: bossKeyCount } = countRunSummaryLoot(loot);
  const [expandedLootId, setExpandedLootId] = useState<string | null>(null);

  return (
    <div className="content run-summary-screen">
      <div className="run-summary-outcome">
        <span className={`run-summary-badge ${wasDefeated ? "run-summary-badge--defeat" : "run-summary-badge--victory"}`}>
          {wasDefeated ? "Defeated" : "Map Complete"}
        </span>
        <h2 className="run-summary-map-name">{summaryTitle}</h2>
        {completedMaps > 1 ? <p className="status-text">Last map: {mapName}</p> : null}
      </div>

      <div className="run-summary-actions">
        <div className="run-summary-action-group">
          <button className="primary-button" onClick={onKeepFarming} type="button">
            Keep Farming
          </button>
          <span className="run-summary-action-hint">Start another run immediately</span>
        </div>
        <div className="run-summary-action-group">
          <button className="secondary-button" onClick={onReturnToHub} type="button">
            Return to Hub
          </button>
          <span className="run-summary-action-hint">Manage gear, spells and shop</span>
        </div>
      </div>

      {completionNotes.length > 0 ? (
        <section className="panel stack">
          <h4>Run Outcome</h4>
          <div className="stack">
            {completionNotes.map((note) => (
              <p key={note} className="status-text">
                {note}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel stack">
        <h4>Loot Found</h4>
        {loot.length === 0 ? (
          <p className="status-text">No loot found this run.</p>
        ) : (
          <>
            {(uniqueCount > 0 || rareCount > 0 || magicCount > 0 || bossKeyCount > 0) && (
              <div className="run-summary-loot-counts">
                {bossKeyCount > 0 && (
                  <span className="summary-loot-chip summary-loot-chip--unique">
                    {bossKeyCount} Key{bossKeyCount === 1 ? "" : "s"}
                  </span>
                )}
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
                const rarityClass = entry.rarity ? ` ${rarityCardClassName(entry.rarity)}` : "";
                const isExpanded = expandedLootId === entry.id;
                const clickable = entry.kind === "Item" && entry.item != null;
                return (
                  <div
                    key={entry.id}
                    className={`loot-entry${rarityClass}${clickable ? " loot-entry--clickable" : ""}`}
                    onClick={clickable ? () => setExpandedLootId(isExpanded ? null : entry.id) : undefined}
                  >
                    <div className="inventory-row">
                      <div className="item-name-row">
                        {entry.slot ? <ItemSlotIcon slot={entry.slot} size={16} /> : null}
                        <strong>{entry.name}</strong>
                      </div>
                      <span className="status-text">{entry.kind}</span>
                    </div>
                    {isExpanded && entry.item ? (
                      <div className="loot-entry-stats">
                        <ItemStatBlock item={entry.item} showDeltas={false} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
