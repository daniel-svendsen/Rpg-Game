import { describe, expect, it } from "vitest";
import { getShopItemPrice } from "./appUiHelpers";
import type { InventoryItem } from "../shared/types/saveTypes";

const createItem = (overrides: Partial<InventoryItem>): InventoryItem => ({
  id: "item-1",
  name: "Ancient Oak Wand of the Stalwart",
  slot: "Weapon",
  rarity: "Rare",
  tier: 5,
  tags: ["SpellDamage"],
  statBonuses: {
    strength: 10,
    agility: 10,
    vitality: 12,
    dexterity: 9,
    maxHealth: 42,
    critChance: 0.08,
    spellPowerMultiplier: 0.16
  },
  ...overrides
});

describe("getShopItemPrice", () => {
  it("prices strong rares much higher than before and adds a premium for exceptional rares", () => {
    const rareItem = createItem({});
    const exceptionalRare = createItem({
      name: "Exceptional Ancient Oak Wand of the Stalwart"
    });

    expect(getShopItemPrice(rareItem)).toBeGreaterThan(1500);
    expect(getShopItemPrice(exceptionalRare)).toBeGreaterThan(getShopItemPrice(rareItem) * 2);
  });
});
