import { itemAffixPoolsBySlot } from "../../config/itemAffixConfig";
import { rollStatBonusValue } from "../items/itemGenerator";
import { pickWeighted } from "../loot/weightedTables";
import type { InventoryItem, ItemAffixInstance } from "../../../shared/types/saveTypes";
import type { CraftingOrbId } from "../../config/craftingConfig";

export type CraftingError =
  | "wrong_rarity"
  | "item_full"
  | "no_prefix"
  | "no_suffix"
  | "cannot_craft_unique"
  | "no_valid_slot";

export interface CraftingResult {
  ok: true;
  item: InventoryItem;
}

export interface CraftingFailure {
  ok: false;
  error: CraftingError;
  message: string;
}

const getAffixes = (item: InventoryItem): ItemAffixInstance[] => item.affixes ?? [];

const getPrefixCount = (item: InventoryItem): number =>
  getAffixes(item).filter((a) => a.kind === "Prefix").length;

const getSuffixCount = (item: InventoryItem): number =>
  getAffixes(item).filter((a) => a.kind === "Suffix").length;

const getMaxAffixCounts = (item: InventoryItem) => {
  if (item.rarity === "Rare") return { maxPrefixes: 3, maxSuffixes: 3 };
  if (item.rarity === "Magic") return { maxPrefixes: 1, maxSuffixes: 1 };
  return { maxPrefixes: 0, maxSuffixes: 0 };
};

const rollOneAffix = (item: InventoryItem): ItemAffixInstance | null => {
  if (!item.slot) return null;

  const slot = item.slot === "Ring1" || item.slot === "Ring2" ? "Ring" : item.slot;
  const pool = itemAffixPoolsBySlot[slot];
  if (!pool) return null;

  const existing = getAffixes(item);
  const usedIds = new Set(existing.map((a) => a.id));
  const { maxPrefixes, maxSuffixes } = getMaxAffixCounts(item);
  const prefixCount = getPrefixCount(item);
  const suffixCount = getSuffixCount(item);

  const availablePrefixes = pool.prefixes.filter(
    (e) => !usedIds.has(e.id) && prefixCount < maxPrefixes
  );
  const availableSuffixes = pool.suffixes.filter(
    (e) => !usedIds.has(e.id) && suffixCount < maxSuffixes
  );

  if (availablePrefixes.length === 0 && availableSuffixes.length === 0) return null;

  const pickKind =
    availablePrefixes.length > 0 && availableSuffixes.length > 0
      ? Math.random() < 0.5
        ? "Prefix"
        : "Suffix"
      : availablePrefixes.length > 0
        ? "Prefix"
        : "Suffix";

  const candidates = pickKind === "Prefix" ? availablePrefixes : availableSuffixes;
  const selected = pickWeighted(candidates.map((e) => ({ key: e, weight: e.weight })));
  if (!selected) return null;

  const value = rollStatBonusValue(item.tier, selected.statKey);
  return { id: selected.id, kind: pickKind, statKey: selected.statKey, value };
};

const applyAffixToItem = (item: InventoryItem, affix: ItemAffixInstance): InventoryItem => {
  const currentValue = (item.statBonuses as Record<string, number>)[affix.statKey] ?? 0;
  return {
    ...item,
    affixes: [...getAffixes(item), affix],
    statBonuses: {
      ...item.statBonuses,
      [affix.statKey]: currentValue + affix.value
    }
  };
};

