import { describe, expect, it } from "vitest";
import type { ArenaRuntimeState } from "./arenaSimulation";
import { createArenaRuntime, stepArenaRuntime } from "./arenaSimulation";
import type { GroundLootState } from "../../../shared/types/saveTypes";

describe("arenaSimulation ground loot", () => {
  it("picks up ground loot within pickup radius and applies it to the character", () => {
    const runtime = createArenaRuntime(
      {
        name: "Test",
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        unspentStatPoints: 0,
        baseStats: { strength: 0, agility: 0, vitality: 0, dexterity: 0, intelligence: 0 },
        derivedStats: {
          maxHealth: 100,
          castSpeedMultiplier: 1,
          attackSpeedMultiplier: 1,
          movementSpeedMultiplier: 1,
          armor: 0,
          evasion: 0,
          resistances: {
            Fire: 0,
            Cold: 0,
            Lightning: 0
          },
          critChance: 0,
          critMultiplier: 1.6,
          spellPowerMultiplier: 1
        },
        currentHealth: 100,
        gold: 0,
        lifeFlask: { currentCharges: 0 },
        inventory: [],
        equippedItems: {},
        unlockedSpellIds: [],
        unlockedSupportSpellIds: [],
        spellProgress: [],
        spellLoadout: [],
        currencies: [],
        mapProgress: {
          highestUnlockedTier: 1,
          lastCompletedTier: 0,
          consumableMaps: []
        }
      },
      "trainingGrounds"
    );

    const playerX = runtime.playerX;
    const playerY = runtime.playerY;

    const loot: GroundLootState = {
      id: "test-currency",
      x: playerX,
      y: playerY,
      createdAtMs: 0,
      payload: {
        kind: "Currency",
        code: "mapShard",
        amount: 2
      }
    };

    const seededRuntime: ArenaRuntimeState = {
      ...runtime,
      enemies: [],
      packs: [],
      groundLoot: [loot],
      autoMove: {
        ...runtime.autoMove,
        enabled: false
      },
      snapshot: {
        ...runtime.snapshot,
        enemies: [],
        lootEvents: [],
        groundLoot: [
          {
            id: loot.id,
            kind: "Currency",
            x: loot.x,
            y: loot.y,
            name: "Map Shard"
          }
        ]
      }
    };

    const stepped = stepArenaRuntime(seededRuntime, 50);

    expect(stepped.groundLoot).toHaveLength(0);
    expect(stepped.snapshot.groundLoot).toHaveLength(0);
    expect(stepped.snapshot.lootEvents.some((entry) => entry.kind === "Currency")).toBe(true);
    expect(stepped.player.currencies.find((entry) => entry.code === "mapShard")?.amount).toBe(2);
  });

  it("adds a boss key to map inventory instead of a hidden retry unlock", () => {
    const runtime = createArenaRuntime(
      {
        name: "Test",
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        unspentStatPoints: 0,
        baseStats: { strength: 0, agility: 0, vitality: 0, dexterity: 0, intelligence: 0 },
        derivedStats: {
          maxHealth: 100,
          castSpeedMultiplier: 1,
          attackSpeedMultiplier: 1,
          movementSpeedMultiplier: 1,
          armor: 0,
          evasion: 0,
          resistances: {
            Fire: 0,
            Cold: 0,
            Lightning: 0
          },
          critChance: 0,
          critMultiplier: 1.6,
          spellPowerMultiplier: 1
        },
        currentHealth: 100,
        gold: 0,
        lifeFlask: { currentCharges: 0 },
        inventory: [],
        equippedItems: {},
        unlockedSpellIds: [],
        unlockedSupportSpellIds: [],
        spellProgress: [],
        spellLoadout: [],
        currencies: [],
        mapProgress: {
          highestUnlockedTier: 1,
          lastCompletedTier: 0,
          consumableMaps: [],
          clearedBossTiers: []
        }
      },
      "trainingGrounds"
    );

    const loot: GroundLootState = {
      id: "test-boss-key",
      x: runtime.playerX,
      y: runtime.playerY,
      createdAtMs: 0,
      payload: {
        kind: "Map",
        mapId: "bossTier1",
        tier: 1
      }
    };

    const seededRuntime: ArenaRuntimeState = {
      ...runtime,
      enemies: [],
      packs: [],
      groundLoot: [loot],
      autoMove: {
        ...runtime.autoMove,
        enabled: false
      },
      snapshot: {
        ...runtime.snapshot,
        enemies: [],
        lootEvents: [],
        groundLoot: [
          {
            id: loot.id,
            kind: "Map",
            x: loot.x,
            y: loot.y,
            name: "Boss Key (Tier 1)"
          }
        ]
      }
    };

    const stepped = stepArenaRuntime(seededRuntime, 50);

    expect(stepped.player.mapProgress.consumableMaps).toHaveLength(1);
    expect(stepped.player.mapProgress.consumableMaps[0]?.mapId).toBe("bossTier1");
    expect(stepped.player.mapProgress.consumableMaps[0]?.quantity).toBe(1);
    expect(stepped.player.mapProgress.clearedBossTiers ?? []).toEqual([]);
  });
});


