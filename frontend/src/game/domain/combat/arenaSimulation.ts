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
import { getItemStatEntries } from "../items/itemStats";
import { getEquippedUniqueModifiers } from "../items/uniqueEffects";
import {
  addOwnedMap,
  clearBossTier,
  consumeOwnedMap,
  getOwnedMapStackByMapId,
  isBossTierCleared,
} from "../maps/mapProgress";
import { resolveMapInstance, type ResolvedMapInstance } from "../maps/mapEnhancements";
import { gainLifeFlaskCharges } from "../player/lifeFlask";
import { applyExperience } from "../progression/progression";
import { getSpellName, rollSpellDrop } from "../spells/spellDrops";
import { resolveSpell } from "../spells/spellEngine";
import { getItemSlotLabel } from "../../config/itemConfig";
import { uniqueItemDefinitions } from "../../config/itemConfig";
import { createClientId } from "../../../shared/utils/id";
import { applyArmorMitigation, applyResistanceToDamage, clampEnemyResistance, clampPlayerResistance, resolveEnemyDamageType, rollEvasion } from "./combatMath";
import type {
  AutoSellSettings,
  ArenaEnemyState,
  ArenaSnapshot,
  CharacterRecord,
  CurrencyStack,
  FloatingTextState,
  GroundLootState,
  InventoryItem,
  LootEntry,
  MapEnhancementInstance,
  MonsterRarity,
  DamageType,
  SpellVisualEvent
} from "../../../shared/types/saveTypes";
const defaultAutoSellSettings: AutoSellSettings = {
  Normal: false,
  Magic: false,
  Rare: false
};

const createBossUniqueDrop = (tier: number): InventoryItem | null => {
  const bossUniqueIds = itemBalance.bossUniquePools[tier as keyof typeof itemBalance.bossUniquePools];

  if (!bossUniqueIds) {
    return null;
  }

  const chaseRoll = Math.random() < 0.05;
  const selectedId = chaseRoll
    ? bossUniqueIds.chase
    : Math.random() < 0.5
      ? bossUniqueIds.common1
      : bossUniqueIds.common2;
  const definition = uniqueItemDefinitions.find((entry) => entry.id === selectedId);

  if (!definition) {
    return null;
  }

  return {
    id: `${definition.id}-${createClientId()}`,
    name: definition.name,
    slot: definition.slot,
    rarity: "Unique",
    tier,
    tags: definition.tags,
    uniqueEffectId: definition.uniqueEffectId,
    uniqueEffectDescription: definition.uniqueEffectDescription,
    statBonuses: definition.statBonuses
  };
};

const ARENA_WIDTH = 2000;
const ARENA_HEIGHT = 1400;
const PLAYER_BASE_MOVEMENT_SPEED = 120;
const AUTO_LOOT_SEEK_RADIUS = 240;
const PLAYER_SPAWN_PADDING = 220;
const PACK_MIN_CENTER_DISTANCE = 240;
const PACK_CENTER_PADDING = 140;
const PACK_COUNT_BONUS_BASE = 2;
const PACK_COUNT_BONUS_MAX_EXTRA = 4;
const MAP_COMPLETE_DELAY_MS = 1000;

type PackId = string;

interface MonsterPackState {
  id: PackId;
  centerX: number;
  centerY: number;
}

interface InternalEnemyState extends ArenaEnemyState {
  packId: PackId;
  monsterTypeId: string;
  damage: number;
  damageType: DamageType;
  movementSpeed: number;
  experienceReward: number;
  goldReward: number;
  resistances: {
    Fire: number;
    Cold: number;
    Lightning: number;
  };
  lastContactDamageAt: number;
  isKeyGuardian: boolean;
}

export interface ArenaRuntimeState {
  mapId: string;
  resolvedMap: ResolvedMapInstance;
  player: CharacterRecord;
  mapName: string;
  mapTier: number;
  enemies: InternalEnemyState[];
  packs: MonsterPackState[];
  groundLoot: GroundLootState[];
  timeElapsedMs: number;
  completionDelayUntilMs: number | null;
  snapshot: ArenaSnapshot;
  telemetry: {
    rareMonstersSpawned: number;
    rareMonstersKilled: number;
    totalMonstersKilled: number;
    packsSpawned: number;
    packsCleared: number;
    guardianSpawned: boolean;
    guardianKilled: boolean;
    damageDealtToPlayer: number;
    damagePreventedByResistance: number;
    damagePreventedByArmor: number;
    hitsTaken: number;
    evades: number;
    damageDealtByPlayer: number;
    critsLanded: number;
    spellsCast: number;
    timeMovingMs: number;
    timeFightingMs: number;
  };
  lastCastAtMs: number;
  lastPlayerDamageAtMs: number;
  playerX: number;
  playerY: number;
  autoMove: {
    enabled: boolean;
    targetPackId: PackId | null;
    targetLootId: string | null;
    lootPauseUntilMs: number;
  };
  autoSellSettings: AutoSellSettings;
}

