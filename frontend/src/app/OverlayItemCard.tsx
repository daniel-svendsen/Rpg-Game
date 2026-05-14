import { ItemSlotIcon } from "./ItemSlotIcon";
import { ItemStatBlock } from "./ItemStatBlock";
import { rarityCardClassName } from "./appUiHelpers";
import { summarizeComparison } from "./itemComparison";
import { toChipModel } from "./comparisonChipUi";
import { useItemComparison } from "./useItemComparison";
import type { CharacterRecord, InventoryItem } from "../shared/types/saveTypes";

interface OverlayItemCardProps {
  character: CharacterRecord;
  item: InventoryItem;
  actionLabel?: string;
  onAction?: () => void;
  badge?: string;
  equippedComparisonItem?: InventoryItem | null;
  showDeltas?: boolean;
  includeMissingComparedStats?: boolean;
  showSummary?: boolean;
}

export const OverlayItemCard = ({
  character,
  item,
  actionLabel,
  onAction,
  badge,
  equippedComparisonItem,
  showDeltas = true,
  includeMissingComparedStats = false,
  showSummary = true
}: OverlayItemCardProps) => {
  const getComparison = useItemComparison(character);
  const comparison = getComparison(item, equippedComparisonItem);
  const summary = summarizeComparison(character, item, equippedComparisonItem);
  const chipModel = toChipModel(summary);

  return (
    <div className={`loot-entry ${rarityCardClassName(item.rarity)}`}>
      <div className="inventory-row">
        <div className="item-name-row">
          {item.slot ? <ItemSlotIcon slot={item.slot} /> : null}
          <strong>{item.name}</strong>
        </div>
      </div>
      {badge ? <div className="status-text">{badge}</div> : null}
      {showSummary && chipModel ? (
        <div className="delta-chip-row">
          <span className={`delta-chip ${chipModel.damageClass}`}>
            Damage {chipModel.damageText}
          </span>
          <span className={`delta-chip ${chipModel.survivalClass}`}>
            Survival {chipModel.survivalText}
          </span>
        </div>
      ) : null}
      <ItemStatBlock
        item={item}
        comparison={comparison}
        showDeltas={showDeltas}
        includeMissingComparedStats={includeMissingComparedStats}
      />
      {item.uniqueEffectDescription ? (
        <div className="unique-effect-line">{item.uniqueEffectDescription}</div>
      ) : null}
      {actionLabel && onAction ? (
        <button className="primary-button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};
