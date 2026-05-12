import { getMapEnhancementDefinition } from "../game/config/balance";
import { mapConfig } from "../game/config/mapConfig";
import type { CharacterRecord, MapEnhancementInstance } from "../shared/types/saveTypes";
import { getOwnedMapStack } from "../game/domain/maps/mapProgress";
import type { SelectedMapTarget } from "./appTypes";

const unlockedTierSelectionPrefix = "unlocked-tier:";

export const createUnlockedTierSelection = (tier: number): SelectedMapTarget =>
  `${unlockedTierSelectionPrefix}${tier}`;

export const getUnlockedTierSelection = (target: SelectedMapTarget): number | null => {
  if (!target.startsWith(unlockedTierSelectionPrefix)) {
    return null;
  }

  const parsedTier = Number.parseInt(target.slice(unlockedTierSelectionPrefix.length), 10);
  return Number.isInteger(parsedTier) && parsedTier > 0 ? parsedTier : null;
};

export const getCurrencyAmount = (character: CharacterRecord, code: string): number =>
  character.currencies.find((entry) => entry.code === code)?.amount ?? 0;

export const updateCurrency = (character: CharacterRecord, code: string, delta: number): CharacterRecord => {
  const existing = character.currencies.find((entry) => entry.code === code);

  if (!existing && delta <= 0) {
    return character;
  }

  if (!existing) {
    return {
      ...character,
      currencies: [...character.currencies, { code, amount: delta }]
    };
  }

  return {
    ...character,
    currencies: character.currencies
      .map((entry) => (entry.code === code ? { ...entry, amount: entry.amount + delta } : entry))
      .filter((entry) => entry.amount > 0)
  };
};

export const buildOwnedMapRunQueue = (
  character: CharacterRecord,
  selectedMapStackId: SelectedMapTarget
): string[] => {
  if (selectedMapStackId === "trainingGrounds") {
    return [];
  }

  const selectedEntry = getOwnedMapStack(character.mapProgress, selectedMapStackId);

  if (!selectedEntry) {
    return [];
  }

  const selectedTier = selectedEntry.tier;
  const sortedEntries = [...character.mapProgress.consumableMaps]
    .filter((entry) => entry.tier === selectedTier)
    .sort((left, right) => {
      if (left.stackId === selectedMapStackId && right.stackId !== selectedMapStackId) {
        return -1;
      }

      if (right.stackId === selectedMapStackId && left.stackId !== selectedMapStackId) {
        return 1;
      }

      if (left.mapId !== right.mapId) {
        return (mapConfig[left.mapId]?.name ?? left.mapId).localeCompare(mapConfig[right.mapId]?.name ?? right.mapId);
      }

      if (left.enhancements.length !== right.enhancements.length) {
        return left.enhancements.length - right.enhancements.length;
      }

      return (mapConfig[left.mapId]?.name ?? left.mapId).localeCompare(mapConfig[right.mapId]?.name ?? right.mapId);
    });

  return sortedEntries.flatMap((entry) => Array.from({ length: entry.quantity }, () => entry.stackId));
};

export const getPreferredMapSelection = (
  character: CharacterRecord,
  previousTarget: SelectedMapTarget,
  preferredMapId?: string,
  preferredTier?: number
): SelectedMapTarget => {
  if (previousTarget === "trainingGrounds") {
    return character.mapProgress.consumableMaps[0]?.stackId ?? "trainingGrounds";
  }

  const selectedUnlockedTier = getUnlockedTierSelection(previousTarget);

  if (selectedUnlockedTier !== null) {
    if (selectedUnlockedTier > character.mapProgress.highestUnlockedTier) {
      return character.mapProgress.consumableMaps[0]?.stackId ?? "trainingGrounds";
    }

    const matchingTierEntry = character.mapProgress.consumableMaps.find((entry) => entry.tier === selectedUnlockedTier);
    return matchingTierEntry?.stackId ?? createUnlockedTierSelection(selectedUnlockedTier);
  }

  if (getOwnedMapStack(character.mapProgress, previousTarget)) {
    return previousTarget;
  }

  const matchingMapEntry = preferredMapId
    ? character.mapProgress.consumableMaps.find((entry) => entry.mapId === preferredMapId)
    : null;
  const matchingTierEntry = preferredTier
    ? character.mapProgress.consumableMaps.find((entry) => entry.tier === preferredTier)
    : null;

  if (!matchingMapEntry && !matchingTierEntry && preferredTier && preferredTier <= character.mapProgress.highestUnlockedTier) {
    return createUnlockedTierSelection(preferredTier);
  }

  return matchingMapEntry?.stackId ?? matchingTierEntry?.stackId ?? character.mapProgress.consumableMaps[0]?.stackId ?? "trainingGrounds";
};

export const getMapVariantLabel = (enhancementCount: number): string =>
  enhancementCount === 0 ? "Unmodified" : `Modified +${enhancementCount}`;

export const getMapDisplayName = (mapId: string, enhancementCount: number): string => {
  if (mapId.startsWith("bossTier")) {
    const tier = mapConfig[mapId]?.tier ?? 0;
    return `Boss Key (Tier ${tier})`;
  }

  const baseName = mapConfig[mapId]?.name ?? mapId;
  return enhancementCount === 0 ? baseName : `${baseName} of Alteration`;
};

export const getMapEnhancementDetailLines = (enhancements: MapEnhancementInstance[]): string[] =>
  enhancements.flatMap((enhancement) => {
    const definition = getMapEnhancementDefinition(enhancement.id);
    return [`Reward: ${definition.rewardText}`, `Danger: ${definition.dangerText}`];
  });
