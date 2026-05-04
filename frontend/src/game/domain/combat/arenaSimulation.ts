import { balanceConfig } from "../../config/balanceConfig";
import {
  getMapBalanceByTier,
  itemBalance,
  mapBalance,
  monsterBalance,
  progressionBalance
} from "../../config/balance";
import { mapConfig, type MapDefinition } from "../../config/mapConfig";
import { monsterDefinitions } from "../../config/monsterConfig";
import { generateItemDropForCharacter } from "../items/itemGenerator";
import { getItemPowerScore, isUpgradeForCharacter } from "../items/itemPower";
import { getEquippedUniqueModifiers } from "../items/uniqueEffects";
import { addOwnedMap } from "../maps/mapProgress";
import { gainLifeFlaskCharges } from "../player/lifeFlask";
import { applyExperience } from "../progression/progression";
import { getSpellName, rollSpellDrop } from "../spells/spellDrops";
import { resolveSpell } from "../spells/spellEngine";
import { getItemSlotLabel } from "../../config/itemConfig";
import { createClientId } from "../../../shared/utils/id";
import type {
  ArenaEnemyState,
  ArenaSnapshot,
  CharacterRecord,
  CurrencyStack,
  FloatingTextState,
  LootEntry,
  MonsterRarity
} from "../../../shared/types/saveTypes";

const ARENA_WIDTH = 960;
const ARENA_HEIGHT = 640;
const PLAYER_X = ARENA_WIDTH / 2;
const PLAYER_Y = ARENA_HEIGHT / 2;

interface InternalEnemyState extends ArenaEnemyState {
  damage: number;
  movementSpeed: number;
  experienceReward: number;
  goldReward: number;
  resistances: {
    Fire: number;
    Cold: number;
    Lightning: number;
  };
  lastContactDamageAt: number;
}

export interface ArenaRuntimeState {
  mapId: string;
  player: CharacterRecord;
  mapName: string;
  mapTier: number;
  enemies: InternalEnemyState[];
  timeElapsedMs: number;
  snapshot: ArenaSnapshot;
  enemyPoolRemaining: number;
  nextSpawnAtMs: number;
  lastCastAtMs: number;
  lastPlayerDamageAtMs: number;
}

const distance = (aX: number, aY: number, bX: number, bY: number): number =>
  Math.hypot(aX - bX, aY - bY);

const getChainTargetIds = (
  enemies: InternalEnemyState[],
  firstEnemyId: string,
  maxTargets: number,
  chainRange: number
): string[] => {
  const selectedIds = [firstEnemyId];
  let currentEnemy = enemies.find((enemy) => enemy.id === firstEnemyId);

  while (currentEnemy && selectedIds.length < maxTargets) {
    const chainSource = currentEnemy;
    const nextEnemy = enemies
      .filter(
        (enemy) =>
          !selectedIds.includes(enemy.id) &&
          distance(enemy.x, enemy.y, chainSource.x, chainSource.y) <= chainRange
      )
      .sort(
        (left, right) =>
          distance(left.x, left.y, chainSource.x, chainSource.y) -
          distance(right.x, right.y, chainSource.x, chainSource.y)
      )[0];

    if (!nextEnemy) {
      break;
    }

    selectedIds.push(nextEnemy.id);
    currentEnemy = nextEnemy;
  }

  return selectedIds;
};

