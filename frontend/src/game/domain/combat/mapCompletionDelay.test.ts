import { describe, expect, it } from "vitest";
import { createArenaRuntime, stepArenaRuntime } from "./arenaSimulation";
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

describe("arenaSimulation map completion delay", () => {
  it("waits briefly before marking the map complete after last kill", () => {
    const runtime = createArenaRuntime(baseCharacter, "trainingGrounds");
    const empty = {
      ...runtime,
      enemies: [],
      snapshot: { ...runtime.snapshot, enemies: [], isComplete: false }
    };

    const afterClear = stepArenaRuntime(empty, 0);
    expect(afterClear.snapshot.isComplete).toBe(false);
    expect(afterClear.completionDelayUntilMs).not.toBeNull();

    const beforeDelay = stepArenaRuntime(afterClear, 999);
    expect(beforeDelay.snapshot.isComplete).toBe(false);

    const afterDelay = stepArenaRuntime(beforeDelay, 1);
    expect(afterDelay.snapshot.isComplete).toBe(true);
  });
});

