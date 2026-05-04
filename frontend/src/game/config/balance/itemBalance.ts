import type { ItemSlot, Tag } from "../../../shared/types/saveTypes";

export interface UniqueItemDefinition {
  id: string;
  name: string;
  slot: ItemSlot;
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
    },
    {
      id: "titanCarapace",
      name: "Titan Carapace",
      slot: "BodyArmor",
      minTier: 5,
      dropWeight: 8,
      tags: ["Physical", "Unique"],
      uniqueEffectId: "titanCarapace",
      uniqueEffectDescription: "You take 14% less contact damage and gain +18% max life.",
      statBonuses: {
        vitality: 12,
        maxHealth: 48
      }
    },
    {
      id: "wayfarerSash",
      name: "Wayfarer Sash",
      slot: "Belt",
      minTier: 4,
      dropWeight: 10,
      tags: ["CastSpeed", "Unique"],
      uniqueEffectId: "wayfarerSash",
      uniqueEffectDescription: "Map shards drop more often and life flask kills grant +1 extra charge.",
      statBonuses: {
        agility: 6,
        vitality: 6,
        maxHealth: 20
      }
    },
    {
      id: "twinstarLoop",
      name: "Twinstar Loop",
      slot: "Ring",
      minTier: 4,
      dropWeight: 12,
      tags: ["Projectile", "Critical", "Unique"],
      uniqueEffectId: "twinstarLoop",
      uniqueEffectDescription: "Projectile spells fire +2 projectiles but deal 10% less damage.",
      statBonuses: {
        dexterity: 8,
        critChance: 0.05,
        spellPowerMultiplier: 0.08
      }
    },
    {
      id: "cinderSignet",
      name: "Cinder Signet",
      slot: "Ring",
      minTier: 6,
      dropWeight: 7,
      tags: ["Fire", "SpellDamage", "Unique"],
      uniqueEffectId: "cinderSignet",
      uniqueEffectDescription: "Fire spells penetrate resistances and gain 16% more damage.",
      statBonuses: {
        strength: 7,
        critChance: 0.03,
        spellPowerMultiplier: 0.12
      }
    }
  ] satisfies UniqueItemDefinition[]
} as const;
