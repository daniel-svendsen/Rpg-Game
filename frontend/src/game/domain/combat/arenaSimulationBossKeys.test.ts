import { describe, expect, it } from "vitest";
import { createArenaRuntime, stepArenaRuntime } from "./arenaSimulation";
import { createTestCharacter } from "../../../test/createTestCharacter";

describe("arenaSimulation boss keys", () => {
  it("keeps the boss key while the boss run is still in progress", () => {
    const character = createTestCharacter({
      mapProgress: {
        highestUnlockedTier: 1,
        lastCompletedTier: 0,
        consumableMaps: [
          {
            stackId: "boss-key-1",
            mapId: "bossTier1",
            tier: 1,
            quantity: 1,
            enhancements: []
          }
        ],
        bossRetryUnlockedTiers: [],
        clearedBossTiers: []
      }
    });

    const runtime = createArenaRuntime(character, "bossTier1");

    expect(runtime.player.mapProgress.consumableMaps[0]?.mapId).toBe("bossTier1");
    expect(runtime.player.mapProgress.consumableMaps[0]?.quantity).toBe(1);
    expect(runtime.snapshot.player.mapProgress.consumableMaps[0]?.quantity).toBe(1);
  });

  it("consumes one boss key on first clear and unlocks the next tier", () => {
    const character = createTestCharacter({
      mapProgress: {
        highestUnlockedTier: 1,
        lastCompletedTier: 0,
        consumableMaps: [
          {
            stackId: "boss-key-1",
            mapId: "bossTier1",
            tier: 1,
            quantity: 1,
            enhancements: []
          }
        ],
        bossRetryUnlockedTiers: [],
        clearedBossTiers: []
      }
    });

    const runtime = createArenaRuntime(character, "bossTier1");
    const clearedRuntime = {
      ...runtime,
      enemies: [],
      snapshot: { ...runtime.snapshot, enemies: [], isComplete: false }
    };

    const afterClear = stepArenaRuntime(clearedRuntime, 0);
    const completed = stepArenaRuntime(afterClear, 1000);

    expect(completed.snapshot.isComplete).toBe(true);
    expect(completed.player.mapProgress.consumableMaps.some((entry) => entry.mapId === "bossTier1")).toBe(false);
    expect(completed.player.mapProgress.clearedBossTiers ?? []).toContain(1);
    expect(completed.player.mapProgress.highestUnlockedTier).toBe(2);
    expect(
      completed.player.mapProgress.consumableMaps.find((entry) => entry.mapId === "tier2Map")?.quantity
    ).toBe(3);
  });

  it("consumes one farm key on repeat boss clears", () => {
    const character = createTestCharacter({
      mapProgress: {
        highestUnlockedTier: 2,
        lastCompletedTier: 1,
        consumableMaps: [
          {
            stackId: "boss-key-1",
            mapId: "bossTier1",
            tier: 1,
            quantity: 2,
            enhancements: []
          }
        ],
        bossRetryUnlockedTiers: [],
        clearedBossTiers: [1]
      }
    });

    const runtime = createArenaRuntime(character, "bossTier1");
    const clearedRuntime = {
      ...runtime,
      enemies: [],
      snapshot: { ...runtime.snapshot, enemies: [], isComplete: false }
    };

    const afterClear = stepArenaRuntime(clearedRuntime, 0);
    const completed = stepArenaRuntime(afterClear, 1000);

    expect(completed.snapshot.isComplete).toBe(true);
    expect(completed.player.mapProgress.clearedBossTiers ?? []).toEqual([1]);
    expect(completed.player.mapProgress.highestUnlockedTier).toBe(2);
    expect(completed.player.mapProgress.consumableMaps[0]?.mapId).toBe("bossTier1");
    expect(completed.player.mapProgress.consumableMaps[0]?.quantity).toBe(1);
  });
});
