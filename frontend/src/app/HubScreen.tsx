import { HealthHud } from "./HealthHud";
import { HubBottomTabs } from "./HubBottomTabs";
import { HubOverlayPanel } from "./HubOverlayPanel";
import { HubTopBar } from "./HubTopBar";
import { EquipmentTab } from "./EquipmentTab";
import { InventoryTab } from "./InventoryTab";
import { MapsTab } from "./MapsTab";
import { ShopTab } from "./ShopTab";
import { SpellsTab } from "./SpellsTab";
import { CharacterTab } from "./CharacterTab";
import {
  equipmentSlots,
  formatPowerChange,
  getEquippedPowerTotal,
  getItemSellPrice,
  getSpellAccentClassName,
  getSupportAccentClassName,
  type ShopItemState
} from "./appUiHelpers";
import { getSpellDetailLines } from "./spellDetails";
import {
  getCurrencyAmount,
  getMapDisplayName,
  getMapEnhancementDetailLines,
  getMapVariantLabel
} from "./mapFlow";
import { balanceConfig } from "../game/config/balanceConfig";
import { canUseLifeFlask } from "../game/domain/player/lifeFlask";
import {
  canUpgradeSpell,
  getSpellLevel,
  getSpellUpgradeGoldCost,
  getSpellUpgradeShardCost,
  getSpellUpgradeTierRequirement
} from "../game/domain/spells/spellProgression";
import type {
  CharacterRecord,
  EquipmentSlot,
  LootEntry,
  MapEnhancementInstance,
  OwnedMapStack
} from "../shared/types/saveTypes";
import type { HubTab, OverlayPanel, SelectedMapTarget } from "./appTypes";

interface HubScreenProps {
  accountEmail: string;
  arenaSnapshot: { player: CharacterRecord } | null;
  character: CharacterRecord | null;
  hubTab: HubTab;
  overlayPanel: OverlayPanel;
  queuedMapCount: number;
  recentLoot: LootEntry[];
  selectedEquipmentSlot: EquipmentSlot;
  selectedMapEntry: OwnedMapStack | null;
  selectedMapEnhancements: MapEnhancementInstance[];
  selectedMapId: string;
  selectedMapTarget: SelectedMapTarget;
  selectedSupportSlot: 0 | 1;
  shopItems: ShopItemState[];
  onBuyShopItem: (itemId: string) => void;
  onCloseOverlay: () => void;
  onConvertShardsToMaps: () => void;
  onEnhanceSelectedMap: () => void;
  onEquipItem: (itemId: string, targetSlotOverride?: EquipmentSlot) => void;
  onLogout: () => void;
  onOpenEquipmentPicker: () => void;
  onOpenMainSpellPicker: () => void;
  onOpenSupportPicker: (slotIndex: 0 | 1) => void;
  onRefreshShop: () => void;
  onRunAllMaps: () => void;
  onSave: () => void;
  onSelectEquipmentSlot: (slot: EquipmentSlot) => void;
  onSelectHubTab: (tab: HubTab) => void;
  onSelectMainSpell: (spellId: string) => void;
  onSelectMap: (target: SelectedMapTarget) => void;
  onSelectSupportSpell: (supportSpellId: string) => void;
  onSellAllItems: () => void;
  onSellItem: (itemId: string) => void;
  onSpendStatPoint: (statKey: keyof CharacterRecord["baseStats"]) => void;
  onStartMap: () => void;
  onUpgradeSpell: (spellId: string) => void;
  onUseLifeFlask: () => void;
}

