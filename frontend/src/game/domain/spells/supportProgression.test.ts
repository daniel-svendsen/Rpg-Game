import { describe, expect, it } from "vitest";
import { balanceConfig } from "../../config/balanceConfig";
import {
  canUpgradeSupport,
  getSupportEffectMultiplier,
  getSupportLevel,
  getSupportUpgradeGemcuttersPrismCost,
  getSupportUpgradeGoldCost,
  getSupportUpgradeShardCost,
  getSupportUpgradeTierRequirement,
  normalizeSupportProgress,
  upgradeSupport
} from "./supportProgression";
import { createTestCharacter } from "../../../test/createTestCharacter";

describe("supportProgression", () => {
  it("normalizes support levels, adds missing unlocked supports, and ignores unknown supports", () => {
    const normalized = normalizeSupportProgress(
      [
        { supportSpellId: "fasterCasting", level: 999 },
        { supportSpellId: "unknownSupport", level: 3 }
      ],
      ["fasterCasting", "swiftnessAura"]
    );

    expect(normalized).toEqual(
      expect.arrayContaining([
        { supportSpellId: "fasterCasting", level: balanceConfig.supportProgression.maxLevel },
        { supportSpellId: "swiftnessAura", level: 1 }
      ])
    );
    expect(normalized.some((entry) => entry.supportSpellId === "unknownSupport")).toBe(false);
  });

  it("uses the support cost, shard, tier, and effect scaling formulas", () => {
    expect(getSupportUpgradeGemcuttersPrismCost(1)).toBe(1);
    expect(getSupportUpgradeGoldCost(1)).toBe(20);
    expect(getSupportUpgradeGoldCost(10)).toBe(
      Math.round(
        balanceConfig.supportProgression.baseUpgradeGoldCost *
          balanceConfig.supportProgression.upgradeGoldGrowthFactor ** 9
      )
    );
    expect(getSupportUpgradeShardCost(5)).toBe(0);
    expect(getSupportUpgradeShardCost(6)).toBe(1);
    expect(getSupportUpgradeShardCost(10)).toBe(2);
    expect(getSupportUpgradeTierRequirement(20)).toBe(10);
    expect(getSupportEffectMultiplier(20)).toBeCloseTo(2.14);
  });

  it("upgrades eligible supports and spends one Gemcutter's Prism", () => {
    const currentLevel = balanceConfig.supportProgression.shardUpgradeStartLevel;
    const character = createTestCharacter({
      gold: 0,
      currencies: [{ code: "gemcuttersPrism", amount: 1 }],
      unlockedSupportSpellIds: ["fasterCasting"],
      supportProgress: [{ supportSpellId: "fasterCasting", level: currentLevel }],
      mapProgress: {
        highestUnlockedTier: 1,
        lastCompletedTier: 0,
        consumableMaps: []
      }
    });

    expect(canUpgradeSupport(character, "fasterCasting")).toBe(true);

    const nextCharacter = upgradeSupport(character, "fasterCasting");

    expect(getSupportLevel(nextCharacter, "fasterCasting")).toBe(currentLevel + 1);
    expect(nextCharacter.gold).toBe(0);
    expect(nextCharacter.currencies).toEqual([]);
  });
});
