import { spellConfig, supportSpellConfig } from "../game/config/spellConfig";
import { getComparisonEquippedItem, getItemPowerScore } from "../game/domain/items/itemPower";
import { getItemStatEntries } from "../game/domain/items/itemStats";
import { applyEquipmentState } from "../game/domain/player/equipment";
import type { CharacterRecord, EquipmentSlot, InventoryItem } from "../shared/types/saveTypes";
import { getCharacterCombatSummary, getPercentDelta } from "./combatSummary";

type StatKey = keyof InventoryItem["statBonuses"];

const STAT_ORDER: StatKey[] = [
  "armor",
  "evasion",
  "maxHealth",
  "strength",
  "agility",
  "vitality",
  "dexterity",
  "intelligence",
  "movementSpeedBonus",
  "fireResistance",
  "coldResistance",
  "lightningResistance",
  "castSpeedMultiplier",
  "attackSpeedMultiplier",
  "critChance",
  "spellPowerMultiplier"
];

const STAT_LABELS: Record<StatKey, string> = {
  armor: "Armor",
  evasion: "Evasion",
  maxHealth: "Max Health",
  strength: "Strength",
  agility: "Agility",
  vitality: "Vitality",
  dexterity: "Dexterity",
  intelligence: "Intelligence",
  movementSpeedBonus: "Movement Speed",
  fireResistance: "Fire Resistance",
  coldResistance: "Cold Resistance",
  lightningResistance: "Lightning Resistance",
  castSpeedMultiplier: "Cast Speed",
  attackSpeedMultiplier: "Attack Speed",
  critChance: "Crit Chance",
  spellPowerMultiplier: "Spell Power"
};

const NORMALIZED_PERCENT_KEYS: StatKey[] = [
  "movementSpeedBonus",
  "fireResistance",
  "coldResistance",
  "lightningResistance",
  "critChance",
  "spellPowerMultiplier"
];

const MULTIPLIER_PERCENT_KEYS: StatKey[] = ["castSpeedMultiplier", "attackSpeedMultiplier"];
const MULTIPLIER_NEUTRAL_KEYS = new Set<StatKey>(["castSpeedMultiplier", "attackSpeedMultiplier"]);

const DAMAGE_TAG_TO_RESIST_KEY: Partial<Record<string, StatKey>> = {
  Fire: "fireResistance",
  Cold: "coldResistance",
  Lightning: "lightningResistance"
};

const SYNERGY_BY_TAG: Partial<Record<string, StatKey[]>> = {
  Critical: ["critChance"],
  CastSpeed: ["castSpeedMultiplier"],
  AttackSpeed: ["attackSpeedMultiplier"],
  SpellDamage: ["spellPowerMultiplier"],
  Fire: ["fireResistance"],
  Cold: ["coldResistance"],
  Lightning: ["lightningResistance"]
};

export interface ComparisonDelta {
  key: StatKey;
  label: string;
  candidateValue: number;
  equippedValue: number;
  delta: number;
  formattedDelta: string;
  direction: "up" | "down" | "none";
  isBeneficial: boolean;
  isSynergy: boolean;
  tier: number | null;
}

export interface ItemComparison {
  equippedItem: InventoryItem | null;
  deltas: ComparisonDelta[];
  netPowerDelta: number | null;
}

export interface ComparisonSummary {
  damagePercentDelta: number;
  survivalPercentDelta: number;
}

const formatSignedNumber = (value: number): string => (value >= 0 ? `+${value}` : `${value}`);

export const formatComparisonStatValue = (key: StatKey, value: number): string => {
  if (NORMALIZED_PERCENT_KEYS.includes(key) || MULTIPLIER_PERCENT_KEYS.includes(key)) {
    return `${Math.round(value * 100)}%`;
  }

  return `${Math.round(value)}`;
};

export const getComparisonNeutralValue = (key: StatKey): number => (MULTIPLIER_NEUTRAL_KEYS.has(key) ? 1 : 0);

export const formatMissingComparedStatValue = (key: StatKey): string =>
  NORMALIZED_PERCENT_KEYS.includes(key) || MULTIPLIER_PERCENT_KEYS.includes(key) ? "0%" : "0";

const formatStatDelta = (key: StatKey, delta: number): string => {
  if (NORMALIZED_PERCENT_KEYS.includes(key) || MULTIPLIER_PERCENT_KEYS.includes(key)) {
    return `${formatSignedNumber(Math.round(delta * 100))}%`;
  }

  return formatSignedNumber(Math.round(delta));
};

const getDirection = (delta: number): "up" | "down" | "none" => {
  if (delta > 0) {
    return "up";
  }

  if (delta < 0) {
    return "down";
  }

  return "none";
};

