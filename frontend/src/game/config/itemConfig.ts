import type { EquipmentSlot, ItemRarity, Tag } from "../../shared/types/saveTypes";

export interface ItemBaseDefinition {
  id: string;
  name: string;
  slot: EquipmentSlot;
  tags: Tag[];
}

export interface CurrencyDefinition {
  code: string;
  name: string;
  tags: Tag[];
}

export const itemBases: ItemBaseDefinition[] = [
  { id: "oakWand", name: "Oak Wand", slot: "Weapon", tags: ["SpellDamage"] },
  { id: "travelerBoots", name: "Traveler Boots", slot: "Boots", tags: ["CastSpeed"] },
  { id: "bronzeHelm", name: "Bronze Helm", slot: "Helmet", tags: ["Physical"] },
  { id: "wovenGloves", name: "Woven Gloves", slot: "Gloves", tags: ["Critical"] },
  { id: "amberAmulet", name: "Amber Amulet", slot: "Amulet", tags: ["SpellDamage"] }
];

export const itemRarities: ItemRarity[] = ["Normal", "Magic", "Rare", "Unique"];

export const currencyDefinitions: CurrencyDefinition[] = [
  { code: "mapShard", name: "Map Shard", tags: ["Currency", "MapModifier"] }
];

