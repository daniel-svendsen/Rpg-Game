import type { ReactNode } from "react";
import {
  getItemPowerScore,
  getPowerChangeForCharacterItem
} from "../game/domain/items/itemPower";
import { getItemStatEntries } from "../game/domain/items/itemStats";
import { balanceConfig } from "../game/config/balanceConfig";
import type { CharacterRecord, InventoryItem } from "../shared/types/saveTypes";
import { ItemSlotIcon } from "./ItemSlotIcon";

type ShopItemState = InventoryItem & { price: number };

interface ShopTabProps {
  topBar: ReactNode;
  character: CharacterRecord | null;
  shopItems: ShopItemState[];
  sellAllValue: number;
  formatPowerChange: (powerChange: number | null) => string;
  onBuyShopItem: (itemId: string) => void;
  onSellAllItems: () => void;
  onRefreshShop: () => void;
}

export const ShopTab = ({
  topBar,
  character,
  shopItems,
  sellAllValue,
  formatPowerChange,
  onBuyShopItem,
  onSellAllItems,
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
