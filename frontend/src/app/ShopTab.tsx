import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  getItemPowerScore,
  getPowerChangeForCharacterItem
} from "../game/domain/items/itemPower";
import { getItemStatEntries } from "../game/domain/items/itemStats";
import { balanceConfig } from "../game/config/balanceConfig";
import type { AutoSellRarity, AutoSellSettings, CharacterRecord, InventoryItem } from "../shared/types/saveTypes";
import { ItemSlotIcon } from "./ItemSlotIcon";

type ShopItemState = InventoryItem & { price: number };

interface ShopTabProps {
  topBar: ReactNode;
  character: CharacterRecord | null;
  shopItems: ShopItemState[];
  autoSellSettings: AutoSellSettings;
  sellAllValue: number;
  sellValueByRarity: Record<AutoSellRarity, number>;
  formatPowerChange: (powerChange: number | null) => string;
  onBuyShopItem: (itemId: string) => void;
  onSellAllItems: () => void;
  onSellItemsByRarity: (rarity: AutoSellRarity) => void;
  onSetAutoSellSettings: Dispatch<SetStateAction<AutoSellSettings>>;
  onRefreshShop: () => void;
}

export const ShopTab = ({
  topBar,
  character,
  shopItems,
  autoSellSettings,
  sellAllValue,
  sellValueByRarity,
  formatPowerChange,
  onBuyShopItem,
  onSellAllItems,
  onSellItemsByRarity,
  onSetAutoSellSettings,
  onRefreshShop
}: ShopTabProps) => (
  <div className="content stack mobile-content">
    {topBar}
    <section className="panel stack">
      <div className="inventory-row">
        <h4>Shop</h4>
        <button className="secondary-button" disabled={sellAllValue <= 0} onClick={onSellAllItems}>
          {sellAllValue > 0 ? `Sell all (+${sellAllValue}g)` : "Sell all"}
        </button>
      </div>
      <div className="shop-sell-actions">
        {(["Normal", "Magic", "Rare"] as const).map((rarity) => (
          <button
            key={`sell-${rarity}`}
            className="secondary-button shop-sell-actions__button"
            disabled={sellValueByRarity[rarity] <= 0}
            onClick={() => onSellItemsByRarity(rarity)}
            type="button"
          >
            {sellValueByRarity[rarity] > 0
              ? `Sell ${rarity} (+${sellValueByRarity[rarity]}g)`
              : `Sell ${rarity}`}
          </button>
        ))}
      </div>
      <section className="panel stack">
        <h4>Auto-sell</h4>
        <p className="status-text">Automatically sell picked up Normal, Magic, or Rare items. Unique items are never auto-sold.</p>
        {(["Normal", "Magic", "Rare"] as const).map((rarity) => (
          <label key={`auto-${rarity}`} className="inventory-row">
            <span>{`Auto-sell ${rarity}`}</span>
            <input
              checked={autoSellSettings[rarity]}
              onChange={(event) =>
                onSetAutoSellSettings((current) => ({
                  ...current,
                  [rarity]: event.target.checked
                }))
              }
              type="checkbox"
            />
          </label>
        ))}
      </section>
      {shopItems.map((item) => {
        const powerChange = character ? getPowerChangeForCharacterItem(character, item) : null;
        const canAfford = (character?.gold ?? 0) >= item.price;

        return (
          <div key={item.id} className={`loot-entry rarity-card rarity-${item.rarity.toLowerCase()}`}>
            <div className="inventory-row">
              <div className="item-name-row">
                {item.slot ? <ItemSlotIcon slot={item.slot} /> : null}
                <strong>{item.name}</strong>
              </div>
              <span className={canAfford ? "shop-price--affordable" : "shop-price--unaffordable"}>{item.price}g</span>
            </div>
            <div className="inventory-row">
              <div className="status-text">Power {getItemPowerScore(item).toFixed(0)}</div>
              {character ? <div className="status-text">{formatPowerChange(powerChange)}</div> : null}
            </div>
            {getItemStatEntries(item).filter((e) => e.isBase).map((entry) => (
              <div key={`${item.id}-${entry.label}`} className="stat-line">
                <span className="stat-label">{entry.label}</span>
                <span className="stat-value">{entry.formattedValue}</span>
              </div>
            ))}
            <div className="item-divider" />
            {getItemStatEntries(item).filter((e) => !e.isBase).map((entry) => (
              <div
                key={`${item.id}-${entry.label}`}
                className={`stat-line${entry.tier !== null ? ` stat-tier-${entry.tier}` : ""}`}
              >
                {entry.tier !== null && <span className="stat-tier-dot" />}
                <span className="stat-label">{entry.label}</span>
                <span className="stat-value">{entry.formattedValue}</span>
              </div>
            ))}
            {powerChange !== null && powerChange > 0 ? (
              <div className="upgrade-text">Possible upgrade</div>
            ) : null}
            <button className="secondary-button" disabled={!canAfford} onClick={() => onBuyShopItem(item.id)}>
              {canAfford ? "Buy" : "Not enough gold"}
            </button>
          </div>
        );
      })}
      <button className="secondary-button" onClick={onRefreshShop}>
        Refresh shop ({balanceConfig.economy.shopRefreshGoldCost} gold)
      </button>
    </section>
  </div>
);
