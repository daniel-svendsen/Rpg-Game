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
  rareSpawnMultiplier?: number;
  spellcasterSpawnChance?: number;
  spellcasterDamageMultiplier?: number;
  spellcasterCooldownMultiplier?: number;
  spellcasterRangeMultiplier?: number;
  packCountMultiplier?: number;
  monsterCountMultiplier?: number;
  mapShardDropMultiplier?: number;
};

export const gameTweaks = {
  // Enemy Stats
  enemyHpMultiplier: 1.0,
  enemyResistanceMultiplier: 1.0,
  enemyDamageMultiplier: 1.0,
  enemySpeedMultiplier: 1.0,

  // Rare Monster Stats
  // Applied on top of enemy multipliers above for rare monsters, including spellcasters.
  rareMonsterHpMultiplier: 1.0,
  rareMonsterDamageMultiplier: 1.0,

  // Boss Stats
  // Applied on top of the enemy multipliers above.
  bossHpMultiplier: 1.0,
  bossResistanceMultiplier: 1.0,
  bossDamageMultiplier: 1.0,
  // Multiplies the boss bonus currency roll chance. The guaranteed boss unique is always attempted.
  bossRewardDropMultiplier: 1.0,

  // Chase Unique
  // Chance the boss drops its chase unique instead of a common unique. Default: 0.05 (5%)
  chaseUniqueChance: 0.05,

  // Spawn Rates
  // Per-tier rare-spawn base values: Training 15%, T1 15% -> T10 20%
  rareSpawnMultiplier: 1.0,

  // Fraction of packs that include a spellcaster (0-1). Default: 0.20
  spellcasterSpawnChance: 0.20,

  // Spellcaster Stats
  // Cooldown multiplier: 0.8 = casts 20% faster, 1.25 = casts 25% slower.
  spellcasterDamageMultiplier: 1.0,
  spellcasterCooldownMultiplier: 1.0,
  spellcasterRangeMultiplier: 1.0,

  // Map Density and Sustain
  packCountMultiplier: 1.0,
  monsterCountMultiplier: 1.0,
  mapShardDropMultiplier: 1.0,

  // Tier Overrides
  // Use these for quick targeted balance passes. Values override the global tweak above
  // only on that map tier. Missing values fall back to the global tweak.
  tierOverrides: {
    9: {
      enemyHpMultiplier: 1.0,
      enemyResistanceMultiplier: 1.0,
      enemyDamageMultiplier: 1.0,
      enemySpeedMultiplier: 1.0,
      rareMonsterHpMultiplier: 1.0,
      rareMonsterDamageMultiplier: 1.0,
      bossHpMultiplier: 1.0,
      bossResistanceMultiplier: 1.0,
      bossDamageMultiplier: 1.0,
      bossRewardDropMultiplier: 1.0,
      chaseUniqueChance: 0.05,
      rareSpawnMultiplier: 1.0,
      spellcasterSpawnChance: 0.20,
      spellcasterDamageMultiplier: 1.0,
      spellcasterCooldownMultiplier: 1.0,
      spellcasterRangeMultiplier: 1.0,
      packCountMultiplier: 1.0,
      monsterCountMultiplier: 1.0,
      mapShardDropMultiplier: 1.0
    },
    10: {
      enemyHpMultiplier: 1.0,
      enemyResistanceMultiplier: 1.0,
      enemyDamageMultiplier: 1.0,
      enemySpeedMultiplier: 1.0,
      rareMonsterHpMultiplier: 1.0,
      rareMonsterDamageMultiplier: 1.0,
      bossHpMultiplier: 1.0,
      bossResistanceMultiplier: 1.0,
      bossDamageMultiplier: 1.0,
      bossRewardDropMultiplier: 1.0,
      chaseUniqueChance: 0.05,
      rareSpawnMultiplier: 1.0,
      spellcasterSpawnChance: 0.20,
      spellcasterDamageMultiplier: 1.0,
      spellcasterCooldownMultiplier: 1.0,
      spellcasterRangeMultiplier: 1.0,
      packCountMultiplier: 1.0,
      monsterCountMultiplier: 1.0,
      mapShardDropMultiplier: 1.0
    }
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
    rareSpawnMultiplier: tierTweaks.rareSpawnMultiplier ?? gameTweaks.rareSpawnMultiplier,
    spellcasterSpawnChance: tierTweaks.spellcasterSpawnChance ?? gameTweaks.spellcasterSpawnChance,
    spellcasterDamageMultiplier: tierTweaks.spellcasterDamageMultiplier ?? gameTweaks.spellcasterDamageMultiplier,
    spellcasterCooldownMultiplier: tierTweaks.spellcasterCooldownMultiplier ?? gameTweaks.spellcasterCooldownMultiplier,
    spellcasterRangeMultiplier: tierTweaks.spellcasterRangeMultiplier ?? gameTweaks.spellcasterRangeMultiplier,
    packCountMultiplier: tierTweaks.packCountMultiplier ?? gameTweaks.packCountMultiplier,
    monsterCountMultiplier: tierTweaks.monsterCountMultiplier ?? gameTweaks.monsterCountMultiplier,
    mapShardDropMultiplier: tierTweaks.mapShardDropMultiplier ?? gameTweaks.mapShardDropMultiplier
  };
};
