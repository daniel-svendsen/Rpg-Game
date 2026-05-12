import { describe, expect, it } from "vitest";
import { addOwnedMap, consumeOwnedMap, getNextUnclearedBossTier } from "./mapProgress";
import { createTestCharacter } from "../../../test/createTestCharacter";

describe("mapProgress", () => {
  it("merges duplicate map signatures into one stack and tracks unlocked tier", () => {
    let character = createTestCharacter();

    character = addOwnedMap(character, "tier2Map", 2);
    const firstStackId = character.mapProgress.consumableMaps[0]?.stackId ?? "";
    character = addOwnedMap(character, "tier2Map", 2);

    expect(character.mapProgress.highestUnlockedTier).toBe(2);
    expect(character.mapProgress.consumableMaps).toHaveLength(1);
    expect(character.mapProgress.consumableMaps[0]?.quantity).toBe(2);

    character = consumeOwnedMap(character, firstStackId);

    expect(character.mapProgress.consumableMaps).toHaveLength(1);
    expect(character.mapProgress.consumableMaps[0]?.quantity).toBe(1);
  });

  it("keeps enhanced maps in separate stacks from unmodified maps", () => {
    let character = createTestCharacter();

    character = addOwnedMap(character, "tier1Map", 1);
    character = addOwnedMap(character, "tier1Map", 1, [{ id: "overflowingSpoils" }]);

    expect(character.mapProgress.consumableMaps).toHaveLength(2);
    expect(character.mapProgress.consumableMaps.map((entry) => entry.enhancements.length)).toEqual([1, 0]);
  });

  it("returns null when every unlocked boss tier is already cleared", () => {
    const character = createTestCharacter({
      mapProgress: {
        highestUnlockedTier: 10,
        lastCompletedTier: 10,
        consumableMaps: [],
        clearedBossTiers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      }
    });

    expect(getNextUnclearedBossTier(character.mapProgress, 10)).toBeNull();
  });
});
