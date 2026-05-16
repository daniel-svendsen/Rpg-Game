import { balanceConfig } from "../../config/balanceConfig";
import { spellConfig } from "../../config/spellConfig";
import type { CharacterRecord, SpellProgressState } from "../../../shared/types/saveTypes";
import { normalizeSpellId } from "./spellDrops";

const clampSpellLevel = (level: number): number =>
  Math.max(1, Math.min(balanceConfig.spellProgression.maxLevel, Math.floor(level)));

export const createInitialSpellProgress = (spellIds: readonly string[]): SpellProgressState[] =>
  spellIds.map((spellId) => ({
    spellId,
    level: 1
  }));

export const normalizeSpellProgress = (
  spellProgress: SpellProgressState[] | undefined,
  unlockedSpellIds: string[]
): SpellProgressState[] => {
  const normalizedEntries = (spellProgress ?? []).map((entry) => ({
    spellId: normalizeSpellId(entry.spellId),
    level: clampSpellLevel(entry.level)
  }));
  const progressMap = new Map<string, SpellProgressState>();

  normalizedEntries.forEach((entry) => {
    progressMap.set(entry.spellId, entry);
  });

  unlockedSpellIds.map(normalizeSpellId).forEach((spellId) => {
    if (!progressMap.has(spellId)) {
      progressMap.set(spellId, { spellId, level: 1 });
    }
  });

  return [...progressMap.values()].filter((entry) => spellConfig[entry.spellId]);
};

export const getSpellLevel = (character: CharacterRecord, spellId: string): number =>
  character.spellProgress.find((entry) => entry.spellId === normalizeSpellId(spellId))?.level ?? 1;

export const getSpellUpgradeGoldCost = (level: number): number =>
  balanceConfig.spellProgression.baseUpgradeGoldCost +
  (level - 1) * balanceConfig.spellProgression.upgradeGoldStep;

export const getSpellUpgradeShardCost = (level: number): number => {
  if (level < balanceConfig.spellProgression.shardUpgradeStartLevel) {
    return 0;
  }

  return 1 + Math.floor((level - balanceConfig.spellProgression.shardUpgradeStartLevel) / balanceConfig.spellProgression.shardUpgradeInterval);
};

export const getSpellUpgradeTierRequirement = (level: number): number => Math.min(balanceConfig.mapTierScaling.maxTier, level);

export const getSpellUpgradeGemcuttersPrismCost = (_level: number): number => 2;

export const canUpgradeSpell = (character: CharacterRecord, spellId: string): boolean => {
  const normalizedSpellId = normalizeSpellId(spellId);
  const currentLevel = getSpellLevel(character, normalizedSpellId);

  if (currentLevel >= balanceConfig.spellProgression.maxLevel) {
    return false;
  }

  const goldCost = getSpellUpgradeGoldCost(currentLevel);
  const shardCost = getSpellUpgradeShardCost(currentLevel);
  const prismCost = getSpellUpgradeGemcuttersPrismCost(currentLevel);
  const shardAmount = character.currencies.find((entry) => entry.code === "mapShard")?.amount ?? 0;
  const prismAmount = character.currencies.find((entry) => entry.code === "gemcuttersPrism")?.amount ?? 0;

  return (
    character.gold >= goldCost &&
    shardAmount >= shardCost &&
    prismAmount >= prismCost
  );
};

export const upgradeSpell = (character: CharacterRecord, spellId: string): CharacterRecord => {
  const normalizedSpellId = normalizeSpellId(spellId);
  const currentLevel = getSpellLevel(character, normalizedSpellId);

  if (!canUpgradeSpell(character, normalizedSpellId)) {
    return character;
  }

  const goldCost = getSpellUpgradeGoldCost(currentLevel);
  const shardCost = getSpellUpgradeShardCost(currentLevel);
  const prismCost = getSpellUpgradeGemcuttersPrismCost(currentLevel);

  return {
    ...character,
    gold: character.gold - goldCost,
    currencies: character.currencies
      .map((entry) => {
        if (entry.code === "mapShard") return { ...entry, amount: entry.amount - shardCost };
        if (entry.code === "gemcuttersPrism") return { ...entry, amount: entry.amount - prismCost };
        return entry;
      })
      .filter((entry) => entry.amount > 0),
    spellProgress: character.spellProgress.map((entry) =>
      entry.spellId === normalizedSpellId ? { ...entry, level: clampSpellLevel(entry.level + 1) } : entry
    )
  };
};
