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

interface MapsTabProps {
  topBar: ReactNode;
  healthHud: ReactNode;
  character: CharacterRecord | null;
  selectedMapTarget: SelectedMapTarget;
  selectedMapId: string;
  selectedMapEntry: OwnedMapStack | null;
  selectedMapEnhancements: MapEnhancementInstance[];
  queuedMapCount: number;
  mapShardAmount: number;
  getMapDisplayName: (mapId: string, enhancementCount: number) => string;
  getMapVariantLabel: (enhancementCount: number) => string;
  getMapEnhancementDetailLines: (enhancements: MapEnhancementInstance[]) => string[];
  onStartMap: () => void;
  onRunAllMaps: () => void;
  onEnhanceSelectedMap: () => void;
  onSelectMap: (target: SelectedMapTarget) => void;
  onConvertShardsToMaps: () => void;
  onCraftMapAtTier: (tier: number) => void;
}

export const MapsTab = ({
  topBar,
  healthHud,
  character,
  selectedMapTarget,
  selectedMapId,
  selectedMapEntry,
  selectedMapEnhancements,
  queuedMapCount,
  mapShardAmount,
  getMapDisplayName,
  getMapVariantLabel,
  getMapEnhancementDetailLines,
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
  const selectedTier = selectedMap?.tier ?? 0;
  const isSelectedMapLocked = selectedMapTarget !== "trainingGrounds" && selectedTier > highestUnlockedTier;
  const craftTier = selectedMapTarget !== "trainingGrounds" ? selectedTier : 0;
  const craftCost = craftTier > 0 ? balanceConfig.mapCrafting.shardCraftCostPerTier * craftTier : 0;
  const canAffordCraft = craftTier > 0 && mapShardAmount >= craftCost;
  const selectedResolvedMap = resolveMapInstance(selectedMap, selectedMapEnhancements);
  const nextEnhancementCost =
    selectedMapTarget !== "trainingGrounds" && selectedMapEntry
      ? getEnhancementShardCost(selectedMapEntry.enhancements.length)
      : null;

  return (
    <div className="content stack mobile-content">
      {topBar}
      {healthHud}
      <section className="panel stack">
        <h4>Maps</h4>
        <div className="actions">
          <button className="primary-button" disabled={isSelectedMapLocked} onClick={onStartMap}>
            Start
          </button>
          {selectedMapTarget !== "trainingGrounds" ? (
            <button className="secondary-button" disabled={isSelectedMapLocked} onClick={onRunAllMaps}>
              Run all maps in this tier
            </button>
          ) : null}
          {selectedMapTarget !== "trainingGrounds" ? (
            <button className="secondary-button" disabled={isSelectedMapLocked} onClick={onEnhanceSelectedMap}>
              Enhance ({nextEnhancementCost} shards)
            </button>
          ) : null}
        </div>
        {isSelectedMapLocked ? (
          <p className="error-text">Locked. Unlocked by defeating the Tier {selectedTier} boss.</p>
        ) : null}
        {selectedMapTarget !== "trainingGrounds" ? (
          <div className="status-text">
            {getMapDisplayName(selectedMapId, selectedMapEnhancements.length)} | {getMapVariantLabel(selectedMapEnhancements.length)}{" "}
            | Enhancements {selectedMapEnhancements.length}/{balanceConfig.mapCrafting.maxEnhancementsPerMap} | Monsters{" "}
            {selectedResolvedMap.monsterCount}
          </div>
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
              <div className="status-text">Infinite practice run. Drops Tier 1 maps.</div>
            </div>
            <button className="secondary-button" onClick={() => onSelectMap("trainingGrounds")}>
              {selectedMapTarget === "trainingGrounds" ? "Selected" : "Select"}
            </button>
          </div>
        </div>
        {consumableMapEntries.map((entry) => (
          <div
            key={entry.stackId}
            className={selectedMapTarget === entry.stackId ? "map-card selected-map-card" : "map-card"}
          >
            <div className="inventory-row">
              <div>
                <strong>{getMapDisplayName(entry.mapId, entry.enhancements.length)}</strong>
                <div className="status-text">
                  Tier {entry.tier} • Quantity {entry.quantity}
                </div>
                {entry.tier > highestUnlockedTier ? (
                  <div className="error-text">Unlocked by defeating the Tier {entry.tier} boss.</div>
                ) : null}
              </div>
              <div className="status-text">
                {getMapVariantLabel(entry.enhancements.length)} | Enhancements {entry.enhancements.length}/
                {balanceConfig.mapCrafting.maxEnhancementsPerMap}
              </div>
              {getMapEnhancementSummary(entry.enhancements).map((line) => (
                <div key={`${entry.stackId}-${line}`} className="status-text">
                  Mod: {line}
                </div>
              ))}
              {getMapEnhancementDetailLines(entry.enhancements).map((line) => (
                <div key={`${entry.stackId}-detail-${line}`} className="status-text">
                  {line}
                </div>
              ))}
              <button className="secondary-button" onClick={() => onSelectMap(entry.stackId)}>
                {selectedMapTarget === entry.stackId ? "Selected" : "Select"}
              </button>
            </div>
          </div>
        ))}
      </section>
      <section className="panel stack">
        <h4>Map Crafting</h4>
        <p className="status-text">Map Shards: {mapShardAmount}</p>
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
