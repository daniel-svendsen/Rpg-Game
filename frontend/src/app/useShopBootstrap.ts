import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { createShopStock, toShopItemState, type ShopItemState } from "./appUiHelpers";

export interface UseShopBootstrapResult {
  shopItems: ShopItemState[];
  setShopItems: Dispatch<SetStateAction<ShopItemState[]>>;
  resetShopForTier: (tier: number) => void;
}

export const useShopBootstrap = (): UseShopBootstrapResult => {
  const [shopItems, setShopItems] = useState<ShopItemState[]>([]);

  const resetShopForTier = useCallback((tier: number) => {
    setShopItems(createShopStock(Math.max(1, tier)).map(toShopItemState));
  }, []);

  return { shopItems, setShopItems, resetShopForTier };
};
