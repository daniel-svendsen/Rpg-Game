const percent = (value: number): number => value / 100;

const statRange = (min: number, max: number) => [min, max] as const;

export type ItemStatRangeSet = {
  strength: readonly [number, number];
  agility: readonly [number, number];
  vitality: readonly [number, number];
  dexterity: readonly [number, number];
  maxHealth: readonly [number, number];
  critChance: readonly [number, number];
  spellPowerMultiplier: readonly [number, number];
};

export interface MapTierBalance {
  monsterCount: number;
  monsterLevel: number;
  normalMonsterSpeed: number;
  rareMonsterSpeed: number;
  itemDropRate: number;
  normalItemDropRate: number;
  magicItemDropRate: number;
  rareItemDropRate: number;
  uniqueItemDropRate: number;
  mapDropRate: number;
  mapShardDropRate: number;
  experienceGainMultiplier: number;
  goldGainMultiplier: number;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  rareMonsterChance: number;
  rareItemDropsMin: number;
  rareItemDropsMax: number;
  itemStatRanges: ItemStatRangeSet;
}

const createItemStatRanges = (tier: number): ItemStatRangeSet => ({
  strength: statRange(1 + (tier - 1), 3 + tier * 2),
  agility: statRange(1 + (tier - 1), 3 + tier * 2),
  vitality: statRange(1 + tier, 4 + tier * 3),
  dexterity: statRange(1 + (tier - 1), 3 + tier * 2),
  maxHealth: statRange(6 + tier * 6, 16 + tier * 14),
  critChance: statRange(0.01 + tier * 0.002, 0.03 + tier * 0.005),
  spellPowerMultiplier: statRange(0.02 + tier * 0.004, 0.05 + tier * 0.008)
});

