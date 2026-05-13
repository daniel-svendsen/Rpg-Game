import { describe, expect, it } from "vitest";
import { createTestCharacter } from "../test/createTestCharacter";
import { getCharacterCombatSummary, getPercentDelta } from "./combatSummary";

describe("combatSummary", () => {
  it("produces positive baseline totals", () => {
    const character = createTestCharacter();
    const summary = getCharacterCombatSummary(character);

    expect(summary.totalDamage).toBeGreaterThan(0);
    expect(summary.totalSurvival).toBeGreaterThan(0);
  });

  it("computes relative percent deltas", () => {
    expect(Math.round(getPercentDelta(100, 120))).toBe(20);
    expect(Math.round(getPercentDelta(100, 85))).toBe(-15);
  });
});
