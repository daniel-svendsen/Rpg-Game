import { summarizeComparison } from "./itemComparison";

type Summary = ReturnType<typeof summarizeComparison>;

export const getDeltaChipClass = (
  value: number
): "delta-chip--positive" | "delta-chip--negative" | "delta-chip--neutral" => {
  if (value > 0) {
    return "delta-chip--positive";
  }
  if (value < 0) {
    return "delta-chip--negative";
  }
  return "delta-chip--neutral";
};

export const formatSignedPercent = (value: number): string => `${value > 0 ? "+" : ""}${value}%`;

export const toChipModel = (
  summary: Summary | null
): null | {
  damageClass: string;
  damageText: string;
  survivalClass: string;
  survivalText: string;
} => {
  if (!summary) {
    return null;
  }

  return {
    damageClass: getDeltaChipClass(summary.damagePercentDelta),
    damageText: formatSignedPercent(summary.damagePercentDelta),
    survivalClass: getDeltaChipClass(summary.survivalPercentDelta),
    survivalText: formatSignedPercent(summary.survivalPercentDelta)
  };
};
