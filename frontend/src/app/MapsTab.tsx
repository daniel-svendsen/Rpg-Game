import type { ReactNode } from "react";
import { balanceConfig } from "../game/config/balanceConfig";
import { getEnhancementShardCost } from "../game/config/balance";
import { mapConfig } from "../game/config/mapConfig";
import { getMapEnhancementSummary, resolveMapInstance } from "../game/domain/maps/mapEnhancements";
import type {
  CharacterRecord,
  MapEnhancementInstance,
  OwnedMapStack
} from "../shared/types/saveTypes";
import type { SelectedMapTarget } from "./appTypes";
import { createUnlockedTierSelection, getUnlockedTierSelection } from "./mapFlow";

interface MapsTabProps {
  topBar: ReactNode;
  character: CharacterRecord | null;
  selectedMapTarget: SelectedMapTarget;
  selectedMapId: string;
  selectedMapEntry: OwnedMapStack | null;
  selectedMapEnhancements: MapEnhancementInstance[];
  queuedMapCount: number;
  mapShardAmount: number;
  getMapDisplayName: (mapId: string, enhancementCount: number) => string;
  getMapVariantLabel: (enhancementCount: number) => string;
  onStartMap: () => void;
  onRunAllMaps: () => void;
  onEnhanceSelectedMap: () => void;
  onSelectMap: (target: SelectedMapTarget) => void;
  onConvertShardsToMaps: () => void;
  onCraftMapAtTier: (tier: number) => void;
}

