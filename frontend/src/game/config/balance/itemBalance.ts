import type { InventoryItem, ItemSlot, Tag } from "../../../shared/types/saveTypes";

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

export const itemBalance = {
  rareMonsterRarityWeightMultiplier: {
    normal: 0.75,
    magic: 1.15,
    rare: 1.55,
    unique: 2.2
  },
  rareMonsterMapShardDropMultiplier: 1.5,
  exceptionalRare: {
    minTier: 3,
    chanceByTier: {
      3: 0.015,
      4: 0.02,
      5: 0.026,
      6: 0.032,
      7: 0.038,
      8: 0.044,
      9: 0.05,
      10: 0.056
    } as const,
    rareMonsterChanceMultiplier: 1.75,
    statMultiplier: 1.65,
    shopPriceMultiplier: 2.9
  },
  uniqueItems: [
    {
      id: "stormcallerFocus",
      name: "Stormcaller Focus",
      slot: "Weapon",
      minTier: 3,
      dropWeight: 18,
      uniqueTier: 1,
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
      uniqueTier: 2,
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
      uniqueTier: 2,
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
      uniqueTier: 2,
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
      uniqueTier: 1,
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
      uniqueTier: 1,
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
      uniqueTier: 2,
      tags: ["Fire", "SpellDamage", "Unique"],
      uniqueEffectId: "cinderSignet",
      uniqueEffectDescription: "Fire spells penetrate resistances and gain 16% more damage.",
      statBonuses: {
        strength: 7,
        critChance: 0.03,
        spellPowerMultiplier: 0.12
      }
    },
    {
      id: "astralDominion",
      name: "Astral Dominion",
      slot: "Ring",
      minTier: 8,
      dropWeight: 2,
      uniqueTier: 3,
      tags: ["Critical", "SpellDamage", "Lightning", "Cold", "Fire", "Unique"],
      uniqueEffectId: "astralDominion",
      uniqueEffectDescription: "Spells gain 18% more damage and +6% crit chance.",
      statBonuses: {
        strength: 6,
        agility: 6,
        vitality: 6,
        dexterity: 6,
        maxHealth: 30,
        critChance: 0.04,
        spellPowerMultiplier: 0.1
      }
    },
    {
      id: "warlordSignet",
      name: "Warlord Signet",
      slot: "Ring",
      minTier: 1,
      dropWeight: 0,
      uniqueTier: 1,
      tags: ["Physical", "Critical", "Unique"],
      statBonuses: {
        strength: 6,
        maxHealth: 28,
        critChance: 0.05
      }
    },
    {
      id: "lairbornMantle",
      name: "Lairborn Mantle",
      slot: "BodyArmor",
      minTier: 1,
      dropWeight: 0,
      uniqueTier: 2,
      tags: ["SpellDamage", "Unique"],
      statBonuses: {
        vitality: 10,
        maxHealth: 40,
        armor: 28,
        spellPowerMultiplier: 0.12
      }
    },
    {
      id: "crownOfAscension",
      name: "Crown of Ascension",
      slot: "Helmet",
      minTier: 1,
      dropWeight: 0,
      uniqueTier: 3,
      tags: ["Critical", "SpellDamage", "Unique"],
      uniqueEffectId: "crownOfAscension",
      uniqueEffectDescription: "Projectile spells fire +1 projectile and all spells cast 15% faster.",
      statBonuses: {
        agility: 8,
        vitality: 8,
        armor: 20,
        maxHealth: 50,
        critChance: 0.12,
        spellPowerMultiplier: 0.22
      }
    },
    {
      id: "embershardBoots",
      name: "Embershard Boots",
      slot: "Boots",
      minTier: 2,
      dropWeight: 0,
      uniqueTier: 1,
      tags: ["Fire", "CastSpeed", "Unique"],
      statBonuses: {
        agility: 7,
        movementSpeedBonus: 0.08,
        fireResistance: 0.16,
        evasion: 30
      }
    },
    {
      id: "scorchloop",
      name: "Scorchloop",
      slot: "Ring",
      minTier: 2,
      dropWeight: 0,
      uniqueTier: 2,
      tags: ["Fire", "Critical", "Unique"],
      statBonuses: {
        strength: 7,
        fireResistance: 0.18,
        critChance: 0.06,
        maxHealth: 24
      }
    },
    {
      id: "pyrelordCrown",
      name: "Pyrelord Crown",
      slot: "Helmet",
      minTier: 2,
      dropWeight: 0,
      uniqueTier: 3,
      tags: ["Fire", "Critical", "SpellDamage", "Unique"],
      uniqueEffectId: "pyrelordCrown",
      uniqueEffectDescription: "Fire area spells gain +26 radius and cast 18% faster.",
      statBonuses: {
        strength: 8,
        vitality: 9,
        armor: 28,
        fireResistance: 0.24,
        maxHealth: 52,
        critChance: 0.08,
        spellPowerMultiplier: 0.16
      }
    },
    {
      id: "frostwovenTreads",
      name: "Frostwoven Treads",
      slot: "Boots",
      minTier: 3,
      dropWeight: 0,
      uniqueTier: 1,
      tags: ["Cold", "CastSpeed", "Unique"],
      statBonuses: {
        agility: 9,
        evasion: 38,
        movementSpeedBonus: 0.09,
        coldResistance: 0.18
      }
    },
    {
      id: "shiverglassAmulet",
      name: "Shiverglass Amulet",
      slot: "Amulet",
      minTier: 3,
      dropWeight: 0,
      uniqueTier: 2,
      tags: ["Cold", "Critical", "Unique"],
      statBonuses: {
        dexterity: 8,
        vitality: 7,
        coldResistance: 0.18,
        critChance: 0.06,
        maxHealth: 26
      }
    },
    {
      id: "winterwakeDiadem",
      name: "Winterwake Diadem",
      slot: "Helmet",
      minTier: 3,
      dropWeight: 0,
      uniqueTier: 3,
      tags: ["Cold", "Critical", "SpellDamage", "Unique"],
      uniqueEffectId: "winterwakeDiadem",
      uniqueEffectDescription: "Cold area spells gain +30 radius and cast 18% faster.",
      statBonuses: {
        vitality: 10,
        armor: 26,
        coldResistance: 0.25,
        maxHealth: 56,
        critChance: 0.08,
        spellPowerMultiplier: 0.17
      }
    },
    {
      id: "stormfangRing",
      name: "Stormfang Ring",
      slot: "Ring",
      minTier: 4,
      dropWeight: 0,
      uniqueTier: 1,
      tags: ["Lightning", "Critical", "Unique"],
      uniqueEffectId: "stormfangRing",
      uniqueEffectDescription: "Lightning chain spells gain +1 chain and +60 chain range.",
      statBonuses: {
        dexterity: 10,
        lightningResistance: 0.2,
        critChance: 0.07,
        maxHealth: 28
      }
    },
    {
      id: "voltstriderBoots",
      name: "Voltstrider Boots",
      slot: "Boots",
      minTier: 4,
      dropWeight: 0,
      uniqueTier: 2,
      tags: ["Lightning", "CastSpeed", "Unique"],
      statBonuses: {
        agility: 10,
        movementSpeedBonus: 0.1,
        lightningResistance: 0.2,
        evasion: 44
      }
    },
    {
      id: "tempestHelm",
      name: "Tempest Helm",
      slot: "Helmet",
      minTier: 4,
      dropWeight: 0,
      uniqueTier: 3,
      tags: ["Lightning", "Critical", "SpellDamage", "Unique"],
      uniqueEffectId: "tempestHelm",
      uniqueEffectDescription: "Lightning projectile spells fire +1 projectile and lightning spells cast 15% faster.",
      statBonuses: {
        dexterity: 10,
        vitality: 10,
        armor: 30,
        lightningResistance: 0.27,
        maxHealth: 60,
        critChance: 0.09,
        spellPowerMultiplier: 0.18
      }
    },
    {
      id: "ironrootBelt",
      name: "Ironroot Belt",
      slot: "Belt",
      minTier: 5,
      dropWeight: 0,
      uniqueTier: 1,
      tags: ["Physical", "Unique"],
      statBonuses: {
        strength: 12,
        vitality: 10,
        armor: 34,
        maxHealth: 44
      }
    },
    {
      id: "graniteCarapace",
      name: "Granite Carapace",
      slot: "BodyArmor",
      minTier: 5,
      dropWeight: 0,
      uniqueTier: 2,
      tags: ["Physical", "Unique"],
      statBonuses: {
        vitality: 14,
        armor: 72,
        fireResistance: 0.14,
        coldResistance: 0.14,
        maxHealth: 68
      }
    },
    {
      id: "titansCommand",
      name: "Titan's Command",
      slot: "Helmet",
      minTier: 5,
      dropWeight: 0,
      uniqueTier: 3,
      tags: ["Physical", "Critical", "Unique"],
      uniqueEffectId: "titansCommand",
      uniqueEffectDescription: "Spells gain +50% crit multiplier.",
      statBonuses: {
        strength: 14,
        vitality: 12,
        armor: 44,
        maxHealth: 78,
        critChance: 0.08
      }
    },
    {
      id: "shadowstepBoots",
      name: "Shadowstep Boots",
      slot: "Boots",
      minTier: 6,
      dropWeight: 0,
      uniqueTier: 1,
      tags: ["Critical", "Unique"],
      statBonuses: {
        agility: 12,
        dexterity: 12,
        evasion: 52,
        movementSpeedBonus: 0.11,
        critChance: 0.05
      }
    },
    {
      id: "nightglassBand",
      name: "Nightglass Band",
      slot: "Ring",
      minTier: 6,
      dropWeight: 0,
      uniqueTier: 2,
      tags: ["Critical", "SpellDamage", "Unique"],
      statBonuses: {
        dexterity: 12,
        coldResistance: 0.16,
        lightningResistance: 0.16,
        critChance: 0.08,
        spellPowerMultiplier: 0.12
      }
    },
    {
      id: "voidmantleHood",
      name: "Voidmantle Hood",
      slot: "Helmet",
      minTier: 6,
      dropWeight: 0,
      uniqueTier: 3,
      tags: ["Critical", "SpellDamage", "Unique"],
      uniqueEffectId: "voidmantleHood",
      uniqueEffectDescription: "All elemental spells penetrate 15% of resistances.",
      statBonuses: {
        agility: 12,
        vitality: 12,
        evasion: 60,
        maxHealth: 72,
        critChance: 0.1,
        spellPowerMultiplier: 0.2
      }
    },
    {
      id: "starcoilRing",
      name: "Starcoil Ring",
      slot: "Ring",
      minTier: 7,
      dropWeight: 0,
      uniqueTier: 1,
      tags: ["Critical", "SpellDamage", "Unique"],
      statBonuses: {
        strength: 8,
        agility: 8,
        vitality: 8,
        dexterity: 8,
        critChance: 0.08,
        spellPowerMultiplier: 0.12
      }
    },
    {
      id: "astralHarness",
      name: "Astral Harness",
      slot: "BodyArmor",
      minTier: 7,
      dropWeight: 0,
      uniqueTier: 2,
      tags: ["SpellDamage", "Unique"],
      statBonuses: {
        vitality: 16,
        maxHealth: 84,
        fireResistance: 0.16,
        coldResistance: 0.16,
        lightningResistance: 0.16,
        spellPowerMultiplier: 0.14
      }
    },
    {
      id: "kingsfallCrown",
      name: "Kingsfall Crown",
      slot: "Helmet",
      minTier: 7,
      dropWeight: 0,
      uniqueTier: 3,
      tags: ["Critical", "SpellDamage", "Unique"],
      uniqueEffectId: "kingsfallCrown",
      uniqueEffectDescription: "Chain spells gain +2 chains, area spells gain +20 radius, and projectile spells fire +1 extra.",
      statBonuses: {
        strength: 10,
        agility: 10,
        vitality: 10,
        dexterity: 10,
        armor: 42,
        maxHealth: 90,
        critChance: 0.11,
        spellPowerMultiplier: 0.22
      }
    },
    {
      id: "bloodwakeSash",
      name: "Bloodwake Sash",
      slot: "Belt",
      minTier: 8,
      dropWeight: 0,
      uniqueTier: 1,
      tags: ["Fire", "Critical", "Unique"],
      statBonuses: {
        strength: 14,
        vitality: 14,
        fireResistance: 0.18,
        maxHealth: 76,
        critChance: 0.06
      }
    },
    {
      id: "doomplate",
      name: "Doomplate",
      slot: "BodyArmor",
      minTier: 8,
      dropWeight: 0,
      uniqueTier: 2,
      tags: ["Physical", "Fire", "Unique"],
      statBonuses: {
        strength: 16,
        vitality: 16,
        armor: 92,
        fireResistance: 0.18,
        lightningResistance: 0.18,
        maxHealth: 96
      }
    },
    {
      id: "cataclysmHelm",
      name: "Cataclysm Helm",
      slot: "Helmet",
      minTier: 8,
      dropWeight: 0,
      uniqueTier: 3,
      tags: ["Critical", "SpellDamage", "Fire", "Lightning", "Cold", "Unique"],
      uniqueEffectId: "cataclysmHelm",
      uniqueEffectDescription: "All spells deal 25% more damage. Area spells gain +25 radius.",
      statBonuses: {
        strength: 12,
        agility: 12,
        vitality: 12,
        dexterity: 12,
        armor: 48,
        fireResistance: 0.2,
        coldResistance: 0.2,
        lightningResistance: 0.2,
        maxHealth: 104,
        critChance: 0.11,
        spellPowerMultiplier: 0.24
      }
    },
    {
      id: "worldheartBand",
      name: "Worldheart Band",
      slot: "Ring",
      minTier: 9,
      dropWeight: 0,
      uniqueTier: 1,
      tags: ["Critical", "Unique"],
      statBonuses: {
        strength: 12,
        agility: 12,
        vitality: 12,
        dexterity: 12,
        fireResistance: 0.18,
        coldResistance: 0.18,
        lightningResistance: 0.18,
        maxHealth: 88,
        critChance: 0.08
      }
    },
    {
      id: "apexMantle",
      name: "Apex Mantle",
      slot: "BodyArmor",
      minTier: 9,
      dropWeight: 0,
      uniqueTier: 2,
      tags: ["SpellDamage", "Physical", "Unique"],
      statBonuses: {
        vitality: 18,
        armor: 72,
        evasion: 72,
        fireResistance: 0.2,
        coldResistance: 0.2,
        lightningResistance: 0.2,
        maxHealth: 112,
        spellPowerMultiplier: 0.18
      }
    },
    {
      id: "eternityCrown",
      name: "Eternity Crown",
      slot: "Helmet",
      minTier: 9,
      dropWeight: 0,
      uniqueTier: 3,
      tags: ["Critical", "SpellDamage", "Fire", "Lightning", "Cold", "Unique"],
      uniqueEffectId: "eternityCrown",
      uniqueEffectDescription: "All spells deal 30% more damage, gain +15% crit chance, and penetrate 20% of elemental resistances.",
      statBonuses: {
        strength: 14,
        agility: 14,
        vitality: 14,
        dexterity: 14,
        armor: 54,
        fireResistance: 0.22,
        coldResistance: 0.22,
        lightningResistance: 0.22,
        maxHealth: 122,
        critChance: 0.13,
        spellPowerMultiplier: 0.28
      }
    }
  ] satisfies UniqueItemDefinition[],
  bossUniquePools: {
    1: { common1: "warlordSignet", common2: "lairbornMantle", chase: "crownOfAscension" },
    2: { common1: "embershardBoots", common2: "scorchloop", chase: "pyrelordCrown" },
    3: { common1: "frostwovenTreads", common2: "shiverglassAmulet", chase: "winterwakeDiadem" },
    4: { common1: "stormfangRing", common2: "voltstriderBoots", chase: "tempestHelm" },
    5: { common1: "ironrootBelt", common2: "graniteCarapace", chase: "titansCommand" },
    6: { common1: "shadowstepBoots", common2: "nightglassBand", chase: "voidmantleHood" },
    7: { common1: "starcoilRing", common2: "astralHarness", chase: "kingsfallCrown" },
    8: { common1: "bloodwakeSash", common2: "doomplate", chase: "cataclysmHelm" },
    9: { common1: "worldheartBand", common2: "apexMantle", chase: "eternityCrown" }
  } as const
} as const;