const createEnemy = (map: MapDefinition, rarity: MonsterRarity): InternalEnemyState => {
  const tierBalance = getMapBalanceByTier(map.tier);
  const monsterDefinition =
    monsterDefinitions.find((monster) => monster.rarity === rarity) ?? monsterDefinitions[0];
  const rarityHealthMultiplier =
    rarity === "Rare"
      ? monsterBalance.rareHealthMultiplier
      : monsterBalance.normalHealthMultiplier;
  const rarityDamageMultiplier =
    rarity === "Rare"
      ? monsterBalance.rareDamageMultiplier
      : monsterBalance.normalDamageMultiplier;
  const spawnEdge = Math.floor(Math.random() * 4);
  const spawnX =
    spawnEdge < 2 ? (spawnEdge === 0 ? 40 : ARENA_WIDTH - 40) : Math.random() * ARENA_WIDTH;
  const spawnY =
    spawnEdge >= 2 ? (spawnEdge === 2 ? 40 : ARENA_HEIGHT - 40) : Math.random() * ARENA_HEIGHT;
  const maxHealth = Math.round(
    monsterBalance.baseHealth * map.enemyHealthMultiplier * rarityHealthMultiplier
  );
  const tierResistance = map.tier * monsterBalance.resistancePerTier;
  const rareResistanceBonus = rarity === "Rare" ? monsterBalance.rareResistanceBonus : 0;
  const baseResistances = monsterDefinition.resistances ?? {};
  const resolveResistance = (type: "Fire" | "Cold" | "Lightning") =>
    Math.min(
      monsterBalance.maxResistance,
      (baseResistances[type] ?? 0) + tierResistance + rareResistanceBonus
    );

  return {
    id: `${monsterDefinition.id}-${createClientId()}`,
    x: spawnX,
    y: spawnY,
    health: maxHealth,
    maxHealth,
    rarity,
    damage: Math.round(
      monsterBalance.baseDamage * map.enemyDamageMultiplier * rarityDamageMultiplier
    ),
    movementSpeed: rarity === "Rare" ? tierBalance.rareMonsterSpeed : tierBalance.normalMonsterSpeed,
    experienceReward: Math.round(
      (rarity === "Rare"
        ? progressionBalance.rewards.rareExperienceBase
        : progressionBalance.rewards.normalExperienceBase) * map.experienceMultiplier
    ),
    goldReward: Math.round(
      (rarity === "Rare"
        ? progressionBalance.rewards.rareGoldBase
        : progressionBalance.rewards.normalGoldBase) * map.goldMultiplier
    ),
    resistances: {
      Fire: resolveResistance("Fire"),
      Cold: resolveResistance("Cold"),
      Lightning: resolveResistance("Lightning")
    },
    lastContactDamageAt: 0
  };
};

const addCurrency = (currencies: CurrencyStack[], code: string, amount: number): CurrencyStack[] => {
  const existing = currencies.find((entry) => entry.code === code);

  if (!existing) {
    return [...currencies, { code, amount }];
  }

  return currencies.map((entry) =>
    entry.code === code ? { ...entry, amount: entry.amount + amount } : entry
  );
};

const rollDrops = (
  character: CharacterRecord,
  mapTier: number,
  rarity: MonsterRarity
): { character: CharacterRecord; lootEvents: LootEntry[] } => {
  const tierBalance = getMapBalanceByTier(mapTier);
  const isRareMonster = rarity === "Rare";
  const uniqueModifiers = getEquippedUniqueModifiers(character);
  let nextCharacter = {
    ...character
  };
  const lootEvents: LootEntry[] = [];

  const shouldDropItem = Math.random() < tierBalance.itemDropRate;

  if (shouldDropItem) {
    const itemCount = isRareMonster
      ? Math.floor(
          Math.random() *
            (tierBalance.rareItemDropsMax - tierBalance.rareItemDropsMin + 1)
        ) + tierBalance.rareItemDropsMin
      : 1;

    const items = Array.from({ length: itemCount }, () =>
      generateItemDropForCharacter(nextCharacter, Math.max(1, mapTier), isRareMonster)
    );
    nextCharacter = {
      ...nextCharacter,
      inventory: [...nextCharacter.inventory, ...items]
    };
    items.forEach((item) => {
      lootEvents.push({
        id: `${item.id}-loot`,
        kind: "Item",
        name: item.name,
        details: [
          `Tier ${item.tier} ${item.slot ? getItemSlotLabel(item.slot) : "Item"}`,
          `Power ${getItemPowerScore(item).toFixed(0)}`,
          ...Object.entries(item.statBonuses).map(([key, value]) => `${key} +${value}`)
        ],
        isUpgrade: isUpgradeForCharacter(character, item)
      });
    });
  }

  if (
    Math.random() <
    tierBalance.mapShardDropRate *
      (isRareMonster ? itemBalance.rareMonsterMapShardDropMultiplier : 1) *
      uniqueModifiers.mapShardDropMultiplier
  ) {
    nextCharacter = {
      ...nextCharacter,
      currencies: addCurrency(nextCharacter.currencies, "mapShard", 1)
    };
    lootEvents.push({
      id: `currency-${createClientId()}`,
      kind: "Currency",
      name: "Map Shard",
      details: ["Used for future map upgrades and crafting"],
      isUpgrade: false
    });
  }

  const spellId = rollSpellDrop(nextCharacter, mapTier, rarity);

  if (spellId) {
    nextCharacter = {
      ...nextCharacter,
      unlockedSpellIds: [...nextCharacter.unlockedSpellIds, spellId]
    };
    lootEvents.push({
      id: `spell-${spellId}-${createClientId()}`,
      kind: "Spell",
      name: getSpellName(spellId),
      details: ["Unlocked permanently in your spell inventory"],
      isUpgrade: true
    });
  }

  if (mapTier < mapBalance.maxTier && Math.random() < tierBalance.mapDropRate) {
    const nextTier = mapTier + 1;
    nextCharacter = addOwnedMap(nextCharacter, `tier${nextTier}Map`, nextTier);
    lootEvents.push({
      id: `map-${nextTier}-${createClientId()}`,
      kind: "Map",
      name: `Tier ${nextTier} Map`,
      details: ["Consumable map added to your map inventory"],
      isUpgrade: true
    });
  }

  return { character: nextCharacter, lootEvents };
};

