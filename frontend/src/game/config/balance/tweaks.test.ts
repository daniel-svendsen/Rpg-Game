import { afterEach, describe, expect, it } from "vitest";
import { gameTweaks, getTierBalanceTweaks } from "./tweaks";

const defaults = {
  enemyHpMultiplier: gameTweaks.enemyHpMultiplier,
  enemyDamageMultiplier: gameTweaks.enemyDamageMultiplier,
  spellcasterDamageMultiplier: gameTweaks.spellcasterDamageMultiplier,
  mapShardDropMultiplier: gameTweaks.mapShardDropMultiplier,
  spellcasterSpawnChance: gameTweaks.spellcasterSpawnChance,
  tier9EnemyHpMultiplier: gameTweaks.tierOverrides[9].enemyHpMultiplier,
  tier9RareMonsterDamageMultiplier: gameTweaks.tierOverrides[9].rareMonsterDamageMultiplier,
  tier9SpellcasterDamageMultiplier: gameTweaks.tierOverrides[9].spellcasterDamageMultiplier,
  tier9ChaseUniqueChance: gameTweaks.tierOverrides[9].chaseUniqueChance,
  tier9MapShardDropMultiplier: gameTweaks.tierOverrides[9].mapShardDropMultiplier,
  tier9SpellcasterSpawnChance: gameTweaks.tierOverrides[9].spellcasterSpawnChance
};

describe("game balance tweaks", () => {
  afterEach(() => {
    gameTweaks.enemyHpMultiplier = defaults.enemyHpMultiplier;
    gameTweaks.enemyDamageMultiplier = defaults.enemyDamageMultiplier;
    gameTweaks.spellcasterDamageMultiplier = defaults.spellcasterDamageMultiplier;
    gameTweaks.mapShardDropMultiplier = defaults.mapShardDropMultiplier;
    gameTweaks.spellcasterSpawnChance = defaults.spellcasterSpawnChance;
    gameTweaks.tierOverrides[9].enemyHpMultiplier = defaults.tier9EnemyHpMultiplier;
    gameTweaks.tierOverrides[9].rareMonsterDamageMultiplier = defaults.tier9RareMonsterDamageMultiplier;
    gameTweaks.tierOverrides[9].spellcasterDamageMultiplier = defaults.tier9SpellcasterDamageMultiplier;
    gameTweaks.tierOverrides[9].chaseUniqueChance = defaults.tier9ChaseUniqueChance;
    gameTweaks.tierOverrides[9].mapShardDropMultiplier = defaults.tier9MapShardDropMultiplier;
    gameTweaks.tierOverrides[9].spellcasterSpawnChance = defaults.tier9SpellcasterSpawnChance;
  });

  it("falls back to global tweaks when a tier has no override", () => {
    gameTweaks.enemyHpMultiplier = 1.15;
    gameTweaks.enemyDamageMultiplier = 0.9;
    gameTweaks.spellcasterDamageMultiplier = 1.4;
    gameTweaks.mapShardDropMultiplier = 1.2;
    gameTweaks.spellcasterSpawnChance = 0.35;

    expect(getTierBalanceTweaks(8)).toMatchObject({
      enemyHpMultiplier: 1.15,
      enemyDamageMultiplier: 0.9,
      spellcasterDamageMultiplier: 1.4,
      mapShardDropMultiplier: 1.2,
      spellcasterSpawnChance: 0.35
    });
  });

  it("uses tier-specific overrides for high-tier map tuning", () => {
    gameTweaks.enemyHpMultiplier = 1.15;
    gameTweaks.spellcasterSpawnChance = 0.35;
    gameTweaks.tierOverrides[9].enemyHpMultiplier = 0.82;
    gameTweaks.tierOverrides[9].rareMonsterDamageMultiplier = 0.75;
    gameTweaks.tierOverrides[9].spellcasterDamageMultiplier = 1.25;
    gameTweaks.tierOverrides[9].chaseUniqueChance = 0.1;
    gameTweaks.tierOverrides[9].mapShardDropMultiplier = 1.5;
    gameTweaks.tierOverrides[9].spellcasterSpawnChance = 0.12;

    expect(getTierBalanceTweaks(9)).toMatchObject({
      enemyHpMultiplier: 0.82,
      rareMonsterDamageMultiplier: 0.75,
      spellcasterDamageMultiplier: 1.25,
      chaseUniqueChance: 0.1,
      mapShardDropMultiplier: 1.5,
      spellcasterSpawnChance: 0.12
    });
  });
});
