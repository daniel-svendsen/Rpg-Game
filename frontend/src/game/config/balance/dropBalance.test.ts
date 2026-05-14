import { describe, expect, it } from "vitest";
import { economyBalance } from "./economyBalance";
import { mapBalance } from "./mapBalance";
import { spellDropBalance } from "./spellDropBalance";

describe("drop balance guardrails", () => {
  it("keeps early item and shard drop rates in a restrained range", () => {
    expect(mapBalance.trainingGrounds.itemDropRate).toBeLessThanOrEqual(0.08);
    expect(mapBalance.trainingGrounds.mapShardDropRate).toBeLessThanOrEqual(0.1);
    expect(mapBalance.trainingGrounds.sameTierMapDropsPerRunTarget).toBeLessThanOrEqual(1.25);
    expect(mapBalance.trainingGrounds.nextTierMapDropsPerRunTarget).toBeLessThanOrEqual(0.35);
  });

  it("caps late-tier baseline drop rates before map modifiers are applied", () => {
    expect(mapBalance.tiers[10].itemDropRate).toBeLessThanOrEqual(0.12);
    expect(mapBalance.tiers[10].mapShardDropRate).toBeLessThanOrEqual(0.14);
    expect(mapBalance.tiers[10].sameTierMapDropsPerRunTarget).toBeLessThanOrEqual(1.25);
    expect(mapBalance.tiers[10].nextTierMapDropsPerRunTarget).toBeLessThanOrEqual(0.35);
  });

  it("keeps baseline spell drop chance from becoming too common", () => {
    expect(spellDropBalance.baseDropChanceByTier[0]).toBeLessThanOrEqual(0.03);
    expect(spellDropBalance.baseDropChanceByTier[10]).toBeLessThanOrEqual(0.05);
  });

  it("keeps Gemcutter's Prism drops restrained for per-monster currency rolls", () => {
    expect(economyBalance.economy.gemcuttersPrismDropChance).toBeCloseTo(0.004);
  });
});
