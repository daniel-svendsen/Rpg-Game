export type Tag =
  | "Cold"
  | "Lightning"
  | "Fire"
  | "Critical"
  | "Projectile"
  | "Area"
  | "Chain"
  | "Explosion"
  | "AttackSpeed"
  | "CastSpeed"
  | "SpellDamage"
  | "Physical"
  | "Rare"
  | "Unique"
  | "Currency"
  | "MapModifier";

export type ItemRarity = "Normal" | "Magic" | "Rare" | "Unique";
export type MonsterRarity = "Normal" | "Rare";
export type DamageType = "Physical" | "Fire" | "Cold" | "Lightning";
export type EquipmentSlot =
  | "Weapon"
  | "Helmet"
  | "Amulet"
  | "BodyArmor"
  | "Belt"
  | "Gloves"
  | "Boots"
  | "Ring1"
  | "Ring2";

export type ItemSlot = EquipmentSlot | "Ring";

export interface CharacterStats {
  strength: number;
  agility: number;
  vitality: number;
  dexterity: number;
}

export interface DerivedStats {
  maxHealth: number;
  castSpeedMultiplier: number;
  attackSpeedMultiplier: number;
  movementSpeedMultiplier: number;
  armor: number;
  evasion: number;
  resistances: Record<Exclude<DamageType, "Physical">, number>;
  critChance: number;
  spellPowerMultiplier: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  slot: ItemSlot | null;
  rarity: ItemRarity;
  tier: number;
  tags: Tag[];
  uniqueEffectId?: string;
  uniqueEffectDescription?: string;
  statBonuses: Partial<CharacterStats> & {
    maxHealth?: number;
    movementSpeedBonus?: number;
    armor?: number;
    evasion?: number;
    fireResistance?: number;
    coldResistance?: number;
    lightningResistance?: number;
    castSpeedMultiplier?: number;
    attackSpeedMultiplier?: number;
    critChance?: number;
    spellPowerMultiplier?: number;
  };
}

export interface LootEntry {
  id: string;
  kind: "Item" | "Spell" | "Currency" | "Map";
  name: string;
  details: string[];
  isUpgrade: boolean;
}

export type GroundLootKind = LootEntry["kind"];

export type GroundLootPayload =
  | { kind: "Item"; item: InventoryItem }
  | { kind: "Currency"; code: string; amount: number }
  | { kind: "Spell"; spellId: string }
  | { kind: "Map"; mapId: string; tier: number };

export interface GroundLootState {
  id: string;
  x: number;
  y: number;
  createdAtMs: number;
  payload: GroundLootPayload;
}

export interface CurrencyStack {
  code: string;
  amount: number;
}

export interface LifeFlaskState {
  currentCharges: number;
}

export interface SpellLinkState {
  mainSpellId: string;
  supportSpellIds: string[];
}

export interface SpellProgressState {
  spellId: string;
  level: number;
}

export type MapEnhancementId =
  | "overflowingSpoils"
  | "gildedHunt"
  | "scholarMarch"
  | "shardstorm"
  | "chargedBestiary"
  | "heavyResistance";

export interface MapEnhancementInstance {
  id: MapEnhancementId;
}

export interface OwnedMapStack {
  stackId: string;
  mapId: string;
  tier: number;
  quantity: number;
  enhancements: MapEnhancementInstance[];
}

export interface MapProgressState {
  highestUnlockedTier: number;
  lastCompletedTier: number;
  consumableMaps: OwnedMapStack[];
}

export interface CharacterRecord {
  id?: number;
  name: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  unspentStatPoints: number;
  baseStats: CharacterStats;
  derivedStats: DerivedStats;
  currentHealth: number;
  gold: number;
  lifeFlask: LifeFlaskState;
  inventory: InventoryItem[];
  equippedItems: Partial<Record<EquipmentSlot, InventoryItem>>;
  unlockedSpellIds: string[];
  unlockedSupportSpellIds: string[];
  spellProgress: SpellProgressState[];
  spellLoadout: SpellLinkState[];
  currencies: CurrencyStack[];
  mapProgress: MapProgressState;
}

export interface ArenaEnemyState {
  id: string;
  packId?: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  rarity: MonsterRarity;
}

export interface FloatingTextState {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface ArenaSnapshot {
  timeElapsedMs: number;
  mapName: string;
  mapTier: number;
  playerX: number;
  playerY: number;
  player: CharacterRecord;
  enemies: ArenaEnemyState[];
  floatingTexts: FloatingTextState[];
  lootEvents: LootEntry[];
  groundLoot: Array<{
    id: string;
    kind: GroundLootKind;
    x: number;
    y: number;
    name: string;
  }>;
  isComplete: boolean;
}
