import type { MonsterRarity, Tag } from "../../shared/types/saveTypes";
import { monsterBalance } from "./balance";

export interface MonsterDefinition {
  id: string;
  name: string;
  tags: Tag[];
  rarity: MonsterRarity;
  radius: number;
}

export const monsterDefinitions: MonsterDefinition[] = [
  {
    id: "scrapCrawler",
    name: "Scrap Crawler",
    tags: ["Physical"],
    rarity: "Normal",
    radius: monsterBalance.normalRadius
  },
  {
    id: "voidStalker",
    name: "Void Stalker",
    tags: ["Rare", "Physical"],
    rarity: "Rare",
    radius: monsterBalance.rareRadius
  }
];
