import { getItemStatEntries, getStatLabel } from "../game/domain/items/itemStats";
import type { InventoryItem } from "../shared/types/saveTypes";
import {
  formatMissingComparedStatValue,
  getComparisonNeutralValue,
  type ItemComparison
} from "./itemComparison";
import { getAffixCountByRarity } from "../game/config/itemAffixConfig";

const buildKindByLabel = (item: InventoryItem): Map<string, "Prefix" | "Suffix"> =>
  new Map((item.affixes ?? []).map((a) => [getStatLabel(a.statKey), a.kind]));

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

  const kindByLabel = buildKindByLabel(item);
  const allAffixes = entries.filter((entry) => !entry.isBase);
  const prefixes = allAffixes.filter((e) => kindByLabel.get(e.label) === "Prefix");
  const suffixes = allAffixes.filter((e) => kindByLabel.get(e.label) === "Suffix");
  const ungrouped = allAffixes.filter((e) => !kindByLabel.has(e.label));
  const hasGroups = prefixes.length > 0 || suffixes.length > 0;

  const affixSlots = item.rarity !== "Unique" ? getAffixCountByRarity(item.rarity) : null;

  const renderAffix = (entry: ReturnType<typeof getItemStatEntries>[number]) => {
    const delta = deltaByLabel.get(entry.label);
    const comparisonTierClass = delta?.tier ? ` stat-tier-${delta.tier}` : "";
    return (
      <div
        key={`${item.id}-${entry.label}`}
        className={`stat-line${entry.tier !== null ? ` stat-tier-${entry.tier}` : ""}${comparisonTierClass}`}
      >
        {entry.tier !== null && <span className="stat-tier-dot" />}
        <span className="stat-label">
          {entry.label}
          {entry.tier !== null && <span className={`craft-tier-badge craft-tier-badge--${entry.tier}`}>T{entry.tier}</span>}
        </span>
        <span className="stat-value">{entry.formattedValue}</span>
        {showDeltas && delta ? renderDelta(delta) : null}
      </div>
    );
  };

  const baseEntries = entries.filter((entry) => entry.isBase);

  return (
    <>
      {baseEntries.length > 0 && <p className="affix-group-label">Base Stat</p>}
      {baseEntries.map((entry) => {
        const delta = deltaByLabel.get(entry.label);

        return (
          <div key={`${item.id}-${entry.label}`} className="stat-line">
            <span className="stat-label">{entry.label}</span>
            <span className="stat-value">{entry.formattedValue}</span>
            {showDeltas && delta ? renderDelta(delta) : null}
          </div>
        );
      })}
      {allAffixes.length > 0 && <div className="item-divider" />}
      {ungrouped.map(renderAffix)}
      {hasGroups && ungrouped.length > 0 && <div className="item-divider" />}
      {prefixes.length > 0 && (
        <>
          <p className="affix-group-label">
            Prefix{affixSlots ? <span className="affix-slot-count">{prefixes.length}/{affixSlots.maxPrefixes}</span> : null}
          </p>
          {prefixes.map(renderAffix)}
        </>
      )}
      {prefixes.length > 0 && suffixes.length > 0 && <div className="item-divider" />}
      {suffixes.length > 0 && (
        <>
          <p className="affix-group-label">
            Suffix{affixSlots ? <span className="affix-slot-count">{suffixes.length}/{affixSlots.maxSuffixes}</span> : null}
          </p>
          {suffixes.map(renderAffix)}
        </>
      )}
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
