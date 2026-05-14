import type { Dispatch, SetStateAction } from "react";
import { balanceConfig } from "../game/config/balanceConfig";
import { getEnhancementShardCost } from "../game/config/balance";
import { mapConfig } from "../game/config/mapConfig";
import {
  addOwnedMap,
  consumeOwnedMap,
  getOwnedMapStack,
  getOwnedMapStackBySignature
} from "../game/domain/maps/mapProgress";
import { getMapEnhancementSummary, rollMapEnhancement } from "../game/domain/maps/mapEnhancements";
import type { CharacterRecord } from "../shared/types/saveTypes";
import type { SelectedMapTarget } from "./appTypes";
import {
  createUnlockedTierSelection,
  getCurrencyAmount,
  getPreferredMapSelection,
  updateCurrency
} from "./mapFlow";

interface UseMapCraftingParams {
  character: CharacterRecord | null;
  selectedMapTarget: SelectedMapTarget;
  commitCharacter: (nextCharacter: CharacterRecord | null) => void;
  persistCharacterNow: (nextCharacter: CharacterRecord, failureMessage: string) => Promise<void>;
  setSelectedMapTarget: Dispatch<SetStateAction<SelectedMapTarget>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
}

export const useMapCrafting = ({
  character,
  selectedMapTarget,
  commitCharacter,
  persistCharacterNow,
  setSelectedMapTarget,
  setStatusMessage,
  setErrorMessage
}: UseMapCraftingParams) => {
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
    const craftedEntry = getOwnedMapStackBySignature(nextCharacter.mapProgress, `tier${tier}Map`, tier, []);

    commitCharacter(nextCharacter);
    setSelectedMapTarget(craftedEntry?.stackId ?? createUnlockedTierSelection(tier));
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
    handleEnhanceSelectedMap,
    handleCraftMapAtTier,
    handleConvertShardsToMaps
  };
};
