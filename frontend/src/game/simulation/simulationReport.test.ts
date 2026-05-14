import { describe, expect, it } from "vitest";
import { buildDropTableSnapshot, buildSimulationSummary, formatSimulationSummary } from "./simulationReport";
import type { SingleRunSimulationMetrics } from "./simulationTypes";

describe("simulationReport", () => {
  it("aggregates run metrics into totals and averages", () => {
    const runs: SingleRunSimulationMetrics[] = [
      {
        runNumber: 1,
        mapId: "trainingGrounds",
        mapName: "Training Grounds",
        completed: true,
        died: false,
        timedOut: false,
        durationMs: 40_000,
        goldGained: 120,
        mapShardsGained: 1,
        imbuingOrbsGained: 0,
        gemcuttersPrismsGained: 2,
        mapsGained: 0,
        bossKeysGained: 0,
        normalItemsDropped: 1,
        magicItemsDropped: 1,
        rareItemsDropped: 1,
        exceptionalRareItemsDropped: 0,
        uniqueItemsDropped: 0,
        uniqueTier1ItemsDropped: 0,
        uniqueTier2ItemsDropped: 0,
        uniqueTier3ItemsDropped: 0,
        spellDrops: 1,
        spellDropsByCategory: { common: 1, chase: 0 },
        supportDropsByCategory: { common: 0, chase: 0 },
        lootByKind: { Item: 2, Spell: 1, Support: 0, Currency: 1, Map: 0 },
        rareMonstersSpawned: 4,
        rareMonstersKilled: 4,
        totalMonstersKilled: 12,
        packsSpawned: 3,
        packsCleared: 3,
        guardianSpawned: true,
        guardianKilled: true,
        hitsTaken: 8,
        evades: 2,
        damageDealtToPlayer: 200,
        damagePreventedByResistance: 50,
        damagePreventedByArmor: 10,
        damageDealtByPlayer: 1500,
        critsLanded: 4,
        spellsCast: 20,
        finalHealthPercent: 0.8,
        timeMovingMs: 10_000,
        timeFightingMs: 25_000,
        itemRolls: {
          itemsDropped: 2,
          bySlot: { Weapon: 1, Ring: 1 },
          byRarity: { Normal: 1, Magic: 1 },
          byStatKey: { strength: 1, maxHealth: 1 },
          byStatTier: { strength: { 1: 1 }, maxHealth: { 2: 1 } }
        }
      },
      {
        runNumber: 2,
        mapId: "trainingGrounds",
        mapName: "Training Grounds",
        completed: false,
        died: true,
        timedOut: false,
        durationMs: 20_000,
        goldGained: 60,
        mapShardsGained: 0,
        imbuingOrbsGained: 1,
        gemcuttersPrismsGained: 0,
        mapsGained: 1,
        bossKeysGained: 2,
        normalItemsDropped: 0,
        magicItemsDropped: 0,
        rareItemsDropped: 0,
        exceptionalRareItemsDropped: 1,
        uniqueItemsDropped: 1,
        uniqueTier1ItemsDropped: 0,
        uniqueTier2ItemsDropped: 0,
        uniqueTier3ItemsDropped: 1,
        spellDrops: 0,
        spellDropsByCategory: { common: 0, chase: 0 },
        supportDropsByCategory: { common: 1, chase: 1 },
        lootByKind: { Item: 1, Spell: 0, Support: 0, Currency: 0, Map: 1 },
        rareMonstersSpawned: 2,
        rareMonstersKilled: 1,
        totalMonstersKilled: 6,
        packsSpawned: 2,
        packsCleared: 1,
        guardianSpawned: false,
        guardianKilled: false,
        hitsTaken: 15,
        evades: 1,
        damageDealtToPlayer: 400,
        damagePreventedByResistance: 100,
        damagePreventedByArmor: 0,
        damageDealtByPlayer: 800,
        critsLanded: 2,
        spellsCast: 12,
        finalHealthPercent: 0,
        timeMovingMs: 5_000,
        timeFightingMs: 12_000,
        itemRolls: {
          itemsDropped: 1,
          bySlot: { Boots: 1 },
          byRarity: { Rare: 1 },
          byStatKey: { agility: 1 },
          byStatTier: { agility: { 3: 1 } }
        }
      }
    ];

    const characterSnapshot = {
      maxHealth: 300,
      armor: 0,
      evasion: 50,
      fireResistance: 0.25,
      coldResistance: 0,
      lightningResistance: 0,
      critChance: 0.05,
      critMultiplier: 1.6,
      movementSpeedMultiplier: 1.0,
      castSpeedMultiplier: 1.0,
      spellPowerMultiplier: 1.0
    };

    const summary = buildSimulationSummary(
      "test-profile",
      "trainingGrounds",
      runs,
      50,
      240_000,
      0.45,
      null,
      characterSnapshot,
      null
    );

    expect(summary.totals.completedRuns).toBe(1);
    expect(summary.totals.deaths).toBe(1);
    expect(summary.totals.goldGained).toBe(180);
    expect(summary.totals.imbuingOrbsGained).toBe(1);
    expect(summary.totals.gemcuttersPrismsGained).toBe(2);
    expect(summary.totals.bossKeysGained).toBe(2);
    expect(summary.totals.rareItemsDropped).toBe(1);
    expect(summary.totals.exceptionalRareItemsDropped).toBe(1);
    expect(summary.totals.uniqueItemsDropped).toBe(1);
    expect(summary.totals.uniqueTier3ItemsDropped).toBe(1);
    expect(summary.totals.spellDrops).toBe(1);
    expect(summary.totals.spellDropsByCategory).toEqual({ common: 1, chase: 0 });
    expect(summary.totals.supportDropsByCategory).toEqual({ common: 1, chase: 1 });
    expect(summary.totals.lootByKind.Map).toBe(1);
    expect(summary.averages.completionRate).toBe(0.5);
    expect(summary.averages.durationSeconds).toBe(30);
    expect(summary.averages.bossKeysGained).toBe(1);
    expect(summary.averages.exceptionalRareItemsDropped).toBe(0.5);
    expect(summary.averages.imbuingOrbsGained).toBe(0.5);
    expect(summary.averages.gemcuttersPrismsGained).toBe(1);
    expect(summary.averages.uniqueTier3ItemsDropped).toBe(0.5);
    expect(summary.averages.spellDropsByCategory).toEqual({ common: 0.5, chase: 0 });
    expect(summary.averages.supportDropsByCategory).toEqual({ common: 0.5, chase: 0.5 });
    expect(summary.averages.rareMonstersKilled).toBe(2.5);
  });

  it("includes spell and support drop pools grouped by common and chase", () => {
    const dropTables = buildDropTableSnapshot();

    expect(dropTables.spells.common.map((entry) => entry.id)).toEqual(["glacierNova", "arcLance"]);
    expect(dropTables.spells.chase.map((entry) => entry.id)).toEqual(["ashenOrbit", "tempestBloom"]);
    expect(dropTables.supports.common.map((entry) => entry.id)).toEqual([
      "areaSupport",
      "swiftnessAura",
      "chainSupport",
      "concentratedEffect",
      "wardingAura",
      "ironSkinAura"
    ]);
    expect(dropTables.supports.chase.map((entry) => entry.id)).toEqual([
      "scattershotProjectiles",
      "arcaneResonance",
      "impactCascade"
    ]);
    expect(dropTables.supports.common.find((entry) => entry.id === "swiftnessAura")?.passiveOnly).toBe(true);
    expect(dropTables.supports.chase.find((entry) => entry.id === "arcaneResonance")?.passiveOnly).toBe(true);
  });

  it("prints spell and support drop categories in the formatted simulation summary", () => {
    const characterSnapshot = {
      maxHealth: 300,
      armor: 0,
      evasion: 50,
      fireResistance: 0.25,
      coldResistance: 0,
      lightningResistance: 0,
      critChance: 0.05,
      critMultiplier: 1.6,
      movementSpeedMultiplier: 1.0,
      castSpeedMultiplier: 1.0,
      spellPowerMultiplier: 1.0
    };

    const summary = buildSimulationSummary(
      "test-profile",
      "trainingGrounds",
      [],
      50,
      240_000,
      0.45,
      null,
      characterSnapshot,
      null
    );
    const output = formatSimulationSummary(summary);

    expect(output).toContain("Spell categories: common 0 (0 total)  chase 0 (0 total)");
    expect(output).toContain("Support categories: common 0 (0 total)  chase 0 (0 total)");
    expect(output).not.toContain("Drop pools:");
  });
});
