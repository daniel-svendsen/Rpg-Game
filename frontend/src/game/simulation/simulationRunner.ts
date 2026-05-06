import type { CharacterRecord, CurrencyStack, InventoryItem, LootEntry, OwnedMapStack } from "../../shared/types/saveTypes";
import { mapConfig } from "../config/mapConfig";
import { createArenaRuntime, stepArenaRuntime, type ArenaRuntimeState } from "../domain/combat/arenaSimulation";
import { canUseLifeFlask, useLifeFlask } from "../domain/player/lifeFlask";
import { createSimulationBaselineCharacter } from "./simulationCharacter";
import { applySimulationBalanceOverrides } from "./simulationOverrides";
import { buildSimulationSummary } from "./simulationReport";
import type { SimulationRunOptions, SimulationSummary, SingleRunSimulationMetrics } from "./simulationTypes";

const DEFAULT_STEP_MS = 50;
const DEFAULT_MAX_RUN_DURATION_MS = 240_000;

const getCurrencyAmount = (currencies: CurrencyStack[], code: string): number =>
  currencies.find((entry) => entry.code === code)?.amount ?? 0;

const getTotalConsumableMaps = (consumableMaps: OwnedMapStack[]): number =>
  consumableMaps.reduce((total, entry) => total + entry.quantity, 0);

const countLootKinds = (lootEvents: LootEntry[]): Record<LootEntry["kind"], number> =>
  lootEvents.reduce(
    (totals, entry) => ({
      ...totals,
      [entry.kind]: totals[entry.kind] + 1
    }),
    {
      Item: 0,
      Spell: 0,
      Currency: 0,
      Map: 0
    }
  );

const syncRuntimePlayer = (runtime: ArenaRuntimeState, player: CharacterRecord): ArenaRuntimeState => ({
  ...runtime,
  player,
  snapshot: {
    ...runtime.snapshot,
    player
  }
});

const cloneCharacter = (character: CharacterRecord): CharacterRecord => structuredClone(character);

const getNewItems = (baselineItems: InventoryItem[], finalItems: InventoryItem[]): InventoryItem[] => {
  const baselineIds = new Set(baselineItems.map((item) => item.id));
  return finalItems.filter((item) => !baselineIds.has(item.id));
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
    Currency: 0,
    Map: 0
  };

  while (
    runtime.timeElapsedMs < maxRunDurationMs &&
    !runtime.snapshot.isComplete &&
    runtime.snapshot.player.currentHealth > 0
  ) {
    runtime = stepArenaRuntime(runtime, stepMs);

    const nextLootCounts = countLootKinds(runtime.snapshot.lootEvents);
    accumulatedLootByKind = {
      Item: accumulatedLootByKind.Item + nextLootCounts.Item,
      Spell: accumulatedLootByKind.Spell + nextLootCounts.Spell,
      Currency: accumulatedLootByKind.Currency + nextLootCounts.Currency,
      Map: accumulatedLootByKind.Map + nextLootCounts.Map
    };

    if (autoUseLifeFlaskThreshold !== null) {
      const healthRatio = runtime.snapshot.player.currentHealth / runtime.snapshot.player.derivedStats.maxHealth;

      if (
        healthRatio <= autoUseLifeFlaskThreshold &&
        canUseLifeFlask(runtime.snapshot.player)
      ) {
        runtime = syncRuntimePlayer(runtime, useLifeFlask(runtime.snapshot.player));
      }
    }
  }

  const finalPlayer = runtime.snapshot.player;
  const newItems = getNewItems(baselineCharacter.inventory, finalPlayer.inventory);
  const rareItemsDropped = newItems.filter((item) => item.rarity === "Rare").length;
  const uniqueItemsDropped = newItems.filter((item) => item.rarity === "Unique").length;
  const goldGained = finalPlayer.gold - baselineCharacter.gold;
  const mapShardsGained =
    getCurrencyAmount(finalPlayer.currencies, "mapShard") -
    getCurrencyAmount(baselineCharacter.currencies, "mapShard");
  const mapsGained =
    getTotalConsumableMaps(finalPlayer.mapProgress.consumableMaps) -
    getTotalConsumableMaps(baselineCharacter.mapProgress.consumableMaps);

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
    mapsGained,
    rareItemsDropped,
    uniqueItemsDropped,
    spellDrops: accumulatedLootByKind.Spell,
    lootByKind: accumulatedLootByKind,
    rareMonstersSpawned: runtime.telemetry.rareMonstersSpawned,
    rareMonstersKilled: runtime.telemetry.rareMonstersKilled
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
      options.overrides ?? null
    );
  } finally {
    restoreOverrides();
  }
};
