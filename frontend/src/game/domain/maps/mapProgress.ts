import type { CharacterRecord, MapProgressState, OwnedMapStack } from "../../../shared/types/saveTypes";
import {
  createOwnedMapStackId,
  getMapStackSignature,
  normalizeMapEnhancements
} from "./mapEnhancements";

export const createInitialMapProgress = (): MapProgressState => ({
  highestUnlockedTier: 0,
  lastCompletedTier: 0,
  consumableMaps: []
});

const sortConsumableMaps = (consumableMaps: OwnedMapStack[]): OwnedMapStack[] =>
  [...consumableMaps].sort((left, right) => {
    if (left.tier !== right.tier) {
      return left.tier - right.tier;
    }

    if (left.mapId !== right.mapId) {
      return left.mapId.localeCompare(right.mapId);
    }

    if (left.enhancements.length !== right.enhancements.length) {
      return right.enhancements.length - left.enhancements.length;
    }

    return left.stackId.localeCompare(right.stackId);
  });

const normalizeOwnedMapStack = (
  entry: Partial<OwnedMapStack> | undefined,
  index: number
): OwnedMapStack | null => {
  if (!entry?.mapId || typeof entry.tier !== "number") {
    return null;
  }

  return {
    stackId: entry.stackId ?? `legacy-map-stack-${entry.mapId}-${entry.tier}-${index}`,
    mapId: entry.mapId,
    tier: entry.tier,
    quantity: Math.max(1, entry.quantity ?? 1),
    enhancements: normalizeMapEnhancements(entry.enhancements)
  };
};

export const normalizeMapProgress = (mapProgress: Partial<MapProgressState> | undefined): MapProgressState => ({
  highestUnlockedTier: mapProgress?.highestUnlockedTier ?? 0,
  lastCompletedTier: mapProgress?.lastCompletedTier ?? 0,
  consumableMaps: sortConsumableMaps(
    (mapProgress?.consumableMaps ?? [])
      .map((entry, index) => normalizeOwnedMapStack(entry, index))
      .filter((entry): entry is OwnedMapStack => entry !== null)
  )
});

export const getMapQuantity = (mapProgress: MapProgressState, mapId: string): number =>
  mapProgress.consumableMaps
    .filter((entry) => entry.mapId === mapId)
    .reduce((total, entry) => total + entry.quantity, 0);

export const getOwnedMapStack = (mapProgress: MapProgressState, stackId: string): OwnedMapStack | null =>
  mapProgress.consumableMaps.find((entry) => entry.stackId === stackId) ?? null;

export const getOwnedMapStackBySignature = (
  mapProgress: MapProgressState,
  mapId: string,
  tier: number,
  enhancements: OwnedMapStack["enhancements"]
): OwnedMapStack | null => {
  const signature = getMapStackSignature({ mapId, tier, enhancements });
  return mapProgress.consumableMaps.find((entry) => getMapStackSignature(entry) === signature) ?? null;
};

const mergeMapStack = (consumableMaps: OwnedMapStack[], incoming: OwnedMapStack): OwnedMapStack[] => {
  const incomingSignature = getMapStackSignature(incoming);
  const existing = consumableMaps.find((entry) => getMapStackSignature(entry) === incomingSignature);

  if (!existing) {
    return sortConsumableMaps([...consumableMaps, incoming]);
  }

  return sortConsumableMaps(
    consumableMaps.map((entry) =>
      entry.stackId === existing.stackId
        ? { ...entry, quantity: entry.quantity + incoming.quantity }
        : entry
    )
  );
};

export const addOwnedMap = (
  character: CharacterRecord,
  mapId: string,
  tier: number,
  enhancements: OwnedMapStack["enhancements"] = []
): CharacterRecord => {
  const normalizedMapProgress = normalizeMapProgress(character.mapProgress);

  return {
    ...character,
    mapProgress: {
      ...normalizedMapProgress,
      highestUnlockedTier: Math.max(normalizedMapProgress.highestUnlockedTier, tier),
      consumableMaps: mergeMapStack(normalizedMapProgress.consumableMaps, {
        stackId: createOwnedMapStackId(),
        mapId,
        tier,
        quantity: 1,
        enhancements: normalizeMapEnhancements(enhancements)
      })
    }
  };
};

export const consumeOwnedMap = (character: CharacterRecord, stackId: string): CharacterRecord => {
  const normalizedMapProgress = normalizeMapProgress(character.mapProgress);

  return {
    ...character,
    mapProgress: {
      ...normalizedMapProgress,
      consumableMaps: normalizedMapProgress.consumableMaps
        .map((entry) =>
          entry.stackId === stackId ? { ...entry, quantity: entry.quantity - 1 } : entry
        )
        .filter((entry) => entry.quantity > 0)
        .sort((left, right) => {
          if (left.tier !== right.tier) {
            return left.tier - right.tier;
          }

          if (left.mapId !== right.mapId) {
            return left.mapId.localeCompare(right.mapId);
          }

          if (left.enhancements.length !== right.enhancements.length) {
            return right.enhancements.length - left.enhancements.length;
          }

          return left.stackId.localeCompare(right.stackId);
        })
    }
  };
};