const getActiveSynergyKeys = (character: CharacterRecord): Set<StatKey> => {
  const loadout = character.spellLoadout[0];
  if (!loadout?.mainSpellId) {
    return new Set();
  }

  const keys = new Set<StatKey>();
  const mainTags = spellConfig[loadout.mainSpellId]?.tags ?? [];
  const supportTags = loadout.supportSpellIds.flatMap((id) => supportSpellConfig[id]?.tags ?? []);
  const allTags = new Set([...mainTags, ...supportTags]);

  allTags.forEach((tag) => {
    (SYNERGY_BY_TAG[tag] ?? []).forEach((key) => keys.add(key));
    const resistKey = DAMAGE_TAG_TO_RESIST_KEY[tag];
    if (resistKey) {
      keys.add(resistKey);
    }
  });

  return keys;
};

const getTierByStatKey = (item: InventoryItem): Partial<Record<StatKey, number | null>> => {
  const tierByKey: Partial<Record<StatKey, number | null>> = {};
  const entries = getItemStatEntries(item);

  entries.forEach((entry) => {
    const match = (Object.keys(STAT_LABELS) as StatKey[]).find((key) => STAT_LABELS[key] === entry.label);
    if (match) {
      tierByKey[match] = entry.tier;
    }
  });

  return tierByKey;
};

const getComparisonValue = (item: InventoryItem, key: StatKey): number => {
  const value = item.statBonuses[key];
  if (value !== undefined) {
    return Number(value);
  }

  return getComparisonNeutralValue(key);
};

export const buildItemComparison = (
  candidateItem: InventoryItem,
  character: CharacterRecord,
  equippedOverride?: InventoryItem | null
): ItemComparison => {
  const equippedItem =
    typeof equippedOverride === "undefined" ? getComparisonEquippedItem(character, candidateItem) : equippedOverride;

  if (!equippedItem) {
    return {
      equippedItem: null,
      deltas: [],
      netPowerDelta: null
    };
  }

  const activeSynergyKeys = getActiveSynergyKeys(character);
  const tierByKey = getTierByStatKey(candidateItem);

  const deltas: ComparisonDelta[] = STAT_ORDER.map((key) => {
    const candidateValue = getComparisonValue(candidateItem, key);
    const equippedValue = getComparisonValue(equippedItem, key);
    const delta = candidateValue - equippedValue;

    return {
      key,
      label: STAT_LABELS[key],
      candidateValue,
      equippedValue,
      delta,
      formattedDelta: formatStatDelta(key, delta),
      direction: getDirection(delta),
      isBeneficial: delta >= 0,
      isSynergy: activeSynergyKeys.has(key),
      tier: tierByKey[key] ?? null
    };
  }).filter((entry) => entry.candidateValue !== 0 || entry.equippedValue !== 0);

  return {
    equippedItem,
    deltas,
    netPowerDelta: getItemPowerScore(candidateItem) - getItemPowerScore(equippedItem)
  };
};

const findEquippedSlotForItem = (
  character: CharacterRecord,
  item: InventoryItem
): EquipmentSlot | null => {
  const matchingSlot = (Object.entries(character.equippedItems) as Array<[EquipmentSlot, InventoryItem | undefined]>).find(
    ([, equipped]) => equipped?.id === item.id
  );

  return matchingSlot ? matchingSlot[0] : null;
};

const buildPreviewCharacter = (
  character: CharacterRecord,
  candidateItem: InventoryItem,
  equippedItem: InventoryItem
): CharacterRecord | null => {
  let targetSlot: EquipmentSlot | null = null;

  if (candidateItem.slot === "Ring") {
    targetSlot = findEquippedSlotForItem(character, equippedItem) ?? "Ring1";
  } else if (candidateItem.slot) {
    targetSlot = candidateItem.slot;
  }

  if (!targetSlot) {
    return null;
  }

  return applyEquipmentState({
    ...character,
    equippedItems: {
      ...character.equippedItems,
      [targetSlot]: candidateItem
    }
  });
};

export const summarizeComparison = (
  character: CharacterRecord | null,
  candidateItem: InventoryItem,
  equippedOverride?: InventoryItem | null
): ComparisonSummary | null => {
  if (!character) {
    return null;
  }

  const equippedItem =
    typeof equippedOverride === "undefined" ? getComparisonEquippedItem(character, candidateItem) : equippedOverride;

  if (!equippedItem) {
    return null;
  }

  const baseline = getCharacterCombatSummary(character);
  const previewCharacter = buildPreviewCharacter(character, candidateItem, equippedItem);
  if (!previewCharacter) {
    return null;
  }
  const preview = getCharacterCombatSummary(previewCharacter);

  return {
    damagePercentDelta: Math.round(getPercentDelta(baseline.totalDamage, preview.totalDamage)),
    survivalPercentDelta: Math.round(getPercentDelta(baseline.totalSurvival, preview.totalSurvival))
  };
};
