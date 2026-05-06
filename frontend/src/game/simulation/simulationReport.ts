import { mapConfig } from "../config/mapConfig";
import type { SimulationSummary, SingleRunSimulationMetrics } from "./simulationTypes";

const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;
const formatNumber = (value: number): string => value.toFixed(2).replace(/\.00$/, "");

export const buildSimulationSummary = (
  profileName: string,
  mapId: string,
  runs: SingleRunSimulationMetrics[],
  stepMs: number,
  maxRunDurationMs: number,
  autoUseLifeFlaskThreshold: number | null,
  overrides: SimulationSummary["overrides"]
): SimulationSummary => {
  const totals = runs.reduce(
    (summary, run) => ({
      completedRuns: summary.completedRuns + (run.completed ? 1 : 0),
      deaths: summary.deaths + (run.died ? 1 : 0),
      timedOutRuns: summary.timedOutRuns + (run.timedOut ? 1 : 0),
      goldGained: summary.goldGained + run.goldGained,
      mapShardsGained: summary.mapShardsGained + run.mapShardsGained,
      mapsGained: summary.mapsGained + run.mapsGained,
      rareItemsDropped: summary.rareItemsDropped + run.rareItemsDropped,
      uniqueItemsDropped: summary.uniqueItemsDropped + run.uniqueItemsDropped,
      spellDrops: summary.spellDrops + run.spellDrops,
      rareMonstersSpawned: summary.rareMonstersSpawned + run.rareMonstersSpawned,
      rareMonstersKilled: summary.rareMonstersKilled + run.rareMonstersKilled,
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
      mapsGained: 0,
      rareItemsDropped: 0,
      uniqueItemsDropped: 0,
      spellDrops: 0,
      rareMonstersSpawned: 0,
      rareMonstersKilled: 0,
      lootByKind: {
        Item: 0,
        Spell: 0,
        Currency: 0,
        Map: 0
      }
    }
  );
  const runCount = Math.max(1, runs.length);

  return {
    profileName,
    mapId,
    mapName: mapConfig[mapId]?.name ?? mapId,
    runs: runs.length,
    stepMs,
    maxRunDurationMs,
    autoUseLifeFlaskThreshold,
    overrides,
    totals,
    averages: {
      completionRate: totals.completedRuns / runCount,
      deathRate: totals.deaths / runCount,
      timeoutRate: totals.timedOutRuns / runCount,
      durationSeconds: runs.reduce((total, run) => total + run.durationMs, 0) / runCount / 1000,
      goldGained: totals.goldGained / runCount,
      mapShardsGained: totals.mapShardsGained / runCount,
      mapsGained: totals.mapsGained / runCount,
      rareItemsDropped: totals.rareItemsDropped / runCount,
      uniqueItemsDropped: totals.uniqueItemsDropped / runCount,
      spellDrops: totals.spellDrops / runCount,
      rareMonstersSpawned: totals.rareMonstersSpawned / runCount,
      rareMonstersKilled: totals.rareMonstersKilled / runCount
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

  return [
    `Profile: ${summary.profileName}`,
    `Map: ${summary.mapName} (${summary.mapId})`,
    `Runs: ${summary.runs}`,
    `Step: ${summary.stepMs}ms`,
    `Max run time: ${formatNumber(summary.maxRunDurationMs / 1000)}s`,
    `Auto life flask: ${flaskText}`,
    `Overrides: ${overridesText}`,
    "",
    `Completion rate: ${formatPercent(summary.averages.completionRate)}`,
    `Death rate: ${formatPercent(summary.averages.deathRate)}`,
    `Timeout rate: ${formatPercent(summary.averages.timeoutRate)}`,
    `Average run time: ${formatNumber(summary.averages.durationSeconds)}s`,
    `Average gold: ${formatNumber(summary.averages.goldGained)}`,
    `Average map shards: ${formatNumber(summary.averages.mapShardsGained)}`,
    `Map sustain: ${formatNumber(summary.averages.mapsGained)} maps/run`,
    `Average rares encountered: ${formatNumber(summary.averages.rareMonstersSpawned)}`,
    `Average rares killed: ${formatNumber(summary.averages.rareMonstersKilled)}`,
    "",
    "Drops:",
    `- Rare items: ${summary.totals.rareItemsDropped} (${formatNumber(summary.averages.rareItemsDropped)}/run)`,
    `- Unique items: ${summary.totals.uniqueItemsDropped} (${formatNumber(summary.averages.uniqueItemsDropped)}/run)`,
    `- Spells: ${summary.totals.spellDrops} (${formatNumber(summary.averages.spellDrops)}/run)`,
    `- Items total: ${summary.totals.lootByKind.Item}`,
    `- Currency total: ${summary.totals.lootByKind.Currency}`,
    `- Maps total: ${summary.totals.lootByKind.Map}`
  ].join("\n");
};
