import { getItemStatEntries } from "../game/domain/items/itemStats";
import type { InventoryItem } from "../shared/types/saveTypes";
import {
  formatMissingComparedStatValue,
  getComparisonNeutralValue,
  type ItemComparison
} from "./itemComparison";

interface ItemStatBlockProps {
  item: InventoryItem;
  comparison?: ItemComparison | null;
  showDeltas?: boolean;
  includeMissingComparedStats?: boolean;
}

const getDeltaClass = (delta: ItemComparison["deltas"][number]): string => {
  if (delta.direction === "none") {
    return "item-delta item-delta--neutral";
  }

  return delta.isBeneficial ? "item-delta item-delta--positive" : "item-delta item-delta--negative";
};

const renderDelta = (delta: ItemComparison["deltas"][number]) => {
  if (delta.equippedValue === getComparisonNeutralValue(delta.key) && delta.delta > 0) {
    return <span className="item-delta item-delta--positive">new</span>;
  }

  return <span className={getDeltaClass(delta)}>{delta.formattedDelta}</span>;
};

export const ItemStatBlock = ({
  item,
  comparison,
  showDeltas = true,
  includeMissingComparedStats = false
}: ItemStatBlockProps) => {
  const entries = getItemStatEntries(item);
  const deltaByLabel = new Map((comparison?.deltas ?? []).map((delta) => [delta.label, delta]));
  const shownLabels = new Set(entries.map((entry) => entry.label));
  const extraComparedStats =
    includeMissingComparedStats && comparison
      ? comparison.deltas.filter((delta) => !shownLabels.has(delta.label))
      : [];

  return (
    <>
      {entries.filter((entry) => entry.isBase).map((entry) => {
        const delta = deltaByLabel.get(entry.label);

        return (
          <div key={`${item.id}-${entry.label}`} className="stat-line">
            <span className="stat-label">{entry.label}</span>
            <span className="stat-value">{entry.formattedValue}</span>
            {showDeltas && delta ? renderDelta(delta) : null}
          </div>
        );
      })}
      <div className="item-divider" />
      {entries.filter((entry) => !entry.isBase).map((entry) => {
        const delta = deltaByLabel.get(entry.label);
        const comparisonTierClass = delta?.tier ? ` stat-tier-${delta.tier}` : "";

        return (
          <div
            key={`${item.id}-${entry.label}`}
            className={`stat-line${entry.tier !== null ? ` stat-tier-${entry.tier}` : ""}${comparisonTierClass}`}
          >
            {entry.tier !== null && <span className="stat-tier-dot" />}
            <span className="stat-label">{entry.label}</span>
            <span className="stat-value">{entry.formattedValue}</span>
            {showDeltas && delta ? renderDelta(delta) : null}
          </div>
        );
      })}
      {extraComparedStats.map((delta) => (
        <div
          key={`${item.id}-missing-${delta.key}`}
          className={`stat-line${delta.tier !== null ? ` stat-tier-${delta.tier}` : ""}`}
        >
          {delta.tier !== null && <span className="stat-tier-dot" />}
          <span className="stat-label">{delta.label}</span>
          <span className="stat-value">{formatMissingComparedStatValue(delta.key)}</span>
          {showDeltas ? <span className={getDeltaClass(delta)}>{delta.formattedDelta}</span> : null}
        </div>
      ))}
    </>
  );
};