const distance = (aX: number, aY: number, bX: number, bY: number): number =>
  Math.hypot(aX - bX, aY - bY);

const resolvePlayerTargetingRange = (_player: CharacterRecord): number => {
  // Keep range logic centralized so future item rolls can extend it without
  // rewriting combat flow in multiple places.
  return balanceConfig.combat.playerTargetingRange;
};

const getPerMonsterDropChance = (dropsPerRunTarget: number, monsterCount: number): number =>
  Math.max(0, Math.min(0.95, dropsPerRunTarget / Math.max(1, monsterCount)));

const createGuaranteedBossRewardDrops = (
  tier: number,
  dropX: number,
  dropY: number,
  createdAtMs: number
): GroundLootState[] => {
  const bossUnique = createBossUniqueDrop(Math.max(1, tier));

  if (bossUnique) {
    return [
      {
        id: `ground-item-${bossUnique.id}`,
        x: clamp(dropX + (Math.random() - 0.5) * 24, 40, ARENA_WIDTH - 40),
        y: clamp(dropY + (Math.random() - 0.5) * 24, 40, ARENA_HEIGHT - 40),
        createdAtMs,
        payload: {
          kind: "Item",
          item: bossUnique
        }
      }
    ];
  }

  return [
    {
      id: `ground-currency-imbuingOrb-${createClientId()}`,
      x: clamp(dropX + (Math.random() - 0.5) * 18, 40, ARENA_WIDTH - 40),
      y: clamp(dropY + (Math.random() - 0.5) * 18, 40, ARENA_HEIGHT - 40),
      createdAtMs,
      payload: {
        kind: "Currency",
        code: "imbuingOrb",
        amount: 1
      }
    }
  ];
};

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
  const eligibleMonsters = monsterDefinitions.filter(
    (monster) => monster.rarity === rarity && (monster.minTier === undefined || monster.minTier <= map.tier)
  );
  const monsterDefinition =
    eligibleMonsters[Math.floor(Math.random() * eligibleMonsters.length)] ?? monsterDefinitions[0];
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
    monsterTypeId: monsterDefinition.id,
    x,
    y,
    health: maxHealth,
    maxHealth,
    rarity,
    damage: Math.round(
      monsterBalance.baseDamage * map.enemyDamageMultiplier * rarityDamageMultiplier
    ),
    damageType: resolveEnemyDamageType(monsterDefinition.tags),
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
    lastContactDamageAt: 0,
    isKeyGuardian: false
  };
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const samplePackCenter = (
  existingCenters: Array<{ x: number; y: number }>,
  playerStartX: number,
  playerStartY: number
): { x: number; y: number } => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const x = PACK_CENTER_PADDING + Math.random() * (ARENA_WIDTH - PACK_CENTER_PADDING * 2);
    const y = PACK_CENTER_PADDING + Math.random() * (ARENA_HEIGHT - PACK_CENTER_PADDING * 2);

    if (distance(x, y, playerStartX, playerStartY) < PLAYER_SPAWN_PADDING) {
      continue;
    }

    if (existingCenters.some((center) => distance(x, y, center.x, center.y) < PACK_MIN_CENTER_DISTANCE)) {
      continue;
    }

    return { x, y };
  }

  // fallback: place farther from the player even if clustering occurs under high density
  const fallbackAngle = Math.random() * Math.PI * 2;
  const fallbackRadius = Math.max(PLAYER_SPAWN_PADDING, PACK_MIN_CENTER_DISTANCE);
  return {
    x: clamp(playerStartX + Math.cos(fallbackAngle) * fallbackRadius, PACK_CENTER_PADDING, ARENA_WIDTH - PACK_CENTER_PADDING),
    y: clamp(playerStartY + Math.sin(fallbackAngle) * fallbackRadius, PACK_CENTER_PADDING, ARENA_HEIGHT - PACK_CENTER_PADDING)
  };
};

