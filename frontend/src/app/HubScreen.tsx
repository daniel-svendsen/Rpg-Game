import type { Dispatch, SetStateAction } from "react";
import { HealthHud } from "./HealthHud";
import { HubBottomTabs } from "./HubBottomTabs";
import { HubOverlayPanel } from "./HubOverlayPanel";
import { HubTopBar } from "./HubTopBar";
import { BossTab } from "./BossTab";
import { GearTab } from "./GearTab";
import { MapsTab } from "./MapsTab";
import { ShopTab } from "./ShopTab";
import { SpellsTab } from "./SpellsTab";
import { CharacterTab } from "./CharacterTab";
import {
  equipmentSlots,
  getItemSellPrice,
  type ShopItemState
} from "./appUiHelpers";
import { getSpellDetailLines } from "./spellDetails";
import {
  getCurrencyAmount,
  getMapDisplayName,
  getMapVariantLabel
} from "./mapFlow";
import { canUseLifeFlask } from "../game/domain/player/lifeFlask";
import type {
  AutoSellRarity,
  AutoSellSettings,
  CharacterRecord,
  EquipmentSlot,
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
  autoSellSettings: AutoSellSettings;
  selectedEquipmentSlot: EquipmentSlot;
  selectedMapEntry: OwnedMapStack | null;
  selectedMapEnhancements: MapEnhancementInstance[];
  selectedMapId: string;
  selectedMapTarget: SelectedMapTarget;
  selectedSupportSlot: 0 | 1;
  selectedPassiveSlot: 0 | 1 | 2;
  shopItems: ShopItemState[];
  onStartBossTier: (tier: number) => void;
  onBuyShopItem: (itemId: string) => void;
  onCloseOverlay: () => void;
  onConvertShardsToMaps: () => void;
  onCraftMapAtTier: (tier: number) => void;
  onEnhanceSelectedMap: () => void;
  onEquipItem: (itemId: string, targetSlotOverride?: EquipmentSlot) => void;
  onLogout: () => void;
  onOpenEquipmentPicker: () => void;
  onOpenMainSpellPicker: () => void;
  onOpenSupportPicker: (slotIndex: 0 | 1) => void;
  onOpenPassivePicker: (slotIndex: 0 | 1 | 2) => void;
  onSelectPassiveSupport: (id: string) => void;
  onRefreshShop: () => void;
  onSetAutoSellSettings: Dispatch<SetStateAction<AutoSellSettings>>;
  onRunAllMaps: () => void;
  onSave: () => void;
  onSelectEquipmentSlot: (slot: EquipmentSlot) => void;
  onSelectHubTab: (tab: HubTab) => void;
  onSelectMainSpell: (spellId: string) => void;
  onSelectMap: (target: SelectedMapTarget) => void;
  onSelectSupportSpell: (supportSpellId: string) => void;
  onSellAllItems: () => void;
  onSellItemsByRarity: (rarity: AutoSellRarity) => void;
  onSellItem: (itemId: string) => void;
  onSpendStatPoint: (statKey: keyof CharacterRecord["baseStats"]) => void;
  onStartMap: () => void;
  onUpgradeSpell: (spellId: string) => void;
  onUpgradeSupport: (supportSpellId: string) => void;
  onUseLifeFlask: () => void;
}

