import { describe, expect, it } from "vitest";
import { createArenaRuntime, stepArenaRuntime } from "./arenaSimulation";
import { balanceConfig } from "../../config/balanceConfig";
import type { CharacterRecord } from "../../../shared/types/saveTypes";

const baseCharacter: CharacterRecord = {
  name: "Test",
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
  unlockedSpellIds: [],
  unlockedSupportSpellIds: [],
  spellProgress: [],
  spellLoadout: [],
  currencies: [],
  mapProgress: { highestUnlockedTier: 1, lastCompletedTier: 0, consumableMaps: [] }
};

describe("arenaSimulation enemy aggro radius", () => {
  it("does not move enemies outside aggro radius", () => {
    const runtime = createArenaRuntime(baseCharacter, "trainingGrounds");
    expect(runtime.enemies.length).toBeGreaterThan(0);

    const farthest = runtime.enemies
      .map((enemy) => ({ enemy, dist: Math.hypot(enemy.x - runtime.playerX, enemy.y - runtime.playerY) }))
      .sort((left, right) => right.dist - left.dist)[0]!;

    expect(farthest.dist).toBeGreaterThan(balanceConfig.combat.enemyAggroRadius);

    const stepped = stepArenaRuntime(runtime, 1000);
    const steppedEnemy = stepped.enemies.find((enemy) => enemy.id === farthest.enemy.id);
    expect(steppedEnemy).toBeDefined();

    expect(steppedEnemy!.x).toBeCloseTo(farthest.enemy.x);
    expect(steppedEnemy!.y).toBeCloseTo(farthest.enemy.y);
  });
});


