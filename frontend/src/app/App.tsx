import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { createCharacter, loadCharacter } from "../api/gameApi";
import { login, register } from "../api/authApi";
import type { AuthFormState } from "../auth/authTypes";
import { HealthHud } from "./HealthHud";
import { HubOverlayPanel } from "./HubOverlayPanel";
import { InventoryTab } from "./InventoryTab";
import { MapsTab } from "./MapsTab";
import { ShopTab } from "./ShopTab";
import { SpellsTab } from "./SpellsTab";
import { useCharacterPersistence } from "./useCharacterPersistence";
import { balanceConfig } from "../game/config/balanceConfig";
import { getEnhancementShardCost, getMapEnhancementDefinition } from "../game/config/balance";
import { getEquipmentSlotLabel } from "../game/config/itemConfig";
import { mapConfig } from "../game/config/mapConfig";
import { spellConfig, supportSpellConfig } from "../game/config/spellConfig";
import { createArenaRuntime, stepArenaRuntime } from "../game/domain/combat/arenaSimulation";
import type { ArenaRuntimeState } from "../game/domain/combat/arenaSimulation";
import { getItemPowerScore } from "../game/domain/items/itemPower";
import { generateItemDrop } from "../game/domain/items/itemGenerator";
import {
  addOwnedMap,
  consumeOwnedMap,
  getOwnedMapStack,
  getOwnedMapStackBySignature
} from "../game/domain/maps/mapProgress";
import { getMapEnhancementSummary, rollMapEnhancement } from "../game/domain/maps/mapEnhancements";
import { equipItem } from "../game/domain/player/equipment";
import { canUseLifeFlask, useLifeFlask } from "../game/domain/player/lifeFlask";
import {
  createNewCharacter,
  normalizeCharacterRecord,
  spendLevelStatPoint
} from "../game/domain/player/playerTypes";
import { getSpellName } from "../game/domain/spells/spellDrops";
import { resolveSpell } from "../game/domain/spells/spellEngine";
import {
  canUpgradeSpell,
  getSpellLevel,
  getSpellUpgradeGoldCost,
  getSpellUpgradeShardCost,
  getSpellUpgradeTierRequirement,
  upgradeSpell
} from "../game/domain/spells/spellProgression";
import type {
  ArenaSnapshot,
  CharacterRecord,
  CharacterStats,
  EquipmentSlot,
  InventoryItem,
  LootEntry,
  MapEnhancementInstance
} from "../shared/types/saveTypes";

const ArenaScreen = lazy(() => import("./ArenaScreen"));

const initialAuthForm: AuthFormState = {
  email: "",
  password: ""
};

const initialStats: CharacterStats = {
  strength: 0,
  agility: 0,
  vitality: 0,
  dexterity: 0
};

const equipmentSlots: EquipmentSlot[] = [
  "Weapon",
  "Helmet",
  "Amulet",
  "BodyArmor",
  "Belt",
  "Gloves",
  "Boots",
  "Ring1",
  "Ring2"
];

type ScreenMode = "auth" | "character" | "hub" | "arena";
type HubTab = "maps" | "equipment" | "spells" | "inventory" | "shop" | "character";
type OverlayPanel = "equipmentPicker" | "mainSpellPicker" | "supportPicker" | null;
type SelectedMapTarget = "trainingGrounds" | string;
const accountEmailStorageKey = "arpg-account-email";

const createShopStock = (tier: number): InventoryItem[] =>
  Array.from({ length: 3 }, (_, index) =>
    generateItemDrop(
      Math.max(1, tier),
      tier >= balanceConfig.economy.guaranteedRareStartTier && index === 2
    )
  );

const toShopItemState = (item: InventoryItem): ShopItemState => ({
  ...item,
  price: Math.round(
    (balanceConfig.economy.shopBasePrice +
      getItemPowerScore(item) * balanceConfig.economy.shopPowerPriceMultiplier) *
      balanceConfig.economy.shopRarityPriceMultiplier[item.rarity]
  )
});

const getSpellAccentClassName = (spellId: string): string => {
  const tags = spellConfig[spellId]?.tags ?? [];

  if (tags.includes("Lightning")) {
    return "spell-accent-lightning";
  }

  if (tags.includes("Fire")) {
    return "spell-accent-fire";
  }

  if (tags.includes("Cold")) {
    return "spell-accent-cold";
  }

  return "spell-accent-neutral";
};

const getSupportAccentClassName = (supportSpellId: string): string => {
  const tags = supportSpellConfig[supportSpellId]?.tags ?? [];

  if (tags.includes("Critical")) {
    return "support-accent-critical";
  }

  if (tags.includes("CastSpeed")) {
    return "support-accent-speed";
  }

  if (tags.includes("Chain") || tags.includes("Projectile")) {
    return "support-accent-projectile";
  }

  if (tags.includes("Area")) {
    return "support-accent-area";
  }

  return "support-accent-damage";
};

const getCurrencyAmount = (character: CharacterRecord, code: string): number =>
  character.currencies.find((entry) => entry.code === code)?.amount ?? 0;

const getItemSellPrice = (item: InventoryItem): number =>
  Math.max(
    balanceConfig.economy.itemSellPriceFloor,
    Math.round(getItemPowerScore(item) * balanceConfig.economy.itemSellPriceMultiplier)
  );

const formatPowerChange = (powerChange: number | null): string =>
  powerChange === null
    ? "Power change: New slot item"
    : `Power change: ${powerChange > 0 ? "+" : ""}${powerChange.toFixed(0)}`;

const updateCurrency = (character: CharacterRecord, code: string, delta: number): CharacterRecord => {
  const existing = character.currencies.find((entry) => entry.code === code);

  if (!existing && delta <= 0) {
    return character;
  }

  if (!existing) {
    return {
      ...character,
      currencies: [...character.currencies, { code, amount: delta }]
    };
  }

  return {
    ...character,
    currencies: character.currencies
      .map((entry) => (entry.code === code ? { ...entry, amount: entry.amount + delta } : entry))
      .filter((entry) => entry.amount > 0)
  };
};

type ShopItemState = InventoryItem & { price: number };