export const canApplyOrb = (item: InventoryItem, orbId: CraftingOrbId): CraftingFailure | null => {
  if (item.rarity === "Unique") {
    return { ok: false, error: "cannot_craft_unique", message: "Unique items cannot be crafted." };
  }

  switch (orbId) {
    case "orbOfAwakening":
      if (item.rarity !== "Normal") {
        return { ok: false, error: "wrong_rarity", message: "Orb of Awakening requires a Normal item." };
      }
      return null;

    case "orbOfBinding": {
      if (item.rarity !== "Magic") {
        return { ok: false, error: "wrong_rarity", message: "Orb of Binding requires a Magic item." };
      }
      const { maxPrefixes, maxSuffixes } = getMaxAffixCounts(item);
      if (getPrefixCount(item) >= maxPrefixes && getSuffixCount(item) >= maxSuffixes) {
        return { ok: false, error: "item_full", message: "This item already has a prefix and a suffix." };
      }
      return null;
    }

    case "orbOfAscension": {
      if (item.rarity !== "Magic" && item.rarity !== "Rare") {
        return { ok: false, error: "wrong_rarity", message: "Orb of Ascension requires a Magic or Rare item." };
      }
      if (item.rarity === "Rare") {
        const total = getPrefixCount(item) + getSuffixCount(item);
        if (total >= 6) {
          return { ok: false, error: "item_full", message: "This Rare item is full (6/6 affixes)." };
        }
      }
      return null;
    }

    case "orbOfUnmaking":
      if (item.rarity === "Normal") {
        return { ok: false, error: "wrong_rarity", message: "Orb of Unmaking requires a Magic or Rare item." };
      }
      if (getPrefixCount(item) === 0) {
        return { ok: false, error: "no_prefix", message: "This item has no prefix to remove." };
      }
      return null;

    case "orbOfUnraveling":
      if (item.rarity === "Normal") {
        return { ok: false, error: "wrong_rarity", message: "Orb of Unraveling requires a Magic or Rare item." };
      }
      if (getSuffixCount(item) === 0) {
        return { ok: false, error: "no_suffix", message: "This item has no suffix to remove." };
      }
      return null;
  }
};

export const applyOrb = (item: InventoryItem, orbId: CraftingOrbId): CraftingResult | CraftingFailure => {
  const cannotApply = canApplyOrb(item, orbId);
  if (cannotApply) return cannotApply;

  switch (orbId) {
    case "orbOfAwakening": {
      let next: InventoryItem = { ...item, rarity: "Magic", affixes: [] };
      const affix = rollOneAffix(next);
      if (!affix) return { ok: false, error: "no_valid_slot", message: "No valid affixes available for this item." };
      next = applyAffixToItem(next, affix);
      return { ok: true, item: next };
    }

    case "orbOfBinding": {
      const affix = rollOneAffix(item);
      if (!affix) return { ok: false, error: "no_valid_slot", message: "No valid affixes available for this item." };
      return { ok: true, item: applyAffixToItem(item, affix) };
    }

    case "orbOfAscension": {
      let next: InventoryItem = item.rarity === "Magic" ? { ...item, rarity: "Rare" } : { ...item };
      const affix = rollOneAffix(next);
      if (!affix) return { ok: false, error: "no_valid_slot", message: "No valid affixes available for this item." };
      next = applyAffixToItem(next, affix);
      return { ok: true, item: next };
    }

    case "orbOfUnmaking": {
      const prefixes = getAffixes(item).filter((a) => a.kind === "Prefix");
      const toRemove = prefixes[Math.floor(Math.random() * prefixes.length)];
      const nextAffixes = getAffixes(item).filter((a) => a !== toRemove);
      const currentValue = (item.statBonuses as Record<string, number>)[toRemove.statKey] ?? 0;
      const newValue = currentValue - toRemove.value;
      const nextBonuses = { ...item.statBonuses };
      if (newValue <= 0) {
        delete (nextBonuses as Record<string, number>)[toRemove.statKey];
      } else {
        (nextBonuses as Record<string, number>)[toRemove.statKey] = newValue;
      }
      return { ok: true, item: { ...item, affixes: nextAffixes, statBonuses: nextBonuses } };
    }

    case "orbOfUnraveling": {
      const suffixes = getAffixes(item).filter((a) => a.kind === "Suffix");
      const toRemove = suffixes[Math.floor(Math.random() * suffixes.length)];
      const nextAffixes = getAffixes(item).filter((a) => a !== toRemove);
      const currentValue = (item.statBonuses as Record<string, number>)[toRemove.statKey] ?? 0;
      const newValue = currentValue - toRemove.value;
      const nextBonuses = { ...item.statBonuses };
      if (newValue <= 0) {
        delete (nextBonuses as Record<string, number>)[toRemove.statKey];
      } else {
        (nextBonuses as Record<string, number>)[toRemove.statKey] = newValue;
      }
      return { ok: true, item: { ...item, affixes: nextAffixes, statBonuses: nextBonuses } };
    }
  }
};