export const HubScreen = ({
  accountEmail,
  arenaSnapshot,
  character,
  hubTab,
  overlayPanel,
  queuedMapCount,
  autoSellSettings,
  selectedEquipmentSlot,
  selectedMapEntry,
  selectedMapEnhancements,
  selectedMapId,
  selectedMapTarget,
  selectedSupportSlot,
  selectedPassiveSlot,
  shopItems,
  onBuyShopItem,
  onCloseOverlay,
  onConvertShardsToMaps,
  onCraftMapAtTier,
  onEnhanceSelectedMap,
  onEquipItem,
  onLogout,
  onOpenEquipmentPicker,
  onOpenMainSpellPicker,
  onOpenSupportPicker,
  onOpenPassivePicker,
  onSelectPassiveSupport,
  onRefreshShop,
  onSetAutoSellSettings,
  onRunAllMaps,
  onSave,
  onSelectEquipmentSlot,
  onSelectHubTab,
  onSelectMainSpell,
  onSelectMap,
  onSelectSupportSpell,
  onStartBossTier,
  onSellAllItems,
  onSellItemsByRarity,
  onSellItem,
  onSpendStatPoint,
  onStartMap,
  onUpgradeSpell,
  onUpgradeSupport,
  onUseLifeFlask
}: HubScreenProps) => {
  const totalBossKeys = character
    ? character.mapProgress.consumableMaps
        .filter((e) => e.mapId.startsWith("bossTier"))
        .reduce((sum, e) => sum + e.quantity, 0)
    : undefined;

  const topBar = (
    <HubTopBar
      level={character?.level}
      gold={character?.gold}
      mapShards={character ? getCurrencyAmount(character, "mapShard") : undefined}
      gemcuttersPrisms={character ? getCurrencyAmount(character, "gemcuttersPrism") : undefined}
      bossKeys={totalBossKeys}
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
  const sellAllValue = character ? character.inventory.reduce((total, item) => total + getItemSellPrice(item), 0) : 0;
  const sellValueByRarity = {
    Normal: character ? character.inventory.filter((item) => item.rarity === "Normal").reduce((total, item) => total + getItemSellPrice(item), 0) : 0,
    Magic: character ? character.inventory.filter((item) => item.rarity === "Magic").reduce((total, item) => total + getItemSellPrice(item), 0) : 0,
    Rare: character ? character.inventory.filter((item) => item.rarity === "Rare").reduce((total, item) => total + getItemSellPrice(item), 0) : 0
  };

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
          onStartMap={onStartMap}
          onRunAllMaps={onRunAllMaps}
          onEnhanceSelectedMap={onEnhanceSelectedMap}
          onSelectMap={onSelectMap}
          onConvertShardsToMaps={onConvertShardsToMaps}
          onCraftMapAtTier={onCraftMapAtTier}
        />
      ) : null}
      {hubTab === "boss" ? (
        <BossTab topBar={topBar} healthHud={healthHud} character={character} onStartBossTier={onStartBossTier} />
      ) : null}
      {hubTab === "equipment" ? (
        <GearTab
          topBar={topBar}
          character={character}
          equipmentSlots={equipmentSlots}
          getItemSellPrice={getItemSellPrice}
          onSellItem={onSellItem}
          onEquipItem={onEquipItem}
          onSelectEquipmentSlot={onSelectEquipmentSlot}
          onOpenEquipmentPicker={onOpenEquipmentPicker}
        />
      ) : null}
      {hubTab === "spells" ? (
        <SpellsTab
          topBar={topBar}
          character={character}
          getSpellDetailLines={(spellId, supportSpellIds) => getSpellDetailLines(character, spellId, supportSpellIds)}
          onOpenMainSpellPicker={onOpenMainSpellPicker}
          onOpenSupportPicker={onOpenSupportPicker}
          onOpenPassivePicker={onOpenPassivePicker}
          onUpgradeSpell={onUpgradeSpell}
          onUpgradeSupport={onUpgradeSupport}
        />
      ) : null}
      {hubTab === "shop" ? (
        <ShopTab
          topBar={topBar}
          character={character}
          shopItems={shopItems}
          autoSellSettings={autoSellSettings}
          sellAllValue={sellAllValue}
          sellValueByRarity={sellValueByRarity}
          onBuyShopItem={onBuyShopItem}
          onSellAllItems={onSellAllItems}
          onSellItemsByRarity={onSellItemsByRarity}
          onSetAutoSellSettings={onSetAutoSellSettings}
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
        selectedPassiveSlot={selectedPassiveSlot}
        getSpellDetailLines={(spellId, supportSpellIds) => getSpellDetailLines(character, spellId, supportSpellIds)}
        onClose={onCloseOverlay}
        onEquipItem={onEquipItem}
        onSelectMainSpell={onSelectMainSpell}
        onSelectSupportSpell={onSelectSupportSpell}
        onSelectPassiveSupport={onSelectPassiveSupport}
        onUpgradeSpell={onUpgradeSpell}
        onUpgradeSupport={onUpgradeSupport}
      />
    </div>
  );
};