export const HubScreen = ({
  accountEmail,
  arenaSnapshot,
  character,
  hubTab,
  overlayPanel,
  queuedMapCount,
  recentLoot,
  selectedEquipmentSlot,
  selectedMapEntry,
  selectedMapEnhancements,
  selectedMapId,
  selectedMapTarget,
  selectedSupportSlot,
  shopItems,
  onBuyShopItem,
  onCloseOverlay,
  onConvertShardsToMaps,
  onEnhanceSelectedMap,
  onEquipItem,
  onLogout,
  onOpenEquipmentPicker,
  onOpenMainSpellPicker,
  onOpenSupportPicker,
  onRefreshShop,
  onRunAllMaps,
  onSave,
  onSelectEquipmentSlot,
  onSelectHubTab,
  onSelectMainSpell,
  onSelectMap,
  onSelectSupportSpell,
  onSellAllItems,
  onSellItem,
  onSpendStatPoint,
  onStartMap,
  onUpgradeSpell,
  onUseLifeFlask
}: HubScreenProps) => {
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
            onClick={() => onUpgradeSpell(spellId)}
            type="button"
          >
            {isMaxLevel ? "Maxed" : "Upgrade"}
          </button>
        </div>
      </div>
    );
  };

  const topBar = (
    <HubTopBar
      characterName={character?.name}
      level={character?.level}
      gold={character?.gold}
      totalPower={character ? getEquippedPowerTotal(character) : undefined}
      onSave={onSave}
    />
  );
  const displayedCharacter = arenaSnapshot?.player ?? character;
  const healthHud = (
    <HealthHud
      character={displayedCharacter}
      canUseLifeFlask={character ? canUseLifeFlask(displayedCharacter ?? character) : false}
      onUseLifeFlask={onUseLifeFlask}
    />
  );

  return (
    <div className="hub-shell">
      {hubTab === "maps" ? (
        <MapsTab
          topBar={topBar}
          healthHud={healthHud}
          character={character}
          selectedMapTarget={selectedMapTarget}
          selectedMapId={selectedMapId}
          selectedMapEntry={selectedMapEntry}
          selectedMapEnhancements={selectedMapEnhancements}
          queuedMapCount={queuedMapCount}
          mapShardAmount={character ? getCurrencyAmount(character, "mapShard") : 0}
          getMapDisplayName={getMapDisplayName}
          getMapVariantLabel={getMapVariantLabel}
          getMapEnhancementDetailLines={getMapEnhancementDetailLines}
          onStartMap={onStartMap}
          onRunAllMaps={onRunAllMaps}
          onEnhanceSelectedMap={onEnhanceSelectedMap}
          onSelectMap={onSelectMap}
          onConvertShardsToMaps={onConvertShardsToMaps}
        />
      ) : null}
      {hubTab === "equipment" ? (
        <EquipmentTab
          topBar={topBar}
          character={character}
          equipmentSlots={equipmentSlots}
          onSelectEquipmentSlot={onSelectEquipmentSlot}
          onOpenEquipmentPicker={onOpenEquipmentPicker}
        />
      ) : null}
      {hubTab === "spells" ? (
        <SpellsTab
          topBar={topBar}
          character={character}
          getSpellAccentClassName={getSpellAccentClassName}
          getSupportAccentClassName={getSupportAccentClassName}
          getSpellDetailLines={(spellId, supportSpellIds) => getSpellDetailLines(character, spellId, supportSpellIds)}
          renderSpellUpgradeActions={renderSpellUpgradeActions}
          onOpenMainSpellPicker={onOpenMainSpellPicker}
          onOpenSupportPicker={onOpenSupportPicker}
        />
      ) : null}
      {hubTab === "inventory" ? (
        <InventoryTab
          topBar={topBar}
          character={character}
          recentLoot={recentLoot}
          getItemSellPrice={getItemSellPrice}
          onSellItem={onSellItem}
          onEquipItem={onEquipItem}
          onSelectEquipmentSlot={onSelectEquipmentSlot}
        />
      ) : null}
      {hubTab === "shop" ? (
        <ShopTab
          topBar={topBar}
          character={character}
          shopItems={shopItems}
          formatPowerChange={formatPowerChange}
          onBuyShopItem={onBuyShopItem}
          onSellAllItems={onSellAllItems}
          onRefreshShop={onRefreshShop}
        />
      ) : null}
      {hubTab === "character" ? (
        <CharacterTab
          topBar={topBar}
          healthHud={healthHud}
          accountEmail={accountEmail}
          character={character}
          onLogout={onLogout}
          onSpendStatPoint={onSpendStatPoint}
        />
      ) : null}
      <HubBottomTabs activeTab={hubTab} onSelectTab={onSelectHubTab} />
      <HubOverlayPanel
        character={character}
        overlayPanel={overlayPanel}
        selectedEquipmentSlot={selectedEquipmentSlot}
        selectedSupportSlot={selectedSupportSlot}
        getSpellAccentClassName={getSpellAccentClassName}
        getSupportAccentClassName={getSupportAccentClassName}
        formatPowerChange={formatPowerChange}
        getSpellDetailLines={(spellId, supportSpellIds) => getSpellDetailLines(character, spellId, supportSpellIds)}
        renderSpellUpgradeActions={renderSpellUpgradeActions}
        onClose={onCloseOverlay}
        onEquipItem={onEquipItem}
        onSelectMainSpell={onSelectMainSpell}
        onSelectSupportSpell={onSelectSupportSpell}
      />
    </div>
  );
};
