import type { MonsterRarity, Tag } from "../../shared/types/saveTypes";

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
    radius: 18
  },
  {
    id: "voidStalker",
    name: "Void Stalker",
    tags: ["Rare", "Physical"],
    rarity: "Rare",
    radius: 24
  }
];

