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
  }
];
