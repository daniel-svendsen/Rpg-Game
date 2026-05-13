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
        dexterity: 0,
        intelligence: 0
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

  it("keeps unique item fields and reapplies unique equipment modifiers during normalization", () => {
    const character = createTestCharacter({
      currentHealth: 150,
      derivedStats: {
        maxHealth: 150,
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
      equippedItems: {
        BodyArmor: {
          id: "unique-body-1",
          name: "Titan Carapace",
          slot: "BodyArmor",
          rarity: "Unique",
          tier: 4,
          tags: ["Physical", "Unique"],
          uniqueEffectId: "titanCarapace",
          uniqueEffectDescription: "You take 14% less contact damage and gain +18% max life.",
          statBonuses: {
            vitality: 6,
            maxHealth: 24
          }
        }
      }
    });

    const normalized = normalizeCharacterRecord(character);

    expect(normalized.equippedItems.BodyArmor?.uniqueEffectId).toBe("titanCarapace");
    expect(normalized.equippedItems.BodyArmor?.uniqueEffectDescription).toContain("14% less contact damage");
    expect(normalized.derivedStats.maxHealth).toBeGreaterThan(character.derivedStats.maxHealth);
  });

  it("deduplicates linked supports in spell loadout during normalization", () => {
    const character = createTestCharacter({
      spellLoadout: [
        {
          mainSpellId: "stormChain",
          supportSpellIds: ["moreDamage", "moreDamage"]
        }
      ]
    });

    const normalized = normalizeCharacterRecord(character);

    expect(normalized.spellLoadout[0]?.supportSpellIds).toEqual(["moreDamage"]);
  });

  it("defaults missing intelligence on legacy characters to prevent NaN derived stats", () => {
    const legacyCharacter = createTestCharacter({
      baseStats: ({
        strength: 2,
        agility: 1,
        vitality: 3,
        dexterity: 4
      } as any)
    });

    const normalized = normalizeCharacterRecord(legacyCharacter);

    expect(normalized.baseStats.intelligence).toBe(0);
    expect(Number.isFinite(normalized.derivedStats.castSpeedMultiplier)).toBe(true);
    expect(Number.isFinite(normalized.derivedStats.spellPowerMultiplier)).toBe(true);
  });
});
