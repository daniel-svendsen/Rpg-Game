// ─── Global Balance Tweaks ────────────────────────────────────────────────────
// Edit values here to tune the game quickly without touching per-tier tables.
//
// Multipliers: 1.0 = no change · 1.5 = +50% · 0.8 = −20%
// Drop rates:  null = use per-tier table · number = global override (e.g. 0.08 = 8%)

export const gameTweaks = {
  // ── Enemy Stats ─────────────────────────────────────────────────────────────
  enemyHpMultiplier: 1.0,
  enemyResistanceMultiplier: 1.0,
  enemyDamageMultiplier: 1.0,

  // ── Boss Stats ───────────────────────────────────────────────────────────────
  // Applied on top of the enemy multipliers above.
  bossHpMultiplier: 1.0,
  bossResistanceMultiplier: 1.0,
  bossDamageMultiplier: 1.0,

  // ── Chase Unique ─────────────────────────────────────────────────────────────
  // Chance the boss drops its chase unique instead of a common unique. Default: 0.05 (5%)
  chaseUniqueChance: 0.05,

  // ── Spawn Rates ─────────────────────────────────────────────────────────────
  // Per-tier rare-spawn base values: Training 15% · T1 15% → T10 20%
  rareSpawnMultiplier: 1.0,

  // Fraction of packs that include a spellcaster (0–1). Default: 0.20
  spellcasterSpawnChance: 0.20,

  // ── Item Drop Rarity Weights ─────────────────────────────────────────────────
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
