import { describe, expect, it } from "vitest";
import { addOwnedMap } from "../game/domain/maps/mapProgress";
import { createTestCharacter } from "../test/createTestCharacter";
import { createUnlockedTierSelection, getPreferredMapSelection } from "./mapFlow";

describe("mapFlow", () => {
  it("keeps an unlocked empty tier selected after the last map in that tier is consumed", () => {
    const character = createTestCharacter({
      mapProgress: {
        highestUnlockedTier: 10,
        lastCompletedTier: 9,
        consumableMaps: [],
        clearedBossTiers: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      }
    });

    expect(getPreferredMapSelection(character, "missing-stack-id", "tier10Map", 10)).toBe(
      createUnlockedTierSelection(10)
    );
  });

  it("preserves a virtual unlocked-tier selection while that tier remains unlocked", () => {
    const character = createTestCharacter({
      mapProgress: {
        highestUnlockedTier: 10,
        lastCompletedTier: 9,
        consumableMaps: [],
        clearedBossTiers: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      }
    });

    expect(getPreferredMapSelection(character, createUnlockedTierSelection(10))).toBe(
      createUnlockedTierSelection(10)
    );
  });

  it("switches a virtual unlocked-tier selection to a real stack when one exists", () => {
    let character = createTestCharacter();
    character = addOwnedMap(character, "tier10Map", 10);

    expect(getPreferredMapSelection(character, createUnlockedTierSelection(10))).toBe(
      character.mapProgress.consumableMaps[0]?.stackId
    );
  });
});
