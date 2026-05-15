import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { loadCharactersWithAuthState, loadCharacterById, listCharacters, deleteCharacter } from "../api/gameApi";
import { AuthScreen } from "./AuthScreen";
import type { HubTab, OverlayPanel, RunBatchState, RunSummaryData, ScreenMode, SelectedMapTarget } from "./appTypes";
import { HubScreen } from "./HubScreen";
import { RunSummaryScreen } from "./RunSummaryScreen";
import { InlineFeedbackPanel } from "./InlineFeedbackPanel";
import { getItemSellPrice } from "./appUiHelpers";
import { resolveManualSaveCharacter } from "./characterPersistence";
import { getUnlockedTierSelection } from "./mapFlow";
import { CharacterCreationScreen } from "./CharacterCreationScreen";
import { CharacterSelectScreen } from "./CharacterSelectScreen";
import { useArenaSession } from "./useArenaSession";
import { useLoadoutActions } from "./useLoadoutActions";
import { useShopActions } from "./useShopActions";
import { useCharacterActions } from "./useCharacterActions";
import { useMapRunning } from "./useMapRunning";
import { useMapCrafting } from "./useMapCrafting";
import { useCrafting } from "./useCrafting";
import { useCharacterPersistence } from "./useCharacterPersistence";
import { useAutoSellSettings } from "./useAutoSellSettings";
import { useShopBootstrap } from "./useShopBootstrap";
import { useAutoMapSelection } from "./useAutoMapSelection";
import { useAuth } from "./useAuth";
import { useCharacterCreation } from "./useCharacterCreation";
import type { ArenaRuntimeState } from "../game/domain/combat/arenaSimulation";
import { getOwnedMapStack } from "../game/domain/maps/mapProgress";
import { normalizeCharacterRecord } from "../game/domain/player/playerTypes";
import type {
  ArenaSnapshot,
  CharacterSummary,
  EquipmentSlot,
  LootEntry,
  MapEnhancementInstance
} from "../shared/types/saveTypes";

const ArenaScreen = lazy(() => import("./ArenaScreen"));

