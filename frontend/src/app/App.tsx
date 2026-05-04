import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { createCharacter, loadCharacter } from "../api/gameApi";
import { login, register } from "../api/authApi";
import type { AuthFormState } from "../auth/authTypes";
import { AuthScreen } from "./AuthScreen";
import type { HubTab, OverlayPanel, ScreenMode, SelectedMapTarget } from "./appTypes";
import { EquipmentTab } from "./EquipmentTab";
import { HealthHud } from "./HealthHud";
import { HubBottomTabs } from "./HubBottomTabs";
import { HubOverlayPanel } from "./HubOverlayPanel";
import { HubTopBar } from "./HubTopBar";
import { InventoryTab } from "./InventoryTab";
import { InlineFeedbackPanel } from "./InlineFeedbackPanel";
import {
  getCurrencyAmount,
  getMapDisplayName,
  getMapEnhancementDetailLines,
  getMapVariantLabel,
  getPreferredMapSelection
} from "./mapFlow";
import { MapsTab } from "./MapsTab";
import { ShopTab } from "./ShopTab";
import { SpellsTab } from "./SpellsTab";
import { CharacterCreationScreen } from "./CharacterCreationScreen";
import { CharacterTab } from "./CharacterTab";
import { useArenaSession } from "./useArenaSession";
import { useHubActions } from "./useHubActions";
import { useMapActions } from "./useMapActions";
import { useCharacterPersistence } from "./useCharacterPersistence";
import { balanceConfig } from "../game/config/balanceConfig";
import { spellConfig, supportSpellConfig } from "../game/config/spellConfig";
import type { ArenaRuntimeState } from "../game/domain/combat/arenaSimulation";
import { getItemPowerScore } from "../game/domain/items/itemPower";
import { generateItemDrop } from "../game/domain/items/itemGenerator";
import { getOwnedMapStack } from "../game/domain/maps/mapProgress";
import { canUseLifeFlask } from "../game/domain/player/lifeFlask";
import { createNewCharacter, normalizeCharacterRecord } from "../game/domain/player/playerTypes";
import { resolveSpell } from "../game/domain/spells/spellEngine";
import {
  canUpgradeSpell,
  getSpellLevel,
  getSpellUpgradeGoldCost,
  getSpellUpgradeShardCost,
  getSpellUpgradeTierRequirement
} from "../game/domain/spells/spellProgression";
import type {
  ArenaSnapshot,
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

const getItemSellPrice = (item: InventoryItem): number =>
  Math.max(
    balanceConfig.economy.itemSellPriceFloor,
    Math.round(getItemPowerScore(item) * balanceConfig.economy.itemSellPriceMultiplier)
  );

const formatPowerChange = (powerChange: number | null): string =>
  powerChange === null
    ? "Power change: New slot item"
    : `Power change: ${powerChange > 0 ? "+" : ""}${powerChange.toFixed(0)}`;

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
  const { handleConvertShardsToMaps, handleEnhanceSelectedMap, handleRunAllMaps, handleStartMap } = useMapActions({
    character,
    selectedMapTarget,
    commitCharacter,
    persistCharacterNow,
    setQueuedMapIds,
    setActiveMapId,
    setActiveMapEnhancements,
    setActiveMapRunId,
    setArenaSnapshot,
    setSelectedMapTarget,
    setScreenMode,
    setStatusMessage,
    setErrorMessage
  });
  const {
    handleEquipItem,
    handleSelectMainSpell,
    handleSelectSupportSpell,
    handleBuyShopItem,
    handleRefreshShop,
    handleSellItem,
    handleSellAllItems,
    handleSpendStatPoint,
    handleUpgradeSpell,
    handleUseLifeFlask
  } = useHubActions({
    character,
    selectedSupportSlot,
    screenMode,
    arenaRuntimeRef,
    latestCharacterRef,
    commitCharacter,
    setOverlayPanel,
    shopItems,
    setShopItems,
    setArenaSnapshot,
    setStatusMessage,
    setErrorMessage,
    createShopStock,
    toShopItemState,
    getItemSellPrice
  });

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

  useArenaSession({
    screenMode,
    character,
    activeMapId,
    activeMapEnhancements,
    activeMapRunId,
    arenaRuntimeRef,
    queuedMapIdsRef,
    commitCharacter,
    setRecentLoot,
    setArenaSnapshot,
    setQueuedMapIds,
    setActiveMapId,
    setActiveMapEnhancements,
    setActiveMapRunId,
    setScreenMode,
    setStatusMessage,
    setErrorMessage
  });

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

  const renderInlineFeedback = () => {
    return <InlineFeedbackPanel statusMessage={statusMessage} errorMessage={errorMessage} />;
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
    <HubTopBar
      characterName={character?.name}
      level={character?.level}
      gold={character?.gold}
      onSave={() => void handleManualSave()}
    />
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

  const renderEquipmentTab = () => (
    <EquipmentTab
      topBar={renderHubTopBar()}
      character={character}
      equipmentSlots={equipmentSlots}
      onSelectEquipmentSlot={setSelectedEquipmentSlot}
      onOpenEquipmentPicker={() => setOverlayPanel("equipmentPicker")}
    />
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
    <CharacterTab
      topBar={renderHubTopBar()}
      healthHud={
        <HealthHud
          character={arenaSnapshot?.player ?? character}
          canUseLifeFlask={character ? canUseLifeFlask(arenaSnapshot?.player ?? character) : false}
          onUseLifeFlask={handleUseLifeFlask}
        />
      }
      accountEmail={accountEmail}
      character={character}
      onLogout={handleLogout}
      onSpendStatPoint={handleSpendStatPoint}
    />
  );

  const renderHubBottomTabs = () => <HubBottomTabs activeTab={hubTab} onSelectTab={setHubTab} />;

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
    <AuthScreen
      feedback={renderInlineFeedback()}
      authMode={authMode}
      authForm={authForm}
      onChangeAuthForm={setAuthForm}
      onSubmit={() => void handleAuth()}
      onToggleMode={() => setAuthMode((current) => (current === "register" ? "login" : "register"))}
    />
  );

  const renderCharacterCreation = () => (
    <CharacterCreationScreen
      feedback={renderInlineFeedback()}
      characterName={characterName}
      characterStats={characterStats}
      remainingStatPoints={remainingStatPoints}
      onChangeCharacterName={setCharacterName}
      onUpdateStat={updateStat}
      onCreateCharacter={() => void handleCharacterCreation()}
    />
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


