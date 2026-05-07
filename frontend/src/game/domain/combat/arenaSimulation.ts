import { balanceConfig } from "../../config/balanceConfig";
import {
  getMapBalanceByTier,
  itemBalance,
  mapBalance,
  monsterBalance,
  progressionBalance
} from "../../config/balance";
import { mapConfig } from "../../config/mapConfig";
import { monsterDefinitions } from "../../config/monsterConfig";
import { generateItemDropForCharacter } from "../items/itemGenerator";
import { getItemPowerScore, isUpgradeForCharacter } from "../items/itemPower";
import { getEquippedUniqueModifiers } from "../items/uniqueEffects";
import { addOwnedMap } from "../maps/mapProgress";
import { resolveMapInstance, type ResolvedMapInstance } from "../maps/mapEnhancements";
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
  MapEnhancementInstance,
  MonsterRarity
} from "../../../shared/types/saveTypes";

const ARENA_WIDTH = 960;
const ARENA_HEIGHT = 640;
const PLAYER_BASE_MOVEMENT_SPEED = 120;
const PLAYER_COMBAT_STOP_RANGE = 160;
const AUTO_LOOT_DELAY_MS = 450;

type PackId = string;

interface MonsterPackState {
  id: PackId;
  centerX: number;
  centerY: number;
}

