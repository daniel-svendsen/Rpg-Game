export type CraftingOrbId =
  | "orbOfAwakening"
  | "orbOfAscension"
  | "orbOfUnmaking"
  | "orbOfUnraveling";

export type CraftingCurrencyCode = "craftingShard" | CraftingOrbId;

export interface CraftingOrbDefinition {
  id: CraftingOrbId;
  currencyCode: CraftingCurrencyCode;
  name: string;
  description: string;
}

export interface CraftingRecipe {
  outputCode: CraftingCurrencyCode;
  outputAmount: number;
  inputs: Array<{ code: CraftingCurrencyCode; amount: number }>;
}

export const craftingOrbs: Record<CraftingOrbId, CraftingOrbDefinition> = {
  orbOfAwakening: {
    id: "orbOfAwakening",
    currencyCode: "orbOfAwakening",
    name: "Orb of Awakening",
    description: "Upgrades a Normal item to Magic and adds one affix."
  },
  orbOfAscension: {
    id: "orbOfAscension",
    currencyCode: "orbOfAscension",
    name: "Orb of Ascension",
    description: "Upgrades a Magic item to Rare and adds one affix. Also adds one affix to a Rare item if it has room."
  },
  orbOfUnmaking: {
    id: "orbOfUnmaking",
    currencyCode: "orbOfUnmaking",
    name: "Orb of Unmaking",
    description: "Removes a random prefix from an item."
  },
  orbOfUnraveling: {
    id: "orbOfUnraveling",
    currencyCode: "orbOfUnraveling",
    name: "Orb of Unraveling",
    description: "Removes a random suffix from an item."
  }
};

export const craftingRecipes: CraftingRecipe[] = [
  {
    outputCode: "orbOfAwakening",
    outputAmount: 1,
    inputs: [{ code: "craftingShard", amount: 3 }]
  },
  {
    outputCode: "orbOfAscension",
    outputAmount: 1,
    inputs: [{ code: "orbOfAwakening", amount: 3 }]
  },
  {
    outputCode: "orbOfUnmaking",
    outputAmount: 1,
    inputs: [{ code: "orbOfAscension", amount: 3 }]
  },
  {
    outputCode: "orbOfUnraveling",
    outputAmount: 1,
    inputs: [{ code: "orbOfAscension", amount: 3 }]
  }
];

export const craftingCurrencyNames: Record<CraftingCurrencyCode, string> = {
  craftingShard: "Crafting Shard",
  orbOfAwakening: "Orb of Awakening",
  orbOfAscension: "Orb of Ascension",
  orbOfUnmaking: "Orb of Unmaking",
  orbOfUnraveling: "Orb of Unraveling"
};
