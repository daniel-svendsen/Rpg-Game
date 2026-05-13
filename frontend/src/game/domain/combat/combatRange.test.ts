import { describe, expect, it } from "vitest";
import { createArenaRuntime, stepArenaRuntime } from "./arenaSimulation";
import { balanceConfig } from "../../config/balanceConfig";
import type { CharacterRecord } from "../../../shared/types/saveTypes";

const baseCharacter: CharacterRecord = {
  name: "Range Test",
  level: 1,
  experience: 0,
  experienceToNextLevel: 0,
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
  unlockedSpellIds: ["stormChain"],
  unlockedSupportSpellIds: [],
  spellProgress: [{ spellId: "stormChain", level: 1 }],
  spellLoadout: [{ mainSpellId: "stormChain", supportSpellIds: [] }],
  currencies: [],
  mapProgress: { highestUnlockedTier: 1, lastCompletedTier: 0, consumableMaps: [] }
};

describe("arenaSimulation combat ranges", () => {
  it("does not let the player damage enemies outside targeting range", () => {
    const runtime = createArenaRuntime(baseCharacter, "trainingGrounds");
    const enemy = runtime.enemies[0]!;
    const rangedEnemy = {
      ...enemy,
      x: runtime.playerX + balanceConfig.combat.playerTargetingRange + 40,
      y: runtime.playerY,
      movementSpeed: 0
    };

    const customRuntime = {
      ...runtime,
      enemies: [rangedEnemy],
      packs: [{ id: rangedEnemy.packId, centerX: rangedEnemy.x, centerY: rangedEnemy.y }],
      autoMove: {
        enabled: false,
        targetPackId: null,
        targetLootId: null,
        lootPauseUntilMs: 0
      },
      snapshot: {
        ...runtime.snapshot,
        enemies: [
          {
            id: rangedEnemy.id,
            packId: rangedEnemy.packId,
            x: rangedEnemy.x,
            y: rangedEnemy.y,
            health: rangedEnemy.health,
            maxHealth: rangedEnemy.maxHealth,
            rarity: rangedEnemy.rarity,
            monsterTypeId: rangedEnemy.monsterTypeId,
            damageType: rangedEnemy.damageType
          }
        ]
      }
    };

    const stepped = stepArenaRuntime(customRuntime, 1000);

    expect(stepped.enemies[0]?.health).toBe(rangedEnemy.health);
  });

  it("does not let enemies apply contact damage outside contact range", () => {
    const runtime = createArenaRuntime(baseCharacter, "trainingGrounds");
    const enemy = runtime.enemies[0]!;
    const edgeEnemy = {
      ...enemy,
      x: runtime.playerX + balanceConfig.combat.enemyContactRange + 5,
      y: runtime.playerY,
      movementSpeed: 0
    };

    const customRuntime = {
      ...runtime,
      enemies: [edgeEnemy],
      packs: [{ id: edgeEnemy.packId, centerX: edgeEnemy.x, centerY: edgeEnemy.y }],
      autoMove: {
        enabled: false,
        targetPackId: null,
        targetLootId: null,
        lootPauseUntilMs: 0
      },
      snapshot: {
        ...runtime.snapshot,
        enemies: [
          {
            id: edgeEnemy.id,
            packId: edgeEnemy.packId,
            x: edgeEnemy.x,
            y: edgeEnemy.y,
            health: edgeEnemy.health,
            maxHealth: edgeEnemy.maxHealth,
            rarity: edgeEnemy.rarity,
            monsterTypeId: edgeEnemy.monsterTypeId,
            damageType: edgeEnemy.damageType
          }
        ]
      }
    };

    const stepped = stepArenaRuntime(customRuntime, 1000);

    expect(stepped.player.currentHealth).toBe(baseCharacter.currentHealth);
  });
});

