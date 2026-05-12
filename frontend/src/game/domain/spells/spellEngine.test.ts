import { describe, expect, it } from "vitest";
import { itemBalance } from "../../config/balance/itemBalance";
import { applyEquipmentState } from "../player/equipment";
import { createTestCharacter } from "../../../test/createTestCharacter";
import { resolveSpell } from "./spellEngine";

const buildEquippedUniqueCharacter = (itemId: string, includeUniqueEffect = true) => {
  const definition = itemBalance.uniqueItems.find((entry) => entry.id === itemId);

  if (!definition) {
    throw new Error(`Missing unique item definition for ${itemId}`);
  }

  const slot = definition.slot === "Ring" ? "Ring1" : definition.slot;
  const item = {
    id: `${definition.id}-test`,
    name: definition.name,
    slot: definition.slot,
    rarity: "Unique" as const,
    tier: definition.minTier,
    tags: definition.tags,
    uniqueEffectId: includeUniqueEffect ? definition.uniqueEffectId : undefined,
    uniqueEffectDescription: includeUniqueEffect ? definition.uniqueEffectDescription : undefined,
    statBonuses: definition.statBonuses
  };

  return applyEquipmentState(
    createTestCharacter({
      equippedItems: {
        [slot]: item
      }
    })
  );
};

describe("spellEngine unique item effects", () => {
  it("keeps combat-visible effect ids on the new boss uniques", () => {
    const expectedEffectIds = {
      crownOfAscension: "crownOfAscension",
      pyrelordCrown: "pyrelordCrown",
      winterwakeDiadem: "winterwakeDiadem",
      stormfangRing: "stormfangRing",
      tempestHelm: "tempestHelm",
      throneOfRuin: "throneOfRuin"
    } as const;

    Object.entries(expectedEffectIds).forEach(([itemId, effectId]) => {
      const definition = itemBalance.uniqueItems.find((entry) => entry.id === itemId);

      expect(definition?.uniqueEffectId).toBe(effectId);
      expect(definition?.uniqueEffectDescription?.length ?? 0).toBeGreaterThan(0);
    });
  });

  it("makes Crown of Ascension visibly alter projectile spell behavior", () => {
    const withEffect = buildEquippedUniqueCharacter("crownOfAscension", true);
    const withoutEffect = buildEquippedUniqueCharacter("crownOfAscension", false);

    const withResolved = resolveSpell(withEffect, "arcLance", []);
    const withoutResolved = resolveSpell(withoutEffect, "arcLance", []);

    expect(withResolved.projectileCount).toBe(withoutResolved.projectileCount + 1);
    expect(withResolved.cooldownMs).toBeLessThan(withoutResolved.cooldownMs);
  });

  it("makes Pyrelord Crown visibly enlarge fire area spells", () => {
    const withEffect = buildEquippedUniqueCharacter("pyrelordCrown", true);
    const withoutEffect = buildEquippedUniqueCharacter("pyrelordCrown", false);

    const withResolved = resolveSpell(withEffect, "ashenOrbit", []);
    const withoutResolved = resolveSpell(withoutEffect, "ashenOrbit", []);

    expect(withResolved.areaRadius).toBe(withoutResolved.areaRadius + 26);
    expect(withResolved.cooldownMs).toBeLessThan(withoutResolved.cooldownMs);
  });

  it("makes Winterwake Diadem visibly enlarge cold area spells", () => {
    const withEffect = buildEquippedUniqueCharacter("winterwakeDiadem", true);
    const withoutEffect = buildEquippedUniqueCharacter("winterwakeDiadem", false);

    const withResolved = resolveSpell(withEffect, "glacierNova", []);
    const withoutResolved = resolveSpell(withoutEffect, "glacierNova", []);

    expect(withResolved.areaRadius).toBe(withoutResolved.areaRadius + 30);
    expect(withResolved.cooldownMs).toBeLessThan(withoutResolved.cooldownMs);
  });

  it("makes Stormfang Ring visibly extend lightning chains", () => {
    const withEffect = buildEquippedUniqueCharacter("stormfangRing", true);
    const withoutEffect = buildEquippedUniqueCharacter("stormfangRing", false);

    const withResolved = resolveSpell(withEffect, "stormChain", []);
    const withoutResolved = resolveSpell(withoutEffect, "stormChain", []);

    expect(withResolved.chainCount).toBe(withoutResolved.chainCount + 1);
    expect(withResolved.chainRange).toBe(withoutResolved.chainRange + 60);
  });

  it("makes Tempest Helm visibly alter lightning projectile spell behavior", () => {
    const withEffect = buildEquippedUniqueCharacter("tempestHelm", true);
    const withoutEffect = buildEquippedUniqueCharacter("tempestHelm", false);

    const withResolved = resolveSpell(withEffect, "stormChain", []);
    const withoutResolved = resolveSpell(withoutEffect, "stormChain", []);

    expect(withResolved.projectileCount).toBe(withoutResolved.projectileCount + 1);
    expect(withResolved.cooldownMs).toBeLessThan(withoutResolved.cooldownMs);
  });

  it("makes Throne of Ruin visibly amplify projectile spells", () => {
    const withEffect = buildEquippedUniqueCharacter("throneOfRuin", true);
    const withoutEffect = buildEquippedUniqueCharacter("throneOfRuin", false);

    const withResolved = resolveSpell(withEffect, "arcLance", []);
    const withoutResolved = resolveSpell(withoutEffect, "arcLance", []);

    expect(withResolved.projectileCount).toBe(withoutResolved.projectileCount + 1);
    expect(withResolved.damage).toBeGreaterThan(withoutResolved.damage);
    expect(withResolved.critChance).toBeGreaterThan(withoutResolved.critChance);
    expect(withResolved.resistancePenetration.Lightning).toBeGreaterThan(
      withoutResolved.resistancePenetration.Lightning
    );
  });
});
