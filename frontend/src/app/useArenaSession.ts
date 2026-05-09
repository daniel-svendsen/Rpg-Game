import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { balanceConfig } from "../game/config/balanceConfig";
import { mapConfig } from "../game/config/mapConfig";
import { createArenaRuntime, stepArenaRuntime, type ArenaRuntimeState } from "../game/domain/combat/arenaSimulation";
import { consumeOwnedMap, getOwnedMapStack } from "../game/domain/maps/mapProgress";
import { normalizeCharacterRecord } from "../game/domain/player/playerTypes";
import type { ArenaSnapshot, CharacterRecord, LootEntry, MapEnhancementInstance } from "../shared/types/saveTypes";
import type { RunSummaryData, ScreenMode } from "./appTypes";
import {
  shouldSyncArenaCharacter,
  shouldSyncArenaSnapshot
} from "./arenaSessionTiming";

interface UseArenaSessionParams {
  screenMode: ScreenMode;
  character: CharacterRecord | null;
  activeMapId: string | null;
  activeMapEnhancements: MapEnhancementInstance[];
  activeMapRunId: number;
  arenaRuntimeRef: MutableRefObject<ArenaRuntimeState | null>;
  queuedMapIdsRef: MutableRefObject<string[]>;
  commitCharacter: (nextCharacter: CharacterRecord | null) => void;
  setRecentLoot: Dispatch<SetStateAction<LootEntry[]>>;
  setArenaSnapshot: Dispatch<SetStateAction<ArenaSnapshot | null>>;
  setQueuedMapIds: Dispatch<SetStateAction<string[]>>;
  setActiveMapId: Dispatch<SetStateAction<string | null>>;
  setActiveMapEnhancements: Dispatch<SetStateAction<MapEnhancementInstance[]>>;
  setActiveMapRunId: Dispatch<SetStateAction<number>>;
  setScreenMode: Dispatch<SetStateAction<ScreenMode>>;
  setRunSummaryData: Dispatch<SetStateAction<RunSummaryData | null>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
}

export const useArenaSession = ({
  screenMode,
  character,
  activeMapId,
  activeMapEnhancements,
  activeMapRunId,
  arenaRuntimeRef,
  queuedMapIdsRef,
  commitCharacter,
  setRecentLoot,
  setArenaSnapshot,
  setQueuedMapIds,
  setActiveMapId,
  setActiveMapEnhancements,
  setActiveMapRunId,
  setScreenMode,
  setRunSummaryData,
  setStatusMessage,
  setErrorMessage
}: UseArenaSessionParams): void => {
  useEffect(() => {
    if (screenMode !== "arena" || !character || !activeMapId) {
      return;
    }

    let animationFrame = 0;
    // Anchor the run to the character state at map start. During combat we keep
    // mutating player state, so this effect must not restart on each character update.
    let runtime = createArenaRuntime(character, activeMapId, activeMapEnhancements);
    arenaRuntimeRef.current = runtime;
    let lastTimestamp = performance.now();
    let lastSnapshotUpdateAt = 0;
    let lastCharacterSyncAt = 0;
    const lootThisRun: LootEntry[] = [];

    const loop = (timestamp: number) => {
      const deltaMs = Math.min(50, timestamp - lastTimestamp);
      lastTimestamp = timestamp;
      runtime = stepArenaRuntime(arenaRuntimeRef.current ?? runtime, deltaMs);
      arenaRuntimeRef.current = runtime;

      if (runtime.snapshot.lootEvents.length > 0) {
        lootThisRun.push(...runtime.snapshot.lootEvents);
        setRecentLoot((current) => [...runtime.snapshot.lootEvents, ...current].slice(0, 20));
      }

      const hasSpellEvents = runtime.snapshot.spellEvents.length > 0;
      if (hasSpellEvents || shouldSyncArenaSnapshot(timestamp, lastSnapshotUpdateAt) || runtime.snapshot.isComplete) {
        setArenaSnapshot(runtime.snapshot);
        lastSnapshotUpdateAt = timestamp;
      }

      if (shouldSyncArenaCharacter(timestamp, lastCharacterSyncAt) || runtime.snapshot.isComplete) {
        commitCharacter(runtime.snapshot.player);
        lastCharacterSyncAt = timestamp;
      }

      if (runtime.snapshot.isComplete || runtime.snapshot.player.currentHealth <= 0) {
        setArenaSnapshot(runtime.snapshot);
        commitCharacter(runtime.snapshot.player);

        const wasDefeated = runtime.snapshot.player.currentHealth <= 0;
        const nextQueuedMapIds = queuedMapIdsRef.current;

        if (!wasDefeated && nextQueuedMapIds.length > 0) {
          const [nextMapStackId, ...remainingQueue] = nextQueuedMapIds;
          const nextCharacter = normalizeCharacterRecord(runtime.snapshot.player);
          let preparedCharacter = nextCharacter;

          if (balanceConfig.healing.refillToFullOnMapStart) {
            preparedCharacter = {
              ...preparedCharacter,
              currentHealth: preparedCharacter.derivedStats.maxHealth,
              lifeFlask: {
                currentCharges: balanceConfig.healing.lifeFlask.maxCharges
              }
            };
          }

          const nextMapStack = getOwnedMapStack(preparedCharacter.mapProgress, nextMapStackId);

          if (nextMapStack && nextMapStack.quantity > 0) {
            preparedCharacter = consumeOwnedMap(preparedCharacter, nextMapStackId);
            commitCharacter(preparedCharacter);
            setQueuedMapIds(remainingQueue);
            setActiveMapId(nextMapStack.mapId);
            setActiveMapEnhancements(nextMapStack.enhancements);
            setActiveMapRunId((current) => current + 1);
            setArenaSnapshot(null);
            setErrorMessage(null);
            setScreenMode("arena");
            setStatusMessage(
              `Entering ${mapConfig[nextMapStack.mapId].name}. ${remainingQueue.length} map${remainingQueue.length === 1 ? "" : "s"} queued after this run.`
            );
            return;
          }
        }

        setQueuedMapIds([]);
        setRunSummaryData({
          mapName: runtime.snapshot.mapName,
          wasDefeated,
          loot: lootThisRun,
        });
        setScreenMode("runSummary");
        setActiveMapId(null);
        setActiveMapEnhancements([]);
        return;
      }

      animationFrame = requestAnimationFrame(loop);
    };

    setArenaSnapshot(runtime.snapshot);
    animationFrame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrame);
  }, [
    screenMode,
    activeMapId,
    activeMapEnhancements,
    activeMapRunId,
    arenaRuntimeRef,
    queuedMapIdsRef,
    commitCharacter,
    setRecentLoot,
    setArenaSnapshot,
    setQueuedMapIds,
    setActiveMapId,
    setActiveMapEnhancements,
    setActiveMapRunId,
    setScreenMode,
    setRunSummaryData,
    setStatusMessage,
    setErrorMessage
  ]);
};
