import type { MonsterRarity, Tag } from "../../shared/types/saveTypes";
import { monsterBalance } from "./balance";

export interface MonsterDefinition {
  id: string;
  name: string;
  tags: Tag[];
  rarity: MonsterRarity;
  radius: number;
  minTier?: number;
  resistances?: Partial<Record<"Fire" | "Cold" | "Lightning", number>>;
  spellId?: string;
  spellRange?: number;
  spellCooldownMs?: number;
  isBossOnly?: boolean;
}

export const monsterDefinitions: MonsterDefinition[] = [
  {
    id: "scrapCrawler",
    name: "Scrap Crawler",
    tags: ["Physical"],
    rarity: "Normal",
    radius: monsterBalance.normalRadius,
    resistances: {
      Lightning: 0.08
    }
  },
  {
    id: "cinderGrub",
    name: "Cinder Grub",
    tags: ["Fire"],
    rarity: "Normal",
    radius: monsterBalance.normalRadius,
    minTier: 2,
    resistances: {
      Fire: 0.15,
      Cold: -0.1
    }
  },
  {
    id: "frostSprite",
    name: "Frost Sprite",
    tags: ["Cold"],
    rarity: "Normal",
    radius: monsterBalance.normalRadius,
    minTier: 3,
    resistances: {
      Cold: 0.15,
      Fire: -0.1
    }
  },
  {
    id: "stormHound",
    name: "Storm Hound",
    tags: ["Lightning"],
    rarity: "Normal",
    radius: monsterBalance.normalRadius,
    minTier: 4,
    resistances: {
      Lightning: 0.15
    }
  },
  {
    id: "voidStalker",
    name: "Void Stalker",
    tags: ["Rare", "Physical"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    resistances: {
      Cold: 0.12,
      Lightning: 0.18
    }
  },
  {
    id: "blazeWarden",
    name: "Blaze Warden",
    tags: ["Rare", "Fire"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    minTier: 3,
    resistances: {
      Fire: 0.2,
      Cold: -0.08
    }
  },
  // Spellcaster monsters
  {
    id: "fireElemental",
    name: "Fire Elemental",
    tags: ["Fire"],
    rarity: "Normal",
    radius: monsterBalance.normalRadius,
    minTier: 2,
    resistances: { Fire: 0.25 },
    spellId: "monsterFireBurst",
    spellRange: 220,
    spellCooldownMs: 600
  },
  {
    id: "frostMage",
    name: "Frost Mage",
    tags: ["Cold"],
    rarity: "Normal",
    radius: monsterBalance.normalRadius,
    minTier: 3,
    resistances: { Cold: 0.25, Fire: -0.1 },
    spellId: "monsterFrostBolt",
    spellRange: 220,
    spellCooldownMs: 600
  },
  {
    id: "stormCaller",
    name: "Storm Caller",
    tags: ["Lightning"],
    rarity: "Normal",
    radius: monsterBalance.normalRadius,
    minTier: 4,
    resistances: { Lightning: 0.25 },
    spellId: "monsterLightningStrike",
    spellRange: 220,
    spellCooldownMs: 600
  },
  {
    id: "voidAdept",
    name: "Void Adept",
    tags: ["Physical"],
    rarity: "Normal",
    radius: monsterBalance.normalRadius,
    minTier: 5,
    resistances: { Cold: 0.1, Lightning: 0.1 },
    spellId: "monsterSlash",
    spellRange: 220,
    spellCooldownMs: 600
  },
  // Tier boss monsters — only spawn in boss maps
  {
    id: "tier1Boss",
    name: "Tier 1 Boss",
    tags: ["Rare"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    minTier: 1,
    isBossOnly: true
  },
  {
    id: "tier2Boss",
    name: "Tier 2 Boss",
    tags: ["Rare"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    minTier: 2,
    isBossOnly: true
  },
  {
    id: "tier3Boss",
    name: "Tier 3 Boss",
    tags: ["Rare"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    minTier: 3,
    isBossOnly: true
  },
  {
    id: "tier4Boss",
    name: "Tier 4 Boss",
    tags: ["Rare"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    minTier: 4,
    isBossOnly: true
  },
  {
    id: "tier5Boss",
    name: "Tier 5 Boss",
    tags: ["Rare"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    minTier: 5,
    isBossOnly: true
  },
  {
    id: "tier6Boss",
    name: "Tier 6 Boss",
    tags: ["Rare"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    minTier: 6,
    isBossOnly: true
  },
  {
    id: "tier7Boss",
    name: "Tier 7 Boss",
    tags: ["Rare"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    minTier: 7,
    isBossOnly: true
  },
  {
    id: "tier8Boss",
    name: "Tier 8 Boss",
    tags: ["Rare"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    minTier: 8,
    isBossOnly: true
  },
  {
    id: "tier9Boss",
    name: "Tier 9 Boss",
    tags: ["Rare"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    minTier: 9,
    isBossOnly: true
  },
  {
    id: "tier10Boss",
    name: "Tier 10 Boss",
    tags: ["Rare"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    minTier: 10,
    isBossOnly: true
  }
];
