// Global Balance Tweaks
// Edit values here to tune the game quickly without touching per-tier tables.
//
// Multipliers: 1.0 = no change, 1.5 = +50%, 0.8 = -20%
// Drop rates:  null = use per-tier table, number = global override (e.g. 0.08 = 8%)

export type TierBalanceTweaks = {
  enemyHpMultiplier?: number;
  enemyResistanceMultiplier?: number;
  enemyDamageMultiplier?: number;
  enemySpeedMultiplier?: number;
  rareMonsterHpMultiplier?: number;
  rareMonsterDamageMultiplier?: number;
  bossHpMultiplier?: number;
  bossResistanceMultiplier?: number;
  bossDamageMultiplier?: number;
  bossRewardDropMultiplier?: number;
  chaseUniqueChance?: number;
  spellcasterDamageMultiplier?: number;
  spellcasterCooldownMultiplier?: number;
  spellcasterRangeMultiplier?: number;
  packCountMultiplier?: number;
  monsterCountMultiplier?: number;
  mapShardDropMultiplier?: number;
  rareCountMin?: number;
  rareCountMax?: number;
};

export const gameTweaks = {
  // Enemy Stats
  enemyHpMultiplier: 1.2,
  enemyResistanceMultiplier: 1.3,
  enemyDamageMultiplier: 1.3,
  enemySpeedMultiplier: 1.0,

  // Rare Monster Stats
  // Applied on top of enemy multipliers above for rare monsters, including spellcasters.
  rareMonsterHpMultiplier: 1.0,
  rareMonsterDamageMultiplier: 1.0,

  // Boss Stats
  // Applied on top of the enemy multipliers above.
  bossHpMultiplier: 1.5,
  bossResistanceMultiplier: 1.5,
  bossDamageMultiplier: 1.3,
  // Multiplies the boss bonus currency roll chance. The guaranteed boss unique is always attempted.
  bossRewardDropMultiplier: 1.0,

  // Chase Unique
  // Chance the boss drops its chase unique instead of a common unique. Default: 0.05 (5%)
  chaseUniqueChance: 0.05,

  // Spellcaster Stats
  // Cooldown multiplier: 0.8 = casts 20% faster, 1.25 = casts 25% slower.
  spellcasterDamageMultiplier: 0.8,
  spellcasterCooldownMultiplier: 0.8,
  spellcasterRangeMultiplier: 0.9,

  // Map Density and Sustain
  packCountMultiplier: 1.0,
  monsterCountMultiplier: 1.0,
  mapShardDropMultiplier: 1.0,

  // Rare Spawn Count (per map run)
  // T1-3: 1-2, T4-6: 2-3, T7-10: 4-6 via tier overrides below
  rareCountMin: 1,
  rareCountMax: 2,

  // Tier Overrides
  // Use these for quick targeted balance passes. Values override the global tweak above
  // only on that map tier. Missing values fall back to the global tweak.
  //
  // Keep these blocks sparse: only add values that should differ from the global
  // tweak. If a neutral 1.0 is left here, it still overrides the global value.
  tierOverrides: {
    4: {
      rareCountMin: 2,
      rareCountMax: 3
    } as TierBalanceTweaks,
    5: {
      rareCountMin: 2,
      rareCountMax: 3
    } as TierBalanceTweaks,
    6: {
      rareCountMin: 2,
      rareCountMax: 3
    } as TierBalanceTweaks,
    7: {
      rareCountMin: 4,
      rareCountMax: 6
    } as TierBalanceTweaks,
    8: {
      rareCountMin: 4,
      rareCountMax: 6
    } as TierBalanceTweaks,
    9: {
      enemyHpMultiplier: 1.1,
      enemyResistanceMultiplier: 1.15,
      enemyDamageMultiplier: 1.2,
      enemySpeedMultiplier: 1.05,
      rareMonsterHpMultiplier: 1.25,
      rareMonsterDamageMultiplier: 1.15,
      spellcasterDamageMultiplier: 1.25,
      spellcasterCooldownMultiplier: 0.9,
      spellcasterRangeMultiplier: 1.1,
      monsterCountMultiplier: 1.05,
      packCountMultiplier: 1.0,
      mapShardDropMultiplier: 1.1,
      rareCountMin: 4,
      rareCountMax: 6
    } as TierBalanceTweaks,
    10: {
      enemyHpMultiplier: 1.7,
      enemyResistanceMultiplier: 1.7,
      enemyDamageMultiplier: 1.7,
      enemySpeedMultiplier: 1.7,
      rareMonsterHpMultiplier: 1.7,
      rareMonsterDamageMultiplier: 1.6,
      bossResistanceMultiplier: 1.5,
      spellcasterDamageMultiplier: 1.7,
      spellcasterCooldownMultiplier: 0.8,
      spellcasterRangeMultiplier: 1.7,
      rareCountMin: 4,
      rareCountMax: 6
    } as TierBalanceTweaks
  } satisfies Record<number, TierBalanceTweaks>,

  // Item Drop Rarity Weights
  // null = use per-tier table from mapBalance.ts (values below show Training / T10 range)
  // number = override applied on all tiers; rare-monster bonus still applies on top
  //
  //   Normal:      73% / 53%
  //   Magic:       22% / 32%
  //   Rare:         4.7% / 12.5%
  //   Exceptional:  1.5% / 5.6%  (sub-roll on Rare items, starts at T3)
  //   Unique:       0.3% / 1.5%
  normalItemDropRate: null as number | null,
  magicItemDropRate: null as number | null,
  rareItemDropRate: null as number | null,
  exceptionalItemDropRate: null as number | null,
  uniqueItemDropRate: null as number | null,
};