const buildOwnedMapRunQueue = (character: CharacterRecord, selectedMapStackId: SelectedMapTarget): string[] => {
  if (selectedMapStackId === "trainingGrounds") {
    return [];
  }

  const selectedEntry = getOwnedMapStack(character.mapProgress, selectedMapStackId);

  if (!selectedEntry) {
    return [];
  }

  const selectedTier = selectedEntry.tier;
  const sortedEntries = [...character.mapProgress.consumableMaps]
    .filter((entry) => entry.tier === selectedTier)
    .sort((left, right) => {
      if (left.stackId === selectedMapStackId && right.stackId !== selectedMapStackId) {
        return -1;
      }

      if (right.stackId === selectedMapStackId && left.stackId !== selectedMapStackId) {
        return 1;
      }

      if (left.mapId !== right.mapId) {
        return (mapConfig[left.mapId]?.name ?? left.mapId).localeCompare(mapConfig[right.mapId]?.name ?? right.mapId);
      }

      if (left.enhancements.length !== right.enhancements.length) {
        return left.enhancements.length - right.enhancements.length;
      }

      return (mapConfig[left.mapId]?.name ?? left.mapId).localeCompare(mapConfig[right.mapId]?.name ?? right.mapId);
    });

  return sortedEntries.flatMap((entry) => Array.from({ length: entry.quantity }, () => entry.stackId));
};

const getPreferredMapSelection = (
  character: CharacterRecord,
  previousTarget: SelectedMapTarget,
  preferredMapId?: string
): SelectedMapTarget => {
  if (previousTarget === "trainingGrounds") {
    return character.mapProgress.consumableMaps[0]?.stackId ?? "trainingGrounds";
  }

  if (getOwnedMapStack(character.mapProgress, previousTarget)) {
    return previousTarget;
  }

  const matchingMapEntry = preferredMapId
    ? character.mapProgress.consumableMaps.find((entry) => entry.mapId === preferredMapId)
    : null;

  return matchingMapEntry?.stackId ?? character.mapProgress.consumableMaps[0]?.stackId ?? "trainingGrounds";
};

const getMapVariantLabel = (enhancementCount: number): string =>
  enhancementCount === 0 ? "Unmodified" : `Modified +${enhancementCount}`;

const getMapDisplayName = (mapId: string, enhancementCount: number): string => {
  const baseName = mapConfig[mapId]?.name ?? mapId;
  return enhancementCount === 0 ? baseName : `${baseName} of Alteration`;
};

const getMapEnhancementDetailLines = (enhancements: MapEnhancementInstance[]): string[] =>
  enhancements.flatMap((enhancement) => {
    const definition = getMapEnhancementDefinition(enhancement.id);
    return [`Reward: ${definition.rewardText}`, `Danger: ${definition.dangerText}`];
  });