const createMonsterPacks = (
  map: ResolvedMapInstance,
  playerStartX: number,
  playerStartY: number,
  mapProgress: CharacterRecord["mapProgress"]
): { packs: MonsterPackState[]; enemies: InternalEnemyState[]; rareMonstersSpawned: number } => {
  const packs: MonsterPackState[] = [];
  const enemies: InternalEnemyState[] = [];
  const centers: Array<{ x: number; y: number }> = [];

  const isBossMap = map.id.startsWith("bossTier");
  const packSizeMin = isBossMap ? 1 : 2;
  const packSizeMax = isBossMap ? 1 : 5;
  const packRadius = 46;
  const averagePackSize = (packSizeMin + packSizeMax) / 2;
  const packCountBonusExtra = Math.min(PACK_COUNT_BONUS_MAX_EXTRA, Math.max(0, Math.floor(map.tier / 2)));
  const packCountBonus = PACK_COUNT_BONUS_BASE + packCountBonusExtra;
  const packCount = Math.max(1, Math.ceil(map.monsterCount / averagePackSize) + packCountBonus);

  const tierBalance = getMapBalanceByTier(map.tier);
  const rareChancePerPack = isBossMap ? 1 : tierBalance.rareMonsterChance;

  let remaining = map.monsterCount;
  let rareMonstersSpawned = 0;

  for (let packIndex = 0; packIndex < packCount && remaining > 0; packIndex += 1) {
    const packId = `pack-${packIndex}-${createClientId()}`;
    const sampled = samplePackCenter(centers, playerStartX, playerStartY);
    const centerX = sampled.x;
    const centerY = sampled.y;
    centers.push({ x: centerX, y: centerY });

    packs.push({ id: packId, centerX, centerY });

    const packSize = Math.min(
      remaining,
      Math.floor(Math.random() * (packSizeMax - packSizeMin + 1)) + packSizeMin
    );
    remaining -= packSize;

    const hasRare = Math.random() < rareChancePerPack && packSize > 0;
    let rareUsed = false;

    for (let memberIndex = 0; memberIndex < packSize; memberIndex += 1) {
      const angle = (memberIndex / Math.max(1, packSize)) * Math.PI * 2 + Math.random() * 0.45;
      const radius = 14 + Math.random() * (packRadius - 14);
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

  const bossCleared = isBossTierCleared(mapProgress, map.tier);
  const guardianSpawnChance = bossCleared ? 0.05 : 0.1;
  const isEligibleForGuardian = !isBossMap && map.tier >= 1 && map.tier <= mapBalance.maxTier;
  if (isEligibleForGuardian && Math.random() < guardianSpawnChance) {
    const rareEnemies = enemies.filter((e) => e.rarity === "Rare");
    if (rareEnemies.length > 0) {
      const guardian = rareEnemies[Math.floor(Math.random() * rareEnemies.length)];
      guardian.isKeyGuardian = true;
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

const selectNearestLoot = (
  groundLoot: GroundLootState[],
  playerX: number,
  playerY: number,
  maxDistance: number
): string | null => {
  const candidates = groundLoot.filter(
    (entry) => distance(playerX, playerY, entry.x, entry.y) <= maxDistance
  );

  if (candidates.length === 0) {
    return null;
  }

  return (
    [...candidates].sort(
      (left, right) =>
        distance(playerX, playerY, left.x, left.y) - distance(playerX, playerY, right.x, right.y)
    )[0]?.id ?? null
  );
};

const applyGroundLootPickup = (
  character: CharacterRecord,
  entry: GroundLootState,
  autoSellSettings: AutoSellSettings
): { character: CharacterRecord; lootEvent: LootEntry } => {
  const payload = entry.payload;

  if (payload.kind === "Item") {
    const item = payload.item;
    const shouldAutoSell = item.rarity !== "Unique" && autoSellSettings[item.rarity as keyof AutoSellSettings];

    if (shouldAutoSell) {
      const sellPrice = Math.max(
        balanceConfig.economy.itemSellPriceFloor,
        Math.round(getItemPowerScore(item) * balanceConfig.economy.itemSellPriceMultiplier)
      );
      const nextCharacter = {
        ...character,
        gold: character.gold + sellPrice
      };

      return {
        character: nextCharacter,
        lootEvent: {
          id: `${entry.id}-picked`,
          kind: "Item",
          name: item.name,
          details: [`Auto-sold for ${sellPrice} gold`],
          isUpgrade: false,
          rarity: item.rarity,
          slot: item.slot ?? undefined
        }
      };
    }

    const nextCharacter = {
      ...character,
      inventory: [...character.inventory, item]
    };

    return {
      character: nextCharacter,
      lootEvent: {
        id: `${entry.id}-picked`,
        kind: "Item",
        name: item.name,
        details: [
          `Item Tier ${item.tier} ${item.slot ? getItemSlotLabel(item.slot) : "Item"}`,
          `Power ${getItemPowerScore(item).toFixed(0)}`,
          ...getItemStatEntries(item).map((e) => `${e.label} ${e.formattedValue}`)
        ],
        isUpgrade: isUpgradeForCharacter(character, item),
        rarity: item.rarity,
        slot: item.slot ?? undefined
      }
    };
  }

  if (payload.kind === "Currency") {
    const nextCharacter = {
      ...character,
      currencies: addCurrency(character.currencies, payload.code, payload.amount)
    };

    return {
      character: nextCharacter,
      lootEvent: {
        id: `${entry.id}-picked`,
        kind: "Currency",
        name: payload.code === "mapShard" ? "Map Shard" : payload.code,
        details: ["Picked up from the ground"],
        isUpgrade: false
      }
    };
  }

  if (payload.kind === "Spell") {
    const nextCharacter = {
      ...character,
      unlockedSpellIds: [...character.unlockedSpellIds, payload.spellId]
    };

    return {
      character: nextCharacter,
      lootEvent: {
        id: `${entry.id}-picked`,
        kind: "Spell",
        name: getSpellName(payload.spellId),
        details: ["Unlocked permanently in your spell inventory"],
        isUpgrade: true
      }
    };
  }

  const isBossKey = payload.mapId.startsWith("bossTier");
  const mapName = isBossKey ? `Boss Key (Tier ${payload.tier})` : `Tier ${payload.tier} Map`;

  const nextCharacter = addOwnedMap(character, payload.mapId, payload.tier);
  const details = isBossKey
    ? [
        "Boss key added to your inventory.",
        `Defeat this boss to unlock Tier ${Math.min(mapBalance.maxTier, payload.tier + 1)} maps.`
      ]
    : ["Consumable map added to your map inventory"];

  return {
    character: nextCharacter,
    lootEvent: {
      id: `${entry.id}-picked`,
      kind: "Map",
      name: mapName,
      details,
      isUpgrade: true
    }
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

const rollGroundDrops = (
  character: CharacterRecord,
  mapTier: number,
  rarity: MonsterRarity,
  resolvedMap: ResolvedMapInstance,
  dropX: number,
  dropY: number,
  createdAtMs: number
): GroundLootState[] => {
  const tierBalance = getMapBalanceByTier(mapTier);
  const isRareMonster = rarity === "Rare";
  const uniqueModifiers = getEquippedUniqueModifiers(character);
  const isBossMap = resolvedMap.id.startsWith("bossTier");

  const groundLoot: GroundLootState[] = [];

  const shouldDropItem =
    Math.random() < tierBalance.itemDropRate * resolvedMap.dropRateMultiplier * resolvedMap.enhancementEffects.itemDropRateMultiplier;

  if (shouldDropItem) {
    const itemCount = isRareMonster
      ? Math.floor(
          Math.random() *
            (tierBalance.rareItemDropsMax - tierBalance.rareItemDropsMin + 1)
        ) + tierBalance.rareItemDropsMin
      : 1;

    const items = Array.from({ length: itemCount }, () => ({
      item: generateItemDropForCharacter(character, Math.max(1, mapTier), isRareMonster),
      offsetX: (Math.random() - 0.5) * 26,
      offsetY: (Math.random() - 0.5) * 26
    }));

    items.forEach(({ item, offsetX, offsetY }) => {
      groundLoot.push({
        id: `ground-item-${item.id}`,
        x: clamp(dropX + offsetX, 40, ARENA_WIDTH - 40),
        y: clamp(dropY + offsetY, 40, ARENA_HEIGHT - 40),
        createdAtMs,
        payload: {
          kind: "Item",
          item
        }
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
    groundLoot.push({
      id: `ground-currency-mapShard-${createClientId()}`,
      x: clamp(dropX + (Math.random() - 0.5) * 18, 40, ARENA_WIDTH - 40),
      y: clamp(dropY + (Math.random() - 0.5) * 18, 40, ARENA_HEIGHT - 40),
      createdAtMs,
      payload: {
        kind: "Currency",
        code: "mapShard",
        amount: 1
      }
    });
  }

  const spellId = rollSpellDrop(
    character,
    mapTier,
    rarity,
    resolvedMap.enhancementEffects.itemDropRateMultiplier
  );

  if (spellId) {
    groundLoot.push({
      id: `ground-spell-${spellId}-${createClientId()}`,
      x: clamp(dropX + (Math.random() - 0.5) * 18, 40, ARENA_WIDTH - 40),
      y: clamp(dropY + (Math.random() - 0.5) * 18, 40, ARENA_HEIGHT - 40),
      createdAtMs,
      payload: {
        kind: "Spell",
        spellId
      }
    });
  }

  if (isBossMap && isRareMonster) {
    groundLoot.push(...createGuaranteedBossRewardDrops(mapTier, dropX, dropY, createdAtMs));

    if (Math.random() < 0.6) {
      groundLoot.push({
        id: `ground-currency-imbuingOrb-${createClientId()}`,
        x: clamp(dropX + (Math.random() - 0.5) * 18, 40, ARENA_WIDTH - 40),
        y: clamp(dropY + (Math.random() - 0.5) * 18, 40, ARENA_HEIGHT - 40),
        createdAtMs,
        payload: {
          kind: "Currency",
          code: "imbuingOrb",
          amount: 1
        }
      });
    }
  }

  if (!isBossMap) {
    const sameTierMapId = mapTier <= 0 ? "tier1Map" : `tier${mapTier}Map`;
    const sameTierMapTier = mapTier <= 0 ? 1 : mapTier;
    const sameTierMapDropChance = getPerMonsterDropChance(
      tierBalance.sameTierMapDropsPerRunTarget,
      resolvedMap.monsterCount
    );

    if (Math.random() < sameTierMapDropChance) {
      groundLoot.push({
        id: `ground-map-tier${sameTierMapTier}-${createClientId()}`,
        x: clamp(dropX + (Math.random() - 0.5) * 18, 40, ARENA_WIDTH - 40),
        y: clamp(dropY + (Math.random() - 0.5) * 18, 40, ARENA_HEIGHT - 40),
        createdAtMs,
        payload: {
          kind: "Map",
          mapId: sameTierMapId,
          tier: sameTierMapTier
        }
      });
    }

    if (mapTier < mapBalance.maxTier && isBossTierCleared(character.mapProgress, mapTier)) {
      const nextTier = Math.max(1, mapTier + 1);
      const nextTierMapDropChance = getPerMonsterDropChance(
        tierBalance.nextTierMapDropsPerRunTarget,
        resolvedMap.monsterCount
      );

      if (Math.random() < nextTierMapDropChance) {
        groundLoot.push({
          id: `ground-map-tier${nextTier}-${createClientId()}`,
          x: clamp(dropX + (Math.random() - 0.5) * 18, 40, ARENA_WIDTH - 40),
          y: clamp(dropY + (Math.random() - 0.5) * 18, 40, ARENA_HEIGHT - 40),
          createdAtMs,
          payload: {
            kind: "Map",
            mapId: `tier${nextTier}Map`,
            tier: nextTier
          }
        });
      }
    }
  }

  return groundLoot;
};

export const createArenaRuntime = (
  character: CharacterRecord,
  mapId: string,
  enhancements: MapEnhancementInstance[] = [],
  autoSellSettings: AutoSellSettings = defaultAutoSellSettings
): ArenaRuntimeState => {
  const map = resolveMapInstance(mapConfig[mapId], enhancements);
  const initialPlayerX = ARENA_WIDTH / 2;
  const initialPlayerY = ARENA_HEIGHT / 2;
  const packsResult = createMonsterPacks(map, initialPlayerX, initialPlayerY, character.mapProgress);

  return {
    mapId,
    resolvedMap: map,
    player: character,
    mapName: map.name,
    mapTier: map.tier,
    enemies: packsResult.enemies,
    packs: packsResult.packs,
    groundLoot: [],
    timeElapsedMs: 0,
    completionDelayUntilMs: null,
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
        rarity: enemy.rarity,
        monsterTypeId: enemy.monsterTypeId,
        damageType: enemy.damageType
      })),
      floatingTexts: [],
      lootEvents: [],
      spellEvents: [],
      groundLoot: [],
      isComplete: packsResult.enemies.length === 0
    },
    telemetry: {
      rareMonstersSpawned: packsResult.rareMonstersSpawned,
      rareMonstersKilled: 0,
      totalMonstersKilled: 0,
      packsSpawned: packsResult.packs.length,
      packsCleared: 0,
      guardianSpawned: packsResult.enemies.some((e) => e.isKeyGuardian),
      guardianKilled: false,
      damageDealtToPlayer: 0,
      damagePreventedByResistance: 0,
      damagePreventedByArmor: 0,
      hitsTaken: 0,
      evades: 0,
      damageDealtByPlayer: 0,
      critsLanded: 0,
      spellsCast: 0,
      timeMovingMs: 0,
      timeFightingMs: 0
    },
    lastCastAtMs: -999_999,
    lastPlayerDamageAtMs: -999_999,
    playerX: initialPlayerX,
    playerY: initialPlayerY,
    autoMove: {
      enabled: true,
      targetPackId: selectNearestPack(packsResult.packs, packsResult.enemies, initialPlayerX, initialPlayerY),
      targetLootId: null,
      lootPauseUntilMs: 0
    },
    autoSellSettings
  };
};

export const stepArenaRuntime = (state: ArenaRuntimeState, deltaMs: number): ArenaRuntimeState => {
  const nextTime = state.timeElapsedMs + deltaMs;
  let nextPlayer = state.player;
  let nextEnemies = [...state.enemies];
  let nextGroundLoot = [...state.groundLoot];
  const floatingTexts: FloatingTextState[] = [];
  const lootEvents: LootEntry[] = [];
  const spellEvents: SpellVisualEvent[] = [];
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
      const movementSpeed =
        PLAYER_BASE_MOVEMENT_SPEED * Math.max(0.1, nextPlayer.derivedStats.movementSpeedMultiplier);
      const movement = (movementSpeed * deltaMs) / 1000;
      const playerTargetingRange = resolvePlayerTargetingRange(nextPlayer);

      // Prefer nearby ground loot before selecting the next pack.
      const targetLootStillExists = autoMove.targetLootId
        ? nextGroundLoot.some((entry) => entry.id === autoMove.targetLootId)
        : false;
      const targetLootId =
        targetLootStillExists
          ? autoMove.targetLootId
          : selectNearestLoot(nextGroundLoot, playerX, playerY, AUTO_LOOT_SEEK_RADIUS);

      if (targetLootId) {
        const loot = nextGroundLoot.find((entry) => entry.id === targetLootId);

        autoMove = {
          ...autoMove,
          targetLootId,
          targetPackId: null
        };

        if (loot) {
          const distanceToLoot = distance(playerX, playerY, loot.x, loot.y);

          if (distanceToLoot > balanceConfig.combat.autoPickupRadius) {
            const directionX = loot.x - playerX;
            const directionY = loot.y - playerY;
            const length = Math.max(1, Math.hypot(directionX, directionY));
            playerX = clamp(playerX + (directionX / length) * movement, 40, ARENA_WIDTH - 40);
            playerY = clamp(playerY + (directionY / length) * movement, 40, ARENA_HEIGHT - 40);
          }
        }
      } else {
        const targetPackAlive = autoMove.targetPackId ? alivePackIdsBefore.has(autoMove.targetPackId) : false;
        const targetPackId =
          targetPackAlive
            ? autoMove.targetPackId
            : selectNearestPack(state.packs, nextEnemies, playerX, playerY);

        autoMove = {
          ...autoMove,
          targetPackId,
          targetLootId: null
        };

        if (targetPackId) {
          const pack = state.packs.find((entry) => entry.id === targetPackId);

          if (pack) {
            const center = getPackCenter(pack, nextEnemies);
            const distanceToPack = distance(playerX, playerY, center.x, center.y);

            if (distanceToPack > playerTargetingRange) {
              const directionX = center.x - playerX;
              const directionY = center.y - playerY;
              const length = Math.max(1, Math.hypot(directionX, directionY));
              playerX = clamp(playerX + (directionX / length) * movement, 40, ARENA_WIDTH - 40);
              playerY = clamp(playerY + (directionY / length) * movement, 40, ARENA_HEIGHT - 40);
              telemetry = { ...telemetry, timeMovingMs: telemetry.timeMovingMs + deltaMs };
            }
          }
        }
      }
    }
  }

  // Track combat time: any tick where at least one enemy is within aggro range.
  const anyEnemyInRange = nextEnemies.some(
    (e) => distance(e.x, e.y, playerX, playerY) <= balanceConfig.combat.enemyContactRange * 3
  );
  if (anyEnemyInRange) {
    telemetry = { ...telemetry, timeFightingMs: telemetry.timeFightingMs + deltaMs };
  }

  // Ground loot pickup (domain-validated).
  const pickupRadius = balanceConfig.combat.autoPickupRadius;
  const pickedLootIds = new Set<string>();

  nextGroundLoot.forEach((entry) => {
    if (distance(playerX, playerY, entry.x, entry.y) > pickupRadius) {
      return;
    }

    const pickup = applyGroundLootPickup(nextPlayer, entry, state.autoSellSettings);
    nextPlayer = pickup.character;
    lootEvents.push(pickup.lootEvent);
    pickedLootIds.add(entry.id);
  });

  if (pickedLootIds.size > 0) {
    nextGroundLoot = nextGroundLoot.filter((entry) => !pickedLootIds.has(entry.id));

    if (autoMove.enabled && autoMove.targetLootId && pickedLootIds.has(autoMove.targetLootId)) {
      autoMove = {
        ...autoMove,
        targetLootId: null
      };
    }
  }

  nextEnemies = nextEnemies.map((enemy) => {
    const shouldAggro = distance(enemy.x, enemy.y, playerX, playerY) <= balanceConfig.combat.enemyAggroRadius;

    if (!shouldAggro) {
      return enemy;
    }

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
    const closeEnoughToHit =
      distance(enemy.x, enemy.y, playerX, playerY) <= balanceConfig.combat.enemyContactRange;

    if (
      !closeEnoughToHit ||
      nextTime - enemy.lastContactDamageAt < balanceConfig.combat.enemyContactDamageIntervalMs
    ) {
      return enemy;
    }

    if (rollEvasion(nextPlayer.derivedStats.evasion)) {
      telemetry = { ...telemetry, evades: telemetry.evades + 1 };
      return { ...enemy, lastContactDamageAt: nextTime };
    }

    const baseContactDamage = Math.max(
      1,
      Math.round(enemy.damage * getEquippedUniqueModifiers(nextPlayer).enemyContactDamageTakenMultiplier)
    );
    const resistance =
      enemy.damageType === "Physical"
        ? 0
        : clampPlayerResistance(nextPlayer.derivedStats.resistances[enemy.damageType]);
    const afterResistance =
      enemy.damageType === "Physical"
        ? baseContactDamage
        : applyResistanceToDamage(baseContactDamage, resistance);
    const afterArmor =
      enemy.damageType === "Physical"
        ? applyArmorMitigation(afterResistance, nextPlayer.derivedStats.armor)
        : afterResistance;
    const appliedDamage = afterArmor;
    const preventedByResistance = baseContactDamage - afterResistance;
    const preventedByArmor = afterResistance - afterArmor;

    telemetry = {
      ...telemetry,
      hitsTaken: telemetry.hitsTaken + 1,
      damageDealtToPlayer: telemetry.damageDealtToPlayer + appliedDamage,
      damagePreventedByResistance: telemetry.damagePreventedByResistance + preventedByResistance,
      damagePreventedByArmor: telemetry.damagePreventedByArmor + preventedByArmor
    };

    nextPlayer = {
      ...nextPlayer,
      currentHealth: Math.max(
        0,
        nextPlayer.currentHealth - appliedDamage
      )
    };
    lastPlayerDamageAtMs = nextTime;
    floatingTexts.push({
      id: `${enemy.id}-attack-${nextTime}`,
      x: playerX - 14,
      y: playerY - 26,
      text: `-${appliedDamage}`
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
      const playerTargetingRange = resolvePlayerTargetingRange(nextPlayer);
      const enemiesInRange = nextEnemies.filter(
        (enemy) => distance(enemy.x, enemy.y, playerX, playerY) <= playerTargetingRange
      );
      const sortedEnemies = [...enemiesInRange].sort(
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

      if (targetedEnemyIds.length > 0) {
        telemetry = { ...telemetry, spellsCast: telemetry.spellsCast + 1 };
        const chainPositions = targetedEnemyIds
          .map((id) => sortedEnemies.find((e) => e.id === id))
          .filter((e): e is InternalEnemyState => e !== undefined)
          .map((e) => ({ x: e.x, y: e.y }));

        spellEvents.push({
          id: `spell-${resolvedSpell.id}-${nextTime}`,
          spellId: resolvedSpell.id,
          tags: resolvedSpell.tags,
          originX: playerX,
          originY: playerY,
          chainPositions,
          areaRadius: resolvedSpell.areaRadius
        });
      }

      nextEnemies = nextEnemies.flatMap((enemy) => {
        if (!targetedEnemyIds.includes(enemy.id)) {
          return [enemy];
        }

        const didCrit = Math.random() < resolvedSpell.critChance;
        if (didCrit) telemetry = { ...telemetry, critsLanded: telemetry.critsLanded + 1 };
        const effectiveCritMultiplier = nextPlayer.derivedStats.critMultiplier + getEquippedUniqueModifiers(nextPlayer).bonusCritMultiplierForSpells;
        const baseDamage = didCrit ? Math.round(resolvedSpell.damage * effectiveCritMultiplier) : resolvedSpell.damage;
        const relevantResistances = (["Fire", "Cold", "Lightning"] as const)
          .filter((type) => resolvedSpell.tags.includes(type))
          .map((type) => clampEnemyResistance(enemy.resistances[type] - resolvedSpell.resistancePenetration[type]));
        const appliedResistance =
          relevantResistances.length > 0 ? Math.max(...relevantResistances) : 0;
        const totalDamage = applyResistanceToDamage(baseDamage, appliedResistance);
        telemetry = { ...telemetry, damageDealtByPlayer: telemetry.damageDealtByPlayer + totalDamage };
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
        const groundDrops = rollGroundDrops(nextPlayer, mapTier, enemy.rarity, map, enemy.x, enemy.y, nextTime);
        nextGroundLoot = [...nextGroundLoot, ...groundDrops];
        telemetry = {
          ...telemetry,
          totalMonstersKilled: telemetry.totalMonstersKilled + 1,
          rareMonstersKilled: telemetry.rareMonstersKilled + (enemy.rarity === "Rare" ? 1 : 0),
          guardianKilled: telemetry.guardianKilled || enemy.isKeyGuardian
        };

        if (enemy.isKeyGuardian) {
          const keyDropTier = mapTier >= 1 ? mapTier : null;

          if (keyDropTier !== null) {
            nextGroundLoot = [
              ...nextGroundLoot,
              {
                id: `ground-map-bossTier${keyDropTier}-${createClientId()}`,
                x: clamp(enemy.x + (Math.random() - 0.5) * 18, 40, ARENA_WIDTH - 40),
                y: clamp(enemy.y + (Math.random() - 0.5) * 18, 40, ARENA_HEIGHT - 40),
                createdAtMs: nextTime,
                payload: {
                  kind: "Map",
                  mapId: `bossTier${keyDropTier}`,
                  tier: keyDropTier
                }
              }
            ];
          }
        }

        return [];
      });
    }
  }

  const alivePackIdsAfter = getAlivePackIds(nextEnemies);
  const clearedPackCount = [...alivePackIdsBefore].filter((packId) => !alivePackIdsAfter.has(packId)).length;
  const clearedAnyPack = clearedPackCount > 0;

  if (clearedPackCount > 0) {
    telemetry = { ...telemetry, packsCleared: telemetry.packsCleared + clearedPackCount };
  }

  if (autoMove.enabled && clearedAnyPack) {
    autoMove = {
      ...autoMove,
      lootPauseUntilMs: 0,
      targetPackId: null,
      targetLootId: selectNearestLoot(nextGroundLoot, playerX, playerY, AUTO_LOOT_SEEK_RADIUS * 2)
    };
  }

  if (autoMove.enabled && autoMove.targetPackId && !alivePackIdsAfter.has(autoMove.targetPackId)) {
    autoMove = {
      ...autoMove,
      targetPackId: null
    };
  }

  const allEnemiesDefeated = nextEnemies.length === 0;
  const completionDelayUntilMs = allEnemiesDefeated
    ? state.completionDelayUntilMs ?? nextTime + MAP_COMPLETE_DELAY_MS
    : null;
  const isComplete = allEnemiesDefeated && completionDelayUntilMs !== null && nextTime >= completionDelayUntilMs;
  const justCompleted = !state.snapshot.isComplete && isComplete;

  if (justCompleted) {
    const isBossMap = state.mapId.startsWith("bossTier");
    const wasFirstBossClear = isBossMap && !isBossTierCleared(nextPlayer.mapProgress, mapTier);
    const bossKeyStack = isBossMap ? getOwnedMapStackByMapId(nextPlayer.mapProgress, state.mapId) : null;

    nextPlayer = {
      ...nextPlayer,
      mapProgress: {
        ...nextPlayer.mapProgress,
        lastCompletedTier: Math.max(nextPlayer.mapProgress.lastCompletedTier, mapTier)
      }
    };

    if (wasFirstBossClear) {
      if (bossKeyStack) {
        nextPlayer = consumeOwnedMap(nextPlayer, bossKeyStack.stackId);
      }
      nextPlayer = clearBossTier(nextPlayer, mapTier, mapBalance.maxTier);

      if (mapTier < mapBalance.maxTier) {
        for (let rewardCount = 0; rewardCount < 3; rewardCount += 1) {
          nextPlayer = addOwnedMap(nextPlayer, `tier${mapTier + 1}Map`, mapTier + 1);
        }
      }
    } else if (isBossMap && bossKeyStack) {
      nextPlayer = consumeOwnedMap(nextPlayer, bossKeyStack.stackId);
    }
  }

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
      rarity: enemy.rarity,
      monsterTypeId: enemy.monsterTypeId,
      damageType: enemy.damageType
    })),
    floatingTexts,
    lootEvents,
    spellEvents,
    groundLoot: nextGroundLoot.map((entry) => {
      const kind = entry.payload.kind;
      const name =
        kind === "Item"
          ? entry.payload.item.name
          : kind === "Currency"
            ? entry.payload.code === "mapShard"
              ? "Map Shard"
              : entry.payload.code
            : kind === "Spell"
              ? getSpellName(entry.payload.spellId)
              : entry.payload.mapId.startsWith("bossTier")
                ? `Boss Key (Tier ${entry.payload.tier})`
                : `Tier ${entry.payload.tier} Map`;

      return {
        id: entry.id,
        kind,
        x: entry.x,
        y: entry.y,
        name
      };
    }),
    isComplete
  };

  return {
    mapId: state.mapId,
    resolvedMap: map,
    player: nextPlayer,
    mapName: state.mapName,
    mapTier,
    enemies: nextEnemies,
    packs: state.packs,
    groundLoot: nextGroundLoot,
    timeElapsedMs: nextTime,
    completionDelayUntilMs,
    telemetry,
    lastCastAtMs,
    lastPlayerDamageAtMs,
    playerX,
    playerY,
    autoMove,
    autoSellSettings: state.autoSellSettings,
    snapshot
  };
};