export const mapBalance = {
  maxTier: 10,
  trainingGrounds: {
    monsterCount: 20,
    monsterLevel: 1,
    normalMonsterSpeed: 38,
    rareMonsterSpeed: 46,
    itemDropRate: percent(12),
    normalItemDropRate: percent(73),
    magicItemDropRate: percent(22),
    rareItemDropRate: percent(4.7),
    uniqueItemDropRate: percent(0.3),
    mapDropRate: percent(2),
    mapShardDropRate: percent(18),
    experienceGainMultiplier: percent(100),
    goldGainMultiplier: percent(100),
    enemyHealthMultiplier: 1,
    enemyDamageMultiplier: 1,
    rareMonsterChance: percent(15),
    rareItemDropsMin: 1,
    rareItemDropsMax: 1,
    itemStatRanges: createItemStatRanges(1)
  },
  tiers: {
    1: {
      monsterCount: 22,
      monsterLevel: 2,
      normalMonsterSpeed: 39,
      rareMonsterSpeed: 47,
      itemDropRate: percent(13),
      normalItemDropRate: percent(71),
      magicItemDropRate: percent(23),
      rareItemDropRate: percent(5.6),
      uniqueItemDropRate: percent(0.4),
      mapDropRate: percent(2.3),
      mapShardDropRate: percent(19),
      experienceGainMultiplier: percent(110),
      goldGainMultiplier: percent(108),
      enemyHealthMultiplier: 1.16,
      enemyDamageMultiplier: 1.11,
      rareMonsterChance: percent(15),
      rareItemDropsMin: 1,
      rareItemDropsMax: 1,
      itemStatRanges: createItemStatRanges(1)
    },
    2: {
      monsterCount: 26,
      monsterLevel: 3,
      normalMonsterSpeed: 40,
      rareMonsterSpeed: 48,
      itemDropRate: percent(14),
      normalItemDropRate: percent(69),
      magicItemDropRate: percent(24),
      rareItemDropRate: percent(6.5),
      uniqueItemDropRate: percent(0.5),
      mapDropRate: percent(2.6),
      mapShardDropRate: percent(20),
      experienceGainMultiplier: percent(120),
      goldGainMultiplier: percent(116),
      enemyHealthMultiplier: 1.32,
      enemyDamageMultiplier: 1.22,
      rareMonsterChance: percent(15.5),
      rareItemDropsMin: 1,
      rareItemDropsMax: 1,
      itemStatRanges: createItemStatRanges(2)
    },
    3: {
      monsterCount: 30,
      monsterLevel: 4,
      normalMonsterSpeed: 41,
      rareMonsterSpeed: 49,
      itemDropRate: percent(15),
      normalItemDropRate: percent(67),
      magicItemDropRate: percent(25),
      rareItemDropRate: percent(7.3),
      uniqueItemDropRate: percent(0.7),
      mapDropRate: percent(2.9),
      mapShardDropRate: percent(21),
      experienceGainMultiplier: percent(130),
      goldGainMultiplier: percent(124),
      enemyHealthMultiplier: 1.48,
      enemyDamageMultiplier: 1.33,
      rareMonsterChance: percent(16),
      rareItemDropsMin: 1,
      rareItemDropsMax: 1,
      itemStatRanges: createItemStatRanges(3)
    },
    4: {
      monsterCount: 34,
      monsterLevel: 5,
      normalMonsterSpeed: 42,
      rareMonsterSpeed: 50,
      itemDropRate: percent(16),
      normalItemDropRate: percent(65),
      magicItemDropRate: percent(26),
      rareItemDropRate: percent(8.1),
      uniqueItemDropRate: percent(0.9),
      mapDropRate: percent(3.2),
      mapShardDropRate: percent(22),
      experienceGainMultiplier: percent(140),
      goldGainMultiplier: percent(132),
      enemyHealthMultiplier: 1.64,
      enemyDamageMultiplier: 1.44,
      rareMonsterChance: percent(16.5),
      rareItemDropsMin: 1,
      rareItemDropsMax: 1,
      itemStatRanges: createItemStatRanges(4)
    },
    5: {
      monsterCount: 38,
      monsterLevel: 6,
      normalMonsterSpeed: 43,
      rareMonsterSpeed: 51,
      itemDropRate: percent(17),
      normalItemDropRate: percent(63),
      magicItemDropRate: percent(27),
      rareItemDropRate: percent(8.9),
      uniqueItemDropRate: percent(1.1),
      mapDropRate: percent(3.5),
      mapShardDropRate: percent(23),
      experienceGainMultiplier: percent(150),
      goldGainMultiplier: percent(140),
      enemyHealthMultiplier: 1.8,
      enemyDamageMultiplier: 1.55,
      rareMonsterChance: percent(17),
      rareItemDropsMin: 1,
      rareItemDropsMax: 1,
      itemStatRanges: createItemStatRanges(5)
    },
    6: {
      monsterCount: 42,
      monsterLevel: 7,
      normalMonsterSpeed: 44,
      rareMonsterSpeed: 52,
      itemDropRate: percent(18),
      normalItemDropRate: percent(61),
      magicItemDropRate: percent(28),
      rareItemDropRate: percent(9.7),
      uniqueItemDropRate: percent(1.3),
      mapDropRate: percent(3.8),
      mapShardDropRate: percent(24),
      experienceGainMultiplier: percent(160),
      goldGainMultiplier: percent(148),
      enemyHealthMultiplier: 1.96,
      enemyDamageMultiplier: 1.66,
      rareMonsterChance: percent(17.5),
      rareItemDropsMin: 1,
      rareItemDropsMax: 2,
      itemStatRanges: createItemStatRanges(6)
    },
    7: {
      monsterCount: 46,
      monsterLevel: 8,
      normalMonsterSpeed: 45,
      rareMonsterSpeed: 53,
      itemDropRate: percent(19),
      normalItemDropRate: percent(59),
      magicItemDropRate: percent(29),
      rareItemDropRate: percent(10.4),
      uniqueItemDropRate: percent(1.6),
      mapDropRate: percent(4.1),
      mapShardDropRate: percent(25),
      experienceGainMultiplier: percent(170),
      goldGainMultiplier: percent(156),
      enemyHealthMultiplier: 2.12,
      enemyDamageMultiplier: 1.77,
      rareMonsterChance: percent(18),
      rareItemDropsMin: 1,
      rareItemDropsMax: 2,
      itemStatRanges: createItemStatRanges(7)
    },
    8: {
      monsterCount: 50,
      monsterLevel: 9,
      normalMonsterSpeed: 46,
      rareMonsterSpeed: 54,
      itemDropRate: percent(20),
      normalItemDropRate: percent(57),
      magicItemDropRate: percent(30),
      rareItemDropRate: percent(11.1),
      uniqueItemDropRate: percent(1.9),
      mapDropRate: percent(4.4),
      mapShardDropRate: percent(26),
      experienceGainMultiplier: percent(180),
      goldGainMultiplier: percent(164),
      enemyHealthMultiplier: 2.28,
      enemyDamageMultiplier: 1.88,
      rareMonsterChance: percent(18.5),
      rareItemDropsMin: 1,
      rareItemDropsMax: 2,
      itemStatRanges: createItemStatRanges(8)
    },
    9: {
      monsterCount: 54,
      monsterLevel: 10,
      normalMonsterSpeed: 47,
      rareMonsterSpeed: 55,
      itemDropRate: percent(21),
      normalItemDropRate: percent(55),
      magicItemDropRate: percent(31),
      rareItemDropRate: percent(11.8),
      uniqueItemDropRate: percent(2.2),
      mapDropRate: percent(4.7),
      mapShardDropRate: percent(27),
      experienceGainMultiplier: percent(190),
      goldGainMultiplier: percent(172),
      enemyHealthMultiplier: 2.44,
      enemyDamageMultiplier: 1.99,
      rareMonsterChance: percent(19),
      rareItemDropsMin: 1,
      rareItemDropsMax: 2,
      itemStatRanges: createItemStatRanges(9)
    },
    10: {
      monsterCount: 58,
      monsterLevel: 11,
      normalMonsterSpeed: 48,
      rareMonsterSpeed: 56,
      itemDropRate: percent(22),
      normalItemDropRate: percent(53),
      magicItemDropRate: percent(32),
      rareItemDropRate: percent(12.5),
      uniqueItemDropRate: percent(2.5),
      mapDropRate: percent(5),
      mapShardDropRate: percent(28),
      experienceGainMultiplier: percent(200),
      goldGainMultiplier: percent(180),
      enemyHealthMultiplier: 2.6,
      enemyDamageMultiplier: 2.1,
      rareMonsterChance: percent(20),
      rareItemDropsMin: 1,
      rareItemDropsMax: 2,
      itemStatRanges: createItemStatRanges(10)
    }
  } satisfies Record<number, MapTierBalance>
} as const;

export const getMapTierBalance = (tier: number): MapTierBalance =>
  mapBalance.tiers[tier as keyof typeof mapBalance.tiers] ?? mapBalance.tiers[mapBalance.maxTier];

export const getMapBalanceByTier = (tier: number): MapTierBalance =>
  tier <= 0 ? mapBalance.trainingGrounds : getMapTierBalance(tier);
