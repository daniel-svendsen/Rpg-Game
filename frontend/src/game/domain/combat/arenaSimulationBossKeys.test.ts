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

  it("adds a tier 10 boss key to inventory after killing a tier 10 guardian", () => {
    const character = createTestCharacter({
      mapProgress: {
        highestUnlockedTier: 10,
        lastCompletedTier: 9,
        consumableMaps: [],
        clearedBossTiers: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      }
    });

    const runtime = createArenaRuntime(character, "tier10Map");
    const guardian = {
      ...runtime.enemies[0]!,
      health: 1,
      maxHealth: 1,
      rarity: "Rare" as const,
      isKeyGuardian: true,
      x: runtime.playerX,
      y: runtime.playerY
    };

    const seededRuntime = {
      ...runtime,
      enemies: [guardian],
      packs: runtime.packs.filter((pack) => pack.id === guardian.packId),
      snapshot: {
        ...runtime.snapshot,
        enemies: [
          {
            id: guardian.id,
            packId: guardian.packId,
            x: guardian.x,
            y: guardian.y,
            health: guardian.health,
            maxHealth: guardian.maxHealth,
            rarity: guardian.rarity,
            monsterTypeId: guardian.monsterTypeId,
            damageType: guardian.damageType
          }
        ],
        lootEvents: [],
        groundLoot: []
      }
    };

    const afterKill = stepArenaRuntime(seededRuntime, 50);
    const afterPickup = stepArenaRuntime(afterKill, 50);

    expect(afterKill.groundLoot.some((entry) => entry.payload.kind === "Map" && entry.payload.mapId === "bossTier10")).toBe(true);
    expect(afterPickup.player.mapProgress.consumableMaps.find((entry) => entry.mapId === "bossTier10")?.quantity).toBe(1);
    expect(afterPickup.snapshot.lootEvents.some((entry) => entry.kind === "Map" && entry.name === "Boss Key (Tier 10)")).toBe(true);
    expect(afterPickup.telemetry.guardianKilled).toBe(true);
  });
});
