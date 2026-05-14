import type { CharacterRecord, CurrencyStack, InventoryItem, LootEntry, OwnedMapStack } from "../../shared/types/saveTypes";
import { mapConfig } from "../config/mapConfig";
import { createArenaRuntime, stepArenaRuntime, type ArenaRuntimeState } from "../domain/combat/arenaSimulation";
import { isExceptionalRare } from "../domain/items/itemPower";
import { createShopStock, getShopItemPrice } from "../domain/items/shopStock";
import { uniqueItemDefinitions } from "../config/itemConfig";
import { canUseLifeFlask, useLifeFlask } from "../domain/player/lifeFlask";
import { createSimulationBaselineCharacter } from "./simulationCharacter";
import { applySimulationBalanceOverrides } from "./simulationOverrides";
import { buildSimulationSummary } from "./simulationReport";
import type {
  DropCategory,
  SimulationRunOptions,
  SimulationSummary,
  SingleRunSimulationMetrics,
  ShopSampleSummary,
  CharacterSnapshot
} from "./simulationTypes";
import { spellConfig, supportSpellConfig } from "../config/spellConfig";
import { spellDropBalance, supportSpellDropBalance } from "../config/balance";
import { getAffixTierRangesForStat, type AffixTier } from "../config/itemAffixConfig";

const DEFAULT_STEP_MS = 50;
const DEFAULT_MAX_RUN_DURATION_MS = 240_000;

const getCurrencyAmount = (currencies: CurrencyStack[], code: string): number =>
  currencies.find((entry) => entry.code === code)?.amount ?? 0;

const getTotalConsumableMaps = (consumableMaps: OwnedMapStack[]): number =>
  consumableMaps
    .filter((entry) => entry.mapId.startsWith("tier"))
    .reduce((total, entry) => total + entry.quantity, 0);

const getTotalBossKeys = (consumableMaps: OwnedMapStack[]): number =>
  consumableMaps
    .filter((entry) => entry.mapId.startsWith("bossTier"))
    .reduce((total, entry) => total + entry.quantity, 0);

const countLootKinds = (lootEvents: LootEntry[]): Record<LootEntry["kind"], number> =>
  lootEvents.reduce(
    (totals, entry) => ({
      ...totals,
      [entry.kind]: totals[entry.kind] + 1
    }),
    {
      Item: 0,
      Spell: 0,
      Support: 0,
      Currency: 0,
      Map: 0
    }
  );

const emptyDropCategoryCounts = (): Record<DropCategory, number> => ({
  common: 0,
  chase: 0
});

const spellDropCategoryByName = new Map(
  spellDropBalance.pool.map((entry) => [
    spellConfig[entry.spellId]?.name ?? entry.spellId,
    entry.dropCategory
  ])
);

const supportDropCategoryByName = new Map(
  supportSpellDropBalance.pool.map((entry) => [
    supportSpellConfig[entry.supportSpellId]?.name ?? entry.supportSpellId,
    entry.dropCategory
  ])
);

const countDropCategories = (
  lootEvents: LootEntry[],
  kind: "Spell" | "Support"
): Record<DropCategory, number> => {
  const categoryByName = kind === "Spell" ? spellDropCategoryByName : supportDropCategoryByName;

  return lootEvents.reduce((totals, entry) => {
    if (entry.kind !== kind) {
      return totals;
    }

    const category = categoryByName.get(entry.name);

    if (!category) {
      return totals;
    }

    return {
      ...totals,
      [category]: totals[category] + 1
    };
  }, emptyDropCategoryCounts());
};

const addDropCategoryCounts = (
  left: Record<DropCategory, number>,
  right: Record<DropCategory, number>
): Record<DropCategory, number> => ({
  common: left.common + right.common,
  chase: left.chase + right.chase
});

const syncRuntimePlayer = (runtime: ArenaRuntimeState, player: CharacterRecord): ArenaRuntimeState => ({
  ...runtime,
  player,
  snapshot: {
    ...runtime.snapshot,
    player
  }
});

const cloneCharacter = (character: CharacterRecord): CharacterRecord => structuredClone(character);
const uniqueTierById = new Map(uniqueItemDefinitions.map((item) => [item.id, item.uniqueTier]));

