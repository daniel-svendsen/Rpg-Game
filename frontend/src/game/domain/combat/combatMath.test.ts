import { describe, expect, it, vi } from "vitest";
import { applyArmorMitigation, getArmorReductionFraction, getEvasionChance, rollEvasion } from "./combatMath";

describe("combatMath", () => {
  it("caps armor mitigation at 90%", () => {
    expect(applyArmorMitigation(100, 100_000)).toBe(10);
    expect(getArmorReductionFraction(100, 100_000)).toBe(0.9);
  });

  it("caps evasion chance at 40%", () => {
    const randomSpy = vi.spyOn(Math, "random");

    expect(getEvasionChance(100_000)).toBe(0.4);

    randomSpy.mockReturnValueOnce(0.39);
    expect(rollEvasion(100_000)).toBe(true);

    randomSpy.mockReturnValueOnce(0.41);
    expect(rollEvasion(100_000)).toBe(false);

    randomSpy.mockRestore();
  });
});
