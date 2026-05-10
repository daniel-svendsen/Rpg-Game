import type { Dispatch, SetStateAction } from "react";
import { balanceConfig } from "../game/config/balanceConfig";
import { getEnhancementShardCost } from "../game/config/balance";
import { mapConfig } from "../game/config/mapConfig";
import {
  addOwnedMap,
  consumeOwnedMap,
  isBossTierCleared,
  isBossTierRetryUnlocked,
  getOwnedMapStack,
  getOwnedMapStackBySignature
} from "../game/domain/maps/mapProgress";
import { getMapEnhancementSummary, rollMapEnhancement } from "../game/domain/maps/mapEnhancements";
import { normalizeCharacterRecord } from "../game/domain/player/playerTypes";
import type { ArenaSnapshot, CharacterRecord, MapEnhancementInstance } from "../shared/types/saveTypes";
import type { ScreenMode, SelectedMapTarget } from "./appTypes";
import {
  buildOwnedMapRunQueue,
  getCurrencyAmount,
  getPreferredMapSelection,
  updateCurrency
} from "./mapFlow";

interface UseMapActionsParams {
  character: CharacterRecord | null;
  selectedMapTarget: SelectedMapTarget;
  commitCharacter: (nextCharacter: CharacterRecord | null) => void;
  persistCharacterNow: (nextCharacter: CharacterRecord, failureMessage: string) => Promise<void>;
  setQueuedMapIds: Dispatch<SetStateAction<string[]>>;
  setActiveMapId: Dispatch<SetStateAction<string | null>>;
  setActiveMapEnhancements: Dispatch<SetStateAction<MapEnhancementInstance[]>>;
  setActiveMapRunId: Dispatch<SetStateAction<number>>;
  setArenaSnapshot: Dispatch<SetStateAction<ArenaSnapshot | null>>;
  setSelectedMapTarget: Dispatch<SetStateAction<SelectedMapTarget>>;
  setScreenMode: Dispatch<SetStateAction<ScreenMode>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
}

