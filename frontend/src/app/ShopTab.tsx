import type { ReactNode } from "react";
import {
  getComparisonEquippedItem,
  getItemPowerScore,
  getPowerChangeForCharacterItem,
  isUpgradeForCharacter
} from "../game/domain/items/itemPower";
import { getItemStatLines } from "../game/domain/items/itemStats";
import { getItemSlotLabel } from "../game/config/itemConfig";
import { balanceConfig } from "../game/config/balanceConfig";
import type { CharacterRecord, InventoryItem } from "../shared/types/saveTypes";

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
        const comparisonItem = character ? getComparisonEquippedItem(character, item) : null;
        const powerChange = character ? getPowerChangeForCharacterItem(character, item) : null;

        return (
          <div key={item.id} className={`loot-entry rarity-card rarity-${item.rarity.toLowerCase()}`}>
            <div className="inventory-row">
              <strong>{item.name}</strong>
              <span>{item.price} gold</span>
            </div>
            <div className="status-text">Power {getItemPowerScore(item).toFixed(0)}</div>
            {character ? <div className="status-text">{formatPowerChange(powerChange)}</div> : null}
            {comparisonItem ? (
              <div className="status-text">
                Compared to equipped {getItemSlotLabel(comparisonItem.slot ?? item.slot ?? "Weapon").toLowerCase()}:{" "}
                {comparisonItem.name}
              </div>
            ) : item.slot ? (
              <div className="status-text">No equipped {getItemSlotLabel(item.slot).toLowerCase()} yet.</div>
            ) : null}
            {getItemStatLines(item).map((line) => (
              <div key={`${item.id}-${line}`} className="status-text">
                {line}
              </div>
            ))}
            <button className="secondary-button" onClick={() => onBuyShopItem(item.id)}>
              Buy
            </button>
            {character && isUpgradeForCharacter(character, item) ? (
              <div className="upgrade-text">Possible upgrade</div>
            ) : null}
          </div>
        );
      })}
      <button className="secondary-button" onClick={onRefreshShop}>
        Refresh shop ({balanceConfig.economy.shopRefreshGoldCost} gold)
      </button>
    </section>
  </div>
);
