import { describe, expect, it } from "vitest";
import type { InventoryItem } from "../../../shared/types/saveTypes";
import { createTestCharacter } from "../../../test/createTestCharacter";
import { getPowerChangeForCharacterItem } from "./itemPower";

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

describe("getPowerChangeForCharacterItem", () => {
  it("counts multiplier stats from a neutral 1.0 baseline", () => {
    const character = createTestCharacter();
    const equipped = baseItem({
      id: "equipped",
      statBonuses: { strength: 7 }
    });
    const candidate = baseItem({
      id: "candidate",
      statBonuses: { castSpeedMultiplier: 1.1, spellPowerMultiplier: 0.04 }
    });

    character.equippedItems.BodyArmor = equipped;

    expect(getPowerChangeForCharacterItem(character, candidate)).toBeGreaterThan(0);
  });
});