export const useMapActions = ({
  character,
  selectedMapTarget,
  commitCharacter,
  persistCharacterNow,
  setQueuedMapIds,
  setActiveMapId,
  setActiveMapEnhancements,
  setActiveMapRunId,
  setArenaSnapshot,
  setSelectedMapTarget,
  setScreenMode,
  setStatusMessage,
  setErrorMessage
}: UseMapActionsParams) => {
  const startMapRun = (
    mapTarget: SelectedMapTarget,
    sourceCharacter: CharacterRecord,
    remainingQueue: string[] = []
  ): boolean => {
    let nextCharacter = normalizeCharacterRecord(sourceCharacter);
    const ownedMapStack =
      mapTarget !== "trainingGrounds" ? getOwnedMapStack(nextCharacter.mapProgress, mapTarget) : null;
    const directMapId =
      mapTarget !== "trainingGrounds" && !ownedMapStack && mapConfig[mapTarget] ? mapTarget : null;
    const mapId = ownedMapStack?.mapId ?? directMapId ?? "trainingGrounds";
    const mapTier = ownedMapStack?.tier ?? mapConfig[mapId]?.tier ?? 0;
    const isBossMap = mapId.startsWith("bossTier");
    const mapEnhancements = ownedMapStack?.enhancements ?? [];

    if (balanceConfig.healing.refillToFullOnMapStart) {
      nextCharacter = {
        ...nextCharacter,
        currentHealth: nextCharacter.derivedStats.maxHealth,
        lifeFlask: {
          currentCharges: balanceConfig.healing.lifeFlask.maxCharges
        }
      };
    }

    if (mapTarget !== "trainingGrounds") {
      if (!ownedMapStack || ownedMapStack.quantity <= 0) {
        if (isBossMap && mapConfig[mapTarget]) {
          // Boss retries before first clear do not consume a stored key.
        } else {
          setErrorMessage("You do not own that map.");
          return false;
        }
      }

      const unlockedTier = nextCharacter.mapProgress.highestUnlockedTier;

      if (isBossMap) {
        if (mapTier > unlockedTier) {
          setErrorMessage(`That boss lair is locked. Unlock Tier ${mapTier} maps first.`);
          return false;
        }
      } else if (mapTier > unlockedTier) {
        setErrorMessage(`That map is locked. Defeat the Tier ${Math.max(1, mapTier - 1)} boss first.`);
        return false;
      }

      if (ownedMapStack) {
        nextCharacter = consumeOwnedMap(nextCharacter, mapTarget);
      }
    }

    commitCharacter(nextCharacter);
    setQueuedMapIds(remainingQueue);
    setActiveMapId(mapId);
    setActiveMapEnhancements(mapEnhancements);
    setActiveMapRunId((current) => current + 1);
    setArenaSnapshot(null);
    setErrorMessage(null);
    setScreenMode("arena");
    setStatusMessage(
      remainingQueue.length > 0
        ? `Entering ${mapConfig[mapId].name}. ${remainingQueue.length} map${remainingQueue.length === 1 ? "" : "s"} queued after this run.`
        : `Entering ${mapConfig[mapId].name}.`
    );
    return true;
  };

  const handleStartMap = (): void => {
    if (!character) {
      return;
    }

    startMapRun(selectedMapTarget, character);
  };

  const handleRunAllMaps = (): void => {
    if (!character) {
      return;
    }

    const queue = buildOwnedMapRunQueue(character, selectedMapTarget);

    if (queue.length === 0) {
      setErrorMessage("You do not own any consumable maps to run.");
      return;
    }

    const [firstMapId, ...remainingQueue] = queue;
    startMapRun(firstMapId, character, remainingQueue);
  };

  const handleStartBossTier = (tier: number): void => {
    if (!character) {
      return;
    }

    const bossMapId = `bossTier${tier}`;
    const bossCleared = isBossTierCleared(character.mapProgress, tier);
    const bossRetryUnlocked = isBossTierRetryUnlocked(character.mapProgress, tier);
    const bossKeyEntry =
      character.mapProgress.consumableMaps.find((entry) => entry.mapId === bossMapId && entry.quantity > 0) ??
      null;
    const unlockedTier = character.mapProgress.highestUnlockedTier;

    if (tier > unlockedTier) {
      setErrorMessage(`That boss lair is locked. Unlock Tier ${tier} maps first.`);
      return;
    }

    if (!bossCleared && bossRetryUnlocked) {
      startMapRun(bossMapId, character);
      return;
    }

    if (!bossKeyEntry) {
      setErrorMessage(`You do not own a Tier ${tier} boss key.`);
      return;
    }

    startMapRun(bossKeyEntry.stackId, character);
  };

  const handleEnhanceSelectedMap = (): void => {
    if (!character || selectedMapTarget === "trainingGrounds") {
      return;
    }

    const selectedEntry = getOwnedMapStack(character.mapProgress, selectedMapTarget);

    if (!selectedEntry || selectedEntry.quantity <= 0) {
      setErrorMessage("You do not own that map.");
      return;
    }

    if (selectedEntry.enhancements.length >= balanceConfig.mapCrafting.maxEnhancementsPerMap) {
      setErrorMessage(`Maps can only have ${balanceConfig.mapCrafting.maxEnhancementsPerMap} enhancements.`);
      return;
    }

    const shardCost = getEnhancementShardCost(selectedEntry.enhancements.length);

    if (getCurrencyAmount(character, "mapShard") < shardCost) {
      setErrorMessage(`You need ${shardCost} Map Shards to enhance this map.`);
      return;
    }

    const rolledEnhancement = rollMapEnhancement(selectedEntry.enhancements);

    if (!rolledEnhancement) {
      setErrorMessage("No new enhancements are available for that map.");
      return;
    }

    let nextCharacter = consumeOwnedMap(character, selectedEntry.stackId);
    nextCharacter = updateCurrency(nextCharacter, "mapShard", -shardCost);
    nextCharacter = addOwnedMap(
      nextCharacter,
      selectedEntry.mapId,
      selectedEntry.tier,
      [...selectedEntry.enhancements, rolledEnhancement]
    );
    const nextSelectedEntry = getOwnedMapStackBySignature(
      nextCharacter.mapProgress,
      selectedEntry.mapId,
      selectedEntry.tier,
      [...selectedEntry.enhancements, rolledEnhancement]
    );
    const fallbackSelectedEntry =
      nextSelectedEntry ??
      nextCharacter.mapProgress.consumableMaps.find(
        (entry) =>
          entry.mapId === selectedEntry.mapId &&
          entry.tier === selectedEntry.tier &&
          entry.enhancements.length === selectedEntry.enhancements.length + 1 &&
          entry.enhancements.some((enhancement) => enhancement.id === rolledEnhancement.id)
      ) ??
      null;
    commitCharacter(nextCharacter);
    setSelectedMapTarget(
      fallbackSelectedEntry?.stackId ?? getPreferredMapSelection(nextCharacter, selectedMapTarget, selectedEntry.mapId)
    );
    void persistCharacterNow(nextCharacter, "Map enhancement save failed. Try saving manually before refreshing.");
    setStatusMessage(
      `${mapConfig[selectedEntry.mapId].name} gained ${getMapEnhancementSummary([rolledEnhancement])[0]}.`
    );
  };

  const handleCraftMapAtTier = (tier: number): void => {
    if (!character) {
      return;
    }

    const shardCost = balanceConfig.mapCrafting.shardCraftCostPerTier * tier;
    const currentShards = getCurrencyAmount(character, "mapShard");

    if (tier > character.mapProgress.highestUnlockedTier) {
      setErrorMessage(
        `Tier ${tier} maps are locked. Defeat the Tier ${Math.max(1, tier - 1)} boss first.`
      );
      return;
    }

    if (currentShards < shardCost) {
      setErrorMessage(`You need ${shardCost} Map Shards to craft a Tier ${tier} map.`);
      return;
    }

    let nextCharacter = updateCurrency(character, "mapShard", -shardCost);
    nextCharacter = addOwnedMap(nextCharacter, `tier${tier}Map`, tier);

    commitCharacter(nextCharacter);
    void persistCharacterNow(nextCharacter, "Map crafting save failed. Try saving manually before refreshing.");
    setStatusMessage(`Crafted 1 Tier ${tier} map.`);
  };

  const handleConvertShardsToMaps = (): void => {
    if (!character) {
      return;
    }

    const currentShards = getCurrencyAmount(character, "mapShard");
    const mapsToCreate = Math.floor(currentShards / balanceConfig.mapCrafting.combineShardsCost);

    if (mapsToCreate <= 0) {
      setErrorMessage(
        `You need at least ${balanceConfig.mapCrafting.combineShardsCost} Map Shards to combine them into Tier 1 maps.`
      );
      return;
    }

    let nextCharacter = updateCurrency(
      character,
      "mapShard",
      -(mapsToCreate * balanceConfig.mapCrafting.combineShardsCost)
    );

    for (let count = 0; count < mapsToCreate; count += 1) {
      nextCharacter = addOwnedMap(nextCharacter, "tier1Map", 1);
    }

    commitCharacter(nextCharacter);
    void persistCharacterNow(nextCharacter, "Map crafting save failed. Try saving manually before refreshing.");
    setStatusMessage(`Combined shards into ${mapsToCreate} Tier 1 map${mapsToCreate > 1 ? "s" : ""}.`);
  };

  return {
    startMapRun,
    handleStartMap,
    handleRunAllMaps,
    handleStartBossTier,
    handleEnhanceSelectedMap,
    handleCraftMapAtTier,
    handleConvertShardsToMaps
  };
};
