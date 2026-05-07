import { mapConfig } from "../config/mapConfig";
import type { SimulationSummary, SingleRunSimulationMetrics, ShopSampleSummary } from "./simulationTypes";

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
      mapsGained: summary.mapsGained + run.mapsGained,
      rareItemsDropped: summary.rareItemsDropped + run.rareItemsDropped,
      exceptionalRareItemsDropped: summary.exceptionalRareItemsDropped + run.exceptionalRareItemsDropped,
      uniqueItemsDropped: summary.uniqueItemsDropped + run.uniqueItemsDropped,
      uniqueTier1ItemsDropped: summary.uniqueTier1ItemsDropped + run.uniqueTier1ItemsDropped,
      uniqueTier2ItemsDropped: summary.uniqueTier2ItemsDropped + run.uniqueTier2ItemsDropped,
      uniqueTier3ItemsDropped: summary.uniqueTier3ItemsDropped + run.uniqueTier3ItemsDropped,
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
      exceptionalRareItemsDropped: 0,
      uniqueItemsDropped: 0,
      uniqueTier1ItemsDropped: 0,
      uniqueTier2ItemsDropped: 0,
      uniqueTier3ItemsDropped: 0,
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
    shop,
    totals,
    itemRolls,
    averages: {
      completionRate: totals.completedRuns / runCount,
      deathRate: totals.deaths / runCount,
      timeoutRate: totals.timedOutRuns / runCount,
      durationSeconds: runs.reduce((total, run) => total + run.durationMs, 0) / runCount / 1000,
      goldGained: totals.goldGained / runCount,
      mapShardsGained: totals.mapShardsGained / runCount,
      mapsGained: totals.mapsGained / runCount,
      rareItemsDropped: totals.rareItemsDropped / runCount,
      exceptionalRareItemsDropped: totals.exceptionalRareItemsDropped / runCount,
      uniqueItemsDropped: totals.uniqueItemsDropped / runCount,
      uniqueTier1ItemsDropped: totals.uniqueTier1ItemsDropped / runCount,
      uniqueTier2ItemsDropped: totals.uniqueTier2ItemsDropped / runCount,
      uniqueTier3ItemsDropped: totals.uniqueTier3ItemsDropped / runCount,
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

  const lines = [
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
    `- Exceptional rares: ${summary.totals.exceptionalRareItemsDropped} (${formatNumber(summary.averages.exceptionalRareItemsDropped)}/run)`,
    `- Unique items: ${summary.totals.uniqueItemsDropped} (${formatNumber(summary.averages.uniqueItemsDropped)}/run)`,
    `- T1 uniques: ${summary.totals.uniqueTier1ItemsDropped} (${formatNumber(summary.averages.uniqueTier1ItemsDropped)}/run)`,
    `- T2 uniques: ${summary.totals.uniqueTier2ItemsDropped} (${formatNumber(summary.averages.uniqueTier2ItemsDropped)}/run)`,
    `- T3 uniques: ${summary.totals.uniqueTier3ItemsDropped} (${formatNumber(summary.averages.uniqueTier3ItemsDropped)}/run)`,
    `- Spells: ${summary.totals.spellDrops} (${formatNumber(summary.averages.spellDrops)}/run)`,
    `- Items total: ${summary.totals.lootByKind.Item}`,
    `- Currency total: ${summary.totals.lootByKind.Currency}`,
    `- Maps total: ${summary.totals.lootByKind.Map}`,
    "",
    "Item rolls (sampled):",
    `- Items: ${summary.itemRolls.itemsDropped}`,
    `- By rarity: ${Object.entries(summary.itemRolls.byRarity)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ") || "none"}`,
    `- Movement speed affixes: ${summary.itemRolls.byStatKey.movementSpeedBonus ?? 0}`,
    `- Top stats: ${Object.entries(summary.itemRolls.byStatKey)
      .sort(([, left], [, right]) => (right ?? 0) - (left ?? 0))
      .slice(0, 10)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ") || "none"}`
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
