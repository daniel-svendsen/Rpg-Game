import type { MonsterRarity, Tag } from "../../shared/types/saveTypes";
import { monsterBalance } from "./balance";

export interface MonsterDefinition {
  id: string;
  name: string;
  tags: Tag[];
  rarity: MonsterRarity;
  radius: number;
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
    id: "voidStalker",
    name: "Void Stalker",
    tags: ["Rare", "Physical"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius,
    resistances: {
      Cold: 0.12,
      Lightning: 0.18
    }
  }
];
