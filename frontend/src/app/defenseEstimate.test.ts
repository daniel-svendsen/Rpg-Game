import { describe, expect, it } from "vitest";
import { createTestCharacter } from "../test/createTestCharacter";
import { getCharacterDefenseEstimate, getDefenseEstimateContext } from "./defenseEstimate";

describe("defenseEstimate", () => {
  it("uses the selected map tier when a tier map is selected", () => {
    const character = createTestCharacter({
      mapProgress: { highestUnlockedTier: 5, lastCompletedTier: 2, consumableMaps: [] }
    });

    const context = getDefenseEstimateContext(character, "tier4Map");

    expect(context.map.tier).toBe(4);
    expect(context.source).toBe("selected");
  });

  it("falls back to the recent completed tier when training grounds is selected", () => {
    const character = createTestCharacter({
      mapProgress: { highestUnlockedTier: 5, lastCompletedTier: 3, consumableMaps: [] }
    });

    const context = getDefenseEstimateContext(character, "trainingGrounds");

    expect(context.map.tier).toBe(3);
    expect(context.source).toBe("recent");
  });

  it("pairs raw defenses with estimated combat outcomes", () => {
    const character = createTestCharacter();
    const estimate = getCharacterDefenseEstimate(
      {
        ...character,
        derivedStats: {
          ...character.derivedStats,
          armor: 100,
          evasion: 400,
          resistances: {
            Fire: 0.25,
            Cold: 0.5,
            Lightning: 0
          }
        }
      },
      "tier1Map"
    );

    expect(estimate.incomingHit).toBeGreaterThan(0);
    expect(estimate.armorReduction).toBeGreaterThan(0);
    expect(estimate.evasionChance).toBe(0.4);
    expect(estimate.expectedPhysicalPrevention).toBeGreaterThan(estimate.armorReduction);
    expect(estimate.elementalDamageTaken.Cold).toBeLessThan(estimate.elementalDamageTaken.Fire);
    expect(estimate.elementalDamageTaken.Lightning).toBe(estimate.incomingHit);
  });
});

