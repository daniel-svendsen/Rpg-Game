import type { EquipmentSlot, InventoryItem, ItemRarity, ItemSlot, Tag } from "../../shared/types/saveTypes";
import { itemBalance } from "./balance";

export interface ItemBaseDefinition {
  id: string;
  name: string;
  slot: ItemSlot;
  tags: Tag[];
  minTier?: number;
  maxTier?: number;
  defenseProfile?: "Armor" | "Evasion" | "Hybrid";
  baseArmor?: number;
  baseEvasion?: number;
  baseCastSpeedMultiplier?: number;
  baseAttackSpeedMultiplier?: number;
}

export interface CurrencyDefinition {
  code: string;
  name: string;
  tags: Tag[];
}

export const equipmentSlotLabels: Record<EquipmentSlot, string> = {
  Weapon: "Weapon",
  Helmet: "Helmet",
  Amulet: "Amulet",
  BodyArmor: "Body Armor",
  Belt: "Belt",
  Gloves: "Gloves",
  Boots: "Boots",
  Ring1: "Left Ring",
  Ring2: "Right Ring"
};

export const getEquipmentSlotLabel = (slot: EquipmentSlot): string => equipmentSlotLabels[slot];
export const getItemSlotLabel = (slot: ItemSlot): string => (slot === "Ring" ? "Ring" : getEquipmentSlotLabel(slot));

export interface UniqueItemDefinition {
  id: string;
  name: string;
  slot: ItemSlot;
  minTier: number;
  dropWeight: number;
  uniqueTier: 1 | 2 | 3;
  tags: Tag[];
  uniqueEffectId?: string;
  uniqueEffectDescription?: string;
  statBonuses: InventoryItem["statBonuses"];
}

export const itemBases: ItemBaseDefinition[] = [
  { id: "oakWand", name: "Oak Wand", slot: "Weapon", tags: ["SpellDamage"], minTier: 1, maxTier: 2, baseCastSpeedMultiplier: 1.0 },
  { id: "yewWand", name: "Yew Wand", slot: "Weapon", tags: ["SpellDamage"], minTier: 3, maxTier: 4, baseCastSpeedMultiplier: 1.2 },
  { id: "runicWand", name: "Runic Wand", slot: "Weapon", tags: ["SpellDamage"], minTier: 5, maxTier: 10, baseCastSpeedMultiplier: 1.35 },
  { id: "rustySword", name: "Rusty Sword", slot: "Weapon", tags: ["Physical"], minTier: 1, maxTier: 2, baseAttackSpeedMultiplier: 1.0 },
  { id: "steelSword", name: "Steel Sword", slot: "Weapon", tags: ["Physical"], minTier: 3, maxTier: 4, baseAttackSpeedMultiplier: 1.2 },
  { id: "gladiatorBlade", name: "Gladiator Blade", slot: "Weapon", tags: ["Physical"], minTier: 5, maxTier: 10, baseAttackSpeedMultiplier: 1.35 },
  { id: "travelerBoots", name: "Traveler Boots", slot: "Boots", tags: ["CastSpeed"], defenseProfile: "Evasion", baseEvasion: 28 },
  { id: "ironGreaves", name: "Iron Greaves", slot: "Boots", tags: ["Physical"], defenseProfile: "Armor", baseArmor: 32 },
  { id: "bronzeHelm", name: "Bronze Helm", slot: "Helmet", tags: ["Physical"], defenseProfile: "Armor", baseArmor: 36 },
  { id: "leatherCap", name: "Leather Cap", slot: "Helmet", tags: ["Physical"], defenseProfile: "Evasion", baseEvasion: 34 },
  { id: "chainmailVest", name: "Chainmail Vest", slot: "BodyArmor", tags: ["Physical"], defenseProfile: "Armor", baseArmor: 47 },
  { id: "leatherTunic", name: "Leather Tunic", slot: "BodyArmor", tags: ["Physical"], defenseProfile: "Evasion", baseEvasion: 44 },
  { id: "studdedBelt", name: "Studded Belt", slot: "Belt", tags: ["Physical"] },
  { id: "wovenGloves", name: "Woven Gloves", slot: "Gloves", tags: ["Critical"], defenseProfile: "Evasion", baseEvasion: 22 },
  { id: "ironGauntlets", name: "Iron Gauntlets", slot: "Gloves", tags: ["Physical"], defenseProfile: "Armor", baseArmor: 24 },
  { id: "amberAmulet", name: "Amber Amulet", slot: "Amulet", tags: ["SpellDamage"] },
  { id: "topazRing", name: "Topaz Ring", slot: "Ring", tags: ["Lightning", "Critical"] },
  { id: "rubyRing", name: "Ruby Ring", slot: "Ring", tags: ["Fire", "SpellDamage"] }
];

export const itemRarities: ItemRarity[] = ["Normal", "Magic", "Rare", "Unique"];

export const currencyDefinitions: CurrencyDefinition[] = [
  { code: "mapShard", name: "Map Shard", tags: ["Currency", "MapModifier"] },
  { code: "imbuingOrb", name: "Imbuing Orb", tags: ["Currency"] },
  { code: "gemcuttersPrism", name: "Gemcutter's Prism", tags: ["Currency"] },
  { code: "craftingShard", name: "Crafting Shard", tags: ["Currency"] },
  { code: "orbOfAwakening", name: "Orb of Awakening", tags: ["Currency"] },
  { code: "orbOfBinding", name: "Orb of Binding", tags: ["Currency"] },
  { code: "orbOfAscension", name: "Orb of Ascension", tags: ["Currency"] },
  { code: "orbOfUnmaking", name: "Orb of Unmaking", tags: ["Currency"] },
  { code: "orbOfUnraveling", name: "Orb of Unraveling", tags: ["Currency"] }
];

export const getCurrencyName = (code: string): string =>
  currencyDefinitions.find((currency) => currency.code === code)?.name ?? code;

export const uniqueItemDefinitions: UniqueItemDefinition[] = [...itemBalance.uniqueItems];