const getNewItems = (baselineItems: InventoryItem[], finalItems: InventoryItem[]): InventoryItem[] => {
  const baselineIds = new Set(baselineItems.map((item) => item.id));
  return finalItems.filter((item) => !baselineIds.has(item.id));
};

type StatKey = keyof InventoryItem["statBonuses"];

const getTierForValue = (itemTier: number, statKey: StatKey, value: number): AffixTier | null => {
  const ranges = getAffixTierRangesForStat(itemTier, statKey);
  const resolved = Object.entries(ranges).find(([, [min, max]]) => value >= min && value <= max);
  return resolved ? (Number(resolved[0]) as AffixTier) : null;
};

const buildItemRollMetrics = (items: InventoryItem[]): SingleRunSimulationMetrics["itemRolls"] => {
  const metrics: SingleRunSimulationMetrics["itemRolls"] = {
    itemsDropped: 0,
    bySlot: {},
    byRarity: {},
    byStatKey: {},
    byStatTier: {}
  };

  items.forEach((item) => {
    metrics.itemsDropped += 1;

    if (item.slot) {
      metrics.bySlot[item.slot] = (metrics.bySlot[item.slot] ?? 0) + 1;
    }

    metrics.byRarity[item.rarity] = (metrics.byRarity[item.rarity] ?? 0) + 1;

    (Object.entries(item.statBonuses) as Array<[StatKey, number]>).forEach(([statKey, value]) => {
      metrics.byStatKey[statKey] = (metrics.byStatKey[statKey] ?? 0) + 1;

      const tier = getTierForValue(item.tier, statKey, value);

      if (!tier) {
        return;
      }

      metrics.byStatTier[statKey] ??= {};
      metrics.byStatTier[statKey]![tier] = (metrics.byStatTier[statKey]![tier] ?? 0) + 1;
    });
  });

  return metrics;
};

