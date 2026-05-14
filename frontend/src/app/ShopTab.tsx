import type { Dispatch, ReactNode, SetStateAction } from "react";
import { balanceConfig } from "../game/config/balanceConfig";
import type { AutoSellRarity, AutoSellSettings, CharacterRecord, InventoryItem } from "../shared/types/saveTypes";
import { ItemSlotIcon } from "./ItemSlotIcon";
import { ItemStatBlock } from "./ItemStatBlock";
import { useItemComparison } from "./useItemComparison";
import { summarizeComparison } from "./itemComparison";
import { toChipModel } from "./comparisonChipUi";
import { rarityCardClassName } from "./appUiHelpers";

type ShopItemState = InventoryItem & { price: number };

interface ShopTabProps {
  topBar: ReactNode;
  character: CharacterRecord | null;
  shopItems: ShopItemState[];
  autoSellSettings: AutoSellSettings;
  sellAllValue: number;
  sellValueByRarity: Record<AutoSellRarity, number>;
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
  onBuyShopItem,
  onSellAllItems,
  onSellItemsByRarity,
  onSetAutoSellSettings,
  onRefreshShop
}: ShopTabProps) => {
  const getComparison = useItemComparison(character);

  return (
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
        const summary = summarizeComparison(character, item);
        const chipModel = toChipModel(summary);
        const canAfford = (character?.gold ?? 0) >= item.price;

        return (
          <div key={item.id} className={`loot-entry ${rarityCardClassName(item.rarity)}`}>
            <div className="inventory-row">
              <div className="item-name-row">
                {item.slot ? <ItemSlotIcon slot={item.slot} /> : null}
                <strong>{item.name}</strong>
              </div>
              <span className={canAfford ? "shop-price--affordable" : "shop-price--unaffordable"}>{item.price}g</span>
            </div>
            {chipModel ? (
              <div className="delta-chip-row">
                <span className={`delta-chip ${chipModel.damageClass}`}>
                  Damage {chipModel.damageText}
                </span>
                <span className={`delta-chip ${chipModel.survivalClass}`}>
                  Survival {chipModel.survivalText}
                </span>
              </div>
            ) : null}
            <ItemStatBlock item={item} comparison={getComparison(item)} />
            {item.uniqueEffectDescription ? (
              <div className="unique-effect-line">{item.uniqueEffectDescription}</div>
            ) : null}
            {summary && (summary.damagePercentDelta > 0 || summary.survivalPercentDelta > 0) ? (
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
};
