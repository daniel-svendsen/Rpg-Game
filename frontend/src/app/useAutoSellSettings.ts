import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { AutoSellSettings } from "../shared/types/saveTypes";
import { autoSellSettingsStorageKey, defaultAutoSellSettings } from "./appUiHelpers";

const readStoredAutoSellSettings = (): AutoSellSettings => {
  const saved = localStorage.getItem(autoSellSettingsStorageKey);

  if (!saved) {
    return defaultAutoSellSettings;
  }

  try {
    return { ...defaultAutoSellSettings, ...JSON.parse(saved) };
  } catch {
    return defaultAutoSellSettings;
  }
};

export const useAutoSellSettings = (): [AutoSellSettings, Dispatch<SetStateAction<AutoSellSettings>>] => {
  const [autoSellSettings, setAutoSellSettings] = useState<AutoSellSettings>(readStoredAutoSellSettings);

  useEffect(() => {
    localStorage.setItem(autoSellSettingsStorageKey, JSON.stringify(autoSellSettings));
  }, [autoSellSettings]);

  return [autoSellSettings, setAutoSellSettings];
};