export const createArenaRuntime = (character: CharacterRecord, mapId: string): ArenaRuntimeState => {
  const map = mapConfig[mapId];

  return {
    mapId,
    player: character,
    mapName: map.name,
    mapTier: map.tier,
    enemies: [],
    timeElapsedMs: 0,
    snapshot: {
      timeElapsedMs: 0,
      mapName: map.name,
      mapTier: map.tier,
      playerX: PLAYER_X,
      playerY: PLAYER_Y,
      player: character,
      enemies: [],
      floatingTexts: [],
      lootEvents: [],
      isComplete: false
    },
    enemyPoolRemaining: map.monsterCount,
    nextSpawnAtMs: 0,
    lastCastAtMs: -999_999,
    lastPlayerDamageAtMs: -999_999
  };
};

export const stepArenaRuntime = (state: ArenaRuntimeState, deltaMs: number): ArenaRuntimeState => {
  const nextTime = state.timeElapsedMs + deltaMs;
  let nextPlayer = state.player;
  let nextEnemies = [...state.enemies];
  const floatingTexts: FloatingTextState[] = [];
  const lootEvents: LootEntry[] = [];
  let enemyPoolRemaining = state.enemyPoolRemaining;
  let nextSpawnAtMs = state.nextSpawnAtMs;
  let lastCastAtMs = state.lastCastAtMs;
  let lastPlayerDamageAtMs = state.lastPlayerDamageAtMs;
  const mapTier = state.mapTier;
  const map = mapConfig[state.mapId];

  if (enemyPoolRemaining > 0 && nextTime >= nextSpawnAtMs) {
    const tierBalance = getMapBalanceByTier(map.tier);
    const isRareMonster = Math.random() < tierBalance.rareMonsterChance;
    const internalEnemy = createEnemy(map, isRareMonster ? "Rare" : "Normal");
    nextEnemies = [...nextEnemies, internalEnemy];
    enemyPoolRemaining -= 1;
    nextSpawnAtMs = nextTime + monsterBalance.spawnIntervalMs;
  }

  nextEnemies = nextEnemies.map((enemy) => {
    const directionX = PLAYER_X - enemy.x;
    const directionY = PLAYER_Y - enemy.y;
    const length = Math.max(1, Math.hypot(directionX, directionY));
    const movement = (enemy.movementSpeed * deltaMs) / 1000;

    return {
      ...enemy,
      x: enemy.x + (directionX / length) * movement,
      y: enemy.y + (directionY / length) * movement
    };
  });

  nextEnemies = nextEnemies.map((enemy) => {
    const closeEnoughToHit = distance(enemy.x, enemy.y, PLAYER_X, PLAYER_Y) <= 26;

    if (
      !closeEnoughToHit ||
      nextTime - enemy.lastContactDamageAt < balanceConfig.combat.enemyContactDamageIntervalMs
    ) {
      return enemy;
    }

    nextPlayer = {
      ...nextPlayer,
      currentHealth: Math.max(
        0,
        nextPlayer.currentHealth -
          Math.max(1, Math.round(enemy.damage * getEquippedUniqueModifiers(nextPlayer).enemyContactDamageTakenMultiplier))
      )
    };
    lastPlayerDamageAtMs = nextTime;
    floatingTexts.push({
      id: `${enemy.id}-attack-${nextTime}`,
      x: PLAYER_X - 14,
      y: PLAYER_Y - 26,
      text: `-${enemy.damage}`
    });

    return {
      ...enemy,
      lastContactDamageAt: nextTime
    };
  });

  const activeLoadout = nextPlayer.spellLoadout[0];

  if (activeLoadout && nextEnemies.length > 0) {
    const resolvedSpell = resolveSpell(
      nextPlayer,
      activeLoadout.mainSpellId,
      activeLoadout.supportSpellIds
    );

    if (nextTime - lastCastAtMs >= resolvedSpell.cooldownMs) {
      lastCastAtMs = nextTime;
      const sortedEnemies = [...nextEnemies].sort(
        (left, right) =>
          distance(left.x, left.y, PLAYER_X, PLAYER_Y) -
          distance(right.x, right.y, PLAYER_X, PLAYER_Y)
      );
      const primaryTarget = sortedEnemies[0];

      const targetedEnemyIds =
        resolvedSpell.areaRadius > 0 && primaryTarget
          ? sortedEnemies
              .filter(
                (enemy) =>
                  distance(enemy.x, enemy.y, primaryTarget.x, primaryTarget.y) <= resolvedSpell.areaRadius
              )
              .map((enemy) => enemy.id)
          : primaryTarget
            ? getChainTargetIds(
                sortedEnemies,
                primaryTarget.id,
                Math.max(1, resolvedSpell.projectileCount + resolvedSpell.chainCount),
                resolvedSpell.chainRange
              )
            : [];

      nextEnemies = nextEnemies.flatMap((enemy) => {
        if (!targetedEnemyIds.includes(enemy.id)) {
          return [enemy];
        }

        const didCrit = Math.random() < resolvedSpell.critChance;
        const baseDamage = didCrit ? Math.round(resolvedSpell.damage * 1.6) : resolvedSpell.damage;
        const relevantResistances = (["Fire", "Cold", "Lightning"] as const)
          .filter((type) => resolvedSpell.tags.includes(type))
          .map((type) => Math.max(0, enemy.resistances[type] - resolvedSpell.resistancePenetration[type]));
        const appliedResistance =
          relevantResistances.length > 0 ? Math.max(...relevantResistances) : 0;
        const totalDamage = Math.max(1, Math.round(baseDamage * (1 - appliedResistance)));
        const remainingHealth = enemy.health - totalDamage;

        floatingTexts.push({
          id: `${enemy.id}-hit-${nextTime}`,
          x: enemy.x,
          y: enemy.y - 10,
          text: didCrit ? `Crit ${totalDamage}` : `${totalDamage}`
        });

        if (remainingHealth > 0) {
          return [{ ...enemy, health: remainingHealth }];
        }

        nextPlayer = applyExperience(
          {
            ...nextPlayer,
            gold: nextPlayer.gold + enemy.goldReward
          },
          enemy.experienceReward
        );
        nextPlayer = gainLifeFlaskCharges(
          nextPlayer,
          (enemy.rarity === "Rare"
            ? balanceConfig.healing.lifeFlask.rareKillCharges
            : balanceConfig.healing.lifeFlask.normalKillCharges) +
            getEquippedUniqueModifiers(nextPlayer).extraLifeFlaskChargesOnKill
        );
        const dropResult = rollDrops(nextPlayer, mapTier, enemy.rarity);
        nextPlayer = dropResult.character;
        lootEvents.push(...dropResult.lootEvents);

        return [];
      });
    }
  }

  const allEnemiesDefeated = enemyPoolRemaining === 0 && nextEnemies.length === 0;
  const snapshot: ArenaSnapshot = {
    timeElapsedMs: nextTime,
    mapName: state.mapName,
    mapTier,
    playerX: PLAYER_X,
    playerY: PLAYER_Y,
    player: nextPlayer,
    enemies: nextEnemies.map((enemy) => ({
      id: enemy.id,
      x: enemy.x,
      y: enemy.y,
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      rarity: enemy.rarity
    })),
    floatingTexts,
    lootEvents,
    isComplete: allEnemiesDefeated
  };

  return {
    mapId: state.mapId,
    player: nextPlayer,
    mapName: state.mapName,
    mapTier,
    enemies: nextEnemies,
    timeElapsedMs: nextTime,
    enemyPoolRemaining,
    nextSpawnAtMs,
    lastCastAtMs,
    lastPlayerDamageAtMs,
    snapshot
  };
};
