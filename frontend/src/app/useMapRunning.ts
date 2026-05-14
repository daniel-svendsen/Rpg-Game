import type { Dispatch, SetStateAction } from "react";
import { balanceConfig } from "../game/config/balanceConfig";
import { mapConfig } from "../game/config/mapConfig";
import {
  consumeOwnedMap,
  getOwnedMapStack,
  getOwnedMapStackByMapId
} from "../game/domain/maps/mapProgress";
import { normalizeCharacterRecord } from "../game/domain/player/playerTypes";
import type { ArenaSnapshot, CharacterRecord, MapEnhancementInstance } from "../shared/types/saveTypes";
import type { RunBatchState, ScreenMode, SelectedMapTarget } from "./appTypes";
import {
  buildOwnedMapRunQueue,
  getPreferredMapSelection,
  getUnlockedTierSelection
} from "./mapFlow";

interface UseMapRunningParams {
  character: CharacterRecord | null;
  selectedMapTarget: SelectedMapTarget;
  commitCharacter: (nextCharacter: CharacterRecord | null) => void;
  setQueuedMapIds: Dispatch<SetStateAction<string[]>>;
  setActiveMapId: Dispatch<SetStateAction<string | null>>;
  setActiveMapEnhancements: Dispatch<SetStateAction<MapEnhancementInstance[]>>;
  setActiveMapRunId: Dispatch<SetStateAction<number>>;
  setActiveRunBatch: Dispatch<SetStateAction<RunBatchState | null>>;
  setArenaSnapshot: Dispatch<SetStateAction<ArenaSnapshot | null>>;
  setSelectedMapTarget: Dispatch<SetStateAction<SelectedMapTarget>>;
  setScreenMode: Dispatch<SetStateAction<ScreenMode>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
}

export const useMapRunning = ({
  character,
  selectedMapTarget,
  commitCharacter,
  setQueuedMapIds,
  setActiveMapId,
  setActiveMapEnhancements,
  setActiveMapRunId,
  setActiveRunBatch,
  setArenaSnapshot,
  setSelectedMapTarget,
  setScreenMode,
  setStatusMessage,
  setErrorMessage
}: UseMapRunningParams) => {
  const startMapRun = (
    mapTarget: SelectedMapTarget,
    sourceCharacter: CharacterRecord,
    remainingQueue: string[] = [],
    runBatch: RunBatchState | null = null
  ): boolean => {
    let nextCharacter = normalizeCharacterRecord(sourceCharacter);
    const selectedUnlockedTier = getUnlockedTierSelection(mapTarget);
    const ownedMapStack =
      mapTarget !== "trainingGrounds" && selectedUnlockedTier === null
        ? getOwnedMapStack(nextCharacter.mapProgress, mapTarget)
        : null;
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
        setErrorMessage("You do not own that map.");
        return false;
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

      if (ownedMapStack && !isBossMap) {
        nextCharacter = consumeOwnedMap(nextCharacter, mapTarget);
        setSelectedMapTarget(getPreferredMapSelection(nextCharacter, mapTarget, ownedMapStack.mapId, ownedMapStack.tier));
      }
    }

    commitCharacter(nextCharacter);
    setQueuedMapIds(remainingQueue);
    setActiveMapId(mapId);
    setActiveMapEnhancements(mapEnhancements);
    setActiveMapRunId((current) => current + 1);
    setActiveRunBatch(runBatch);
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
    startMapRun(firstMapId, character, remainingQueue, {
      totalMaps: queue.length,
      completedMaps: 0,
      loot: []
    });
  };

  const handleStartBossTier = (tier: number): void => {
    if (!character) {
      return;
    }

    const bossMapId = `bossTier${tier}`;
    const bossKeyEntry = getOwnedMapStackByMapId(character.mapProgress, bossMapId);
    const unlockedTier = character.mapProgress.highestUnlockedTier;

    if (tier > unlockedTier) {
      setErrorMessage(`That boss lair is locked. Unlock Tier ${tier} maps first.`);
      return;
    }

    if (!bossKeyEntry) {
      setErrorMessage(`You do not own a Tier ${tier} boss key.`);
      return;
    }

    startMapRun(bossKeyEntry.stackId, character);
  };

  return {
    startMapRun,
    handleStartMap,
    handleRunAllMaps,
    handleStartBossTier
  };
};
