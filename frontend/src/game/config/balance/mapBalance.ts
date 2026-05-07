const percent = (value: number): number => value / 100;

const statRange = (min: number, max: number) => [min, max] as const;

export type ItemStatRangeSet = {
  strength: readonly [number, number];
  agility: readonly [number, number];
  vitality: readonly [number, number];
  dexterity: readonly [number, number];
  maxHealth: readonly [number, number];
  fireResistance: readonly [number, number];
  coldResistance: readonly [number, number];
  lightningResistance: readonly [number, number];
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
  fireResistance: statRange(0.02 + tier * 0.004, 0.05 + tier * 0.008),
  coldResistance: statRange(0.02 + tier * 0.004, 0.05 + tier * 0.008),
  lightningResistance: statRange(0.02 + tier * 0.004, 0.05 + tier * 0.008),
  critChance: statRange(0.01 + tier * 0.002, 0.03 + tier * 0.005),
  spellPowerMultiplier: statRange(0.02 + tier * 0.004, 0.05 + tier * 0.008)
});

export const mapBalance = {
  maxTier: 10,
  trainingGrounds: {
    monsterCount: 30,
    monsterLevel: 1,
    normalMonsterSpeed: 44,
    rareMonsterSpeed: 52,
    itemDropRate: percent(7),
    normalItemDropRate: percent(73),
    magicItemDropRate: percent(22),
    rareItemDropRate: percent(4.7),
    uniqueItemDropRate: percent(0.3),
    mapDropRate: percent(0.8),
    mapShardDropRate: percent(9),
    experienceGainMultiplier: percent(100),
    goldGainMultiplier: percent(100),
    enemyHealthMultiplier: 1.18,
    enemyDamageMultiplier: 1.12,
    rareMonsterChance: percent(15),
    rareItemDropsMin: 1,
    rareItemDropsMax: 1,
    itemStatRanges: createItemStatRanges(1)
  },
  tiers: {
    1: {
      monsterCount: 32,
      monsterLevel: 2,
      normalMonsterSpeed: 45,
      rareMonsterSpeed: 53,
      itemDropRate: percent(7.5),
      normalItemDropRate: percent(71),
      magicItemDropRate: percent(23),
      rareItemDropRate: percent(5.6),
      uniqueItemDropRate: percent(0.4),
      mapDropRate: percent(0.9),
      mapShardDropRate: percent(9.5),
      experienceGainMultiplier: percent(110),
      goldGainMultiplier: percent(108),
      enemyHealthMultiplier: 1.34,
      enemyDamageMultiplier: 1.24,
      rareMonsterChance: percent(15),
      rareItemDropsMin: 1,
      rareItemDropsMax: 1,
      itemStatRanges: createItemStatRanges(1)
    },
    2: {
      monsterCount: 36,
      monsterLevel: 3,
      normalMonsterSpeed: 46,
      rareMonsterSpeed: 54,
      itemDropRate: percent(8),
      normalItemDropRate: percent(69),
      magicItemDropRate: percent(24),
      rareItemDropRate: percent(6.5),
      uniqueItemDropRate: percent(0.5),
      mapDropRate: percent(1),
      mapShardDropRate: percent(10),
      experienceGainMultiplier: percent(120),
      goldGainMultiplier: percent(116),
      enemyHealthMultiplier: 1.66,
      enemyDamageMultiplier: 1.48,
      rareMonsterChance: percent(15.5),
      rareItemDropsMin: 1,
      rareItemDropsMax: 1,
      itemStatRanges: createItemStatRanges(2)
    },
    3: {
      monsterCount: 40,
      monsterLevel: 4,
      normalMonsterSpeed: 47,
      rareMonsterSpeed: 55,
      itemDropRate: percent(8.5),
      normalItemDropRate: percent(67),
      magicItemDropRate: percent(25),
      rareItemDropRate: percent(7.3),
      uniqueItemDropRate: percent(0.3),
      mapDropRate: percent(1.2),
      mapShardDropRate: percent(10.5),
      experienceGainMultiplier: percent(130),
      goldGainMultiplier: percent(124),
      enemyHealthMultiplier: 1.92,
      enemyDamageMultiplier: 1.66,
      rareMonsterChance: percent(16),
      rareItemDropsMin: 1,
      rareItemDropsMax: 1,
      itemStatRanges: createItemStatRanges(3)
    },
    4: {
      monsterCount: 44,
      monsterLevel: 5,
      normalMonsterSpeed: 48,
      rareMonsterSpeed: 56,
      itemDropRate: percent(9),
      normalItemDropRate: percent(65),
      magicItemDropRate: percent(26),
      rareItemDropRate: percent(8.1),
      uniqueItemDropRate: percent(0.4),
      mapDropRate: percent(1.32),
      mapShardDropRate: percent(11),
      experienceGainMultiplier: percent(140),
      goldGainMultiplier: percent(132),
      enemyHealthMultiplier: 2.18,
      enemyDamageMultiplier: 1.82,
      rareMonsterChance: percent(16.5),
      rareItemDropsMin: 1,
      rareItemDropsMax: 1,
      itemStatRanges: createItemStatRanges(4)
    },
    5: {
      monsterCount: 48,
      monsterLevel: 6,
      normalMonsterSpeed: 49,
      rareMonsterSpeed: 57,
      itemDropRate: percent(9.5),
      normalItemDropRate: percent(63),
      magicItemDropRate: percent(27),
      rareItemDropRate: percent(8.9),
      uniqueItemDropRate: percent(0.55),
      mapDropRate: percent(1.42),
      mapShardDropRate: percent(11.5),
      experienceGainMultiplier: percent(150),
      goldGainMultiplier: percent(140),
      enemyHealthMultiplier: 2.42,
      enemyDamageMultiplier: 1.97,
      rareMonsterChance: percent(17),
      rareItemDropsMin: 1,
      rareItemDropsMax: 1,
      itemStatRanges: createItemStatRanges(5)
    },
    6: {
      monsterCount: 52,
      monsterLevel: 7,
      normalMonsterSpeed: 50,
      rareMonsterSpeed: 58,
      itemDropRate: percent(10),
      normalItemDropRate: percent(61),
      magicItemDropRate: percent(28),
      rareItemDropRate: percent(9.7),
      uniqueItemDropRate: percent(0.7),
      mapDropRate: percent(1.5),
      mapShardDropRate: percent(12),
      experienceGainMultiplier: percent(160),
      goldGainMultiplier: percent(148),
      enemyHealthMultiplier: 2.64,
      enemyDamageMultiplier: 2.1,
      rareMonsterChance: percent(17.5),
      rareItemDropsMin: 1,
      rareItemDropsMax: 2,
      itemStatRanges: createItemStatRanges(6)
    },
    7: {
      monsterCount: 56,
      monsterLevel: 8,
      normalMonsterSpeed: 51,
      rareMonsterSpeed: 59,
      itemDropRate: percent(10.5),
      normalItemDropRate: percent(59),
      magicItemDropRate: percent(29),
      rareItemDropRate: percent(10.4),
      uniqueItemDropRate: percent(0.9),
      mapDropRate: percent(1.42),
      mapShardDropRate: percent(12.5),
      experienceGainMultiplier: percent(170),
      goldGainMultiplier: percent(156),
      enemyHealthMultiplier: 2.82,
      enemyDamageMultiplier: 2.2,
      rareMonsterChance: percent(18),
      rareItemDropsMin: 1,
      rareItemDropsMax: 2,
      itemStatRanges: createItemStatRanges(7)
    },
    8: {
      monsterCount: 60,
      monsterLevel: 9,
      normalMonsterSpeed: 52,
      rareMonsterSpeed: 60,
      itemDropRate: percent(11),
      normalItemDropRate: percent(57),
      magicItemDropRate: percent(30),
      rareItemDropRate: percent(11.1),
      uniqueItemDropRate: percent(1.1),
      mapDropRate: percent(1.45),
      mapShardDropRate: percent(13),
      experienceGainMultiplier: percent(180),
      goldGainMultiplier: percent(164),
      enemyHealthMultiplier: 2.88,
      enemyDamageMultiplier: 2.22,
      rareMonsterChance: percent(18.5),
      rareItemDropsMin: 1,
      rareItemDropsMax: 2,
      itemStatRanges: createItemStatRanges(8)
    },
    9: {
      monsterCount: 64,
      monsterLevel: 10,
      normalMonsterSpeed: 53,
      rareMonsterSpeed: 61,
      itemDropRate: percent(11.5),
      normalItemDropRate: percent(55),
      magicItemDropRate: percent(31),
      rareItemDropRate: percent(11.8),
      uniqueItemDropRate: percent(1.3),
      mapDropRate: percent(1.7),
      mapShardDropRate: percent(13.5),
      experienceGainMultiplier: percent(190),
      goldGainMultiplier: percent(172),
      enemyHealthMultiplier: 3,
      enemyDamageMultiplier: 2.28,
      rareMonsterChance: percent(19),
      rareItemDropsMin: 1,
      rareItemDropsMax: 2,
      itemStatRanges: createItemStatRanges(9)
    },
    10: {
      monsterCount: 68,
      monsterLevel: 11,
      normalMonsterSpeed: 54,
      rareMonsterSpeed: 62,
      itemDropRate: percent(12),
      normalItemDropRate: percent(53),
      magicItemDropRate: percent(32),
      rareItemDropRate: percent(12.5),
      uniqueItemDropRate: percent(1.5),
      mapDropRate: percent(2),
      mapShardDropRate: percent(14),
      experienceGainMultiplier: percent(200),
      goldGainMultiplier: percent(180),
      enemyHealthMultiplier: 3.12,
      enemyDamageMultiplier: 2.36,
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