export const App = () => {
  const [screenMode, setScreenMode] = useState<ScreenMode>("auth");
  const [hubTab, setHubTab] = useState<HubTab>("maps");
  const [overlayPanel, setOverlayPanel] = useState<OverlayPanel>(null);
  const {
    token,
    setToken,
    accountEmail,
    authMode,
    authForm,
    authFieldErrors,
    changeAuthForm,
    toggleAuthMode,
    submitAuth,
    clearSession
  } = useAuth();
  const [characterList, setCharacterList] = useState<CharacterSummary[]>([]);
  const [arenaSnapshot, setArenaSnapshot] = useState<ArenaSnapshot | null>(null);
  const [activeMapId, setActiveMapId] = useState<string | null>(null);
  const [activeMapEnhancements, setActiveMapEnhancements] = useState<MapEnhancementInstance[]>([]);
  const [activeMapRunId, setActiveMapRunId] = useState(0);
  const [activeRunBatch, setActiveRunBatch] = useState<RunBatchState | null>(null);
  const [selectedMapTarget, setSelectedMapTarget] = useState<SelectedMapTarget>("trainingGrounds");
  const [recentLoot, setRecentLoot] = useState<LootEntry[]>([]);
  const { shopItems, setShopItems, resetShopForTier } = useShopBootstrap();
  const [queuedMapIds, setQueuedMapIds] = useState<string[]>([]);
  const [selectedEquipmentSlot, setSelectedEquipmentSlot] = useState<EquipmentSlot>("Weapon");
  const [selectedSupportSlot, setSelectedSupportSlot] = useState<0 | 1>(0);
  const [selectedPassiveSlot, setSelectedPassiveSlot] = useState<0 | 1 | 2>(0);
  const [autoSellSettings, setAutoSellSettings] = useAutoSellSettings();
  const [runSummaryData, setRunSummaryData] = useState<RunSummaryData | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const arenaRuntimeRef = useRef<ArenaRuntimeState | null>(null);
  const { character, latestCharacterRef, commitCharacter, hydrateCharacter, persistCharacterNow, saveCharacterManually } =
    useCharacterPersistence({
      token,
      isAutosaveEnabled: screenMode === "arena" || screenMode === "hub",
      onAutosaveError: setErrorMessage
    });

  const {
    characterName,
    setCharacterName,
    characterStats,
    updateStat,
    remainingStatPoints,
    handleCharacterCreation
  } = useCharacterCreation({
    token,
    hydrateCharacter,
    setScreenMode,
    resetShopForTier,
    setStatusMessage,
    setErrorMessage
  });

  const selectedMapEntry =
    character && selectedMapTarget !== "trainingGrounds" && getUnlockedTierSelection(selectedMapTarget) === null
      ? getOwnedMapStack(character.mapProgress, selectedMapTarget)
      : null;
  const selectedUnlockedTier = getUnlockedTierSelection(selectedMapTarget);
  const selectedMapId = selectedMapEntry?.mapId ?? (selectedUnlockedTier ? `tier${selectedUnlockedTier}Map` : "trainingGrounds");
  const selectedMapEnhancements = selectedMapEntry?.enhancements ?? [];
  const {
    startMapRun,
    handleStartMap,
    handleRunAllMaps,
    handleStartBossTier
  } = useMapRunning({
    character,
    selectedMapTarget,
    commitCharacter,
    setQueuedMapIds,
    setActiveMapId,
    setActiveMapEnhancements,
    setActiveMapRunId,
    setActiveRunBatch,
    setArenaSnapshot,
    setSelectedMapTarget,
    setScreenMode,
    setStatusMessage,
    setErrorMessage
  });
  const {
    handleEnhanceSelectedMap,
    handleCraftMapAtTier,
    handleConvertShardsToMaps
  } = useMapCrafting({
    character,
    selectedMapTarget,
    commitCharacter,
    persistCharacterNow,
    setSelectedMapTarget,
    setStatusMessage,
    setErrorMessage
  });
  const { handleApplyCraftingOrb, handleCombineOrbs } = useCrafting({
    character,
    commitCharacter,
    persistCharacterNow,
    setStatusMessage,
    setErrorMessage
  });
  const {
    handleEquipItem,
    handleSelectMainSpell,
    handleSelectSupportSpell,
    handleSelectPassiveSupport,
    handleUpgradeSpell,
    handleUpgradeSupport
  } = useLoadoutActions({
    character,
    selectedSupportSlot,
    selectedPassiveSlot,
    commitCharacter,
    setOverlayPanel,
    setStatusMessage,
    setErrorMessage
  });
  const {
    handleBuyShopItem,
    handleRefreshShop,
    handleSellItem,
    handleSellAllItems,
    handleSellItemsByRarity,
    handleSellUniqueItems
  } = useShopActions({
    character,
    commitCharacter,
    shopItems,
    setShopItems,
    resetShopForTier,
    setStatusMessage,
    setErrorMessage,
    getItemSellPrice
  });
  const { handleSpendStatPoint, handleUseLifeFlask } = useCharacterActions({
    character,
    screenMode,
    arenaRuntimeRef,
    latestCharacterRef,
    commitCharacter,
    setArenaSnapshot,
    setStatusMessage,
    setErrorMessage
  });

  useEffect(() => {
    if (!token) {
      setScreenMode("auth");
      return;
    }

    void (async () => {
      const result = await loadCharactersWithAuthState(token);

      if (result.isUnauthorized) {
        setToken(null);
        setScreenMode("auth");
        setStatusMessage("Session expired. Please log in again.");
        return;
      }

      const characters = result.characters ?? [];
      setCharacterList(characters);

      if (characters.length === 0) {
        setScreenMode("character");
        setStatusMessage("No character found yet. Create one to begin.");
      } else {
        setScreenMode("characterSelect");
        setStatusMessage("");
      }
    })();
  }, [token]);

  useArenaSession({
    screenMode,
    character,
    activeMapId,
    activeMapEnhancements,
    activeMapRunId,
    activeRunBatch,
    autoSellSettings,
    arenaRuntimeRef,
    queuedMapIds,
    commitCharacter,
    persistCharacterNow,
    setRecentLoot,
    setArenaSnapshot,
    setQueuedMapIds,
    setActiveMapId,
    setActiveMapEnhancements,
    setActiveMapRunId,
    setActiveRunBatch,
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

  useAutoMapSelection({ character, selectedMapTarget, selectedMapId, setSelectedMapTarget });

  const handleAuth = async (): Promise<void> => {
    setErrorMessage(null);
    const result = await submitAuth();

    if (result.status === "success") {
      setStatusMessage(result.message);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleManualSave = async (): Promise<void> => {
    const characterToSave = resolveManualSaveCharacter({
      screenMode,
      character,
      latestCharacter: latestCharacterRef.current,
      arenaCharacter: arenaRuntimeRef.current?.snapshot.player ?? null
    });

    if (!characterToSave) {
      return;
    }

    try {
      await saveCharacterManually(characterToSave);
      setStatusMessage("Progress saved.");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Save failed.");
    }
  };

  const handleSelectCharacter = async (id: number): Promise<void> => {
    if (!token) return;
    try {
      const loaded = await loadCharacterById(id, token);
      const normalized = normalizeCharacterRecord(loaded);
      hydrateCharacter(normalized);
      resetShopForTier(normalized.mapProgress.highestUnlockedTier + 1);
      setScreenMode("hub");
      setStatusMessage("");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load character.");
    }
  };

  const handleSwitchCharacter = async (): Promise<void> => {
    if (!token) return;
    commitCharacter(null);
    setArenaSnapshot(null);
    setActiveMapId(null);
    setActiveMapEnhancements([]);
    setActiveRunBatch(null);
    setShopItems([]);
    setOverlayPanel(null);
    setHubTab("maps");
    setRunSummaryData(null);
    setStatusMessage("");
    setErrorMessage(null);
    try {
      const characters = await listCharacters(token);
      setCharacterList(characters);
    } catch {
      setCharacterList([]);
    }
    setScreenMode("characterSelect");
  };

  const handleDeleteCharacter = async (): Promise<void> => {
    if (!token || !character?.id) return;
    try {
      await deleteCharacter(character.id, token);
      await handleSwitchCharacter();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  const handleDeleteCharacterById = async (id: number): Promise<void> => {
    if (!token) return;
    await deleteCharacter(id, token);
    setCharacterList((prev) => prev.filter((c) => c.id !== id));
  };

  const handleLogout = (): void => {
    clearSession();
    commitCharacter(null);
    setArenaSnapshot(null);
    setActiveMapId(null);
    setActiveMapEnhancements([]);
    setActiveRunBatch(null);
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
      setActiveRunBatch(null);
      setHubTab("maps");
      setScreenMode("hub");
      setStatusMessage("");
      return;
    }

    setRunSummaryData(null);
    setActiveRunBatch(null);
    startMapRun(selectedMapTarget, character);
  };

  const handleSummaryReturnToHub = (): void => {
    setRunSummaryData(null);
    setActiveRunBatch(null);
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
      onChangeAuthForm={changeAuthForm}
      onSubmit={() => void handleAuth()}
      onToggleMode={() => {
        toggleAuthMode();
        setErrorMessage(null);
      }}
    />
  );

  const renderCharacterSelect = () => (
    <CharacterSelectScreen
      feedback={renderInlineFeedback(false)}
      characters={characterList}
      onSelectCharacter={(id) => void handleSelectCharacter(id)}
      onCreateNew={() => setScreenMode("character")}
      onDeleteCharacter={handleDeleteCharacterById}
    />
  );

  const renderCharacterCreation = () => (
    <CharacterCreationScreen
      feedback={renderInlineFeedback(true)}
      characterName={characterName}
      characterStats={characterStats}
      remainingStatPoints={remainingStatPoints}
      canGoBack={characterList.length > 0}
      onChangeCharacterName={setCharacterName}
      onUpdateStat={updateStat}
      onCreateCharacter={() => void handleCharacterCreation()}
      onBack={() => setScreenMode("characterSelect")}
    />
  );

  const renderHub = () => (
    <>
      {errorMessage ? <div className="content mobile-only-feedback">{renderInlineFeedback(false)}</div> : null}
      <HubScreen
        accountEmail={accountEmail}
        arenaSnapshot={arenaSnapshot ? { player: arenaSnapshot.player } : null}
        character={character}
        hubTab={hubTab}
        overlayPanel={overlayPanel}
        queuedMapCount={queuedMapIds.length}
        autoSellSettings={autoSellSettings}
        selectedEquipmentSlot={selectedEquipmentSlot}
        selectedMapEntry={selectedMapEntry}
        selectedMapEnhancements={selectedMapEnhancements}
        selectedMapId={selectedMapId}
        selectedMapTarget={selectedMapTarget}
        selectedSupportSlot={selectedSupportSlot}
        selectedPassiveSlot={selectedPassiveSlot}
        shopItems={shopItems}
        onBuyShopItem={handleBuyShopItem}
        onCloseOverlay={() => setOverlayPanel(null)}
        onConvertShardsToMaps={handleConvertShardsToMaps}
        onCraftMapAtTier={handleCraftMapAtTier}
        onEnhanceSelectedMap={handleEnhanceSelectedMap}
        onEquipItem={handleEquipItem}
        onLogout={handleLogout}
        onSwitchCharacter={() => void handleSwitchCharacter()}
        onDeleteCharacter={handleDeleteCharacter}
        onOpenEquipmentPicker={() => setOverlayPanel("equipmentPicker")}
        onOpenMainSpellPicker={() => setOverlayPanel("mainSpellPicker")}
        onOpenSupportPicker={(slotIndex) => {
          setSelectedSupportSlot(slotIndex);
          setOverlayPanel("supportPicker");
        }}
        onOpenPassivePicker={(slotIndex) => {
          setSelectedPassiveSlot(slotIndex);
          setOverlayPanel("passiveSupportPicker");
        }}
        onSelectPassiveSupport={handleSelectPassiveSupport}
        onRefreshShop={handleRefreshShop}
        onSetAutoSellSettings={setAutoSellSettings}
        onRunAllMaps={handleRunAllMaps}
        onSave={() => void handleManualSave()}
        onSelectEquipmentSlot={setSelectedEquipmentSlot}
        onSelectHubTab={setHubTab}
        onSelectMainSpell={handleSelectMainSpell}
        onSelectMap={setSelectedMapTarget}
        onSelectSupportSpell={handleSelectSupportSpell}
        onStartBossTier={handleStartBossTier}
        onSellAllItems={handleSellAllItems}
        onSellItemsByRarity={handleSellItemsByRarity}
        onSellUniqueItems={handleSellUniqueItems}
        onSellItem={handleSellItem}
        onApplyCraftingOrb={handleApplyCraftingOrb}
        onCombineOrbs={handleCombineOrbs}
        onSpendStatPoint={handleSpendStatPoint}
        onStartMap={handleStartMap}
        onUpgradeSpell={handleUpgradeSpell}
        onUpgradeSupport={handleUpgradeSupport}
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
            setActiveRunBatch(null);
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
      {screenMode === "characterSelect" ? renderCharacterSelect() : null}
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


