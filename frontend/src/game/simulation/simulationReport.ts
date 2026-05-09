import { mapConfig } from "../config/mapConfig";
import type { CharacterSnapshot, SimulationSummary, SingleRunSimulationMetrics, ShopSampleSummary } from "./simulationTypes";

const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;
const formatNumber = (value: number): string => value.toFixed(2).replace(/\.00$/, "");

export const buildSimulationSummary = (
  profileName: string,
  mapId: string,
  runs: SingleRunSimulationMetrics[],
  stepMs: number,
  maxRunDurationMs: number,
  autoUseLifeFlaskThreshold: number | null,
  overrides: SimulationSummary["overrides"],
  characterSnapshot: CharacterSnapshot,
  shop: ShopSampleSummary | null
): SimulationSummary => {
  const itemRolls: SimulationSummary["itemRolls"] = {
    itemsDropped: 0,
    bySlot: {},
    byRarity: {},
    byStatKey: {},
    byStatTier: {}
  };

  runs.forEach((run) => {
    itemRolls.itemsDropped += run.itemRolls.itemsDropped;

    Object.entries(run.itemRolls.bySlot).forEach(([slot, count]) => {
      itemRolls.bySlot[slot as keyof typeof itemRolls.bySlot] =
        (itemRolls.bySlot[slot as keyof typeof itemRolls.bySlot] ?? 0) + (count ?? 0);
    });

    Object.entries(run.itemRolls.byRarity).forEach(([rarity, count]) => {
      itemRolls.byRarity[rarity as keyof typeof itemRolls.byRarity] =
        (itemRolls.byRarity[rarity as keyof typeof itemRolls.byRarity] ?? 0) + (count ?? 0);
    });

    Object.entries(run.itemRolls.byStatKey).forEach(([statKey, count]) => {
      itemRolls.byStatKey[statKey as keyof typeof itemRolls.byStatKey] =
        (itemRolls.byStatKey[statKey as keyof typeof itemRolls.byStatKey] ?? 0) + (count ?? 0);
    });

    Object.entries(run.itemRolls.byStatTier).forEach(([statKey, tiers]) => {
      itemRolls.byStatTier[statKey as keyof typeof itemRolls.byStatTier] ??= {};

      Object.entries(tiers ?? {}).forEach(([tier, count]) => {
        const resolvedTier = tier as unknown as 1 | 2 | 3 | 4 | 5;
        itemRolls.byStatTier[statKey as keyof typeof itemRolls.byStatTier]![resolvedTier] =
          (itemRolls.byStatTier[statKey as keyof typeof itemRolls.byStatTier]![resolvedTier] ?? 0) + (count ?? 0);
      });
    });
  });

  const totals = runs.reduce(
    (summary, run) => ({
      completedRuns: summary.completedRuns + (run.completed ? 1 : 0),
      deaths: summary.deaths + (run.died ? 1 : 0),
      timedOutRuns: summary.timedOutRuns + (run.timedOut ? 1 : 0),
      goldGained: summary.goldGained + run.goldGained,
      mapShardsGained: summary.mapShardsGained + run.mapShardsGained,
      imbuingOrbsGained: summary.imbuingOrbsGained + run.imbuingOrbsGained,
      mapsGained: summary.mapsGained + run.mapsGained,
      bossKeysGained: summary.bossKeysGained + run.bossKeysGained,
      normalItemsDropped: summary.normalItemsDropped + run.normalItemsDropped,
      magicItemsDropped: summary.magicItemsDropped + run.magicItemsDropped,
      rareItemsDropped: summary.rareItemsDropped + run.rareItemsDropped,
      exceptionalRareItemsDropped: summary.exceptionalRareItemsDropped + run.exceptionalRareItemsDropped,
      uniqueItemsDropped: summary.uniqueItemsDropped + run.uniqueItemsDropped,
      uniqueTier1ItemsDropped: summary.uniqueTier1ItemsDropped + run.uniqueTier1ItemsDropped,
      uniqueTier2ItemsDropped: summary.uniqueTier2ItemsDropped + run.uniqueTier2ItemsDropped,
      uniqueTier3ItemsDropped: summary.uniqueTier3ItemsDropped + run.uniqueTier3ItemsDropped,
      spellDrops: summary.spellDrops + run.spellDrops,
      rareMonstersSpawned: summary.rareMonstersSpawned + run.rareMonstersSpawned,
      rareMonstersKilled: summary.rareMonstersKilled + run.rareMonstersKilled,
      totalMonstersKilled: summary.totalMonstersKilled + run.totalMonstersKilled,
      packsSpawned: summary.packsSpawned + run.packsSpawned,
      packsCleared: summary.packsCleared + run.packsCleared,
      guardianSpawns: summary.guardianSpawns + (run.guardianSpawned ? 1 : 0),
      guardianKills: summary.guardianKills + (run.guardianKilled ? 1 : 0),
      hitsTaken: summary.hitsTaken + run.hitsTaken,
      evades: summary.evades + run.evades,
      damageDealtToPlayer: summary.damageDealtToPlayer + run.damageDealtToPlayer,
      damagePreventedByResistance: summary.damagePreventedByResistance + run.damagePreventedByResistance,
      damagePreventedByArmor: summary.damagePreventedByArmor + run.damagePreventedByArmor,
      damageDealtByPlayer: summary.damageDealtByPlayer + run.damageDealtByPlayer,
      critsLanded: summary.critsLanded + run.critsLanded,
      spellsCast: summary.spellsCast + run.spellsCast,
      timeMovingMs: summary.timeMovingMs + run.timeMovingMs,
      timeFightingMs: summary.timeFightingMs + run.timeFightingMs,
      lootByKind: {
        Item: summary.lootByKind.Item + run.lootByKind.Item,
        Spell: summary.lootByKind.Spell + run.lootByKind.Spell,
        Currency: summary.lootByKind.Currency + run.lootByKind.Currency,
        Map: summary.lootByKind.Map + run.lootByKind.Map
      }
    }),
    {
      completedRuns: 0,
      deaths: 0,
      timedOutRuns: 0,
      goldGained: 0,
      mapShardsGained: 0,
      imbuingOrbsGained: 0,
      mapsGained: 0,
      bossKeysGained: 0,
      normalItemsDropped: 0,
      magicItemsDropped: 0,
      rareItemsDropped: 0,
      exceptionalRareItemsDropped: 0,
      uniqueItemsDropped: 0,
      uniqueTier1ItemsDropped: 0,
      uniqueTier2ItemsDropped: 0,
      uniqueTier3ItemsDropped: 0,
      spellDrops: 0,
      rareMonstersSpawned: 0,
      rareMonstersKilled: 0,
      totalMonstersKilled: 0,
      packsSpawned: 0,
      packsCleared: 0,
      guardianSpawns: 0,
      guardianKills: 0,
      hitsTaken: 0,
      evades: 0,
      damageDealtToPlayer: 0,
      damagePreventedByResistance: 0,
      damagePreventedByArmor: 0,
      damageDealtByPlayer: 0,
      critsLanded: 0,
      spellsCast: 0,
      timeMovingMs: 0,
      timeFightingMs: 0,
      lootByKind: {
        Item: 0,
        Spell: 0,
        Currency: 0,
        Map: 0
      }
    }
  );
  const runCount = Math.max(1, runs.length);
  const zeroMapRuns = runs.reduce((total, run) => total + (run.mapsGained <= 0 ? 1 : 0), 0);
  const atLeastOneMapRuns = runCount - zeroMapRuns;
  const zeroMapRunRate = zeroMapRuns / runCount;
  const mapDropRunRate = 1 - zeroMapRunRate;
  const expectedZeroMapRunsBeforeDrop = mapDropRunRate <= 0 ? Number.POSITIVE_INFINITY : zeroMapRunRate / mapDropRunRate;

  const completedRunsWithHealth = runs.filter((r) => r.completed);
  const avgFinalHealthPercent = completedRunsWithHealth.length > 0
    ? completedRunsWithHealth.reduce((sum, r) => sum + r.finalHealthPercent, 0) / completedRunsWithHealth.length
    : 0;

  return {
    profileName,
    mapId,
    mapName: mapConfig[mapId]?.name ?? mapId,
    runs: runs.length,
    stepMs,
    maxRunDurationMs,
    autoUseLifeFlaskThreshold,
    overrides,
    characterSnapshot,
    shop,
    sustain: {
      zeroMapRuns,
      atLeastOneMapRuns,
      zeroMapRunRate,
      expectedZeroMapRunsBeforeDrop
    },
    totals,
    itemRolls,
    averages: {
      completionRate: totals.completedRuns / runCount,
      deathRate: totals.deaths / runCount,
      timeoutRate: totals.timedOutRuns / runCount,
      durationSeconds: runs.reduce((total, run) => total + run.durationMs, 0) / runCount / 1000,
      goldGained: totals.goldGained / runCount,
      mapShardsGained: totals.mapShardsGained / runCount,
      imbuingOrbsGained: totals.imbuingOrbsGained / runCount,
      mapsGained: totals.mapsGained / runCount,
      bossKeysGained: totals.bossKeysGained / runCount,
      normalItemsDropped: totals.normalItemsDropped / runCount,
      magicItemsDropped: totals.magicItemsDropped / runCount,
      rareItemsDropped: totals.rareItemsDropped / runCount,
      exceptionalRareItemsDropped: totals.exceptionalRareItemsDropped / runCount,
      uniqueItemsDropped: totals.uniqueItemsDropped / runCount,
      uniqueTier1ItemsDropped: totals.uniqueTier1ItemsDropped / runCount,
      uniqueTier2ItemsDropped: totals.uniqueTier2ItemsDropped / runCount,
      uniqueTier3ItemsDropped: totals.uniqueTier3ItemsDropped / runCount,
      spellDrops: totals.spellDrops / runCount,
      rareMonstersSpawned: totals.rareMonstersSpawned / runCount,
      rareMonstersKilled: totals.rareMonstersKilled / runCount,
      totalMonstersKilled: totals.totalMonstersKilled / runCount,
      packsSpawned: totals.packsSpawned / runCount,
      packsCleared: totals.packsCleared / runCount,
      guardianSpawnRate: totals.guardianSpawns / runCount,
      guardianKillRate: totals.guardianKills / runCount,
      hitsTaken: totals.hitsTaken / runCount,
      evades: totals.evades / runCount,
      evadeRate: totals.hitsTaken + totals.evades > 0
        ? totals.evades / (totals.hitsTaken + totals.evades)
        : 0,
      damageDealtToPlayer: totals.damageDealtToPlayer / runCount,
      damagePreventedByResistance: totals.damagePreventedByResistance / runCount,
      damagePreventedByArmor: totals.damagePreventedByArmor / runCount,
      damageDealtByPlayer: totals.damageDealtByPlayer / runCount,
      critsLanded: totals.critsLanded / runCount,
      spellsCast: totals.spellsCast / runCount,
      critRate: totals.spellsCast > 0 ? totals.critsLanded / totals.spellsCast : 0,
      avgDamagePerSpell: totals.spellsCast > 0 ? totals.damageDealtByPlayer / totals.spellsCast : 0,
      timeMovingSeconds: totals.timeMovingMs / runCount / 1000,
      timeFightingSeconds: totals.timeFightingMs / runCount / 1000,
      finalHealthPercent: avgFinalHealthPercent
    },
    runsByOutcome: runs
  };
};

