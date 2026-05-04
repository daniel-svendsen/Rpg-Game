import { describe, expect, it } from "vitest";
import { balanceConfig } from "../../config/balanceConfig";
import { starterSupportSpellIds } from "../../config/spellConfig";
import { normalizeCharacterRecord, spendLevelStatPoint } from "./playerTypes";
import { createTestCharacter } from "../../../test/createTestCharacter";

describe("playerTypes", () => {
  it("normalizes legacy spell ids and falls back to starter supports when saved supports are invalid", () => {
    const character = createTestCharacter({
      unlockedSpellIds: ["arcBolt", "emberBurst"],
      unlockedSupportSpellIds: ["missingSupport"],
      spellProgress: [{ spellId: "arcBolt", level: 0 }],
      spellLoadout: [{ mainSpellId: "arcBolt", supportSpellIds: [] }],
      lifeFlask: { currentCharges: 999 },
      mapProgress: {
        highestUnlockedTier: 1,
        lastCompletedTier: 0,
        consumableMaps: [
          {
            stackId: "",
            mapId: "tier1Map",
            tier: 1,
            quantity: 0,
            enhancements: []
          }
        ]
      }
    });

    const normalized = normalizeCharacterRecord(character);

    expect(normalized.spellLoadout[0]?.mainSpellId).toBe("stormChain");
    expect(normalized.unlockedSupportSpellIds).toEqual([...starterSupportSpellIds]);
    expect(normalized.lifeFlask.currentCharges).toBe(balanceConfig.healing.lifeFlask.maxCharges);
    expect(normalized.mapProgress.consumableMaps[0]?.quantity).toBe(1);
  });

  it("spends a stat point and recalculates derived stats", () => {
    const character = createTestCharacter({
      baseStats: {
        strength: 1,
        agility: 0,
        vitality: 0,
        dexterity: 0
      },
      unspentStatPoints: 1
    });

    const nextCharacter = spendLevelStatPoint(character, "vitality");

    expect(nextCharacter.unspentStatPoints).toBe(0);
    expect(nextCharacter.baseStats.vitality).toBe(1);
    expect(nextCharacter.derivedStats.maxHealth).toBe(
      balanceConfig.statScaling.baseHealth + balanceConfig.statScaling.vitalityHealthMultiplier
    );
  });
});
