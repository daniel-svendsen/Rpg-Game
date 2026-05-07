import { describe, expect, it, vi } from "vitest";
import { createArenaRuntime } from "./arenaSimulation";
import type { CharacterRecord } from "../../../shared/types/saveTypes";

const baseCharacter: CharacterRecord = {
  name: "Test",
  level: 1,
  experience: 0,
  experienceToNextLevel: 0,
  unspentStatPoints: 0,
  baseStats: { strength: 0, agility: 0, vitality: 0, dexterity: 0 },
  derivedStats: {
    maxHealth: 100,
    castSpeedMultiplier: 1,
    attackSpeedMultiplier: 1,
    movementSpeedMultiplier: 1,
    armor: 0,
    evasion: 0,
    critChance: 0,
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

describe("arenaSimulation pack spawning", () => {
  it("keeps packs away from the player and each other", () => {
    let seed = 1337;
    const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    });

    try {
      const runtime = createArenaRuntime(baseCharacter, "trainingGrounds");
      const playerX = runtime.playerX;
      const playerY = runtime.playerY;

      runtime.packs.forEach((pack) => {
        const distToPlayer = Math.hypot(pack.centerX - playerX, pack.centerY - playerY);
        expect(distToPlayer).toBeGreaterThan(180);
      });

      for (let i = 0; i < runtime.packs.length; i += 1) {
        for (let j = i + 1; j < runtime.packs.length; j += 1) {
          const left = runtime.packs[i]!;
          const right = runtime.packs[j]!;
          const dist = Math.hypot(left.centerX - right.centerX, left.centerY - right.centerY);
          expect(dist).toBeGreaterThan(120);
        }
      }
    } finally {
      randomSpy.mockRestore();
    }
  });
});