export const App = () => {
  const [screenMode, setScreenMode] = useState<ScreenMode>("auth");
  const [hubTab, setHubTab] = useState<HubTab>("maps");
  const [overlayPanel, setOverlayPanel] = useState<OverlayPanel>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authForm, setAuthForm] = useState<AuthFormState>(initialAuthForm);
  const [token, setToken] = useState<string | null>(localStorage.getItem("arpg-token"));
  const [accountEmail, setAccountEmail] = useState<string>(localStorage.getItem(accountEmailStorageKey) ?? "");
  const [characterName, setCharacterName] = useState("Warden");
  const [characterStats, setCharacterStats] = useState<CharacterStats>(initialStats);
  const [arenaSnapshot, setArenaSnapshot] = useState<ArenaSnapshot | null>(null);
  const [activeMapId, setActiveMapId] = useState<string | null>(null);
  const [activeMapEnhancements, setActiveMapEnhancements] = useState<MapEnhancementInstance[]>([]);
  const [activeMapRunId, setActiveMapRunId] = useState(0);
  const [selectedMapTarget, setSelectedMapTarget] = useState<SelectedMapTarget>("trainingGrounds");
  const [recentLoot, setRecentLoot] = useState<LootEntry[]>([]);
  const [shopItems, setShopItems] = useState<ShopItemState[]>([]);
  const [queuedMapIds, setQueuedMapIds] = useState<string[]>([]);
  const [selectedEquipmentSlot, setSelectedEquipmentSlot] = useState<EquipmentSlot>("Weapon");
  const [selectedSupportSlot, setSelectedSupportSlot] = useState<0 | 1>(0);
  const [statusMessage, setStatusMessage] = useState("Create an account or log in to begin.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const arenaRuntimeRef = useRef<ArenaRuntimeState | null>(null);
  const queuedMapIdsRef = useRef<string[]>([]);
  const { character, latestCharacterRef, commitCharacter, persistCharacterNow, saveCharacterManually } =
    useCharacterPersistence({
      token,
      isAutosaveEnabled: screenMode === "arena" || screenMode === "hub",
      onAutosaveError: setErrorMessage
    });

  const remainingStatPoints = useMemo(
    () =>
      balanceConfig.progression.startingStatPoints -
      Object.values(characterStats).reduce((total, value) => total + value, 0),
    [characterStats]
  );

  const selectedMapEntry =
    character && selectedMapTarget !== "trainingGrounds"
      ? getOwnedMapStack(character.mapProgress, selectedMapTarget)
      : null;
  const selectedMapId = selectedMapEntry?.mapId ?? "trainingGrounds";
  const selectedMapEnhancements = selectedMapEntry?.enhancements ?? [];

  useEffect(() => {
    if (!token) {
      setScreenMode("auth");
      return;
    }

    void (async () => {
      const loadedCharacter = await loadCharacter(token);

      if (loadedCharacter) {
        const normalizedCharacter = normalizeCharacterRecord(loadedCharacter);
        commitCharacter(normalizedCharacter);
        setScreenMode("hub");
        setStatusMessage("");
        setShopItems(
          createShopStock(Math.max(1, normalizedCharacter.mapProgress.highestUnlockedTier + 1)).map(toShopItemState)
        );
        return;
      }

      setScreenMode("character");
      setStatusMessage("No character found yet. Create one to begin.");
    })();
  }, [token]);

  useEffect(() => {
    if (screenMode !== "arena" || !character || !activeMapId) {
      return;
    }

    let animationFrame = 0;
    let runtime = createArenaRuntime(character, activeMapId, activeMapEnhancements);
    arenaRuntimeRef.current = runtime;
    let lastTimestamp = performance.now();
    let lastUiUpdateAt = 0;

    const loop = (timestamp: number) => {
      const deltaMs = Math.min(50, timestamp - lastTimestamp);
      lastTimestamp = timestamp;
      runtime = stepArenaRuntime(arenaRuntimeRef.current ?? runtime, deltaMs);
      arenaRuntimeRef.current = runtime;

      if (runtime.snapshot.lootEvents.length > 0) {
        setRecentLoot((current) => [...runtime.snapshot.lootEvents, ...current].slice(0, 20));
      }

      if (timestamp - lastUiUpdateAt > 120 || runtime.snapshot.isComplete) {
        setArenaSnapshot(runtime.snapshot);
          commitCharacter(runtime.snapshot.player);
        lastUiUpdateAt = timestamp;
      }
      if (runtime.snapshot.isComplete || runtime.snapshot.player.currentHealth <= 0) {
        setArenaSnapshot(runtime.snapshot);
        commitCharacter(runtime.snapshot.player);

        const wasDefeated = runtime.snapshot.player.currentHealth <= 0;
        const nextQueuedMapIds = queuedMapIdsRef.current;

        if (!wasDefeated && nextQueuedMapIds.length > 0) {
          const [nextMapStackId, ...remainingQueue] = nextQueuedMapIds;
          const nextCharacter = normalizeCharacterRecord(runtime.snapshot.player);
          let preparedCharacter = nextCharacter;

          if (balanceConfig.healing.refillToFullOnMapStart) {
            preparedCharacter = {
              ...preparedCharacter,
              currentHealth: preparedCharacter.derivedStats.maxHealth,
              lifeFlask: {
                currentCharges: balanceConfig.healing.lifeFlask.maxCharges
              }
            };
          }

          const nextMapStack = getOwnedMapStack(preparedCharacter.mapProgress, nextMapStackId);

          if (nextMapStack && nextMapStack.quantity > 0) {
            preparedCharacter = consumeOwnedMap(preparedCharacter, nextMapStackId);
            commitCharacter(preparedCharacter);
            setQueuedMapIds(remainingQueue);
            setActiveMapId(nextMapStack.mapId);
            setActiveMapEnhancements(nextMapStack.enhancements);
            setActiveMapRunId((current) => current + 1);
            setArenaSnapshot(null);
            setErrorMessage(null);
            setScreenMode("arena");
            setStatusMessage(
              `Entering ${mapConfig[nextMapStack.mapId].name}. ${remainingQueue.length} map${remainingQueue.length === 1 ? "" : "s"} queued after this run.`
            );
            return;
          }
        }

        setQueuedMapIds([]);
        setScreenMode("hub");
        setActiveMapId(null);
        setActiveMapEnhancements([]);
        setStatusMessage(
          wasDefeated
            ? `You were defeated in ${runtime.snapshot.mapName}, but your collected rewards remain saved.`
            : `${runtime.snapshot.mapName} complete. You kept everything you found.`
        );
        return;
      }

      animationFrame = requestAnimationFrame(loop);
    };

    setArenaSnapshot(runtime.snapshot);
    animationFrame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrame);
  }, [screenMode, character?.id, activeMapId, activeMapRunId, activeMapEnhancements]);

  useEffect(() => {
    if (screenMode !== "hub" && screenMode !== "arena") {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [screenMode, hubTab]);

  useEffect(() => {
    if (!character || selectedMapTarget === "trainingGrounds") {
      return;
    }

    if (!getOwnedMapStack(character.mapProgress, selectedMapTarget)) {
      setSelectedMapTarget(getPreferredMapSelection(character, selectedMapTarget, selectedMapId));
    }
  }, [character, selectedMapId, selectedMapTarget]);

  useEffect(() => {
    queuedMapIdsRef.current = queuedMapIds;
  }, [queuedMapIds]);

  const updateStat = (key: keyof CharacterStats, delta: number) => {
    setCharacterStats((current) => {
      const nextValue = current[key] + delta;

      if (nextValue < 0) {
        return current;
      }

      const nextStats = {
        ...current,
        [key]: nextValue
      };
      const spentPoints = Object.values(nextStats).reduce((total, value) => total + value, 0);

      if (spentPoints > balanceConfig.progression.startingStatPoints) {
        return current;
      }

      return nextStats;
    });
  };

  const handleAuth = async (): Promise<void> => {
    setErrorMessage(null);

    try {
      const response =
        authMode === "register"
          ? await register(authForm.email, authForm.password)
          : await login(authForm.email, authForm.password);

      localStorage.setItem("arpg-token", response.token);
      localStorage.setItem(accountEmailStorageKey, authForm.email);
      setToken(response.token);
      setAccountEmail(authForm.email);
      setStatusMessage(authMode === "register" ? "Account created." : "Login successful.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  };

  const handleCharacterCreation = async (): Promise<void> => {
    if (!token) {
      return;
    }

    if (remainingStatPoints !== 0) {
      setErrorMessage("Spend all starting stat points before creating the character.");
      return;
    }

    setErrorMessage(null);

    try {
      const fallbackCharacter = createNewCharacter(characterName, characterStats);
      const createdCharacter = await createCharacter(
        {
          name: fallbackCharacter.name,
          baseStats: fallbackCharacter.baseStats
        },
        token
      );

      const normalizedCharacter = normalizeCharacterRecord(createdCharacter);
      commitCharacter(normalizedCharacter);
      setScreenMode("hub");
      setShopItems(
        createShopStock(1).map(toShopItemState)
      );
      setStatusMessage("Character created. Mobile-first tabs are ready.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Character creation failed.");
    }
  };

  const handleManualSave = async (): Promise<void> => {
    if (!character) {
      return;
    }

    try {
      await saveCharacterManually(character);
      setStatusMessage("Progress saved.");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Save failed.");
    }
  };

  const handleLogout = (): void => {
    localStorage.removeItem("arpg-token");
    localStorage.removeItem(accountEmailStorageKey);
    setToken(null);
    setAccountEmail("");
    commitCharacter(null);
    setArenaSnapshot(null);
    setActiveMapId(null);
    setActiveMapEnhancements([]);
    setShopItems([]);
    setOverlayPanel(null);
    setHubTab("maps");
    setStatusMessage("Logged out.");
    setErrorMessage(null);
  };

  const startMapRun = (
    mapTarget: SelectedMapTarget,
    sourceCharacter: CharacterRecord,
    remainingQueue: string[] = []
  ): boolean => {
    let nextCharacter = normalizeCharacterRecord(sourceCharacter);
    const ownedMapStack =
      mapTarget !== "trainingGrounds" ? getOwnedMapStack(nextCharacter.mapProgress, mapTarget) : null;
    const mapId = ownedMapStack?.mapId ?? "trainingGrounds";
    const mapEnhancements = ownedMapStack?.enhancements ?? [];

    if (balanceConfig.healing.refillToFullOnMapStart) {
      nextCharacter = {
        ...nextCharacter,
        currentHealth: nextCharacter.derivedStats.maxHealth,
        lifeFlask: {
          currentCharges: balanceConfig.healing.lifeFlask.maxCharges
        }
      };
    }

    if (mapTarget !== "trainingGrounds") {
      if (!ownedMapStack || ownedMapStack.quantity <= 0) {
        setErrorMessage("You do not own that map.");
        return false;
      }

      nextCharacter = consumeOwnedMap(nextCharacter, mapTarget);
    }

    commitCharacter(nextCharacter);
    setQueuedMapIds(remainingQueue);
    setActiveMapId(mapId);
    setActiveMapEnhancements(mapEnhancements);
    setActiveMapRunId((current) => current + 1);
    setArenaSnapshot(null);
    setErrorMessage(null);
    setScreenMode("arena");
    setStatusMessage(
      remainingQueue.length > 0
        ? `Entering ${mapConfig[mapId].name}. ${remainingQueue.length} map${remainingQueue.length === 1 ? "" : "s"} queued after this run.`
        : `Entering ${mapConfig[mapId].name}.`
    );
    return true;
  };

  const handleStartMap = (): void => {
    if (!character) {
      return;
    }

    void startMapRun(selectedMapTarget, character);
  };

  const handleRunAllMaps = (): void => {
    if (!character) {
      return;
    }

    const queue = buildOwnedMapRunQueue(character, selectedMapTarget);

    if (queue.length === 0) {
      setErrorMessage("You do not own any consumable maps to run.");
      return;
    }

    const [firstMapId, ...remainingQueue] = queue;
    void startMapRun(firstMapId, character, remainingQueue);
  };

  const handleEquipItem = (itemId: string, targetSlotOverride?: EquipmentSlot): void => {
    if (!character) {
      return;
    }

    commitCharacter(equipItem(character, itemId, targetSlotOverride));
    setOverlayPanel(null);
    setStatusMessage("Equipment updated.");
  };

  const handleSelectMainSpell = (spellId: string): void => {
    if (!character) {
      return;
    }

    const currentLoadout = character.spellLoadout[0];
    commitCharacter({
      ...character,
      spellLoadout: [
        {
          ...currentLoadout,
          mainSpellId: spellId
        }
      ]
    });
    setStatusMessage(`${getSpellName(spellId)} is now your active spell.`);
  };

  const handleSelectSupportSpell = (supportSpellId: string): void => {
    if (!character) {
      return;
    }

    const currentLoadout = character.spellLoadout[0];
    const nextSupportSpellIds = [...currentLoadout.supportSpellIds];

    if (nextSupportSpellIds[selectedSupportSlot] === supportSpellId) {
      nextSupportSpellIds.splice(selectedSupportSlot, 1);
    } else {
      nextSupportSpellIds[selectedSupportSlot] = supportSpellId;
    }

    commitCharacter({
      ...character,
      spellLoadout: [
        {
          ...currentLoadout,
          supportSpellIds: nextSupportSpellIds
        }
      ]
    });
    setOverlayPanel(null);
    setStatusMessage(
      `${supportSpellConfig[supportSpellId]?.name ?? supportSpellId} updated in support slot ${selectedSupportSlot + 1}.`
    );
  };

  const handleBuyShopItem = (itemId: string): void => {
    if (!character) {
      return;
    }

    const item = shopItems.find((entry) => entry.id === itemId);

    if (!item) {
      return;
    }

    if (character.gold < item.price) {
      setErrorMessage("Not enough gold.");
      return;
    }

    commitCharacter({
      ...character,
      gold: character.gold - item.price,
      inventory: [...character.inventory, item]
    });
    setShopItems((current) => current.filter((entry) => entry.id !== itemId));
    setStatusMessage(`Bought ${item.name}.`);
  };

  const handleRefreshShop = (): void => {
    if (!character || character.gold < balanceConfig.economy.shopRefreshGoldCost) {
      setErrorMessage(`You need ${balanceConfig.economy.shopRefreshGoldCost} gold to refresh the shop.`);
      return;
    }

    commitCharacter({
      ...character,
      gold: character.gold - balanceConfig.economy.shopRefreshGoldCost
    });
    setShopItems(
      createShopStock(Math.max(1, character.mapProgress.highestUnlockedTier + 1)).map(toShopItemState)
    );
  };

  const handleSellItem = (itemId: string): void => {
    if (!character) {
      return;
    }

    const item = character.inventory.find((entry) => entry.id === itemId);

    if (!item) {
      return;
    }

    const sellPrice = getItemSellPrice(item);
    commitCharacter({
      ...character,
      gold: character.gold + sellPrice,
      inventory: character.inventory.filter((entry) => entry.id !== itemId)
    });
    setStatusMessage(`Sold ${item.name} for ${sellPrice} gold.`);
  };

  const handleSellAllItems = (): void => {
    if (!character || character.inventory.length === 0) {
      return;
    }

    const totalGold = character.inventory.reduce((total, item) => total + getItemSellPrice(item), 0);
    commitCharacter({
      ...character,
      gold: character.gold + totalGold,
      inventory: []
    });
    setStatusMessage(`Sold all inventory items for ${totalGold} gold.`);
  };

  const handleEnhanceSelectedMap = (): void => {
    if (!character || selectedMapTarget === "trainingGrounds") {
      return;
    }

    const selectedEntry = getOwnedMapStack(character.mapProgress, selectedMapTarget);

    if (!selectedEntry || selectedEntry.quantity <= 0) {
      setErrorMessage("You do not own that map.");
      return;
    }

    if (selectedEntry.enhancements.length >= balanceConfig.mapCrafting.maxEnhancementsPerMap) {
      setErrorMessage(`Maps can only have ${balanceConfig.mapCrafting.maxEnhancementsPerMap} enhancements.`);
      return;
    }

    const shardCost = getEnhancementShardCost(selectedEntry.enhancements.length);

    if (getCurrencyAmount(character, "mapShard") < shardCost) {
      setErrorMessage(`You need ${shardCost} Map Shards to enhance this map.`);
      return;
    }

    const rolledEnhancement = rollMapEnhancement(selectedEntry.enhancements);

    if (!rolledEnhancement) {
      setErrorMessage("No new enhancements are available for that map.");
      return;
    }

    let nextCharacter = consumeOwnedMap(character, selectedEntry.stackId);
    nextCharacter = updateCurrency(nextCharacter, "mapShard", -shardCost);
    nextCharacter = addOwnedMap(
      nextCharacter,
      selectedEntry.mapId,
      selectedEntry.tier,
      [...selectedEntry.enhancements, rolledEnhancement]
    );
    const nextSelectedEntry = getOwnedMapStackBySignature(
      nextCharacter.mapProgress,
      selectedEntry.mapId,
      selectedEntry.tier,
      [...selectedEntry.enhancements, rolledEnhancement]
    );
    const fallbackSelectedEntry =
      nextSelectedEntry ??
      nextCharacter.mapProgress.consumableMaps.find(
        (entry) =>
          entry.mapId === selectedEntry.mapId &&
          entry.tier === selectedEntry.tier &&
          entry.enhancements.length === selectedEntry.enhancements.length + 1 &&
          entry.enhancements.some((enhancement) => enhancement.id === rolledEnhancement.id)
      ) ??
      null;
    commitCharacter(nextCharacter);
    setSelectedMapTarget(
      fallbackSelectedEntry?.stackId ?? getPreferredMapSelection(nextCharacter, selectedMapTarget, selectedEntry.mapId)
    );
    void persistCharacterNow(nextCharacter, "Map enhancement save failed. Try saving manually before refreshing.");
    setStatusMessage(
      `${mapConfig[selectedEntry.mapId].name} gained ${getMapEnhancementSummary([rolledEnhancement])[0]}.`
    );
  };

  const handleConvertShardsToMaps = (): void => {
    if (!character) {
      return;
    }

    const currentShards = getCurrencyAmount(character, "mapShard");
    const mapsToCreate = Math.floor(currentShards / balanceConfig.mapCrafting.combineShardsCost);

    if (mapsToCreate <= 0) {
      setErrorMessage(
        `You need at least ${balanceConfig.mapCrafting.combineShardsCost} Map Shards to combine them into Tier 1 maps.`
      );
      return;
    }

    let nextCharacter = updateCurrency(
      character,
      "mapShard",
      -(mapsToCreate * balanceConfig.mapCrafting.combineShardsCost)
    );

    for (let count = 0; count < mapsToCreate; count += 1) {
      nextCharacter = addOwnedMap(nextCharacter, "tier1Map", 1);
    }

    commitCharacter(nextCharacter);
    void persistCharacterNow(nextCharacter, "Map crafting save failed. Try saving manually before refreshing.");
    setStatusMessage(`Combined shards into ${mapsToCreate} Tier 1 map${mapsToCreate > 1 ? "s" : ""}.`);
  };

  const handleSpendStatPoint = (statKey: keyof CharacterStats): void => {
    if (!character) {
      return;
    }

    commitCharacter(spendLevelStatPoint(character, statKey));
  };

  const handleUpgradeSpell = (spellId: string): void => {
    if (!character) {
      return;
    }

    const nextCharacter = upgradeSpell(character, spellId);

    if (nextCharacter === character) {
      setErrorMessage("You do not meet the upgrade requirements for that spell.");
      return;
    }

    commitCharacter(nextCharacter);
    setStatusMessage(`${getSpellName(spellId)} upgraded to level ${getSpellLevel(nextCharacter, spellId)}.`);
    setErrorMessage(null);
  };

  const renderInlineFeedback = () => {
    if (!statusMessage && !errorMessage) {
      return null;
    }

    return (
      <section className="panel stack mobile-feedback-panel">
        {statusMessage ? <p className="status-text">{statusMessage}</p> : null}
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </section>
    );
  };

  const handleUseLifeFlask = (): void => {
    if (!character) {
      return;
    }

    const nextCharacter = useLifeFlask(character);

    if (nextCharacter === character) {
      setErrorMessage("Your life flask cannot be used right now.");
      return;
    }

    commitCharacter(nextCharacter);
    latestCharacterRef.current = nextCharacter;

    if (screenMode === "arena" && arenaRuntimeRef.current) {
      const nextRuntime = {
        ...arenaRuntimeRef.current,
        player: nextCharacter,
        snapshot: {
          ...arenaRuntimeRef.current.snapshot,
          player: nextCharacter
        }
      };
      arenaRuntimeRef.current = nextRuntime;
      setArenaSnapshot(nextRuntime.snapshot);
    }

    setStatusMessage("Life flask used.");
    setErrorMessage(null);
  };

  const getSpellDetailLines = (spellId: string, supportSpellIds: string[]): string[] => {
    if (!character) {
      return [];
    }

    const resolvedSpell = resolveSpell(character, spellId, supportSpellIds);
    const targetCount = Math.max(1, resolvedSpell.projectileCount + resolvedSpell.chainCount);
    const lines = [
      `Level ${resolvedSpell.level}`,
      `Damage ${resolvedSpell.damage}`,
      `Cooldown ${(resolvedSpell.cooldownMs / 1000).toFixed(2)}s`,
      `Critical chance ${(resolvedSpell.critChance * 100).toFixed(1)}%`
    ];

    if (resolvedSpell.chainCount > 0) {
      lines.push(`Chains up to ${targetCount} enemies within ${resolvedSpell.chainRange} range`);
    }

    if (resolvedSpell.areaRadius > 0) {
      lines.push(`Explosion radius ${resolvedSpell.areaRadius}`);
    }

    if (supportSpellIds.length > 0) {
      lines.push(
        `Linked supports: ${supportSpellIds
          .map((supportSpellId) => supportSpellConfig[supportSpellId]?.name ?? supportSpellId)
          .join(", ")}`
      );
    }

    return lines;
  };

  const renderSpellUpgradeActions = (spellId: string) => {
    if (!character) {
      return null;
    }

    const spellLevel = getSpellLevel(character, spellId);
    const goldCost = getSpellUpgradeGoldCost(spellLevel);
    const shardCost = getSpellUpgradeShardCost(spellLevel);
    const nextTierRequirement = getSpellUpgradeTierRequirement(spellLevel + 1);
    const isUpgradeable = canUpgradeSpell(character, spellId);
    const isMaxLevel = spellLevel >= balanceConfig.spellProgression.maxLevel;

    return (
      <div className="stack compact-stack">
        <div className="status-text">
          {isMaxLevel
            ? "Max level reached"
            : `Upgrade cost: ${goldCost} gold${shardCost > 0 ? ` | ${shardCost} Map Shard${shardCost > 1 ? "s" : ""}` : ""} | Requires Tier ${nextTierRequirement}`}
        </div>
        <div className="actions">
          <button
            className="secondary-button"
            disabled={!isUpgradeable}
            onClick={() => handleUpgradeSpell(spellId)}
            type="button"
          >
            {isMaxLevel ? "Maxed" : "Upgrade"}
          </button>
        </div>
      </div>
    );
  };

  const renderHubTopBar = () => (
    <section className="panel mobile-header">
      <div>
        <h3>{character?.name}</h3>
        <p className="status-text">Level {character?.level} • Gold {character?.gold}</p>
      </div>
      <button className="secondary-button" onClick={() => void handleManualSave()}>
        Save
      </button>
    </section>
  );

  const renderMapsTab = () => (
    <MapsTab
      topBar={renderHubTopBar()}
      healthHud={
        <HealthHud
          character={arenaSnapshot?.player ?? character}
          canUseLifeFlask={character ? canUseLifeFlask(arenaSnapshot?.player ?? character) : false}
          onUseLifeFlask={handleUseLifeFlask}
        />
      }
      character={character}
      selectedMapTarget={selectedMapTarget}
      selectedMapId={selectedMapId}
      selectedMapEntry={selectedMapEntry}
      selectedMapEnhancements={selectedMapEnhancements}
      queuedMapCount={queuedMapIds.length}
      mapShardAmount={character ? getCurrencyAmount(character, "mapShard") : 0}
      getMapDisplayName={getMapDisplayName}
      getMapVariantLabel={getMapVariantLabel}
      getMapEnhancementDetailLines={getMapEnhancementDetailLines}
      onStartMap={handleStartMap}
      onRunAllMaps={handleRunAllMaps}
      onEnhanceSelectedMap={handleEnhanceSelectedMap}
      onSelectMap={setSelectedMapTarget}
      onConvertShardsToMaps={handleConvertShardsToMaps}
    />
  );
  /*
    const selectedMap = mapConfig[selectedMapId];
    const consumableMapEntries = character?.mapProgress.consumableMaps ?? [];
    const selectedResolvedMap = resolveMapInstance(selectedMap, selectedMapEnhancements);
    const nextEnhancementCost =
      selectedMapTarget !== "trainingGrounds" && selectedMapEntry
        ? getEnhancementShardCost(selectedMapEntry.enhancements.length)
        : null;

    return (
      <div className="content stack mobile-content">
        {renderHubTopBar()}
        <HealthHud
          character={arenaSnapshot?.player ?? character}
          canUseLifeFlask={character ? canUseLifeFlask(arenaSnapshot?.player ?? character) : false}
          onUseLifeFlask={handleUseLifeFlask}
        />
        <section className="panel stack">
          <h4>Maps</h4>
          <div className="selected-map-summary">
            <strong>Selected Map</strong>
            <div className="status-text">
              {getMapDisplayName(selectedMapId, selectedMapEnhancements.length)}{" "}
              {selectedMap.tier > 0 ? `(Tier ${selectedMap.tier})` : "(Infinite)"}
            </div>
            {selectedMapTarget !== "trainingGrounds" ? (
              <>
                <div className="status-text">
                  {getMapVariantLabel(selectedMapEnhancements.length)} | Enhancements {selectedMapEnhancements.length}/
                  {balanceConfig.mapCrafting.maxEnhancementsPerMap}
                </div>
                <div className="status-text">
                  Monsters {selectedResolvedMap.monsterCount} | Enemy health x
                  {selectedResolvedMap.enemyHealthMultiplier.toFixed(2)} | Enemy damage x
                  {selectedResolvedMap.enemyDamageMultiplier.toFixed(2)}
                </div>
                {getMapEnhancementSummary(selectedMapEnhancements).map((line) => (
                  <div key={`selected-map-enhancement-${line}`} className="status-text">
                    Mod: {line}
                  </div>
                ))}
                {getMapEnhancementDetailLines(selectedMapEnhancements).map((line) => (
                  <div key={`selected-map-detail-${line}`} className="status-text">
                    {line}
                  </div>
                ))}
              </>
            ) : null}
          </div>
          <div className="actions">
            <button className="primary-button" onClick={handleStartMap}>
              Start
            </button>
            {selectedMapTarget !== "trainingGrounds" ? (
              <button className="secondary-button" onClick={handleRunAllMaps}>
                Run all maps in this tier
              </button>
            ) : null}
            {selectedMapTarget !== "trainingGrounds" ? (
              <button className="secondary-button" onClick={handleEnhanceSelectedMap}>
                Enhance ({nextEnhancementCost} shards)
              </button>
            ) : null}
          </div>
          {queuedMapIds.length > 0 ? (
            <p className="status-text">
              Auto-run queue active: {queuedMapIds.length} map{queuedMapIds.length === 1 ? "" : "s"} remaining.
            </p>
          ) : null}
          <div className={selectedMapTarget === "trainingGrounds" ? "map-card selected-map-card" : "map-card"}>
            <div className="inventory-row">
              <div>
                <strong>Training Grounds</strong>
                <div className="status-text">Infinite practice run. Drops Tier 1 maps.</div>
              </div>
              <button className="secondary-button" onClick={() => setSelectedMapTarget("trainingGrounds")}>
                {selectedMapTarget === "trainingGrounds" ? "Selected" : "Select"}
              </button>
            </div>
          </div>
          {consumableMapEntries.map((entry) => (
            <div
              key={entry.stackId}
              className={selectedMapTarget === entry.stackId ? "map-card selected-map-card" : "map-card"}
            >
              <div className="inventory-row">
                <div>
                  <strong>{getMapDisplayName(entry.mapId, entry.enhancements.length)}</strong>
                  <div className="status-text">
                    Tier {entry.tier} • Quantity {entry.quantity}
                  </div>
                </div>
                <div className="status-text">
                  {getMapVariantLabel(entry.enhancements.length)} | Enhancements {entry.enhancements.length}/
                  {balanceConfig.mapCrafting.maxEnhancementsPerMap}
                </div>
                {getMapEnhancementSummary(entry.enhancements).map((line) => (
                  <div key={`${entry.stackId}-${line}`} className="status-text">
                    Mod: {line}
                  </div>
                ))}
                {getMapEnhancementDetailLines(entry.enhancements).map((line) => (
                  <div key={`${entry.stackId}-detail-${line}`} className="status-text">
                    {line}
                  </div>
                ))}
                <button className="secondary-button" onClick={() => setSelectedMapTarget(entry.stackId)}>
                  {selectedMapTarget === entry.stackId ? "Selected" : "Select"}
                </button>
              </div>
            </div>
          ))}
        </section>
        <section className="panel stack">
          <h4>Map Crafting</h4>
          <p className="status-text">Map Shards: {character ? getCurrencyAmount(character, "mapShard") : 0}</p>
          <button className="secondary-button" onClick={handleConvertShardsToMaps}>
            Combine {balanceConfig.mapCrafting.combineShardsCost} shards into maps
          </button>
        </section>
      </div>
    );
  };

  */
  const renderEquipmentTab = () => (
    <div className="content stack mobile-content">
      {renderHubTopBar()}
      <section className="panel stack">
        <h4>Equipment</h4>
        {equipmentSlots.map((slot) => (
          <div key={slot} className="inventory-row">
            <span>{getEquipmentSlotLabel(slot)}</span>
            <button
              className="secondary-button"
              onClick={() => {
                setSelectedEquipmentSlot(slot);
                setOverlayPanel("equipmentPicker");
              }}
            >
              {character?.equippedItems[slot]?.name ?? "Choose"}
            </button>
          </div>
        ))}
      </section>
    </div>
  );

  const renderSpellsTab = () => (
    <SpellsTab
      topBar={renderHubTopBar()}
      character={character}
      getSpellAccentClassName={getSpellAccentClassName}
      getSupportAccentClassName={getSupportAccentClassName}
      getSpellDetailLines={getSpellDetailLines}
      renderSpellUpgradeActions={renderSpellUpgradeActions}
      onSelectMainSpell={handleSelectMainSpell}
      onOpenMainSpellPicker={() => setOverlayPanel("mainSpellPicker")}
      onOpenSupportPicker={(slotIndex) => {
        setSelectedSupportSlot(slotIndex);
        setOverlayPanel("supportPicker");
      }}
    />
  );
  /*
    const activeMainSpellId = character?.spellLoadout[0]?.mainSpellId ?? "";
    const supportSlots = character?.spellLoadout[0]?.supportSpellIds ?? [];

    return (
      <div className="content stack mobile-content">
        {renderHubTopBar()}
        <section className="panel stack">
          <h4>Linked Spell</h4>
          <div className="materia-strip">
            <button
              className={`materia-orb main-materia ${getSpellAccentClassName(activeMainSpellId)}`}
              onClick={() => setOverlayPanel("mainSpellPicker")}
              type="button"
            >
              <span className="sr-only">{getSpellName(activeMainSpellId)}</span>
            </button>
            <div className="materia-link" />
            {[0, 1].map((slotIndex) => {
              const supportId = supportSlots[slotIndex];

              return (
                <button
                  key={slotIndex}
                  className={`materia-orb support-materia ${
                    supportId ? getSupportAccentClassName(supportId) : "empty-materia"
                  }`}
                  onClick={() => {
                    setSelectedSupportSlot(slotIndex as 0 | 1);
                    setOverlayPanel("supportPicker");
                  }}
                  type="button"
                >
                  <span className="sr-only">
                    {supportId ? supportSpellConfig[supportId]?.name ?? supportId : `Empty support slot ${slotIndex + 1}`}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="materia-caption">
            <strong>{getSpellName(activeMainSpellId)}</strong>
            <span className="status-text">
              {(supportSlots.filter(Boolean) as string[]).length > 0
                ? (supportSlots.filter(Boolean) as string[])
                    .map((id) => supportSpellConfig[id]?.name ?? id)
                    .join(" | ")
                : "Tap a slot to link supports"}
            </span>
          </div>
        </section>
        <section className="panel stack">
          <h4>Main Spell</h4>
          {(character?.unlockedSpellIds ?? []).map((spellId) => (
            <div key={spellId} className="loot-entry">
              <div className="inventory-row">
                <span>{getSpellName(spellId)}</span>
                <button className="secondary-button" onClick={() => handleSelectMainSpell(spellId)}>
                  {activeMainSpellId === spellId ? "Active" : "Equip"}
                </button>
              </div>
              <div className="status-text">{getSpellDescription(spellId)}</div>
              <div className="fact-grid">
                {getSpellDetailLines(
                  spellId,
                  activeMainSpellId === spellId ? supportSlots.filter(Boolean) as string[] : []
                ).map((line) => (
                  <span key={`${spellId}-${line}`} className="fact-chip">
                    {line}
                  </span>
                ))}
              </div>
              {renderSpellUpgradeActions(spellId)}
            </div>
          ))}
        </section>
        <section className="panel stack">
          <h4>Supports</h4>
          {[0, 1].map((slotIndex) => (
            <div key={slotIndex} className="inventory-row">
              <span>Support slot {slotIndex + 1}</span>
              <button
                className="secondary-button"
                onClick={() => {
                  setSelectedSupportSlot(slotIndex as 0 | 1);
                  setOverlayPanel("supportPicker");
                }}
              >
                {supportSlots[slotIndex]
                  ? supportSpellConfig[supportSlots[slotIndex]]?.name ?? supportSlots[slotIndex]
                  : "Choose"}
              </button>
            </div>
          ))}
          <p className="status-text">Tap a support slot to open the materia-style picker.</p>
        </section>
      </div>
    );
  };

  */
  const renderInventoryTab = () => (
    <InventoryTab
      topBar={renderHubTopBar()}
      character={character}
      recentLoot={recentLoot}
      getItemSellPrice={getItemSellPrice}
      onSellItem={handleSellItem}
      onEquipItem={handleEquipItem}
      onSelectEquipmentSlot={setSelectedEquipmentSlot}
    />
  );

  const renderShopTab = () => (
    <ShopTab
      topBar={renderHubTopBar()}
      character={character}
      shopItems={shopItems}
      formatPowerChange={formatPowerChange}
      onBuyShopItem={handleBuyShopItem}
      onSellAllItems={handleSellAllItems}
      onRefreshShop={handleRefreshShop}
    />
  );

  const renderCharacterTab = () => (
    <div className="content stack mobile-content">
      {renderHubTopBar()}
      <HealthHud
        character={arenaSnapshot?.player ?? character}
        canUseLifeFlask={character ? canUseLifeFlask(arenaSnapshot?.player ?? character) : false}
        onUseLifeFlask={handleUseLifeFlask}
      />
      <section className="panel stack">
        <h4>Account</h4>
        <div className="status-text">Email: {accountEmail || "Current session"}</div>
        <div className="status-text">Character: {character?.name ?? "None"}</div>
        <div className="status-text">Level: {character?.level ?? 0}</div>
        <div className="actions">
          <button className="secondary-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </section>
      <section className="panel stack">
        <h4>Level Up Stats</h4>
        <p className="status-text">Unspent points: {character?.unspentStatPoints ?? 0}</p>
        {(["strength", "agility", "vitality", "dexterity"] as const).map((statKey) => (
          <div key={statKey} className="inventory-row">
            <span>
              {statKey}: {character?.baseStats[statKey] ?? 0}
            </span>
            <button className="secondary-button" onClick={() => handleSpendStatPoint(statKey)}>
              Add point
            </button>
          </div>
        ))}
        <div className="status-text">
          Strength improves spell power, Agility improves cast speed, Vitality improves life, Dexterity improves crit chance.
        </div>
        <div className="status-text">
          Healing: you refill to full when a new map starts and use a life flask that gains charges from kills.
        </div>
      </section>
    </div>
  );

  const renderHubBottomTabs = () => {
    const tabs: Array<{ id: HubTab; label: string }> = [
      { id: "maps", label: "Maps" },
      { id: "equipment", label: "Gear" },
      { id: "spells", label: "Spells" },
      { id: "inventory", label: "Bag" },
      { id: "shop", label: "Shop" },
      { id: "character", label: "Account" }
    ];

    return (
      <nav className="bottom-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={hubTab === tab.id ? "bottom-tab active-tab" : "bottom-tab"}
            onClick={() => setHubTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    );
  };

  const renderOverlayPanel = () => (
    <HubOverlayPanel
      character={character}
      overlayPanel={overlayPanel}
      selectedEquipmentSlot={selectedEquipmentSlot}
      selectedSupportSlot={selectedSupportSlot}
      getSpellAccentClassName={getSpellAccentClassName}
      getSupportAccentClassName={getSupportAccentClassName}
      formatPowerChange={formatPowerChange}
      getSpellDetailLines={getSpellDetailLines}
      renderSpellUpgradeActions={renderSpellUpgradeActions}
      onClose={() => setOverlayPanel(null)}
      onEquipItem={handleEquipItem}
      onSelectMainSpell={handleSelectMainSpell}
      onSelectSupportSpell={handleSelectSupportSpell}
    />
  );

  const renderAuthPanel = () => (
    <div className="content">
      {renderInlineFeedback()}
      <section className="panel stack">
        <h2>Simple ARPG</h2>
        <p>
          Build a character, run maps, collect loot, and shape your main spell with support links.
        </p>
      </section>
      <section className="panel stack">
        <h3>{authMode === "register" ? "Create account" : "Login"}</h3>
        <div className="form-grid">
          <input
            className="text-input"
            placeholder="Email"
            type="email"
            value={authForm.email}
            onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
          />
          <input
            className="text-input"
            placeholder="Password"
            type="password"
            value={authForm.password}
            onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
          />
        </div>
        <div className="actions">
          <button className="primary-button" onClick={() => void handleAuth()}>
            {authMode === "register" ? "Register" : "Login"}
          </button>
          <button
            className="secondary-button"
            onClick={() => setAuthMode((current) => (current === "register" ? "login" : "register"))}
          >
            Switch to {authMode === "register" ? "login" : "register"}
          </button>
        </div>
      </section>
    </div>
  );

  const renderCharacterCreation = () => (
    <div className="content">
      {renderInlineFeedback()}
      <section className="panel stack">
        <h3>Create character</h3>
        <input
          className="text-input"
          value={characterName}
          onChange={(event) => setCharacterName(event.target.value)}
        />
        <p>Distribute exactly {balanceConfig.progression.startingStatPoints} starting stat points.</p>
        {Object.entries(characterStats).map(([key, value]) => (
          <div className="stat-row" key={key}>
            <span>{key}</span>
            <div className="stat-controls">
              <button className="secondary-button" onClick={() => updateStat(key as keyof CharacterStats, -1)}>
                -
              </button>
              <strong>{value}</strong>
              <button className="secondary-button" onClick={() => updateStat(key as keyof CharacterStats, 1)}>
                +
              </button>
            </div>
          </div>
        ))}
        <p className="status-text">Remaining points: {remainingStatPoints}</p>
        <button className="primary-button" onClick={() => void handleCharacterCreation()}>
          Create character
        </button>
      </section>
    </div>
  );

  const renderHub = () => (
    <div className="hub-shell">
      <div className="content mobile-only-feedback">{renderInlineFeedback()}</div>
      {hubTab === "maps" ? renderMapsTab() : null}
      {hubTab === "equipment" ? renderEquipmentTab() : null}
      {hubTab === "spells" ? renderSpellsTab() : null}
      {hubTab === "inventory" ? renderInventoryTab() : null}
      {hubTab === "shop" ? renderShopTab() : null}
      {hubTab === "character" ? renderCharacterTab() : null}
      {renderHubBottomTabs()}
      {renderOverlayPanel()}
    </div>
  );

  const renderArena = () => {
    return (
      <Suspense
        fallback={
          <div className="content">
            <section className="panel stack">
              <h3>Loading arena</h3>
              <p className="status-text">Preparing combat scene and mobile HUD.</p>
            </section>
          </div>
        }
      >
        <ArenaScreen
          arenaSnapshot={arenaSnapshot}
          character={character}
          recentLoot={recentLoot}
          feedback={renderInlineFeedback()}
          onManualSave={handleManualSave}
          onUseLifeFlask={handleUseLifeFlask}
          getSpellDetailLines={getSpellDetailLines}
          onBackToHub={() => {
            setQueuedMapIds([]);
            setScreenMode("hub");
            setActiveMapId(null);
            setActiveMapEnhancements([]);
          }}
        />
      </Suspense>
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <section>
          <h1>Simple ARPG</h1>
          <p className="status-text">{statusMessage}</p>
          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        </section>
      </aside>
      {screenMode === "auth" ? renderAuthPanel() : null}
      {screenMode === "character" ? renderCharacterCreation() : null}
      {screenMode === "hub" ? renderHub() : null}
      {screenMode === "arena" ? renderArena() : null}
    </div>
  );
};