const runSingleSimulation = (
  baselineCharacter: CharacterRecord,
  mapId: string,
  runNumber: number,
  stepMs: number,
  maxRunDurationMs: number,
  autoUseLifeFlaskThreshold: number | null
): SingleRunSimulationMetrics => {
  let runtime = createArenaRuntime(cloneCharacter(baselineCharacter), mapId);
  let accumulatedLootByKind: Record<LootEntry["kind"], number> = {
    Item: 0,
    Spell: 0,
    Support: 0,
    Currency: 0,
    Map: 0
  };
  let accumulatedSpellDropsByCategory = emptyDropCategoryCounts();
  let accumulatedSupportDropsByCategory = emptyDropCategoryCounts();
  let flaskUses = 0;

  while (
    runtime.timeElapsedMs < maxRunDurationMs &&
    !runtime.snapshot.isComplete &&
    runtime.snapshot.player.currentHealth > 0
  ) {
    runtime = stepArenaRuntime(runtime, stepMs);

    const nextLootCounts = countLootKinds(runtime.snapshot.lootEvents);
    const nextSpellDropCategories = countDropCategories(runtime.snapshot.lootEvents, "Spell");
    const nextSupportDropCategories = countDropCategories(runtime.snapshot.lootEvents, "Support");
    accumulatedLootByKind = {
      Item: accumulatedLootByKind.Item + nextLootCounts.Item,
      Spell: accumulatedLootByKind.Spell + nextLootCounts.Spell,
      Support: accumulatedLootByKind.Support + nextLootCounts.Support,
      Currency: accumulatedLootByKind.Currency + nextLootCounts.Currency,
      Map: accumulatedLootByKind.Map + nextLootCounts.Map
    };
    accumulatedSpellDropsByCategory = addDropCategoryCounts(accumulatedSpellDropsByCategory, nextSpellDropCategories);
    accumulatedSupportDropsByCategory = addDropCategoryCounts(
      accumulatedSupportDropsByCategory,
      nextSupportDropCategories
    );

    if (autoUseLifeFlaskThreshold !== null) {
      const healthRatio = runtime.snapshot.player.currentHealth / runtime.snapshot.player.derivedStats.maxHealth;

      if (
        healthRatio <= autoUseLifeFlaskThreshold &&
        canUseLifeFlask(runtime.snapshot.player)
      ) {
        runtime = syncRuntimePlayer(runtime, useLifeFlask(runtime.snapshot.player));
        flaskUses += 1;
      }
    }
  }

  const finalPlayer = runtime.snapshot.player;
  const finalHealthPercent = baselineCharacter.derivedStats.maxHealth > 0
    ? finalPlayer.currentHealth / finalPlayer.derivedStats.maxHealth
    : 1;
  const newItems = getNewItems(baselineCharacter.inventory, finalPlayer.inventory);
  const normalItemsDropped = newItems.filter((item) => item.rarity === "Normal").length;
  const magicItemsDropped = newItems.filter((item) => item.rarity === "Magic").length;
  const rareItemsDropped = newItems.filter((item) => item.rarity === "Rare").length;
  const exceptionalRareItemsDropped = newItems.filter((item) => isExceptionalRare(item)).length;
  const uniqueItemsDropped = newItems.filter((item) => item.rarity === "Unique").length;
  const uniqueTier1ItemsDropped = newItems.filter(
    (item) => item.rarity === "Unique" && uniqueTierById.get(item.id.split("-")[0]) === 1
  ).length;
  const uniqueTier2ItemsDropped = newItems.filter(
    (item) => item.rarity === "Unique" && uniqueTierById.get(item.id.split("-")[0]) === 2
  ).length;
  const uniqueTier3ItemsDropped = newItems.filter(
    (item) => item.rarity === "Unique" && uniqueTierById.get(item.id.split("-")[0]) === 3
  ).length;
  const goldGained = finalPlayer.gold - baselineCharacter.gold;
  const mapShardsGained =
    getCurrencyAmount(finalPlayer.currencies, "mapShard") -
    getCurrencyAmount(baselineCharacter.currencies, "mapShard");
  const imbuingOrbsGained =
    getCurrencyAmount(finalPlayer.currencies, "imbuingOrb") -
    getCurrencyAmount(baselineCharacter.currencies, "imbuingOrb");
  const gemcuttersPrismsGained =
    getCurrencyAmount(finalPlayer.currencies, "gemcuttersPrism") -
    getCurrencyAmount(baselineCharacter.currencies, "gemcuttersPrism");
  const mapsGained =
    getTotalConsumableMaps(finalPlayer.mapProgress.consumableMaps) -
    getTotalConsumableMaps(baselineCharacter.mapProgress.consumableMaps);
  const bossKeysGained =
    getTotalBossKeys(finalPlayer.mapProgress.consumableMaps) -
    getTotalBossKeys(baselineCharacter.mapProgress.consumableMaps);
  const itemRolls = buildItemRollMetrics(newItems);

  return {
    runNumber,
    mapId,
    mapName: runtime.mapName,
    completed: runtime.snapshot.isComplete,
    died: finalPlayer.currentHealth <= 0,
    timedOut: !runtime.snapshot.isComplete && finalPlayer.currentHealth > 0 && runtime.timeElapsedMs >= maxRunDurationMs,
    durationMs: runtime.timeElapsedMs,
    goldGained,
    mapShardsGained,
    imbuingOrbsGained,
    gemcuttersPrismsGained,
    mapsGained,
    bossKeysGained,
    normalItemsDropped,
    magicItemsDropped,
    rareItemsDropped,
    exceptionalRareItemsDropped,
    uniqueItemsDropped,
    uniqueTier1ItemsDropped,
    uniqueTier2ItemsDropped,
    uniqueTier3ItemsDropped,
    spellDrops: accumulatedLootByKind.Spell,
    spellDropsByCategory: accumulatedSpellDropsByCategory,
    supportDropsByCategory: accumulatedSupportDropsByCategory,
    lootByKind: accumulatedLootByKind,
    rareMonstersSpawned: runtime.telemetry.rareMonstersSpawned,
    rareMonstersKilled: runtime.telemetry.rareMonstersKilled,
    totalMonstersKilled: runtime.telemetry.totalMonstersKilled,
    packsSpawned: runtime.telemetry.packsSpawned,
    packsCleared: runtime.telemetry.packsCleared,
    guardianSpawned: runtime.telemetry.guardianSpawned,
    guardianKilled: runtime.telemetry.guardianKilled,
    hitsTaken: runtime.telemetry.hitsTaken,
    evades: runtime.telemetry.evades,
    damageDealtToPlayer: runtime.telemetry.damageDealtToPlayer,
    damagePreventedByResistance: runtime.telemetry.damagePreventedByResistance,
    damagePreventedByArmor: runtime.telemetry.damagePreventedByArmor,
    damageDealtByPlayer: runtime.telemetry.damageDealtByPlayer,
    critsLanded: runtime.telemetry.critsLanded,
    spellsCast: runtime.telemetry.spellsCast,
    finalHealthPercent,
    timeMovingMs: runtime.telemetry.timeMovingMs,
    timeFightingMs: runtime.telemetry.timeFightingMs,
    itemRolls
  };
};