export const MapsTab = ({
  topBar,
  character,
  selectedMapTarget,
  selectedMapId,
  selectedMapEntry,
  selectedMapEnhancements,
  queuedMapCount,
  mapShardAmount,
  getMapDisplayName,
  getMapVariantLabel,
  onStartMap,
  onRunAllMaps,
  onEnhanceSelectedMap,
  onSelectMap,
  onConvertShardsToMaps,
  onCraftMapAtTier
}: MapsTabProps) => {
  const selectedMap = mapConfig[selectedMapId];
  const consumableMapEntries = character?.mapProgress.consumableMaps ?? [];
  const highestUnlockedTier = character?.mapProgress.highestUnlockedTier ?? 1;
  const selectedUnlockedTier = getUnlockedTierSelection(selectedMapTarget);
  const selectedTier = selectedMap?.tier ?? 0;
  const isSelectedMapLocked = selectedMapTarget !== "trainingGrounds" && selectedTier > highestUnlockedTier;
  const hasSelectedOwnedMap = selectedMapTarget === "trainingGrounds" || selectedMapEntry !== null;
  const craftTier = selectedMapTarget !== "trainingGrounds" ? selectedTier : 0;
  const craftCost = craftTier > 0 ? balanceConfig.mapCrafting.shardCraftCostPerTier * craftTier : 0;
  const canAffordCraft = craftTier > 0 && mapShardAmount >= craftCost;
  const selectedResolvedMap = resolveMapInstance(selectedMap, selectedMapEnhancements);
  const unlockedEmptyTiers = Array.from({ length: highestUnlockedTier }, (_, index) => index + 1).filter(
    (tier) => !consumableMapEntries.some((entry) => entry.tier === tier)
  );
  const nextEnhancementCost =
    selectedMapTarget !== "trainingGrounds" && selectedMapEntry
      ? getEnhancementShardCost(selectedMapEntry.enhancements.length)
      : null;

  return (
    <div className="content stack mobile-content">
      {topBar}
      <section className="panel stack">
        <h4>Maps</h4>
        <div className="actions">
          <button className="primary-button" disabled={isSelectedMapLocked || !hasSelectedOwnedMap} onClick={onStartMap}>
            Start
          </button>
          {selectedMapTarget !== "trainingGrounds" ? (
            <button
              className="secondary-button"
              disabled={isSelectedMapLocked || !selectedMapEntry}
              onClick={onRunAllMaps}
            >
              Run all maps in this tier
            </button>
          ) : null}
          {selectedMapTarget !== "trainingGrounds" ? (
            <button
              className="secondary-button"
              disabled={isSelectedMapLocked || !selectedMapEntry}
              onClick={onEnhanceSelectedMap}
            >
              Enhance ({nextEnhancementCost} shards)
            </button>
          ) : null}
        </div>
        {isSelectedMapLocked ? (
          <p className="error-text">
            Locked. Unlocked by defeating the Tier {Math.max(1, selectedTier - 1)} boss.
          </p>
        ) : null}
        {selectedMapTarget !== "trainingGrounds" && selectedMapEntry ? (
          <div className="status-text">
            {getMapDisplayName(selectedMapId, selectedMapEnhancements.length)} | {getMapVariantLabel(selectedMapEnhancements.length)}{" "}
            | Enhancements {selectedMapEnhancements.length}/{balanceConfig.mapCrafting.maxEnhancementsPerMap} | Monsters{" "}
            {selectedResolvedMap.monsterCount}
          </div>
        ) : null}
        {selectedMapTarget !== "trainingGrounds" && !selectedMapEntry && selectedUnlockedTier !== null ? (
          <p className="status-text">
            Tier {selectedUnlockedTier} is unlocked, but you do not currently own any Tier {selectedUnlockedTier} maps.
            Craft one with shards to run it.
          </p>
        ) : null}
        {queuedMapCount > 0 ? (
          <p className="status-text">
            Auto-run queue active: {queuedMapCount} map{queuedMapCount === 1 ? "" : "s"} remaining.
          </p>
        ) : null}
        <div className={selectedMapTarget === "trainingGrounds" ? "map-card selected-map-card" : "map-card"}>
          <div className="inventory-row">
            <div>
              <strong>Training Grounds</strong>
              <div className="status-text">Always available. Drops Tier 1 maps and loot.</div>
            </div>
            <button className="secondary-button" onClick={() => onSelectMap("trainingGrounds")}>
              {selectedMapTarget === "trainingGrounds" ? "Selected" : "Select"}
            </button>
          </div>
        </div>
        {consumableMapEntries.map((entry) => {
          const tierClass = `map-card--tier-${entry.tier}`;
          const isSelected = selectedMapTarget === entry.stackId;
          const cardClass = `map-card ${tierClass}${isSelected ? " selected-map-card" : ""}`;
          return (
            <div key={entry.stackId} className={cardClass}>
              <div className="inventory-row">
                <div>
                  <div className="item-name-row">
                    <strong>{getMapDisplayName(entry.mapId, entry.enhancements.length)}</strong>
                    <span className={`map-tier-badge map-tier-badge--${entry.tier}`}>T{entry.tier}</span>
                  </div>
                  <div className="status-text">
                    Qty {entry.quantity} • {getMapVariantLabel(entry.enhancements.length)}
                  </div>
                  {entry.tier > highestUnlockedTier ? (
                    <div className="error-text">
                      Unlocked by defeating the Tier {Math.max(1, entry.tier - 1)} boss.
                    </div>
                  ) : null}
                </div>
                <div>
                  {getMapEnhancementSummary(entry.enhancements).map((line) => (
                    <div key={`${entry.stackId}-${line}`} className="status-text">
                      +{line}
                    </div>
                  ))}
                  <button className="secondary-button" onClick={() => onSelectMap(entry.stackId)}>
                    {isSelected ? "Selected" : "Select"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {unlockedEmptyTiers.map((tier) => {
          const virtualSelection = createUnlockedTierSelection(tier);
          const isSelected = selectedMapTarget === virtualSelection;
          const cardClass = `map-card map-card--tier-${tier}${isSelected ? " selected-map-card" : ""}`;
          return (
            <div key={virtualSelection} className={cardClass}>
              <div className="inventory-row">
                <div>
                  <div className="item-name-row">
                    <strong>Tier {tier} Map</strong>
                    <span className={`map-tier-badge map-tier-badge--${tier}`}>T{tier}</span>
                  </div>
                  <div className="status-text">Qty 0 • Unmodified</div>
                  <div className="status-text">Unlocked. Craftable with {tier * balanceConfig.mapCrafting.shardCraftCostPerTier} shards.</div>
                </div>
                <button className="secondary-button" onClick={() => onSelectMap(virtualSelection)}>
                  {isSelected ? "Selected" : "Select"}
                </button>
              </div>
            </div>
          );
        })}
      </section>
      <section className="panel stack">
        <h4>Map Crafting</h4>
        <p className="status-text">Map Shards: {mapShardAmount}</p>
        <p className="status-text">Combine shards to craft random maps, or craft directly into the tier of your selected map.</p>
        <button className="secondary-button" onClick={onConvertShardsToMaps}>
          Combine {balanceConfig.mapCrafting.combineShardsCost} shards into maps
        </button>
        {craftTier > 0 ? (
          <button
            className="secondary-button"
            disabled={!canAffordCraft || isSelectedMapLocked}
            onClick={() => onCraftMapAtTier(craftTier)}
          >
            Craft 1 Tier {craftTier} map ({craftCost} shards)
          </button>
        ) : null}
      </section>
    </div>
  );
};
