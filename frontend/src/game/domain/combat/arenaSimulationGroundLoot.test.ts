import { describe, expect, it } from "vitest";
import type { ArenaRuntimeState } from "./arenaSimulation";
import { createArenaRuntime, getGroundLootBeam, stepArenaRuntime } from "./arenaSimulation";
import type { GroundLootState } from "../../../shared/types/saveTypes";
import { createTestCharacter } from "../../../test/createTestCharacter";

const createTestArenaCharacter = () => createTestCharacter({
  unlockedSpellIds: [],
  unlockedSupportSpellIds: [],
  spellProgress: [],
  spellLoadout: [],
  currencies: [],
  lifeFlask: { currentCharges: 0 }
});

describe("arenaSimulation ground loot", () => {
  it("marks only exceptional rares, uniques, and chase uniques for loot beams", () => {
    const rareLoot: GroundLootState = {
      id: "rare-loot",
      x: 0,
      y: 0,
      createdAtMs: 0,
      payload: {
        kind: "Item",
        item: {
          id: "rare-1",
          name: "Exceptional Oak Wand",
          slot: "Weapon",
          rarity: "Rare",
          tier: 3,
          tags: [],
          statBonuses: {}
        }
      }
    };
    const uniqueLoot: GroundLootState = {
      id: "unique-loot",
      x: 0,
      y: 0,
      createdAtMs: 0,
      payload: {
        kind: "Item",
        item: {
          id: "warlordSignet-1",
          name: "Warlord Signet",
          slot: "Ring",
          rarity: "Unique",
          tier: 1,
          tags: ["Unique"],
          statBonuses: {}
        }
      }
    };
    const chaseLoot: GroundLootState = {
      id: "chase-loot",
      x: 0,
      y: 0,
      createdAtMs: 0,
      payload: {
        kind: "Item",
        item: {
          id: "crownOfAscension-1",
          name: "Crown of Ascension",
          slot: "Helmet",
          rarity: "Unique",
          tier: 1,
          tags: ["Unique"],
          statBonuses: {}
        }
      }
    };
    const commonSpellLoot: GroundLootState = {
      id: "common-spell-loot",
      x: 0,
      y: 0,
      createdAtMs: 0,
      payload: {
        kind: "Spell",
        spellId: "glacierNova"
      }
    };
    const chaseSupportLoot: GroundLootState = {
      id: "chase-support-loot",
      x: 0,
      y: 0,
      createdAtMs: 0,
      payload: {
        kind: "Support",
        supportSpellId: "scattershotProjectiles"
      }
    };

    expect(getGroundLootBeam(rareLoot)).toBe("Rare");
    expect(getGroundLootBeam(uniqueLoot)).toBe("Unique");
    expect(getGroundLootBeam(chaseLoot)).toBe("Chase");
    expect(getGroundLootBeam(commonSpellLoot)).toBeUndefined();
    expect(getGroundLootBeam(chaseSupportLoot)).toBe("SpellChase");
  });

  it("keeps moving toward the nearest pack when no loot target exists yet", () => {
    const runtime = createArenaRuntime(createTestArenaCharacter(), "trainingGrounds");
    const enemy = runtime.enemies[0]!;
    const distantEnemy = {
      ...enemy,
      x: runtime.playerX + 700,
      y: runtime.playerY,
      movementSpeed: 0
    };

    const stepped = stepArenaRuntime(
      {
        ...runtime,
        enemies: [distantEnemy],
        packs: [{ id: distantEnemy.packId, centerX: distantEnemy.x, centerY: distantEnemy.y }],
        groundLoot: [],
        snapshot: {
          ...runtime.snapshot,
          enemies: [
            {
              id: distantEnemy.id,
              packId: distantEnemy.packId,
              x: distantEnemy.x,
              y: distantEnemy.y,
              health: distantEnemy.health,
              maxHealth: distantEnemy.maxHealth,
              rarity: distantEnemy.rarity,
              monsterTypeId: distantEnemy.monsterTypeId,
              damageType: distantEnemy.damageType
            }
          ],
          groundLoot: []
        }
      },
      1000
    );

    expect(stepped.playerX).toBeGreaterThan(runtime.playerX);
    expect(stepped.autoMove.targetPackId).toBe(distantEnemy.packId);
    expect(stepped.autoMove.targetLootId).toBeNull();
  });

  it("prioritizes nearby enemies over nearby loot while auto-moving", () => {
    const runtime = createArenaRuntime(createTestArenaCharacter(), "trainingGrounds");
    const enemy = runtime.enemies[0]!;
    const nearbyEnemy = {
      ...enemy,
      x: runtime.playerX + 300,
      y: runtime.playerY,
      movementSpeed: 0
    };
    const loot: GroundLootState = {
      id: "nearby-loot",
      x: runtime.playerX - 300,
      y: runtime.playerY,
      createdAtMs: 0,
      payload: {
        kind: "Currency",
        code: "mapShard",
        amount: 1
      }
    };

    const stepped = stepArenaRuntime(
      {
        ...runtime,
        enemies: [nearbyEnemy],
        packs: [{ id: nearbyEnemy.packId, centerX: nearbyEnemy.x, centerY: nearbyEnemy.y }],
        groundLoot: [loot],
        snapshot: {
          ...runtime.snapshot,
          enemies: [
            {
              id: nearbyEnemy.id,
              packId: nearbyEnemy.packId,
              x: nearbyEnemy.x,
              y: nearbyEnemy.y,
              health: nearbyEnemy.health,
              maxHealth: nearbyEnemy.maxHealth,
              rarity: nearbyEnemy.rarity,
              monsterTypeId: nearbyEnemy.monsterTypeId,
              damageType: nearbyEnemy.damageType
            }
          ],
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
      },
      1000
    );

    expect(stepped.playerX).toBeGreaterThan(runtime.playerX);
    expect(stepped.autoMove.targetPackId).toBe(nearbyEnemy.packId);
    expect(stepped.autoMove.targetLootId).toBeNull();
  });

  it("prioritizes distant loot over the next pack when no enemy is nearby", () => {
    const runtime = createArenaRuntime(createTestArenaCharacter(), "trainingGrounds");
    const enemy = runtime.enemies[0]!;
    const distantEnemy = {
      ...enemy,
      x: runtime.playerX + 700,
      y: runtime.playerY,
      movementSpeed: 0
    };
    const skippedLoot: GroundLootState = {
      id: "skipped-loot",
      x: runtime.playerX - 420,
      y: runtime.playerY,
      createdAtMs: -1000,
      payload: {
        kind: "Currency",
        code: "mapShard",
        amount: 1
      }
    };

    const stepped = stepArenaRuntime(
      {
        ...runtime,
        enemies: [distantEnemy],
        packs: [{ id: distantEnemy.packId, centerX: distantEnemy.x, centerY: distantEnemy.y }],
        groundLoot: [skippedLoot],
        snapshot: {
          ...runtime.snapshot,
          enemies: [
            {
              id: distantEnemy.id,
              packId: distantEnemy.packId,
              x: distantEnemy.x,
              y: distantEnemy.y,
              health: distantEnemy.health,
              maxHealth: distantEnemy.maxHealth,
              rarity: distantEnemy.rarity,
              monsterTypeId: distantEnemy.monsterTypeId,
              damageType: distantEnemy.damageType
            }
          ],
          groundLoot: [
            {
              id: skippedLoot.id,
              kind: "Currency",
              x: skippedLoot.x,
              y: skippedLoot.y,
              name: "Map Shard"
            }
          ]
        }
      },
      1000
    );

    expect(stepped.playerX).toBeLessThan(runtime.playerX);
    expect(stepped.autoMove.targetLootId).toBe(skippedLoot.id);
    expect(stepped.autoMove.targetPackId).toBeNull();
  });

  it("keeps fresh ground loot visible briefly before auto-pickup", () => {
    const runtime = createArenaRuntime(createTestArenaCharacter(), "trainingGrounds");
    const loot: GroundLootState = {
      id: "fresh-currency",
      x: runtime.playerX,
      y: runtime.playerY,
      createdAtMs: 0,
      payload: {
        kind: "Currency",
        code: "mapShard",
        amount: 1
      }
    };

    const stepped = stepArenaRuntime(
      {
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
      },
      50
    );

    expect(stepped.groundLoot).toHaveLength(1);
    expect(stepped.snapshot.groundLoot).toHaveLength(1);
    expect(stepped.snapshot.lootEvents).toHaveLength(0);
  });

  it("does not pick up aged loot until the player reaches it", () => {
    const runtime = createArenaRuntime(createTestArenaCharacter(), "trainingGrounds");
    const loot: GroundLootState = {
      id: "distant-currency",
      x: runtime.playerX + 120,
      y: runtime.playerY,
      createdAtMs: -1000,
      payload: {
        kind: "Currency",
        code: "mapShard",
        amount: 1
      }
    };

    const stepped = stepArenaRuntime(
      {
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
      },
      50
    );

    expect(stepped.groundLoot).toHaveLength(1);
    expect(stepped.snapshot.lootEvents).toHaveLength(0);
    expect(stepped.player.currencies.find((entry) => entry.code === "mapShard")).toBeUndefined();
  });

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
      createdAtMs: -1000,
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

  it("picks up Gemcutter's Prisms as currency", () => {
    const runtime = createArenaRuntime(createTestArenaCharacter(), "trainingGrounds");
    const loot: GroundLootState = {
      id: "test-gcp",
      x: runtime.playerX,
      y: runtime.playerY,
      createdAtMs: -1000,
      payload: {
        kind: "Currency",
        code: "gemcuttersPrism",
        amount: 1
      }
    };

    const stepped = stepArenaRuntime(
      {
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
              name: "Gemcutter's Prism"
            }
          ]
        }
      },
      50
    );

    expect(stepped.player.currencies.find((entry) => entry.code === "gemcuttersPrism")?.amount).toBe(1);
    expect(stepped.snapshot.lootEvents[0]?.name).toBe("Gemcutter's Prism");
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
      createdAtMs: -1000,
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