export const simulateMapRuns = (options: SimulationRunOptions): SimulationSummary => {
  if (!mapConfig[options.mapId]) {
    throw new Error(`Unknown map id '${options.mapId}'.`);
  }

  if (!Number.isInteger(options.runs) || options.runs <= 0) {
    throw new Error("Runs must be a positive integer.");
  }

  const stepMs = options.stepMs ?? DEFAULT_STEP_MS;
  const maxRunDurationMs = options.maxRunDurationMs ?? DEFAULT_MAX_RUN_DURATION_MS;
  const autoUseLifeFlaskThreshold =
    options.autoUseLifeFlaskThreshold === undefined
      ? 0.45
      : options.autoUseLifeFlaskThreshold;
  const restoreOverrides = applySimulationBalanceOverrides(options.overrides);

  try {
    const baselineCharacter = createSimulationBaselineCharacter(options.character);
    const shopSamples = options.shopSamples ?? 0;
    let shop: ShopSampleSummary | null = null;

    if (shopSamples > 0) {
      const tier =
        options.shopTier ?? Math.max(1, baselineCharacter.mapProgress.highestUnlockedTier + 1);
      const shopItems = Array.from({ length: shopSamples }, () => createShopStock(tier)).flat();
      const prices = shopItems.map((item) => getShopItemPrice(item));
      const totalPrice = prices.reduce((total, value) => total + value, 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      shop = {
        samples: shopSamples,
        tier,
        itemsGenerated: shopItems.length,
        prices: {
          min: minPrice,
          max: maxPrice,
          average: prices.length > 0 ? totalPrice / prices.length : 0
        },
        itemRolls: buildItemRollMetrics(shopItems)
      };
    }

    const characterSnapshot: CharacterSnapshot = {
      maxHealth: baselineCharacter.derivedStats.maxHealth,
      armor: baselineCharacter.derivedStats.armor,
      evasion: baselineCharacter.derivedStats.evasion,
      fireResistance: baselineCharacter.derivedStats.resistances.Fire,
      coldResistance: baselineCharacter.derivedStats.resistances.Cold,
      lightningResistance: baselineCharacter.derivedStats.resistances.Lightning,
      critChance: baselineCharacter.derivedStats.critChance,
      critMultiplier: baselineCharacter.derivedStats.critMultiplier,
      movementSpeedMultiplier: baselineCharacter.derivedStats.movementSpeedMultiplier,
      castSpeedMultiplier: baselineCharacter.derivedStats.castSpeedMultiplier,
      spellPowerMultiplier: baselineCharacter.derivedStats.spellPowerMultiplier
    };

    const runMetrics = Array.from({ length: options.runs }, (_, index) =>
      runSingleSimulation(
        baselineCharacter,
        options.mapId,
        index + 1,
        stepMs,
        maxRunDurationMs,
        autoUseLifeFlaskThreshold
      )
    );

    return buildSimulationSummary(
      options.profileName,
      options.mapId,
      runMetrics,
      stepMs,
      maxRunDurationMs,
      autoUseLifeFlaskThreshold,
      options.overrides ?? null,
      characterSnapshot,
      shop
    );
  } finally {
    restoreOverrides();
  }
};
