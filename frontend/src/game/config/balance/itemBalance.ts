import type { EquipmentSlot, Tag } from "../../../shared/types/saveTypes";

export interface UniqueItemDefinition {
  id: string;
  name: string;
  slot: EquipmentSlot;
  minTier: number;
  dropWeight: number;
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

export const itemBalance = {
  rareMonsterRarityWeightMultiplier: {
    normal: 0.75,
    magic: 1.15,
    rare: 1.55,
    unique: 2.2
  },
  rareMonsterMapShardDropMultiplier: 1.5,
  uniqueItems: [
    {
      id: "stormcallerFocus",
      name: "Stormcaller Focus",
      slot: "Weapon",
      minTier: 3,
      dropWeight: 18,
      tags: ["Lightning", "SpellDamage", "Critical", "Unique"],
      uniqueEffectId: "stormcallerFocus",
      uniqueEffectDescription: "Chain spells gain +2 chains and +60 chain range.",
      statBonuses: {
        agility: 4,
        dexterity: 5,
        maxHealth: 14,
        critChance: 0.08,
        spellPowerMultiplier: 0.18
      }
    },
    {
      id: "embersoulBoots",
      name: "Embersoul Boots",
      slot: "Boots",
      minTier: 5,
      dropWeight: 10,
      tags: ["Fire", "CastSpeed", "Unique"],
      uniqueEffectId: "embersoulBoots",
      uniqueEffectDescription: "Area and Fire spells gain +22 radius and 18% more damage.",
      statBonuses: {
        agility: 8,
        vitality: 5,
        maxHealth: 24,
        critChance: 0.04,
        spellPowerMultiplier: 0.14
      }
    },
    {
      id: "glacialHeart",
      name: "Glacial Heart",
      slot: "Amulet",
      minTier: 7,
      dropWeight: 4,
      tags: ["Cold", "Critical", "SpellDamage", "Unique"],
      uniqueEffectId: "glacialHeart",
      uniqueEffectDescription: "Spells gain +8% crit chance and better spell and unique drop luck.",
      statBonuses: {
        strength: 7,
        vitality: 10,
        dexterity: 7,
        maxHealth: 42,
        critChance: 0.11,
        spellPowerMultiplier: 0.24
      }
    }
  ] satisfies UniqueItemDefinition[]
} as const;
