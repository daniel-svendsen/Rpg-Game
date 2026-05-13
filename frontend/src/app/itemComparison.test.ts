import { describe, expect, it } from "vitest";
import { buildItemComparison, summarizeComparison } from "./itemComparison";
import { createTestCharacter } from "../test/createTestCharacter";
import type { InventoryItem } from "../shared/types/saveTypes";

const baseItem = (overrides: Partial<InventoryItem>): InventoryItem => ({
  id: "item",
  name: "Item",
  slot: "BodyArmor",
  rarity: "Magic",
  tier: 3,
  tags: [],
  statBonuses: {},
  ...overrides
});

describe("summarizeComparison", () => {
  it("returns percentage deltas from character baseline", () => {
    const character = createTestCharacter();
    const equipped = baseItem({
      id: "equipped",
      statBonuses: { spellPowerMultiplier: 0.06, castSpeedMultiplier: 1.04, maxHealth: 20 }
    });
    const candidate = baseItem({
      id: "candidate",
      statBonuses: { spellPowerMultiplier: 0.12, castSpeedMultiplier: 1.08, maxHealth: 40 }
    });
    character.equippedItems.BodyArmor = equipped;

    const summary = summarizeComparison(character, candidate, equipped);

    expect(summary).not.toBeNull();
    expect(summary!.damagePercentDelta).toBeGreaterThan(0);
    expect(summary!.survivalPercentDelta).toBeGreaterThan(0);
  });
});

describe("buildItemComparison", () => {
  it("calculates mixed affix deltas", () => {
    const character = createTestCharacter();
    const equipped = baseItem({
      id: "equipped",
      statBonuses: { armor: 20, evasion: 16, fireResistance: 0.1 }
    });
    const candidate = baseItem({
      id: "candidate",
      statBonuses: { armor: 35, evasion: 10, fireResistance: 0.15 }
    });

    character.equippedItems.BodyArmor = equipped;

    const comparison = buildItemComparison(candidate, character, equipped);
    const byLabel = new Map(comparison.deltas.map((entry) => [entry.label, entry]));

    expect(byLabel.get("Armor")?.formattedDelta).toBe("+15");
    expect(byLabel.get("Evasion")?.formattedDelta).toBe("-6");
    expect(byLabel.get("Fire Resistance")?.formattedDelta).toBe("+5%");
  });

  it("uses neutral 1.0 baseline for cast speed multiplier deltas", () => {
    const character = createTestCharacter();
    const equipped = baseItem({
      id: "equipped",
      statBonuses: {}
    });
    const candidate = baseItem({
      id: "candidate",
      statBonuses: { castSpeedMultiplier: 1.2 }
    });

    character.equippedItems.BodyArmor = equipped;
    const comparison = buildItemComparison(candidate, character, equipped);
    const byLabel = new Map(comparison.deltas.map((entry) => [entry.label, entry]));

    expect(byLabel.get("Cast Speed")?.formattedDelta).toBe("+20%");
  });

  it("marks synergy keys from active spell and support tags", () => {
    const character = createTestCharacter();
    character.spellLoadout[0] = {
      mainSpellId: "emberBurst",
      supportSpellIds: ["fasterCasting"]
    };

    const equipped = baseItem({ id: "equipped", statBonuses: { spellPowerMultiplier: 0.06, castSpeedMultiplier: 1.04 } });
    const candidate = baseItem({ id: "candidate", statBonuses: { spellPowerMultiplier: 0.08, castSpeedMultiplier: 1.07 } });

    const comparison = buildItemComparison(candidate, character, equipped);
    const synergyLabels = comparison.deltas.filter((entry) => entry.isSynergy).map((entry) => entry.label);

    expect(synergyLabels).toContain("Spell Power");
    expect(synergyLabels).toContain("Cast Speed");
  });
});
