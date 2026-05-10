import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import type { ApiRequestError } from "../api/http";
import { createCharacter, loadCharacterWithAuthState } from "../api/gameApi";
import { login, register } from "../api/authApi";
import type { AuthFieldErrors, AuthFormState } from "../auth/authTypes";
import { resolveAuthErrorMessage } from "./authFeedback";
import { AuthScreen } from "./AuthScreen";
import type { HubTab, OverlayPanel, RunSummaryData, ScreenMode, SelectedMapTarget } from "./appTypes";
import { HubScreen } from "./HubScreen";
import { RunSummaryScreen } from "./RunSummaryScreen";
import { InlineFeedbackPanel } from "./InlineFeedbackPanel";
import {
  accountEmailStorageKey,
  createShopStock,
  getItemSellPrice,
  toShopItemState,
  type ShopItemState
} from "./appUiHelpers";
import { getPreferredMapSelection } from "./mapFlow";
import { CharacterCreationScreen } from "./CharacterCreationScreen";
import { useArenaSession } from "./useArenaSession";
import { useHubActions } from "./useHubActions";
import { useMapActions } from "./useMapActions";
import { useCharacterPersistence } from "./useCharacterPersistence";
import { balanceConfig } from "../game/config/balanceConfig";
import type { ArenaRuntimeState } from "../game/domain/combat/arenaSimulation";
import { getOwnedMapStack } from "../game/domain/maps/mapProgress";
import { createNewCharacter, normalizeCharacterRecord } from "../game/domain/player/playerTypes";
import type {
  ArenaSnapshot,
  CharacterStats,
  EquipmentSlot,
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

export const App = () => {
  const [screenMode, setScreenMode] = useState<ScreenMode>("auth");
  const [hubTab, setHubTab] = useState<HubTab>("maps");
  const [overlayPanel, setOverlayPanel] = useState<OverlayPanel>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authForm, setAuthForm] = useState<AuthFormState>(initialAuthForm);
  const [authFieldErrors, setAuthFieldErrors] = useState<AuthFieldErrors>({});
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
  const [runSummaryData, setRunSummaryData] = useState<RunSummaryData | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const arenaRuntimeRef = useRef<ArenaRuntimeState | null>(null);
  const queuedMapIdsRef = useRef<string[]>([]);
  const { character, latestCharacterRef, commitCharacter, hydrateCharacter, persistCharacterNow, saveCharacterManually } =
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
  const {
    startMapRun,
    handleConvertShardsToMaps,
    handleCraftMapAtTier,
    handleEnhanceSelectedMap,
    handleRunAllMaps,
    handleStartBossTier,
    handleStartMap
  } = useMapActions({
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
      const result = await loadCharacterWithAuthState(token);

      if (result.isUnauthorized) {
        localStorage.removeItem("arpg-token");
        setToken(null);
        setScreenMode("auth");
        setStatusMessage("Session expired. Please log in again.");
        return;
      }

      const loadedCharacter = result.character;

      if (loadedCharacter) {
        const normalizedCharacter = normalizeCharacterRecord(loadedCharacter);
        hydrateCharacter(normalizedCharacter);
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
    setRunSummaryData,
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

  const handleChangeAuthForm = (nextForm: AuthFormState) => {
    setAuthForm(nextForm);
    setAuthFieldErrors({});
  };

  const handleAuth = async (): Promise<void> => {
    setErrorMessage(null);
    setAuthFieldErrors({});

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
      const requestError = error as ApiRequestError;
      setAuthFieldErrors((requestError.fieldErrors as AuthFieldErrors | undefined) ?? {});
      setErrorMessage(error instanceof Error ? resolveAuthErrorMessage(requestError) : "Authentication failed.");
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
      hydrateCharacter(normalizedCharacter);
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
    setRunSummaryData(null);
    setStatusMessage("");
    setErrorMessage(null);
  };

  const handleSummaryKeepFarming = (): void => {
    if (!character) {
      setRunSummaryData(null);
      setHubTab("maps");
      setScreenMode("hub");
      setStatusMessage("");
      return;
    }

    setRunSummaryData(null);
    startMapRun(selectedMapTarget, character);
  };

  const handleSummaryReturnToHub = (): void => {
    setRunSummaryData(null);
    setScreenMode("hub");
    setStatusMessage("");
  };

  const renderInlineFeedback = (showStatusMessage = true) => {
    return (
      <InlineFeedbackPanel
        statusMessage={statusMessage}
        errorMessage={errorMessage}
        showStatusMessage={showStatusMessage}
      />
    );
  };
  const renderAuthPanel = () => (
    <AuthScreen
      feedback={renderInlineFeedback(false)}
      authMode={authMode}
      authForm={authForm}
      authFieldErrors={authFieldErrors}
      onChangeAuthForm={handleChangeAuthForm}
      onSubmit={() => void handleAuth()}
      onToggleMode={() => {
        setAuthMode((current) => (current === "register" ? "login" : "register"));
        setAuthFieldErrors({});
        setErrorMessage(null);
      }}
    />
  );

  const renderCharacterCreation = () => (
    <CharacterCreationScreen
      feedback={renderInlineFeedback(true)}
      characterName={characterName}
      characterStats={characterStats}
      remainingStatPoints={remainingStatPoints}
      onChangeCharacterName={setCharacterName}
      onUpdateStat={updateStat}
      onCreateCharacter={() => void handleCharacterCreation()}
    />
  );

  const renderHub = () => (
    <>
      <div className="content mobile-only-feedback">{renderInlineFeedback(false)}</div>
      <HubScreen
        accountEmail={accountEmail}
        arenaSnapshot={arenaSnapshot ? { player: arenaSnapshot.player } : null}
        character={character}
        hubTab={hubTab}
        overlayPanel={overlayPanel}
        queuedMapCount={queuedMapIds.length}
        recentLoot={recentLoot}
        selectedEquipmentSlot={selectedEquipmentSlot}
        selectedMapEntry={selectedMapEntry}
        selectedMapEnhancements={selectedMapEnhancements}
        selectedMapId={selectedMapId}
        selectedMapTarget={selectedMapTarget}
        selectedSupportSlot={selectedSupportSlot}
        shopItems={shopItems}
        onBuyShopItem={handleBuyShopItem}
        onCloseOverlay={() => setOverlayPanel(null)}
        onConvertShardsToMaps={handleConvertShardsToMaps}
        onCraftMapAtTier={handleCraftMapAtTier}
        onEnhanceSelectedMap={handleEnhanceSelectedMap}
        onEquipItem={handleEquipItem}
        onLogout={handleLogout}
        onOpenEquipmentPicker={() => setOverlayPanel("equipmentPicker")}
        onOpenMainSpellPicker={() => setOverlayPanel("mainSpellPicker")}
        onOpenSupportPicker={(slotIndex) => {
          setSelectedSupportSlot(slotIndex);
          setOverlayPanel("supportPicker");
        }}
        onRefreshShop={handleRefreshShop}
        onRunAllMaps={handleRunAllMaps}
        onSave={() => void handleManualSave()}
        onSelectEquipmentSlot={setSelectedEquipmentSlot}
        onSelectHubTab={setHubTab}
        onSelectMainSpell={handleSelectMainSpell}
        onSelectMap={setSelectedMapTarget}
        onSelectSupportSpell={handleSelectSupportSpell}
        onStartBossTier={handleStartBossTier}
        onSellAllItems={handleSellAllItems}
        onSellItem={handleSellItem}
        onSpendStatPoint={handleSpendStatPoint}
        onStartMap={handleStartMap}
        onUpgradeSpell={handleUpgradeSpell}
        onUseLifeFlask={handleUseLifeFlask}
      />
    </>
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
          feedback={renderInlineFeedback(false)}
          onManualSave={handleManualSave}
          onUseLifeFlask={handleUseLifeFlask}
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
          <h1>Shardborne</h1>
          {statusMessage ? <p className="status-text">{statusMessage}</p> : null}
          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        </section>
      </aside>
      {screenMode === "auth" ? renderAuthPanel() : null}
      {screenMode === "character" ? renderCharacterCreation() : null}
      {screenMode === "hub" ? renderHub() : null}
      {screenMode === "arena" ? renderArena() : null}
      {screenMode === "runSummary" && runSummaryData ? (
        <RunSummaryScreen
          summaryData={runSummaryData}
          onKeepFarming={handleSummaryKeepFarming}
          onReturnToHub={handleSummaryReturnToHub}
        />
      ) : null}
    </div>
  );
};


