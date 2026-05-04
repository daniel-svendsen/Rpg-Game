import type { CharacterRecord, MapProgressState, OwnedMapStack } from "../../../shared/types/saveTypes";

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

    return left.mapId.localeCompare(right.mapId);
  });

export const normalizeMapProgress = (mapProgress: Partial<MapProgressState> | undefined): MapProgressState => ({
  highestUnlockedTier: mapProgress?.highestUnlockedTier ?? 0,
  lastCompletedTier: mapProgress?.lastCompletedTier ?? 0,
  consumableMaps: sortConsumableMaps(mapProgress?.consumableMaps ?? [])
});

export const getMapQuantity = (mapProgress: MapProgressState, mapId: string): number =>
  mapProgress.consumableMaps.find((entry) => entry.mapId === mapId)?.quantity ?? 0;

const mergeMapStack = (consumableMaps: OwnedMapStack[], incoming: OwnedMapStack): OwnedMapStack[] => {
  const existing = consumableMaps.find((entry) => entry.mapId === incoming.mapId);

  if (!existing) {
    return sortConsumableMaps([...consumableMaps, incoming]);
  }

  return sortConsumableMaps(
    consumableMaps.map((entry) =>
      entry.mapId === incoming.mapId
        ? { ...entry, quantity: entry.quantity + incoming.quantity }
        : entry
    )
  );
};

export const addOwnedMap = (character: CharacterRecord, mapId: string, tier: number): CharacterRecord => {
  const normalizedMapProgress = normalizeMapProgress(character.mapProgress);

  return {
    ...character,
    mapProgress: {
      ...normalizedMapProgress,
      highestUnlockedTier: Math.max(normalizedMapProgress.highestUnlockedTier, tier),
      consumableMaps: mergeMapStack(normalizedMapProgress.consumableMaps, {
        mapId,
        tier,
        quantity: 1
      })
    }
  };
};

export const consumeOwnedMap = (character: CharacterRecord, mapId: string): CharacterRecord => {
  const normalizedMapProgress = normalizeMapProgress(character.mapProgress);

  return {
    ...character,
    mapProgress: {
      ...normalizedMapProgress,
      consumableMaps: normalizedMapProgress.consumableMaps
        .map((entry) =>
          entry.mapId === mapId ? { ...entry, quantity: entry.quantity - 1 } : entry
        )
        .filter((entry) => entry.quantity > 0)
        .sort((left, right) => {
          if (left.tier !== right.tier) {
            return left.tier - right.tier;
          }

          return left.mapId.localeCompare(right.mapId);
        })
    }
  };
};
