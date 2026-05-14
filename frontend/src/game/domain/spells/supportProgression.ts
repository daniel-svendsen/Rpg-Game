import { balanceConfig } from "../../config/balanceConfig";
import { supportSpellConfig } from "../../config/spellConfig";
import type { CharacterRecord, SupportProgressState } from "../../../shared/types/saveTypes";

const clampSupportLevel = (level: number): number =>
  Math.max(1, Math.min(balanceConfig.supportProgression.maxLevel, Math.floor(level)));

export const createInitialSupportProgress = (
  supportSpellIds: readonly string[]
): SupportProgressState[] =>
  supportSpellIds.map((supportSpellId) => ({
    supportSpellId,
    level: 1
  }));

export const normalizeSupportProgress = (
  supportProgress: SupportProgressState[] | undefined,
  unlockedSupportSpellIds: string[]
): SupportProgressState[] => {
  const progressMap = new Map<string, SupportProgressState>();

  (supportProgress ?? []).forEach((entry) => {
    progressMap.set(entry.supportSpellId, {
      supportSpellId: entry.supportSpellId,
      level: clampSupportLevel(entry.level)
    });
  });

  unlockedSupportSpellIds.forEach((supportSpellId) => {
    if (!progressMap.has(supportSpellId)) {
      progressMap.set(supportSpellId, { supportSpellId, level: 1 });
    }
  });

  return [...progressMap.values()].filter((entry) => supportSpellConfig[entry.supportSpellId]);
};

export const getSupportLevel = (character: CharacterRecord, supportSpellId: string): number =>
  character.supportProgress?.find((entry) => entry.supportSpellId === supportSpellId)?.level ?? 1;

export const getSupportUpgradeGoldCost = (level: number): number =>
  Math.round(
    balanceConfig.supportProgression.baseUpgradeGoldCost *
      balanceConfig.supportProgression.upgradeGoldGrowthFactor ** (level - 1)
  );

export const getSupportUpgradeShardCost = (level: number): number => {
  if (level < balanceConfig.supportProgression.shardUpgradeStartLevel) {
    return 0;
  }

  return 1 + Math.floor(
    (level - balanceConfig.supportProgression.shardUpgradeStartLevel) /
      balanceConfig.supportProgression.shardUpgradeInterval
  );
};

export const getSupportUpgradeTierRequirement = (level: number): number =>
  Math.min(balanceConfig.mapTierScaling.maxTier, Math.ceil(level / 2));

export const getSupportUpgradeGemcuttersPrismCost = (_level: number): number => 1;

export const getSupportEffectMultiplier = (level: number): number =>
  1 + (clampSupportLevel(level) - 1) * balanceConfig.supportProgression.effectScalingPerLevel;

export const canUpgradeSupport = (character: CharacterRecord, supportSpellId: string): boolean => {
  if (!character.unlockedSupportSpellIds.includes(supportSpellId) || !supportSpellConfig[supportSpellId]) {
    return false;
  }

  const currentLevel = getSupportLevel(character, supportSpellId);

  if (currentLevel >= balanceConfig.supportProgression.maxLevel) {
    return false;
  }

  const prismCost = getSupportUpgradeGemcuttersPrismCost(currentLevel);
  const prismAmount = character.currencies.find((entry) => entry.code === "gemcuttersPrism")?.amount ?? 0;

  return prismAmount >= prismCost;
};

export const upgradeSupport = (character: CharacterRecord, supportSpellId: string): CharacterRecord => {
  if (!canUpgradeSupport(character, supportSpellId)) {
    return character;
  }

  const currentLevel = getSupportLevel(character, supportSpellId);
  const prismCost = getSupportUpgradeGemcuttersPrismCost(currentLevel);
  const normalizedProgress = normalizeSupportProgress(character.supportProgress, character.unlockedSupportSpellIds);

  return {
    ...character,
    currencies: character.currencies
      .map((entry) =>
        entry.code === "gemcuttersPrism" ? { ...entry, amount: entry.amount - prismCost } : entry
      )
      .filter((entry) => entry.amount > 0),
    supportProgress: normalizedProgress.map((entry) =>
      entry.supportSpellId === supportSpellId
        ? { ...entry, level: clampSupportLevel(entry.level + 1) }
        : entry
    )
  };
};
