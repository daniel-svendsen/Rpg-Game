import { useEffect, useMemo, useRef, useState } from "react";
import { createCharacter, loadCharacter, saveCharacter } from "../api/gameApi";
import { login, register } from "../api/authApi";
import type { AuthFormState } from "../auth/authTypes";
import { balanceConfig } from "../game/config/balanceConfig";
import { getEquipmentSlotLabel, getItemSlotLabel } from "../game/config/itemConfig";
import { mapConfig } from "../game/config/mapConfig";
import { spellConfig, supportSpellConfig } from "../game/config/spellConfig";
import { createArenaRuntime, stepArenaRuntime } from "../game/domain/combat/arenaSimulation";
import type { ArenaRuntimeState } from "../game/domain/combat/arenaSimulation";
import { getItemPowerScore, isUpgradeForCharacter } from "../game/domain/items/itemPower";
import { generateItemDrop } from "../game/domain/items/itemGenerator";
import { getItemStatLines } from "../game/domain/items/itemStats";
import { addOwnedMap, consumeOwnedMap, getMapQuantity } from "../game/domain/maps/mapProgress";
import { equipItem } from "../game/domain/player/equipment";
import { canUseLifeFlask, useLifeFlask } from "../game/domain/player/lifeFlask";
import {
  createNewCharacter,
  normalizeCharacterRecord,
  spendLevelStatPoint
} from "../game/domain/player/playerTypes";
import { getSpellDescription, getSpellName } from "../game/domain/spells/spellDrops";
import { resolveSpell } from "../game/domain/spells/spellEngine";
import {
  canUpgradeSpell,
  getSpellLevel,
  getSpellUpgradeGoldCost,
  getSpellUpgradeShardCost,
  getSpellUpgradeTierRequirement,
  upgradeSpell
} from "../game/domain/spells/spellProgression";
import { PhaserGame } from "../game/phaser/PhaserGame";
import type {
  ArenaSnapshot,
  CharacterRecord,
  CharacterStats,
  EquipmentSlot,
  InventoryItem,
  LootEntry
} from "../shared/types/saveTypes";

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
    balanceConfig.economy.shopBasePrice + getItemPowerScore(item) * balanceConfig.economy.shopPowerPriceMultiplier
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
  Math.max(4, Math.round(getItemPowerScore(item) * 0.35));

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
  const [character, setCharacter] = useState<CharacterRecord | null>(null);
  const [arenaSnapshot, setArenaSnapshot] = useState<ArenaSnapshot | null>(null);
  const [activeMapId, setActiveMapId] = useState<string | null>(null);
  const [selectedMapId, setSelectedMapId] = useState("trainingGrounds");
  const [recentLoot, setRecentLoot] = useState<LootEntry[]>([]);
  const [shopItems, setShopItems] = useState<ShopItemState[]>([]);
  const [selectedEquipmentSlot, setSelectedEquipmentSlot] = useState<EquipmentSlot>("Weapon");
  const [selectedSupportSlot, setSelectedSupportSlot] = useState<0 | 1>(0);
  const [statusMessage, setStatusMessage] = useState("Create an account or log in to begin.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const phaserContainerRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<PhaserGame | null>(null);
  const latestCharacterRef = useRef<CharacterRecord | null>(null);
  const arenaRuntimeRef = useRef<ArenaRuntimeState | null>(null);

  const remainingStatPoints = useMemo(
    () =>
      balanceConfig.progression.startingStatPoints -
      Object.values(characterStats).reduce((total, value) => total + value, 0),
    [characterStats]
  );

  useEffect(() => {
    if (!token) {
      setScreenMode("auth");
      return;
    }

    void (async () => {
      const loadedCharacter = await loadCharacter(token);

      if (loadedCharacter) {
        const normalizedCharacter = normalizeCharacterRecord(loadedCharacter);
        setCharacter(normalizedCharacter);
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
    let runtime = createArenaRuntime(character, activeMapId);
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
        setCharacter(runtime.snapshot.player);
        lastUiUpdateAt = timestamp;
      }

      phaserGameRef.current?.updateSnapshot(runtime.snapshot);

      if (runtime.snapshot.isComplete || runtime.snapshot.player.currentHealth <= 0) {
        setArenaSnapshot(runtime.snapshot);
        setCharacter(runtime.snapshot.player);
        setScreenMode("hub");
        setActiveMapId(null);
        setStatusMessage(
          runtime.snapshot.player.currentHealth <= 0
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
  }, [screenMode, character?.id, activeMapId]);

  useEffect(() => {
    if (screenMode !== "arena" || !phaserContainerRef.current || phaserGameRef.current) {
      return;
    }

    phaserGameRef.current = new PhaserGame(phaserContainerRef.current);

    return () => {
      phaserGameRef.current?.destroy();
      phaserGameRef.current = null;
    };
  }, [screenMode]);

  useEffect(() => {
    if (screenMode !== "hub" && screenMode !== "arena") {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [screenMode, hubTab]);

  useEffect(() => {
    latestCharacterRef.current = character;
  }, [character]);

  useEffect(() => {
    if (!token || !character || (screenMode !== "arena" && screenMode !== "hub")) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const latestCharacter = latestCharacterRef.current;

      if (!latestCharacter) {
        return;
      }

      void saveCharacter(latestCharacter, token)
        .then((savedCharacter) => {
          setCharacter(normalizeCharacterRecord(savedCharacter));
        })
        .catch(() => {
          setErrorMessage("Autosave failed. Check that the backend is running.");
        });
    }, 10_000);

    return () => window.clearInterval(intervalId);
  }, [token, screenMode, character?.id]);

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
      setCharacter(normalizedCharacter);
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
    if (!token || !character) {
      return;
    }

    try {
      const savedCharacter = await saveCharacter(character, token);
      setCharacter(normalizeCharacterRecord(savedCharacter));
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
    setCharacter(null);
    setArenaSnapshot(null);
    setActiveMapId(null);
    setShopItems([]);
    setOverlayPanel(null);
    setHubTab("maps");
    setStatusMessage("Logged out.");
    setErrorMessage(null);
  };

  const handleStartMap = (): void => {
    if (!character) {
      return;
    }

    let nextCharacter = normalizeCharacterRecord(character);

    if (balanceConfig.healing.refillToFullOnMapStart) {
      nextCharacter = {
        ...nextCharacter,
        currentHealth: nextCharacter.derivedStats.maxHealth,
        lifeFlask: {
          currentCharges: balanceConfig.healing.lifeFlask.maxCharges
        }
      };
    }

    if (selectedMapId !== "trainingGrounds") {
      const quantity = getMapQuantity(nextCharacter.mapProgress, selectedMapId);

      if (quantity <= 0) {
        setErrorMessage("You do not own that map.");
        return;
      }

      nextCharacter = consumeOwnedMap(nextCharacter, selectedMapId);
    }

    setCharacter(nextCharacter);
    setActiveMapId(selectedMapId);
    setArenaSnapshot(null);
    setErrorMessage(null);
    setScreenMode("arena");
    setStatusMessage(`Entering ${mapConfig[selectedMapId].name}.`);
  };

  const handleEquipItem = (itemId: string, targetSlotOverride?: EquipmentSlot): void => {
    if (!character) {
      return;
    }

    setCharacter(equipItem(character, itemId, targetSlotOverride));
    setOverlayPanel(null);
    setStatusMessage("Equipment updated.");
  };

  const handleSelectMainSpell = (spellId: string): void => {
    if (!character) {
      return;
    }

    const currentLoadout = character.spellLoadout[0];
    setCharacter({
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

    setCharacter({
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

    setCharacter({
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

    setCharacter({
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
    setCharacter({
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
    setCharacter({
      ...character,
      gold: character.gold + totalGold,
      inventory: []
    });
    setStatusMessage(`Sold all inventory items for ${totalGold} gold.`);
  };

  const handleEnhanceSelectedMap = (): void => {
    if (!character || selectedMapId === "trainingGrounds") {
      return;
    }

    const selectedMap = mapConfig[selectedMapId];
    const quantity = getMapQuantity(character.mapProgress, selectedMapId);

    if (quantity <= 0) {
      setErrorMessage("You do not own that map.");
      return;
    }

    if (getCurrencyAmount(character, "mapShard") < balanceConfig.mapCrafting.enhanceShardCost) {
      setErrorMessage(`You need ${balanceConfig.mapCrafting.enhanceShardCost} Map Shards to enhance a map.`);
      return;
    }

    if (selectedMap.tier >= balanceConfig.mapTierScaling.maxTier) {
      setErrorMessage(
        `This prototype currently supports map enhancement up to Tier ${balanceConfig.mapTierScaling.maxTier}.`
      );
      return;
    }

    let nextCharacter = consumeOwnedMap(character, selectedMapId);
    nextCharacter = updateCurrency(nextCharacter, "mapShard", -balanceConfig.mapCrafting.enhanceShardCost);
    nextCharacter = addOwnedMap(nextCharacter, `tier${selectedMap.tier + 1}Map`, selectedMap.tier + 1);
    setCharacter(nextCharacter);
    setStatusMessage(`Enhanced one ${selectedMap.name} into Tier ${selectedMap.tier + 1} Map.`);
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

    setCharacter(nextCharacter);
    setStatusMessage(`Combined shards into ${mapsToCreate} Tier 1 map${mapsToCreate > 1 ? "s" : ""}.`);
  };

  const handleSpendStatPoint = (statKey: keyof CharacterStats): void => {
    if (!character) {
      return;
    }

    setCharacter(spendLevelStatPoint(character, statKey));
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

    setCharacter(nextCharacter);
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

    setCharacter(nextCharacter);
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

  const renderHealthHud = () => {
    const currentCharacter = arenaSnapshot?.player ?? character;
    const currentHealth = currentCharacter?.currentHealth ?? 0;
    const maxHealth = currentCharacter?.derivedStats.maxHealth ?? 1;
    const healthPercentage = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
    const currentFlaskCharges = currentCharacter?.lifeFlask.currentCharges ?? 0;

    return (
      <div className="panel">
        <h4>Health</h4>
        <div className="health-bar">
          <div className="health-fill" style={{ width: `${healthPercentage}%` }} />
        </div>
        <p className="status-text">
          {currentHealth} / {maxHealth}
        </p>
        {currentCharacter ? (
          <div className="stack compact-stack">
            <div className="status-text">
              {`Life Flask: ${currentFlaskCharges}/${balanceConfig.healing.lifeFlask.maxCharges} charges`}
            </div>
            <button
              className="secondary-button"
              disabled={!canUseLifeFlask(currentCharacter)}
              onClick={handleUseLifeFlask}
              type="button"
            >
              {`Use Flask (${balanceConfig.healing.lifeFlask.chargesPerUse} charges)`}
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  const renderLootPanel = () => (
    <section className="panel stack">
      <h4>Recent Loot</h4>
      {recentLoot.length === 0 ? <p className="status-text">No loot recorded yet.</p> : null}
      {recentLoot.map((loot) => (
        <div key={loot.id} className="loot-entry">
          <div className="inventory-row">
            <strong>{loot.name}</strong>
            <span>{loot.kind}</span>
          </div>
          {loot.details.map((detail) => (
            <div key={`${loot.id}-${detail}`} className="status-text">
              {detail}
            </div>
          ))}
          {loot.isUpgrade ? <div className="upgrade-text">Possible upgrade</div> : null}
        </div>
      ))}
    </section>
  );

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

  const renderMapsTab = () => {
    const selectedMap = mapConfig[selectedMapId];
    const consumableMapEntries = character?.mapProgress.consumableMaps ?? [];

    return (
      <div className="content stack mobile-content">
        {renderHubTopBar()}
        {renderHealthHud()}
        <section className="panel stack">
          <h4>Maps</h4>
          <div className="selected-map-summary">
            <strong>Selected Map</strong>
            <div className="status-text">
              {selectedMap.name} {selectedMap.tier > 0 ? `(Tier ${selectedMap.tier})` : "(Infinite)"}
            </div>
          </div>
          <div className="actions">
            <button className="primary-button" onClick={handleStartMap}>
              Start
            </button>
            <button className="secondary-button" onClick={handleEnhanceSelectedMap}>
              Enhance
            </button>
          </div>
          <div className={selectedMapId === "trainingGrounds" ? "map-card selected-map-card" : "map-card"}>
            <div className="inventory-row">
              <div>
                <strong>Training Grounds</strong>
                <div className="status-text">Infinite practice run. Drops Tier 1 maps.</div>
              </div>
              <button className="secondary-button" onClick={() => setSelectedMapId("trainingGrounds")}>
                {selectedMapId === "trainingGrounds" ? "Selected" : "Select"}
              </button>
            </div>
          </div>
          {consumableMapEntries.map((entry) => (
            <div
              key={entry.mapId}
              className={selectedMapId === entry.mapId ? "map-card selected-map-card" : "map-card"}
            >
              <div className="inventory-row">
                <div>
                  <strong>{mapConfig[entry.mapId]?.name ?? entry.mapId}</strong>
                  <div className="status-text">
                    Tier {entry.tier} • Quantity {entry.quantity}
                  </div>
                </div>
                <button className="secondary-button" onClick={() => setSelectedMapId(entry.mapId)}>
                  {selectedMapId === entry.mapId ? "Selected" : "Select"}
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

  const renderSpellsTab = () => {
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

  const renderInventoryTab = () => (
    <div className="content stack mobile-content">
      {renderHubTopBar()}
      <section className="panel stack">
        <div className="inventory-row">
          <h4>Inventory</h4>
        </div>
        {(character?.inventory ?? []).map((item) => (
          <div key={item.id} className="loot-entry">
            <div className="inventory-row">
              <strong>{item.name}</strong>
              <span>{item.slot ? getItemSlotLabel(item.slot) : "Stored"}</span>
            </div>
            <div className="status-text">Power {getItemPowerScore(item).toFixed(0)}</div>
            {getItemStatLines(item).map((line) => (
              <div key={`${item.id}-${line}`} className="status-text">
                {line}
              </div>
            ))}
            <div className="actions">
              {item.slot ? (
                <button
                  className="secondary-button"
                  onClick={() => {
                    if (!character) {
                      return;
                    }

                    if (item.slot === "Ring") {
                      handleEquipItem(
                        item.id,
                        character.equippedItems.Ring1 && !character.equippedItems.Ring2 ? "Ring2" : "Ring1"
                      );
                      return;
                    }

                    setSelectedEquipmentSlot(item.slot as EquipmentSlot);
                    handleEquipItem(item.id, item.slot as EquipmentSlot);
                  }}
                >
                  Equip
                </button>
              ) : null}
              <button className="secondary-button" onClick={() => handleSellItem(item.id)}>
                Sell for {getItemSellPrice(item)} gold
              </button>
            </div>
            {character && isUpgradeForCharacter(character, item) ? (
              <div className="upgrade-text">Possible upgrade</div>
            ) : null}
          </div>
        ))}
      </section>
      {renderLootPanel()}
    </div>
  );

  const renderShopTab = () => (
    <div className="content stack mobile-content">
      {renderHubTopBar()}
      <section className="panel stack">
        <div className="inventory-row">
          <h4>Shop</h4>
          <button className="secondary-button" onClick={handleSellAllItems}>
            Sell all
          </button>
        </div>
        {shopItems.map((item) => (
          <div key={item.id} className="loot-entry">
            <div className="inventory-row">
              <strong>{item.name}</strong>
              <span>{item.price} gold</span>
            </div>
            <div className="status-text">Power {getItemPowerScore(item).toFixed(0)}</div>
            {getItemStatLines(item).map((line) => (
              <div key={`${item.id}-${line}`} className="status-text">
                {line}
              </div>
            ))}
            <button className="secondary-button" onClick={() => handleBuyShopItem(item.id)}>
              Buy
            </button>
          </div>
        ))}
        <button className="secondary-button" onClick={handleRefreshShop}>
          Refresh shop ({balanceConfig.economy.shopRefreshGoldCost} gold)
        </button>
      </section>
    </div>
  );

  const renderCharacterTab = () => (
    <div className="content stack mobile-content">
      {renderHubTopBar()}
      {renderHealthHud()}
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

  const renderOverlayPanel = () => {
    if (!character || !overlayPanel) {
      return null;
    }

    if (overlayPanel === "equipmentPicker") {
      const selectedSlotItems = character.inventory
        .filter((item) =>
          selectedEquipmentSlot === "Ring1" || selectedEquipmentSlot === "Ring2"
            ? item.slot === "Ring"
            : item.slot === selectedEquipmentSlot
        )
        .sort((left, right) => getItemPowerScore(right) - getItemPowerScore(left));
      const equippedItem = character.equippedItems[selectedEquipmentSlot];

      return (
        <div className="mobile-overlay" onClick={() => setOverlayPanel(null)}>
          <div className="mobile-panel" onClick={(event) => event.stopPropagation()}>
            <div className="inventory-row">
              <h3>{getEquipmentSlotLabel(selectedEquipmentSlot)}</h3>
              <button className="secondary-button" onClick={() => setOverlayPanel(null)}>
                Close
              </button>
            </div>
            {selectedSlotItems.length === 0 ? <p className="status-text">No items for this slot yet.</p> : null}
            {selectedSlotItems.map((item) => (
              <div key={item.id} className="loot-entry">
                <div className="inventory-row">
                  <strong>{item.name}</strong>
                  <span>Power {getItemPowerScore(item).toFixed(0)}</span>
                </div>
                <div className="status-text">
                  {(() => {
                    const powerChange =
                      getItemPowerScore(item) -
                      getItemPowerScore(
                        equippedItem ??
                          ({
                            id: "empty",
                            name: "Empty",
                            slot: selectedEquipmentSlot,
                            rarity: "Normal",
                            tier: 1,
                            tags: [],
                            statBonuses: {}
                          } as InventoryItem)
                      );

                    return `Power change: ${powerChange > 0 ? "+" : ""}${powerChange.toFixed(0)}`;
                  })()}
                </div>
                {getItemStatLines(item).map((line) => (
                  <div key={`${item.id}-${line}`} className="status-text">
                    {line}
                  </div>
                ))}
                <button className="primary-button" onClick={() => handleEquipItem(item.id, selectedEquipmentSlot)}>
                  Equip
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (overlayPanel === "mainSpellPicker") {
      const activeMainSpellId = character.spellLoadout[0]?.mainSpellId ?? "";

      return (
        <div className="mobile-overlay" onClick={() => setOverlayPanel(null)}>
          <div className="mobile-panel" onClick={(event) => event.stopPropagation()}>
            <div className="inventory-row">
              <h3>Main Spell</h3>
              <button className="secondary-button" onClick={() => setOverlayPanel(null)}>
                Close
              </button>
            </div>
            {(character.unlockedSpellIds ?? []).map((spellId) => (
              <div key={spellId} className="loot-entry">
                <div className="inventory-row">
                  <div className="materia-picker-row">
                    <span className={`materia-orb support-materia ${getSpellAccentClassName(spellId)}`} />
                    <div className="stack compact-stack">
                      <strong>{getSpellName(spellId)}</strong>
                      <div className="status-text">{getSpellDescription(spellId)}</div>
                    </div>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => {
                      handleSelectMainSpell(spellId);
                      setOverlayPanel(null);
                    }}
                  >
                    {activeMainSpellId === spellId ? "Active" : "Equip"}
                  </button>
                </div>
                <div className="fact-grid">
                  {getSpellDetailLines(spellId, []).map((line) => (
                    <span key={`${spellId}-picker-${line}`} className="fact-chip">
                      {line}
                    </span>
                  ))}
                </div>
                {renderSpellUpgradeActions(spellId)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="mobile-overlay" onClick={() => setOverlayPanel(null)}>
        <div className="mobile-panel" onClick={(event) => event.stopPropagation()}>
          <div className="inventory-row">
            <h3>Support Slot {selectedSupportSlot + 1}</h3>
            <button className="secondary-button" onClick={() => setOverlayPanel(null)}>
              Close
            </button>
          </div>
          {(character.unlockedSupportSpellIds ?? []).map((supportSpellId) => {
            const supportSpell = supportSpellConfig[supportSpellId];

            if (!supportSpell) {
              return null;
            }

            return (
              <div key={supportSpell.id} className="loot-entry">
                <div className="inventory-row">
                  <div className="materia-picker-row">
                    <span className={`materia-orb support-materia ${getSupportAccentClassName(supportSpell.id)}`} />
                    <div className="stack compact-stack">
                      <strong>{supportSpell.name}</strong>
                      <div className="status-text">{supportSpell.tags.join(", ")}</div>
                    </div>
                  </div>
                  <button className="primary-button" onClick={() => handleSelectSupportSpell(supportSpell.id)}>
                    Select
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
    const activeSpellId = character?.spellLoadout[0]?.mainSpellId ?? "";

    return (
      <div className="content arena-layout">
        <div className="mobile-only-feedback">{renderInlineFeedback()}</div>
        <section className="panel arena-host">
          <div className="arena-overlay">
            <div className="overlay-chip">
              <strong>{character?.name}</strong>
              <span>{activeSpellId ? getSpellName(activeSpellId) : "No spell"}</span>
            </div>
          </div>
          <div ref={phaserContainerRef} />
        </section>
        <aside className="stack">
          {renderHealthHud()}
          <section className="panel">
            <h4>Active spell</h4>
            <div className="badge-row">
              <span className="badge">{character ? getSpellName(character.spellLoadout[0]?.mainSpellId ?? "") : ""}</span>
            </div>
            <div className="fact-grid">
              {character
                ? getSpellDetailLines(
                    character.spellLoadout[0]?.mainSpellId ?? "",
                    character.spellLoadout[0]?.supportSpellIds ?? []
                  ).map((line) => (
                    <span key={`arena-${line}`} className="fact-chip">
                      {line}
                    </span>
                  ))
                : null}
            </div>
            <p className="status-text">
              Supports: {(character?.spellLoadout[0]?.supportSpellIds ?? [])
                .map((id) => supportSpellConfig[id]?.name ?? id)
                .join(", ") || "None"}
            </p>
          </section>
          <section className="panel">
            <h4>Map state</h4>
            <p>
              {arenaSnapshot?.mapName} Tier {arenaSnapshot?.mapTier}
            </p>
            <p>Enemies alive: {arenaSnapshot?.enemies.length ?? 0}</p>
            <p>{arenaSnapshot?.isComplete ? "Map complete." : "Map in progress."}</p>
            <div className="actions">
              <button className="primary-button" onClick={() => void handleManualSave()}>
                Save progress
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setScreenMode("hub");
                  setActiveMapId(null);
                }}
              >
                Back to hub
              </button>
            </div>
          </section>
          {renderLootPanel()}
        </aside>
      </div>
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
