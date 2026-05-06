import type { EquipmentSlot, ItemRarity, ItemSlot, Tag } from "../../shared/types/saveTypes";
import { itemBalance } from "./balance";

export interface ItemBaseDefinition {
  id: string;
  name: string;
  slot: ItemSlot;
  tags: Tag[];
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
  uniqueEffectId: string;
  uniqueEffectDescription: string;
  statBonuses: {
    strength?: number;
    agility?: number;
    vitality?: number;
    dexterity?: number;
    maxHealth?: number;
    critChance?: number;
    spellPowerMultiplier?: number;
  };
}

export const itemBases: ItemBaseDefinition[] = [
  { id: "oakWand", name: "Oak Wand", slot: "Weapon", tags: ["SpellDamage"] },
  { id: "travelerBoots", name: "Traveler Boots", slot: "Boots", tags: ["CastSpeed"] },
  { id: "bronzeHelm", name: "Bronze Helm", slot: "Helmet", tags: ["Physical"] },
  { id: "chainmailVest", name: "Chainmail Vest", slot: "BodyArmor", tags: ["Physical"] },
  { id: "studdedBelt", name: "Studded Belt", slot: "Belt", tags: ["Physical"] },
  { id: "wovenGloves", name: "Woven Gloves", slot: "Gloves", tags: ["Critical"] },
  { id: "amberAmulet", name: "Amber Amulet", slot: "Amulet", tags: ["SpellDamage"] },
  { id: "topazRing", name: "Topaz Ring", slot: "Ring", tags: ["Lightning", "Critical"] },
  { id: "rubyRing", name: "Ruby Ring", slot: "Ring", tags: ["Fire", "SpellDamage"] }
];

export const itemRarities: ItemRarity[] = ["Normal", "Magic", "Rare", "Unique"];

export const currencyDefinitions: CurrencyDefinition[] = [
  { code: "mapShard", name: "Map Shard", tags: ["Currency", "MapModifier"] }
];

export const uniqueItemDefinitions: UniqueItemDefinition[] = [...itemBalance.uniqueItems];
