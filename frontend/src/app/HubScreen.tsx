import type { Dispatch, SetStateAction } from "react";
import { HubBottomTabs } from "./HubBottomTabs";
import { HubOverlayPanel } from "./HubOverlayPanel";
import { HubTopBar } from "./HubTopBar";
import { BossTab } from "./BossTab";
import { CraftTab } from "./CraftTab";
import { GearTab } from "./GearTab";
import { MapsTab } from "./MapsTab";
import { ShopTab } from "./ShopTab";
import { SpellsTab } from "./SpellsTab";
import { AccountTab } from "./AccountTab";
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
  onSwitchCharacter: () => void;
  onDeleteCharacter: () => Promise<void>;
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
  onSellUniqueItems: () => void;
  onSellItem: (itemId: string) => void;
  onApplyCraftingOrb: (itemId: string, orbCode: string) => void;
  onCombineOrbs: (outputCode: string) => void;
  onSpendStatPoint: (statKey: keyof CharacterRecord["baseStats"]) => void;
  onStartMap: () => void;
  onUpgradeSpell: (spellId: string) => void;
  onUpgradeSupport: (supportSpellId: string) => void;
  onUseLifeFlask: () => void;
}

export const HubScreen = ({
  accountEmail,
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
  onSwitchCharacter,
  onDeleteCharacter,
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
  onSellUniqueItems,
  onSellItem,
  onApplyCraftingOrb,
  onCombineOrbs,
  onSpendStatPoint,
  onStartMap,
  onUpgradeSpell,
  onUpgradeSupport
}: HubScreenProps) => {
  const totalBossKeys = character
    ? character.mapProgress.consumableMaps
        .filter((e) => e.mapId.startsWith("bossTier"))
        .reduce((sum, e) => sum + e.quantity, 0)
    : undefined;

  const topBar = (
    <HubTopBar
      level={character?.level}
      skillPoints={character?.unspentStatPoints}
      gold={character?.gold}
      mapShards={character ? getCurrencyAmount(character, "mapShard") : undefined}
      gemcuttersPrisms={character ? getCurrencyAmount(character, "gemcuttersPrism") : undefined}
      bossKeys={totalBossKeys}
      onSave={onSave}
    />
  );
  const sellAllValue = character ? character.inventory.reduce((total, item) => total + getItemSellPrice(item), 0) : 0;
  const sellValueByRarity = {
    Normal: character ? character.inventory.filter((item) => item.rarity === "Normal").reduce((total, item) => total + getItemSellPrice(item), 0) : 0,
    Magic: character ? character.inventory.filter((item) => item.rarity === "Magic").reduce((total, item) => total + getItemSellPrice(item), 0) : 0,
    Rare: character ? character.inventory.filter((item) => item.rarity === "Rare").reduce((total, item) => total + getItemSellPrice(item), 0) : 0
  };
  const sellUniqueValue = character ? character.inventory.filter((item) => item.rarity === "Unique").reduce((total, item) => total + getItemSellPrice(item), 0) : 0;

  return (
    <div className="hub-shell">
      {hubTab === "maps" ? (
        <MapsTab
          topBar={topBar}
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
        <BossTab topBar={topBar} character={character} onStartBossTier={onStartBossTier} />
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
      {hubTab === "craft" ? (
        <CraftTab
          topBar={topBar}
          character={character}
          onApplyCraftingOrb={onApplyCraftingOrb}
          onCombineOrbs={onCombineOrbs}
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
          sellUniqueValue={sellUniqueValue}
          onBuyShopItem={onBuyShopItem}
          onSellAllItems={onSellAllItems}
          onSellItemsByRarity={onSellItemsByRarity}
          onSellUniqueItems={onSellUniqueItems}
          onSetAutoSellSettings={onSetAutoSellSettings}
          onRefreshShop={onRefreshShop}
        />
      ) : null}
      {hubTab === "character" ? (
        <CharacterTab
          topBar={topBar}
          character={character}
          selectedMapId={selectedMapId}
          onSpendStatPoint={onSpendStatPoint}
        />
      ) : null}
      {hubTab === "account" ? (
        <AccountTab
          topBar={topBar}
          accountEmail={accountEmail}
          character={character}
          onLogout={onLogout}
          onSwitchCharacter={onSwitchCharacter}
          onDeleteCharacter={onDeleteCharacter}
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
