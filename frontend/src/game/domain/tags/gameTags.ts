import type { Tag } from "../../../shared/types/saveTypes";

export const gameTags: Tag[] = [
  "Cold",
  "Lightning",
  "Fire",
  "Critical",
  "Projectile",
  "Area",
  "Chain",
  "Explosion",
  "AttackSpeed",
  "CastSpeed",
  "SpellDamage",
  "Physical",
  "Rare",
  "Unique",
  "Currency",
  "MapModifier"
];

export const hasTag = (tags: Tag[], tag: Tag): boolean => tags.includes(tag);