export const getTierBalanceTweaks = (tier: number): Required<TierBalanceTweaks> => {
  const tierTweaks = gameTweaks.tierOverrides[tier as keyof typeof gameTweaks.tierOverrides] ?? {};

  return {
    enemyHpMultiplier: tierTweaks.enemyHpMultiplier ?? gameTweaks.enemyHpMultiplier,
    enemyResistanceMultiplier: tierTweaks.enemyResistanceMultiplier ?? gameTweaks.enemyResistanceMultiplier,
    enemyDamageMultiplier: tierTweaks.enemyDamageMultiplier ?? gameTweaks.enemyDamageMultiplier,
    enemySpeedMultiplier: tierTweaks.enemySpeedMultiplier ?? gameTweaks.enemySpeedMultiplier,
    rareMonsterHpMultiplier: tierTweaks.rareMonsterHpMultiplier ?? gameTweaks.rareMonsterHpMultiplier,
    rareMonsterDamageMultiplier: tierTweaks.rareMonsterDamageMultiplier ?? gameTweaks.rareMonsterDamageMultiplier,
    bossHpMultiplier: tierTweaks.bossHpMultiplier ?? gameTweaks.bossHpMultiplier,
    bossResistanceMultiplier: tierTweaks.bossResistanceMultiplier ?? gameTweaks.bossResistanceMultiplier,
    bossDamageMultiplier: tierTweaks.bossDamageMultiplier ?? gameTweaks.bossDamageMultiplier,
    bossRewardDropMultiplier: tierTweaks.bossRewardDropMultiplier ?? gameTweaks.bossRewardDropMultiplier,
    chaseUniqueChance: tierTweaks.chaseUniqueChance ?? gameTweaks.chaseUniqueChance,
    spellcasterDamageMultiplier: tierTweaks.spellcasterDamageMultiplier ?? gameTweaks.spellcasterDamageMultiplier,
    spellcasterCooldownMultiplier: tierTweaks.spellcasterCooldownMultiplier ?? gameTweaks.spellcasterCooldownMultiplier,
    spellcasterRangeMultiplier: tierTweaks.spellcasterRangeMultiplier ?? gameTweaks.spellcasterRangeMultiplier,
    packCountMultiplier: tierTweaks.packCountMultiplier ?? gameTweaks.packCountMultiplier,
    monsterCountMultiplier: tierTweaks.monsterCountMultiplier ?? gameTweaks.monsterCountMultiplier,
    mapShardDropMultiplier: tierTweaks.mapShardDropMultiplier ?? gameTweaks.mapShardDropMultiplier,
    rareCountMin: tierTweaks.rareCountMin ?? gameTweaks.rareCountMin,
    rareCountMax: tierTweaks.rareCountMax ?? gameTweaks.rareCountMax
  };
};