export const formatSimulationSummary = (summary: SimulationSummary): string => {
  const overridesText =
    summary.overrides && Object.keys(summary.overrides).length > 0
      ? JSON.stringify(summary.overrides)
      : "none";
  const flaskText =
    summary.autoUseLifeFlaskThreshold === null
      ? "disabled"
      : `${formatPercent(summary.autoUseLifeFlaskThreshold)} health`;

  const cs = summary.characterSnapshot;
  const ir = summary.itemRolls;
  const avg = summary.averages;

  const avgNormal = avg.normalItemsDropped;
  const avgMagic = avg.magicItemsDropped;
  const avgRare = avg.rareItemsDropped;
  const avgExc = avg.exceptionalRareItemsDropped;
  const avgUnique = avg.uniqueItemsDropped;
  const avgTotalItems = avgNormal + avgMagic + avgRare + avgUnique;
  const itemPct = (n: number): string =>
    avgTotalItems > 0 ? ` (${((n / avgTotalItems) * 100).toFixed(1)}%)` : "";

  const bySlotText = Object.entries(ir.bySlot)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .map(([slot, count]) => `${slot}=${count}`)
    .join(", ") || "none";

  const byStatTierLines = Object.entries(ir.byStatTier)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([stat, tiers]) => {
      const tierText = [1, 2, 3, 4, 5]
        .map((t) => {
          const count = tiers?.[t as 1 | 2 | 3 | 4 | 5] ?? 0;
          return count > 0 ? `T${t}:${count}` : null;
        })
        .filter(Boolean)
        .join(" ");
      return `  ${stat}: ${tierText || "–"}`;
    });

  const lines = [
    `Profile: ${summary.profileName}`,
    `Map: ${summary.mapName} (${summary.mapId})`,
    `Runs: ${summary.runs}`,
    `Step: ${summary.stepMs}ms`,
    `Max run time: ${formatNumber(summary.maxRunDurationMs / 1000)}s`,
    `Auto life flask: ${flaskText}`,
    `Overrides: ${overridesText}`,
    "",
    "Character stats:",
    `- HP: ${cs.maxHealth}  Armor: ${cs.armor}  Evasion: ${cs.evasion}`,
    `- Resistances: Fire ${formatPercent(cs.fireResistance)}  Cold ${formatPercent(cs.coldResistance)}  Lightning ${formatPercent(cs.lightningResistance)}`,
    `- Crit: ${formatPercent(cs.critChance)} chance / ${cs.critMultiplier.toFixed(2)}x multiplier`,
    `- Speed: move ${cs.movementSpeedMultiplier.toFixed(2)}x  cast ${cs.castSpeedMultiplier.toFixed(2)}x  spell power ${cs.spellPowerMultiplier.toFixed(2)}x`,
    "",
    `Completion rate: ${formatPercent(avg.completionRate)}`,
    `Death rate: ${formatPercent(avg.deathRate)}`,
    `Timeout rate: ${formatPercent(avg.timeoutRate)}`,
    `Average run time: ${formatNumber(avg.durationSeconds)}s`,
    `Avg health on completion: ${formatPercent(avg.finalHealthPercent)}`,
    "",
    "Economy (avg per run):",
    `- Gold: ${formatNumber(avg.goldGained)}`,
    `- Map shards: ${formatNumber(avg.mapShardsGained)}`,
    `- Imbuing orbs: ${formatNumber(avg.imbuingOrbsGained)}`,
    `- Maps: ${formatNumber(avg.mapsGained)} (sustain)  Boss keys: ${formatNumber(avg.bossKeysGained)}`,
    `- Map drop rate: ${formatPercent(1 - summary.sustain.zeroMapRunRate)} (0-map runs: ${formatPercent(summary.sustain.zeroMapRunRate)}, expected streak: ${
      Number.isFinite(summary.sustain.expectedZeroMapRunsBeforeDrop)
        ? formatNumber(summary.sustain.expectedZeroMapRunsBeforeDrop)
        : "never"
    })`,
    "",
    "Kills (avg per run):",
    `- Total: ${formatNumber(avg.totalMonstersKilled)}  Rares: ${formatNumber(avg.rareMonstersKilled)}/${formatNumber(avg.rareMonstersSpawned)}`,
    `- Packs: ${formatNumber(avg.packsCleared)}/${formatNumber(avg.packsSpawned)} cleared`,
    `- Guardian: ${formatPercent(avg.guardianSpawnRate)} spawn  ${formatPercent(avg.guardianKillRate)} killed`,
    "",
    "Time (avg per run):",
    `- Moving: ${formatNumber(avg.timeMovingSeconds)}s  Fighting: ${formatNumber(avg.timeFightingSeconds)}s`,
    "",
    "Offense (avg per run):",
    `- Spells cast: ${formatNumber(avg.spellsCast)}`,
    `- Damage dealt: ${formatNumber(avg.damageDealtByPlayer)}  Avg/spell: ${formatNumber(avg.avgDamagePerSpell)}`,
    `- Crits: ${formatNumber(avg.critsLanded)} (${formatPercent(avg.critRate)} of casts)`,
    "",
    "Defense (avg per run):",
    `- Hits taken: ${formatNumber(avg.hitsTaken)}  Evades: ${formatNumber(avg.evades)} (${formatPercent(avg.evadeRate)} evade rate)`,
    `- Damage dealt to player: ${formatNumber(avg.damageDealtToPlayer)}`,
    `- Prevented by resistance: ${formatNumber(avg.damagePreventedByResistance)}`,
    `- Prevented by armor: ${formatNumber(avg.damagePreventedByArmor)}`,
    "",
    `Item drops (avg per run, ${formatNumber(avgTotalItems)} items/run):`,
    `- Normal:      ${formatNumber(avgNormal)}${itemPct(avgNormal)}`,
    `- Magic:       ${formatNumber(avgMagic)}${itemPct(avgMagic)}`,
    `- Rare:        ${formatNumber(avgRare)}${itemPct(avgRare)}`,
    `- Exceptional: ${formatNumber(avgExc)}${itemPct(avgExc)}`,
    `- Unique:      ${formatNumber(avgUnique)}${itemPct(avgUnique)} (T1: ${formatNumber(avg.uniqueTier1ItemsDropped)}, T2: ${formatNumber(avg.uniqueTier2ItemsDropped)}, T3: ${formatNumber(avg.uniqueTier3ItemsDropped)})`,
    `- Spells: ${formatNumber(avg.spellDrops)}  Maps: ${formatNumber(summary.totals.lootByKind.Map / Math.max(1, summary.runs))}  Currency pickups: ${formatNumber(summary.totals.lootByKind.Currency / Math.max(1, summary.runs))}`,
    "",
    `Item rolls (${ir.itemsDropped} items total across all runs):`,
    `- By rarity: ${Object.entries(ir.byRarity).map(([k, v]) => `${k}=${v}`).join(", ") || "none"}`,
    `- By slot:   ${bySlotText}`,
    `- Top stats: ${Object.entries(ir.byStatKey).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0)).slice(0, 12).map(([k, v]) => `${k}=${v}`).join(", ") || "none"}`,
    ...(byStatTierLines.length > 0 ? ["- Stat tier distribution:", ...byStatTierLines] : [])
  ];

  if (summary.shop) {
    lines.push(
      "",
      `Shop samples: ${summary.shop.samples} (tier ${summary.shop.tier})`,
      `- Items generated: ${summary.shop.itemsGenerated}`,
      `- Average price: ${formatNumber(summary.shop.prices.average)}`,
      `- Price range: ${formatNumber(summary.shop.prices.min)} - ${formatNumber(summary.shop.prices.max)}`,
      `- Movement speed affixes (shop): ${summary.shop.itemRolls.byStatKey.movementSpeedBonus ?? 0}`
    );
  }

  return lines.join("\n");
};
