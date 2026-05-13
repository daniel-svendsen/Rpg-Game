import { describe, expect, it } from "vitest";
import { formatSignedPercent, getDeltaChipClass, toChipModel } from "./comparisonChipUi";

describe("comparisonChipUi", () => {
  it("falls back to neutral and 0% when values are non-finite", () => {
    expect(getDeltaChipClass(Number.NaN)).toBe("delta-chip--neutral");
    expect(formatSignedPercent(Number.NaN)).toBe("0%");
  });

  it("normalizes non-finite deltas in chip model", () => {
    const model = toChipModel({
      damagePercentDelta: Number.NaN,
      survivalPercentDelta: Number.POSITIVE_INFINITY
    });

    expect(model).toEqual({
      damageClass: "delta-chip--neutral",
      damageText: "0%",
      survivalClass: "delta-chip--neutral",
      survivalText: "0%"
    });
  });
});
