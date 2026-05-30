import { describe, expect, it } from "vitest";
import { balanceConfig } from "../../config/balanceConfig";
import {
  canUpgradeSpell,
  getSpellLevel,
  getSpellUpgradeGemcuttersPrismCost,
  getSpellUpgradeGoldCost,
  getSpellUpgradeShardCost,
  getSpellUpgradeTierRequirement,
  normalizeSpellProgress,
  upgradeSpell
} from "./spellProgression";
import { createTestCharacter } from "../../../test/createTestCharacter";

describe("spellProgression", () => {
  it("normalizes legacy ids, clamps levels, adds missing unlocked spells, and ignores unknown spells", () => {
    const normalized = normalizeSpellProgress(
      [
        { spellId: "arcBolt", level: 999 },
        { spellId: "unknownSpell", level: 3 }
      ],
      ["arcBolt", "emberBurst"]
    );

    expect(normalized).toEqual(
      expect.arrayContaining([
        { spellId: "stormChain", level: balanceConfig.spellProgression.maxLevel },
        { spellId: "emberBurst", level: 1 }
      ])
    );
    expect(normalized.some((entry) => entry.spellId === "unknownSpell")).toBe(false);
  });

  it("upgrades eligible spells and spends gold and shards", () => {
    const currentLevel = balanceConfig.spellProgression.shardUpgradeStartLevel;
    const goldCost = getSpellUpgradeGoldCost(currentLevel);
    const shardCost = getSpellUpgradeShardCost(currentLevel);
    const prismCost = getSpellUpgradeGemcuttersPrismCost(currentLevel);
    const nextLevelRequirement = getSpellUpgradeTierRequirement(currentLevel + 1);
    const character = createTestCharacter({
      gold: goldCost,
      currencies: [
        { code: "mapShard", amount: shardCost },
        { code: "gemcuttersPrism", amount: prismCost }
      ],
      mapProgress: {
        highestUnlockedTier: nextLevelRequirement,
        lastCompletedTier: nextLevelRequirement,
        consumableMaps: []
      },
      spellProgress: [
        { spellId: "stormChain", level: currentLevel },
        { spellId: "emberBurst", level: 1 }
      ]
    });

    expect(canUpgradeSpell(character, "stormChain")).toBe(true);

    const nextCharacter = upgradeSpell(character, "stormChain");

    expect(getSpellLevel(nextCharacter, "stormChain")).toBe(currentLevel + 1);
    expect(nextCharacter.gold).toBe(0);
    expect(nextCharacter.currencies).toEqual([]);
  });
});