interface InternalEnemyState extends ArenaEnemyState {
  packId: PackId;
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
  resolvedMap: ResolvedMapInstance;
  player: CharacterRecord;
  mapName: string;
  mapTier: number;
  enemies: InternalEnemyState[];
  packs: MonsterPackState[];
  timeElapsedMs: number;
  snapshot: ArenaSnapshot;
  telemetry: {
    rareMonstersSpawned: number;
    rareMonstersKilled: number;
    totalMonstersKilled: number;
  };
  lastCastAtMs: number;
  lastPlayerDamageAtMs: number;
  playerX: number;
  playerY: number;
  autoMove: {
    enabled: boolean;
    targetPackId: PackId | null;
    lootPauseUntilMs: number;
  };
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

const createEnemy = (
  map: ResolvedMapInstance,
  rarity: MonsterRarity,
  packId: PackId,
  x: number,
  y: number
): InternalEnemyState => {
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
  const maxHealth = Math.round(
    monsterBalance.baseHealth * map.enemyHealthMultiplier * rarityHealthMultiplier
  );
  const tierResistance = map.tier * monsterBalance.resistancePerTier;
  const rareResistanceBonus = rarity === "Rare" ? monsterBalance.rareResistanceBonus : 0;
  const baseResistances = monsterDefinition.resistances ?? {};
  const resolveResistance = (type: "Fire" | "Cold" | "Lightning") =>
    Math.min(
      monsterBalance.maxResistance,
      (baseResistances[type] ?? 0) +
        tierResistance +
        rareResistanceBonus +
        map.enhancementEffects.enemyResistanceBonus
    );

  return {
    id: `${monsterDefinition.id}-${createClientId()}`,
    packId,
    x,
    y,
    health: maxHealth,
    maxHealth,
    rarity,
    damage: Math.round(
      monsterBalance.baseDamage * map.enemyDamageMultiplier * rarityDamageMultiplier
    ),
    movementSpeed:
      (rarity === "Rare" ? tierBalance.rareMonsterSpeed : tierBalance.normalMonsterSpeed) *
      map.enhancementEffects.enemySpeedMultiplier,
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

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const createMonsterPacks = (map: ResolvedMapInstance): { packs: MonsterPackState[]; enemies: InternalEnemyState[]; rareMonstersSpawned: number } => {
  const packs: MonsterPackState[] = [];
  const enemies: InternalEnemyState[] = [];

  const packSizeMin = 3;
  const packSizeMax = 6;
  const packRadius = 46;
  const packCount = Math.max(1, Math.ceil(map.monsterCount / ((packSizeMin + packSizeMax) / 2)));

  const tierBalance = getMapBalanceByTier(map.tier);
  const rareChancePerPack = tierBalance.rareMonsterChance;

  let remaining = map.monsterCount;
  let rareMonstersSpawned = 0;

  for (let packIndex = 0; packIndex < packCount && remaining > 0; packIndex += 1) {
    const packId = `pack-${packIndex}-${createClientId()}`;
    const centerX = 80 + Math.random() * (ARENA_WIDTH - 160);
    const centerY = 80 + Math.random() * (ARENA_HEIGHT - 160);

    packs.push({ id: packId, centerX, centerY });

    const packSize = Math.min(
      remaining,
      Math.floor(Math.random() * (packSizeMax - packSizeMin + 1)) + packSizeMin
    );
    remaining -= packSize;

    const hasRare = Math.random() < rareChancePerPack && packSize > 0;
    let rareUsed = false;

    for (let memberIndex = 0; memberIndex < packSize; memberIndex += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * packRadius;
      const x = clamp(centerX + Math.cos(angle) * radius, 40, ARENA_WIDTH - 40);
      const y = clamp(centerY + Math.sin(angle) * radius, 40, ARENA_HEIGHT - 40);

      const rarity: MonsterRarity = hasRare && !rareUsed ? "Rare" : "Normal";
      rareUsed ||= rarity === "Rare";
      if (rarity === "Rare") {
        rareMonstersSpawned += 1;
      }

      enemies.push(createEnemy(map, rarity, packId, x, y));
    }
  }

  return { packs, enemies, rareMonstersSpawned };
};

const getAlivePackIds = (enemies: InternalEnemyState[]): Set<PackId> =>
  new Set(enemies.map((enemy) => enemy.packId));

const getPackCenter = (pack: MonsterPackState, enemies: InternalEnemyState[]): { x: number; y: number } => {
  const members = enemies.filter((enemy) => enemy.packId === pack.id);

  if (members.length === 0) {
    return { x: pack.centerX, y: pack.centerY };
  }

  const sum = members.reduce(
    (total, enemy) => ({ x: total.x + enemy.x, y: total.y + enemy.y }),
    { x: 0, y: 0 }
  );

  return { x: sum.x / members.length, y: sum.y / members.length };
};

const selectNearestPack = (
  packs: MonsterPackState[],
  enemies: InternalEnemyState[],
  playerX: number,
  playerY: number
): PackId | null => {
  const alivePackIds = getAlivePackIds(enemies);
  const candidates = packs.filter((pack) => alivePackIds.has(pack.id));

  if (candidates.length === 0) {
    return null;
  }

  return (
    [...candidates]
      .sort((left, right) => {
        const leftCenter = getPackCenter(left, enemies);
        const rightCenter = getPackCenter(right, enemies);
        return (
          distance(playerX, playerY, leftCenter.x, leftCenter.y) -
          distance(playerX, playerY, rightCenter.x, rightCenter.y)
        );
      })[0]?.id ?? null
  );
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
  rarity: MonsterRarity,
  resolvedMap: ResolvedMapInstance
): { character: CharacterRecord; lootEvents: LootEntry[] } => {
  const tierBalance = getMapBalanceByTier(mapTier);
  const isRareMonster = rarity === "Rare";
  const uniqueModifiers = getEquippedUniqueModifiers(character);
  let nextCharacter = {
    ...character
  };
  const lootEvents: LootEntry[] = [];

  const shouldDropItem =
    Math.random() < tierBalance.itemDropRate * resolvedMap.dropRateMultiplier * resolvedMap.enhancementEffects.itemDropRateMultiplier;

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
          `Item Tier ${item.tier} ${item.slot ? getItemSlotLabel(item.slot) : "Item"}`,
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
      resolvedMap.enhancementEffects.mapShardDropRateMultiplier *
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

  const spellId = rollSpellDrop(
    nextCharacter,
    mapTier,
    rarity,
    resolvedMap.enhancementEffects.itemDropRateMultiplier
  );

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

export const createArenaRuntime = (
  character: CharacterRecord,
  mapId: string,
  enhancements: MapEnhancementInstance[] = []
): ArenaRuntimeState => {
  const map = resolveMapInstance(mapConfig[mapId], enhancements);
  const initialPlayerX = ARENA_WIDTH / 2;
  const initialPlayerY = ARENA_HEIGHT / 2;
  const packsResult = createMonsterPacks(map);

  return {
    mapId,
    resolvedMap: map,
    player: character,
    mapName: map.name,
    mapTier: map.tier,
    enemies: packsResult.enemies,
    packs: packsResult.packs,
    timeElapsedMs: 0,
    snapshot: {
      timeElapsedMs: 0,
      mapName: map.name,
      mapTier: map.tier,
      playerX: initialPlayerX,
      playerY: initialPlayerY,
      player: character,
      enemies: packsResult.enemies.map((enemy) => ({
        id: enemy.id,
        packId: enemy.packId,
        x: enemy.x,
        y: enemy.y,
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        rarity: enemy.rarity
      })),
      floatingTexts: [],
      lootEvents: [],
      isComplete: packsResult.enemies.length === 0
    },
    telemetry: {
      rareMonstersSpawned: packsResult.rareMonstersSpawned,
      rareMonstersKilled: 0,
      totalMonstersKilled: 0
    },
    lastCastAtMs: -999_999,
    lastPlayerDamageAtMs: -999_999,
    playerX: initialPlayerX,
    playerY: initialPlayerY,
    autoMove: {
      enabled: true,
      targetPackId: selectNearestPack(packsResult.packs, packsResult.enemies, initialPlayerX, initialPlayerY),
      lootPauseUntilMs: 0
    }
  };
};

export const stepArenaRuntime = (state: ArenaRuntimeState, deltaMs: number): ArenaRuntimeState => {
  const nextTime = state.timeElapsedMs + deltaMs;
  let nextPlayer = state.player;
  let nextEnemies = [...state.enemies];
  const floatingTexts: FloatingTextState[] = [];
  const lootEvents: LootEntry[] = [];
  let lastCastAtMs = state.lastCastAtMs;
  let lastPlayerDamageAtMs = state.lastPlayerDamageAtMs;
  const mapTier = state.mapTier;
  const map = state.resolvedMap;
  let telemetry = state.telemetry;
  let playerX = state.playerX;
  let playerY = state.playerY;
  const alivePackIdsBefore = getAlivePackIds(nextEnemies);
  let autoMove = state.autoMove;

  if (autoMove.enabled) {
    if (nextTime < autoMove.lootPauseUntilMs) {
      // paused for loot pickup / post-pack downtime
    } else {
      const targetPackAlive = autoMove.targetPackId ? alivePackIdsBefore.has(autoMove.targetPackId) : false;
      const targetPackId =
        targetPackAlive
          ? autoMove.targetPackId
          : selectNearestPack(state.packs, nextEnemies, playerX, playerY);

      autoMove = {
        ...autoMove,
        targetPackId
      };

      if (targetPackId) {
        const pack = state.packs.find((entry) => entry.id === targetPackId);

        if (pack) {
          const center = getPackCenter(pack, nextEnemies);
          const distanceToPack = distance(playerX, playerY, center.x, center.y);

          if (distanceToPack > PLAYER_COMBAT_STOP_RANGE) {
            const directionX = center.x - playerX;
            const directionY = center.y - playerY;
            const length = Math.max(1, Math.hypot(directionX, directionY));
            const movementSpeed =
              PLAYER_BASE_MOVEMENT_SPEED * Math.max(0.1, nextPlayer.derivedStats.movementSpeedMultiplier);
            const movement = (movementSpeed * deltaMs) / 1000;
            playerX = clamp(playerX + (directionX / length) * movement, 40, ARENA_WIDTH - 40);
            playerY = clamp(playerY + (directionY / length) * movement, 40, ARENA_HEIGHT - 40);
          }
        }
      }
    }
  }

  nextEnemies = nextEnemies.map((enemy) => {
    const directionX = playerX - enemy.x;
    const directionY = playerY - enemy.y;
    const length = Math.max(1, Math.hypot(directionX, directionY));
    const movement = (enemy.movementSpeed * deltaMs) / 1000;

    return {
      ...enemy,
      x: enemy.x + (directionX / length) * movement,
      y: enemy.y + (directionY / length) * movement
    };
  });

  nextEnemies = nextEnemies.map((enemy) => {
    const closeEnoughToHit = distance(enemy.x, enemy.y, playerX, playerY) <= 26;

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
      x: playerX - 14,
      y: playerY - 26,
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
          distance(left.x, left.y, playerX, playerY) -
          distance(right.x, right.y, playerX, playerY)
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
        const dropResult = rollDrops(nextPlayer, mapTier, enemy.rarity, map);
        nextPlayer = dropResult.character;
        lootEvents.push(...dropResult.lootEvents);
        telemetry = {
          ...telemetry,
          totalMonstersKilled: telemetry.totalMonstersKilled + 1,
          rareMonstersKilled:
            telemetry.rareMonstersKilled + (enemy.rarity === "Rare" ? 1 : 0)
        };

        return [];
      });
    }
  }

  const alivePackIdsAfter = getAlivePackIds(nextEnemies);
  const clearedAnyPack = [...alivePackIdsBefore].some((packId) => !alivePackIdsAfter.has(packId));

  if (autoMove.enabled && clearedAnyPack) {
    autoMove = {
      ...autoMove,
      lootPauseUntilMs: Math.max(autoMove.lootPauseUntilMs, nextTime + AUTO_LOOT_DELAY_MS),
      targetPackId: null
    };
  }

  if (autoMove.enabled && autoMove.targetPackId && !alivePackIdsAfter.has(autoMove.targetPackId)) {
    autoMove = {
      ...autoMove,
      targetPackId: null
    };
  }

  const allEnemiesDefeated = nextEnemies.length === 0;
  const snapshot: ArenaSnapshot = {
    timeElapsedMs: nextTime,
    mapName: state.mapName,
    mapTier,
    playerX,
    playerY,
    player: nextPlayer,
    enemies: nextEnemies.map((enemy) => ({
      id: enemy.id,
      packId: enemy.packId,
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
    resolvedMap: map,
    player: nextPlayer,
    mapName: state.mapName,
    mapTier,
    enemies: nextEnemies,
    packs: state.packs,
    timeElapsedMs: nextTime,
    telemetry,
    lastCastAtMs,
    lastPlayerDamageAtMs,
    playerX,
    playerY,
    autoMove,
    snapshot
  };
};
