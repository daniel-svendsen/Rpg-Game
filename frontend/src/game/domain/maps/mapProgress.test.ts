import { describe, expect, it } from "vitest";
import { addOwnedMap, consumeOwnedMap } from "./mapProgress";
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
});
